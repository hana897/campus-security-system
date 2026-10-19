import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ownerService } from '../../services/ownerService';
import { AuthenticatedImage } from '../../components/common/AuthenticatedImage';
import { assetService } from '../../services/assetService';
import { Owner, Asset } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useSecurity } from '../../context/SecurityContext';
import { ArrowLeft, Mail, Phone, Building, ShieldAlert, Box, ShieldCheck } from 'lucide-react';

export const OwnerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useSecurity();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [ownerAssets, setOwnerAssets] = useState<Asset[]>([]);
  const [isStolenModalOpen, setIsStolenModalOpen] = useState(false);
  const [selectedAssetForStolen, setSelectedAssetForStolen] = useState<Asset | null>(null);

  useEffect(() => {
    if (id) {
      ownerService.getById(id).then((found) => {
        setOwner(found);
        if (found) {
          assetService.getAll().then((all) => {
            setOwnerAssets(all.filter((a) => a.ownerName === found.fullName || a.ownerMatric === found.universityId));
          });
        }
      });
    }
  }, [id]);

  if (!owner) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading carrier profile...</div>;
  }

  const handleConfirmStolen = async () => {
    if (!selectedAssetForStolen) return;
    try {
      await assetService.updateStatus(selectedAssetForStolen.id, 'STOLEN', 'Reported stolen by owner in person at security desk.');
      setOwnerAssets((prev) =>
        prev.map((a) => (a.id === selectedAssetForStolen.id ? { ...a, status: 'STOLEN' } : a))
      );
      showToast({
        type: 'error',
        title: 'Security Alert Active',
        message: `${selectedAssetForStolen.name} (${selectedAssetForStolen.id}) is now flagged as STOLEN across all gates.`,
      });
    } finally {
      setIsStolenModalOpen(false);
      setSelectedAssetForStolen(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <button
        onClick={() => navigate('/owners')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <ArrowLeft size={16} /> Back to Directory
      </button>

      {/* Profile Header Banner */}
      <div
        className="soc-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(37, 99, 235, 0.2)',
              border: '2px solid rgba(37, 99, 235, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              fontWeight: 800,
              fontSize: '1.35rem',
            }}
          >
            {owner.avatarUrl ? <AuthenticatedImage src={owner.avatarUrl} alt={`${owner.fullName} profile`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : owner.fullName.split(' ').map((n) => n[0]).join('')}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{owner.fullName}</h1>
              <span
                style={{
                  fontSize: '0.7rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 700,
                }}
              >
                ● ACTIVE ENROLLMENT
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '4px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{owner.universityId}</span>
              <span>•</span>
              <span>{owner.department}</span>
              <span>•</span>
              <span>Role: {owner.role}</span>
            </div>
          </div>
        </div>

        {/* Contact info badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Phone size={14} color="#22d3ee" /> {owner.phone}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Mail size={14} color="#3b82f6" /> {owner.email}
          </div>
        </div>
      </div>

      {/* Security Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="soc-card">
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL REGISTERED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {ownerAssets.length || owner.registeredAssetsCount}
          </div>
        </div>

        <div className="soc-card">
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>AUTHORIZED EXITS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#10b981', marginTop: '4px' }}>
            {ownerAssets.filter((a) => a.status === 'AUTHORIZED').length}
          </div>
        </div>

        <div className="soc-card">
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>FLAGGED AS LOST</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#f59e0b', marginTop: '4px' }}>
            {ownerAssets.filter((a) => a.status === 'LOST').length}
          </div>
        </div>

        <div className="soc-card">
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>REPORTED STOLEN</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ef4444', marginTop: '4px' }}>
            {ownerAssets.filter((a) => a.status === 'STOLEN').length}
          </div>
        </div>
      </div>

      {/* Registered Physical Equipment Section */}
      <div className="soc-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Linked Physical Equipment</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Hardware registered under carrier's security identification
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {ownerAssets.map((asset) => (
            <div
              key={asset.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.1rem',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <Box size={20} color="#38bdf8" />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {asset.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {asset.id}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Serial: <strong style={{ fontFamily: 'var(--font-mono)' }}>{asset.serial}</strong> • Category: {asset.category}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <StatusBadge status={asset.status} size="sm" showPulse={asset.status === 'STOLEN'} />
                {asset.status !== 'STOLEN' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAssetForStolen(asset);
                      setIsStolenModalOpen(true);
                    }}
                    className="soc-btn soc-btn-danger"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem' }}
                  >
                    <ShieldAlert size={13} /> Report Stolen
                  </button>
                ) : (
                  <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700 }}>
                    ALERT BROADCASTED
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={isStolenModalOpen}
        title="BROADCAST CRITICAL THEFT ALERT?"
        message={`Are you sure you want to flag ${selectedAssetForStolen?.name} (${selectedAssetForStolen?.id}) as STOLEN? All checkpoint gates will immediately intercept and detain anyone attempting to exit with this device.`}
        confirmLabel="CONFIRM THEFT & ALERT GATES"
        isDestructive={true}
        onConfirm={handleConfirmStolen}
        onCancel={() => {
          setIsStolenModalOpen(false);
          setSelectedAssetForStolen(null);
        }}
      />
    </div>
  );
};
