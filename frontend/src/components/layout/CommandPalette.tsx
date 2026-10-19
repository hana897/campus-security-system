import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Box, User, QrCode, ArrowRight, X } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { assetService } from '../../services/assetService';
import { ownerService } from '../../services/ownerService';
import { Asset, Owner } from '../../types';

export const CommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const { isCommandPaletteOpen, setIsCommandPaletteOpen } = useSecurity();
  const [query, setQuery] = useState('');
  const [matchingAssets, setMatchingAssets] = useState<Asset[]>([]);
  const [matchingOwners, setMatchingOwners] = useState<Owner[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setMatchingAssets([]);
      setMatchingOwners([]);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setMatchingAssets([]);
      setMatchingOwners([]);
      return;
    }

    const timer = setTimeout(async () => {
      const assets = await assetService.getAll({ query });
      const owners = await ownerService.getAll(query);
      setMatchingAssets(assets.slice(0, 4));
      setMatchingOwners(owners.slice(0, 3));
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isCommandPaletteOpen) return null;

  const handleSelect = (path: string) => {
    setIsCommandPaletteOpen(false);
    navigate(path);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      <div
        className="soc-card"
        style={{
          width: '100%',
          maxWidth: '580px',
          backgroundColor: 'var(--bg-modal)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-lg)',
          padding: 0,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Search size={20} color="var(--accent-cyan)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search asset ID, serial number, student ID, or command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button onClick={() => setIsCommandPaletteOpen(false)} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Results Container */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.75rem' }}>
          {/* Quick Actions if query empty */}
          {!query.trim() && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.4rem 0.65rem' }}>
                SECURITY COMMANDS & NAVIGATION
              </div>
              <button
                type="button"
                onClick={() => handleSelect('/verification')}
                className="soc-card-interactive"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'transparent',
                }}
              >
                <QrCode size={18} color="#22d3ee" />
                <span style={{ flex: 1, textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  Open Gate Verification Terminal
                </span>
                <kbd style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>F2</kbd>
              </button>
              <button
                type="button"
                onClick={() => handleSelect('/assets/new')}
                className="soc-card-interactive"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'transparent',
                }}
              >
                <Box size={18} color="#10b981" />
                <span style={{ flex: 1, textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  Register New Campus Asset
                </span>
              </button>
            </div>
          )}

          {/* Asset matches */}
          {matchingAssets.length > 0 && (
            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.4rem 0.65rem' }}>
                MATCHING ASSETS ({matchingAssets.length})
              </div>
              {matchingAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleSelect(`/assets/${asset.id}`)}
                  className="soc-card-interactive"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'transparent',
                  }}
                >
                  <Box size={18} color="#3b82f6" />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {asset.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {asset.id} • {asset.serial} • Owner: {asset.ownerName}
                    </div>
                  </div>
                  <ArrowRight size={14} color="var(--text-muted)" />
                </button>
              ))}
            </div>
          )}

          {/* Owner matches */}
          {matchingOwners.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.4rem 0.65rem' }}>
                MATCHING PEOPLE ({matchingOwners.length})
              </div>
              {matchingOwners.map((owner) => (
                <button
                  key={owner.id}
                  type="button"
                  onClick={() => handleSelect(`/owners/${owner.id}`)}
                  className="soc-card-interactive"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'transparent',
                  }}
                >
                  <User size={18} color="#10b981" />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {owner.fullName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {owner.universityId} • {owner.department} • {owner.registeredAssetsCount} Assets
                    </div>
                  </div>
                  <ArrowRight size={14} color="var(--text-muted)" />
                </button>
              ))}
            </div>
          )}

          {query.trim() && matchingAssets.length === 0 && matchingOwners.length === 0 && (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No security records found for "{query}". Press Enter to verify as custom asset code.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
