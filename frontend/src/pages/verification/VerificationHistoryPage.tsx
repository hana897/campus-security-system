import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetService } from '../../services/assetService';
import { ownerService } from '../../services/ownerService';
import { verificationService } from '../../services/verificationService';
import { lookupService } from '../../services/lookupService';
import { AuthenticatedImage } from '../../components/common/AuthenticatedImage';
import { Asset, Owner, VerificationLog } from '../../types';
import { useSecurity } from '../../context/SecurityContext';
import { CalendarDays, ChevronLeft, ChevronRight, Download, Eye, Home, RotateCcw, Search, ShieldCheck, UserRound } from 'lucide-react';

const today = new Date();
const localDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const weekAgo = new Date(today);
weekAgo.setDate(today.getDate() - 7);
const statusLabel = (status: VerificationLog['result']) => status === 'UNDER_REVIEW' ? 'INVESTIGATION' : status;

export const VerificationHistoryPage: React.FC = () => {
  const { showToast } = useSecurity();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [gates, setGates] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [draftFrom, setDraftFrom] = useState(localDate(weekAgo));
  const [draftTo, setDraftTo] = useState(localDate(today));
  const [draftStatus, setDraftStatus] = useState('ALL');
  const [draftGate, setDraftGate] = useState('ALL');
  const [draftOfficer, setDraftOfficer] = useState('ALL');
  const [filters, setFilters] = useState({ from: localDate(weekAgo), to: localDate(today), status: 'ALL', gate: 'ALL', officer: 'ALL' });

  useEffect(() => {
    void lookupService.getAll().then((lookups) => setGates(lookups.gates)).catch(() => undefined);
    Promise.all([verificationService.getHistory(), assetService.getAll(), ownerService.getAll()]).then(([history, allAssets, allOwners]) => {
      setLogs(history);
      setAssets(allAssets);
      setOwners(allOwners);
    });
  }, []);

  const officerNames = useMemo(() => [...new Set(logs.map((log) => log.officerName))].sort(), [logs]);
  const filteredLogs = useMemo(() => logs.filter((log) => {
    const logDate = log.timestamp.slice(0, 10);
    return (!filters.from || logDate >= filters.from) && (!filters.to || logDate <= filters.to) &&
      (filters.status === 'ALL' || log.result === filters.status) &&
      (filters.gate === 'ALL' || log.gate === filters.gate) &&
      (filters.officer === 'ALL' || log.officerName === filters.officer);
  }), [filters, logs]);
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const visibleLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  const applyFilters = () => {
    setFilters({ from: draftFrom, to: draftTo, status: draftStatus, gate: draftGate, officer: draftOfficer });
    setPage(1);
  };
  const resetFilters = () => {
    const initial = { from: localDate(weekAgo), to: localDate(today), status: 'ALL', gate: 'ALL', officer: 'ALL' };
    setDraftFrom(initial.from); setDraftTo(initial.to); setDraftStatus('ALL'); setDraftGate('ALL'); setDraftOfficer('ALL'); setFilters(initial); setPage(1);
  };
  const exportCsv = () => {
    const header = 'Timestamp,Asset,Asset Code,Owner,Status,Verified By,Gate,Method\n';
    const rows = filteredLogs.map((log) => [log.timestamp, log.assetName, log.assetId, log.ownerName, log.result, log.officerName, log.gate, log.method].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blobUrl = URL.createObjectURL(new Blob([header + rows], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `verification-history-${localDate(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(blobUrl);
    showToast({ type: 'success', title: 'History exported', message: `Exported ${filteredLogs.length} verification records.` });
  };

  const assetForLog = (log: VerificationLog) => assets.find((asset) => asset.id === log.assetId);
  const ownerForLog = (log: VerificationLog) => owners.find((owner) => owner.universityId === log.ownerId);
  const displayDate = (timestamp: string) => {
    const value = new Date(timestamp);
    return <>{value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}<small>{value.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</small></>;
  };

  return (
    <div className="content-page history-page">
      <div className="asset-breadcrumb"><button type="button" onClick={() => navigate('/')} aria-label="Home"><Home size={16} /></button><ChevronRight size={14} /><span>Verification History</span></div>
      <header className="history-heading"><h1>Verification History</h1><p>View all asset verification records and their status.</p></header>

      <section className="soc-card history-filter-card" aria-label="History filters">
        <label className="history-filter-field history-date-field"><span><CalendarDays size={16} /> Date Range</span><div className="history-date-inputs"><input aria-label="Start date" type="date" value={draftFrom} max={draftTo || undefined} onChange={(event) => setDraftFrom(event.target.value)} /><span>–</span><input aria-label="End date" type="date" value={draftTo} min={draftFrom || undefined} onChange={(event) => setDraftTo(event.target.value)} /></div></label>
        <label className="history-filter-field"><span><ShieldCheck size={17} /> Status</span><select className="soc-input" value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)}><option value="ALL">All Statuses</option><option value="AUTHORIZED">Authorized</option><option value="LOST">Lost</option><option value="STOLEN">Stolen</option><option value="UNDER_REVIEW">Investigation</option><option value="RECOVERED">Recovered</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></select></label>
        <label className="history-filter-field"><span><CalendarDays size={16} /> Gate</span><select className="soc-input" value={draftGate} onChange={(event) => setDraftGate(event.target.value)}><option value="ALL">All Gates</option>{gates.map((gate) => <option key={gate} value={gate}>{gate}</option>)}</select></label>
        <label className="history-filter-field"><span><UserRound size={17} /> Officer</span><select className="soc-input" value={draftOfficer} onChange={(event) => setDraftOfficer(event.target.value)}><option value="ALL">All Officers</option>{officerNames.map((officer) => <option key={officer}>{officer}</option>)}</select></label>
        <div className="history-filter-actions"><button type="button" onClick={applyFilters} className="soc-btn soc-btn-primary"><Search size={16} /> Apply Filters</button><button type="button" onClick={resetFilters} className="soc-btn soc-btn-outline"><RotateCcw size={16} /> Reset</button></div>
      </section>

      <section className="soc-card history-table-card">
        <div className="history-table-toolbar"><span>Total Records: <strong>{filteredLogs.length}</strong></span><button type="button" onClick={exportCsv} className="soc-btn soc-btn-outline"><Download size={16} /> Export</button></div>
        <div className="history-table-scroll"><table className="history-table"><thead><tr><th>Date &amp; Time</th><th>Asset</th><th>Asset Code</th><th>Owner</th><th>Status</th><th>Verified By</th><th>Gate</th><th>Action</th></tr></thead>
          <tbody>{visibleLogs.map((log) => {
            const asset = assetForLog(log);
            const owner = ownerForLog(log);
            const state = statusLabel(log.result);
            return <tr key={log.id}>
              <td className="history-date-cell">{displayDate(log.timestamp)}</td>
              <td><div className="history-asset-cell">{asset?.photoUrl ? <img src={asset.photoUrl} alt="" /> : <span className="history-asset-placeholder">▣</span>}<div><strong>{log.assetName}</strong><small>{asset?.category || log.method.replace('_', ' ')}</small></div></div></td>
              <td className="history-code-cell">{log.assetId}</td>
              <td><div className="history-owner-cell"><span className="history-avatar">{owner?.avatarUrl ? <AuthenticatedImage src={owner.avatarUrl} alt="" /> : <span>{log.ownerName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>}</span><div><strong>{log.ownerName}</strong><small>{owner?.department || log.ownerId}</small></div></div></td>
              <td><span className={`history-status status-${log.result.toLowerCase().replace('_', '-')}`}><i />{state}</span></td>
              <td><div className="history-officer-cell"><strong>{log.officerName}</strong><small>{log.officerId}</small></div></td>
              <td>{log.gate}</td>
              <td><button type="button" className="history-view-button" onClick={() => navigate(`/assets/${log.assetId}`)}><Eye size={15} /> View</button></td>
            </tr>;
          })}
          {visibleLogs.length === 0 && <tr><td className="history-empty" colSpan={8}>No verification records match these filters.</td></tr>}
          </tbody></table></div>
        <div className="history-pagination"><button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={17} /></button><span>Page {page} of {totalPages}</span><button type="button" aria-label="Next page" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronRight size={17} /></button></div>
      </section>
    </div>
  );
};
