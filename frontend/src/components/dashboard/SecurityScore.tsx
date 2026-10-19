import React from 'react';
import { SecurityScore as SecurityScoreType } from '../../types';
import { ShieldCheck } from 'lucide-react';

export const SecurityScore: React.FC<{ data: SecurityScoreType }> = ({ data }) => {
  const strokeDash = (data.overall / 100) * 283;

  return (
    <div className="soc-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          SECURITY HEALTH INDEX
        </span>
        <ShieldCheck size={16} color="#10b981" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', margin: 'auto 0' }}>
        {/* Circular SVG Meter */}
        <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border-strong)" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#10b981"
              strokeWidth="8"
              strokeDasharray={`${strokeDash} 283`}
              strokeDashoffset="0"
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
              {data.overall}
            </span>
            <span style={{ fontSize: '0.62rem', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>
              {data.riskLevel}
            </span>
          </div>
        </div>

        {/* Factors breakdown */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Gate Activity</span>
            <span style={{ fontWeight: 600, color: '#10b981' }}>{data.factors.gateActivity}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Lost Assets</span>
            <span style={{ fontWeight: 600, color: '#f59e0b' }}>{data.factors.lostAssets}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Stolen Assets</span>
            <span style={{ fontWeight: 600, color: '#ef4444' }}>{data.factors.stolenAssets}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Pending Reviews</span>
            <span style={{ fontWeight: 600, color: '#8b5cf6' }}>{data.factors.pendingReviews}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
