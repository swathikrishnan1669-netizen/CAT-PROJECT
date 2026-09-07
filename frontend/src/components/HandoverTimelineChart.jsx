import React, { useState } from 'react';

export default function HandoverTimelineChart({
  sensorReadings = [],
  reconstructedReadings = [],
  uncertainExposures = [],
  warningThreshold = 8.0,
  criticalThreshold = 10.0
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Combine and sort chronological points
  const pointsMap = new Map();

  sensorReadings.forEach((r) => {
    const timeStr = new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    pointsMap.set(r.timestamp, {
      timestamp: r.timestamp,
      timeStr,
      actual: r.temperature !== null ? r.temperature : null,
      reconstructed: null,
      manual: r.source === 'MANUAL' ? r.temperature : null,
      source: r.source,
      confidence: 100,
      reason: r.source === 'MANUAL' ? 'Manual operator probe override' : 'Direct calibrated sensor reading',
      door: r.door_status,
      lowerBound: null,
      upperBound: null
    });
  });

  reconstructedReadings.forEach((r) => {
    const existing = pointsMap.get(r.timestamp);
    const timeStr = new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (existing) {
      existing.reconstructed = r.reconstructed_value;
      existing.confidence = r.confidence;
      existing.reason = r.reason;
      existing.lowerBound = r.lower_bound;
      existing.upperBound = r.upper_bound;
      if (existing.actual === null) {
        existing.source = 'RECONSTRUCTED';
      }
    } else {
      pointsMap.set(r.timestamp, {
        timestamp: r.timestamp,
        timeStr,
        actual: null,
        reconstructed: r.reconstructed_value,
        manual: null,
        source: 'RECONSTRUCTED',
        confidence: r.confidence,
        reason: r.reason,
        door: 'UNKNOWN',
        lowerBound: r.lower_bound,
        upperBound: r.upper_bound
      });
    }
  });

  const points = Array.from(pointsMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  if (points.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        No sensor stream telemetry recorded for this handover.
      </div>
    );
  }

  // Chart dimensions
  const width = 860;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Scales
  const minTemp = 0.0;
  const maxTemp = 14.0;
  const yScale = (val) => chartH - ((val - minTemp) / (maxTemp - minTemp)) * chartH + padding.top;
  const xScale = (idx) => padding.left + (idx / Math.max(1, points.length - 1)) * chartW;

  // Build Actual Path (skip gaps)
  let actualPath = '';
  let inActual = false;
  points.forEach((p, i) => {
    if (p.actual !== null && p.source !== 'MANUAL') {
      const x = xScale(i);
      const y = yScale(p.actual);
      if (!inActual) {
        actualPath += `M ${x} ${y}`;
        inActual = true;
      } else {
        actualPath += ` L ${x} ${y}`;
      }
    } else {
      inActual = false;
    }
  });

  // Build Reconstructed Path (skip non-reconstructed)
  let reconPath = '';
  let inRecon = false;
  points.forEach((p, i) => {
    if (p.reconstructed !== null) {
      const x = xScale(i);
      const y = yScale(p.reconstructed);
      if (!inRecon) {
        reconPath += `M ${x} ${y}`;
        inRecon = true;
      } else {
        reconPath += ` L ${x} ${y}`;
      }
    } else {
      inRecon = false;
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Visual Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '8px 16px',
        background: '#0d1527',
        borderRadius: '8px',
        border: '1px solid #1f2d47',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '16px', height: '3px', background: '#10b981', display: 'inline-block' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <strong style={{ color: '#34d399' }}>ACTUAL SENSOR</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '16px', height: '3px', borderTop: '2px dashed #f59e0b', display: 'inline-block' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            <strong style={{ color: '#fbbf24' }}>RECONSTRUCTED (IMPROVED)</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', background: '#c084fc', transform: 'rotate(45deg)', display: 'inline-block' }} />
            <strong style={{ color: '#c084fc' }}>MANUAL FALLBACK</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '14px', height: '12px', background: 'rgba(244, 63, 94, 0.25)', border: '1px solid rgba(244, 63, 94, 0.5)', display: 'inline-block' }} />
            <strong style={{ color: '#fb7185' }}>UNCERTAIN EXPOSURE PERIOD</strong>
          </div>
        </div>

        <div style={{ color: '#94a3b8', fontSize: '11px' }}>
          Hover points for telemetry & uncertainty bounds
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ position: 'relative', overflowX: 'auto', background: '#0a0f1d', borderRadius: '10px', border: '1px solid #1f2d47', padding: '10px 0' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '700px' }}>
          {/* Horizontal Grid lines */}
          {[2, 4, 6, 8, 10, 12].map((temp) => (
            <g key={temp}>
              <line
                x1={padding.left}
                y1={yScale(temp)}
                x2={width - padding.right}
                y2={yScale(temp)}
                stroke={temp === warningThreshold ? '#f59e0b' : temp === criticalThreshold ? '#f43f5e' : '#1e293b'}
                strokeDasharray={temp >= warningThreshold ? '4 4' : 'none'}
                strokeWidth={temp >= warningThreshold ? 1.5 : 1}
              />
              <text
                x={padding.left - 10}
                y={yScale(temp) + 4}
                fill={temp === warningThreshold ? '#fbbf24' : temp === criticalThreshold ? '#fb7185' : '#64748b'}
                fontSize="11"
                textAnchor="end"
                fontFamily="monospace"
              >
                {temp}°C
              </text>
            </g>
          ))}

          {/* Threshold Label Badges */}
          <text x={width - padding.right - 80} y={yScale(warningThreshold) - 6} fill="#fbbf24" fontSize="10" fontWeight="600">
            WARNING (8°C)
          </text>
          <text x={width - padding.right - 75} y={yScale(criticalThreshold) - 6} fill="#fb7185" fontSize="10" fontWeight="600">
            CRITICAL (10°C)
          </text>

          {/* Shaded Uncertain Exposure Periods */}
          {uncertainExposures.map((ue, idx) => {
            const startT = new Date(ue.start_time).getTime();
            const endT = new Date(ue.end_time).getTime();
            
            // Find x bounds
            let minX = width;
            let maxX = 0;
            points.forEach((p, i) => {
              const ptTime = new Date(p.timestamp).getTime();
              if (ptTime >= startT && ptTime <= endT) {
                const x = xScale(i);
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
              }
            });

            if (minX > maxX) return null;
            const bandW = Math.max(16, maxX - minX);

            return (
              <g key={idx}>
                <rect
                  x={minX - 6}
                  y={padding.top}
                  width={bandW + 12}
                  height={chartH}
                  fill="rgba(244, 63, 94, 0.18)"
                  stroke="rgba(244, 63, 94, 0.4)"
                  strokeDasharray="2 2"
                />
                <text
                  x={minX + 4}
                  y={padding.top + 16}
                  fill="#fb7185"
                  fontSize="10"
                  fontWeight="700"
                >
                  UNCERTAIN EXPOSURE ({ue.duration_minutes}m)
                </text>
              </g>
            );
          })}

          {/* Actual Temperature Path */}
          {actualPath && (
            <path
              d={actualPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Reconstructed Temperature Path */}
          {reconPath && (
            <path
              d={reconPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Point Markers & Interactivity */}
          {points.map((p, i) => {
            const x = xScale(i);
            const val = p.actual !== null ? p.actual : p.reconstructed;
            if (val === null) return null;
            const y = yScale(val);

            const isManual = p.source === 'MANUAL';
            const isRecon = p.source === 'RECONSTRUCTED';

            return (
              <g
                key={i}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPoint({ ...p, x, y, val })}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Visual Circle / Marker */}
                {isManual ? (
                  <polygon
                    points={`${x},${y - 6} ${x + 6},${y} ${x},${y + 6} ${x - 6},${y}`}
                    fill="#c084fc"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                ) : isRecon ? (
                  <circle
                    cx={x}
                    cy={y}
                    r="4.5"
                    fill="#f59e0b"
                    stroke="#111827"
                    strokeWidth="1.5"
                  />
                ) : (
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#10b981"
                    stroke="#111827"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            );
          })}

          {/* X-axis labels */}
          {points.filter((_, idx) => idx % Math.max(1, Math.floor(points.length / 6)) === 0).map((p, idx) => {
            const i = points.indexOf(p);
            const x = xScale(i);
            return (
              <text
                key={idx}
                x={x}
                y={height - 12}
                fill="#94a3b8"
                fontSize="11"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {p.timeStr}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            top: Math.max(10, hoveredPoint.y - 110),
            left: Math.min(width - 240, Math.max(20, hoveredPoint.x - 100)),
            background: '#111827',
            border: `1px solid ${hoveredPoint.source === 'ACTUAL' ? '#10b981' : hoveredPoint.source === 'MANUAL' ? '#c084fc' : '#f59e0b'}`,
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)',
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: '200px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontWeight: '600', color: '#f8fafc' }}>{hoveredPoint.timeStr}</span>
              <span style={{
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '4px',
                background: hoveredPoint.source === 'ACTUAL' ? 'rgba(16, 185, 129, 0.2)' : hoveredPoint.source === 'MANUAL' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: hoveredPoint.source === 'ACTUAL' ? '#34d399' : hoveredPoint.source === 'MANUAL' ? '#c084fc' : '#fbbf24'
              }}>
                {hoveredPoint.source}
              </span>
            </div>

            <div style={{ fontSize: '15px', fontWeight: '700', color: hoveredPoint.val >= 8.0 ? '#fb7185' : '#38bdf8' }}>
              {hoveredPoint.val.toFixed(1)} °C
            </div>

            {hoveredPoint.lowerBound !== null && (
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Bounds: [{hoveredPoint.lowerBound}°C - {hoveredPoint.upperBound}°C]
              </div>
            )}

            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Confidence: <strong>{hoveredPoint.confidence}%</strong>
            </div>

            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', borderTop: '1px solid #1f2d47', paddingTop: '4px' }}>
              {hoveredPoint.reason}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
