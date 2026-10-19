import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Moon, Search, Settings, Sun, UserRound } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { AuthenticatedImage } from '../common/AuthenticatedImage';

export const TopSecurityBar: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, theme, toggleTheme, unreadNotificationsCount, setIsNotificationDrawerOpen, setIsCommandPaletteOpen, currentGate, signOut } = useSecurity();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const openPage = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <header className="topbar">
      <button className="topbar-search" type="button" onClick={() => setIsCommandPaletteOpen(true)}>
        <Search size={18} /><span>Search assets, owners, codes...</span><kbd>Ctrl + K</kbd>
      </button>
      <div className="topbar-controls">
        <button className="topbar-icon-button notification-button" type="button" onClick={() => setIsNotificationDrawerOpen(true)} aria-label={`Notifications${unreadNotificationsCount ? ` (${unreadNotificationsCount} unread)` : ''}`}>
          <Bell size={20} />{unreadNotificationsCount > 0 && <span className="notification-count">{unreadNotificationsCount}</span>}
        </button>
        <button className="topbar-icon-button" type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="topbar-user-menu" ref={menuRef}>
          <button className="topbar-user-button" type="button" onClick={() => setIsMenuOpen((open) => !open)} aria-expanded={isMenuOpen}>
            <span className="topbar-avatar">{currentUser.avatarUrl
              ? <AuthenticatedImage src={currentUser.avatarUrl} alt={`${currentUser.firstName} ${currentUser.lastName} profile`} />
              : <>{currentUser.firstName[0]}{currentUser.lastName[0]}</>}</span>
            <span className="topbar-user-copy"><strong>{currentUser.firstName} {currentUser.lastName}</strong><small>{currentUser.position}</small></span>
            <ChevronDown size={16} />
          </button>
          {isMenuOpen && <div className="topbar-dropdown">
            <div className="topbar-dropdown-summary"><strong>{currentUser.firstName} {currentUser.lastName}</strong><span>{currentUser.officerId} · {currentGate}</span></div>
            <button type="button" onClick={() => openPage('/profile')}><UserRound size={16} /> Profile</button>
            <button type="button" onClick={() => openPage('/settings')}><Settings size={16} /> Settings</button>
            <button type="button" onClick={() => { void signOut(); openPage('/login'); }}><LogOut size={16} /> Sign out</button>
          </div>}
        </div>
      </div>
    </header>
  );
};
