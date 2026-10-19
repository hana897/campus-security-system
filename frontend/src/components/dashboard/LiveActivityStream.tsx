import React from 'react';
import { VerificationLog } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ArrowRight, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LiveActivityStream: React.FC<{ logs: VerificationLog[] }> = ({ logs }) => {
  const navigate = useNavigate();

  return (
    <div className="soc-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            REAL-TIME CHECKPOINT STREAM
          </span>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>Live Verification Events</h3>
        </div>
        <button
          onClick={() => navigate('/verification/history')}
          style={{ fontSize: '0.75rem', color: '#22d3ee', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
        >
          Full Audit Log <ArrowRight size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {logs.map((log) => {
          const isStolen = log.result === 'STOLEN';
          return (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isStolen ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-elevated)',
                border: isStolen ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border)',
                transition: 'background-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: isStolen ? 'rgba(239, 68, 68, 0.2)' : 'rgba(37, 99, 235, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isStolen ? '#ef4444' : '#38bdf8',
                  }}
                >
                  <QrCode size={16} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {log.assetName}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {log.assetId}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Carrier: <strong style={{ color: 'var(--text-primary)' }}>{log.ownerName}</strong> ({log.ownerId}) • Gate: {log.gate}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <StatusBadge status={log.result as any} showPulse={isStolen} size="sm" />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
