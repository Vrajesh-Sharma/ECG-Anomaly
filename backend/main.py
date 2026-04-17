# main.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers
from tensorflow.keras.models import Model
import io, json, os

app = FastAPI(title="ECG Anomaly Detection API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model Definition (must match Kaggle notebook exactly) ────────────
class AnomalyDetector(Model):
    def __init__(self):
        super(AnomalyDetector, self).__init__()
        self.encoder = tf.keras.Sequential([
            layers.Dense(32, activation="relu"),
            layers.Dense(16, activation="relu"),
            layers.Dense(8,  activation="relu")
        ])
        self.decoder = tf.keras.Sequential([
            layers.Dense(16, activation="relu"),
            layers.Dense(32, activation="relu"),
            layers.Dense(140, activation="sigmoid")
        ])

    def call(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded

# ── Paths (all files sit directly in backend/) ───────────────────────
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
WEIGHTS_PATH = os.path.join(BASE_DIR, "autoencoder.weights.h5")
META_PATH    = os.path.join(BASE_DIR, "meta.json")

if not os.path.exists(WEIGHTS_PATH):
    raise RuntimeError(f"❌ Weights not found at: {WEIGHTS_PATH}")
if not os.path.exists(META_PATH):
    raise RuntimeError(f"❌ meta.json not found at: {META_PATH}")

# ── Load meta ────────────────────────────────────────────────────────
with open(META_PATH) as f:
    meta = json.load(f)

THRESHOLD   = meta["threshold"]
MIN_VAL     = meta["min_val"]
MAX_VAL     = meta["max_val"]
WINDOW_SIZE = meta["window_size"]  # 140

# ── Load weights ─────────────────────────────────────────────────────
autoencoder = AnomalyDetector()
autoencoder(tf.zeros((1, WINDOW_SIZE)))   # build graph first
autoencoder.load_weights(WEIGHTS_PATH)
print(f"✅ Model loaded | Threshold = {THRESHOLD:.6f}")

# ── Helpers ──────────────────────────────────────────────────────────
def normalize_signal(signal: np.ndarray) -> np.ndarray:
    return (signal - MIN_VAL) / (MAX_VAL - MIN_VAL)

def segment_signal(signal: np.ndarray):
    segments, starts = [], []
    for s in range(0, len(signal) - WINDOW_SIZE + 1, WINDOW_SIZE):
        segments.append(signal[s : s + WINDOW_SIZE])
        starts.append(s)
    return np.array(segments, dtype=np.float32), starts

def compute_heart_rate(signal: np.ndarray, fs: float = 360.0):
    try:
        from scipy.signal import find_peaks
        peaks, _ = find_peaks(
            signal,
            distance=int(fs * 0.4),
            height=float(np.mean(signal) + 0.3 * np.std(signal))
        )
        if len(peaks) < 2:
            return None, None
        bpm = round(float(60000 / np.mean(np.diff(peaks) / fs * 1000)), 1)
        return bpm, int(len(peaks))
    except Exception:
        return None, None

# ── Routes ───────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "ECG Autoencoder API", "status": "running"}

@app.get("/health")
def health():
    return {
        "status":    "healthy",
        "threshold": round(THRESHOLD, 6),
        "window":    WINDOW_SIZE,
        "model":     "Dense Autoencoder (ECG5000)"
    }

@app.post("/analyze")
async def analyze_ecg(
    file: UploadFile = File(...),
    threshold: float = None
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Only .csv files are supported.")

    content = await file.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode("utf-8")))
    except Exception as e:
        raise HTTPException(400, f"Failed to parse CSV: {e}")

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if not numeric_cols:
        raise HTTPException(400, "No numeric columns found in CSV.")

    PREFERRED  = ["ecg", "signal", "amplitude", "mv", "value"]
    signal_col = next(
        (c for c in numeric_cols if c.lower() in PREFERRED),
        numeric_cols[0]
    )

    signal = df[signal_col].dropna().values.astype(np.float64)
    if len(signal) < WINDOW_SIZE:
        raise HTTPException(400, f"Signal too short — need ≥{WINDOW_SIZE} samples.")

    # Normalize + segment
    norm_signal          = normalize_signal(signal).astype(np.float32)
    segments, seg_starts = segment_signal(norm_signal)

    # Reconstruct via autoencoder
    thr    = threshold if threshold is not None else THRESHOLD
    recons = autoencoder(tf.cast(segments, tf.float32)).numpy()
    losses = np.mean(np.abs(recons - segments), axis=1)
    is_anom = losses > thr

    # Map anomalous windows → peak-error sample index
    anomaly_indices = []
    for i, (start, anom) in enumerate(zip(seg_starts, is_anom)):
        if anom:
            peak = int(np.argmax(np.abs(recons[i] - segments[i])))
            anomaly_indices.append(start + peak)

    # Downsample display signal to ≤5000 pts
    display_signal = signal
    if len(signal) > 5000:
        display_signal = signal[:: len(signal) // 5000]

    bpm, r_peaks     = compute_heart_rate(signal)
    num_windows      = len(seg_starts)
    anom_windows     = int(np.sum(is_anom))
    pct              = round(anom_windows / max(num_windows, 1) * 100, 2)

    if pct == 0:       status, label = "normal",   "Normal Sinus Rhythm"
    elif pct < 15:     status, label = "mild",     "Mild Irregularities Detected"
    elif pct < 40:     status, label = "moderate", "Moderate Anomalies Detected"
    else:              status, label = "critical", "Critical — High Anomaly Rate"

    return JSONResponse({
        "signal":          display_signal.tolist(),
        "time":            list(range(len(display_signal))),
        "anomaly_indices": anomaly_indices,
        "stats": {
            "total_samples":    int(len(signal)),
            "anomaly_count":    len(anomaly_indices),
            "anomaly_pct":      pct,
            "mean":             round(float(np.mean(signal)), 4),
            "std":              round(float(np.std(signal)),  4),
            "min":              round(float(np.min(signal)),  4),
            "max":              round(float(np.max(signal)),  4),
            "signal_col":       signal_col,
            "method":           "Dense Autoencoder",
            "heart_rate_bpm":   bpm,
            "r_peak_count":     r_peaks,
            "threshold_used":   round(thr, 6),
            "windows_analyzed": num_windows,
            "anomaly_windows":  anom_windows,
            "window_size":      WINDOW_SIZE,
        },
        "status":       status,
        "status_label": label,
        "filename":     file.filename,
    })

@app.post("/generate-sample")
def generate_sample(
    duration: int       = 10,
    sampling_rate: int  = 360,
    anomaly_rate: float = 0.025
):
    n      = duration * sampling_rate
    t      = np.linspace(0, duration, n)
    signal = np.zeros(n)
    period = sampling_rate * 60 / 75

    for i in range(n):
        phase = (i % period) / period
        signal[i] += 1.0 * np.exp(-((phase - 0.30)**2) / 0.002)
        signal[i] -= 0.3 * np.exp(-((phase - 0.26)**2) / 0.002)
        signal[i] -= 0.2 * np.exp(-((phase - 0.34)**2) / 0.002)
        signal[i] += 0.3 * np.exp(-((phase - 0.55)**2) / 0.016)

    signal += np.random.normal(0, 0.02, n)
    for pos in np.random.choice(n, int(n * anomaly_rate), replace=False):
        signal[pos] += np.random.choice([-1, 1]) * np.random.uniform(1.5, 2.5)

    return JSONResponse({
        "signal":   signal.tolist(),
        "time":     t.tolist(),
        "duration": duration,
        "sampling_rate": sampling_rate,
    })