<div align="center">

# 🫀 CardioScan — ECG Anomaly Detection

**A medical-grade ECG anomaly detection platform powered by a Dense Autoencoder trained on the ECG5000 dataset.**  
Upload any ECG CSV file and get instant, AI-driven detection of cardiac anomalies — visualized in a stunning real-time dashboard.

[![FastAPI](https://img.shields.io/badge/FastAPI-2.0-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-FF6F00?style=flat-square&logo=tensorflow)](https://tensorflow.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-00d4aa?style=flat-square)](LICENSE)

[**Live Demo**](#) · [**API Docs**](http://localhost:8000/docs) · [**Report Bug**](../../issues) · [**Request Feature**](../../issues)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **Dense Autoencoder** | Trained on ECG5000 with 94.4% accuracy, 99.2% precision, 90.7% recall |
| 📊 **Real-time Visualization** | Interactive Recharts ECG waveform with glowing anomaly markers |
| 🎯 **Window-based Detection** | Segments ECG into 140-point windows, reconstructs & flags via MAE threshold |
| 💓 **Heart Rate Estimation** | Detects R-peaks via scipy and computes live BPM with animated heartbeat |
| 📥 **CSV Upload & Download** | Drag-drop upload + annotated CSV export (`index, amplitude, is_anomaly`) |
| 🌗 **Dark / Light Theme** | Smooth theme toggle with full CSS variable system |
| ⚙️ **Model Info Panel** | Live threshold from `/health`, architecture details, training metrics |
| 📱 **Fully Responsive** | Mobile-first layouts, 2→3→6 column stats grid |
| 🧪 **Synthetic Samples** | One-click synthetic ECG generation with configurable anomaly rate |

---

## 🏗️ Architecture

```
ECG-Anomaly/
├── backend/
│   ├── main.py                    # FastAPI app — /health, /analyze, /generate-sample
│   ├── autoencoder.weights.h5     # Trained Dense Autoencoder weights (165 KB)
│   ├── meta.json                  # Threshold, normalization bounds, window size
│   ├── ecg-anomaly-detection.ipynb  # Training notebook (ECG5000, TensorFlow)
│   └── requirements.txt
│
└── frontend/
    ├── index.html                 # Google Fonts, SEO meta
    ├── vite.config.js             # Vite + /api proxy to :8000
    └── src/
        ├── App.jsx                # Root: state, API calls, dashboard assembly
        ├── App.css                # Layout, header, upload, dashboard styles
        ├── index.css              # CSS design tokens, keyframes, global reset
        └── components/
            ├── ECGChart.jsx       # Recharts ComposedChart — line + anomaly dots + brush
            ├── StatsGrid.jsx      # 6 animated KPI cards (count-up rAF)
            ├── StatusBadge.jsx    # 4-state glowing pill (Normal/Mild/Moderate/Critical)
            ├── UploadZone.jsx     # Drag-drop zone with teal scanline animation
            ├── SettingsPanel.jsx  # Slide-in Model Info drawer
            └── components.css     # All component-level styles
```

---

## 🤖 Model Details

The detection engine is a **Dense Autoencoder** built with TensorFlow/Keras and trained on the [ECG5000 dataset](http://timeseriesclassification.com/description.php?Dataset=ECG5000).

### Architecture

```
Input  (140,)
  │
  ▼  Encoder
Dense(32, relu)  →  Dense(16, relu)  →  Dense(8, relu)
  │
  ▼  Decoder
Dense(16, relu)  →  Dense(32, relu)  →  Dense(140, sigmoid)
  │
Output (140,)
```

### Detection Pipeline

```
Raw ECG CSV
    │
    ▼
Normalize  →  (x - min_val) / (max_val - min_val)
    │
    ▼
Segment into 140-point windows (non-overlapping)
    │
    ▼
Autoencoder reconstruct each window
    │
    ▼
Compute MAE per window
    │
    ▼
Flag windows where MAE > 0.020763  (mean + 1σ of normal training loss)
    │
    ▼
Map flagged window → peak-error sample index
```

### Performance

| Metric | Value |
|---|---|
| Accuracy | **94.4%** |
| Precision | **99.2%** |
| Recall | **90.7%** |
| Optimizer | Adam |
| Loss Function | MAE (Mean Absolute Error) |
| Anomaly Threshold | `0.020763` |
| Training Dataset | ECG5000 (TensorFlow) |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm / yarn

### 1. Clone the Repository

```bash
git clone https://github.com/Vrajesh-Sharma/ECG-Anomaly.git
cd ECG-Anomaly
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload --port 8000
```

> The API will be available at `http://localhost:8000`  
> Swagger UI: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

> The dashboard will be available at `http://localhost:5173` (or `5174`)

---

## 🔌 API Reference

All endpoints are proxied through Vite's `/api` prefix in development.

### `GET /health`

Returns API status and model configuration.

```json
{
  "status": "healthy",
  "threshold": 0.020763,
  "window": 140,
  "model": "Dense Autoencoder (ECG5000)"
}
```

### `POST /analyze`

Analyzes an uploaded ECG CSV file.

**Request:** `multipart/form-data` with field `file` (`.csv`)

**Response:**

```json
{
  "signal": [0.12, 0.34, ...],
  "time": [0, 1, 2, ...],
  "anomaly_indices": [62, 98, 175, ...],
  "stats": {
    "total_samples": 3600,
    "anomaly_count": 25,
    "anomaly_pct": 0.69,
    "mean": 0.1858,
    "std": 0.3677,
    "min": -2.5012,
    "max": 3.8841,
    "signal_col": "ecg",
    "method": "Dense Autoencoder",
    "heart_rate_bpm": 99.7,
    "r_peak_count": 17,
    "threshold_used": 0.020763,
    "windows_analyzed": 25,
    "anomaly_windows": 25,
    "window_size": 140
  },
  "status": "mild",
  "status_label": "Mild Irregularities Detected",
  "filename": "my_ecg.csv"
}
```

**Supported CSV column names** (auto-detected):  
`ecg`, `signal`, `amplitude`, `mv`, `value` — or any first numeric column.

### `POST /generate-sample`

Generates a synthetic ECG with injected anomalies.

**Query params:** `duration=10`, `anomaly_rate=0.025`

---

## 📦 Dependencies

### Backend

| Package | Purpose |
|---|---|
| `fastapi` | REST API framework |
| `uvicorn` | ASGI server |
| `tensorflow` | Autoencoder model |
| `pandas` | CSV parsing |
| `numpy` | Signal processing |
| `scipy` | R-peak detection (heart rate) |

### Frontend

| Package | Purpose |
|---|---|
| `react` + `react-dom` | UI framework |
| `recharts` | ECG waveform visualization |
| `axios` | API communication |
| `lucide-react` | Icon system |
| `vite` | Build tool + dev server |

---

## 📋 CSV Format

Your CSV can contain any of these column names and they will be auto-detected:

```csv
time,ecg
0.000,0.1234
0.003,0.1456
...
```

Or simpler:

```csv
amplitude
0.1234
0.1456
...
```

**Minimum samples required:** 140 (one window)

---

## 🎨 Design System

The dashboard uses a custom CSS variable design system with full dark/light mode support.

| Token | Dark | Light | Usage |
|---|---|---|---|
| `--bg` | `#0d0f14` | `#f0f4f8` | Page background |
| `--surface` | `#131720` | `#ffffff` | Cards, panels |
| `--accent` | `#00d4aa` | `#00d4aa` | ECG line, primary actions |
| `--danger` | `#ff4757` | `#ff4757` | Anomalies, critical alerts |
| `--warning` | `#ffa502` | `#ffa502` | Moderate states |
| `--text` | `#e8edf5` | `#1a202c` | Primary text |

Fonts: **Outfit** (headings) + **JetBrains Mono** (data values)

---

## 🧪 Development

```bash
# Backend with auto-reload
uvicorn main:app --reload

# Frontend with HMR
npm run dev

# Build frontend for production
npm run build
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Built with ❤️ for the **ACM VibeCode Hackathon**

**CardioScan** · ECG Anomaly Detection · TensorFlow + FastAPI + React

</div>
