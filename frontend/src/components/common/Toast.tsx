import React from 'react';
import { useSecurity, ToastMessage } from '../../context/SecurityContext';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useSecurity();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '400px',
        width: 'calc(100% - 3rem)',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={20} color="#10b981" />;
      case 'warning':
        return <AlertTriangle size={20} color="#f59e0b" />;
      case 'error':
        return <AlertOctagon size={20} color="#ef4444" />;
      default:
        return <Info size={20} color="#3b82f6" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'rgba(16, 185, 129, 0.4)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.4)';
      case 'error':
        return 'rgba(239, 68, 68, 0.6)';
      default:
        return 'rgba(59, 130, 246, 0.4)';
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${getBorderColor()}`,
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1.1rem',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div style={{ marginTop: '2px', flexShrink: 0 }}>{getIcon()}</div>
      <div style={{ flex: 1 }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
          {toast.title}
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{toast.message}</p>
      </div>
      <button
        onClick={onDismiss}
        style={{
          color: 'var(--text-muted)',
          padding: '2px',
          borderRadius: '4px',
          transition: 'color 0.2s',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};
