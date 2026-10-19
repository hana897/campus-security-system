import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertOctagon, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

export const NotificationDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    isNotificationDrawerOpen,
    setIsNotificationDrawerOpen,
    notifications,
    markNotificationRead,
  } = useSecurity();

  if (!isNotificationDrawerOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={() => setIsNotificationDrawerOpen(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          height: '100%',
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Security Alert Center</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>System-wide updates and security events</p>
          </div>
          <button onClick={() => setIsNotificationDrawerOpen(false)} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Notification List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No notifications yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {notifications.map((notif) => {
                const isCritical = notif.type === 'critical';
                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      markNotificationRead(notif.id);
                      if (notif.link) {
                        setIsNotificationDrawerOpen(false);
                        navigate(notif.link);
                      }
                    }}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: notif.read ? 'var(--bg-elevated)' : 'var(--bg-secondary)',
                      border: isCritical ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                      <div style={{ marginTop: '2px' }}>
                        {notif.type === 'critical' && <AlertOctagon size={18} color="#ef4444" />}
                        {notif.type === 'warning' && <AlertTriangle size={18} color="#f59e0b" />}
                        {notif.type === 'info' && <Info size={18} color="#3b82f6" />}
                        {notif.type === 'success' && <CheckCircle2 size={18} color="#10b981" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              color: isCritical ? '#ef4444' : 'var(--text-primary)',
                            }}
                          >
                            {notif.title}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {notif.timeAgo}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
