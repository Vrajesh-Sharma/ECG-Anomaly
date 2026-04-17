import React, { useState, useCallback, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Brush,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

/* ── Downsample helper (keep anomaly fidelity) ── */
function downsample(signal, anomalySet, maxPoints) {
  if (signal.length <= maxPoints) {
    return signal.map((v, i) => ({
      index: i,
      value: v,
      anomaly: anomalySet.has(i) ? v : null,
    }));
  }
  const step = Math.ceil(signal.length / maxPoints);
  const result = [];
  for (let i = 0; i < signal.length; i += step) {
    result.push({
      index: i,
      value: signal[i],
      anomaly: anomalySet.has(i) ? signal[i] : null,
    });
  }
  return result;
}

/* ── Custom Anomaly Dot ── */
const AnomalyDot = (props) => {
  const { cx, cy, payload } = props;
  if (payload.anomaly === null || payload.anomaly === undefined) return null;
  return (
    <g className="anomaly-pulse">
      <circle cx={cx} cy={cy} r={6} fill="rgba(255,71,87,0.25)" />
      <circle cx={cx} cy={cy} r={4} fill="#ff4757" stroke="white" strokeWidth={1.5} />
    </g>
  );
};

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const isAnomaly = d.anomaly !== null && d.anomaly !== undefined;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-index">Sample #{d.index}</div>
      <div
        className="chart-tooltip-value"
        style={{ color: isAnomaly ? '#ff4757' : '#00d4aa' }}
      >
        {typeof d.value === 'number' ? d.value.toFixed(4) : d.value} mV
      </div>
      {isAnomaly && (
        <div className="chart-tooltip-anomaly">⚠ ANOMALY</div>
      )}
    </div>
  );
};

export default function ECGChart({ signal, anomalyIndices }) {
  const [brushRange, setBrushRange] = useState(null);

  const anomalySet = useMemo(() => new Set(anomalyIndices), [anomalyIndices]);

  const data = useMemo(
    () => downsample(signal, anomalySet, 2500),
    [signal, anomalySet]
  );

  const handleBrushChange = useCallback((range) => {
    if (range?.startIndex != null && range?.endIndex != null) {
      setBrushRange({ start: range.startIndex, end: range.endIndex });
    }
  }, []);

  const handleResetZoom = () => setBrushRange(null);

  const isZoomed = brushRange !== null;

  const zoomedData = isZoomed
    ? data.slice(brushRange.start, brushRange.end + 1)
    : data;

  const zoomLabel = isZoomed
    ? `Viewing samples ${data[brushRange.start]?.index ?? brushRange.start}–${
        data[brushRange.end]?.index ?? brushRange.end
      }`
    : null;

  return (
    <>
      {/* Legend + zoom info row */}
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-line" style={{ background: '#00d4aa' }} />
          <span>Normal signal</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#ff4757' }} />
          <span>Anomaly point</span>
        </div>
        {anomalyIndices.length > 0 && (
          <div className="anomaly-count-badge">{anomalyIndices.length} anomalies</div>
        )}
        {zoomLabel && (
          <span className="zoom-label">· {zoomLabel}</span>
        )}
      </div>

      {/* Reset zoom button row */}
      {isZoomed && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <button className="ghost-btn" onClick={handleResetZoom} style={{ fontSize: 12, padding: '5px 10px' }}>
            Reset Zoom
          </button>
        </div>
      )}

      {/* Chart */}
      <div style={{ marginTop: 12 }}>
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 32, left: 8 }}>
            {/* Grid */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />

            {/* Axes */}
            <XAxis
              dataKey="index"
              stroke="none"
              tick={{ fill: 'var(--faint)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              label={{
                value: 'Sample Index',
                position: 'insideBottom',
                offset: -16,
                fill: 'var(--faint)',
                fontSize: 11,
              }}
            />
            <YAxis
              stroke="none"
              tick={{ fill: 'var(--faint)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              label={{
                value: 'Amplitude (mV)',
                angle: -90,
                position: 'insideLeft',
                offset: 12,
                fill: 'var(--faint)',
                fontSize: 11,
              }}
              width={60}
            />

            {/* Zero reference */}
            <ReferenceLine y={0} stroke="var(--border-bright)" strokeDasharray="4 4" />

            {/* Tooltip */}
            <Tooltip content={<CustomTooltip />} />

            {/* ECG Signal Line */}
            <Line
              type="linear"
              dataKey="value"
              stroke="#00d4aa"
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />

            {/* Anomaly Dots as Scatter via custom dot on Line */}
            <Line
              type="linear"
              dataKey="anomaly"
              stroke="none"
              dot={<AnomalyDot />}
              activeDot={false}
              isAnimationActive={false}
            />

            {/* Brush */}
            <Brush
              dataKey="index"
              height={28}
              stroke="var(--border-bright)"
              fill="var(--card)"
              travellerWidth={8}
              onChange={handleBrushChange}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
