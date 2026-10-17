import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, IndianRupee, Layers, CheckCircle2, Clock, Search, 
  Download, Plus, Edit3, Trash2, ArrowRight, LogOut, Globe, QrCode, 
  Sparkles, Check, AlertCircle, RefreshCw, XCircle, Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminUser } from '../../services/adminAuthService';
import { StorageService } from '../../services/storageService';
import { FestEvent, Registration, FestStats, PaymentStatus, EventFormat } from '../../types/festronix';
import { DEPARTMENTS } from '../../data/mockData';

interface DeptCoordinatorDashboardProps {
  adminUser: AdminUser;
  onLogout: () => void;
  onSwitchToFest: () => void;
}

export const DeptCoordinatorDashboard: React.FC<DeptCoordinatorDashboardProps> = ({ adminUser, onLogout, onSwitchToFest }) => {
  const deptCode = adminUser.departmentCode || 'CSE';
  const deptInfo = StorageService.getDepartments().find(d => d.code.toUpperCase() === deptCode.toUpperCase()) || 
                   DEPARTMENTS.find(d => d.code.toUpperCase() === deptCode.toUpperCase());

  const [activeTab, setActiveTab] = useState<'events' | 'roster' | 'checkin' | 'payments'>('events');

  const [deptStats, setDeptStats] = useState<FestStats>(StorageService.getDepartmentStats(deptCode));
  const [events, setEvents] = useState<FestEvent[]>(
    StorageService.getEvents().filter(e => e.departmentCode.toUpperCase() === deptCode.toUpperCase())
  );
  const [registrations, setRegistrations] = useState<Registration[]>(() =>
    StorageService.getDepartmentRegistrations(deptCode)
  );

  // Gate Check-in State
  const [checkInInput, setCheckInInput] = useState('');
  const [checkInResult, setCheckInResult] = useState<{
    success: boolean;
    status: 'VALID' | 'ALREADY_CHECKED_IN' | 'NOT_FOUND' | 'PAYMENT_PENDING';
    registration?: Registration;
    message: string;
  } | null>(null);

  // Search Filter in Roster
  const [rosterSearch, setRosterSearch] = useState('');
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  // Edit Event Modal State (FR-EVT-01 to FR-EVT-08)
  const [editingEvent, setEditingEvent] = useState<FestEvent | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  // Add Event Form State (FR-EVT-01 to FR-EVT-08)
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<'technical' | 'workshop' | 'hackathon' | 'gaming' | 'non-technical'>('technical');
  const [newEventFormat, setNewEventFormat] = useState<EventFormat>('individual');
  const [newEventMinTeamSize, setNewEventMinTeamSize] = useState(1);
  const [newEventMaxTeamSize, setNewEventMaxTeamSize] = useState(1);
  const [newEventFee, setNewEventFee] = useState(150);
  const [newEventCapacity, setNewEventCapacity] = useState(60);
  const [newEventVenue, setNewEventVenue] = useState('Auditorium Block A');
  const [newEventDate, setNewEventDate] = useState('April 24, 2026');
  const [newEventTime, setNewEventTime] = useState('10:00 AM');
  const [newEventDeadline, setNewEventDeadline] = useState('April 22, 2026');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventRules, setNewEventRules] = useState('Valid college ID required\nReport 15 minutes before start');
  const [newEventPaymentInstructions, setNewEventPaymentInstructions] = useState('Pay via Festronix Central UPI QR or spot desk');
  const [newEventCoordinatorName, setNewEventCoordinatorName] = useState(adminUser.fullName);
  const [newEventCoordinatorPhone, setNewEventCoordinatorPhone] = useState(adminUser.phone || '+91 98480 12345');
  const [newEventCoordinatorEmail, setNewEventCoordinatorEmail] = useState(adminUser.email);
  const [newEventPublishPolicy, setNewEventPublishPolicy] = useState<'open' | 'pending_approval'>('open');

  const refreshDeptData = async () => {
    setDeptStats(StorageService.getDepartmentStats(deptCode));
    const all = StorageService.getEvents();
    const deptEvts = all.filter(e => e.departmentCode.toUpperCase() === deptCode.toUpperCase());
    setEvents(deptEvts);
    setRegistrations(StorageService.getDepartmentRegistrations(deptCode));

    try {
      const [liveEvts, liveRegs] = await Promise.all([
        StorageService.fetchEvents(),
        StorageService.fetchRegistrations()
      ]);
      const updatedDeptEvts = liveEvts.filter(e => e.departmentCode.toUpperCase() === deptCode.toUpperCase());
      setEvents(updatedDeptEvts);
      setRegistrations(liveRegs.filter(r => StorageService.resolveDepartmentForRegistration(r, liveEvts) === deptCode.toUpperCase()));
      setDeptStats(StorageService.getDepartmentStats(deptCode));
    } catch (err) {
      console.warn('Dept dashboard sync warning:', err);
    }
  };

  useEffect(() => {
    refreshDeptData();

    // Listen to real-time local updates and cross-tab storage changes
    const handleRegsUpdate = () => {
      refreshDeptData();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'festronix_registrations_v1' || e.key === 'festronix_events_v1') {
        refreshDeptData();
      }
    };

    window.addEventListener('festronix:regs-updated', handleRegsUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('festronix:regs-updated', handleRegsUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [deptCode]);

  // Toggle Event Status
  const handleToggleEventStatus = async (event: FestEvent) => {
    const nextStatus = event.status === 'open' ? 'closed' : 'open';
    const updated = { ...event, status: nextStatus as any };
    await StorageService.updateEvent(updated);
    refreshDeptData();
  };

  // Save Edited Event
  const handleSaveEditedEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    await StorageService.updateEvent(editingEvent);
    setEditingEvent(null);
    refreshDeptData();
  };

  // Add New Event (FR-EVT-01 to FR-EVT-08)
  const handleCreateNewEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    let minSize = 1;
    let maxSize = 1;
    if (newEventFormat === 'duo') {
      minSize = 2;
      maxSize = 2;
    } else if (newEventFormat === 'team') {
      minSize = Math.max(2, Number(newEventMinTeamSize) || 2);
      maxSize = Math.max(minSize, Number(newEventMaxTeamSize) || 4);
    }

    const rulesArr = newEventRules
      .split('\n')
      .map(r => r.trim())
      .filter(Boolean);

    const newEvt: FestEvent = {
      id: `evt-${deptCode.toLowerCase()}-${Date.now().toString().slice(-4)}`,
      slug: newEventTitle.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      title: newEventTitle.trim(),
      departmentId: deptInfo?.id || `dept-${deptCode.toLowerCase()}`,
      departmentCode: deptCode,
      category: newEventCategory,
      format: newEventFormat,
      minTeamSize: minSize,
      maxTeamSize: maxSize,
      fee: Number(newEventFee),
      capacity: Number(newEventCapacity),
      registeredCount: 0,
      deadline: newEventDeadline || 'April 22, 2026',
      date: newEventDate,
      time: newEventTime,
      venue: newEventVenue,
      description: newEventDesc || 'Exciting engineering challenge hosted by the department.',
      rules: rulesArr.length > 0 ? rulesArr : ['Valid college ID required', 'Report 15 minutes before start'],
      prizes: { first: '₹15,000 Cash + Certificate', second: '₹8,000 Cash' },
      eligibility: 'All Engineering Students',
      coordinatorName: newEventCoordinatorName.trim() || adminUser.fullName,
      coordinatorPhone: newEventCoordinatorPhone.trim() || adminUser.phone || '+91 98480 12345',
      coordinatorEmail: newEventCoordinatorEmail.trim() || adminUser.email,
      status: newEventPublishPolicy,
      approvalStatus: newEventPublishPolicy === 'open' ? 'approved' : 'pending',
      paymentInstructions: newEventPaymentInstructions.trim() || 'Pay via Festronix Central UPI or on-venue spot desk',
      bannerGradient: 'linear-gradient(135deg, #283B78 0%, #101A35 100%)'
    };

    await StorageService.addEvent(newEvt);
    setIsAddEventOpen(false);
    setNewEventTitle('');
    setNewEventDesc('');
    refreshDeptData();
  };

  // Fast Gate Check-In Handler
  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInInput.trim()) return;

    // Check if the input is a roll number or an ID
    const query = checkInInput.trim().toLowerCase();
    const matchingReg = registrations.find(
      r => r.id.toLowerCase() === query || 
           r.qrToken.toLowerCase() === query || 
           (r.leaderRoll && r.leaderRoll.toLowerCase() === query) ||
           (r.buyerRoll && r.buyerRoll.toLowerCase() === query) ||
           (r.teamCode && r.teamCode.toLowerCase() === query) ||
           (r.teammates && r.teammates.some(t => t.rollNumber && t.rollNumber.toLowerCase() === query))
    );

    if (!matchingReg) {
      setCheckInResult({
        success: false,
        status: 'NOT_FOUND',
        message: `No registration found matching "${checkInInput}" for the ${deptCode} department.`
      });
      return;
    }

    const res = await StorageService.checkInRegistration(matchingReg.id, adminUser.fullName);
    setCheckInResult(res);

    if (res.success) {
      confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
      setCheckInInput('');
    }
    refreshDeptData();
  };

  // 1-Click Check-in directly from the roster table
  const handleQuickCheckInFromRoster = async (reg: Registration) => {
    const res = await StorageService.checkInRegistration(reg.id, adminUser.fullName);
    setCheckInResult(res);
    if (res.success) {
      confetti({ particleCount: 50, spread: 40 });
    }
    refreshDeptData();
  };

  // Payment Verification Handler
  const handleVerifyPayment = async (regId: string, status: PaymentStatus, reason?: string) => {
    const success = await StorageService.updatePaymentStatus(regId, status, adminUser.fullName, reason);
    if (success) {
      if (status === 'verified') {
        confetti({ particleCount: 60, spread: 50 });
      }
      refreshDeptData();
    }
  };

  // Export Dept CSV
  const handleExportDeptCSV = () => {
    const headers = ['Reg ID', 'Event Title', 'Student Name', 'Roll Number', 'Team Name', 'Team Code', 'Email', 'Phone', 'College', 'Fee (INR)', 'Payment Status', 'Checked In'];
    const rows = registrations.map(r => [
      r.id,
      `"${r.eventTitle.replace(/"/g, '""')}"`,
      `"${r.leaderName.replace(/"/g, '""')}"`,
      r.leaderRoll,
      `"${(r.teamName || 'Solo').replace(/"/g, '""')}"`,
      r.teamCode || 'N/A',
      r.leaderEmail,
      r.leaderPhone,
      `"${r.leaderCollege.replace(/"/g, '""')}"`,
      r.fee,
      r.paymentStatus,
      r.checkedIn ? 'YES' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FESTRONIX_${deptCode}_ATTENDEE_ROSTER_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Dept Roster
  const filteredRoster = registrations.filter(r => {
    return (
      r.leaderName.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      r.leaderRoll.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      r.eventTitle.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      (r.teamName && r.teamName.toLowerCase().includes(rosterSearch.toLowerCase())) ||
      (r.teamCode && r.teamCode.toLowerCase().includes(rosterSearch.toLowerCase()))
    );
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'transparent', color: '#FFFFFF', paddingBottom: '60px' }}>
      {/* Top Department Coordinator Header */}
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
            <Building2 size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="font-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                DEPARTMENT OF {deptInfo?.name?.toUpperCase() || deptCode}
              </h1>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(120, 149, 147, 0.25)',
                  border: '1px solid rgba(120, 149, 147, 0.5)',
                  color: '#BACEBB',
                  fontWeight: 800
                }}
              >
                {deptCode} DESK
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
              {adminUser.fullName} • {adminUser.designation} • Chief: {deptInfo?.chiefCoordinator}
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
          {/* Card 1: Dept Registrations */}
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
                Dept Registrations
              </span>
              <Users size={18} color="#789593" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
              {deptStats.totalRegistrations}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#BACEBB', marginTop: '6px' }}>
              {deptStats.onlineCount} online • {deptStats.spotCount} spot delegates
            </div>
          </div>

          {/* Card 2: Dept Revenue */}
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
                Dept Revenue
              </span>
              <IndianRupee size={18} color="#BACEBB" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#BACEBB', lineHeight: 1.1 }}>
              ₹{deptStats.totalCollected.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#A8B3C2', marginTop: '6px' }}>
              Generated across {events.length} {deptCode} events
            </div>
          </div>

          {/* Card 3: Events & Capacity */}
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
                Active Dept Events
              </span>
              <Layers size={18} color="#DCE3E5" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
              {events.length}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#A8B3C2', marginTop: '6px' }}>
              Total department capacity: {deptStats.totalCapacity} seats
            </div>
          </div>

          {/* Card 4: Gate Check-in Rate */}
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
                Venue Attendance
              </span>
              <CheckCircle2 size={18} color="#34D399" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#34D399', lineHeight: 1.1 }}>
              {deptStats.checkedInCount} / {deptStats.totalRegistrations}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#A8B3C2', marginTop: '6px' }}>
              {deptStats.totalRegistrations > 0 ? Math.round((deptStats.checkedInCount / deptStats.totalRegistrations) * 100) : 0}% Checked-In at Venue Desk
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
            { id: 'events', label: `${deptCode} Events (${events.length})`, icon: Layers },
            { id: 'roster', label: `Attendee Roster (${registrations.length})`, icon: Users },
            { id: 'checkin', label: 'Fast Gate Check-In Desk', icon: QrCode },
            { id: 'payments', label: `Payment Approvals (${registrations.filter(r => r.paymentStatus === 'verification_pending').length})`, icon: Clock }
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

        {/* TAB 1: DEPARTMENT EVENTS MANAGEMENT */}
        {activeTab === 'events' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="font-title" style={{ fontSize: '1.15rem', color: '#FFFFFF', margin: 0 }}>
                  {deptCode} Department Event Operations
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                  Manage department event schedules, entry fees, maximum slots, and registration status
                </p>
              </div>

              <button
                onClick={() => setIsAddEventOpen(true)}
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
                <Plus size={16} />
                <span>Add Department Event</span>
              </button>
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
                        {event.category.toUpperCase()} • {event.format.toUpperCase()}
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
                    <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '0 0 10px', lineHeight: 1.5 }}>
                      {event.description.slice(0, 100)}...
                    </p>

                    <div style={{ fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>
                      📍 Venue: <strong>{event.venue}</strong>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '12px' }}>
                      🗓️ Schedule: {event.date} at {event.time}
                    </div>
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
                      Fee: <strong style={{ color: '#BACEBB' }}>{event.fee === 0 ? 'FREE' : `₹${event.fee}`}</strong> • {event.registeredCount}/{event.capacity} Slots
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setEditingEvent(event)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(220, 227, 229, 0.2)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          color: '#DCE3E5',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <Edit3 size={13} />
                      </button>

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
                        {event.status === 'open' ? 'Close' : 'Open'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DEPARTMENT ATTENDEE ROSTER */}
        {activeTab === 'roster' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="font-title" style={{ fontSize: '1.15rem', color: '#FFFFFF', margin: 0 }}>
                  {deptCode} Student Attendee Master Roster
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                  Real-time list of all students enrolled in {deptCode} events with 1-click gate check-in
                </p>
              </div>

              <button
                onClick={handleExportDeptCSV}
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
                <span>Export {deptCode} CSV Roster</span>
              </button>
            </div>

            {/* Search Input */}
            <div style={{ marginBottom: '16px', position: 'relative' }}>
              <Search size={15} color="#789593" style={{ position: 'absolute', left: '12px', top: '11px' }} />
              <input
                type="text"
                placeholder={`Search ${deptCode} attendees by student name, roll number, or event title...`}
                value={rosterSearch}
                onChange={e => setRosterSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '10px',
                  background: 'rgba(20, 31, 62, 0.85)',
                  border: '1px solid rgba(220, 227, 229, 0.2)',
                  color: '#FFFFFF',
                  fontSize: '0.84rem',
                  boxSizing: 'border-box'
                }}
              />
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
                    <th style={{ padding: '12px 16px' }}>Student Name</th>
                    <th style={{ padding: '12px 16px' }}>Roll Number</th>
                    <th style={{ padding: '12px 16px' }}>Event</th>
                    <th style={{ padding: '12px 16px' }}>Fee</th>
                    <th style={{ padding: '12px 16px' }}>Payment</th>
                    <th style={{ padding: '12px 16px' }}>Check-In Action</th>
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
                        <div style={{ fontSize: '0.72rem', color: '#A8B3C2' }}>{r.leaderPhone}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#DCE3E5', fontFamily: 'monospace' }}>
                        {r.leaderRoll}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#FFFFFF' }}>
                        <div>{r.eventTitle}</div>
                        {(r.teamName || r.teamCode) && (
                          <div style={{ fontSize: '0.72rem', color: '#BACEBB', marginTop: '2px' }}>
                            Squad: <strong>{r.teamName || 'Team'}</strong> <span style={{ fontFamily: 'monospace', color: '#A8B3C2' }}>({r.teamCode})</span>
                          </div>
                        )}
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
                        {r.checkedIn ? (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: 'rgba(52, 211, 153, 0.2)',
                              color: '#34D399',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Check size={12} />
                            <span>Checked In</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleQuickCheckInFromRoster(r)}
                            style={{
                              background: 'rgba(40, 59, 120, 0.45)',
                              border: '1px solid rgba(120, 149, 147, 0.4)',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              color: '#BACEBB',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Mark Present
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: FAST GATE CHECK-IN DESK */}
        {activeTab === 'checkin' && (
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div
              style={{
                background: 'rgba(20, 31, 62, 0.95)',
                border: '1px solid rgba(220, 227, 229, 0.22)',
                borderRadius: '20px',
                padding: '32px 28px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #283B78 0%, #789593 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}
                >
                  <QrCode size={26} color="#FFFFFF" />
                </div>
                <h3 className="font-title" style={{ fontSize: '1.3rem', color: '#FFFFFF', margin: '0 0 6px' }}>
                  {deptCode} Venue Check-In Desk
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#A8B3C2', margin: 0 }}>
                  Enter student Roll Number, Registration ID (e.g. FEST-2026-XXXX), or paste QR Token to verify access
                </p>
              </div>

              <form onSubmit={handleCheckInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <input
                    type="text"
                    value={checkInInput}
                    onChange={e => setCheckInInput(e.target.value)}
                    placeholder="Enter Student Roll No (e.g. 22VCECS104) or Reg ID"
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: 'rgba(16, 26, 53, 0.95)',
                      border: '1px solid rgba(220, 227, 229, 0.3)',
                      color: '#FFFFFF',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-cyber-primary"
                  style={{
                    padding: '14px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>Verify Pass & Check-In Attendee</span>
                </button>
              </form>

              {/* Check-in Result Card */}
              {checkInResult && (
                <div
                  style={{
                    marginTop: '24px',
                    padding: '16px',
                    borderRadius: '12px',
                    border: `1px solid ${checkInResult.success ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                    background: checkInResult.success ? 'rgba(52, 211, 153, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  {checkInResult.success ? (
                    <CheckCircle2 size={22} color="#34D399" style={{ flexShrink: 0, marginTop: '2px' }} />
                  ) : (
                    <AlertCircle size={22} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: checkInResult.success ? '#34D399' : '#f87171', marginBottom: '4px' }}>
                      {checkInResult.message}
                    </div>
                    {checkInResult.registration && (
                      <div style={{ fontSize: '0.78rem', color: '#DCE3E5' }}>
                        Delegate: {checkInResult.registration.leaderName} ({checkInResult.registration.leaderRoll})<br />
                        Event: {checkInResult.registration.eventTitle} • Status: {checkInResult.registration.paymentStatus.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: DEPARTMENT PAYMENT APPROVALS */}
        {activeTab === 'payments' && (
          <div>
            <div style={{ marginBottom: '18px' }}>
              <h3 className="font-title" style={{ fontSize: '1.15rem', color: '#FFFFFF', margin: 0 }}>
                {deptCode} Payment Verification Desk
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                Clear pending payments for events hosted by the {deptCode} department
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
                <h4 style={{ fontSize: '1.1rem', color: '#FFFFFF', margin: '0 0 6px' }}>All {deptCode} Payments Clear!</h4>
                <p style={{ fontSize: '0.82rem', color: '#A8B3C2', margin: 0 }}>
                  No pending student payments require review for this department.
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
                            PENDING VERIFICATION
                          </span>
                        </div>
                        <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>
                          {reg.leaderName} ({reg.leaderRoll}) — {reg.eventTitle}
                        </h4>
                        <div style={{ fontSize: '0.78rem', color: '#A8B3C2' }}>
                          Txn ID: <strong style={{ color: '#DCE3E5' }}>{reg.transactionId || 'Unspecified'}</strong> • Fee: <strong style={{ color: '#BACEBB' }}>₹{reg.fee}</strong> • Phone: {reg.leaderPhone}
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
                            const reason = prompt('Enter rejection reason:') || 'Payment screenshot could not be verified.';
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
                            cursor: 'pointer'
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
      </main>

      {/* Edit Event Modal (FR-EVT-01 to FR-EVT-08) */}
      {editingEvent && (
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
          onClick={() => setEditingEvent(null)}
        >
          <div
            style={{
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#142042',
              borderRadius: '16px',
              padding: '26px',
              border: '1px solid rgba(220, 227, 229, 0.25)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ color: '#FFFFFF', margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Configure Event: {editingEvent.title}
              </h4>
              <span style={{ fontSize: '0.72rem', background: 'rgba(255, 215, 0, 0.15)', color: '#FFD700', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                {editingEvent.departmentCode}
              </span>
            </div>

            <form onSubmit={handleSaveEditedEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Event Title</label>
                <input
                  type="text"
                  value={editingEvent.title}
                  onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  required
                />
              </div>

              {/* Format & Team Sizes (FR-EVT-03, FR-EVT-04) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Participation Format (FR-EVT-03)</label>
                  <select
                    value={editingEvent.format}
                    onChange={e => {
                      const fmt = e.target.value as EventFormat;
                      const minSize = fmt === 'duo' ? 2 : fmt === 'team' ? Math.max(2, editingEvent.minTeamSize) : 1;
                      const maxSize = fmt === 'duo' ? 2 : fmt === 'team' ? Math.max(minSize, editingEvent.maxTeamSize) : 1;
                      setEditingEvent({ ...editingEvent, format: fmt, minTeamSize: minSize, maxTeamSize: maxSize });
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF' }}
                  >
                    <option value="individual">Individual (Solo)</option>
                    <option value="duo">Duo (2 Members)</option>
                    <option value="team">Team (Configurable Squad)</option>
                  </select>
                </div>

                {editingEvent.format === 'team' ? (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Min Team Size (FR-EVT-04)</label>
                      <input
                        type="number"
                        min={2}
                        max={10}
                        value={editingEvent.minTeamSize}
                        onChange={e => setEditingEvent({ ...editingEvent, minTeamSize: Number(e.target.value) })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Max Team Size (FR-EVT-04)</label>
                      <input
                        type="number"
                        min={editingEvent.minTeamSize}
                        max={15}
                        value={editingEvent.maxTeamSize}
                        onChange={e => setEditingEvent({ ...editingEvent, maxTeamSize: Number(e.target.value) })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: '#A8B3C2' }}>
                    Team size fixed at {editingEvent.format === 'duo' ? '2 members' : '1 member (solo)'}.
                  </div>
                )}
              </div>

              {/* Fee & Payment Instructions (FR-EVT-05) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Entry Fee (INR) (FR-EVT-05)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingEvent.fee}
                    onChange={e => setEditingEvent({ ...editingEvent, fee: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#A8B3C2' }}>Set to 0 for Free Event</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Payment Instructions (FR-EVT-05)</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI to festronix.vce@sbi or pay cash at spot desk"
                    value={editingEvent.paymentInstructions || ''}
                    onChange={e => setEditingEvent({ ...editingEvent, paymentInstructions: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Capacity & Deadline (FR-EVT-06) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Max Capacity Slots (FR-EVT-06)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingEvent.capacity}
                    onChange={e => setEditingEvent({ ...editingEvent, capacity: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Registration Deadline (FR-EVT-06)</label>
                  <input
                    type="text"
                    value={editingEvent.deadline}
                    onChange={e => setEditingEvent({ ...editingEvent, deadline: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Schedule & Venue (FR-EVT-07) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Date</label>
                  <input
                    type="text"
                    value={editingEvent.date}
                    onChange={e => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Time</label>
                  <input
                    type="text"
                    value={editingEvent.time}
                    onChange={e => setEditingEvent({ ...editingEvent, time: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Venue Location</label>
                  <input
                    type="text"
                    value={editingEvent.venue}
                    onChange={e => setEditingEvent({ ...editingEvent, venue: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Assigned Event Coordinator (FR-EVT-01, FR-EVT-07) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Coordinator Name (FR-EVT-01)</label>
                  <input
                    type="text"
                    value={editingEvent.coordinatorName}
                    onChange={e => setEditingEvent({ ...editingEvent, coordinatorName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Coordinator Phone</label>
                  <input
                    type="text"
                    value={editingEvent.coordinatorPhone}
                    onChange={e => setEditingEvent({ ...editingEvent, coordinatorPhone: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Coordinator Email</label>
                  <input
                    type="email"
                    value={editingEvent.coordinatorEmail}
                    onChange={e => setEditingEvent({ ...editingEvent, coordinatorEmail: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Rules (FR-EVT-07) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Rules & Guidelines (1 per line) (FR-EVT-07)</label>
                <textarea
                  rows={2}
                  value={Array.isArray(editingEvent.rules) ? editingEvent.rules.join('\n') : ''}
                  onChange={e => setEditingEvent({
                    ...editingEvent,
                    rules: e.target.value.split('\n').map(r => r.trim()).filter(Boolean)
                  })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                />
              </div>

              {/* Status / SAC Publishing Policy (FR-EVT-08) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Event Gate & SAC Approval Status (FR-EVT-08)</label>
                <select
                  value={editingEvent.status}
                  onChange={e => setEditingEvent({
                    ...editingEvent,
                    status: e.target.value as any,
                    approvalStatus: e.target.value === 'open' ? 'approved' : editingEvent.approvalStatus
                  })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF' }}
                >
                  <option value="open">Open (Published & Accepting Registrations)</option>
                  <option value="closed">Closed (Registrations Paused)</option>
                  <option value="pending_approval">Pending SAC Approval (Under Review)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  style={{ background: 'none', border: '1px solid rgba(220, 227, 229, 0.2)', borderRadius: '8px', padding: '8px 16px', color: '#DCE3E5', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cyber-primary"
                  style={{ padding: '8px 20px', borderRadius: '8px', fontWeight: 700 }}
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Event Modal (FR-EVT-01 to FR-EVT-08) */}
      {isAddEventOpen && (
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
          onClick={() => setIsAddEventOpen(false)}
        >
          <div
            style={{
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#142042',
              borderRadius: '16px',
              padding: '26px',
              border: '1px solid rgba(220, 227, 229, 0.25)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h4 style={{ color: '#FFFFFF', margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 800 }}>
              Create New {deptCode} Event (FR-EVT-01 to FR-EVT-08)
            </h4>
            <form onSubmit={handleCreateNewEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AlgoStrike 2026 / Circuit Mania"
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                />
              </div>

              {/* Format & Team Config (FR-EVT-03, FR-EVT-04) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Participation Format (FR-EVT-03)</label>
                  <select
                    value={newEventFormat}
                    onChange={e => setNewEventFormat(e.target.value as any)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF' }}
                  >
                    <option value="individual">Individual (Solo)</option>
                    <option value="duo">Duo (2 Members)</option>
                    <option value="team">Team (Configurable Squad)</option>
                  </select>
                </div>

                {newEventFormat === 'team' ? (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Min Team Size (FR-EVT-04)</label>
                      <input
                        type="number"
                        min={2}
                        max={10}
                        value={newEventMinTeamSize}
                        onChange={e => setNewEventMinTeamSize(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Max Team Size (FR-EVT-04)</label>
                      <input
                        type="number"
                        min={newEventMinTeamSize}
                        max={15}
                        value={newEventMaxTeamSize}
                        onChange={e => setNewEventMaxTeamSize(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: '#A8B3C2' }}>
                    Team size fixed at {newEventFormat === 'duo' ? '2 members' : '1 member (solo)'}.
                  </div>
                )}
              </div>

              {/* Category, Fee & Payment Instructions (FR-EVT-05) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Category</label>
                  <select
                    value={newEventCategory}
                    onChange={e => setNewEventCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF' }}
                  >
                    <option value="technical">Technical</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="workshop">Workshop</option>
                    <option value="gaming">Gaming</option>
                    <option value="non-technical">Non-Tech</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Fee (INR) (FR-EVT-05)</label>
                  <input
                    type="number"
                    min={0}
                    value={newEventFee}
                    onChange={e => setNewEventFee(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '0.68rem', color: '#A8B3C2' }}>0 for Free Event</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Payment Instructions (FR-EVT-05)</label>
                  <input
                    type="text"
                    value={newEventPaymentInstructions}
                    onChange={e => setNewEventPaymentInstructions(e.target.value)}
                    placeholder="e.g. UPI or spot desk"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Capacity Slots & Deadline (FR-EVT-06) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Capacity Slots (FR-EVT-06)</label>
                  <input
                    type="number"
                    min={1}
                    value={newEventCapacity}
                    onChange={e => setNewEventCapacity(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Registration Deadline (FR-EVT-06)</label>
                  <input
                    type="text"
                    value={newEventDeadline}
                    onChange={e => setNewEventDeadline(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Schedule & Venue (FR-EVT-07) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Date</label>
                  <input
                    type="text"
                    value={newEventDate}
                    onChange={e => setNewEventDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Time</label>
                  <input
                    type="text"
                    value={newEventTime}
                    onChange={e => setNewEventTime(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Venue Location</label>
                  <input
                    type="text"
                    value={newEventVenue}
                    onChange={e => setNewEventVenue(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Assigned Coordinator (FR-EVT-01, FR-EVT-07) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Coordinator Name (FR-EVT-01)</label>
                  <input
                    type="text"
                    value={newEventCoordinatorName}
                    onChange={e => setNewEventCoordinatorName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Coordinator Phone</label>
                  <input
                    type="text"
                    value={newEventCoordinatorPhone}
                    onChange={e => setNewEventCoordinatorPhone(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Coordinator Email</label>
                  <input
                    type="email"
                    value={newEventCoordinatorEmail}
                    onChange={e => setNewEventCoordinatorEmail(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Description</label>
                <textarea
                  rows={2}
                  value={newEventDesc}
                  onChange={e => setNewEventDesc(e.target.value)}
                  placeholder="Event summary and learning outcomes"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Rules & Regulations (1 per line) (FR-EVT-07)</label>
                <textarea
                  rows={2}
                  value={newEventRules}
                  onChange={e => setNewEventRules(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                />
              </div>

              {/* SAC Approval Policy (FR-EVT-08) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Publishing & Approval Policy (FR-EVT-08)</label>
                <select
                  value={newEventPublishPolicy}
                  onChange={e => setNewEventPublishPolicy(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF' }}
                >
                  <option value="open">Direct Publishing (Open Gate immediately)</option>
                  <option value="pending_approval">Submit for SAC Dean Approval (Pending status)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddEventOpen(false)}
                  style={{ background: 'none', border: '1px solid rgba(220, 227, 229, 0.2)', borderRadius: '8px', padding: '8px 16px', color: '#DCE3E5', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cyber-primary"
                  style={{ padding: '8px 20px', borderRadius: '8px', fontWeight: 700 }}
                >
                  Create & Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof Lightbox */}
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
            <h4 style={{ color: '#FFFFFF', margin: '0 0 14px' }}>UPI Screenshot Proof</h4>
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
