import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Activity, ArrowRight, BadgeCheck, CalendarDays, Check, Clock3, Edit3, KeyRound, LockKeyhole, Mail, MapPin, Phone, Shield, UserRound } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { OfficerProfile, VerificationLog } from '../../types';
import { profileService } from '../../services/profileService';
import { verificationService } from '../../services/verificationService';
import { AuthenticatedImage } from '../../components/common/AuthenticatedImage';

type ProfileTab = 'Personal information' | 'Role & permissions' | 'Security' | 'Settings';

export const ProfilePage: React.FC = () => {
  const { currentUser, setCurrentUser, currentGate, showToast } = useSecurity();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProfileTab>('Personal information');
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(currentUser.firstName);
  const [lastName, setLastName] = useState(currentUser.lastName);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone);
  const [avatarFile, setAvatarFile] = useState<File | undefined>();
  const [recentActivity, setRecentActivity] = useState<VerificationLog[]>([]);
  const avatarInput = useRef<HTMLInputElement>(null);

  useEffect(() => { void verificationService.getHistory().then((history) => setRecentActivity(history.slice(0, 5))).catch(() => setRecentActivity([])); }, []);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const updated = await profileService.updateProfile({ firstName, lastName, email, phone }, avatarFile);
      setCurrentUser(updated);
      setAvatarFile(undefined);
      setEditing(false);
      showToast({ type: 'success', title: 'Profile updated', message: 'Your profile information has been saved.' });
    } catch {
      showToast({ type: 'error', title: 'Unable to save', message: 'Please try again.' });
    }
  };

  const saveAvatar = async () => {
    if (!avatarFile) { avatarInput.current?.click(); return; }
    try {
      const updated = await profileService.updateProfile({}, avatarFile);
      setCurrentUser(updated);
      setAvatarFile(undefined);
      showToast({ type: 'success', title: 'Profile picture updated', message: 'Your new picture is now saved to your account.' });
    } catch (error) {
      showToast({ type: 'error', title: 'Unable to update picture', message: (error as { message?: string }).message || 'Please try again.' });
    }
  };

  const handleAvatarSelected = async (file?: File) => {
    if (!file) return;
    setAvatarFile(file);
    try {
      const updated = await profileService.updateProfile({}, file);
      setCurrentUser(updated);
      setAvatarFile(undefined);
      showToast({ type: 'success', title: 'Profile picture saved', message: 'Your picture is saved to your account and database.' });
    } catch (error) {
      setAvatarFile(undefined);
      showToast({ type: 'error', title: 'Picture upload failed', message: (error as { message?: string }).message || 'The profile picture could not be saved.' });
    }
  };

  const fields = [
    ['Full name', `${currentUser.firstName} ${currentUser.lastName}`],
    ['Employee ID', currentUser.officerId],
    ['Email address', currentUser.email],
    ['Role', currentUser.position],
    ['Phone number', currentUser.phone],
    ['Campus', currentUser.campus],
    ['Department', currentUser.department],
    ['Gate assignment', currentGate],
    ['Position', currentUser.position],
    ['Status', currentUser.status.replace('_', ' ')],
  ];

  const tabs: { label: ProfileTab; icon: React.ElementType }[] = [
    { label: 'Personal information', icon: UserRound },
    { label: 'Role & permissions', icon: Shield },
    { label: 'Security', icon: LockKeyhole },
    { label: 'Settings', icon: Activity },
  ];

  return (
    <div className="profile-page">
      <div className="breadcrumbs"><Link to="/dashboard" aria-label="Dashboard">⌂</Link><span>›</span><span>Profile</span></div>

      <section className="profile-hero">
        <div className="profile-identity">
          <button type="button" className="profile-avatar-large" onClick={() => avatarInput.current?.click()} aria-label="Change profile picture">{avatarFile ? <img src={URL.createObjectURL(avatarFile)} alt="Profile preview" /> : currentUser.avatarUrl ? <AuthenticatedImage src={currentUser.avatarUrl} alt="Profile" /> : <>{currentUser.firstName[0]}{currentUser.lastName[0]}</>}<span className="profile-avatar-camera"><UserRound size={16} /></span></button><input ref={avatarInput} hidden type="file" accept="image/*" onChange={(event) => { void handleAvatarSelected(event.target.files?.[0]); event.currentTarget.value = ''; }} />
          <div className="profile-identity-copy">
            <h1>{currentUser.firstName} {currentUser.lastName}</h1>
            <p className="profile-role">{currentUser.position}</p>
            <div className="profile-contact"><span><Mail size={16} />{currentUser.email}</span><span><Phone size={16} />{currentUser.phone}</span><span><MapPin size={16} />{currentUser.department}</span><span><BadgeCheck size={16} />{currentUser.officerId}</span></div>
          </div>
        </div>
        <div className="profile-hero-aside">
          <span className={`profile-status ${currentUser.status === 'ACTIVE' ? 'is-active' : ''}`}><i />{currentUser.status.replace('_', ' ')}</span>
          <div className="profile-date-line"><CalendarDays size={16} /><span><small>Account created</small><strong>{new Date(currentUser.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</strong></span></div>
          <div className="profile-hero-actions"><button className="soc-btn soc-btn-primary" onClick={() => setEditing(true)}><Edit3 size={16} />Edit profile</button><button className="soc-btn soc-btn-secondary" onClick={() => { setActiveTab('Security'); navigate('/settings/security'); }}><KeyRound size={16} />Change password</button></div>
        </div>
      </section>

      <nav className="profile-tabs" aria-label="Profile sections">
        {tabs.map(({ label, icon: Icon }) => <button key={label} type="button" className={activeTab === label ? 'active' : ''} onClick={() => { setActiveTab(label); if (label === 'Settings') navigate('/settings'); }}><Icon size={17} />{label}</button>)}
      </nav>

      <div className="profile-content-grid">
        <section className="soc-card profile-info-card">
          <div className="section-heading"><div><h2><UserRound size={19} />{activeTab}</h2><p>Information associated with your campus account.</p></div></div>
          {activeTab === 'Personal information' && <div className="profile-fields">{fields.map(([label, value]) => <div className="profile-field" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}
          {activeTab === 'Role & permissions' && <div className="profile-tab-content"><h3>{currentUser.role === 'SUPER_ADMIN' ? 'Super Admin' : currentUser.position}</h3><p>{currentUser.email} · {currentUser.department} · Clearance level {currentUser.clearanceLevel}</p><ul>{(currentUser.role === 'SUPER_ADMIN' ? ['Create, activate, and disable administrator accounts', 'Access system settings and security controls', 'Register and manage campus assets', 'Update personal profile and sign-in credentials'] : currentUser.role === 'ADMIN' ? ['Register and manage campus assets', 'Review asset verification history', 'Update personal profile and sign-in credentials'] : ['Verify registered campus assets', 'Review asset verification history', 'Record approved asset exits']).map((permission) => <li key={permission}><Check size={15} />{permission}</li>)}</ul>{currentUser.role === 'SUPER_ADMIN' && <button type="button" className="soc-btn soc-btn-primary" onClick={() => navigate('/settings/users')}>Open User Management</button>}</div>}
          {activeTab === 'Security' && <div className="profile-tab-content"><h3>Account security</h3><p>Manage your sign-in credentials and account access.</p><button className="soc-btn soc-btn-secondary" onClick={() => navigate('/settings/security')}><KeyRound size={16} />Open password settings</button></div>}
          {activeTab === 'Settings' && <div className="profile-tab-content"><h3>Profile preferences</h3><p>Update notifications, appearance and account preferences.</p><button className="soc-btn soc-btn-secondary" onClick={() => navigate('/settings')}><ArrowRight size={16} />Open settings</button></div>}
        </section>

        <section className="soc-card profile-photo-card">
          <div className="section-heading"><div><h2><UserRound size={19} />Profile picture</h2></div></div>
          <div className="profile-photo-row"><button type="button" className="profile-avatar-small" onClick={() => avatarInput.current?.click()}>{avatarFile ? <img src={URL.createObjectURL(avatarFile)} alt="Profile preview" /> : currentUser.avatarUrl ? <AuthenticatedImage src={currentUser.avatarUrl} alt="Profile" /> : <>{currentUser.firstName[0]}{currentUser.lastName[0]}</>}</button><div><p>Your profile helps colleagues recognize your campus account.</p><div className="profile-hero-actions"><button type="button" className="soc-btn soc-btn-primary" onClick={() => avatarInput.current?.click()}>Choose picture</button>{avatarFile && <button type="button" className="soc-btn soc-btn-secondary" onClick={() => void saveAvatar()}>Save picture</button>}</div></div></div>
        </section>

        <section className="soc-card profile-activity-card">
          <div className="section-heading"><div><h2><Clock3 size={19} />Recent activity</h2><p>Your latest campus system activity.</p></div></div>
          <div className="profile-activity-list">{recentActivity.map((log) => <article className="profile-activity-item" key={log.id}><span className="profile-activity-icon"><Shield size={16} /></span><div><strong>Verified asset</strong><p>{log.assetName} · {log.result.replace('_', ' ')}</p></div><time>{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</time></article>)}{recentActivity.length === 0 && <p>No verification activity has been recorded yet.</p>}</div>
          <Link className="profile-activity-link" to="/verification/history">View verification history <ArrowRight size={15} /></Link>
        </section>

        <section className="soc-card profile-tip-card"><span className="profile-tip-icon"><Shield size={20} /></span><p>Keep your profile information up to date to ensure smooth access to campus security tools.</p></section>
      </div>

      {editing && <div className="profile-modal-backdrop" onClick={() => setEditing(false)}><section className="soc-card profile-edit-modal" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title" onClick={(event) => event.stopPropagation()}><div className="profile-modal-heading"><div><h2 id="profile-edit-title">Edit profile</h2><p>Update your contact information.</p></div><button type="button" aria-label="Close" onClick={() => setEditing(false)}>×</button></div><form onSubmit={saveProfile}><div className="profile-edit-name"><label>First name<input className="soc-input" value={firstName} onChange={(event) => setFirstName(event.target.value)} required /></label><label>Last name<input className="soc-input" value={lastName} onChange={(event) => setLastName(event.target.value)} required /></label></div><label>Email address<input className="soc-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Phone number<input className="soc-input" value={phone} onChange={(event) => setPhone(event.target.value)} required /></label><div className="profile-modal-actions"><button type="button" className="soc-btn soc-btn-secondary" onClick={() => setEditing(false)}>Cancel</button><button type="submit" className="soc-btn soc-btn-primary">Save changes</button></div></form></section></div>}
    </div>
  );
};
