import React from 'react';

export default function KpiCard({ title, value, unit, subtitle, icon, color = 'blue', trend }) {
  const colorMap = {
    blue: { accent: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' },
    teal: { accent: '#14b8a6', bg: 'rgba(20, 184, 166, 0.1)' },
    amber: { accent: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    rose: { accent: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' },
    emerald: { accent: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    purple: { accent: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8' }}>{title}</span>
        {icon && (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: scheme.bg,
            color: scheme.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{ fontSize: '26px', fontWeight: '700', color: '#f8fafc', letterSpacing: '-0.02em' }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>{unit}</span>}
      </div>

      {subtitle && (
        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {trend && <span>{trend}</span>}
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
}
