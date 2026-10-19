import React, { createContext, useContext, useState, useEffect } from 'react';
import { OfficerProfile, UserSettings, NotificationItem, VerificationLog } from '../types';
import { DEFAULT_OFFICER, DEFAULT_SETTINGS } from '../constants';
import { settingsService } from '../services/settingsService';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
}

interface SecurityContextType {
  currentUser: OfficerProfile;
  setCurrentUser: React.Dispatch<React.SetStateAction<OfficerProfile>>;
  isAuthenticated: boolean;
  signIn: (user: OfficerProfile) => void;
  signOut: () => Promise<void>;
  currentGate: string;
  setCurrentGate: (gate: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isNotificationDrawerOpen: boolean;
  setIsNotificationDrawerOpen: (open: boolean) => void;
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  systemTime: string;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<OfficerProfile>(() => authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(localStorage.getItem('soc_token')));
  const [currentGate, setCurrentGate] = useState<string>('Main Gate');
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [systemTime, setSystemTime] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) return;
    void authService.refreshCurrentUser().then(setCurrentUser).catch(() => undefined);
    void settingsService.getSettings().then((saved) => {
      setSettings(saved);
      setTheme(saved.theme === 'dark' ? 'dark' : 'light');
      if (saved.terminal.assignedGate) setCurrentGate(saved.terminal.assignedGate);
    }).catch(() => undefined);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isCurrent = true;
    let hasReportedFailure = false;
    const refreshNotifications = () => {
      void notificationService.getAll().then((latest) => {
        if (isCurrent) {
          setNotifications(latest);
          hasReportedFailure = false;
        }
      }).catch((error: unknown) => {
        if (isCurrent && !hasReportedFailure) {
          console.error('Could not refresh system notifications.', error);
          hasReportedFailure = true;
        }
      });
    };
    refreshNotifications();
    const interval = window.setInterval(refreshNotifications, 10000);

    return () => {
      isCurrent = false;
      window.clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Clock ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setSystemTime(
        now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const signIn = (user: OfficerProfile) => {
    localStorage.setItem('soc_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const signOut = async () => {
    await authService.logout();
    setCurrentUser(DEFAULT_OFFICER);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const handleExpiredSession = () => { void signOut(); };
    window.addEventListener('scsams:unauthorized', handleExpiredSession);
    return () => window.removeEventListener('scsams:unauthorized', handleExpiredSession);
  }, []);

  // Sync theme with DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Global Keyboard Shortcuts (Ctrl+K, F2, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsNotificationDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const next: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    const updated = { ...settings, theme: next };
    setSettings(updated);
    document.documentElement.setAttribute('data-theme', next);
    void settingsService.saveSettings(updated);
  };

  const updateSettings = async (partial: Partial<UserSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    if (partial.theme) setTheme(partial.theme === 'dark' ? 'dark' : 'light');
    await settingsService.saveSettings(updated);
    showToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Security terminal preferences synchronized.',
    });
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    void notificationService.markRead(id).catch(() => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
    });
  };

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <SecurityContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated,
        signIn,
        signOut,
        currentGate,
        setCurrentGate,
        theme,
        toggleTheme,
        settings,
        updateSettings,
        notifications,
        unreadNotificationsCount,
        markNotificationRead,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isNotificationDrawerOpen,
        setIsNotificationDrawerOpen,
        toasts,
        showToast,
        dismissToast,
        systemTime,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
