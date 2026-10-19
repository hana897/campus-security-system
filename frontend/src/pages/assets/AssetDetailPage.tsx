import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assetService } from '../../services/assetService';
import { AuthenticatedImage } from '../../components/common/AuthenticatedImage';
import { Asset, AssetStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useSecurity } from '../../context/SecurityContext';
import { ArrowLeft, Download, Printer, ShieldAlert, CheckCircle2, User, Phone } from 'lucide-react';
import QRCode from 'qrcode';

const formatRegistrationDate = (asset: Asset) => asset.registrationDateTime
  ? new Date(asset.registrationDateTime).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  : asset.registrationDate;

export const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useSecurity();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  useEffect(() => {
    if (id) {
      assetService.getById(id).then(setAsset);
    }
  }, [id]);

  useEffect(() => {
    if (!asset) return;

    QRCode.toDataURL(asset.qrCode || asset.id, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 280,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(setQrCodeDataUrl).catch((error: unknown) => {
      console.error('Could not generate the asset QR code.', error);
      showToast({
        type: 'error',
        title: 'QR Generation Failed',
        message: 'Could not generate a QR code for this asset.',
      });
    });
  }, [asset, showToast]);

  if (!asset) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading asset intelligence profile...
      </div>
    );
  }

  const handleStatusChange = async (newStatus: AssetStatus) => {
    try {
      const updated = await assetService.updateStatus(asset.id, newStatus);
      setAsset(updated);
      showToast({
        type: newStatus === 'STOLEN' ? 'error' : 'success',
        title: 'Status Updated',
        message: `Asset status changed to ${newStatus}.`,
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not change asset status.',
      });
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Navigation */}
      <button
        onClick={() => navigate('/assets')}
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
        <ArrowLeft size={16} /> Back to Asset Registry
      </button>

      {/* Main Asset Banner */}
      <div
        className="soc-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700 }}>
              {asset.id}
            </span>
            <StatusBadge status={asset.status} size="md" showPulse={asset.status === 'STOLEN'} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{asset.name}</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {asset.brand} • {asset.model} • Color: {asset.color}
          </p>
        </div>

        {/* Quick Status Control Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {asset.status !== 'AUTHORIZED' && (
            <button
              onClick={() => handleStatusChange('AUTHORIZED')}
              className="soc-btn soc-btn-success"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}
            >
              <CheckCircle2 size={15} /> Authorize Exit
            </button>
          )}
          {asset.status !== 'STOLEN' && (
            <button
              onClick={() => handleStatusChange('STOLEN')}
              className="soc-btn soc-btn-danger"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}
            >
              <ShieldAlert size={15} /> Flag Stolen
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
        {/* Specifications */}
        <div className="soc-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Asset information</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>
                SERIAL NUMBER
              </span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{asset.serial}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>
                CATEGORY
              </span>
              <span>{asset.category}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>
                REGISTRATION DATE
              </span>
              <span>{formatRegistrationDate(asset)}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>
                PURCHASE / INVOICE DATE
              </span>
              <span>{asset.purchaseDate || 'N/A'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>
                REGISTERED BY
              </span>
              <span>{asset.registeredBy || 'Unknown'}</span>
            </div>
          </div>

          {asset.notes && (
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem',
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                SECURITY & AUDIT NOTES
              </span>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{asset.notes}</p>
            </div>
          )}
        </div>

        {/* Owner Card & QR Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Registered Owner Card */}
          <div className="soc-card registered-owner-preview">
            <h3>Registered owner</h3>
            <div className="registered-owner-identity">
              <div className="registered-owner-avatar">{asset.ownerAvatarUrl ? <AuthenticatedImage src={asset.ownerAvatarUrl} alt={`${asset.ownerName} profile`} /> : <User size={22} />}</div>
              <div><strong>{asset.ownerName || 'Unassigned'}</strong><span>{asset.ownerMatric || 'N/A'}</span></div>
            </div>
            <p>Department: <strong>{asset.department || 'General Campus'}</strong></p>
            <p>Phone Number: <strong>{asset.ownerPhone || 'N/A'}</strong></p>
            <p>Campus: <strong>Debre Berhan University (Main)</strong></p>
          </div>

          {/* QR Code Security Badge */}
          <div className="soc-card" style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Digital Asset QR Tag</h3>
            <div
              style={{
                width: '140px',
                height: '140px',
                margin: '0.75rem auto',
                backgroundColor: '#ffffff',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {qrCodeDataUrl && <img src={qrCodeDataUrl} alt={`QR code for asset ${asset.id}`} width="110" height="110" />}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {asset.id}
            </div>
            <a
              href={qrCodeDataUrl || undefined}
              download={`${asset.id}-qr.png`}
              className="soc-btn soc-btn-secondary"
              style={{ marginTop: '0.75rem', width: '100%' }}
              aria-disabled={!qrCodeDataUrl}
              onClick={(event) => {
                if (!qrCodeDataUrl) {
                  event.preventDefault();
                  showToast({
                    type: 'warning',
                    title: 'QR Code Not Ready',
                    message: 'Wait for the asset QR code to finish generating.',
                  });
                }
              }}
            >
              <Download size={15} /> Download QR
            </a>
            <button
              onClick={() => window.print()}
              className="soc-btn soc-btn-secondary"
              style={{ marginTop: '0.75rem', width: '100%' }}
            >
              <Printer size={15} /> Print Asset Tag Label
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
