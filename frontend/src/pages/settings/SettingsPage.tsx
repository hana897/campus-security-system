import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSecurity } from '../../context/SecurityContext';
import {
  User,
  Shield,
  Bell,
  Lock,
  AlertTriangle,
  ShieldCheck,
  Users,
  KeyRound,
  Search,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Eye,
  EyeOff,
  UserPlus,
  Check,
  Settings as SettingsIcon,
} from 'lucide-react';
import { adminUserService, ManagedAdminUser } from '../../services/adminUserService';
import { authService } from '../../services/authService';
import { AuthenticatedImage } from '../../components/common/AuthenticatedImage';

type SettingsTab =
  | 'account'
  | 'security'
  | 'notifications'
  | 'users';

interface ManagedUser {
  id: string; name: string; email: string; role: string; phone: string; status: 'Active' | 'Inactive'; lastLogin: string; avatarUrl?: string;
}

const toManagedUser = (user: ManagedAdminUser): ManagedUser => ({
  id: user.id, name: user.name, email: user.email, role: user.role === 'ADMIN' ? 'Admin' : user.role,
  phone: user.phone, status: user.status === 'ACTIVE' ? 'Active' : 'Inactive', lastLogin: user.lastLogin, avatarUrl: user.avatarUrl,
});

export const SettingsPage: React.FC = () => {
  const { settings, showToast, currentUser, signOut } = useSecurity();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<SettingsTab>(currentUser.role === 'SUPER_ADMIN' ? 'users' : 'account');
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showInitialPassword, setShowInitialPassword] = useState(false);
  const [userMenuId, setUserMenuId] = useState<string | null>(null);

  // Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notifications
  const [lostAlert, setLostAlert] = useState(settings.notifications.lostAssetAlert);
  const [ownerMismatch, setOwnerMismatch] = useState(settings.notifications.ownerMismatch);
  const [inAppChannel, setInAppChannel] = useState(settings.notifications.channels.inApp);
  const [emailChannel, setEmailChannel] = useState(settings.notifications.channels.email);

  const navItems = [
    { id: 'account', label: 'Account', desc: 'Officer credentials and personal record', icon: User },
    { id: 'security', label: 'Password Change', desc: 'Change your sign-in password', icon: Lock },
    { id: 'notifications', label: 'Notifications', desc: 'Alert thresholds and channels', icon: Bell },
    ...(currentUser.role === 'SUPER_ADMIN' ? [{ id: 'users', label: 'User Management', desc: 'Manage administrator accounts', icon: Users }] : []),
  ];

  useEffect(() => {
    if (!tab) return;

    if (navItems.some((item) => item.id === tab)) {
      setActiveTab(tab as SettingsTab);
    } else {
      navigate('/settings', { replace: true });
    }
  }, [tab, currentUser.role, navigate]);

  useEffect(() => {
    if (currentUser.role !== 'SUPER_ADMIN') return;
    adminUserService.list().then((users) => setManagedUsers(users.map(toManagedUser))).catch((error: { message?: string }) => {
      showToast({ type: 'error', title: 'Could not load administrators', message: error.message || 'Check that the API is running.' });
    });
  }, [currentUser.role]);

  const visibleUsers = useMemo(() => managedUsers.filter((user) => {
    const query = userSearch.trim().toLowerCase();
    return (!query || `${user.name} ${user.email} ${user.phone}`.toLowerCase().includes(query)) &&
      (userRoleFilter === 'ALL' || user.role === userRoleFilter) &&
      (userStatusFilter === 'ALL' || user.status.toUpperCase() === userStatusFilter);
  }), [managedUsers, userSearch, userRoleFilter, userStatusFilter]);

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault();
    const [firstName, ...lastParts] = newUserName.trim().split(/\s+/);
    try {
      const created = await adminUserService.create({ firstName, lastName: lastParts.join(' '), email: newUserEmail, phone: newUserPhone, password: newUserPassword });
      setManagedUsers((users) => [toManagedUser(created), ...users]);
      setNewUserName(''); setNewUserEmail(''); setNewUserPhone(''); setNewUserPassword('');
      setShowCreateAdmin(false);
      showToast({ type: 'success', title: 'Administrator created', message: `${created.email} can now sign in with the password you set.` });
    } catch (error) { showToast({ type: 'error', title: 'Could not create administrator', message: (error as { message?: string }).message || 'Check the details and try again.' }); }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const valid = newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) && /\d/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword);
    if (!currentPassword || !valid || newPassword !== confirmPassword) {
      showToast({ type: 'error', title: 'Check password details', message: !currentPassword ? 'Enter your current password.' : !valid ? 'Use 8 characters with uppercase, lowercase, a number, and a symbol.' : 'The new passwords do not match.' });
      return;
    }
    try {
      await authService.changePassword(currentPassword, newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      await signOut();
      navigate('/login');
    } catch (error) { showToast({ type: 'error', title: 'Password change failed', message: (error as { message?: string }).message || 'Check your current password and try again.' }); }
  };

  return (
    <div className="content-page settings-page">
      {/* Title */}
      <div className="settings-page-heading">
        <span><SettingsIcon size={25} /></span><div><h1>{activeTab === 'users' && currentUser.role === 'SUPER_ADMIN' ? 'Super Admin Console' : 'Settings'}</h1>
        <p>{activeTab === 'users' && currentUser.role === 'SUPER_ADMIN' ? 'Create and manage administrator access across the campus system.' : 'Manage account access, notifications and users.'}</p></div>
      </div>

      {/* 2-Column Layout */}
      <div className="settings-layout" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Settings Sidebar */}
        <div className="soc-card settings-tabs" style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as SettingsTab)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(37, 99, 235, 0.4)' : '1px solid transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ marginTop: '2px', color: isActive ? '#2563eb' : 'var(--text-muted)' }}>
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isActive ? '#1d4ed8' : 'var(--text-primary)' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Settings Content */}
        <div className={`soc-card settings-content ${activeTab === 'users' ? 'settings-content-users' : ''}`} style={{ minHeight: '520px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {activeTab === 'users' && (
            <div className={`settings-user-management${showCreateAdmin ? '' : ' settings-user-management-list-only'}`}>
              <section className="soc-card settings-user-list-card">
                <header className="settings-user-list-heading"><div><Users size={30} /><span><strong>Administrator Management</strong><small>Only the super admin can create or disable administrators. Each administrator signs in with their email and password.</small></span></div><button type="button" className="soc-btn soc-btn-primary" onClick={() => setShowCreateAdmin(true)}><Plus size={16} /> Create Admin</button></header>
                <div className="settings-user-filters"><label className="settings-user-search"><Search size={16} /><input placeholder="Search admins..." value={userSearch} onChange={(event) => setUserSearch(event.target.value)} /></label><select className="soc-input" value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value)}><option value="ALL">All Roles</option><option>Admin</option></select><select className="soc-input" value={userStatusFilter} onChange={(event) => setUserStatusFilter(event.target.value)}><option value="ALL">All Status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>
                <div className="settings-users-table-wrap"><table className="settings-users-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Phone Number</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead><tbody>
                  {visibleUsers.map((user, index) => <tr key={user.id}><td><div className="settings-user-name"><span className={`settings-user-avatar avatar-${index % 5}`}>{user.avatarUrl ? <AuthenticatedImage src={user.avatarUrl} alt={`${user.name} profile`} /> : user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><strong>{user.name}</strong></div></td><td className="settings-user-email">{user.email}</td><td><span className={`settings-role-pill role-${user.role.toLowerCase().replace(/\s+/g, '-')}`}>{user.role}</span></td><td>{user.phone}</td><td><span className={`settings-user-status ${user.status.toLowerCase()}`}><i />{user.status}</span></td><td className="settings-last-login">{user.lastLogin}</td><td className="settings-user-actions"><button type="button" aria-label={`Actions for ${user.name}`} onClick={() => setUserMenuId(userMenuId === user.id ? null : user.id)}><MoreVertical size={17} /></button>{userMenuId === user.id && <div className="settings-user-menu"><button type="button" onClick={async () => { try { await adminUserService.setActive(user.id, user.status !== 'Active'); setManagedUsers((all) => all.map((item) => item.id === user.id ? { ...item, status: item.status === 'Active' ? 'Inactive' : 'Active' } : item)); } catch (error) { showToast({ type: 'error', title: 'Could not update admin', message: (error as { message?: string }).message || 'Try again.' }); } setUserMenuId(null); }}>Set {user.status === 'Active' ? 'inactive' : 'active'}</button><button type="button" onClick={async () => { try { await adminUserService.disable(user.id); setManagedUsers((all) => all.filter((item) => item.id !== user.id)); } catch (error) { showToast({ type: 'error', title: 'Could not disable admin', message: (error as { message?: string }).message || 'Try again.' }); } setUserMenuId(null); }}>Disable admin</button></div>}</td></tr>)}
                  {visibleUsers.length === 0 && <tr><td colSpan={7} className="settings-users-empty">No users match this search and filter.</td></tr>}
                </tbody></table></div>
              </section>
              {showCreateAdmin && <form className="soc-card settings-create-user-card" onSubmit={createUser}>
                <header><UserPlus size={23} /><div><strong>Create Administrator</strong><p>Set up the admin’s account and sign-in password.</p></div><button type="button" className="settings-create-close" aria-label="Close create administrator form" onClick={() => setShowCreateAdmin(false)}>×</button></header>
                <label>Full Name <b>*</b><div className="settings-form-icon"><User size={16} /><input autoFocus className="soc-input" placeholder="Enter full name" value={newUserName} onChange={(event) => setNewUserName(event.target.value)} required /></div></label>
                <label>Email Address <b>*</b><div className="settings-form-icon"><Mail size={16} /><input type="email" className="soc-input" placeholder="admin@campus.edu" value={newUserEmail} onChange={(event) => setNewUserEmail(event.target.value)} required /></div></label>
                <label>Phone Number <b>*</b><div className="settings-form-icon"><Phone size={16} /><input type="tel" inputMode="tel" maxLength={15} className="soc-input" placeholder="Enter phone number" value={newUserPhone} onChange={(event) => setNewUserPhone(event.target.value)} required /></div></label>
                <label>Role <b>*</b><div className="settings-form-icon"><ShieldCheck size={16} /><input className="soc-input" value="Administrator" readOnly /></div></label>
                <label>Initial Password <b>*</b><div className="settings-form-icon"><Lock size={16} /><input type={showInitialPassword ? 'text' : 'password'} autoComplete="new-password" className="soc-input settings-password-input" placeholder="Set an initial password" value={newUserPassword} onChange={(event) => setNewUserPassword(event.target.value)} minLength={8} required /><button type="button" className="settings-password-toggle" aria-label={showInitialPassword ? 'Hide initial password' : 'Show initial password'} aria-pressed={showInitialPassword} onClick={() => setShowInitialPassword((show) => !show)}>{showInitialPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
                <div className="settings-status-choice"><span>Status</span><span><i /> Active</span></div>
                <div className="settings-create-user-actions"><button type="submit" className="soc-btn soc-btn-primary"><UserPlus size={15} /> Create Admin</button><button type="button" className="soc-btn soc-btn-outline" onClick={() => setShowCreateAdmin(false)}>Cancel</button></div>
              </form>}
            </div>
          )}

          {(activeTab === 'users' || activeTab === 'security') && <section className="soc-card settings-password-card"><header><Lock size={27} /><div><strong>Password Change</strong><p>Keep your account secure by changing your password regularly.</p></div></header><div className="settings-password-layout"><form className="settings-password-form" onSubmit={changePassword}><label>Current Password <b>*</b><div className="settings-form-icon"><Lock size={15} /><input type="password" className="soc-input" placeholder="Enter current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></div></label><div className="settings-password-row"><label>New Password <b>*</b><div className="settings-form-icon"><Lock size={15} /><input type="password" className="soc-input" placeholder="Enter new password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></div></label><label>Confirm New Password <b>*</b><div className="settings-form-icon"><Lock size={15} /><input type="password" className="soc-input" placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></div></label></div><button type="submit" className="soc-btn soc-btn-primary"><Lock size={15} /> Change Password</button></form><div className="settings-password-tips"><article><h4><ShieldCheck size={17} /> Password Requirements</h4>{['At least 8 characters', 'One uppercase letter', 'One lowercase letter', 'One number', 'One special character'].map((item) => <p key={item}><Check size={14} />{item}</p>)}</article><article><h4><KeyRound size={17} /> Security Tips</h4>{['Use a strong and unique password.', 'Do not share your password with others.', 'Change your password regularly.', 'Enable two-factor authentication if available.'].map((item) => <p key={item}><Check size={14} />{item}</p>)}</article></div></div></section>}

          {/* TAB: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Security Alerts & Broadcasts</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Configure what security events trigger priority notifications
                </p>
              </div>

              {/* Critical warning banner */}
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>
                  <AlertTriangle size={18} /> CRITICAL SECURITY DIRECTIVE
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  By campus security protocol, <strong>STOLEN ASSET INTERCEPTIONS</strong> and <strong>GATE BREACH ALERTS</strong> are permanently enforced and cannot be silenced by terminal operators.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem' }}>Lost Asset Flagged Alert</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Notify when someone presents an item reported lost.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={lostAlert}
                    onChange={(e) => setLostAlert(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem' }}>Carrier Mismatch Warning</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Alert if carrier student ID does not match registered owner record.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={ownerMismatch}
                    onChange={(e) => setOwnerMismatch(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <section className="soc-card" style={{ padding: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '.3rem' }}>Signed-in account</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '.8rem', marginBottom: '1rem' }}>Manage your own account details and credentials.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '.8rem' }}>
                {[['Name', `${currentUser.firstName} ${currentUser.lastName}`], ['Email', currentUser.email], ['Role', currentUser.role === 'SUPER_ADMIN' ? 'Super Admin' : currentUser.position], ['Department', currentUser.department], ['Account status', currentUser.status], ['Member since', new Date(currentUser.joinedAt).toLocaleDateString()]].map(([label, value]) => <div key={label} style={{ padding: '.85rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}><small style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '.25rem' }}>{label}</small><strong style={{ fontSize: '.85rem' }}>{value || '—'}</strong></div>)}
              </div>
              <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <button type="button" className="soc-btn soc-btn-primary" onClick={() => navigate('/profile')}>Edit profile</button>
                <button type="button" className="soc-btn soc-btn-secondary" onClick={() => setActiveTab('security')}>Change password</button>
                {currentUser.role === 'SUPER_ADMIN' && <button type="button" className="soc-btn soc-btn-secondary" onClick={() => setActiveTab('users')}>Manage administrators</button>}
              </div>
            </section>
          )}
        </div>
      </div>

    </div>
  );
};
