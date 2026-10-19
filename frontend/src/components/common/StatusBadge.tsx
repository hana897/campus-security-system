import React from 'react';
import { AssetStatus } from '../../types';
import { getAssetStatusConfig } from '../../constants';

interface StatusBadgeProps {
  status: AssetStatus;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showPulse = false }) => {
  const config = getAssetStatusConfig(status);
  const isStolen = status === 'STOLEN';

  const sizeStyles = {
    sm: { padding: '0.15rem 0.5rem', fontSize: '0.65rem' },
    md: { padding: '0.25rem 0.65rem', fontSize: '0.72rem' },
    lg: { padding: '0.4rem 0.9rem', fontSize: '0.85rem' },
  }[size];

  return (
    <span
      className={`status-pill ${isStolen && showPulse ? 'alert-pulse' : ''}`}
      style={{
        ...sizeStyles,
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
        color: config.color,
      }}
      title={config.description}
    >
      <span
        className="badge-dot"
        style={{
          backgroundColor: config.color,
          boxShadow: isStolen ? '0 0 6px #ef4444' : 'none',
        }}
      />
      {config.label}
    </span>
  );
};
