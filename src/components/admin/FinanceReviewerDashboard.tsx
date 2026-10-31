import React, { useEffect, useState } from 'react';
import { 
  CreditCard, IndianRupee, CheckCircle2, XCircle, Clock, Search, 
  Filter, Download, ArrowRight, LogOut, Eye, RefreshCw, AlertCircle, Sparkles, Shield,
  Check, X, FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminUser } from '../../services/adminAuthService';
import { StorageService } from '../../services/storageService';
import { Registration, PaymentStatus, FestStats } from '../../types/festronix';
import { DEPARTMENTS } from '../../data/mockData';
import { AdminHeader } from './AdminHeader';

interface FinanceReviewerDashboardProps {
  adminUser: AdminUser;
  onLogout: () => void;
  onSwitchToFest: () => void;
}

export const FinanceReviewerDashboard: React.FC<FinanceReviewerDashboardProps> = ({
  adminUser,
  onLogout,
  onSwitchToFest
}) => {
  const [stats, setStats] = useState<FestStats>(() => StorageService.getStats());
  const [registrations, setRegistrations] = useState<Registration[]>(() => StorageService.getRegistrations());
  
  // Filter and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [deptFilter, setDeptFilter] = useState('all');
  
  // Proof Viewer Modal
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [rejectingRegId, setRejectingRegId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const refreshData = async () => {
    setStats(StorageService.getStats());
    setRegistrations(StorageService.getRegistrations());
    try {
      await Promise.all([StorageService.fetchRegistrations(), StorageService.fetchEvents()]);
      setStats(StorageService.getStats());
      setRegistrations(StorageService.getRegistrations());
    } catch (error) {
      console.warn('Finance dashboard sync warning:', error);
    }
  };

  useEffect(() => {
    void refreshData();
    const handleRegistrations = () => {
      setStats(StorageService.getStats());
      setRegistrations(StorageService.getRegistrations());
    };
    const handleEvents = () => {
      setStats(StorageService.getStats());
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'festronix_registrations_v1' || event.key === 'festronix_events_v1') {
        void refreshData();
      }
    };
    window.addEventListener('festronix:regs-updated', handleRegistrations);
    window.addEventListener('festronix:events-updated', handleEvents);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('festronix:regs-updated', handleRegistrations);
      window.removeEventListener('festronix:events-updated', handleEvents);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleVerify = async (regId: string) => {
    try {
      const ok = await StorageService.updatePaymentStatus(regId, 'verified', adminUser.fullName);
      if (ok) {
        confetti({ particleCount: 65, spread: 60, origin: { y: 0.6 } });
        void refreshData();
      }
    } catch (error) {
      window.alert((error as Error).message || 'Unable to approve this payment.');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRegId) return;
    try {
      await StorageService.updatePaymentStatus(rejectingRegId, 'rejected', adminUser.fullName, rejectReason || 'Payment screenshot or UTR invalid.');
      setRejectingRegId(null);
      setRejectReason('');
      void refreshData();
    } catch (error) {
      window.alert((error as Error).message || 'Unable to reject this payment.');
    }
  };

  const filtered = registrations.filter(r => {
    if (statusFilter !== 'all' && r.paymentStatus !== statusFilter) return false;
    if (deptFilter !== 'all') {
      const allEvents = StorageService.getEvents();
      const ev = allEvents.find(e => e.id === r.eventId);
      if (ev && ev.departmentCode !== deptFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchLeader = r.leaderName.toLowerCase().includes(q);
      const matchRoll = r.leaderRoll.toLowerCase().includes(q);
      const matchEvent = r.eventTitle.toLowerCase().includes(q);
      const matchTxn = (r.transactionId || '').toLowerCase().includes(q);
      const matchId = r.id.toLowerCase().includes(q);
      if (!matchLeader && !matchRoll && !matchEvent && !matchTxn && !matchId) return false;
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Reg ID', 'Event Title', 'Leader Name', 'Roll No', 'Fee', 'Payment Status', 'Transaction ID / UTR', 'Verified By', 'Date'];
    const rows = filtered.map(r => [
      r.id,
      `"${r.eventTitle.replace(/"/g, '""')}"`,
      `"${r.leaderName.replace(/"/g, '""')}"`,
      r.leaderRoll,
      r.fee,
      r.paymentStatus,
      r.transactionId || 'N/A',
      r.verifiedBy || 'N/A',
      r.registrationDate
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FESTRONIX_2026_FINANCE_REPORT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', color: '#FFFFFF', paddingBottom: '60px' }}>
      {/* Shared Executive Header */}
      <AdminHeader
        adminUser={adminUser}
        onLogout={onLogout}
        onSwitchToFest={onSwitchToFest}
        titleOverride="FINANCE & PAYMENT RECONCILIATION CONSOLE"
        badgeOverride="💳 CENTRAL ACCOUNTS REVIEWER"
      />

      <main style={{ maxWidth: '1360px', margin: '0 auto', padding: '28px 24px' }}>
        {/* KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {/* Card 1: Total Collections */}
          <div className="admin-kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Fest Collections
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34D399', lineHeight: 1.1, marginTop: '4px' }}>
                  ₹{stats.totalCollected.toLocaleString()}
                </div>
              </div>
              <div className="admin-kpi-icon-pod" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)' }}>
                <IndianRupee size={22} color="#34D399" />
              </div>
            </div>
            <div className="admin-progress-track">
              <div className="admin-progress-fill" style={{ width: '100%', background: 'linear-gradient(90deg, #059669, #34D399)' }} />
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '6px' }}>
              Reconciled across bank transactions & spot desks
            </div>
          </div>

          {/* Card 2: Verified Count */}
          <div className="admin-kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Verified & Approved
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginTop: '4px' }}>
                  {stats.verifiedCount}
                </div>
              </div>
              <div className="admin-kpi-icon-pod">
                <CheckCircle2 size={20} color="#38BDF8" />
              </div>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#38BDF8', marginTop: '16px', fontWeight: 600 }}>
              Admission passes authorized & gate-ready
            </div>
          </div>

          {/* Card 3: Pending Verification */}
          <div className="admin-kpi-card" style={{ borderColor: stats.pendingCount > 0 ? 'rgba(245, 158, 11, 0.35)' : undefined }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#FBBF24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pending Review Queue
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FBBF24', lineHeight: 1.1, marginTop: '4px' }}>
                  {stats.pendingCount}
                </div>
              </div>
              <div className="admin-kpi-icon-pod" style={{ background: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.35)' }}>
                <Clock size={20} color="#FBBF24" />
              </div>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#CBD5E1', marginTop: '16px' }}>
              Awaiting UTR / screenshot reconciliation
            </div>
          </div>

          {/* Card 4: Rejected / Flagged */}
          <div className="admin-kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#F87171', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Rejected / Discrepancies
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F87171', lineHeight: 1.1, marginTop: '4px' }}>
                  {stats.rejectedCount}
                </div>
              </div>
              <div className="admin-kpi-icon-pod" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.35)' }}>
                <XCircle size={20} color="#F87171" />
              </div>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '16px' }}>
              Invalid payment evidence or mismatched amount
            </div>
          </div>
        </div>

        {/* Ledger Section */}
        <div className="admin-card" style={{ padding: '28px' }}>
          <div className="admin-card-top-accent" />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px', color: '#FFFFFF' }}>
                Payment Audit & Verification Ledger
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0 }}>
                Audit participant transaction IDs, verify proof screenshots, and reconcile departmental collections.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={exportCSV}
                className="admin-btn admin-btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
              >
                <Download size={14} />
                <span>Export CSV Report</span>
              </button>

              <button
                onClick={refreshData}
                className="admin-btn admin-btn-ghost"
                style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                title="Refresh Ledger"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search size={15} color="#38BDF8" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              <input
                type="text"
                placeholder="Search participant name, roll number, transaction UTR..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="admin-form-input"
                style={{ paddingLeft: '38px' }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="admin-form-input"
              style={{ width: 'auto', flex: '0 1 220px', paddingLeft: '14px' }}
            >
              <option value="all">All Payment Statuses</option>
              <option value="verification_pending">Pending Verification Only</option>
              <option value="verified">Verified Only</option>
              <option value="rejected">Rejected Only</option>
            </select>

            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="admin-form-input"
              style={{ width: 'auto', flex: '0 1 240px', paddingLeft: '14px' }}
            >
              <option value="all">All 9 Academic Departments</option>
              {DEPARTMENTS.map(d => (
                <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
              ))}
            </select>
          </div>

          {/* Ledger Table */}
          <div className="admin-table-wrapper admin-scrollbar" style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reg ID</th>
                  <th>Participant</th>
                  <th>Event</th>
                  <th>Amount</th>
                  <th>Txn / UTR</th>
                  <th>Proof Slip</th>
                  <th>Audit Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                      No registration receipts found matching your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700, color: '#38BDF8', fontFamily: 'monospace' }}>{r.id}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{r.leaderName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{r.leaderRoll} • {r.leaderCollege}</div>
                      </td>
                      <td style={{ color: '#E2E8F0' }}>{r.eventTitle}</td>
                      <td style={{ fontWeight: 800, color: '#34D399' }}>₹{r.fee}</td>
                      <td style={{ fontFamily: 'monospace', color: '#CBD5E1', fontSize: '0.78rem' }}>
                        {r.transactionId || '—'}
                      </td>
                      <td>
                        {r.paymentScreenshotUrl ? (
                          <button
                            onClick={() => setSelectedProofUrl(r.paymentScreenshotUrl || null)}
                            className="admin-btn admin-btn-ghost"
                            style={{
                              padding: '4px 10px',
                              fontSize: '0.72rem',
                              borderColor: 'rgba(56, 189, 248, 0.35)',
                              color: '#38BDF8'
                            }}
                          >
                            <Eye size={12} />
                            <span>View Proof</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>No Slip</span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            background:
                              r.paymentStatus === 'verified'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : r.paymentStatus === 'rejected'
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                            color:
                              r.paymentStatus === 'verified'
                                ? '#34D399'
                                : r.paymentStatus === 'rejected'
                                ? '#F87171'
                                : '#FBBF24',
                            border:
                              r.paymentStatus === 'verified'
                                ? '1px solid rgba(16, 185, 129, 0.35)'
                                : r.paymentStatus === 'rejected'
                                ? '1px solid rgba(239, 68, 68, 0.35)'
                                : '1px solid rgba(245, 158, 11, 0.35)'
                          }}
                        >
                          {r.paymentStatus.toUpperCase().replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          {r.paymentStatus !== 'verified' && (
                            <button
                              onClick={() => handleVerify(r.id)}
                              className="admin-btn admin-btn-emerald"
                              style={{ padding: '5px 12px', fontSize: '0.72rem' }}
                            >
                              <Check size={12} />
                              <span>Approve</span>
                            </button>
                          )}
                          {r.paymentStatus !== 'rejected' && (
                            <button
                              onClick={() => setRejectingRegId(r.id)}
                              className="admin-btn admin-btn-danger"
                              style={{ padding: '5px 12px', fontSize: '0.72rem' }}
                            >
                              <X size={12} />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Proof Preview Modal */}
      {selectedProofUrl && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedProofUrl(null)}>
          <div
            className="admin-modal-window"
            style={{ maxWidth: '520px', padding: '24px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#38BDF8" />
                <span>Submitted Payment Evidence</span>
              </div>
              <button
                onClick={() => setSelectedProofUrl(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div style={{ background: '#080C16', borderRadius: '14px', padding: '8px', border: '1px solid rgba(220, 227, 232, 0.1)' }}>
              <img src={selectedProofUrl} alt="Payment Proof Slip" style={{ width: '100%', borderRadius: '10px', display: 'block' }} />
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingRegId && (
        <div className="admin-modal-backdrop" onClick={() => setRejectingRegId(null)}>
          <form
            onSubmit={handleReject}
            className="admin-modal-window"
            style={{ maxWidth: '440px', padding: '28px', border: '1px solid rgba(239, 68, 68, 0.4)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <AlertCircle size={22} color="#F87171" />
              <h3 style={{ margin: 0, color: '#F87171', fontSize: '1.1rem', fontWeight: 800 }}>Reject Payment Evidence</h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#CBD5E1', marginBottom: '16px', lineHeight: 1.4 }}>
              Specify the audit rejection reason (e.g. UTR mismatch with bank statement, illegible screenshot, fee underpayment):
            </p>
            <input
              type="text"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. UTR not matched in central bank statement"
              required
              className="admin-form-input"
              style={{ marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setRejectingRegId(null)}
                className="admin-btn admin-btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn-danger"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
