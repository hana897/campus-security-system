import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Box, CalendarDays, CircleCheck, FileText, Plus, QrCode, ShieldAlert, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AssetStatus } from '../../types';
import { useSecurity } from '../../context/SecurityContext';
import { reportService } from '../../services/reportService';
import { VerificationLog } from '../../types';

const resultStatus = (status: string): AssetStatus => status === 'APPROVED' ? 'AUTHORIZED' : status === 'REJECTED' ? 'UNDER_REVIEW' : status as AssetStatus;

export const DashboardPage: React.FC = () => {
  const { currentUser } = useSecurity();
  const [metrics, setMetrics] = useState<{totalRegisteredAssets:number; authorizedCount:number; lostCount:number; stolenCount:number; ownerCount:number; recentVerifications:VerificationLog[]}>({totalRegisteredAssets:0,authorizedCount:0,lostCount:0,stolenCount:0,ownerCount:0,recentVerifications:[]});
  useEffect(() => { void reportService.getOverviewMetrics().then((data) => setMetrics({totalRegisteredAssets:data.totalRegisteredAssets,authorizedCount:data.authorizedCount,lostCount:data.lostCount || 0,stolenCount:data.stolenCount || 0,ownerCount:data.ownerCount || 0,recentVerifications:data.recentVerifications || []})).catch(() => undefined); }, []);
  const count = (status: AssetStatus) => status === 'AUTHORIZED' ? metrics.authorizedCount : status === 'LOST' ? metrics.lostCount : status === 'STOLEN' ? metrics.stolenCount : 0;
  const recentLogs = metrics.recentVerifications;

  return <div className="dashboard-page">
    <div className="dashboard-welcome"><div><span className="eyebrow">ASSET MANAGEMENT</span><h1>{currentUser.firstName}</h1><p>Here’s the latest activity across campus.</p></div><div className="dashboard-date"><CalendarDays size={20} /><span><strong>{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</strong><small>{new Date().toLocaleDateString(undefined, { weekday: 'long' })}</small></span></div></div>

    <section className="dashboard-stats" aria-label="Asset summary">
      <article className="dashboard-stat"><span className="stat-icon blue"><Box size={20} /></span><div><span className="stat-label">Total assets</span><strong>{metrics.totalRegisteredAssets}</strong><small>Registered on campus</small></div></article>
      <article className="dashboard-stat"><span className="stat-icon green"><CircleCheck size={20} /></span><div><span className="stat-label">Authorized</span><strong>{count('AUTHORIZED')}</strong><small>Approved for campus use</small></div></article>
      <article className="dashboard-stat"><span className="stat-icon amber"><ShieldAlert size={20} /></span><div><span className="stat-label">Lost</span><strong>{count('LOST')}</strong><small>Reported as lost</small></div></article>
      <article className="dashboard-stat"><span className="stat-icon red"><ShieldAlert size={20} /></span><div><span className="stat-label">Stolen</span><strong>{count('STOLEN')}</strong><small>Requires attention</small></div></article>
    </section>

    <div className="dashboard-main-grid">
      <section className="soc-card dashboard-recent-card">
        <div className="section-heading"><div><h2><QrCode size={19} />Recent verification</h2><p>Latest asset checks recorded at campus gates.</p></div><Link to="/verification/history" className="text-link">View all <ArrowRight size={15} /></Link></div>
        <div className="table-scroll"><table className="dashboard-table"><thead><tr><th>Asset</th><th>Asset code</th><th>Owner</th><th>Status</th><th>Verified by</th><th>Checked</th></tr></thead><tbody>{recentLogs.map((log) => <tr key={log.id}><td><strong>{log.assetName}</strong><small>{log.assetSerial}</small></td><td className="font-mono">{log.assetId}</td><td>{log.ownerName}</td><td><StatusBadge status={resultStatus(log.result)} size="sm" /></td><td>{log.officerName}<small>{log.officerId}</small></td><td>{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</td></tr>)}</tbody></table></div>
      </section>
      <aside className="dashboard-side-column">
        <section className="soc-card dashboard-quick-card"><h2>Quick actions</h2><div className="dashboard-quick-grid"><Link to="/assets/new" className="dashboard-quick-link primary"><Plus size={20} /><strong>Add asset</strong><small>Register campus property</small></Link><Link to="/owners" className="dashboard-quick-link"><Users size={20} /><strong>Browse owners</strong><small>Browse campus owners</small></Link><Link to="/verification" className="dashboard-quick-link teal"><QrCode size={20} /><strong>Verify asset</strong><small>Scan or enter an asset code</small></Link><Link to="/reports" className="dashboard-quick-link"><FileText size={20} /><strong>View reports</strong><small>Review campus records</small></Link></div></section>
        <section className="soc-card dashboard-system-card"><div className="dashboard-system-heading"><h2>Asset overview</h2><span>Current register</span></div><div className="dashboard-system-row"><Box size={17} /><span>Registered assets</span><strong>{metrics.totalRegisteredAssets}</strong></div><div className="dashboard-system-row"><CircleCheck size={17} /><span>Authorized</span><strong>{count('AUTHORIZED')}</strong></div><div className="dashboard-system-row"><Users size={17} /><span>Registered owners</span><strong>{metrics.ownerCount}</strong></div><Link to="/assets" className="dashboard-system-link">Open asset register <ArrowUpRight size={15} /></Link></section>
      </aside>
    </div>
  </div>;
};
