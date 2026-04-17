import React from 'react';
import { X, Brain } from 'lucide-react';

const MODEL_INFO = [
  { label: 'Model Type',     value: 'Dense Autoencoder' },
  { label: 'Architecture',   value: 'Enc: 32→16→8 · Dec: 8→16→32→140' },
  { label: 'Training Data',  value: 'ECG5000 Dataset (TensorFlow)' },
  { label: 'Input Shape',    value: '140-point beat windows' },
  { label: 'Optimizer',      value: 'Adam  ·  Loss: MAE' },
  { label: 'Accuracy',       value: '94.4%' },
  { label: 'Precision',      value: '99.2%' },
  { label: 'Recall',         value: '90.7%' },
];

export default function SettingsPanel({ open, onClose, modelThreshold }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`settings-backdrop ${open ? 'settings-backdrop--open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`settings-panel ${open ? 'settings-panel--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Model Information"
      >
        {/* Header */}
        <div className="settings-header">
          <div className="settings-title-row">
            <Brain size={18} color="var(--accent)" />
            <h2 className="settings-title">Model Information</h2>
          </div>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="settings-body">
          {/* Model Info Card */}
          <div className="model-info-card">
            <p className="model-info-section-label">Architecture &amp; Training</p>
            <dl className="model-info-list">
              {MODEL_INFO.map(({ label, value }) => (
                <div className="model-info-row" key={label}>
                  <dt className="model-info-key">{label}</dt>
                  <dd className="model-info-val">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Threshold Info */}
          <div className="model-info-card">
            <p className="model-info-section-label">Anomaly Threshold</p>
            <div className="threshold-display-row">
              <span className="threshold-label">Threshold Value</span>
              <span className="threshold-value">
                {modelThreshold != null ? modelThreshold : 'N/A'}
              </span>
            </div>
            <p className="threshold-desc">
              Auto-computed as mean + 1σ of reconstruction loss on normal
              training beats. Beats whose MAE exceeds this value are flagged
              as anomalies.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
