import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, LayoutDashboard, Package, Users, QrCode, ClipboardList, BarChart3, Settings, UserRound, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { AuthenticatedImage } from '../common/AuthenticatedImage';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assets', label: 'Assets', icon: Package },
  { to: '/owners', label: 'Owners', icon: Users },
  { to: '/verification', label: 'Verification', icon: QrCode },
  { to: '/verification/history', label: 'Verification history', icon: ClipboardList },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

interface NavigationRailProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({ collapsed, onToggleCollapsed }) => {
  const { currentUser } = useSecurity();
  const visibleNavItems = currentUser.role === 'SUPER_ADMIN'
    ? [...navItems.slice(0, 6), { to: '/settings/users', label: 'User Management', icon: Users }, ...navItems.slice(6)]
    : navItems;

  return (
    <aside className={`app-sidebar${collapsed ? ' is-collapsed' : ''}`}>
      <div className="sidebar-top">
        <NavLink to="/dashboard" className="app-brand" aria-label="Campus PC Registration and Exit Verification System overview">
          <span className="app-brand-mark"><Shield size={21} /></span>
          <span className="app-brand-copy"><strong>Campus PC</strong><small>Registration & Exit Verification</small></span>
        </NavLink>
        <button className="sidebar-toggle" type="button" aria-expanded={!collapsed} onClick={onToggleCollapsed} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} title={collapsed ? 'Expand navigation' : 'Collapse navigation'}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="sidebar-section-label">WORKSPACE</div>
      <nav className="app-nav" aria-label="Main navigation">
        {visibleNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end title={collapsed ? label : undefined} aria-label={collapsed ? label : undefined} className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}>
            <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
          </NavLink>
        ))}
        <details className="mobile-more">
          <summary className="app-nav-link"><MoreHorizontal size={19} strokeWidth={1.8} /><span>More</span></summary>
          <div className="mobile-more-panel">
            <div className="mobile-more-title">More sections</div>
            {visibleNavItems.slice(4).map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `mobile-more-link${isActive ? ' active' : ''}`} onClick={(event) => event.currentTarget.closest('details')?.removeAttribute('open')}>
                <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
              </NavLink>
            ))}
          </div>
        </details>
      </nav>

      <div className="sidebar-bottom">
        <NavLink to="/profile" className="sidebar-profile" title={collapsed ? `${currentUser.firstName} ${currentUser.lastName} — Profile` : undefined}>
          <span className="sidebar-avatar">{currentUser.avatarUrl
            ? <AuthenticatedImage src={currentUser.avatarUrl} alt={`${currentUser.firstName} ${currentUser.lastName} profile`} />
            : <>{currentUser.firstName[0]}{currentUser.lastName[0]}</>}</span>
          <span className="sidebar-profile-copy"><strong>{currentUser.firstName} {currentUser.lastName}</strong><small>{currentUser.position}</small></span>
          <UserRound className="sidebar-profile-icon" size={16} />
        </NavLink>
      </div>
    </aside>
  );
};
