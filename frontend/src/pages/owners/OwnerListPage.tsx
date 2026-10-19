import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownerService } from '../../services/ownerService';
import { AuthenticatedImage } from '../../components/common/AuthenticatedImage';
import { Owner } from '../../types';
import { Search, Box, ArrowRight } from 'lucide-react';

export const OwnerListPage: React.FC = () => {
  const navigate = useNavigate();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  useEffect(() => {
    ownerService.getAll().then(setOwners);
  }, []);

  const filteredOwners = owners.filter((o) => {
    const matchesSearch =
      o.fullName.toLowerCase().includes(query.toLowerCase()) ||
      o.universityId.toLowerCase().includes(query.toLowerCase()) ||
      o.email.toLowerCase().includes(query.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || o.department === deptFilter;
    return matchesSearch && matchesDept;
  });
  const departments = [...new Set(owners.map((owner) => owner.department).filter(Boolean))].sort();

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Owners</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Browse students and staff and view their registered assets.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="soc-card" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by student name, matric number or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="soc-input"
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="soc-input"
        >
          <option value="ALL">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Owner Profile Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filteredOwners.map((owner) => {
          const hasStolen = owner.stolenCount > 0;
          return (
            <div
              key={owner.id}
              className="soc-card soc-card-interactive"
              onClick={() => navigate(`/owners/${owner.id}`)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: hasStolen ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(37, 99, 235, 0.15)',
                        border: '1px solid rgba(37, 99, 235, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8',
                        fontWeight: 700,
                        fontSize: '1rem',
                      }}
                    >
                      {owner.avatarUrl ? <AuthenticatedImage src={owner.avatarUrl} alt={`${owner.fullName} profile`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : owner.fullName.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {owner.fullName}
                      </h3>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {owner.universityId}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: hasStolen ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: hasStolen ? '#ef4444' : '#10b981',
                    }}
                  >
                    {hasStolen ? 'ALERT ON FILE' : 'CLEARED'}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  <div>Department: <strong style={{ color: 'var(--text-primary)' }}>{owner.department}</strong></div>
                  <div>Role: {owner.role}</div>
                </div>
              </div>

              {/* Bottom stats row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--border)',
                  fontSize: '0.78rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                  <Box size={14} color="#38bdf8" />
                  <span>Registered Assets:</span>
                  <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {owner.registeredAssetsCount}
                  </strong>
                </div>

                <button
                  type="button"
                  style={{
                    color: '#22d3ee',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                  }}
                >
                  View Profile <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
