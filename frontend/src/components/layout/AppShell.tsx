import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { NavigationRail } from './NavigationRail';
import { TopSecurityBar } from './TopSecurityBar';
import { CommandPalette } from './CommandPalette';
import { NotificationDrawer } from './NotificationDrawer';
import { ToastContainer } from '../common/Toast';

export const AppShell: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('scsams_sidebar_collapsed') === 'true');
  const toggleSidebar = () => setIsSidebarCollapsed((collapsed) => {
    const next = !collapsed;
    localStorage.setItem('scsams_sidebar_collapsed', String(next));
    return next;
  });

  return (
    <div className={`app-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`} style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Navigation Rail */}
      <NavigationRail collapsed={isSidebarCollapsed} onToggleCollapsed={toggleSidebar} />

      {/* Main Content Area */}
      <div
        className="app-main"
        style={{
          marginLeft: 'var(--nav-rail-width)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <TopSecurityBar />
        <main className="app-main-content" style={{ flex: 1, padding: '1.75rem', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Overlays */}
      <CommandPalette />
      <NotificationDrawer />
      <ToastContainer />
    </div>
  );
};
