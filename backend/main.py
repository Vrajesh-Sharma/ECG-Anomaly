from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import io
from typing import Optional

app = FastAPI(title="ECG Anomaly Detection API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def detect_anomalies_zscore(signal: np.ndarray, window: int = 50, threshold: float = 2.8) -> np.ndarray:
    """Z-score based anomaly detection with rolling window."""
    anomaly_flags = np.zeros(len(signal), dtype=bool)
    for i in range(len(signal)):
        start = max(0, i - window)
        end = min(len(signal), i + window)
        local = signal[start:end]
        mean = np.mean(local)
        std = np.std(local)
        if std > 0:
            z = abs((signal[i] - mean) / std)
            if z > threshold:
                anomaly_flags[i] = True
    return anomaly_flags


def detect_anomalies_iqr(signal: np.ndarray) -> np.ndarray:
    """IQR-based global anomaly detection."""
    q1 = np.percentile(signal, 25)
    q3 = np.percentile(signal, 75)
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    return (signal < lower) | (signal > upper)


def detect_anomalies_gradient(signal: np.ndarray, threshold_multiplier: float = 4.0) -> np.ndarray:
    """Gradient spike detection for sudden changes."""
    grad = np.abs(np.gradient(signal))
    threshold = np.mean(grad) + threshold_multiplier * np.std(grad)
    return grad > threshold


def compute_heart_rate(signal: np.ndarray, sampling_rate: float = 360.0) -> dict:
    """Estimate heart rate from R-peaks."""
    from scipy.signal import find_peaks
    peaks, _ = find_peaks(signal, distance=int(sampling_rate * 0.4), height=np.mean(signal) + 0.3 * np.std(signal))
    if len(peaks) < 2:
        return {"bpm": None, "rr_intervals": [], "peak_indices": peaks.tolist()}
    rr_intervals = np.diff(peaks) / sampling_rate * 1000  # ms
    bpm = 60000 / np.mean(rr_intervals)
    return {
        "bpm": round(float(bpm), 1),
        "rr_intervals": rr_intervals.tolist(),
        "peak_indices": peaks.tolist()
    }


@app.get("/")
def root():
    return {"message": "ECG Anomaly Detection API", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/analyze")
async def analyze_ecg(
    file: UploadFile = File(...),
    threshold: float = 2.8,
    method: str = "zscore"
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    content = await file.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    # Detect signal column
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if not numeric_cols:
        raise HTTPException(status_code=400, detail="No numeric columns found in CSV.")

    # Use first numeric column as signal, or one named 'ecg'/'signal'/'value'
    signal_col = next(
        (c for c in numeric_cols if c.lower() in ["ecg", "signal", "value", "amplitude", "mv"]),
        numeric_cols[0]
    )

    # Use second column as time if exists, else generate
    time_col = None
    if len(numeric_cols) > 1:
        time_col = next(
            (c for c in numeric_cols if c.lower() in ["time", "t", "timestamp", "sample"]),
            None
        )

    signal = df[signal_col].dropna().values
    if len(signal) < 10:
        raise HTTPException(status_code=400, detail="Signal too short (< 10 samples).")

    # Limit to 5000 points for performance
    if len(signal) > 5000:
        step = len(signal) // 5000
        signal = signal[::step]

    n = len(signal)
    time = np.arange(n).tolist()

    # Anomaly detection
    if method == "iqr":
        flags = detect_anomalies_iqr(signal)
    elif method == "gradient":
        flags = detect_anomalies_gradient(signal)
    else:
        flags = detect_anomalies_zscore(signal, threshold=threshold)

    anomaly_indices = np.where(flags)[0].tolist()

    # Stats
    stats = {
        "total_samples": int(n),
        "anomaly_count": int(np.sum(flags)),
        "anomaly_pct": round(float(np.mean(flags) * 100), 2),
        "mean": round(float(np.mean(signal)), 4),
        "std": round(float(np.std(signal)), 4),
        "min": round(float(np.min(signal)), 4),
        "max": round(float(np.max(signal)), 4),
        "signal_col": signal_col,
        "method": method,
    }

    # Heart rate estimate (try)
    try:
        from scipy.signal import find_peaks
        hr = compute_heart_rate(signal)
        stats["heart_rate_bpm"] = hr["bpm"]
        stats["r_peak_count"] = len(hr["peak_indices"])
    except Exception:
        stats["heart_rate_bpm"] = None
        stats["r_peak_count"] = None

    # Status classification
    pct = stats["anomaly_pct"]
    if pct == 0:
        status = "normal"
        status_label = "Normal Sinus Rhythm"
    elif pct < 2:
        status = "mild"
        status_label = "Mild Irregularities Detected"
    elif pct < 8:
        status = "moderate"
        status_label = "Moderate Anomalies Detected"
    else:
        status = "critical"
        status_label = "Critical — High Anomaly Rate"

    return JSONResponse({
        "signal": signal.tolist(),
        "time": time,
        "anomaly_indices": anomaly_indices,
        "stats": stats,
        "status": status,
        "status_label": status_label,
        "filename": file.filename,
    })


@app.post("/generate-sample")
def generate_sample(
    duration: int = 10,
    sampling_rate: int = 360,
    anomaly_rate: float = 0.03
):
    """Generate a synthetic ECG-like signal with injected anomalies."""
    n = duration * sampling_rate
    t = np.linspace(0, duration, n)

    # Simulate a basic ECG waveform
    signal = np.zeros(n)
    heart_rate = 75  # bpm
    period = sampling_rate * 60 / heart_rate

    for i in range(n):
        phase = (i % period) / period
        # P wave
        signal[i] += 0.1 * np.exp(-((phase - 0.15) ** 2) / (2 * 0.003))
        # QRS complex
        signal[i] += 1.0 * np.exp(-((phase - 0.3) ** 2) / (2 * 0.001))
        signal[i] -= 0.3 * np.exp(-((phase - 0.26) ** 2) / (2 * 0.001))
        signal[i] -= 0.2 * np.exp(-((phase - 0.34) ** 2) / (2 * 0.001))
        # T wave
        signal[i] += 0.3 * np.exp(-((phase - 0.55) ** 2) / (2 * 0.008))

    signal += np.random.normal(0, 0.02, n)

    # Inject anomalies
    num_anomalies = int(n * anomaly_rate)
    anomaly_positions = np.random.choice(n, num_anomalies, replace=False)
    for pos in anomaly_positions:
        signal[pos] += np.random.choice([-1, 1]) * np.random.uniform(1.5, 2.5)

    return JSONResponse({
        "signal": signal.tolist(),
        "time": t.tolist(),
        "sampling_rate": sampling_rate,
        "duration": duration,
        "injected_anomaly_count": num_anomalies,
    })