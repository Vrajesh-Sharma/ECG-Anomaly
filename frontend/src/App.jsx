import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Settings,
  Download,
  Sun,
  Moon,
  Activity,
  AlertTriangle,
  RefreshCw,
  Upload,
  XCircle,
  CheckCircle,
  Zap,
} from 'lucide-react';

import './App.css';
import UploadZone from './components/UploadZone';
import StatsGrid from './components/StatsGrid';
import ECGChart from './components/ECGChart';
import StatusBadge from './components/StatusBadge';
import SettingsPanel from './components/SettingsPanel';

/* ── ECG Loading Animation SVG ── */
const ECGLoadingAnimation = () => (
  <svg
    viewBox="0 0 300 80"
    width={300}
    height={80}
    style={{ filter: 'drop-shadow(0 0 6px #00d4aa)' }}
    aria-hidden="true"
  >
    <polyline
      points="0,40 30,40 40,20 50,60 60,10 70,70 80,40 120,40 140,25 160,55 180,40 230,40 240,30 260,50 280,40 300,40"
      fill="none"
      stroke="#00d4aa"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="600"
      style={{ animation: 'draw-ecg 1.8s linear infinite' }}
    />
  </svg>
);

/* ── Logo SVG ── */
const LogoECG = () => (
  <svg viewBox="0 0 32 32" width={18} height={18} fill="none">
    <polyline
      points="2,16 8,16 11,8 14,24 17,4 20,28 23,16 30,16"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ── Severity helper for anomaly table ── */
function getSeverity(deviation) {
  const abs = Math.abs(deviation);
  if (abs > 4) return { label: 'CRITICAL', cls: 'severity-critical' };
  if (abs > 3) return { label: 'HIGH', cls: 'severity-high' };
  return { label: 'MODERATE', cls: 'severity-moderate' };
}

/* ── Build CSV Blob for download ── */
function buildDownloadCsv(signal, anomalyIndices) {
  const set = new Set(anomalyIndices);
  const rows = ['index,amplitude,is_anomaly'];
  signal.forEach((v, i) => {
    rows.push(`${i},${v},${set.has(i) ? 1 : 0}`);
  });
  return new Blob([rows.join('\n')], { type: 'text/csv' });
}

export default function App() {
  /* ── State ── */
  const [theme, setTheme] = useState('dark');
  const [apiOnline, setApiOnline] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [method, setMethod] = useState('zscore');
  const [threshold, setThreshold] = useState(2.8);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  /* ── Apply theme ── */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  /* ── Health check ── */
  useEffect(() => {
    axios
      .get('/api/health')
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));
  }, []);

  /* ── Analyze via API ── */
  const analyze = useCallback(
    async (file) => {
      setError(null);
      setLoading(true);
      setResults(null);
      fileRef.current = file;

      try {
        const form = new FormData();
        form.append('file', file);
        const { data } = await axios.post(
          `/api/analyze?threshold=${threshold}&method=${method}`,
          form,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setResults(data);
      } catch (err) {
        const msg =
          err.response?.data?.detail ||
          (err.code === 'ERR_NETWORK'
            ? 'Cannot reach the API. Ensure the backend is running on port 8000.'
            : err.message || 'An unexpected error occurred.');
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [method, threshold]
  );

  /* ── Load synthetic sample ── */
  const loadSample = useCallback(async () => {
    setError(null);
    setLoading(true);
    setResults(null);

    try {
      const { data } = await axios.post('/api/generate-sample?duration=10&anomaly_rate=0.025');
      // Build CSV blob from signal + time arrays
      const csvRows = ['time,ecg'];
      data.time.forEach((t, i) => csvRows.push(`${t},${data.signal[i]}`));
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const file = new File([blob], 'synthetic_ecg_sample.csv', { type: 'text/csv' });
      await analyze(file);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot reach the API. Ensure the backend is running on port 8000.'
          : err.message || 'An unexpected error occurred.');
      setError(msg);
      setLoading(false);
    }
  }, [analyze]);

  /* ── Download annotated CSV ── */
  const handleDownload = () => {
    if (!results) return;
    const blob = buildDownloadCsv(results.signal, results.anomaly_indices);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ecg_analysis_annotated.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Anomaly table rows ── */
  const tableRows = results
    ? results.anomaly_indices.slice(0, 50).map((idx) => {
        const value = results.signal[idx];
        const signalMean = results.stats.mean;
        const signalStd = results.stats.std;
        const deviation = signalStd > 0 ? (value - signalMean) / signalStd : 0;
        const sev = getSeverity(deviation);
        return { idx, value, deviation, sev };
      })
    : [];

  const isOnline = apiOnline === true;
  const isOffline = apiOnline === false;

  return (
    <div className="app-shell">
      {/* ═══════════════════════ HEADER ═══════════════════════ */}
      <header className="header">
        {/* Logo */}
        <div className="header-logo">
          <div className="logo-badge">
            <LogoECG />
          </div>
          <span className="logo-text">
            Cardio<span>Scan</span>
          </span>
        </div>

        {/* API Status */}
        <div className="header-center">
          <div
            className={`api-status-pill ${
              isOnline ? 'online' : isOffline ? 'offline' : ''
            }`}
            role="status"
            aria-label={isOnline ? 'API Online' : 'API Offline'}
          >
            <span
              className={`status-dot ${
                isOnline ? 'online' : isOffline ? 'offline' : ''
              }`}
            />
            <span className="api-status-text">
              {apiOnline === null ? 'Checking...' : isOnline ? 'API Online' : 'API Offline'}
            </span>
            <span className="api-status-text-mobile" aria-hidden="true">
              {isOnline ? '●' : '○'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={() => setSettingsOpen(true)}
            title="Detection Settings"
            aria-label="Open settings"
            id="settings-btn"
          >
            <Settings size={18} />
          </button>

          {results && (
            <button
              className="icon-btn"
              onClick={handleDownload}
              title="Download annotated CSV"
              aria-label="Download results"
              id="download-btn"
            >
              <Download size={18} />
            </button>
          )}

          <button
            className="icon-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle theme"
            id="theme-toggle-btn"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* ═══════════════════════ SETTINGS PANEL ═══════════════════════ */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        method={method}
        setMethod={setMethod}
        threshold={threshold}
        setThreshold={setThreshold}
      />

      {/* ═══════════════════════ MAIN ═══════════════════════ */}
      <main className="main-container">
        {/* ── Error Banner ── */}
        {error && (
          <div className="error-banner" role="alert">
            <XCircle size={18} color="var(--danger)" />
            <p>{error}</p>
            <button onClick={() => setError(null)} aria-label="Dismiss error">
              <XCircle size={16} />
            </button>
          </div>
        )}

        {/* ── IDLE / UPLOAD STATE ── */}
        {!loading && !results && (
          <section className="hero-section">
            <h1 className="hero-heading">ECG Anomaly Detection</h1>
            <p className="hero-subtitle">
              Upload a CSV file to visualize your ECG signal and automatically
              detect cardiac anomalies in real-time.
            </p>

            <div className="upload-wrapper">
              <UploadZone onFile={analyze} disabled={loading} />

              <div className="format-hint-card">
                <Activity size={14} color="var(--faint)" />
                <span>
                  CSV must contain a numeric column. Auto-detects columns named:{' '}
                  <strong style={{ color: 'var(--muted)' }}>ecg, signal, amplitude, mv, value</strong>
                </span>
              </div>
            </div>

            <div className="sample-btn-row">
              <span>No file? →</span>
              <button className="glow-text-btn" onClick={loadSample} id="load-sample-btn">
                <Zap size={13} />
                Load synthetic ECG sample
              </button>
            </div>
          </section>
        )}

        {/* ── LOADING STATE ── */}
        {loading && (
          <section className="loading-section" aria-live="polite">
            <ECGLoadingAnimation />
            <p className="loading-title">Analyzing ECG signal…</p>
            <p className="loading-sub">
              Running{' '}
              <strong style={{ color: 'var(--accent)' }}>
                {method === 'zscore'
                  ? 'Z-Score'
                  : method === 'iqr'
                  ? 'IQR'
                  : 'Gradient Spike'}
              </strong>{' '}
              anomaly detection
            </p>

            <div className="skeleton-grid">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card skeleton" />
              ))}
            </div>

            <p className="loading-hint">
              This may take a few seconds for large files
            </p>
          </section>
        )}

        {/* ── RESULTS DASHBOARD ── */}
        {results && !loading && (
          <div className="dashboard">
            {/* Top Bar */}
            <div className="dashboard-topbar">
              <div className="topbar-left">
                <Activity size={16} color="var(--accent)" />
                <span className="topbar-filename">{results.filename}</span>
                <span className="dot-sep">·</span>
                <span>{results.stats.total_samples.toLocaleString()} samples</span>
                <span className="dot-sep">·</span>
                <span>{results.stats.signal_col}</span>
              </div>
              <div className="topbar-right">
                <StatusBadge status={results.status} />
                <button
                  className="ghost-btn"
                  onClick={() => {
                    setResults(null);
                    setError(null);
                  }}
                  id="new-upload-btn"
                >
                  <Upload size={14} />
                  New Upload
                </button>
                <button
                  className="ghost-btn"
                  onClick={loadSample}
                  id="refresh-sample-btn"
                >
                  <RefreshCw size={14} />
                  Sample
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <StatsGrid stats={results.stats} status={results.status} />

            {/* ECG Waveform Chart */}
            <div
              className="section-card fade-up"
              style={{ animationDelay: '360ms' }}
            >
              <div className="section-card-header" style={{ marginBottom: 0 }}>
                <div className="section-card-title-row">
                  <Activity size={16} color="var(--accent)" />
                  <span className="section-card-title">ECG Waveform</span>
                </div>
              </div>
              <ECGChart
                signal={results.signal}
                anomalyIndices={results.anomaly_indices}
              />
            </div>

            {/* Anomaly Table / No Anomaly Card */}
            {results.anomaly_indices.length === 0 ? (
              <div className="no-anomaly-card fade-up" style={{ animationDelay: '440ms' }}>
                <div className="no-anomaly-icon">
                  <CheckCircle size={26} />
                </div>
                <p>No anomalies detected — Signal looks healthy!</p>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                  All {results.stats.total_samples.toLocaleString()} samples within normal bounds.
                </span>
              </div>
            ) : (
              <div
                className="section-card fade-up"
                style={{ animationDelay: '440ms' }}
              >
                <div className="section-card-header">
                  <div className="anomaly-section-title">
                    <AlertTriangle size={16} color="var(--danger)" />
                    <span className="section-card-title">Detected Anomalies</span>
                    <div className="anomaly-count-badge">
                      {results.anomaly_indices.length}
                    </div>
                  </div>
                </div>

                <div className="anomaly-table-wrapper">
                  <table className="anomaly-table" aria-label="Anomaly details">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Sample Index</th>
                        <th>Amplitude (mV)</th>
                        <th>Deviation (σ)</th>
                        <th>Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, i) => (
                        <tr key={row.idx}>
                          <td style={{ color: 'var(--faint)' }}>{i + 1}</td>
                          <td>{row.idx}</td>
                          <td className="anomaly-amplitude">
                            {row.value.toFixed(4)}
                          </td>
                          <td
                            style={{
                              color:
                                Math.abs(row.deviation) > 4
                                  ? 'var(--danger)'
                                  : Math.abs(row.deviation) > 3
                                  ? '#ff7e00'
                                  : 'var(--warning)',
                            }}
                          >
                            {row.deviation > 0 ? '+' : ''}
                            {row.deviation.toFixed(2)}σ
                          </td>
                          <td>
                            <span className={`severity-badge ${row.sev.cls}`}>
                              {row.sev.label}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {results.anomaly_indices.length > 50 && (
                  <p className="table-footer-note">
                    Showing first 50 of {results.anomaly_indices.length} anomalies
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
