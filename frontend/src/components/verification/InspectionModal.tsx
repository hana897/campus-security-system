import React from 'react';
import { Asset, VerificationLog } from '../../types';
import { CheckCircle2, ShieldAlert, AlertTriangle, X, ShieldX, FileText, Phone, Building } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface InspectionModalProps {
  asset: Asset | null;
  log?: VerificationLog;
  isOpen: boolean;
  onClose: () => void;
  onApproveExit: () => void;
  onOpenIncident: (asset: Asset) => void;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({
  asset,
  isOpen,
  onClose,
  onApproveExit,
  onOpenIncident,
}) => {
  if (!isOpen || !asset) return null;

  const isAuthorized = asset.status === 'AUTHORIZED';
  const isStolen = asset.status === 'STOLEN';
  const isLost = asset.status === 'LOST';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        className="soc-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: 'var(--bg-modal)',
          border: isStolen
            ? '2px solid #ef4444'
            : isAuthorized
            ? '1px solid rgba(16, 185, 129, 0.5)'
            : '1px solid var(--border-strong)',
          boxShadow: isStolen ? 'var(--shadow-alert)' : isAuthorized ? 'var(--shadow-success)' : 'var(--shadow-lg)',
          padding: 0,
          overflow: 'hidden',
          animation: 'fadeIn 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Status Header Banner */}
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: isStolen
              ? 'rgba(239, 68, 68, 0.2)'
              : isAuthorized
              ? 'rgba(16, 185, 129, 0.15)'
              : 'rgba(245, 158, 11, 0.15)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: isStolen ? '#ef4444' : isAuthorized ? '#10b981' : '#f59e0b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isStolen ? <ShieldX size={28} /> : isAuthorized ? <CheckCircle2 size={28} /> : <AlertTriangle size={28} />}
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: isStolen ? '#ef4444' : isAuthorized ? '#10b981' : '#f59e0b',
                }}
              >
                {isStolen
                  ? 'CRITICAL SECURITY INTERCEPTION'
                  : isAuthorized
                  ? 'ASSET VERIFIED — AUTHORIZED TO EXIT'
                  : 'SECURITY ALERT — ASSET FLAGGED'}
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {isStolen ? 'STOLEN ASSET DETECTED — DO NOT RELEASE' : asset.name}
              </h2>
            </div>
          </div>

          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top Asset & Owner Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {/* Asset Identity Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                HARDWARE SPECIFICATIONS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Asset ID</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{asset.id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Serial Number</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{asset.serial}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Category</span>
                  <span style={{ color: 'var(--text-primary)' }}>{asset.category}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status</span>
                  <StatusBadge status={asset.status} size="sm" />
                </div>
              </div>
            </div>

            {/* Registered Owner Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                REGISTERED OWNER DETAILS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Full Name</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{asset.ownerName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Student / Staff ID</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{asset.ownerMatric}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Department</span>
                  <span style={{ color: 'var(--text-primary)' }}>{asset.department}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#22d3ee', marginTop: '2px' }}>
                  <Phone size={13} /> +251 91 148 2931
                </div>
              </div>
            </div>
          </div>

          {/* Special Security Warning Box */}
          {(isStolen || isLost) && (
            <div
              style={{
                padding: '1rem',
                backgroundColor: isStolen ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                border: isStolen ? '1px solid #ef4444' : '1px solid #f59e0b',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <ShieldAlert size={20} color={isStolen ? '#ef4444' : '#f59e0b'} />
                <div>
                  <strong style={{ color: isStolen ? '#ef4444' : '#f59e0b', fontSize: '0.85rem' }}>
                    {isStolen ? 'IMMEDIATE SECURITY DIRECTIVE:' : 'OPERATIONAL ADVISORY:'}
                  </strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.4 }}>
                    {asset.notes || 'Please detain carrier and notify Central Command immediately.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            {isStolen ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenIncident(asset)}
                  className="soc-btn soc-btn-danger"
                  style={{ gap: '0.5rem' }}
                >
                  <ShieldAlert size={16} /> ALERT DISPATCH & LOG INCIDENT
                </button>
                <button type="button" onClick={onClose} className="soc-btn soc-btn-secondary">
                  Hold Asset
                </button>
              </>
            ) : isAuthorized ? (
              <>
                <button type="button" onClick={onClose} className="soc-btn soc-btn-secondary">
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={onApproveExit}
                  className="soc-btn soc-btn-success"
                  style={{ gap: '0.5rem' }}
                >
                  <CheckCircle2 size={16} /> APPROVE & ISSUE EXIT PASS
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={onClose} className="soc-btn soc-btn-secondary">
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => onOpenIncident(asset)}
                  className="soc-btn soc-btn-secondary"
                  style={{ borderColor: '#f59e0b', color: '#f59e0b' }}
                >
                  Escalate to Supervisor
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
