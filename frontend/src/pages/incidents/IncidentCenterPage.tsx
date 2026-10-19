import React, { useState, useEffect } from 'react';
import { incidentService } from '../../services/incidentService';
import { Incident, IncidentSeverity, IncidentStatus } from '../../types';
import { AlertOctagon, Plus, ShieldAlert, CheckCircle2, User, Clock, MapPin, X } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { incidentSchema } from '../../utils/validation';

export const IncidentCenterPage: React.FC = () => {
  const { currentGate, currentUser, showToast } = useSecurity();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [assetId, setAssetId] = useState('');
  const [assetName, setAssetName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('HIGH');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    incidentService.getAll().then(setIncidents);
  }, []);

  const resetState = () => {
    setTitle('');
    setAssetId('');
    setAssetName('');
    setOwnerName('');
    setUniversityId('');
    setDescription('');
    setSeverity('HIGH');
    setErrors({});
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = incidentSchema.safeParse({ title, assetId, assetName, ownerName, universityId, description });

    if (!validation.success) {
      const fieldErrors = validation.error.issues.reduce<Record<string, string>>((acc, issue) => {
        const field = issue.path[0] as string;
        acc[field] = issue.message;
        return acc;
      }, {});
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    try {
      const newInc = await incidentService.create({
        title: validation.data.title,
        assetId: validation.data.assetId,
        assetName: validation.data.assetName,
        ownerName: validation.data.ownerName,
        universityId: validation.data.universityId || '',
        gate: currentGate,
        reportingOfficer: `${currentUser.firstName} ${currentUser.lastName} (${currentUser.officerId})`,
        severity,
        status: 'OPEN',
        description: validation.data.description,
        assignedInvestigator: '',
      });
      setIncidents((prev) => [newInc, ...prev]);
      showToast({
        type: 'warning',
        title: 'Security Incident Registered',
        message: `${newInc.incidentNumber} created and assigned to Central Dispatch.`,
      });
      setIsCreateModalOpen(false);
      resetState();
    } catch {
      showToast({
        type: 'error',
        title: 'Incident Registration Failed',
        message: 'Could not log security incident.',
      });
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Incidents</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Investigative audit records, gate breach attempts & asset interception cases
          </p>
        </div>

        <button onClick={() => setIsCreateModalOpen(true)} className="soc-btn soc-btn-danger">
          <Plus size={16} /> Log Security Incident
        </button>
      </div>

      {/* Incidents Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem' }}>
        {incidents.map((inc) => {
          const isHigh = inc.severity === 'HIGH' || inc.severity === 'CRITICAL';
          return (
            <div
              key={inc.id}
              className="soc-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: isHigh ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border)',
                backgroundColor: isHigh ? 'rgba(239, 68, 68, 0.03)' : 'var(--bg-surface)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: isHigh ? '#ef4444' : '#38bdf8',
                      }}
                    >
                      {inc.incidentNumber}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '3px',
                        backgroundColor: isHigh ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: isHigh ? '#ef4444' : '#f59e0b',
                      }}
                    >
                      {inc.severity} PRIORITY
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: inc.status === 'RESOLVED' ? '#10b981' : '#38bdf8',
                    }}
                  >
                    ● {inc.status}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {inc.title}
                </h3>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '1rem' }}>
                  {inc.description}
                </p>

                <div
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    fontSize: '0.78rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Flagged Asset:</span>
                    <strong>{inc.assetName} ({inc.assetId})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Carrier / Suspect:</span>
                    <span>{inc.ownerName} ({inc.universityId})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Investigator:</span>
                    <span style={{ color: '#22d3ee' }}>{inc.assignedInvestigator || 'Unassigned'}</span>
                  </div>
                </div>
              </div>

              {/* Bottom metadata */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border)',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> {inc.gate}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {inc.reportedAt}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Incident Modal */}
      {isCreateModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(5px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="soc-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: 'var(--bg-modal)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              boxShadow: 'var(--shadow-alert)',
              padding: '1.75rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} color="#ef4444" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Log Security Incident</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }} noValidate>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  INCIDENT TITLE / SUMMARY
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stolen Laptop Interception at Main Gate"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors((current) => ({ ...current, title: '' })); }}
                  className="soc-input"
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title && <small style={{ color: '#fca5a5', display: 'block', marginTop: '0.35rem' }}>{errors.title}</small>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    ASSET ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AST-2026-00117"
                    value={assetId}
                    onChange={(e) => { setAssetId(e.target.value); if (errors.assetId) setErrors((current) => ({ ...current, assetId: '' })); }}
                    className="soc-input"
                    aria-invalid={Boolean(errors.assetId)}
                  />
                  {errors.assetId && <small style={{ color: '#fca5a5', display: 'block', marginTop: '0.35rem' }}>{errors.assetId}</small>}
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    ASSET NAME
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HP EliteBook 840 G8"
                    value={assetName}
                    onChange={(e) => { setAssetName(e.target.value); if (errors.assetName) setErrors((current) => ({ ...current, assetName: '' })); }}
                    className="soc-input"
                    aria-invalid={Boolean(errors.assetName)}
                  />
                  {errors.assetName && <small style={{ color: '#fca5a5', display: 'block', marginTop: '0.35rem' }}>{errors.assetName}</small>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    SUSPECT / CARRIER NAME
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Unknown Carrier"
                    value={ownerName}
                    onChange={(e) => { setOwnerName(e.target.value); if (errors.ownerName) setErrors((current) => ({ ...current, ownerName: '' })); }}
                    className="soc-input"
                    aria-invalid={Boolean(errors.ownerName)}
                  />
                  {errors.ownerName && <small style={{ color: '#fca5a5', display: 'block', marginTop: '0.35rem' }}>{errors.ownerName}</small>}
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    MATRIC / ID NUMBER
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DBU-2023-0491"
                    value={universityId}
                    onChange={(e) => { setUniversityId(e.target.value); if (errors.universityId) setErrors((current) => ({ ...current, universityId: '' })); }}
                    className="soc-input"
                    aria-invalid={Boolean(errors.universityId)}
                  />
                  {errors.universityId && <small style={{ color: '#fca5a5', display: 'block', marginTop: '0.35rem' }}>{errors.universityId}</small>}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  SEVERITY LEVEL
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                  className="soc-input"
                >
                  <option value="CRITICAL">CRITICAL (Immediate Police / Command Dispatch)</option>
                  <option value="HIGH">HIGH (Suspect Detained / Item Intercepted)</option>
                  <option value="MEDIUM">MEDIUM (Ownership Mismatch / Under Investigation)</option>
                  <option value="LOW">LOW (Damaged Barcode / Procedural)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  INCIDENT DETAILS & CIRCUMSTANCES
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors((current) => ({ ...current, description: '' })); }}
                  className="soc-input"
                  placeholder="Provide precise details of the checkpoint incident..."
                  aria-invalid={Boolean(errors.description)}
                />
                {errors.description && <small style={{ color: '#fca5a5', display: 'block', marginTop: '0.35rem' }}>{errors.description}</small>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => { setIsCreateModalOpen(false); setErrors({}); }} className="soc-btn soc-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="soc-btn soc-btn-danger">
                  Register & Dispatch Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
