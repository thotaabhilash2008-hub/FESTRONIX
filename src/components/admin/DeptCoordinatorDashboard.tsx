import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Users, IndianRupee, Layers, CheckCircle2, Clock, Search, 
  Download, Plus, Edit3, Trash2, ArrowRight, LogOut, Globe, QrCode, 
  Sparkles, Check, AlertCircle, RefreshCw, XCircle, Eye, Phone, Mail, 
  Copy, Megaphone, UserPlus, FileSpreadsheet, ShieldCheck, Award, 
  Percent, ChevronRight, Share2, Printer, MapPin, Calendar, Bell, Filter, HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminUser, AdminAuthService } from '../../services/adminAuthService';
import { StorageService } from '../../services/storageService';
import { getEventRegistrationBlockReason } from '../../lib/eventRegistration';
import { FestEvent, Registration, FestStats, PaymentStatus, EventFormat, Announcement, Teammate } from '../../types/festronix';
import { DEPARTMENTS } from '../../data/mockData';
import { AdminHeader } from './AdminHeader';

interface DeptCoordinatorDashboardProps {
  adminUser: AdminUser;
  onLogout: () => void;
  onSwitchToFest: () => void;
}

export const DeptCoordinatorDashboard: React.FC<DeptCoordinatorDashboardProps> = ({ 
  adminUser, 
  onLogout, 
  onSwitchToFest 
}) => {
  const deptCode = adminUser.departmentCode || 'CSE';
  const deptInfo = StorageService.getDepartments().find(d => d.code.toUpperCase() === deptCode.toUpperCase()) || 
                   DEPARTMENTS.find(d => d.code.toUpperCase() === deptCode.toUpperCase());

  // Role Checks (8.1 Event Coordinator vs 8.2 Department Chief Coordinator)
  const isEventCoord = adminUser.role === 'event_coordinator' || adminUser.role === 'faculty_coord' || adminUser.role === 'student_coord';
  const isDeptChief = adminUser.role === 'dept_chief_coordinator' || adminUser.role === 'dept_coordinator';

  // Base Data States
  const [deptStats, setDeptStats] = useState<FestStats>(StorageService.getDepartmentStats(deptCode));
  const [events, setEvents] = useState<FestEvent[]>(() =>
    StorageService.getEvents().filter(e => e.departmentCode.toUpperCase() === deptCode.toUpperCase())
  );
  const [registrations, setRegistrations] = useState<Registration[]>(() =>
    StorageService.getDepartmentRegistrations(deptCode)
  );
  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    StorageService.getAnnouncements().filter(a => 
      a.scope === 'fest-wide' || 
      (a.scope === 'department' && (!a.departmentCode || a.departmentCode.toUpperCase() === deptCode.toUpperCase()))
    )
  );

  // Helper to check if an event is assigned to the current user
  const isEventAssigned = (e: FestEvent): boolean => {
    if (adminUser.assignedEvents && (adminUser.assignedEvents.includes(e.id) || adminUser.assignedEvents.includes(e.slug))) {
      return true;
    }
    if (adminUser.fullName && e.coordinatorName && (
      e.coordinatorName.toLowerCase().includes(adminUser.fullName.toLowerCase()) ||
      adminUser.fullName.toLowerCase().includes(e.coordinatorName.toLowerCase())
    )) {
      return true;
    }
    if (adminUser.email && e.coordinatorEmail && e.coordinatorEmail.toLowerCase() === adminUser.email.toLowerCase()) {
      return true;
    }
    if (adminUser.username === 'event_coord' && (e.id === 'evt-cse-01' || e.id === 'evt-cse-02')) {
      return true;
    }
    return false;
  };

  const assignedEventsList = useMemo(() => {
    return events.filter(isEventAssigned);
  }, [events, adminUser]);

  // 8.1: See assigned events by default
  const [eventScope, setEventScope] = useState<'assigned' | 'all'>(() => {
    return isEventCoord ? 'assigned' : 'all';
  });

  // Active Tab: Event Coordinator vs Department Chief Coordinator defaults
  type DashboardTab = 'events' | 'readiness' | 'roster' | 'checkin' | 'payments' | 'announcements' | 'reports' | 'coordinators';
  const [activeTab, setActiveTab] = useState<DashboardTab>('events');

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
  const [rosterStatusFilter, setRosterStatusFilter] = useState<'all' | 'verified' | 'verification_pending' | 'rejected' | 'checked_in'>('all');
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Edit Event Modal State (8.1 • Edit event details, rules, team limits, fee, capacity, deadline, schedule and venue)
  const [editingEvent, setEditingEvent] = useState<FestEvent | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  // Spot Registration Modal State (8.1 • Create spot registrations on fest day)
  const [isSpotRegOpen, setIsSpotRegOpen] = useState(false);
  const [spotEventId, setSpotEventId] = useState('');
  const [spotLeaderName, setSpotLeaderName] = useState('');
  const [spotLeaderRoll, setSpotLeaderRoll] = useState('');
  const [spotLeaderCollege, setSpotLeaderCollege] = useState('Vardhaman College of Engineering');
  const [spotLeaderEmail, setSpotLeaderEmail] = useState('');
  const [spotLeaderPhone, setSpotLeaderPhone] = useState('');
  const [spotTeamName, setSpotTeamName] = useState('');
  const [spotTeammates, setSpotTeammates] = useState<Teammate[]>([]);
  const [spotPaymentMethod, setSpotPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [spotTxnId, setSpotTxnId] = useState('');
  const [spotAutoCheckIn, setSpotAutoCheckIn] = useState(true);
  const [spotSuccessData, setSpotSuccessData] = useState<Registration | null>(null);

  // Announcement Broadcast Modal State (8.1 • Publish event announcements)
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'urgent' | 'general' | 'prize' | 'workshop'>('urgent');
  const [broadcastScope, setBroadcastScope] = useState<'department' | 'event'>('department');
  const [broadcastEventTitle, setBroadcastEventTitle] = useState('');

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
    setAnnouncements(
      StorageService.getAnnouncements().filter(a => 
        a.scope === 'fest-wide' || 
        (a.scope === 'department' && (!a.departmentCode || a.departmentCode.toUpperCase() === deptCode.toUpperCase()))
      )
    );

    try {
      const [liveEvts, liveRegs, liveAnnouncements] = await Promise.all([
        StorageService.fetchEvents(),
        StorageService.fetchRegistrations(),
        StorageService.fetchAnnouncements()
      ]);
      const updatedDeptEvts = liveEvts.filter(e => e.departmentCode.toUpperCase() === deptCode.toUpperCase());
      setEvents(updatedDeptEvts);
      setRegistrations(liveRegs.filter(r => StorageService.resolveDepartmentForRegistration(r, liveEvts) === deptCode.toUpperCase()));
      setAnnouncements(liveAnnouncements.filter(a =>
        a.scope === 'fest-wide' ||
        (a.scope === 'department' && (!a.departmentCode || a.departmentCode.toUpperCase() === deptCode.toUpperCase()))
      ));
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

    const handleEventsUpdate = () => {
      refreshDeptData();
    };

    const handleAnnouncementsUpdate = () => {
      setAnnouncements(
        StorageService.getAnnouncements().filter(a =>
          a.scope === 'fest-wide' ||
          (a.scope === 'department' && (!a.departmentCode || a.departmentCode.toUpperCase() === deptCode.toUpperCase()))
        )
      );
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'festronix_registrations_v1' || e.key === 'festronix_events_v1' || e.key === 'festronix_announcements_v1') {
        refreshDeptData();
      }
    };

    window.addEventListener('festronix:regs-updated', handleRegsUpdate);
    window.addEventListener('festronix:events-updated', handleEventsUpdate);
    window.addEventListener('festronix:announcements-updated', handleAnnouncementsUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('festronix:regs-updated', handleRegsUpdate);
      window.removeEventListener('festronix:events-updated', handleEventsUpdate);
      window.removeEventListener('festronix:announcements-updated', handleAnnouncementsUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [deptCode]);

  // Determine which events are actively filtered into view
  const visibleEvents = useMemo(() => {
    if (isEventCoord) return assignedEventsList;
    return eventScope === 'assigned' ? assignedEventsList : events;
  }, [eventScope, assignedEventsList, events, isEventCoord]);

  // Determine registrations for active event scope
  const scopedRegistrations = useMemo(() => {
    if (isEventCoord || eventScope === 'assigned') {
      const assignedIds = new Set(assignedEventsList.map(e => e.id));
      const assignedSlugs = new Set(assignedEventsList.map(e => e.slug));
      const assignedTitles = new Set(assignedEventsList.map(e => e.title.toLowerCase()));
      return registrations.filter(r => assignedIds.has(r.eventId) || assignedSlugs.has(r.eventId) || assignedTitles.has(r.eventTitle.toLowerCase()));
    }
    return registrations;
  }, [eventScope, assignedEventsList, registrations, isEventCoord]);

  // Filtered Roster with Search and Status
  const filteredRoster = useMemo(() => {
    return scopedRegistrations.filter(r => {
      const matchesSearch = 
        r.leaderName.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        r.leaderRoll.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        r.eventTitle.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        r.id.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        (r.teamName && r.teamName.toLowerCase().includes(rosterSearch.toLowerCase())) ||
        (r.teamCode && r.teamCode.toLowerCase().includes(rosterSearch.toLowerCase()));

      if (!matchesSearch) return false;

      if (rosterStatusFilter === 'verified') return r.paymentStatus === 'verified';
      if (rosterStatusFilter === 'verification_pending') return r.paymentStatus === 'verification_pending';
      if (rosterStatusFilter === 'rejected') return r.paymentStatus === 'rejected';
      if (rosterStatusFilter === 'checked_in') return r.checkedIn === true;

      return true;
    });
  }, [scopedRegistrations, rosterSearch, rosterStatusFilter]);

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
    confetti({ particleCount: 50, spread: 45 });
  };

  // Add New Event (FR-EVT-01 to FR-EVT-08)
  const handleCreateNewEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDeptChief) {
      alert('Only the department HOD can create department events.');
      return;
    }
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
      // Department-created events must go through SAC approval. Global admins
      // use the Dean console for direct publishing.
      status: 'pending_approval',
      approvalStatus: 'pending',
      paymentInstructions: newEventPaymentInstructions.trim() || 'Pay via Festronix Central UPI or on-venue spot desk',
      bannerGradient: 'linear-gradient(135deg, #283B78 0%, #101A35 100%)'
    };

    await StorageService.addEvent(newEvt);
    setIsAddEventOpen(false);
    setNewEventTitle('');
    setNewEventDesc('');
    refreshDeptData();
    confetti({ particleCount: 60, spread: 50 });
  };

  // Spot Registration Handler (8.1 • Create spot registrations on fest day)
  const handleCreateSpotRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEvt = events.find(ev => ev.id === spotEventId) || visibleEvents[0];
    if (!targetEvt || !spotLeaderName.trim() || !spotLeaderRoll.trim()) {
      alert('Please fill out attendee name and roll number.');
      return;
    }

    const registrationBlockReason = getEventRegistrationBlockReason(targetEvt);
    if (registrationBlockReason) {
      alert(registrationBlockReason);
      return;
    }

    const isTeam = targetEvt.format === 'team' || targetEvt.format === 'duo';
    if (isTeam && !spotTeamName.trim()) {
      alert('Please enter a team name for this registration.');
      return;
    }
    if (isTeam) {
      const teamSize = 1 + spotTeammates.length;
      if (teamSize < targetEvt.minTeamSize || teamSize > targetEvt.maxTeamSize) {
        alert(`Team size must be between ${targetEvt.minTeamSize} and ${targetEvt.maxTeamSize} members.`);
        return;
      }
      const rosterRolls = [spotLeaderRoll.trim().toUpperCase(), ...spotTeammates.map(member => member.rollNumber.trim().toUpperCase())];
      if (spotTeammates.some(member => !member.name.trim() || !member.rollNumber.trim())) {
        alert('Complete each teammate name and roll number before issuing the pass.');
        return;
      }
      if (new Set(rosterRolls).size !== rosterRolls.length) {
        alert('The leader and teammates must have different roll numbers.');
        return;
      }
    }
    const autoGenTxn = spotPaymentMethod === 'cash' 
      ? `CASH-SPOT-${Date.now().toString().slice(-6)}` 
      : (spotTxnId.trim() || `UPI-SPOT-${Date.now().toString().slice(-6)}`);

    try {
      const createdReg = await StorageService.addRegistration({
        userId: `user_spot_${Date.now()}`,
        eventId: targetEvt.id,
        eventTitle: targetEvt.title,
        leaderName: spotLeaderName.trim(),
        leaderRoll: spotLeaderRoll.trim().toUpperCase(),
        leaderEmail: spotLeaderEmail.trim() || `${spotLeaderRoll.trim().toLowerCase()}@vardhaman.org`,
        leaderPhone: spotLeaderPhone.trim() || '+91 98480 00000',
        leaderCollege: spotLeaderCollege.trim() || 'Vardhaman College of Engineering',
        teammates: isTeam ? spotTeammates : [],
        teamName: isTeam ? spotTeamName.trim() : undefined,
        format: targetEvt.format,
        registrationDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        fee: Number(targetEvt.fee) || 0,
        paymentStatus: 'verified',
        paymentMethod: spotPaymentMethod,
        transactionId: autoGenTxn,
        source: 'spot',
        departmentCode: deptCode
      });

      if (spotAutoCheckIn) {
        await StorageService.checkInRegistration(createdReg.id, adminUser.fullName);
        createdReg.checkedIn = true;
      }

      setSpotSuccessData(createdReg);
      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });

      // Reset Form
      setSpotLeaderName('');
      setSpotLeaderRoll('');
      setSpotLeaderPhone('');
      setSpotLeaderEmail('');
      setSpotTeamName('');
      setSpotTeammates([]);
      setSpotTxnId('');

      refreshDeptData();
    } catch (err: any) {
      alert(`Error creating spot registration: ${err.message || 'Unknown error'}`);
    }
  };

  // Add teammate to spot registration form
  const handleAddSpotTeammate = () => {
    setSpotTeammates([...spotTeammates, { name: '', rollNumber: '', college: spotLeaderCollege, email: '', phone: '' }]);
  };

  const handleUpdateSpotTeammate = (index: number, field: string, val: string) => {
    const updated = [...spotTeammates];
    updated[index] = { ...updated[index], [field]: val };
    setSpotTeammates(updated);
  };

  const handleRemoveSpotTeammate = (index: number) => {
    setSpotTeammates(spotTeammates.filter((_, i) => i !== index));
  };

  // Fast Gate Check-In Handler (8.1 • Validate QR tickets and view attendance)
  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInInput.trim()) return;

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

  // Payment Verification Handler (8.1 • Review registrations and payment evidence)
  const handleVerifyPayment = async (regId: string, status: PaymentStatus, reason?: string) => {
    const success = await StorageService.updatePaymentStatus(regId, status, adminUser.fullName, reason);
    if (success) {
      if (status === 'verified') {
        confetti({ particleCount: 60, spread: 50 });
      }
      refreshDeptData();
    }
  };

  // Publish Event Announcement Handler (8.1 • Publish event announcements)
  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDeptChief) {
      alert('Only the department HOD can publish department announcements.');
      return;
    }
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    const fullTitle = broadcastScope === 'event' && broadcastEventTitle 
      ? `[${broadcastEventTitle}] ${broadcastTitle.trim()}` 
      : broadcastTitle.trim();

    await StorageService.addAnnouncement({
      title: fullTitle,
      message: broadcastMessage.trim(),
      type: broadcastType,
      scope: 'department',
      departmentCode: deptCode
    });

    setIsBroadcastOpen(false);
    setBroadcastTitle('');
    setBroadcastMessage('');
    refreshDeptData();
    confetti({ particleCount: 60, spread: 50 });
  };

  // Delete Announcement Handler
  const handleDeleteAnnouncement = async (annId: string) => {
    if (window.confirm('Are you sure you want to retract this announcement?')) {
      await StorageService.deleteAnnouncement(annId);
      refreshDeptData();
    }
  };

  // Export Dept / Filtered CSV (8.1 • Export event data)
  const handleExportCSV = (scopeName: 'filtered' | 'all') => {
    const targetList = scopeName === 'filtered' ? filteredRoster : registrations;
    const headers = [
      'Reg ID', 'Event Title', 'Student Name', 'Roll Number', 'Team Name', 
      'Team Code', 'Email', 'Phone', 'College', 'Fee (INR)', 'Payment Status', 
      'Checked In', 'Source', 'Transaction ID'
    ];
    const rows = targetList.map(r => [
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
      r.checkedIn ? 'YES' : 'NO',
      r.source || 'online',
      r.transactionId || 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FESTRONIX_${deptCode}_${scopeName.toUpperCase()}_ROSTER_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Department Executive Report CSV for HODs (8.2 • Access departmental reports)
  const handleExportDeptExecutiveReport = () => {
    const headers = [
      'Event ID', 'Event Title', 'Category', 'Format', 'Coordinator', 'Phone', 'Email',
      'Capacity', 'Enrolled Count', 'Capacity Fill %', 'Fee (INR)', 'Total Revenue (INR)', 
      'Checked-In (Turnout)', 'Turnout %'
    ];
    const rows = events.map(evt => {
      const evtRegs = registrations.filter(r => r.eventId === evt.id || r.eventTitle.toLowerCase() === evt.title.toLowerCase());
      const verifiedRegs = evtRegs.filter(r => r.paymentStatus === 'verified');
      const checkedInCount = evtRegs.filter(r => r.checkedIn).length;
      const totalRev = verifiedRegs.reduce((acc, r) => acc + (Number(r.fee) || 0), 0);
      const capPct = evt.capacity > 0 ? Math.round((evtRegs.length / evt.capacity) * 100) : 0;
      const turnoutPct = evtRegs.length > 0 ? Math.round((checkedInCount / evtRegs.length) * 100) : 0;

      return [
        evt.id,
        `"${evt.title.replace(/"/g, '""')}"`,
        evt.category,
        evt.format,
        `"${evt.coordinatorName.replace(/"/g, '""')}"`,
        evt.coordinatorPhone,
        evt.coordinatorEmail,
        evt.capacity,
        evtRegs.length,
        `${capPct}%`,
        evt.fee,
        totalRev,
        checkedInCount,
        `${turnoutPct}%`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FESTRONIX_DEPARTMENT_${deptCode}_EXECUTIVE_REPORT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Department Coordinators Directory (8.2 • Coordinate with Event Coordinators)
  const departmentCoordinatorsList = useMemo(() => {
    const coords: Array<{
      id: string;
      fullName: string;
      designation: string;
      role: string;
      email: string;
      phone: string;
      assignedEvents: string[];
    }> = [];

    // 1. From AdminAuthService registered staff
    const adminStaff = AdminAuthService.getAllAdmins().filter(
      a => a.departmentCode?.toUpperCase() === deptCode.toUpperCase()
    );

    adminStaff.forEach(a => {
      coords.push({
        id: a.id,
        fullName: a.fullName,
        designation: a.designation,
        role: a.role,
        email: a.email,
        phone: a.phone || '+91 98480 12345',
        assignedEvents: a.assignedEvents || []
      });
    });

    // 2. Cross-reference with event coordinators assigned in events
    events.forEach(e => {
      if (e.coordinatorName && !coords.some(c => c.fullName.toLowerCase() === e.coordinatorName.toLowerCase())) {
        coords.push({
          id: `coord-${e.id}`,
          fullName: e.coordinatorName,
          designation: 'Assigned Event Coordinator',
          role: 'event_coordinator',
          email: e.coordinatorEmail || 'coordinator@vardhaman.org',
          phone: e.coordinatorPhone || '+91 98480 12345',
          assignedEvents: [e.title]
        });
      }
    });

    return coords;
  }, [events, deptCode]);

  // Copy contact to clipboard
  const handleCopyContact = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(`${label} copied!`);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // Readiness Metrics (8.2 • Readiness Monitor)
  const readinessMetrics = useMemo(() => {
    const totalEventsCount = events.length;
    const eventsWithVenues = events.filter(e => e.venue && e.venue.trim().length > 0).length;
    const eventsWithCoords = events.filter(e => e.coordinatorName && e.coordinatorPhone).length;
    const pendingPaymentCount = registrations.filter(r => r.paymentStatus === 'verification_pending').length;
    const totalCapacity = deptStats.totalCapacity || 1;
    const capacityFilledPct = Math.min(100, Math.round((deptStats.totalRegistrations / totalCapacity) * 100));

    // Calculate composite score (out of 100)
    let score = 0;
    if (totalEventsCount > 0) {
      score += (eventsWithVenues / totalEventsCount) * 30; // 30% for venue allocation
      score += (eventsWithCoords / totalEventsCount) * 30; // 30% for coordinator appointment
    }
    // 20% for payment review queue health (100% if 0 pending)
    score += pendingPaymentCount === 0 ? 20 : Math.max(5, 20 - (pendingPaymentCount * 2));
    // 20% for capacity utilization
    score += Math.min(20, (capacityFilledPct / 50) * 20);

    return {
      score: Math.min(100, Math.round(score)),
      eventsWithVenues,
      eventsWithCoords,
      pendingPaymentCount,
      capacityFilledPct,
      totalEventsCount
    };
  }, [events, registrations, deptStats]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'transparent', color: '#FFFFFF', paddingBottom: '70px' }}>
      {/* Shared Executive Command Header */}
      <AdminHeader
        adminUser={adminUser}
        onLogout={onLogout}
        onSwitchToFest={onSwitchToFest}
      />

      {/* Main Container */}
      <main style={{ maxWidth: '1360px', margin: '0 auto', padding: '28px 24px' }}>
        
        {/* Copy Feedback Toast */}
        {copyFeedback && (
          <div
            style={{
              position: 'fixed',
              top: '80px',
              right: '24px',
              background: '#10B981',
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              zIndex: 9999,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={16} />
            <span>{copyFeedback}</span>
          </div>
        )}

        {/* Executive Quick Actions & Scope Bar */}
        <div
          className="admin-card"
          style={{
            padding: '16px 22px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          {/* Left: Scope Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.76rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Operational Scope:
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setEventScope('assigned')}
                className={`admin-btn ${eventScope === 'assigned' ? 'admin-btn-emerald' : 'admin-btn-ghost'}`}
                style={{ padding: '6px 14px', fontSize: '0.78rem' }}
              >
                <span>🎯 Assigned to Me ({assignedEventsList.length})</span>
                {isEventCoord && (
                  <span style={{ fontSize: '0.62rem', background: '#FFFFFF', color: '#000', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                    DEFAULT
                  </span>
                )}
              </button>

              {isDeptChief && (
                <button
                  onClick={() => setEventScope('all')}
                  className={`admin-btn ${eventScope === 'all' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                >
                  <span>🏢 All {deptCode} Events ({events.length})</span>
                  <span style={{ fontSize: '0.62rem', background: '#38BDF8', color: '#000', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                    HOD VIEW
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Quick Spot Reg & Broadcast Alert Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setSpotEventId(visibleEvents[0]?.id || events[0]?.id || '');
                setIsSpotRegOpen(true);
              }}
              className="admin-btn admin-btn-emerald"
              style={{ padding: '8px 16px', fontSize: '0.8rem' }}
            >
              <UserPlus size={15} />
              <span>+ Spot Registration (Fest Day)</span>
            </button>

            {isDeptChief && (
              <button
                onClick={() => setIsBroadcastOpen(true)}
                className="admin-btn"
                style={{
                  background: 'rgba(245, 158, 11, 0.16)',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  color: '#FBBF24',
                  padding: '8px 16px',
                  fontSize: '0.8rem'
                }}
              >
                <Megaphone size={15} />
                <span>Broadcast Alert</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Stat KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {/* Card 1: Registrations */}
          <div className="admin-kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {eventScope === 'assigned' ? 'Assigned Registrations' : 'Dept Registrations'}
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginTop: '4px' }}>
                  {scopedRegistrations.length}
                </div>
              </div>
              <div className="admin-kpi-icon-pod">
                <Users size={22} color="#38BDF8" />
              </div>
            </div>
            <div className="admin-progress-track">
              <div
                className="admin-progress-fill"
                style={{
                  width: `${Math.min(100, (scopedRegistrations.length / Math.max(1, visibleEvents.reduce((acc, e) => acc + e.capacity, 0))) * 100)}%`,
                  background: 'linear-gradient(90deg, #2563EB, #38BDF8)'
                }}
              />
            </div>
            <div style={{ fontSize: '0.74rem', color: '#38BDF8', marginTop: '8px', fontWeight: 600 }}>
              {scopedRegistrations.filter(r => r.source !== 'spot').length} online • {scopedRegistrations.filter(r => r.source === 'spot').length} spot delegates
            </div>
          </div>

          {/* Card 2: Revenue */}
          <div className="admin-kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {eventScope === 'assigned' ? 'Assigned Collections' : 'Dept Collections'}
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#34D399', lineHeight: 1.1, marginTop: '4px' }}>
                  ₹{scopedRegistrations
                    .filter(r => r.paymentStatus === 'verified')
                    .reduce((acc, r) => acc + (Number(r.fee) || 0), 0)
                    .toLocaleString()}
                </div>
              </div>
              <div className="admin-kpi-icon-pod" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)' }}>
                <IndianRupee size={22} color="#34D399" />
              </div>
            </div>
            <div className="admin-progress-track">
              <div className="admin-progress-fill" style={{ width: '100%', background: 'linear-gradient(90deg, #059669, #34D399)' }} />
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '8px' }}>
              Reconciled for {visibleEvents.length} {eventScope === 'assigned' ? 'assigned' : deptCode} events
            </div>
          </div>

          {/* Card 3: Capacity & Slots */}
          <div className="admin-kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Slot Capacity
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginTop: '4px' }}>
                  {visibleEvents.reduce((acc, e) => acc + e.capacity, 0)} Seats
                </div>
              </div>
              <div className="admin-kpi-icon-pod">
                <Layers size={22} color="#CBD5E1" />
              </div>
            </div>
            <div className="admin-progress-track">
              <div
                className="admin-progress-fill"
                style={{
                  width: `${Math.min(100, Math.round((scopedRegistrations.length / Math.max(1, visibleEvents.reduce((acc, e) => acc + e.capacity, 0))) * 100))}%`,
                  background: 'linear-gradient(90deg, #6366F1, #818CF8)'
                }}
              />
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '8px' }}>
              Across {visibleEvents.length} events • {scopedRegistrations.length} slots claimed
            </div>
          </div>

          {/* Card 4: Attendance & Turnout */}
          <div className="admin-kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#C084FC', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Gate Check-In Turnout
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#C084FC', lineHeight: 1.1, marginTop: '4px' }}>
                  {scopedRegistrations.filter(r => r.checkedIn).length} / {scopedRegistrations.length}
                </div>
              </div>
              <div className="admin-kpi-icon-pod" style={{ background: 'rgba(168, 85, 247, 0.12)', borderColor: 'rgba(168, 85, 247, 0.35)' }}>
                <CheckCircle2 size={22} color="#C084FC" />
              </div>
            </div>
            <div className="admin-progress-track">
              <div
                className="admin-progress-fill"
                style={{
                  width: `${scopedRegistrations.length > 0 ? (scopedRegistrations.filter(r => r.checkedIn).length / scopedRegistrations.length) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, #9333EA, #C084FC)'
                }}
              />
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '8px' }}>
              {scopedRegistrations.length > 0
                ? Math.round((scopedRegistrations.filter(r => r.checkedIn).length / scopedRegistrations.length) * 100)
                : 0}% verified venue attendance
            </div>
          </div>
        </div>

        {/* Tab Navigation Segment Bar */}
        <div className="admin-tab-nav">
          {[
            { id: 'events', label: isEventCoord ? `Events (${visibleEvents.length})` : `${deptCode} Events (${events.length})`, icon: Layers },
            ...(isDeptChief ? [{ id: 'readiness', label: `Department Readiness (${readinessMetrics.score}%)`, icon: ShieldCheck }] : []),
            { id: 'roster', label: `Attendee Roster (${scopedRegistrations.length})`, icon: Users },
            { id: 'checkin', label: 'Fast Gate Check-In', icon: QrCode },
            { 
              id: 'payments', 
              label: `Payment Review (${scopedRegistrations.filter(r => r.paymentStatus === 'verification_pending').length})`, 
              icon: Clock 
            },
            ...(isDeptChief ? [{ id: 'announcements', label: `Announcements (${announcements.length})`, icon: Megaphone }] : []),
            ...(isDeptChief ? [
              { id: 'reports', label: 'Consolidated Reports', icon: FileSpreadsheet },
              { id: 'coordinators', label: `Coordinators Directory (${departmentCoordinatorsList.length})`, icon: Phone }
            ] : [])
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`admin-tab-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} color={isActive ? '#38BDF8' : '#94A3B8'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: EVENTS MANAGEMENT */}
        {activeTab === 'events' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="font-title" style={{ fontSize: '1.15rem', color: '#FFFFFF', margin: 0 }}>
                  {eventScope === 'assigned' ? 'Assigned Event Operations' : `${deptCode} Department Event Operations`}
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                  Edit event rules, team limits, fees, capacities, deadlines, schedules, venues, and status
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {isDeptChief && (
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
                    <span>Submit Department Event</span>
                  </button>
                )}
              </div>
            </div>

            {visibleEvents.length === 0 ? (
              <div
                style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  background: 'rgba(20, 31, 62, 0.6)',
                  border: '1px dashed rgba(220, 227, 229, 0.2)',
                  borderRadius: '16px'
                }}
              >
                <AlertCircle size={40} color="#FBBF24" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1.1rem', color: '#FFFFFF', margin: '0 0 6px' }}>No Assigned Events Found</h4>
                <p style={{ fontSize: '0.82rem', color: '#A8B3C2', margin: '0 0 16px' }}>
                  You currently have no events specifically assigned under your account name or email.
                </p>
                <button
                  onClick={() => setEventScope('all')}
                  className="btn-cyber-primary"
                  style={{ padding: '8px 20px', fontSize: '0.82rem' }}
                >
                  Switch to View All {deptCode} Events
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
                {visibleEvents.map(event => {
                  const eventRegs = registrations.filter(r => r.eventId === event.id || r.eventTitle.toLowerCase() === event.title.toLowerCase());
                  const fillPct = event.capacity > 0 ? Math.round((eventRegs.length / event.capacity) * 100) : 0;
                  const isAssigned = isEventAssigned(event);

                  return (
                    <div
                      key={event.id}
                      style={{
                        background: 'rgba(20, 31, 62, 0.85)',
                        border: isAssigned ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(220, 227, 229, 0.16)',
                        borderRadius: '16px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: isAssigned ? '0 0 15px rgba(16, 185, 129, 0.15)' : 'none'
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

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isAssigned && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(16, 185, 129, 0.2)',
                                  color: '#34D399',
                                  border: '1px solid rgba(16, 185, 129, 0.4)'
                                }}
                              >
                                ASSIGNED
                              </span>
                            )}
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
                        </div>

                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px' }}>
                          {event.title}
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '0 0 10px', lineHeight: 1.5 }}>
                          {event.description.slice(0, 100)}...
                        </p>

                        {/* Capacity Progress Bar (8.2 Monitor Capacity) */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#DCE3E5', marginBottom: '4px' }}>
                            <span>Capacity: <strong>{eventRegs.length} / {event.capacity}</strong> filled</span>
                            <span style={{ fontWeight: 700, color: fillPct >= 90 ? '#f87171' : fillPct >= 70 ? '#FBBF24' : '#34D399' }}>
                              {fillPct}%
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                width: `${Math.min(100, fillPct)}%`, 
                                height: '100%', 
                                background: fillPct >= 90 ? '#f87171' : fillPct >= 70 ? '#FBBF24' : '#34D399' 
                              }} 
                            />
                          </div>
                        </div>

                        <div style={{ fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>
                          📍 Venue: <strong>{event.venue || 'TBA'}</strong>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>
                          🗓️ Schedule: {event.date} at {event.time}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#A8B3C2', marginBottom: '12px' }}>
                          👤 Coordinator: {event.coordinatorName} ({event.coordinatorPhone})
                        </div>
                      </div>

                      <div
                        style={{
                          paddingTop: '12px',
                          borderTop: '1px solid rgba(220, 227, 229, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px'
                        }}
                      >
                        <div style={{ fontSize: '0.78rem', color: '#DCE3E5' }}>
                          Fee: <strong style={{ color: '#BACEBB' }}>{event.fee === 0 ? 'FREE' : `₹${event.fee}`}</strong>
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {/* Quick Spot Reg for this Event */}
                          <button
                            onClick={() => {
                              setSpotEventId(event.id);
                              setIsSpotRegOpen(true);
                            }}
                            title="Register walk-in student for this event"
                            style={{
                              background: 'rgba(16, 185, 129, 0.2)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              color: '#6EE7B7',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <UserPlus size={13} />
                            <span>Spot</span>
                          </button>

                          {/* 8.1 Edit Event Details */}
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
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
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
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: DEPARTMENT READINESS & CAPACITY MONITOR (8.2 Department Chief Coordinator) */}
        {activeTab === 'readiness' && isDeptChief && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 className="font-title" style={{ fontSize: '1.2rem', color: '#FFFFFF', margin: 0 }}>
                {deptCode} Department Readiness & Readiness Score
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                Operational checklist and health monitor for Fest Day preparedness
              </p>
            </div>

            {/* Big Health Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(20, 31, 62, 0.95) 0%, rgba(16, 26, 53, 0.95) 100%)',
                border: '1px solid rgba(220, 227, 229, 0.25)',
                borderRadius: '18px',
                padding: '24px',
                marginBottom: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                alignItems: 'center'
              }}
            >
              <div>
                <span style={{ fontSize: '0.76rem', color: '#A8B3C2', textTransform: 'uppercase', fontWeight: 700 }}>
                  Overall Department Preparedness
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 900, color: readinessMetrics.score >= 80 ? '#34D399' : '#FBBF24' }}>
                    {readinessMetrics.score}%
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#BACEBB', fontWeight: 700 }}>
                    {readinessMetrics.score >= 90 ? 'EXCELLENT READINESS' : readinessMetrics.score >= 75 ? 'GOOD (FINALIZE DETAILS)' : 'REQUIRES ATTENTION'}
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#DCE3E5', margin: '8px 0 0', lineHeight: 1.5 }}>
                  Synthesized across {events.length} department events, venue assignments, coordinator coverage, and payment review queues.
                </p>
              </div>

              {/* Checklist Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem' }}>
                  {readinessMetrics.eventsWithVenues === readinessMetrics.totalEventsCount ? (
                    <CheckCircle2 size={18} color="#34D399" />
                  ) : (
                    <AlertCircle size={18} color="#FBBF24" />
                  )}
                  <span style={{ color: '#FFFFFF' }}>
                    Venue Allocated: <strong>{readinessMetrics.eventsWithVenues} / {readinessMetrics.totalEventsCount}</strong> events confirmed
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem' }}>
                  {readinessMetrics.eventsWithCoords === readinessMetrics.totalEventsCount ? (
                    <CheckCircle2 size={18} color="#34D399" />
                  ) : (
                    <AlertCircle size={18} color="#FBBF24" />
                  )}
                  <span style={{ color: '#FFFFFF' }}>
                    Lead Coordinators Appointed: <strong>{readinessMetrics.eventsWithCoords} / {readinessMetrics.totalEventsCount}</strong> events with full contacts
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem' }}>
                  {readinessMetrics.pendingPaymentCount === 0 ? (
                    <CheckCircle2 size={18} color="#34D399" />
                  ) : (
                    <AlertCircle size={18} color="#f87171" />
                  )}
                  <span style={{ color: '#FFFFFF' }}>
                    Payment Verification Queue: {readinessMetrics.pendingPaymentCount === 0 ? 'Clear (100% verified)' : `${readinessMetrics.pendingPaymentCount} review(s) pending`}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem' }}>
                  <CheckCircle2 size={18} color="#34D399" />
                  <span style={{ color: '#FFFFFF' }}>
                    Capacity Filled: <strong>{deptStats.totalRegistrations} / {deptStats.totalCapacity}</strong> slots ({readinessMetrics.capacityFilledPct}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Per-Event Readiness Table */}
            <div
              style={{
                background: 'rgba(20, 31, 62, 0.85)',
                border: '1px solid rgba(220, 227, 229, 0.16)',
                borderRadius: '16px',
                padding: '20px'
              }}
            >
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 14px' }}>
                Department Event Capacity & Readiness Breakdown
              </h4>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(220, 227, 229, 0.15)', color: '#A8B3C2' }}>
                      <th style={{ padding: '10px 14px' }}>Event Name</th>
                      <th style={{ padding: '10px 14px' }}>Coordinator</th>
                      <th style={{ padding: '10px 14px' }}>Venue</th>
                      <th style={{ padding: '10px 14px' }}>Schedule</th>
                      <th style={{ padding: '10px 14px' }}>Capacity Utilization</th>
                      <th style={{ padding: '10px 14px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(e => {
                      const evtRegs = registrations.filter(r => r.eventId === e.id || r.eventTitle.toLowerCase() === e.title.toLowerCase());
                      const pct = e.capacity > 0 ? Math.round((evtRegs.length / e.capacity) * 100) : 0;
                      return (
                        <tr key={e.id} style={{ borderBottom: '1px solid rgba(220, 227, 229, 0.08)' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: '#FFFFFF' }}>{e.title}</td>
                          <td style={{ padding: '12px 14px', color: '#DCE3E5' }}>{e.coordinatorName} ({e.coordinatorPhone})</td>
                          <td style={{ padding: '12px 14px', color: '#BACEBB' }}>{e.venue || 'Unassigned'}</td>
                          <td style={{ padding: '12px 14px', color: '#A8B3C2' }}>{e.date} • {e.time}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: pct >= 90 ? '#f87171' : pct >= 70 ? '#FBBF24' : '#34D399' }} />
                              </div>
                              <span style={{ fontSize: '0.74rem', color: '#DCE3E5' }}>{evtRegs.length}/{e.capacity} ({pct}%)</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: e.status === 'open' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: e.status === 'open' ? '#34D399' : '#f87171', fontWeight: 700 }}>
                              {e.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ATTENDEE ROSTER (8.1 & 8.2) */}
        {activeTab === 'roster' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="font-title" style={{ fontSize: '1.15rem', color: '#FFFFFF', margin: 0 }}>
                  {eventScope === 'assigned' ? 'Assigned Events Attendee Master Roster' : `${deptCode} Attendee Master Roster`}
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                  Real-time participant database with 1-click check-in, search, filter, and export
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {/* Spot Reg Button */}
                <button
                  onClick={() => {
                    setSpotEventId(visibleEvents[0]?.id || events[0]?.id || '');
                    setIsSpotRegOpen(true);
                  }}
                  className="btn-cyber-primary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px'
                  }}
                >
                  <UserPlus size={15} />
                  <span>+ Spot Registration</span>
                </button>

                {/* Export CSV */}
                <button
                  onClick={() => handleExportCSV('filtered')}
                  style={{
                    background: 'rgba(40, 59, 120, 0.45)',
                    border: '1px solid rgba(120, 149, 147, 0.4)',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#BACEBB',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={15} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Controls Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              {/* Search Input */}
              <div style={{ position: 'relative' }}>
                <Search size={15} color="#789593" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input
                  type="text"
                  placeholder="Search by student name, roll number, team code, or ID..."
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

              {/* Status Filter */}
              <div>
                <select
                  value={rosterStatusFilter}
                  onChange={e => setRosterStatusFilter(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'rgba(20, 31, 62, 0.85)',
                    border: '1px solid rgba(220, 227, 229, 0.2)',
                    color: '#FFFFFF',
                    fontSize: '0.84rem'
                  }}
                >
                  <option value="all">All Payment & Attendance Statuses</option>
                  <option value="verified">Verified Payments Only</option>
                  <option value="verification_pending">Pending Payment Verification Only</option>
                  <option value="checked_in">Checked In (Present) Only</option>
                  <option value="rejected">Rejected Payments Only</option>
                </select>
              </div>
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
                    <th style={{ padding: '12px 16px' }}>Delegate Name</th>
                    <th style={{ padding: '12px 16px' }}>Roll Number</th>
                    <th style={{ padding: '12px 16px' }}>Event</th>
                    <th style={{ padding: '12px 16px' }}>Fee</th>
                    <th style={{ padding: '12px 16px' }}>Payment</th>
                    <th style={{ padding: '12px 16px' }}>Gate Check-In</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#A8B3C2' }}>
                        No registrations found matching the current search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRoster.map(r => (
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
                          <div>{r.id}</div>
                          {r.source === 'spot' && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                              SPOT REG
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#FFFFFF', fontWeight: 600 }}>
                          {r.leaderName}
                          <div style={{ fontSize: '0.72rem', color: '#A8B3C2' }}>{r.leaderPhone} • {r.leaderCollege}</div>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: FAST GATE CHECK-IN DESK & ATTENDANCE (8.1) */}
        {activeTab === 'checkin' && (
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div
              style={{
                background: 'rgba(20, 31, 62, 0.95)',
                border: '1px solid rgba(220, 227, 229, 0.22)',
                borderRadius: '20px',
                padding: '32px 28px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
                marginBottom: '24px'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #283B78 0%, #10B981 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}
                >
                  <QrCode size={28} color="#FFFFFF" />
                </div>
                <h3 className="font-title" style={{ fontSize: '1.35rem', color: '#FFFFFF', margin: '0 0 6px' }}>
                  {deptCode} Fast Gate Check-In Desk
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#A8B3C2', margin: 0 }}>
                  Enter student Roll Number, Registration ID, Team Code, or paste QR Token to validate entry pass
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
                  <span>Validate QR Ticket & Confirm Attendance</span>
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
                        Delegate: <strong>{checkInResult.registration.leaderName}</strong> ({checkInResult.registration.leaderRoll})<br />
                        Event: {checkInResult.registration.eventTitle} • Status: {checkInResult.registration.paymentStatus.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Live Attendance Turnout Summary Widget */}
            <div
              style={{
                background: 'rgba(20, 31, 62, 0.85)',
                border: '1px solid rgba(220, 227, 229, 0.18)',
                borderRadius: '16px',
                padding: '20px'
              }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 12px' }}>
                Live Attendance Rate Breakdown
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#A8B3C2' }}>TOTAL ENROLLED</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                    {scopedRegistrations.length}
                  </div>
                </div>
                <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#34D399' }}>VENUE CHECKED-IN</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34D399', marginTop: '4px' }}>
                    {scopedRegistrations.filter(r => r.checkedIn).length}
                  </div>
                </div>
                <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#FBBF24' }}>PENDING ARRIVAL</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FBBF24', marginTop: '4px' }}>
                    {scopedRegistrations.filter(r => !r.checkedIn).length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENT VERIFICATION (8.1) */}
        {activeTab === 'payments' && (
          <div>
            <div style={{ marginBottom: '18px' }}>
              <h3 className="font-title" style={{ fontSize: '1.15rem', color: '#FFFFFF', margin: 0 }}>
                {deptCode} Payment Verification Desk
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                Review student payment evidence, verify transaction receipts, and approve entries
              </p>
            </div>

            {scopedRegistrations.filter(r => r.paymentStatus === 'verification_pending').length === 0 ? (
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
                <h4 style={{ fontSize: '1.1rem', color: '#FFFFFF', margin: '0 0 6px' }}>All Payments Clear!</h4>
                <p style={{ fontSize: '0.82rem', color: '#A8B3C2', margin: 0 }}>
                  No pending student payments require review in this event scope.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {scopedRegistrations
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

        {/* TAB 5: EVENT ANNOUNCEMENTS (8.1 Publish event announcements) */}
        {activeTab === 'announcements' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="font-title" style={{ fontSize: '1.15rem', color: '#FFFFFF', margin: 0 }}>
                  Event Announcements & Broadcasts
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                  Publish real-time schedule updates, venue notices, and alerts to participants
                </p>
              </div>

              <button
                onClick={() => setIsBroadcastOpen(true)}
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
                <span>+ Broadcast New Announcement</span>
              </button>
            </div>

            {announcements.length === 0 ? (
              <div
                style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  background: 'rgba(20, 31, 62, 0.6)',
                  border: '1px dashed rgba(220, 227, 229, 0.2)',
                  borderRadius: '16px'
                }}
              >
                <Bell size={40} color="#789593" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1.1rem', color: '#FFFFFF', margin: '0 0 6px' }}>No Broadcasts Active</h4>
                <p style={{ fontSize: '0.82rem', color: '#A8B3C2', margin: 0 }}>
                  Click "+ Broadcast New Announcement" to post urgent updates to student portals.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {announcements.map(ann => (
                  <div
                    key={ann.id}
                    style={{
                      background: 'rgba(20, 31, 62, 0.85)',
                      border: '1px solid rgba(220, 227, 229, 0.18)',
                      borderRadius: '14px',
                      padding: '18px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '16px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 800,
                            background: ann.type === 'urgent' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                            color: ann.type === 'urgent' ? '#f87171' : '#60a5fa'
                          }}
                        >
                          {ann.type.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: '#A8B3C2' }}>
                          {ann.date || 'Recent'}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px' }}>
                        {ann.title}
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: '#DCE3E5', margin: 0, lineHeight: 1.5 }}>
                        {ann.message}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      title="Retract announcement"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        color: '#f87171',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: CONSOLIDATED DEPARTMENT REPORTS (8.2 Department Chief Coordinator) */}
        {activeTab === 'reports' && isDeptChief && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="font-title" style={{ fontSize: '1.15rem', color: '#FFFFFF', margin: 0 }}>
                  {deptCode} Department Executive Reports & Financial Audits
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                  Consolidated performance metrics, fee collections, capacity fill, and attendance turnouts
                </p>
              </div>

              <button
                onClick={handleExportDeptExecutiveReport}
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
                <span>Download Executive Report (CSV)</span>
              </button>
            </div>

            {/* Reports Breakdown Table */}
            <div
              style={{
                background: 'rgba(20, 31, 62, 0.85)',
                border: '1px solid rgba(220, 227, 229, 0.16)',
                borderRadius: '14px',
                overflowX: 'auto'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(220, 227, 229, 0.15)', background: 'rgba(16, 26, 53, 0.6)', color: '#A8B3C2' }}>
                    <th style={{ padding: '12px 14px' }}>Event Name</th>
                    <th style={{ padding: '12px 14px' }}>Category</th>
                    <th style={{ padding: '12px 14px' }}>Coordinator</th>
                    <th style={{ padding: '12px 14px' }}>Enrolled / Capacity</th>
                    <th style={{ padding: '12px 14px' }}>Revenue (INR)</th>
                    <th style={{ padding: '12px 14px' }}>Gate Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(evt => {
                    const evtRegs = registrations.filter(r => r.eventId === evt.id || r.eventTitle.toLowerCase() === evt.title.toLowerCase());
                    const verifiedRegs = evtRegs.filter(r => r.paymentStatus === 'verified');
                    const checkedInCount = evtRegs.filter(r => r.checkedIn).length;
                    const totalRev = verifiedRegs.reduce((acc, r) => acc + (Number(r.fee) || 0), 0);
                    const capPct = evt.capacity > 0 ? Math.round((evtRegs.length / evt.capacity) * 100) : 0;
                    const turnoutPct = evtRegs.length > 0 ? Math.round((checkedInCount / evtRegs.length) * 100) : 0;

                    return (
                      <tr key={evt.id} style={{ borderBottom: '1px solid rgba(220, 227, 229, 0.08)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#FFFFFF' }}>{evt.title}</td>
                        <td style={{ padding: '12px 14px', color: '#BACEBB' }}>{evt.category.toUpperCase()}</td>
                        <td style={{ padding: '12px 14px', color: '#DCE3E5' }}>{evt.coordinatorName}</td>
                        <td style={{ padding: '12px 14px' }}>
                          {evtRegs.length} / {evt.capacity} ({capPct}%)
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#BACEBB' }}>
                          ₹{totalRev.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#34D399', fontWeight: 700 }}>
                          {checkedInCount} ({turnoutPct}%)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: COORDINATORS DIRECTORY & COMMS (8.2 Coordinate with Event Coordinators) */}
        {activeTab === 'coordinators' && isDeptChief && (
          <div>
            <div style={{ marginBottom: '18px' }}>
              <h3 className="font-title" style={{ fontSize: '1.15rem', color: '#FFFFFF', margin: 0 }}>
                {deptCode} Event Coordinators Directory
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                Contact information, assigned events, and direct communication links for department faculty & student coordinators
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {departmentCoordinatorsList.map(coord => (
                <div
                  key={coord.id}
                  style={{
                    background: 'rgba(20, 31, 62, 0.85)',
                    border: '1px solid rgba(220, 227, 229, 0.18)',
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
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: '#93C5FD',
                          fontWeight: 700
                        }}
                      >
                        {coord.role.replace('_', ' ').toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#A8B3C2' }}>
                        {coord.designation}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px' }}>
                      {coord.fullName}
                    </h4>

                    <div style={{ fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                      📞 Phone: <strong style={{ color: '#FFFFFF' }}>{coord.phone}</strong>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '12px' }}>
                      ✉️ Email: <strong>{coord.email}</strong>
                    </div>

                    {coord.assignedEvents && coord.assignedEvents.length > 0 && (
                      <div style={{ fontSize: '0.74rem', color: '#A8B3C2', marginBottom: '12px' }}>
                        Assigned: <strong>{coord.assignedEvents.join(', ')}</strong>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(220, 227, 229, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <a
                      href={`tel:${coord.phone}`}
                      style={{
                        flex: 1,
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: '#6EE7B7',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Phone size={13} />
                      <span>Call</span>
                    </a>

                    <a
                      href={`mailto:${coord.email}`}
                      style={{
                        flex: 1,
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: '#93C5FD',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Mail size={13} />
                      <span>Email</span>
                    </a>

                    <button
                      onClick={() => handleCopyContact(`${coord.fullName} | ${coord.phone} | ${coord.email}`, coord.fullName)}
                      title="Copy contact"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(220, 227, 229, 0.2)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: '#DCE3E5',
                        cursor: 'pointer'
                      }}
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Spot Registration Modal (8.1 Create spot registrations on fest day) */}
      {isSpotRegOpen && (
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
          onClick={() => setIsSpotRegOpen(false)}
        >
          <div
            style={{
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#142042',
              borderRadius: '16px',
              padding: '26px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={18} color="#000" />
                </div>
                <div>
                  <h4 style={{ color: '#FFFFFF', margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                    Create Fest Day Spot Registration
                  </h4>
                  <p style={{ fontSize: '0.74rem', color: '#A8B3C2', margin: 0 }}>
                    Issue instant delegate pass & verified ticket at {deptCode} registration desk
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSpotRegOpen(false)}
                style={{ background: 'none', border: 'none', color: '#A8B3C2', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSpotRegistration} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Event Picker */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>
                  Select Event *
                </label>
                <select
                  value={spotEventId}
                  onChange={e => setSpotEventId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'rgba(16, 26, 53, 0.9)',
                    border: '1px solid rgba(220, 227, 229, 0.25)',
                    color: '#FFFFFF'
                  }}
                >
                  {visibleEvents.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.title} — Fee: {e.fee === 0 ? 'FREE' : `₹${e.fee}`} ({e.format.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Delegate Leader Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>
                    Student Delegate Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={spotLeaderName}
                    onChange={e => setSpotLeaderName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>
                    Student Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 22VCECS104"
                    value={spotLeaderRoll}
                    onChange={e => setSpotLeaderRoll(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98480 12345"
                    value={spotLeaderPhone}
                    onChange={e => setSpotLeaderPhone(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="student@vardhaman.org"
                    value={spotLeaderEmail}
                    onChange={e => setSpotLeaderEmail(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>
                  College Institution
                </label>
                <input
                  type="text"
                  value={spotLeaderCollege}
                  onChange={e => setSpotLeaderCollege(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                />
              </div>

              {/* Team Section (if team event) */}
              {(() => {
                const curEvt = visibleEvents.find(e => e.id === spotEventId);
                const isTeam = curEvt?.format === 'team' || curEvt?.format === 'duo';
                if (!isTeam) return null;

                return (
                  <div style={{ background: 'rgba(16, 26, 53, 0.6)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(220, 227, 229, 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#6EE7B7', fontWeight: 700 }}>
                        Team Participation Details ({curEvt?.format.toUpperCase()})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddSpotTeammate}
                        style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          color: '#6EE7B7',
                          fontSize: '0.72rem',
                          cursor: 'pointer'
                        }}
                      >
                        + Add Teammate
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Team Name (e.g. CyberKnights)"
                      value={spotTeamName}
                      onChange={e => setSpotTeamName(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box', marginBottom: '8px' }}
                    />

                    {spotTeammates.map((tm, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '6px' }}>
                        <input
                          type="text"
                          placeholder={`Teammate #${idx + 2} Name`}
                          value={tm.name}
                          onChange={e => handleUpdateSpotTeammate(idx, 'name', e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF' }}
                        />
                        <input
                          type="text"
                          placeholder="Roll Number"
                          value={tm.rollNumber}
                          onChange={e => handleUpdateSpotTeammate(idx, 'rollNumber', e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSpotTeammate(idx)}
                          style={{ background: 'rgba(239, 68, 68, 0.2)', border: 'none', color: '#f87171', borderRadius: '6px', padding: '0 8px', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Payment Mode */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>
                    Spot Payment Collection Mode
                  </label>
                  <select
                    value={spotPaymentMethod}
                    onChange={e => setSpotPaymentMethod(e.target.value as any)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF' }}
                  >
                    <option value="cash">💵 Cash Received at Desk</option>
                    <option value="upi">📲 Spot UPI QR Paid & Verified</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>
                    Payment Reference / UTR
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if left blank"
                    value={spotTxnId}
                    onChange={e => setSpotTxnId(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Instant Check-In Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                <input
                  type="checkbox"
                  id="spotAutoCheckIn"
                  checked={spotAutoCheckIn}
                  onChange={e => setSpotAutoCheckIn(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <label htmlFor="spotAutoCheckIn" style={{ fontSize: '0.78rem', color: '#DCE3E5', cursor: 'pointer' }}>
                  Mark Delegate as <strong>Checked In right now</strong> (Delegate is standing at the registration desk)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsSpotRegOpen(false)}
                  style={{ background: 'none', border: '1px solid rgba(220, 227, 229, 0.2)', borderRadius: '8px', padding: '8px 16px', color: '#DCE3E5', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 22px',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Issue Spot Delegate Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spot Registration Success Modal / Pass Preview */}
      {spotSuccessData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSpotSuccessData(null)}
        >
          <div
            style={{
              maxWidth: '460px',
              width: '100%',
              background: '#142042',
              borderRadius: '18px',
              padding: '28px',
              border: '2px solid #10B981',
              boxShadow: '0 20px 60px rgba(16, 185, 129, 0.4)',
              textAlign: 'center'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <CheckCircle2 size={32} color="#10B981" />
            </div>

            <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', margin: '0 0 4px', fontWeight: 800 }}>
              Spot Registration Complete!
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '0 0 16px' }}>
              Pass successfully generated and added to {deptCode} roster.
            </p>

            <div style={{ background: 'rgba(16, 26, 53, 0.9)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(220, 227, 229, 0.15)', textAlign: 'left', marginBottom: '18px' }}>
              <div style={{ fontSize: '0.75rem', color: '#A8B3C2', marginBottom: '2px' }}>REGISTRATION PASS ID</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34D399', fontFamily: 'monospace', marginBottom: '10px' }}>
                {spotSuccessData.id}
              </div>

              <div style={{ fontSize: '0.8rem', color: '#FFFFFF', marginBottom: '4px' }}>
                Delegate: <strong>{spotSuccessData.leaderName}</strong> ({spotSuccessData.leaderRoll})
              </div>
              <div style={{ fontSize: '0.8rem', color: '#DCE3E5', marginBottom: '4px' }}>
                Event: <strong>{spotSuccessData.eventTitle}</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#DCE3E5', marginBottom: '4px' }}>
                Fee: ₹{spotSuccessData.fee} • Status: <strong style={{ color: '#34D399' }}>VERIFIED</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#DCE3E5' }}>
                Check-in Gate: <strong style={{ color: spotSuccessData.checkedIn ? '#34D399' : '#FBBF24' }}>
                  {spotSuccessData.checkedIn ? 'CHECKED IN (PRESENT)' : 'PENDING GATE SCAN'}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(220, 227, 229, 0.25)',
                  borderRadius: '8px',
                  padding: '10px',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Printer size={15} />
                <span>Print Ticket</span>
              </button>

              <button
                onClick={() => setSpotSuccessData(null)}
                className="btn-cyber-primary"
                style={{
                  flex: 1,
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 700
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Announcement Modal (8.1 Publish event announcements) */}
      {isBroadcastOpen && (
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
          onClick={() => setIsBroadcastOpen(false)}
        >
          <div
            style={{
              maxWidth: '540px',
              width: '100%',
              background: '#142042',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Megaphone size={22} color="#FBBF24" />
              <div>
                <h4 style={{ color: '#FFFFFF', margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  Broadcast Event Announcement
                </h4>
                <p style={{ fontSize: '0.74rem', color: '#A8B3C2', margin: 0 }}>
                  Publish real-time announcements to the student dashboard and live ticker
                </p>
              </div>
            </div>

            <form onSubmit={handleBroadcastAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>
                  Target Scope
                </label>
                <select
                  value={broadcastScope}
                  onChange={e => setBroadcastScope(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF' }}
                >
                  <option value="department">All {deptCode} Events & Delegates</option>
                  <option value="event">Specific Assigned Event</option>
                </select>
              </div>

              {broadcastScope === 'event' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>
                    Select Event
                  </label>
                  <select
                    value={broadcastEventTitle}
                    onChange={e => setBroadcastEventTitle(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF' }}
                  >
                    <option value="">Select an event...</option>
                    {visibleEvents.map(e => (
                      <option key={e.id} value={e.title}>{e.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>
                  Announcement Category / Type
                </label>
                <select
                  value={broadcastType}
                  onChange={e => setBroadcastType(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF' }}
                >
                  <option value="urgent">🚨 Urgent (Schedule / Venue Change)</option>
                  <option value="general">ℹ️ General Notice</option>
                  <option value="workshop">🛠️ Workshop Instructions</option>
                  <option value="prize">🏆 Prize / Results Announcement</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>
                  Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Round 2 Shortlist Announced / Venue Shifted to Lab 402"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>
                  Full Announcement Details *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide precise instructions, room numbers, reporting times, or links..."
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsBroadcastOpen(false)}
                  style={{ background: 'none', border: '1px solid rgba(220, 227, 229, 0.2)', borderRadius: '8px', padding: '8px 16px', color: '#DCE3E5', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cyber-primary"
                  style={{ padding: '8px 20px', borderRadius: '8px', fontWeight: 700 }}
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal (8.1 • Edit event details, rules, team limits, fee, capacity, deadline, schedule and venue) */}
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
              maxWidth: '660px',
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

              {/* Format & Team Sizes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Participation Format</label>
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
                      <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Min Team Size</label>
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
                      <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Max Team Size</label>
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

              {/* Fee & Payment Instructions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Entry Fee (INR)</label>
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
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Payment Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI to festronix.vce@sbi or pay cash at spot desk"
                    value={editingEvent.paymentInstructions || ''}
                    onChange={e => setEditingEvent({ ...editingEvent, paymentInstructions: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Capacity & Deadline */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Max Capacity Slots</label>
                  <input
                    type="number"
                    min={1}
                    value={editingEvent.capacity}
                    onChange={e => setEditingEvent({ ...editingEvent, capacity: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Registration Deadline</label>
                  <input
                    type="text"
                    value={editingEvent.deadline}
                    onChange={e => setEditingEvent({ ...editingEvent, deadline: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Schedule & Venue */}
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

              {/* Coordinator Contact */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Coordinator Name</label>
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

              {/* Rules & Guidelines */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Rules & Guidelines (1 per line)</label>
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

              {/* Status */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Event Status</label>
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
                  <option value="pending_approval">Pending SAC Approval</option>
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

      {/* Add Event Modal */}
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
              Create New {deptCode} Event
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

              {/* Format & Team Config */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Participation Format</label>
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
                      <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Min Team Size</label>
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
                      <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Max Team Size</label>
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

              {/* Category, Fee & Payment Instructions */}
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
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Fee (INR)</label>
                  <input
                    type="number"
                    min={0}
                    value={newEventFee}
                    onChange={e => setNewEventFee(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '0.68rem', color: '#A8B3C2' }}>0 for Free</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Payment Instructions</label>
                  <input
                    type="text"
                    value={newEventPaymentInstructions}
                    onChange={e => setNewEventPaymentInstructions(e.target.value)}
                    placeholder="e.g. UPI or spot desk"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Capacity Slots & Deadline */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Capacity Slots</label>
                  <input
                    type="number"
                    min={1}
                    value={newEventCapacity}
                    onChange={e => setNewEventCapacity(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Registration Deadline</label>
                  <input
                    type="text"
                    value={newEventDeadline}
                    onChange={e => setNewEventDeadline(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Schedule & Venue */}
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

              {/* Assigned Coordinator */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Coordinator Name</label>
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
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Rules & Regulations (1 per line)</label>
                <textarea
                  rows={2}
                  value={newEventRules}
                  onChange={e => setNewEventRules(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }}
                />
              </div>

              {/* SAC Approval Policy */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Publishing Policy</label>
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
