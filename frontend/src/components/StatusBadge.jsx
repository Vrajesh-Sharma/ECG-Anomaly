import React from 'react';

const STATUS_CONFIG = {
  normal: {
    label: 'Normal Sinus Rhythm',
    icon: '✅',
    color: '#2ed573',
    glow: 'rgba(46, 213, 115, 0.35)',
    bg: 'rgba(46, 213, 115, 0.1)',
    border: 'rgba(46, 213, 115, 0.35)',
    pulse: false,
  },
  mild: {
    label: 'Mild Irregularities',
    icon: '⚠️',
    color: '#ffa502',
    glow: 'rgba(255, 165, 2, 0.35)',
    bg: 'rgba(255, 165, 2, 0.1)',
    border: 'rgba(255, 165, 2, 0.35)',
    pulse: false,
  },
  moderate: {
    label: 'Moderate Anomalies',
    icon: '🔶',
    color: '#ff7e00',
    glow: 'rgba(255, 126, 0, 0.35)',
    bg: 'rgba(255, 126, 0, 0.1)',
    border: 'rgba(255, 126, 0, 0.35)',
    pulse: false,
  },
  critical: {
    label: 'Critical — High Anomaly',
    icon: '🔴',
    color: '#ff4757',
    glow: 'rgba(255, 71, 87, 0.5)',
    bg: 'rgba(255, 71, 87, 0.12)',
    border: 'rgba(255, 71, 87, 0.5)',
    pulse: true,
  },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.normal;

  return (
    <div
      className={`status-badge ${cfg.pulse ? 'status-badge--critical' : ''}`}
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        boxShadow: `0 0 12px ${cfg.glow}`,
      }}
      role="status"
      aria-live="polite"
    >
      <span className="status-badge-icon">{cfg.icon}</span>
      <span className="status-badge-label">{cfg.label}</span>
    </div>
  );
}
