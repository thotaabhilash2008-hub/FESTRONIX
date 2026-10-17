import React, { useState } from 'react';
import { 
  CreditCard, IndianRupee, CheckCircle2, XCircle, Clock, Search, 
  Filter, Download, ArrowRight, LogOut, Eye, RefreshCw, AlertCircle, Sparkles, Shield
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminUser } from '../../services/adminAuthService';
import { StorageService } from '../../services/storageService';
import { Registration, PaymentStatus, FestStats } from '../../types/festronix';
import { DEPARTMENTS } from '../../data/mockData';

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
  const [stats, setStats] = useState<FestStats>(StorageService.getStats());
  const [registrations, setRegistrations] = useState<Registration[]>(StorageService.getRegistrations());
  
  // Filter and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [deptFilter, setDeptFilter] = useState('all');
  
  // Proof Viewer Modal
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [rejectingRegId, setRejectingRegId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const refreshData = () => {
    setStats(StorageService.getStats());
    setRegistrations(StorageService.getRegistrations());
  };

  const handleVerify = async (regId: string) => {
    const ok = await StorageService.updatePaymentStatus(regId, 'verified', adminUser.fullName);
    if (ok) {
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
      refreshData();
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRegId) return;
    await StorageService.updatePaymentStatus(rejectingRegId, 'rejected', adminUser.fullName, rejectReason || 'Payment screenshot or UTR invalid.');
    setRejectingRegId(null);
    setRejectReason('');
    refreshData();
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
    <div style={{ minHeight: '100vh', background: 'transparent', padding: '24px 20px', maxWidth: '1280px', margin: '0 auto', color: '#FFFFFF' }}>
      {/* Top Banner with Access Boundary Indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgba(20, 31, 62, 0.95)',
          border: '1px solid rgba(120, 149, 147, 0.35)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CreditCard size={24} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Finance & Payment Review Console
              </h1>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  background: 'rgba(52, 211, 153, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(52, 211, 153, 0.35)',
                  padding: '3px 8px',
                  borderRadius: '9999px'
                }}
              >
                ROLE: FINANCE / PAYMENT REVIEWER
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#A8B3C2', marginTop: '2px' }}>
              Access boundary: <strong>Payment data needed for assigned duties</strong> • Responsibilities: Review payment evidence and collection reports
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onSwitchToFest}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(220, 227, 229, 0.2)',
              borderRadius: '10px',
              padding: '8px 14px',
              color: '#DCE3E5',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Fest Portal
          </button>
          <button
            onClick={onLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '8px 14px',
              color: '#f87171',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(16, 26, 53, 0.8)', border: '1px solid rgba(220, 227, 229, 0.15)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '0.76rem', color: '#A8B3C2', fontWeight: 600 }}>Total Fest Collections</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
            ₹{stats.totalCollected.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#789593', marginTop: '2px' }}>Verified registration receipts</div>
        </div>

        <div style={{ background: 'rgba(16, 26, 53, 0.8)', border: '1px solid rgba(220, 227, 229, 0.15)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '0.76rem', color: '#A8B3C2', fontWeight: 600 }}>Verified Payments</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
            {stats.verifiedCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#34d399', marginTop: '2px' }}>Admission pass enabled</div>
        </div>

        <div style={{ background: 'rgba(16, 26, 53, 0.8)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '0.76rem', color: '#fbbf24', fontWeight: 700 }}>Verification Pending</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
            {stats.pendingCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#A8B3C2', marginTop: '2px' }}>Awaiting reviewer signoff</div>
        </div>

        <div style={{ background: 'rgba(16, 26, 53, 0.8)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '0.76rem', color: '#f87171', fontWeight: 600 }}>Rejected / Flagged</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f87171', marginTop: '4px' }}>
            {stats.rejectedCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#A8B3C2', marginTop: '2px' }}>Invalid transaction proof</div>
        </div>
      </div>

      {/* Main Review Section */}
      <div style={{ background: 'rgba(16, 26, 53, 0.85)', border: '1px solid rgba(220, 227, 229, 0.18)', borderRadius: '18px', padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 4px' }}>Payment Verification & Reconciliation Ledger</h2>
            <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: 0 }}>
              Review submitted payment proofs, reconcile bank reference numbers, and generate accounts audit reports.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={exportCSV}
              style={{
                background: 'rgba(40, 59, 120, 0.6)',
                border: '1px solid rgba(120, 149, 147, 0.4)',
                borderRadius: '8px',
                padding: '8px 14px',
                color: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} />
              <span>Export CSV Ledger</span>
            </button>
            <button
              onClick={refreshData}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(220, 227, 229, 0.2)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#DCE3E5',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={14} color="#789593" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="Search by participant name, roll no, transaction ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: '10px',
                background: 'rgba(10, 16, 32, 0.7)',
                border: '1px solid rgba(220, 227, 229, 0.2)',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(10, 16, 32, 0.85)',
              border: '1px solid rgba(220, 227, 229, 0.2)',
              color: '#FFFFFF',
              fontSize: '0.82rem'
            }}
          >
            <option value="all">All Payment Statuses</option>
            <option value="verification_pending">Pending Verification Only</option>
            <option value="verified">Verified Only</option>
            <option value="rejected">Rejected Only</option>
          </select>

          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(10, 16, 32, 0.85)',
              border: '1px solid rgba(220, 227, 229, 0.2)',
              color: '#FFFFFF',
              fontSize: '0.82rem'
            }}
          >
            <option value="all">All 9 Departments</option>
            {DEPARTMENTS.map(d => (
              <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(220, 227, 229, 0.12)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'rgba(40, 59, 120, 0.4)', borderBottom: '1px solid rgba(120, 149, 147, 0.3)', color: '#DCE3E5' }}>
                <th style={{ padding: '10px 12px' }}>Reg ID</th>
                <th style={{ padding: '10px 12px' }}>Participant / Roll</th>
                <th style={{ padding: '10px 12px' }}>Event</th>
                <th style={{ padding: '10px 12px' }}>Fee</th>
                <th style={{ padding: '10px 12px' }}>Txn / UTR</th>
                <th style={{ padding: '10px 12px' }}>Proof</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: '#A8B3C2' }}>
                    No payment records found matching the filters.
                  </td>
                </tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(220, 227, 229, 0.08)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#FFFFFF' }}>{r.id}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{r.leaderName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#A8B3C2' }}>{r.leaderRoll} • {r.leaderCollege}</div>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#DCE3E5' }}>{r.eventTitle}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#34d399' }}>₹{r.fee}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#A8B3C2' }}>
                      {r.transactionId || '—'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {r.paymentScreenshotUrl ? (
                        <button
                          onClick={() => setSelectedProofUrl(r.paymentScreenshotUrl || null)}
                          style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid rgba(56, 189, 248, 0.35)',
                            borderRadius: '6px',
                            color: '#38bdf8',
                            padding: '4px 8px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Eye size={12} />
                          <span>View Slip</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background:
                            r.paymentStatus === 'verified'
                              ? 'rgba(52, 211, 153, 0.15)'
                              : r.paymentStatus === 'rejected'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                          color:
                            r.paymentStatus === 'verified'
                              ? '#34d399'
                              : r.paymentStatus === 'rejected'
                              ? '#f87171'
                              : '#fbbf24',
                          border:
                            r.paymentStatus === 'verified'
                              ? '1px solid rgba(52, 211, 153, 0.3)'
                              : r.paymentStatus === 'rejected'
                              ? '1px solid rgba(239, 68, 68, 0.3)'
                              : '1px solid rgba(245, 158, 11, 0.3)'
                        }}
                      >
                        {r.paymentStatus.toUpperCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        {r.paymentStatus !== 'verified' && (
                          <button
                            onClick={() => handleVerify(r.id)}
                            style={{
                              background: 'rgba(52, 211, 153, 0.2)',
                              border: '1px solid rgba(52, 211, 153, 0.4)',
                              borderRadius: '6px',
                              color: '#34d399',
                              padding: '5px 10px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Verify & Approve
                          </button>
                        )}
                        {r.paymentStatus !== 'rejected' && (
                          <button
                            onClick={() => setRejectingRegId(r.id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '6px',
                              color: '#f87171',
                              padding: '5px 10px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Reject
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

      {/* Proof Preview Modal */}
      {selectedProofUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
          }}
          onClick={() => setSelectedProofUrl(null)}
        >
          <div style={{ maxWidth: '480px', width: '100%', background: '#101A35', padding: '16px', borderRadius: '16px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontWeight: 700 }}>Payment Evidence Screenshot</div>
              <button onClick={() => setSelectedProofUrl(null)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>✕</button>
            </div>
            <img src={selectedProofUrl} alt="Payment Proof" style={{ width: '100%', borderRadius: '10px' }} />
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingRegId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
          }}
          onClick={() => setRejectingRegId(null)}
        >
          <form
            onSubmit={handleReject}
            style={{ maxWidth: '420px', width: '100%', background: '#101A35', padding: '24px', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 10px', color: '#f87171' }}>Reject Payment Evidence</h3>
            <p style={{ fontSize: '0.8rem', color: '#A8B3C2', marginBottom: '14px' }}>
              Specify the reason for rejection (e.g. invalid UTR, screenshot blurry, fee mismatch):
            </p>
            <input
              type="text"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. UTR not matched in bank statement"
              required
              style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0a1020', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', marginBottom: '16px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setRejectingRegId(null)} style={{ background: 'none', border: '1px solid #789593', color: '#DCE3E5', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ background: '#ef4444', border: 'none', color: '#FFFFFF', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Confirm Reject</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
