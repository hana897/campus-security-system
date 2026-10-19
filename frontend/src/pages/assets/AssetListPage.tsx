import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetService } from '../../services/assetService';
import { AuthenticatedImage } from '../../components/common/AuthenticatedImage';
import { Asset } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Search, Plus, Eye } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

export const AssetListPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useSecurity();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    assetService.getAll().then(setAssets);
  }, []);

  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.serial.toLowerCase().includes(search.toLowerCase()) ||
      a.ownerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || a.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });
  const assetCategories = [...new Set(assets.map((asset) => asset.category))].sort();

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Assets</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Physical property inventory, serial identities & digital authorization status
          </p>
        </div>

        <button onClick={() => navigate('/assets/new')} className="soc-btn soc-btn-primary">
          <Plus size={16} /> Register New Asset
        </button>
      </div>

      {/* Filter Row */}
      <div className="soc-card" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search asset, ID, serial or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="soc-input"
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="soc-input"
        >
          <option value="ALL">All Statuses</option>
          <option value="AUTHORIZED">Authorized</option>
          <option value="LOST">Lost</option>
          <option value="STOLEN">Stolen</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RECOVERED">Recovered</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="soc-input"
        >
          <option value="ALL">All Categories</option>
          {assetCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="soc-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>ASSET NAME & MODEL</th>
                <th style={{ padding: '0.85rem 1rem' }}>ASSET ID</th>
                <th style={{ padding: '0.85rem 1rem' }}>SERIAL NUMBER</th>
                <th style={{ padding: '0.85rem 1rem' }}>OWNER</th>
                <th style={{ padding: '0.85rem 1rem' }}>REGISTERED BY</th>
                <th style={{ padding: '0.85rem 1rem' }}>CATEGORY</th>
                <th style={{ padding: '0.85rem 1rem' }}>STATUS</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr
                  key={asset.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    transition: 'background-color 0.15s',
                  }}
                >
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{asset.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{asset.model}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#38bdf8' }}>
                    {asset.id}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {asset.serial}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem' }}>
                      <span style={{ width: 34, height: 34, flex: '0 0 34px', overflow: 'hidden', display: 'grid', placeItems: 'center', borderRadius: '50%', background: 'var(--bg-elevated)', color: 'var(--accent, #1262f5)', fontSize: '.68rem', fontWeight: 700 }}>{asset.ownerAvatarUrl ? <AuthenticatedImage src={asset.ownerAvatarUrl} alt={`${asset.ownerName} profile`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : asset.ownerName.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
                      <div><div style={{ fontWeight: 600 }}>{asset.ownerName}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{asset.department}</div></div>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem' }}>
                      <span style={{ width: 34, height: 34, flex: '0 0 34px', overflow: 'hidden', display: 'grid', placeItems: 'center', borderRadius: '50%', background: 'var(--bg-elevated)', color: 'var(--accent, #1262f5)', fontSize: '.68rem', fontWeight: 700 }}>{asset.registeredByAvatarUrl ? <AuthenticatedImage src={asset.registeredByAvatarUrl} alt={`${asset.registeredBy || 'Administrator'} profile`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (asset.registeredBy || 'Unknown').split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
                      <div style={{ fontWeight: 600 }}>{asset.registeredBy || 'Unknown'}</div>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{asset.category}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <StatusBadge status={asset.status} size="sm" showPulse={asset.status === 'STOLEN'} />
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => navigate(`/assets/${asset.id}`)}
                        className="soc-btn soc-btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        <Eye size={14} /> View
                      </button>
                      {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && <button
                        type="button"
                        onClick={() => navigate(`/assets/new?ownerId=${encodeURIComponent(asset.ownerMatric)}`)}
                        className="soc-btn soc-btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        aria-label={`Add another asset for ${asset.ownerName}`}
                      >
                        <Plus size={14} /> Add Asset
                      </button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
