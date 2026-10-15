import React, { useState, useEffect } from 'react';
import { 
  Award, Shield, Users, IndianRupee, Clock, CheckCircle2, XCircle, Search, 
  Filter, Download, Bell, Plus, Trash2, Edit3, ArrowRight, LogOut, Globe, 
  Layers, ChevronRight, Eye, RefreshCw, AlertTriangle, Sparkles, Building2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminUser, AdminAuthService } from '../../services/adminAuthService';
import { StorageService } from '../../services/storageService';
import { FestEvent, Registration, Announcement, FestStats, PaymentStatus } from '../../types/festronix';
import { DEPARTMENTS } from '../../data/mockData';

interface DeanDashboardProps {
  adminUser: AdminUser;
  onLogout: () => void;
  onSwitchToFest: () => void;
}

export const DeanDashboard: React.FC<DeanDashboardProps> = ({ adminUser, onLogout, onSwitchToFest }) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'payments' | 'events' | 'bulletins' | 'roster'>('leaderboard');
  
  const [stats, setStats] = useState<FestStats>(StorageService.getStats());
  const [events, setEvents] = useState<FestEvent[]>(StorageService.getEvents());
  const [registrations, setRegistrations] = useState<Registration[]>(StorageService.getRegistrations());
  const [announcements, setAnnouncements] = useState<Announcement[]>(StorageService.getAnnouncements());

  // Search & Filter States
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterDeptFilter, setRosterDeptFilter] = useState('all');
  const [rosterPaymentFilter, setRosterPaymentFilter] = useState('all');

  // Payment Verification Modal State
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  // New Announcement Form State
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnMessage, setNewAnnMessage] = useState('');
  const [newAnnType, setNewAnnType] = useState<'urgent' | 'general' | 'prize' | 'workshop'>('urgent');

  // Edit Event State
  const [editingEvent, setEditingEvent] = useState<FestEvent | null>(null);

  const refreshAllData = () => {
    setStats(StorageService.getStats());
    setEvents(StorageService.getEvents());
    setRegistrations(StorageService.getRegistrations());
    setAnnouncements(StorageService.getAnnouncements());
  };

  // Payment Approval Handler
  const handleVerifyPayment = (regId: string, status: PaymentStatus, reason?: string) => {
    const success = StorageService.updatePaymentStatus(regId, status, adminUser.fullName, reason);
    if (success) {
      if (status === 'verified') {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      }
      refreshAllData();
    }
  };

  // Broadcast Bulletin Handler
  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnMessage.trim()) return;

    StorageService.addAnnouncement({
      title: newAnnTitle.trim(),
      message: newAnnMessage.trim(),
      type: newAnnType,
      scope: 'fest-wide'
    });

    setNewAnnTitle('');
    setNewAnnMessage('');
    refreshAllData();
  };

  const handleDeleteAnnouncement = (id: string) => {
    StorageService.deleteAnnouncement(id);
    refreshAllData();
  };

  // Toggle Event Registration Status
  const handleToggleEventStatus = (event: FestEvent) => {
    const nextStatus = event.status === 'open' ? 'closed' : 'open';
    const updated = { ...event, status: nextStatus as any };
    StorageService.updateEvent(updated);
    refreshAllData();
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['Registration ID', 'Event Title', 'Leader Name', 'Roll Number', 'Email', 'Phone', 'College', 'Format', 'Fee (INR)', 'Payment Status', 'Transaction ID', 'Checked In'];
    const rows = registrations.map(r => [
      r.id,
      `"${r.eventTitle.replace(/"/g, '""')}"`,
      `"${r.leaderName.replace(/"/g, '""')}"`,
      r.leaderRoll,
      r.leaderEmail,
      r.leaderPhone,
      `"${r.leaderCollege.replace(/"/g, '""')}"`,
      r.format,
      r.fee,
      r.paymentStatus,
      r.transactionId || 'N/A',
      r.checkedIn ? 'YES' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FESTRONIX_2026_MASTER_ROSTER_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Roster
  const filteredRoster = registrations.filter(r => {
    const matchSearch = 
      r.leaderName.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      r.leaderRoll.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      r.eventTitle.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(rosterSearch.toLowerCase());
    
    const evt = events.find(e => e.id === r.eventId);
    const matchDept = rosterDeptFilter === 'all' || (evt && evt.departmentCode === rosterDeptFilter);
    const matchPay = rosterPaymentFilter === 'all' || r.paymentStatus === rosterPaymentFilter;

    return matchSearch && matchDept && matchPay;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'transparent', color: '#FFFFFF', paddingBottom: '60px' }}>
      {/* Top Dean Executive Header */}
      <header
        style={{
          backgroundColor: 'rgba(20, 31, 62, 0.95)',
          borderBottom: '1px solid rgba(220, 227, 229, 0.22)',
          padding: '16px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backdropFilter: 'blur(20px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #283B78 0%, #3B539C 50%, #789593 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(120, 149, 147, 0.4)'
            }}
          >
            <Award size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="font-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                {adminUser.role === 'vencorpia'
                  ? 'VENCORPIA EXECUTIVE CONSOLE'
                  : adminUser.role === 'connect_club'
                  ? 'CONNECT CLUB EXECUTIVE CONSOLE'
                  : 'DEAN SAC EXECUTIVE CONSOLE'}
              </h1>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(120, 149, 147, 0.2)',
                  border: '1px solid rgba(120, 149, 147, 0.4)',
                  color: '#BACEBB',
                  fontWeight: 700
                }}
              >
                {adminUser.role === 'vencorpia'
                  ? 'VENCORPIA LEAD'
                  : adminUser.role === 'connect_club'
                  ? 'CONNECT CLUB CENTRAL LEAD'
                  : 'CENTRAL OVERSIGHT'}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
              {adminUser.fullName} • {adminUser.designation} • Vardhaman College of Engineering
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onSwitchToFest}
            style={{
              background: 'rgba(40, 59, 120, 0.35)',
              border: '1px solid rgba(120, 149, 147, 0.4)',
              borderRadius: '9999px',
              padding: '7px 16px',
              color: '#BACEBB',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(40, 59, 120, 0.6)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(40, 59, 120, 0.35)';
              e.currentTarget.style.color = '#BACEBB';
            }}
          >
            <Globe size={14} />
            <span>Go to Fest Site</span>
          </button>

          <button
            onClick={onLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '9999px',
              padding: '7px 16px',
              color: '#f87171',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
        
        {/* 4 Stat KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {/* Card 1: Registrations */}
          <div
            style={{
              background: 'rgba(20, 31, 62, 0.85)',
              border: '1px solid rgba(220, 227, 229, 0.18)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: '#A8B3C2', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Registrations
              </span>
              <Users size={18} color="#789593" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
              {stats.totalRegistrations}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#BACEBB', marginTop: '6px' }}>
              {stats.onlineCount} Online • {stats.spotCount} Spot Registrations
            </div>
          </div>

          {/* Card 2: Revenue */}
          <div
            style={{
              background: 'rgba(20, 31, 62, 0.85)',
              border: '1px solid rgba(220, 227, 229, 0.18)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: '#A8B3C2', fontWeight: 600, textTransform: 'uppercase' }}>
                Revenue Collected
              </span>
              <IndianRupee size={18} color="#BACEBB" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#BACEBB', lineHeight: 1.1 }}>
              ₹{stats.totalCollected.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#A8B3C2', marginTop: '6px' }}>
              Across all engineering departments
            </div>
          </div>

          {/* Card 3: Verification Queue */}
          <div
            style={{
              background: 'rgba(20, 31, 62, 0.85)',
              border: '1px solid rgba(220, 227, 229, 0.18)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: '#A8B3C2', fontWeight: 600, textTransform: 'uppercase' }}>
                Pending Verification
              </span>
              <Clock size={18} color="#FBBF24" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FBBF24', lineHeight: 1.1 }}>
              {stats.pendingCount}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#A8B3C2', marginTop: '6px' }}>
              {stats.verifiedCount} verified • {stats.rejectedCount} rejected
            </div>
          </div>

          {/* Card 4: Check-in Attendance */}
          <div
            style={{
              background: 'rgba(20, 31, 62, 0.85)',
              border: '1px solid rgba(220, 227, 229, 0.18)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: '#A8B3C2', fontWeight: 600, textTransform: 'uppercase' }}>
                Gate Check-In Rate
              </span>
              <CheckCircle2 size={18} color="#34D399" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#34D399', lineHeight: 1.1 }}>
              {stats.checkedInCount} / {stats.totalRegistrations}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#A8B3C2', marginTop: '6px' }}>
              {stats.totalRegistrations > 0 ? Math.round((stats.checkedInCount / stats.totalRegistrations) * 100) : 0}% Attendees Checked In
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid rgba(220, 227, 229, 0.15)',
            marginBottom: '24px',
            overflowX: 'auto',
            paddingBottom: '2px'
          }}
        >
          {[
            { id: 'leaderboard', label: 'Department Leaderboard', icon: Building2 },
            { id: 'payments', label: `Payment Approvals (${stats.pendingCount})`, icon: Clock },
            { id: 'events', label: `Fest Events (${events.length})`, icon: Layers },
            { id: 'bulletins', label: 'Campus Bulletins', icon: Bell },
            { id: 'roster', label: 'Master Student Roster', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  background: isActive ? 'rgba(40, 59, 120, 0.45)' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #789593' : '2px solid transparent',
                  padding: '12px 18px',
                  color: isActive ? '#FFFFFF' : '#A8B3C2',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  fontFamily: "'Space Grotesk', sans-serif"
                }}
              >
                <Icon size={16} color={isActive ? '#BACEBB' : '#A8B3C2'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: DEPARTMENT LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 className="font-title" style={{ fontSize: '1.15rem', color: '#FFFFFF', margin: 0 }}>
                  Engineering Department Performance Matrix
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                  Live aggregate metrics across all 8 academic divisions for FESTRONIX 2026
                </p>
              </div>
              <button
                onClick={refreshAllData}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(220, 227, 229, 0.2)',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  color: '#DCE3E5',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={13} />
                <span>Refresh Matrix</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
              {DEPARTMENTS.map(dept => {
                const deptStats = StorageService.getDepartmentStats(dept.code);
                const deptEvents = events.filter(e => e.departmentCode === dept.code);

                return (
                  <div
                    key={dept.id}
                    style={{
                      background: 'rgba(20, 31, 62, 0.85)',
                      border: '1px solid rgba(220, 227, 229, 0.16)',
                      borderRadius: '16px',
                      padding: '20px',
                      transition: 'transform 0.2s, border-color 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: 'rgba(40, 59, 120, 0.45)',
                            border: '1px solid rgba(120, 149, 147, 0.4)',
                            color: '#BACEBB'
                          }}
                        >
                          {dept.code}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#A8B3C2' }}>
                          {deptEvents.length} Events Listed
                        </span>
                      </div>

                      <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>
                        {dept.name}
                      </h4>
                      <p style={{ fontSize: '0.76rem', color: '#A8B3C2', margin: '0 0 16px' }}>
                        Chief: {dept.chiefCoordinator}
                      </p>
                    </div>

                    <div
                      style={{
                        padding: '12px',
                        background: 'rgba(16, 26, 53, 0.7)',
                        borderRadius: '10px',
                        border: '1px solid rgba(220, 227, 229, 0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                        <span style={{ color: '#A8B3C2' }}>Registrations:</span>
                        <strong style={{ color: '#FFFFFF' }}>{deptStats.totalRegistrations} students</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                        <span style={{ color: '#A8B3C2' }}>Funds Collected:</span>
                        <strong style={{ color: '#BACEBB' }}>₹{deptStats.totalCollected.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: '#A8B3C2' }}>Gate Attendance:</span>
                        <strong style={{ color: '#34D399' }}>{deptStats.checkedInCount} checked-in</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: PAYMENT VERIFICATION DESK */}
        {activeTab === 'payments' && (
          <div>
            <div style={{ marginBottom: '18px' }}>
              <h3 className="font-title" style={{ fontSize: '1.15rem', color: '#FFFFFF', margin: 0 }}>
                Central Payment Verification & Approval Desk
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                Verify UPI transaction screenshots, approve registration passes, and release digital entry passes
              </p>
            </div>

            {registrations.filter(r => r.paymentStatus === 'verification_pending').length === 0 ? (
              <div
                style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  background: 'rgba(20, 31, 62, 0.6)',
                  border: '1px dashed rgba(220, 227, 229, 0.2)',
                  borderRadius: '16px'
                }}
              >
                <CheckCircle2 size={40} color="#34D399" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1.1rem', color: '#FFFFFF', margin: '0 0 6px' }}>All Payments Verified!</h4>
                <p style={{ fontSize: '0.82rem', color: '#A8B3C2', margin: 0 }}>
                  There are no pending student transactions awaiting approval.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {registrations
                  .filter(r => r.paymentStatus === 'verification_pending')
                  .map(reg => (
                    <div
                      key={reg.id}
                      style={{
                        background: 'rgba(20, 31, 62, 0.85)',
                        border: '1px solid rgba(220, 227, 229, 0.18)',
                        borderRadius: '14px',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#BACEBB', fontFamily: 'monospace' }}>
                            {reg.id}
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'rgba(251, 191, 36, 0.15)',
                              border: '1px solid rgba(251, 191, 36, 0.4)',
                              color: '#FBBF24',
                              fontWeight: 700
                            }}
                          >
                            NEEDS REVIEW
                          </span>
                        </div>
                        <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>
                          {reg.leaderName} ({reg.leaderRoll}) — {reg.eventTitle}
                        </h4>
                        <div style={{ fontSize: '0.78rem', color: '#A8B3C2' }}>
                          Txn ID: <strong style={{ color: '#DCE3E5' }}>{reg.transactionId || 'Unspecified'}</strong> • Amount: <strong style={{ color: '#BACEBB' }}>₹{reg.fee}</strong> • Phone: {reg.leaderPhone}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {reg.paymentScreenshotUrl && (
                          <button
                            onClick={() => setSelectedProofUrl(reg.paymentScreenshotUrl || null)}
                            style={{
                              background: 'rgba(40, 59, 120, 0.35)',
                              border: '1px solid rgba(120, 149, 147, 0.4)',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              color: '#DCE3E5',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Eye size={14} />
                            <span>View Proof</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleVerifyPayment(reg.id, 'verified')}
                          style={{
                            background: 'rgba(52, 211, 153, 0.15)',
                            border: '1px solid rgba(52, 211, 153, 0.4)',
                            borderRadius: '8px',
                            padding: '8px 14px',
                            color: '#34D399',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <CheckCircle2 size={14} />
                          <span>Approve & Issue Pass</span>
                        </button>

                        <button
                          onClick={() => {
                            const reason = prompt('Enter rejection reason (optional):') || 'Payment details could not be verified.';
                            handleVerifyPayment(reg.id, 'rejected', reason);
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            color: '#fca5a5',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <XCircle size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FEST EVENTS MASTER DIRECTORY */}
        {activeTab === 'events' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="font-title" style={{ fontSize: '1.15rem', color: '#FFFFFF', margin: 0 }}>
                  Fest Events Master Controller
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                  Manage capacities, fees, and registration gates across all 30+ events
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {events.map(event => (
                <div
                  key={event.id}
                  style={{
                    background: 'rgba(20, 31, 62, 0.85)',
                    border: '1px solid rgba(220, 227, 229, 0.16)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(40, 59, 120, 0.5)',
                          color: '#BACEBB'
                        }}
                      >
                        {event.departmentCode} • {event.category.toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: event.status === 'open' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          border: `1px solid ${event.status === 'open' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                          color: event.status === 'open' ? '#34D399' : '#f87171'
                        }}
                      >
                        {event.status.toUpperCase()}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px' }}>
                      {event.title}
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '0 0 12px', lineHeight: 1.5 }}>
                      {event.description.slice(0, 100)}...
                    </p>
                  </div>

                  <div
                    style={{
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(220, 227, 229, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', color: '#DCE3E5' }}>
                      Fee: <strong style={{ color: '#BACEBB' }}>{event.fee === 0 ? 'FREE' : `₹${event.fee}`}</strong> • Slots: {event.registeredCount}/{event.capacity}
                    </div>

                    <button
                      onClick={() => handleToggleEventStatus(event)}
                      style={{
                        background: event.status === 'open' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                        border: `1px solid ${event.status === 'open' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(52, 211, 153, 0.4)'}`,
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: event.status === 'open' ? '#fca5a5' : '#34D399',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {event.status === 'open' ? 'Close Gate' : 'Open Gate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CAMPUS BULLETINS BROADCAST */}
        {activeTab === 'bulletins' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Create Bulletin Form */}
            <div
              style={{
                background: 'rgba(20, 31, 62, 0.85)',
                border: '1px solid rgba(220, 227, 229, 0.18)',
                borderRadius: '16px',
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Bell size={18} color="#BACEBB" />
                <h3 className="font-title" style={{ fontSize: '1.1rem', color: '#FFFFFF', margin: 0 }}>
                  Broadcast New Campus Bulletin
                </h3>
              </div>

              <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Bulletin Priority / Category
                  </label>
                  <select
                    value={newAnnType}
                    onChange={e => setNewAnnType(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(16, 26, 53, 0.9)',
                      border: '1px solid rgba(220, 227, 229, 0.25)',
                      color: '#FFFFFF',
                      fontSize: '0.84rem'
                    }}
                  >
                    <option value="urgent">Urgent Announcement (Red)</option>
                    <option value="general">General Campus Notice (Sage)</option>
                    <option value="prize">Prize Pool / Perk Alert</option>
                    <option value="workshop">Keynote & Workshop Notice</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Headline Title
                  </label>
                  <input
                    type="text"
                    value={newAnnTitle}
                    onChange={e => setNewAnnTitle(e.target.value)}
                    placeholder="e.g. Hackathon Schedule Shift or Cash Prize update"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(16, 26, 53, 0.9)',
                      border: '1px solid rgba(220, 227, 229, 0.25)',
                      color: '#FFFFFF',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Message Content
                  </label>
                  <textarea
                    rows={3}
                    value={newAnnMessage}
                    onChange={e => setNewAnnMessage(e.target.value)}
                    placeholder="Detail message to display on the fest marquee and student bells"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(16, 26, 53, 0.9)',
                      border: '1px solid rgba(220, 227, 229, 0.25)',
                      color: '#FFFFFF',
                      fontSize: '0.84rem',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-cyber-primary"
                  style={{
                    padding: '11px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Plus size={16} />
                  <span>Publish Fest-Wide Bulletin</span>
                </button>
              </form>
            </div>

            {/* Existing Bulletins List */}
            <div>
              <h3 className="font-title" style={{ fontSize: '1.1rem', color: '#FFFFFF', margin: '0 0 16px' }}>
                Active Bulletins ({announcements.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {announcements.map(ann => (
                  <div
                    key={ann.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: 'rgba(20, 31, 62, 0.85)',
                      borderLeft: `4px solid ${ann.type === 'urgent' ? '#F43F5E' : '#789593'}`,
                      border: '1px solid rgba(220, 227, 229, 0.16)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>{ann.title}</span>
                        <span style={{ fontSize: '0.68rem', color: '#A8B3C2' }}>• {ann.date}</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: 0, lineHeight: 1.5 }}>
                        {ann.message}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f87171',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px'
                      }}
                      title="Remove Bulletin"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: MASTER STUDENT ROSTER & EXPORT */}
        {activeTab === 'roster' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <h3 className="font-title" style={{ fontSize: '1.15rem', color: '#FFFFFF', margin: 0 }}>
                  Master Participant Registry
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                  Complete database of registered delegates, pass states, and credentials
                </p>
              </div>

              <button
                onClick={handleExportCSV}
                className="btn-cyber-primary"
                style={{
                  padding: '9px 18px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '10px'
                }}
              >
                <Download size={15} />
                <span>Download Master CSV Roster</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '18px',
                flexWrap: 'wrap',
                background: 'rgba(20, 31, 62, 0.7)',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(220, 227, 229, 0.15)'
              }}
            >
              <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                <Search size={15} color="#789593" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input
                  type="text"
                  placeholder="Search by student name, roll number, or event..."
                  value={rosterSearch}
                  onChange={e => setRosterSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '8px',
                    background: 'rgba(16, 26, 53, 0.9)',
                    border: '1px solid rgba(220, 227, 229, 0.2)',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <select
                value={rosterDeptFilter}
                onChange={e => setRosterDeptFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(16, 26, 53, 0.9)',
                  border: '1px solid rgba(220, 227, 229, 0.2)',
                  color: '#FFFFFF',
                  fontSize: '0.82rem'
                }}
              >
                <option value="all">All Departments</option>
                {DEPARTMENTS.map(d => (
                  <option key={d.code} value={d.code}>{d.code}</option>
                ))}
              </select>

              <select
                value={rosterPaymentFilter}
                onChange={e => setRosterPaymentFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(16, 26, 53, 0.9)',
                  border: '1px solid rgba(220, 227, 229, 0.2)',
                  color: '#FFFFFF',
                  fontSize: '0.82rem'
                }}
              >
                <option value="all">All Payment Statuses</option>
                <option value="verified">Verified</option>
                <option value="verification_pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Table */}
            <div
              style={{
                background: 'rgba(20, 31, 62, 0.85)',
                border: '1px solid rgba(220, 227, 229, 0.16)',
                borderRadius: '14px',
                overflowX: 'auto'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(220, 227, 229, 0.15)', background: 'rgba(16, 26, 53, 0.6)', color: '#A8B3C2' }}>
                    <th style={{ padding: '12px 16px' }}>Reg ID</th>
                    <th style={{ padding: '12px 16px' }}>Student Delegate</th>
                    <th style={{ padding: '12px 16px' }}>Roll Number</th>
                    <th style={{ padding: '12px 16px' }}>Event</th>
                    <th style={{ padding: '12px 16px' }}>Fee</th>
                    <th style={{ padding: '12px 16px' }}>Payment</th>
                    <th style={{ padding: '12px 16px' }}>Gate Check-In</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.map(r => (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: '1px solid rgba(220, 227, 229, 0.08)',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(40, 59, 120, 0.25)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#BACEBB', fontWeight: 700 }}>
                        {r.id}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#FFFFFF', fontWeight: 600 }}>
                        {r.leaderName}
                        <div style={{ fontSize: '0.72rem', color: '#A8B3C2' }}>{r.leaderEmail}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#DCE3E5', fontFamily: 'monospace' }}>
                        {r.leaderRoll}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#FFFFFF' }}>
                        {r.eventTitle}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#BACEBB', fontWeight: 700 }}>
                        ₹{r.fee}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            background: 
                              r.paymentStatus === 'verified' ? 'rgba(52, 211, 153, 0.15)' :
                              r.paymentStatus === 'verification_pending' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color:
                              r.paymentStatus === 'verified' ? '#34D399' :
                              r.paymentStatus === 'verification_pending' ? '#FBBF24' : '#f87171'
                          }}
                        >
                          {r.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            background: r.checkedIn ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            color: r.checkedIn ? '#34D399' : '#A8B3C2'
                          }}
                        >
                          {r.checkedIn ? 'CHECKED IN' : 'NOT ARRIVED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Proof Viewer Lightbox Modal */}
      {selectedProofUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedProofUrl(null)}
        >
          <div
            style={{
              maxWidth: '500px',
              width: '100%',
              background: '#142042',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(220, 227, 229, 0.25)',
              textAlign: 'center'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h4 style={{ color: '#FFFFFF', margin: '0 0 14px' }}>Submitted UPI Screenshot Proof</h4>
            <img
              src={selectedProofUrl}
              alt="Payment Screenshot"
              style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '10px', marginBottom: '14px' }}
            />
            <button
              onClick={() => setSelectedProofUrl(null)}
              className="btn-cyber-primary"
              style={{ padding: '8px 24px', fontSize: '0.85rem' }}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
