import React from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { Activity, Users, ShieldAlert, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const LiveGateMonitor: React.FC = () => {
  const { currentGate } = useSecurity();

  return (
    <div
      className="soc-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(145deg, var(--bg-surface) 0%, rgba(13, 18, 26, 0.95) 100%)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              LIVE GATE MONITOR
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: '#10b981', fontWeight: 700 }}>
              <span className="badge-dot" style={{ backgroundColor: '#10b981' }} />
              OPERATIONAL
            </span>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-primary)' }}>
            {currentGate}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22d3ee', fontSize: '0.75rem', fontWeight: 600 }}>
          <Activity size={16} /> Live Radar Telemetry
        </div>
      </div>

      {/* Center Radar & Metrics Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '1.5rem', alignItems: 'center' }}>
        {/* Metric Badges Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
          <div
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              <ArrowDownLeft size={14} color="#10b981" />
              People Entering
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              87
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              <ArrowUpRight size={14} color="#3b82f6" />
              People Exiting
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              64
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              <Users size={14} color="#22d3ee" />
              Assets Verified
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              51
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', fontSize: '0.72rem', fontWeight: 600 }}>
              <ShieldAlert size={14} />
              Gate Alerts
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px', color: '#ef4444' }}>
              02
            </div>
          </div>
        </div>

        {/* Animated Radar Visual Widget */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              position: 'relative',
              width: '130px',
              height: '130px',
              borderRadius: '50%',
              border: '1px solid rgba(34, 211, 238, 0.4)',
              backgroundColor: 'rgba(34, 211, 238, 0.03)',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 15px rgba(34, 211, 238, 0.1)',
            }}
          >
            {/* Concentric rings */}
            <div
              style={{
                position: 'absolute',
                top: '25%',
                left: '25%',
                width: '50%',
                height: '50%',
                borderRadius: '50%',
                border: '1px solid rgba(34, 211, 238, 0.25)',
              }}
            />
            {/* Axis crosshairs */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                width: '1px',
                height: '100%',
                backgroundColor: 'rgba(34, 211, 238, 0.2)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                width: '100%',
                height: '1px',
                backgroundColor: 'rgba(34, 211, 238, 0.2)',
              }}
            />
            {/* Rotating sweep arm */}
            <div className="radar-sweep-arm" />
            {/* Simulated active blips */}
            <span
              style={{
                position: 'absolute',
                top: '38%',
                left: '68%',
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 6px #10b981',
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: '72%',
                left: '32%',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                boxShadow: '0 0 8px #ef4444',
              }}
            />
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
            SURVEILLANCE SWEEP
          </span>
        </div>
      </div>
    </div>
  );
};
