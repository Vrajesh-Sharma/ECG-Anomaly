import React from 'react';
import { X, Sliders } from 'lucide-react';

const METHOD_DESCRIPTIONS = {
  zscore: 'Rolling Z-Score detects anomalies by comparing each point to its local neighbourhood mean and standard deviation. Best for ECG signals with slow baseline drift.',
  iqr: 'IQR Global uses the interquartile range across the full signal. Robust to extreme outliers — ideal for noisy or non-stationary recordings.',
  gradient: 'Gradient Spike detects sudden, sharp changes in amplitude — useful for catching ectopic beats, artifact spikes, and abrupt signal transitions.',
};

export default function SettingsPanel({ open, onClose, method, setMethod, threshold, setThreshold }) {
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
        aria-label="Detection Settings"
      >
        {/* Header */}
        <div className="settings-header">
          <div className="settings-title-row">
            <Sliders size={18} color="var(--accent)" />
            <h2 className="settings-title">Detection Settings</h2>
          </div>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        <div className="settings-body">
          {/* Detection Method */}
          <div className="settings-field">
            <label className="settings-label" htmlFor="method-select">
              Detection Method
            </label>
            <div className="select-wrapper">
              <select
                id="method-select"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="zscore">Z-Score (Rolling)</option>
                <option value="iqr">IQR (Global)</option>
                <option value="gradient">Gradient Spike</option>
              </select>
            </div>
            <p className="settings-method-desc">
              {METHOD_DESCRIPTIONS[method]}
            </p>
          </div>

          {/* Threshold slider — only for zscore */}
          {method === 'zscore' && (
            <div className="settings-field">
              <div className="settings-label-row">
                <label className="settings-label" htmlFor="threshold-slider">
                  Sensitivity Threshold
                </label>
                <span className="settings-value-display">
                  {threshold.toFixed(1)}σ
                </span>
              </div>

              <input
                id="threshold-slider"
                type="range"
                min="1.5"
                max="5.0"
                step="0.1"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="settings-slider"
                style={{
                  background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${
                    ((threshold - 1.5) / 3.5) * 100
                  }%, var(--border-bright) ${
                    ((threshold - 1.5) / 3.5) * 100
                  }%, var(--border-bright) 100%)`,
                }}
              />

              <div className="settings-slider-labels">
                <span>Sensitive (1.5)</span>
                <span>Conservative (5.0)</span>
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="settings-footer-note">
            ⚡ Changes apply on next analysis
          </p>
        </div>
      </div>
    </>
  );
}
