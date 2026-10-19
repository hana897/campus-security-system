import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowUpRight } from 'lucide-react';

export const VerificationQueue: React.FC = () => {
  const navigate = useNavigate();

  const pendingItems = [
    {
      id: 'AST-2026-00921',
      name: 'Lenovo ThinkPad T14',
      issue: 'Unknown ownership verification',
      carrier: 'Selamawit Girma',
      status: 'UNDER_REVIEW',
    },
    {
      id: 'AST-2026-00281',
      name: 'MacBook Pro 14" M3',
      issue: 'Owner matric mismatch',
      carrier: 'Dr. Dawit Haile',
      status: 'LOST',
    },
    {
      id: 'AST-2026-00881',
      name: 'Dell Precision 3581',
      issue: 'QR damaged, manual audit required',
      carrier: 'Engineering Staff',
      status: 'UNDER_REVIEW',
    },
  ];

  return (
    <div className="soc-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} color="#f59e0b" />
          <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            PENDING VERIFICATION QUEUE
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>
          {pendingItems.length} ACTION REQUIRED
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {pendingItems.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {item.name}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {item.id}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#f59e0b', marginTop: '2px' }}>
                {item.issue} • {item.carrier}
              </div>
            </div>

            <button
              onClick={() => navigate('/verification')}
              className="soc-btn soc-btn-secondary"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem' }}
            >
              Review <ArrowUpRight size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
