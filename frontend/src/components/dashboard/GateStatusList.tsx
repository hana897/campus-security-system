import React from 'react';
import { GateInfo } from '../../types';
import { Radio } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

export const GateStatusList: React.FC<{ gates: GateInfo[] }> = ({ gates }) => {
  const { currentGate, setCurrentGate } = useSecurity();

  return (
    <div className="soc-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          CAMPUS GATES TELEMETRY
        </span>
        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
          {gates.length} CHECKPOINTS
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        {gates.map((g) => {
          const isSelected = g.name === currentGate;
          const isBusy = g.status === 'BUSY';

          return (
            <div
              key={g.id}
              onClick={() => setCurrentGate(g.name)}
              className="soc-card-interactive"
              style={{
                backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-elevated)',
                border: isSelected ? '1px solid #2563eb' : '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{g.name}</span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: isBusy ? '#f59e0b' : '#10b981',
                  }}
                >
                  <span className="badge-dot" style={{ backgroundColor: isBusy ? '#f59e0b' : '#10b981' }} />
                  {g.status}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>Scans today</span>
                <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {g.todayScans}
                </strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
