import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Heart,
  TrendingUp,
  Zap,
  BarChart2,
} from 'lucide-react';

/* ── Animated number counter hook ── */
function useCountUp(target, duration = 400) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target === null || target === undefined || isNaN(target)) {
      setValue(target);
      return;
    }
    const numTarget = parseFloat(target);
    const isFloat = !Number.isInteger(numTarget);
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = numTarget * eased;
      setValue(isFloat ? parseFloat(current.toFixed(1)) : Math.round(current));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

/* ── Tiny Beating Heart SVG ── */
function BeatingHeart({ bpm }) {
  const period = bpm ? (60 / bpm) * 1000 : 1000;
  return (
    <svg
      viewBox="0 0 16 15"
      fill="currentColor"
      width="14"
      height="14"
      style={{
        color: '#ff4757',
        animation: `heartbeat ${period}ms ease-in-out infinite`,
        transformOrigin: 'center',
        display: 'inline-block',
        marginLeft: 6,
      }}
      aria-hidden="true"
    >
      <path d="M8 14s-6-4.5-6-8.5A4 4 0 0 1 8 2a4 4 0 0 1 6 3.5C14 9.5 8 14 8 14z" />
    </svg>
  );
}

/* ── Stat Card ── */
function StatCard({ icon: Icon, label, value, sub, accentColor, delay, isAnomaly, bpm }) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  const isNumeric = !isNaN(numericValue);
  const displayValue = useCountUp(isNumeric ? numericValue : 0, 450);

  const anomalyGlow =
    isAnomaly && typeof value === 'number' && value > 0
      ? { textShadow: `0 0 12px ${accentColor}` }
      : {};

  return (
    <div
      className="stat-card fade-up"
      style={{ '--card-accent': accentColor, animationDelay: `${delay}ms` }}
    >
      <div className="stat-card-top">
        <div
          className="stat-icon-badge"
          style={{ background: `${accentColor}1a`, color: accentColor }}
        >
          <Icon size={16} />
        </div>
        <span className="stat-label">{label}</span>
      </div>

      <div className="stat-value-row">
        <span
          className="stat-value"
          style={anomalyGlow}
        >
          {value === null || value === undefined
            ? 'N/A'
            : isNumeric
            ? typeof value === 'number' && !Number.isInteger(value)
              ? displayValue.toFixed ? displayValue : value
              : displayValue
            : value}
        </span>
        {bpm && <BeatingHeart bpm={bpm} />}
      </div>

      <span className="stat-sub">{sub}</span>
    </div>
  );
}

/* ── Quality color helper ── */
function qualityConfig(pct) {
  if (pct === 0) return { label: 'Excellent', color: '#2ed573' };
  if (pct < 2)  return { label: 'Good',      color: '#00d4aa' };
  if (pct < 8)  return { label: 'Moderate',  color: '#ffa502' };
  return          { label: 'Poor',      color: '#ff4757' };
}

/* ── Method display ── */
const METHOD_LABELS = {
  zscore: 'Z-Score',
  iqr: 'IQR Global',
  gradient: 'Gradient Spike',
};

/* ── StatsGrid ── */
export default function StatsGrid({ stats, status }) {
  const q = qualityConfig(stats.anomaly_pct);

  const cards = [
    {
      icon: Activity,
      label: 'Total Samples',
      value: stats.total_samples,
      sub: 'data points analyzed',
      accentColor: '#00d4aa',
    },
    {
      icon: AlertTriangle,
      label: 'Anomalies Found',
      value: stats.anomaly_count,
      sub: `${stats.anomaly_pct}% of signal`,
      accentColor: stats.anomaly_count > 0 ? '#ff4757' : '#2ed573',
      isAnomaly: true,
    },
    {
      icon: Heart,
      label: 'Heart Rate',
      value: stats.heart_rate_bpm !== null ? stats.heart_rate_bpm : null,
      sub: stats.heart_rate_bpm ? `~${stats.r_peak_count ?? '?'} R-peaks detected` : 'Not estimated',
      accentColor: '#00d4aa',
      bpm: stats.heart_rate_bpm,
    },
    {
      icon: TrendingUp,
      label: 'Signal Range',
      value: `${stats.min} → ${stats.max}`,
      sub: `mean ${stats.mean} · std ${stats.std}`,
      accentColor: '#3d7fff',
    },
    {
      icon: Zap,
      label: 'Detection Method',
      value: METHOD_LABELS[stats.method] || stats.method.toUpperCase(),
      sub: 'active algorithm',
      accentColor: '#ffa502',
    },
    {
      icon: BarChart2,
      label: 'Signal Quality',
      value: q.label,
      sub: `${stats.anomaly_pct}% anomaly rate`,
      accentColor: q.color,
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card, i) => (
        <StatCard key={card.label} delay={i * 60} {...card} />
      ))}
    </div>
  );
}
