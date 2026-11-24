import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  CreditCard, IndianRupee, CheckCircle2, XCircle, Clock, Search, 
  Filter, Download, ArrowRight, LogOut, Eye, RefreshCw, AlertCircle, Sparkles, Shield,
  Check, X, FileText, AlertTriangle, BarChart3
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminUser } from '../../services/adminAuthService';
import { isViewablePaymentProof, StorageService } from '../../services/storageService';
import { Registration, PaymentStatus, FestEvent, FestStats, RazorpayRefundOrder, Department } from '../../types/festronix';
import { registrationRevenueAmount } from '../../lib/revenue';
import { isFirebaseConfigured } from '../../lib/firebase';
import {
  FirebaseStaffPaymentService,
  StaffPaymentOrder,
  dailyPaidOrderCollections,
  paidOrderTotalPaise,
} from '../../services/firebaseStaffPaymentService';
import { AdminHeader } from './AdminHeader';

const statsWithRevenue = (stats: FestStats, orders: StaffPaymentOrder[]): FestStats =>
  orders.length === 0 ? stats : { ...stats, totalCollected: Math.round(paidOrderTotalPaise(orders) / 100) };

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
  const paymentOrdersRef = useRef<StaffPaymentOrder[]>([]);
  const [paymentOrders, setPaymentOrders] = useState<StaffPaymentOrder[]>([]);
  const [stats, setStats] = useState<FestStats>(() => StorageService.getStats());
  const [registrations, setRegistrations] = useState<Registration[]>(() => StorageService.getRegistrations());
  const [departments, setDepartments] = useState<Department[]>([]);
  const departmentScope = adminUser.departmentCode?.trim().toUpperCase() || '';
  
  // Filter and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [deptFilter, setDeptFilter] = useState(() => departmentScope || 'all');

  // Duplicate-payment refunds recorded by the Razorpay verifier
  const [refundOrders, setRefundOrders] = useState<RazorpayRefundOrder[]>([]);
  const [refundError, setRefundError] = useState('');
  
  // Proof Viewer Modal
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [rejectingRegId, setRejectingRegId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const dayWiseCollections = useMemo(() => dailyPaidOrderCollections(paymentOrders), [paymentOrders]);
  const maxDayCollection = Math.max(...dayWiseCollections.map(day => day.amountRupees), 1);

  const filterRegistrationsToScope = (items: Registration[], eventItems: FestEvent[]) => {
    if (!departmentScope) return items;
    return items.filter(registration => {
      const event = eventItems.find(item => item.id === registration.eventId || item.title === registration.eventTitle);
      return event?.departmentCode?.toUpperCase() === departmentScope;
    });
  };

  const refreshData = async () => {
    setStats(statsWithRevenue(StorageService.getStats(), paymentOrdersRef.current));
    setRegistrations(filterRegistrationsToScope(StorageService.getRegistrations(), StorageService.getEvents()));
    try {
      const [liveRegistrations, liveEvents, paymentOrders] = await Promise.all([
        StorageService.fetchRegistrations(),
        StorageService.fetchEvents(),
        isFirebaseConfigured ? FirebaseStaffPaymentService.list() : Promise.resolve([] as StaffPaymentOrder[]),
      ]);
      paymentOrdersRef.current = paymentOrders;
      setPaymentOrders(paymentOrders);
      setStats(statsWithRevenue(StorageService.getStats(), paymentOrders));
      setRegistrations(filterRegistrationsToScope(liveRegistrations, liveEvents));
    } catch (error) {
      console.warn('Finance dashboard sync warning:', error);
    }

    try {
      setRefundOrders(await StorageService.fetchRazorpayRefundOrders());
      setRefundError('');
    } catch (error) {
      // A refund follow-up failure must never block the main payment ledger.
      console.warn('Razorpay refund sync warning:', error);
      setRefundError((error as Error).message || 'Unable to load Razorpay refund records.');
    }
  };

  const refreshPaymentOrdersOnly = async () => {
    if (!isFirebaseConfigured) return;
    try {
      const orders = await FirebaseStaffPaymentService.list();
      paymentOrdersRef.current = orders;
      setPaymentOrders(orders);
      setStats(statsWithRevenue(StorageService.getStats(), orders));
    } catch (error) {
      console.warn('Firebase payment orders could not be refreshed.', error);
    }
  };

  useEffect(() => {
    void StorageService.fetchDepartments()
      .then(setDepartments)
      .catch(error => console.warn('Finance department list could not be loaded from Firebase.', error));
    void refreshData();
    const handleRegistrations = () => {
      setStats(statsWithRevenue(StorageService.getStats(), paymentOrdersRef.current));
      setRegistrations(StorageService.getRegistrations());
    };
    const handleEvents = () => {
      setStats(statsWithRevenue(StorageService.getStats(), paymentOrdersRef.current));
    };
    const handlePayments = () => {
      void refreshPaymentOrdersOnly();
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'festronix_registrations_v1' || event.key === 'festronix_events_v1') {
        void refreshData();
      }
    };
    window.addEventListener('festronix:payments-updated', handlePayments);
    window.addEventListener('festronix:regs-updated', handleRegistrations);
    window.addEventListener('festronix:events-updated', handleEvents);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('festronix:payments-updated', handlePayments);
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
    if (departmentScope) {
      const ev = StorageService.getEvents().find(e => e.id === r.eventId || e.title === r.eventTitle);
      if (!ev || ev.departmentCode?.toUpperCase() !== departmentScope) return false;
    }
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

  const refundsNeedingFollowUp = refundOrders.filter(
    order => order.refundStatus === 'failed' || order.refundStatus === 'pending'
  );

  const refundBadge = (status: RazorpayRefundOrder['refundStatus']) => {
    if (status === 'succeeded') {
      return { label: 'REFUNDED', color: '#34D399', bg: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)' };
    }
    if (status === 'failed') {
      return { label: 'REFUND FAILED', color: '#F87171', bg: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)' };
    }
    return { label: 'REFUND PENDING', color: '#FBBF24', bg: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)' };
  };

  const exportCSV = () => {
    const headers = ['Reg ID', 'Event Title', 'Leader Name', 'Roll No', 'Fee', 'Payment Status', 'Transaction ID / UTR', 'Verified By', 'Date'];
    const rows = filtered.map(r => [
      r.id,
      `"${r.eventTitle.replace(/"/g, '""')}"`,
      `"${r.leaderName.replace(/"/g, '""')}"`,
      r.leaderRoll,
      registrationRevenueAmount(r),
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
    <div className="admin-standalone-portal" style={{ minHeight: '100vh', background: 'transparent', color: '#FFFFFF', paddingBottom: '60px' }}>
      {/* Shared Executive Header */}
      <AdminHeader
        adminUser={adminUser}
        onLogout={onLogout}
        onSwitchToFest={onSwitchToFest}
        titleOverride="FINANCE & PAYMENT RECONCILIATION CONSOLE"
        badgeOverride="💳 CENTRAL ACCOUNTS REVIEWER"
      />

      <main className="admin-content-container admin-content-container-wide" style={{ maxWidth: '1360px', margin: '0 auto', padding: '28px 24px' }}>
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

        {/* Day-wise Razorpay Collection Graph */}
        <div className="admin-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={17} color="#34D399" />
                <span>Day-wise Razorpay Collections</span>
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0 }}>
                Captured paid orders only, refunds excluded. Dates follow Asia/Kolkata time.
              </p>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#34D399', background: 'rgba(52, 211, 153, 0.12)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
              {dayWiseCollections.reduce((sum, day) => sum + day.orders, 0)} paid orders • ₹{dayWiseCollections.reduce((sum, day) => sum + day.amountRupees, 0).toLocaleString('en-IN')}
            </span>
          </div>

          {dayWiseCollections.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#94A3B8', border: '1px dashed rgba(220, 227, 229, 0.18)', borderRadius: '12px' }}>
              No captured Razorpay orders available to chart yet.
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '230px', overflowX: 'auto', padding: '12px 4px 4px' }}>
              {dayWiseCollections.map(day => {
                const barHeight = Math.max(10, Math.round((day.amountRupees / maxDayCollection) * 160));
                return (
                  <div key={day.date} style={{ minWidth: '74px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', height: '100%' }}>
                    <div
                      title={`${day.date}: ₹${day.amountRupees.toLocaleString('en-IN')} from ${day.orders} paid order(s)`}
                      style={{
                        width: '44px',
                        height: `${barHeight}px`,
                        borderRadius: '8px 8px 3px 3px',
                        background: day.amountRupees > 0 ? 'linear-gradient(180deg, #34D399 0%, #059669 100%)' : 'rgba(148, 163, 184, 0.14)',
                        border: day.amountRupees > 0 ? '1px solid rgba(52, 211, 153, 0.5)' : '1px dashed rgba(148, 163, 184, 0.25)'
                      }}
                    />
                    <div style={{ fontSize: '0.74rem', color: '#FFFFFF', fontWeight: 800 }}>₹{day.amountRupees.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{day.label}</div>
                    <div style={{ fontSize: '0.64rem', color: '#64748B' }}>{day.orders} order{day.orders === 1 ? '' : 's'}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Razorpay Duplicate-Payment Refunds */}
        {(refundOrders.length > 0 || refundError) && (
          <div className="admin-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div className="admin-card-top-accent" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={17} color="#38BDF8" />
                  <span>Razorpay Duplicate-Payment Refunds</span>
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0 }}>
                  A participant who was already registered has their second captured payment refunded automatically. Failed or in-flight refunds need manual follow-up with the gateway.
                </p>
              </div>
              {refundsNeedingFollowUp.length > 0 && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '5px 12px',
                    borderRadius: '9999px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    color: '#FBBF24'
                  }}
                >
                  {refundsNeedingFollowUp.length} NEED FOLLOW-UP
                </span>
              )}
            </div>

            {refundError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#FBBF24',
                  fontSize: '0.78rem'
                }}
              >
                <AlertTriangle size={14} />
                <span>{refundError}</span>
              </div>
            )}

            {refundOrders.length > 0 && (
              <div className="admin-table-wrapper admin-scrollbar" style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Event</th>
                      <th>Amount</th>
                      <th>Refund Status</th>
                      <th>Gateway Detail</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refundOrders.map(order => {
                      const badge = refundBadge(order.refundStatus);
                      const detail = order.refundError || order.lastError || (order.refundId ? `Refund ${order.refundId}` : '—');
                      return (
                        <tr key={order.orderId}>
                          <td style={{ fontFamily: 'monospace', color: '#38BDF8', fontSize: '0.78rem' }}>
                            {order.paymentId || order.orderId}
                          </td>
                          <td style={{ color: '#E2E8F0' }}>
                            {order.eventTitle}
                            {order.departmentCode && (
                              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{order.departmentCode}</div>
                            )}
                          </td>
                          <td style={{ fontWeight: 800, color: '#34D399' }}>₹{(order.amountPaise / 100).toLocaleString()}</td>
                          <td>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '3px 9px',
                                borderRadius: '9999px',
                                background: badge.bg,
                                color: badge.color,
                                border: badge.border
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.76rem', color: '#CBD5E1', maxWidth: '340px' }}>{detail}</td>
                          <td style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                            {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

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

            {departmentScope ? (
              <div className="admin-form-input" style={{ width: 'auto', flex: '0 1 240px', display: 'flex', alignItems: 'center', color: '#67E8F9', fontWeight: 700 }}>
                Department scope: {departmentScope}
              </div>
            ) : (
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="admin-form-input"
                style={{ width: 'auto', flex: '0 1 240px', paddingLeft: '14px' }}
              >
                <option value="all">All Departments</option>
                {departments.map(d => (
                  <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
                ))}
              </select>
            )}
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
                      <td style={{ fontWeight: 800, color: '#34D399' }}>₹{registrationRevenueAmount(r)}</td>
                      <td style={{ fontFamily: 'monospace', color: '#CBD5E1', fontSize: '0.78rem' }}>
                        {r.transactionId || '—'}
                      </td>
                      <td>
                        {r.paymentScreenshotUrl && isViewablePaymentProof(r.paymentScreenshotUrl) ? (
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
                        ) : r.paymentScreenshotUrl ? (
                          <span style={{ fontSize: '0.72rem', color: '#FBBF24' }}>Legacy proof unavailable</span>
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
