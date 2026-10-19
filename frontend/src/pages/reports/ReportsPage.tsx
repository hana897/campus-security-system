import React, { useEffect, useState } from 'react';
import { reportService, ReportAsset, ReportOverview } from '../../services/reportService';
import { AlertTriangle, ArrowUpRight, Box, CheckCircle2, ClipboardCheck, Download, FileCheck2, FileSpreadsheet, ShieldAlert, ShieldCheck, Users, Zap } from 'lucide-react';

interface ReportMetrics {
  todayVerifications: number;
  successfulVerificationsToday: number;
  authorizedCount: number;
  flaggedCount: number;
  interceptions: number;
  totalRegisteredAssets: number;
  activeSecurityAccounts: number;
}

export const ReportsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [assets, setAssets] = useState<ReportAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let isCurrent = true;
    const refreshReport = async () => {
      try {
        const report: ReportOverview = await reportService.getOverviewMetrics();
        if (!isCurrent) return;
        setMetrics(report);
        setAssets(report.assets);
        setLastUpdated(new Date());
        setPageError('');
      } catch (error: unknown) {
        if (!isCurrent) return;
        const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'Unable to load the report data.';
        setPageError(message);
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    void refreshReport();
    const refreshInterval = window.setInterval(() => void refreshReport(), 30000);
    return () => {
      isCurrent = false;
      window.clearInterval(refreshInterval);
    };
  }, []);

  const exportReport = async (format: 'pdf' | 'csv') => {
    setExporting(format);
    setPageError('');
    try {
      await reportService.download(format);
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : `Unable to export the ${format.toUpperCase()} report.`;
      setPageError(message);
    } finally {
      setExporting(null);
    }
  };

  const highlights = [
    { label: 'Verifications Today', value: metrics?.todayVerifications ?? null, note: 'Gate checks completed', icon: ClipboardCheck, color: 'blue' },
    { label: 'Authorized Assets', value: metrics?.authorizedCount ?? null, note: 'Currently authorized in inventory', icon: ShieldCheck, color: 'green' },
    { label: 'Flagged Assets', value: metrics?.flaggedCount ?? null, note: 'Require additional review', icon: AlertTriangle, color: 'amber' },
    { label: 'Interceptions', value: metrics?.interceptions ?? null, note: 'Security alerts handled', icon: ShieldAlert, color: 'red' },
  ];

  const snapshot = [
    { label: 'Registered Assets', value: metrics?.totalRegisteredAssets ?? null, icon: Box, color: 'blue' },
    { label: 'Active Security Accounts', value: metrics?.activeSecurityAccounts ?? null, icon: Users, color: 'violet' },
    { label: 'Successful Checks Today', value: metrics?.todayVerifications ? `${Math.round((metrics.successfulVerificationsToday / metrics.todayVerifications) * 100)}%` : metrics ? '—' : null, icon: CheckCircle2, color: 'green' },
  ];

  return (
    <div className="content-page reports-page">
      <header className="reports-page-heading"><div><span className="reports-heading-icon"><FileCheck2 size={22} /></span><div><h1>Reports</h1><p>Campus security at a glance</p></div></div><div className="reports-heading-actions"><button className="soc-btn soc-btn-secondary" type="button" onClick={() => void exportReport('csv')} disabled={exporting !== null}><FileSpreadsheet size={16} />{exporting === 'csv' ? 'Exporting…' : 'Export CSV'}</button><button className="soc-btn soc-btn-primary" type="button" onClick={() => void exportReport('pdf')} disabled={exporting !== null}><Download size={16} />{exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}</button><span className="reports-period-pill"><Zap size={15} /> Today</span></div></header>

      {pageError && <div className="reports-error" role="alert">{pageError}</div>}

      <section className="reports-highlight-grid" aria-label="Today's security summary">
        {highlights.map(({ label, value, note, icon: Icon, color }) => <article key={label} className={`reports-highlight-card ${color}`}><span className="reports-highlight-icon"><Icon size={22} /></span><span className="reports-highlight-label">{label}</span><strong>{value === null ? '—' : value.toLocaleString()}</strong><span className="reports-highlight-note">{note}</span><span className="reports-highlight-decoration"><Icon size={66} /></span></article>)}
      </section>

      <section className="reports-snapshot-section"><header><div><h2>Campus Snapshot</h2><p>Current system totals</p></div><span className="reports-live-indicator"><i />{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading report data'}</span></header><div className="reports-snapshot-grid">{snapshot.map(({ label, value, icon: Icon, color }) => <article key={label} className={`reports-snapshot-card ${color}`}><span className="reports-snapshot-icon"><Icon size={22} /></span><span>{label}</span><strong>{typeof value === 'number' ? value.toLocaleString() : value ?? '—'}</strong><ArrowUpRight size={17} className="reports-snapshot-arrow" /></article>)}</div></section>

      <section className="reports-inventory-section">
        <header><div><h2>Complete Asset Inventory</h2><p>All registered assets and ownership details</p></div><span>{loading ? 'Loading…' : `${assets.length.toLocaleString()} assets`}</span></header>
        <div className="reports-inventory-scroll">
          <table className="reports-inventory-table">
            <thead><tr><th>Asset</th><th>Category</th><th>Brand / Model</th><th>Serial number</th><th>Status</th><th>Purchase date</th><th>Owner</th><th>Owner ID</th><th>Phone</th><th>Department</th><th>Registered</th><th>Registered by</th><th>Notes</th><th>Files</th></tr></thead>
            <tbody>
              {assets.map((asset) => <tr key={asset.id}>
                <td><strong>{asset.name}</strong><small>{asset.id}</small></td>
                <td>{asset.category}</td><td>{[asset.brand, asset.model].filter(Boolean).join(' / ') || '—'}</td>
                <td>{asset.serial || '—'}</td><td><span className={`reports-asset-status status-${asset.status.toLowerCase().replace(/_/g, '-')}`}>{asset.status.replace(/_/g, ' ')}</span></td>
                <td>{asset.purchaseDate || '—'}</td><td>{asset.ownerName}</td><td>{asset.ownerId || '—'}</td>
                <td>{asset.ownerPhone || '—'}</td><td>{asset.department || '—'}</td>
                <td>{asset.registrationDateTime ? new Date(asset.registrationDateTime).toLocaleDateString() : '—'}</td>
                <td>{asset.registeredBy || '—'}</td><td title={asset.notes}>{asset.notes || '—'}</td>
                <td className="reports-inventory-files">{asset.photoUrl && <a href={asset.photoUrl} target="_blank" rel="noreferrer">Photo</a>}{asset.photoUrl && asset.qrCodeUrl && ' · '}{asset.qrCodeUrl && <a href={asset.qrCodeUrl} target="_blank" rel="noreferrer">QR code</a>}{!asset.photoUrl && !asset.qrCodeUrl && '—'}</td>
              </tr>)}
              {!loading && assets.length === 0 && <tr><td className="reports-inventory-empty" colSpan={14}>{pageError ? 'Asset inventory could not be loaded.' : 'No registered assets found.'}</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="reports-inventory-export-note">The PDF and CSV exports include this full asset inventory and the complete verification history.</p>
      </section>
    </div>
  );
};
