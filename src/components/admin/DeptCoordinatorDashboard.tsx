import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Building2, Users, IndianRupee, Layers, CheckCircle2, Clock, Search,
  Download, Plus, Edit3, Trash2, ArrowRight, LogOut, Globe, QrCode,
  Sparkles, Check, AlertCircle, RefreshCw, XCircle, Eye, Phone, Mail,
  Copy, Megaphone, UserPlus, FileSpreadsheet, ShieldCheck, Award, Camera, StopCircle,
  Percent, ChevronRight, Share2, Printer, MapPin, Calendar, Bell, Filter, HelpCircle, KeyRound, TrendingUp,
  Upload
} from 'lucide-react';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import { AdminRole, AdminUser, AdminAuthService } from '../../services/adminAuthService';
import { StorageService } from '../../services/storageService';
import { isSupabaseConfigured } from '../../lib/supabase';
import { isFirebaseConfigured } from '../../lib/firebase';
import { getEventRegistrationBlockReason } from '../../lib/eventRegistration';
import {
  registrationRevenueAmount,
  registrationRevenueKey,
  sumPendingRegistrationRevenue,
  sumRegistrationRevenueForRows,
  sumVerifiedRegistrationRevenue,
} from '../../lib/revenue';
import { groupRegistrationsForDisplay, RegistrationDisplayGroup } from '../../lib/registrationDisplay';
import { TeamRosterModal } from './TeamRosterModal';
import { Department, FestEvent, Registration, FestStats, PaymentStatus, EventFormat, Announcement, Teammate } from '../../types/festronix';
import { AdminHeader } from './AdminHeader';
import { DeptSidebar } from './DeptSidebar';
import { ConfirmActionModal } from './ConfirmActionModal';

interface DeptCoordinatorDashboardProps {
  adminUser: AdminUser;
  onLogout: () => void;
  onSwitchToFest: () => void;
}

// Re-read Firebase every two minutes so the readiness score, counts and
// revenue stay current without asking coordinators to refresh manually.
const DEPT_DASHBOARD_REFRESH_MS = 2 * 60 * 1000;

export const DeptCoordinatorDashboard: React.FC<DeptCoordinatorDashboardProps> = ({
  adminUser,
  onLogout,
  onSwitchToFest
}) => {
  // Never infer a department from a malformed account. An empty code fails
  // closed: no events, registrations or announcements fall into scope.
  const deptCode = (adminUser.departmentCode || '').trim().toUpperCase();
  const clusterCode = adminUser.clusterCode?.toUpperCase();
  const clusterLabel = clusterCode
    ? ({ 'CSE-1': '1st Cluster · Verma', 'CSE-2': '2nd Cluster · Balu', 'CSE-3': '3rd Cluster · Raghavendra' } as Record<string, string>)[clusterCode] || clusterCode
    : '';
  const isCseDepartment = deptCode.toUpperCase() === 'CSE';
  // Event coordinators are authorized by explicit event assignments only.
  // Their department is account metadata and must not widen their portal data.
  const isEventCoord = adminUser.role === 'event_coordinator' || adminUser.role === 'faculty_coord' || adminUser.role === 'student_coord';
  const isDeptChief = adminUser.role === 'dept_chief_coordinator' || adminUser.role === 'dept_coordinator';
  const scopeDisplayName = isEventCoord
    ? 'Assigned Events'
    : !deptCode
      ? 'Unassigned department'
      : clusterLabel ? `${deptCode} · ${clusterLabel}` : deptCode;
  const [assignedEventIds, setAssignedEventIds] = useState<string[]>(() =>
    [...new Set((adminUser.assignedEvents || []).map(value => String(value).trim()).filter(Boolean))]
  );
  const [departments, setDepartments] = useState<Department[]>(() =>
    isFirebaseConfigured ? [] : StorageService.getDepartments()
  );
  const deptInfo = departments.find(department => department.code.toUpperCase() === deptCode);

  const eventMatchesAssignments = (event: FestEvent, eventIds: string[]): boolean =>
    eventIds.some(id => id.toLowerCase() === event.id.toLowerCase());

  const registrationMatchesAssignedEvents = (registration: Registration, scopedEvents: FestEvent[]): boolean =>
    scopedEvents.some(event => event.id === registration.eventId);

  // Cluster membership is an authorization boundary, not only a visual filter.
  const eventMatchesScope = (event: FestEvent): boolean =>
    event.departmentCode.toUpperCase() === deptCode.toUpperCase() &&
    (!isCseDepartment
      ? true
      : Boolean(clusterCode) && event.clusterCode?.toUpperCase() === clusterCode);

  // Only the authoritative event UUID may scope a registration. Titles and
  // slugs can be renamed or duplicated and would attach another event's roster.
  const registrationMatchesEvents = (registration: Registration, scopedEvents: FestEvent[]): boolean =>
    scopedEvents.some(event => event.id === registration.eventId);

  // Department announcements must match both the department and the exact CSE
  // cluster. A cluster coordinator must never see another cluster's notice.
  const announcementMatchesScope = (announcement: { scope: string; departmentCode?: string; clusterCode?: string }): boolean => {
    if (announcement.scope === 'fest-wide') return true;
    if (announcement.scope !== 'department') return false;
    if ((announcement.departmentCode || '').toUpperCase() !== deptCode.toUpperCase()) return false;
    return (announcement.clusterCode || '').toUpperCase() === (clusterCode || '').toUpperCase();
  };

  const initialScopedEvents = StorageService.getEvents().filter(event =>
    isEventCoord
      ? eventMatchesAssignments(event, assignedEventIds)
      : eventMatchesScope(event)
  );
  const initialScopedRegistrations = (isEventCoord
    ? StorageService.getRegistrations()
    : StorageService.getDepartmentRegistrations(deptCode))
    .filter(registration => isEventCoord
      ? registrationMatchesAssignedEvents(registration, initialScopedEvents)
      : registrationMatchesEvents(registration, initialScopedEvents));

  // Base Data States
  const [deptStats, setDeptStats] = useState<FestStats>(() => {
    const scopedEvents = initialScopedEvents;
    const scopedRegistrations = initialScopedRegistrations;
    return {
      totalRegistrations: scopedRegistrations.length,
      verifiedCount: scopedRegistrations.filter(r => r.paymentStatus === 'verified').length,
      pendingCount: scopedRegistrations.filter(r => r.paymentStatus === 'verification_pending').length,
      rejectedCount: scopedRegistrations.filter(r => r.paymentStatus === 'rejected').length,
      spotCount: scopedRegistrations.filter(r => r.source === 'spot').length,
      onlineCount: scopedRegistrations.filter(r => r.source !== 'spot').length,
      totalCollected: sumVerifiedRegistrationRevenue(scopedRegistrations),
      totalCapacity: scopedEvents.reduce((sum, event) => sum + (Number(event.capacity) || 0), 0),
      checkedInCount: scopedRegistrations.filter(r => r.checkedIn).length
    };
  });
  // A configured Supabase project is authoritative for department operations.
  // Do not render cached demo events while the first live read is in flight.
  const [events, setEvents] = useState<FestEvent[]>(() => isFirebaseConfigured || isSupabaseConfigured() ? [] : initialScopedEvents);
  const [registrations, setRegistrations] = useState<Registration[]>(() => isFirebaseConfigured || isSupabaseConfigured() ? [] : initialScopedRegistrations);
  const [eventAccessError, setEventAccessError] = useState<string | null>(null);
  const [deptSyncError, setDeptSyncError] = useState<string | null>(null);
  const [lastSuccessfulSync, setLastSuccessfulSync] = useState<Date | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    isEventCoord ? [] : StorageService.getAnnouncements().filter(a =>
      a.scope === 'fest-wide' ||
      (a.scope === 'department' && (!a.departmentCode || a.departmentCode.toUpperCase() === deptCode.toUpperCase()))
    )
  );

  type ManagedStaffRole = 'event_coordinator';
  type ManagedStaffForm = {
    fullName: string;
    username: string;
    designation: string;
    role: ManagedStaffRole;
    email: string;
    phone: string;
    password: string;
    assignedEvents: string[];
  };
  const managedStaffRoles = new Set<ManagedStaffRole>([
    'event_coordinator'
  ]);
  const filterDepartmentStaffByEventScope = (admins: AdminUser[], scopedEvents: FestEvent[]) => {
    const scopedEventKeys = new Set(
      scopedEvents.flatMap(event => [event.id, event.slug].map(value => value.toLowerCase()))
    );
    return admins.filter(admin =>
      managedStaffRoles.has(admin.role as ManagedStaffRole) &&
      (admin.assignedEvents || []).some(eventId => scopedEventKeys.has(eventId.toLowerCase()))
    );
  };
  const createEmptyStaffForm = (): ManagedStaffForm => ({
    fullName: '',
    username: '',
    designation: 'Department Operations Staff',
    role: 'event_coordinator',
    email: '',
    phone: '',
    password: '',
    assignedEvents: []
  });
  const [departmentStaff, setDepartmentStaff] = useState<AdminUser[]>(() =>
    filterDepartmentStaffByEventScope(AdminAuthService.getAllAdmins(), initialScopedEvents)
  );
  const [staffFormOpen, setStaffFormOpen] = useState(false);
  const [staffAccountMode, setStaffAccountMode] = useState<'new' | 'existing'>('new');
  const [existingStaffIdentifier, setExistingStaffIdentifier] = useState('');
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState<ManagedStaffForm>(() => createEmptyStaffForm());
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [staffMessage, setStaffMessage] = useState('');

  // Match only the event IDs in admin_event_assignments. Names, emails,
  // titles, department, and CSE cluster are never assignment fallbacks.
  const isEventAssigned = (e: FestEvent): boolean => {
    return eventMatchesAssignments(e, assignedEventIds);
  };

  const assignedEventsList = useMemo(() => {
    return events.filter(isEventAssigned);
  }, [events, assignedEventIds]);

  // 8.1: See assigned events by default
  const [eventScope, setEventScope] = useState<'assigned' | 'all'>(() => {
    return isEventCoord ? 'assigned' : 'all';
  });

  // Event coordinators start in analytics and never receive the event-management tab.
  type DashboardTab = 'events' | 'revenue' | 'checkin' | 'security';
  const [activeTab, setActiveTab] = useState<DashboardTab>(isEventCoord ? 'revenue' : 'events');

  // Revenue Analysis States & Filters (Scoped strictly to this department / assigned events)
  const [deptRevenueSearch, setDeptRevenueSearch] = useState('');
  const [deptRevenueStatusFilter, setDeptRevenueStatusFilter] = useState<'all' | 'verified' | 'verification_pending' | 'rejected'>('all');
  const [deptRevenueEventFilter, setDeptRevenueEventFilter] = useState<string>('all');
  const [selectedLedgerTeam, setSelectedLedgerTeam] = useState<RegistrationDisplayGroup | null>(null);

  // Attendance Check-in Event Filter & Attendee Search
  const [checkInEventFilter, setCheckInEventFilter] = useState<string>('all');
  const [checkInAttendeeSearch, setCheckInAttendeeSearch] = useState<string>('');

  // Password change is handled by Supabase Auth; values never enter localStorage.
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [passwordNext, setPasswordNext] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Gate Check-in State
  const [checkInInput, setCheckInInput] = useState('');
  const [checkInResult, setCheckInResult] = useState<{
    success: boolean;
    status: 'VALID' | 'ALREADY_CHECKED_IN' | 'NOT_FOUND' | 'PAYMENT_PENDING' | 'EVENT_MISMATCH';
    registration?: Registration;
    message: string;
  } | null>(null);
  const [checkInScannerOpen, setCheckInScannerOpen] = useState(false);
  const [checkInScannerError, setCheckInScannerError] = useState('');
  const checkInVideoRef = useRef<HTMLVideoElement>(null);
  const checkInStreamRef = useRef<MediaStream | null>(null);
  const checkInHandlerRef = useRef<(value: string) => Promise<void>>(async () => {});

  // Search Filter in Roster
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterStatusFilter, setRosterStatusFilter] = useState<'all' | 'verified' | 'verification_pending' | 'rejected' | 'checked_in'>('all');
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Edit Event Modal State (8.1 • Edit event details, rules, team limits, fee, capacity, deadline, schedule and venue)
  const [editingEvent, setEditingEvent] = useState<FestEvent | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [eventPendingDelete, setEventPendingDelete] = useState<FestEvent | null>(null);
  const [eventDeleteError, setEventDeleteError] = useState<string | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [eventCreateError, setEventCreateError] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

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
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventRules, setNewEventRules] = useState('Valid college ID required\nReport 15 minutes before start');
  const [newEventPaymentInstructions, setNewEventPaymentInstructions] = useState('Pay via Festronix Central UPI QR or spot desk');
  const [newEventWhatsAppGroupLink, setNewEventWhatsAppGroupLink] = useState('');
  const [newEventCoordinatorName, setNewEventCoordinatorName] = useState(adminUser.fullName);
  const [newEventCoordinatorPhone, setNewEventCoordinatorPhone] = useState(adminUser.phone || '+91 98480 12345');
  const [newEventCoordinatorEmail, setNewEventCoordinatorEmail] = useState(adminUser.email);

  const refreshInFlightRef = useRef<Promise<void> | null>(null);
  const refreshQueuedRef = useRef(false);

  const refreshDeptData = async (): Promise<void> => {
    // Registration, event and payment updates can arrive together. Coalesce
    // those notifications instead of starting several identical Firebase reads.
    if (refreshInFlightRef.current) {
      refreshQueuedRef.current = true;
      return refreshInFlightRef.current;
    }

    const refresh = (async () => {
      if (!isFirebaseConfigured && !isSupabaseConfigured()) {
        const all = StorageService.getEvents();
        const scopedEvts = all.filter(event => isEventCoord
          ? eventMatchesAssignments(event, assignedEventIds)
          : eventMatchesScope(event));
        const localRegs = (isEventCoord
          ? StorageService.getRegistrations()
          : StorageService.getDepartmentRegistrations(deptCode))
          .filter(registration => isEventCoord
            ? registrationMatchesAssignedEvents(registration, scopedEvts)
            : registrationMatchesEvents(registration, scopedEvts));
        setEvents(scopedEvts);
        setRegistrations(localRegs);
        setDeptStats({
          totalRegistrations: localRegs.length,
          verifiedCount: localRegs.filter(r => r.paymentStatus === 'verified').length,
          pendingCount: localRegs.filter(r => r.paymentStatus === 'verification_pending').length,
          rejectedCount: localRegs.filter(r => r.paymentStatus === 'rejected').length,
          spotCount: localRegs.filter(r => r.source === 'spot').length,
          onlineCount: localRegs.filter(r => r.source !== 'spot').length,
          totalCollected: sumVerifiedRegistrationRevenue(localRegs),
          totalCapacity: scopedEvts.reduce((sum, event) => sum + (Number(event.capacity) || 0), 0),
          checkedInCount: localRegs.filter(r => r.checkedIn).length
        });
        setAnnouncements(isEventCoord ? [] : StorageService.getAnnouncements().filter(announcementMatchesScope));
      }

      try {
        if (isEventCoord) setEventAccessError(null);
        const refreshedAssignedIds = isEventCoord
          ? await AdminAuthService.fetchCurrentAdminEventAssignments()
          : [];
        if (isEventCoord) setAssignedEventIds(refreshedAssignedIds);

        const [eventsResult, registrationsResult, announcementsResult, adminsResult] = await Promise.allSettled([
          isEventCoord
            ? StorageService.fetchLiveEventsForIds(refreshedAssignedIds)
            : isFirebaseConfigured || isSupabaseConfigured() ? StorageService.fetchLiveEvents() : StorageService.fetchEvents(),
          isEventCoord
            ? StorageService.fetchRegistrationsForEvents(refreshedAssignedIds)
            : StorageService.fetchRegistrations(),
          isEventCoord ? Promise.resolve([] as Announcement[]) : StorageService.fetchAnnouncements(),
          isDeptChief ? AdminAuthService.fetchAdmins() : Promise.resolve([] as AdminUser[])
        ]);
        if (eventsResult.status === 'rejected') throw eventsResult.reason;
        const liveEvts = eventsResult.value;
        const liveAnnouncements = announcementsResult.status === 'fulfilled' ? announcementsResult.value : [];
        const liveAdmins = adminsResult.status === 'fulfilled' ? adminsResult.value : [];
        if (announcementsResult.status === 'rejected') console.warn('Scoped announcements could not be loaded.', announcementsResult.reason);
        if (adminsResult.status === 'rejected') console.warn('Department staff directory could not be loaded.', adminsResult.reason);
        const updatedScopedEvents = isEventCoord
          ? liveEvts.filter(event => eventMatchesAssignments(event, refreshedAssignedIds))
          : liveEvts.filter(eventMatchesScope);
        setEvents(updatedScopedEvents);

        if (registrationsResult.status === 'rejected') {
          console.warn('Scoped registrations could not be loaded.', registrationsResult.reason);
          const detail = registrationsResult.reason instanceof Error
            ? registrationsResult.reason.message
            : 'The request failed.';
          setDeptSyncError(`Live registrations could not be refreshed: ${detail} Showing the last successful registration data.`);
          if (!isEventCoord) setAnnouncements(liveAnnouncements.filter(announcementMatchesScope));
          if (isDeptChief && adminsResult.status === 'fulfilled') {
            setDepartmentStaff(filterDepartmentStaffByEventScope(liveAdmins, updatedScopedEvents));
          }
          setDeptStats(prev => ({
            ...prev,
            totalCapacity: updatedScopedEvents.reduce((sum, event) => sum + (Number(event.capacity) || 0), 0)
          }));
          return;
        }

        const liveRegs = registrationsResult.value;
        const updatedScopedRegistrations = isEventCoord
          ? liveRegs.filter(registration => registrationMatchesAssignedEvents(registration, updatedScopedEvents))
          : liveRegs.filter(registration =>
              StorageService.resolveDepartmentForRegistration(registration, liveEvts) === deptCode.toUpperCase() &&
              registrationMatchesEvents(registration, updatedScopedEvents)
            );
        setRegistrations(updatedScopedRegistrations);
        setAnnouncements(isEventCoord ? [] : liveAnnouncements.filter(announcementMatchesScope));
        if (isDeptChief && adminsResult.status === 'fulfilled') {
          setDepartmentStaff(filterDepartmentStaffByEventScope(liveAdmins, updatedScopedEvents));
        }
        setDeptSyncError(null);
        setLastSuccessfulSync(new Date());
        setDeptStats({
          totalRegistrations: updatedScopedRegistrations.length,
          verifiedCount: updatedScopedRegistrations.filter(r => r.paymentStatus === 'verified').length,
          pendingCount: updatedScopedRegistrations.filter(r => r.paymentStatus === 'verification_pending').length,
          rejectedCount: updatedScopedRegistrations.filter(r => r.paymentStatus === 'rejected').length,
          spotCount: updatedScopedRegistrations.filter(r => r.source === 'spot').length,
          onlineCount: updatedScopedRegistrations.filter(r => r.source !== 'spot').length,
          totalCollected: sumVerifiedRegistrationRevenue(updatedScopedRegistrations),
          totalCapacity: updatedScopedEvents.reduce((sum, event) => sum + (Number(event.capacity) || 0), 0),
          checkedInCount: updatedScopedRegistrations.filter(r => r.checkedIn).length
        });
      } catch (err) {
        console.warn('Dept dashboard sync warning:', err);
        if (isEventCoord) {
          // Fail closed: never leave stale department-wide or previous-account
          // rows visible when assignment verification fails.
          setEventAccessError(err instanceof Error ? err.message : 'Unable to verify assigned event access.');
          setAssignedEventIds([]);
          setEvents([]);
          setRegistrations([]);
          setAnnouncements([]);
        } else {
          // Department coordinators previously kept stale rows with no warning.
          setDeptSyncError('Live sync failed. The data below may be out of date.');
        }
      }
    })();

    refreshInFlightRef.current = refresh;
    try {
      await refresh;
    } finally {
      refreshInFlightRef.current = null;
      if (refreshQueuedRef.current) {
        refreshQueuedRef.current = false;
        void refreshDeptData();
      }
    }
  };
  const refreshDeptDataRef = useRef(refreshDeptData);
  refreshDeptDataRef.current = refreshDeptData;

  useEffect(() => {
    if (!isEventCoord) {
      void StorageService.fetchDepartments()
        .then(setDepartments)
        .catch(error => console.warn('Department details could not be loaded from Firebase.', error));
    }
    refreshDeptData();

    // Listen to real-time local updates and cross-tab storage changes
    const handleRegsUpdate = () => {
      refreshDeptData();
    };

    const handleEventsUpdate = () => {
      refreshDeptData();
    };

    const handleAnnouncementsUpdate = () => {
      setAnnouncements(isEventCoord ? [] : StorageService.getAnnouncements().filter(announcementMatchesScope));
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'festronix_registrations_v1' || e.key === 'festronix_events_v1' || e.key === 'festronix_announcements_v1') {
        refreshDeptData();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refreshDeptDataRef.current();
    };
    const refreshTimer = window.setInterval(handleVisibilityChange, DEPT_DASHBOARD_REFRESH_MS);

    window.addEventListener('festronix:regs-updated', handleRegsUpdate);
    window.addEventListener('festronix:events-updated', handleEventsUpdate);
    window.addEventListener('festronix:announcements-updated', handleAnnouncementsUpdate);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(refreshTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('festronix:regs-updated', handleRegsUpdate);
      window.removeEventListener('festronix:events-updated', handleEventsUpdate);
      window.removeEventListener('festronix:announcements-updated', handleAnnouncementsUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [deptCode, clusterCode, isDeptChief, isEventCoord]);

  // Determine which events are actively filtered into view
  const visibleEvents = useMemo(() => {
    if (isEventCoord) return assignedEventsList;
    return eventScope === 'assigned' ? assignedEventsList : events;
  }, [eventScope, assignedEventsList, events, isEventCoord]);

  // Determine registrations for active event scope
  const scopedRegistrations = useMemo(() => {
    if (isEventCoord) {
      return registrations.filter(registration => registrationMatchesAssignedEvents(registration, assignedEventsList));
    }
    if (eventScope === 'assigned') {
      const assignedIds = new Set(assignedEventsList.map(e => e.id));
      return registrations.filter(r => assignedIds.has(r.eventId));
    }
    return registrations.filter(registration => registrationMatchesEvents(registration, events));
  }, [eventScope, assignedEventsList, registrations, events, isEventCoord]);

  // Registrations scoped to the specific event chosen in the check-in dropdown
  const checkInRegistrations = useMemo(() => {
    if (checkInEventFilter === 'all') return scopedRegistrations;
    return scopedRegistrations.filter(r => r.eventId === checkInEventFilter);
  }, [checkInEventFilter, scopedRegistrations, visibleEvents, isEventCoord]);

  // Filtered attendees for the check-in attendee directory table. Squads show as one row.
  const filteredCheckInAttendees = useMemo(() => {
    const groups = groupRegistrationsForDisplay(checkInRegistrations);
    const query = checkInAttendeeSearch.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter(group => {
      const r = group.representative;
      const searchable = [
        group.displayId,
        r.leaderName,
        r.leaderRoll,
        r.buyerRoll,
        group.teamName,
        group.teamCode,
        ...group.members.flatMap(member => [member.name, member.rollNumber]),
      ];
      return searchable.some(value => String(value || '').toLowerCase().includes(query));
    });
  }, [checkInRegistrations, checkInAttendeeSearch]);

  // Filtered Roster with Search and Status. Squads show as one row.
  const filteredRoster = useMemo(() => {
    return groupRegistrationsForDisplay(scopedRegistrations).filter(group => {
      const r = group.representative;
      const query = rosterSearch.trim().toLowerCase();
      const searchable = [
        group.displayId,
        r.leaderName,
        r.leaderRoll,
        r.eventTitle,
        group.teamName,
        group.teamCode,
        ...group.members.flatMap(member => [member.name, member.rollNumber]),
      ];
      const matchesSearch = !query || searchable.some(value => String(value || '').toLowerCase().includes(query));
      if (!matchesSearch) return false;

      if (rosterStatusFilter === 'verified') return group.paymentStatus === 'verified';
      if (rosterStatusFilter === 'verification_pending') return group.paymentStatus === 'verification_pending';
      if (rosterStatusFilter === 'rejected') return group.paymentStatus === 'rejected';
      if (rosterStatusFilter === 'checked_in') return group.allCheckedIn;

      return true;
    });
  }, [scopedRegistrations, rosterSearch, rosterStatusFilter]);

  // Department Revenue Calculations (STRICTLY SCOPED to scopedRegistrations and visibleEvents)
  const deptRevenueAnalytics = useMemo(() => {
    let totalVerified = 0;
    let totalPending = 0;
    let totalRejected = 0;
    let verifiedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    let onlineVerified = 0;
    let spotVerified = 0;
    let onlineCount = 0;
    let spotCount = 0;

    const countedVerified = new Set<string>();
    const countedPending = new Set<string>();
    scopedRegistrations.forEach(r => {
      const amount = registrationRevenueAmount(r);
      const key = registrationRevenueKey(r);
      if (r.paymentStatus === 'verified') {
        if (!countedVerified.has(key)) {
          countedVerified.add(key);
          totalVerified += amount;
          if (r.source === 'spot') spotVerified += amount;
          else onlineVerified += amount;
        }
        verifiedCount++;
        if (r.source === 'spot') spotCount++;
        else onlineCount++;
      } else if (r.paymentStatus === 'verification_pending') {
        if (!countedPending.has(key)) {
          countedPending.add(key);
          totalPending += amount;
        }
        pendingCount++;
      } else if (r.paymentStatus === 'rejected') {
        totalRejected += amount;
        rejectedCount++;
      }
    });

    const totalGross = totalVerified + totalPending;
    const avgPerDelegate = verifiedCount > 0 ? Math.round(totalVerified / verifiedCount) : 0;
    const totalPotentialCapacityRevenue = visibleEvents.reduce((sum, e) => sum + ((e.capacity || 0) * (e.fee || 0)), 0);
    const capacityMonetizationRate = totalPotentialCapacityRevenue > 0
      ? Math.min(100, Math.round((totalVerified / totalPotentialCapacityRevenue) * 100))
      : 0;

    // Event-wise revenue breakdown (ONLY for this coordinator's visible events)
    const eventBreakdown = visibleEvents.map(ev => {
      const evRegs = scopedRegistrations.filter(r => r.eventId === ev.id);
      const verifiedRegs = evRegs.filter(r => r.paymentStatus === 'verified');
      const pendingRegs = evRegs.filter(r => r.paymentStatus === 'verification_pending');
      const verifiedRev = sumVerifiedRegistrationRevenue(evRegs);
      const pendingRev = sumPendingRegistrationRevenue(evRegs);
      const theoreticalCapRev = (ev.capacity || 0) * (ev.fee || 0);

      return {
        id: ev.id,
        title: ev.title,
        category: ev.category,
        fee: ev.fee,
        capacity: ev.capacity,
        totalRegs: evRegs.length,
        verifiedCount: verifiedRegs.length,
        pendingCount: pendingRegs.length,
        verifiedRev,
        pendingRev,
        grossRev: verifiedRev + pendingRev,
        theoreticalCapRev,
        fillRate: ev.capacity > 0 ? Math.min(100, Math.round((evRegs.length / ev.capacity) * 100)) : 0
      };
    }).sort((a, b) => b.verifiedRev - a.verifiedRev);

    return {
      totalVerified,
      totalPending,
      totalRejected,
      totalGross,
      verifiedCount,
      pendingCount,
      rejectedCount,
      onlineVerified,
      spotVerified,
      onlineCount,
      spotCount,
      avgPerDelegate,
      totalPotentialCapacityRevenue,
      capacityMonetizationRate,
      eventBreakdown
    };
  }, [scopedRegistrations, visibleEvents, isEventCoord]);

  const analyticsScopeName = isEventCoord
    ? visibleEvents.length === 1
      ? visibleEvents[0].title
      : 'Assigned Events'
    : clusterLabel
      ? `${deptCode} · ${clusterLabel}`
      : (deptInfo?.name || deptCode);

  const filteredDeptRevenueRegistrations = useMemo(() => {
    return scopedRegistrations.filter(r => {
      const matchEvent = deptRevenueEventFilter === 'all' || r.eventId === deptRevenueEventFilter;
      const matchStatus = deptRevenueStatusFilter === 'all' || r.paymentStatus === deptRevenueStatusFilter;
      const q = deptRevenueSearch.trim().toLowerCase();
      const matchSearch = !q ||
        r.id.toLowerCase().includes(q) ||
        (r.leaderName && r.leaderName.toLowerCase().includes(q)) ||
        (r.leaderRoll && r.leaderRoll.toLowerCase().includes(q)) ||
        (r.leaderEmail && r.leaderEmail.toLowerCase().includes(q)) ||
        (r.eventTitle && r.eventTitle.toLowerCase().includes(q)) ||
        (r.transactionId && r.transactionId.toLowerCase().includes(q)) ||
        (r.razorpayPaymentId && r.razorpayPaymentId.toLowerCase().includes(q));
      return matchEvent && matchStatus && matchSearch;
    });
  }, [scopedRegistrations, deptRevenueEventFilter, deptRevenueStatusFilter, deptRevenueSearch]);

  const filteredDeptRevenueGroups = useMemo(() => {
    const query = deptRevenueSearch.trim().toLowerCase();
    return groupRegistrationsForDisplay(scopedRegistrations).filter(group => {
      const matchEvent = deptRevenueEventFilter === 'all' || group.registrations.some(registration => registration.eventId === deptRevenueEventFilter);
      const matchStatus = deptRevenueStatusFilter === 'all' || group.registrations.some(registration => registration.paymentStatus === deptRevenueStatusFilter);
      const searchableValues = [group.displayId, group.teamCode, group.teamName, group.representative.eventTitle,
        ...group.registrations.flatMap(registration => [
          registration.id, registration.leaderName, registration.leaderRoll, registration.buyerRoll,
          registration.leaderEmail, registration.leaderPhone, registration.transactionId, registration.razorpayPaymentId,
          ...(registration.teammates || []).flatMap(member => [member.name, member.rollNumber, member.email, member.phone]),
        ])];
      const matchSearch = !query || searchableValues.some(value => String(value || '').toLowerCase().includes(query));
      return matchEvent && matchStatus && matchSearch;
    });
  }, [scopedRegistrations, deptRevenueEventFilter, deptRevenueStatusFilter, deptRevenueSearch]);

  const handleExportDeptRevenueCSV = () => {
    const headers = [
      'Registration ID',
      ...(!isEventCoord ? ['Department'] : []),
      'Event Name',
      'Participant Name',
      'Roll Number',
      'Email',
      'Fee (INR)',
      'Payment Status',
      'Payment Mode',
      'Source',
      'Transaction ID / UTR',
      'Registered Date'
    ];
    const rows = filteredDeptRevenueRegistrations.map(r => {
      return [
        r.id,
        ...(!isEventCoord ? [`"${deptCode}"`] : []),
        `"${(r.eventTitle || '').replace(/"/g, '""')}"`,
        `"${(r.leaderName || '').replace(/"/g, '""')}"`,
        `"${r.leaderRoll || ''}"`,
        `"${r.leaderEmail || ''}"`,
        registrationRevenueAmount(r),
        r.paymentStatus,
        r.paymentMethod || 'UPI',
        r.source || 'online',
        `"${r.transactionId || r.razorpayPaymentId || (r.paymentScreenshotUrl ? 'Proof Attached' : '')}"`,
        `"${r.registrationDate || ''}"`
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FESTRONIX_2026_${isEventCoord ? 'ASSIGNED_EVENTS' : deptCode}_REVENUE_REPORT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle Event Status
  const handleToggleEventStatus = async (event: FestEvent) => {
    if (!isDeptChief) {
      window.alert('Only the department coordinator can update event settings.');
      return;
    }
    if (event.status !== 'open' && event.approvalStatus !== 'approved') {
      window.alert('This event must be approved by SAC before it can be opened for registrations.');
      return;
    }
    try {
      const nextStatus = event.status === 'open' ? 'closed' : 'open';
      const updated = { ...event, status: nextStatus as any };
      await StorageService.updateEvent(updated);
      await refreshDeptData();
    } catch (error) {
      window.alert((error as Error).message || 'Unable to update event status.');
    }
  };

  // Save Edited Event
  const handleSaveEditedEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDeptChief) {
      window.alert('Only the department coordinator can edit department events.');
      return;
    }
    if (!editingEvent) return;
    if (editingEvent.status === 'open' && editingEvent.approvalStatus !== 'approved') {
      window.alert('This event must be approved by SAC before it can be opened for registrations.');
      return;
    }
    try {
      // Unapproved events may only remain in the submitted state. The DB
      // trigger rejects other status values for department accounts.
      const payload = editingEvent.approvalStatus === 'approved'
        ? editingEvent
        : { ...editingEvent, status: 'pending_approval' as any };
      await StorageService.updateEvent(payload);
      setEditingEvent(null);
      await refreshDeptData();
      confetti({ particleCount: 50, spread: 45 });
    } catch (error) {
      window.alert((error as Error).message || 'Unable to save event changes.');
    }
  };

  const handleDeleteDepartmentEvent = (event: FestEvent) => {
    if (!isDeptChief) {
      window.alert('Only the department coordinator can delete department events.');
      return;
    }
    setEventDeleteError(null);
    setEventPendingDelete(event);
  };

  const confirmDeleteDepartmentEvent = async () => {
    const event = eventPendingDelete;
    if (!event || deletingEventId) return;
    setDeletingEventId(event.id);
    setEventDeleteError(null);
    try {
      await StorageService.deleteEvent(event.id, event.slug);
      setEventPendingDelete(null);
      await refreshDeptData();
    } catch (error) {
      setEventDeleteError((error as Error).message || 'Unable to permanently delete the event.');
    } finally {
      setDeletingEventId(null);
    }
  };

  // Add New Event (FR-EVT-01 to FR-EVT-08)
  const handleCreateNewEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventCreateError('');
    if (!isDeptChief) {
      setEventCreateError('Only the department coordinator can create department events.');
      return;
    }
    if (!newEventTitle.trim()) {
      setEventCreateError('Enter an event title before saving.');
      return;
    }
    if (newEventTitle.trim().length < 3 || newEventTitle.trim().length > 120) {
      setEventCreateError('Event title must be between 3 and 120 characters.');
      return;
    }
    if (isCseDepartment && !clusterCode) {
      setEventCreateError('Your CSE coordinator account is not assigned to a cluster. Ask an administrator to assign CSE-1, CSE-2, or CSE-3 before creating an event.');
      return;
    }
    if (!Number.isFinite(Number(newEventFee)) || Number(newEventFee) < 0) {
      setEventCreateError('Enter a valid non-negative event fee.');
      return;
    }
    const title = newEventTitle.trim();
    const venue = newEventVenue.trim();
    const description = newEventDesc.trim();
    const paymentInstructions = newEventPaymentInstructions.trim();
    const coordinatorName = newEventCoordinatorName.trim();
    const coordinatorPhone = newEventCoordinatorPhone.trim();
    const coordinatorEmail = newEventCoordinatorEmail.trim();
    const phoneDigits = coordinatorPhone.replace(/\D/g, '');
    const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coordinatorEmail);

    if (!venue || venue.length > 160) {
      setEventCreateError('Enter a venue between 1 and 160 characters.');
      return;
    }
    if (description.length > 2000 || newEventRules.length > 2000 || paymentInstructions.length > 500) {
      setEventCreateError('Description and event instructions are too long. Keep the description/rules under 2,000 characters and payment instructions under 500.');
      return;
    }
    if (!coordinatorName || coordinatorName.length > 120) {
      setEventCreateError('Enter a valid coordinator name.');
      return;
    }
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      setEventCreateError('Enter a valid coordinator phone number.');
      return;
    }
    if (!emailLooksValid) {
      setEventCreateError('Enter a valid coordinator email address.');
      return;
    }
    if (!['Dec 1, 2026', 'Dec 2, 2026', 'Dec 1-2, 2026'].includes(newEventDate)) {
      setEventCreateError('Select an event day.');
      return;
    }

    let minSize = 1;
    let maxSize = 1;
    if (newEventFormat === 'duo') {
      minSize = 2;
      maxSize = 2;
    } else if (newEventFormat === 'team') {
      if (!Number.isInteger(Number(newEventMinTeamSize)) || !Number.isInteger(Number(newEventMaxTeamSize)) || Number(newEventMinTeamSize) < 2 || Number(newEventMaxTeamSize) < Number(newEventMinTeamSize) || Number(newEventMaxTeamSize) > 15) {
        setEventCreateError('Team size must be whole numbers between 2 and 15, with maximum at least minimum.');
        return;
      }
      minSize = Math.max(2, Number(newEventMinTeamSize) || 2);
      maxSize = Math.max(minSize, Number(newEventMaxTeamSize) || 4);
    }

    const rulesArr = newEventRules
      .split('\n')
      .map(r => r.trim())
      .filter(Boolean);

    const slugBase = newEventTitle
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `event-${Date.now()}`;
    const newEvt: FestEvent = {
      // Supabase generates the durable UUID. This temporary client id is used
      // only until the insert returns the authoritative row.
      id: `draft-${deptCode.toLowerCase()}-${Date.now().toString(36)}`,
      slug: `${slugBase}-${Date.now().toString(36)}`,
      title,
      departmentId: deptInfo?.id || `dept-${deptCode.toLowerCase()}`,
      departmentCode: deptCode,
      clusterCode,
      category: newEventCategory,
      format: newEventFormat,
      minTeamSize: minSize,
      maxTeamSize: maxSize,
      fee: Number(newEventFee),
      capacity: 0,
      registeredCount: 0,
      deadline: '',
      date: newEventDate,
      time: newEventTime,
      venue,
      description: description || 'Exciting engineering challenge hosted by the department.',
      rules: rulesArr.length > 0 ? rulesArr : ['Valid college ID required', 'Report 15 minutes before start'],
      prizes: { first: '₹15,000 Cash + Certificate', second: '₹8,000 Cash' },
      eligibility: 'All Engineering Students',
      coordinatorName,
      coordinatorPhone,
      coordinatorEmail,
      // Department-created events must go through SAC approval. Global admins
      // use the Dean console for direct publishing.
      status: 'pending_approval',
      approvalStatus: 'pending',
      paymentInstructions: paymentInstructions || 'Pay via Festronix Central UPI or on-venue spot desk',
      whatsappGroupLink: newEventWhatsAppGroupLink.trim() || undefined,
      bannerGradient: 'linear-gradient(135deg, #283B78 0%, #101A35 100%)'
    };

    setIsCreatingEvent(true);
    try {
      await StorageService.addEvent(newEvt);
      setIsAddEventOpen(false);
      setEventCreateError('');
      setNewEventTitle('');
      setNewEventDesc('');
      setNewEventWhatsAppGroupLink('');
      await refreshDeptData();
      confetti({ particleCount: 60, spread: 50 });
    } catch (error) {
      setEventCreateError(error instanceof Error ? error.message : 'Unable to create the event in the backend.');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  // Spot Registration Handler (8.1 • Create spot registrations on fest day)
  const handleCreateSpotRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDeptChief) {
      window.alert('Only the department coordinator can create spot registrations.');
      return;
    }
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

  // Audio feedback on successful QR scan
  const playScanBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch { /* audio not supported */ }
  };

  // Fast Gate Check-In Handler (8.1 • Validate QR tickets and view attendance)
  const handleCheckInValue = async (value: string) => {
    let cleanVal = String(value || '').trim();
    if (!cleanVal) return;

    // 1. JSON payload support if QR code was encoded as JSON
    if (cleanVal.startsWith('{') && cleanVal.endsWith('}')) {
      try {
        const parsed = JSON.parse(cleanVal);
        cleanVal = parsed.token || parsed.qrToken || parsed.id || parsed.regId || cleanVal;
      } catch { /* not JSON */ }
    }

    // 2. URL extraction support if QR code was encoded as a URL
    if (cleanVal.includes('http://') || cleanVal.includes('https://')) {
      try {
        const url = new URL(cleanVal);
        cleanVal = url.searchParams.get('token') || url.searchParams.get('id') || url.pathname.split('/').pop() || cleanVal;
      } catch { /* raw */ }
    }

    // 3. Strip common text prefixes (e.g. "TOKEN: ", "ID: ", "PASS: ")
    cleanVal = cleanVal.replace(/^(token|id|registration|pass):\s*/i, '').trim();
    const query = cleanVal.toLowerCase();

    // Only ever search the server-scoped roster. Falling back to the master
    // local pool could display another department's participant PII before the
    // event-mismatch guard runs.
    const primaryPool = registrations.length > 0 ? registrations : scopedRegistrations;

    const matchingReg = primaryPool.find(
      r => (r.id && r.id.toLowerCase() === query) ||
           (r.qrToken && r.qrToken.toLowerCase() === query) ||
           (r.leaderRoll && r.leaderRoll.toLowerCase() === query) ||
           (r.buyerRoll && r.buyerRoll.toLowerCase() === query) ||
           (r.teamCode && r.teamCode.toLowerCase() === query) ||
           (r.teammates && r.teammates.some(t => t.rollNumber && t.rollNumber.toLowerCase() === query))
    );

    if (!matchingReg) {
      setCheckInResult({
        success: false,
        status: 'NOT_FOUND',
        message: `No registration found matching "${cleanVal}". Please verify the pass or enter the Roll Number manually.`
      });
      return;
    }

    if (isEventCoord) {
      const belongsToAssignedEvent = visibleEvents.some(event => event.id === matchingReg!.eventId);

      if (!belongsToAssignedEvent) {
        setCheckInResult({
          success: false,
          status: 'EVENT_MISMATCH',
          message: 'This pass is not for an event assigned to your coordinator account.',
        });
        return;
      }
    }

    // Event-specific validation when a specific event dropdown is selected
    if (checkInEventFilter !== 'all') {
      const isMatchingEvent = matchingReg.eventId === checkInEventFilter;

      if (!isMatchingEvent) {
        setCheckInResult({
          success: false,
          status: 'EVENT_MISMATCH',
          message: `Notice: This pass is for "${matchingReg.eventTitle}", but your desk is filtered for a different event. Switch the dropdown to validate this student.`
        });
        return;
      }
    }

    const res = await StorageService.checkInRegistration(matchingReg.id, adminUser.fullName);
    setCheckInResult(res);

    if (res.success) {
      playScanBeep();
      confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
      setCheckInInput('');
    }
    refreshDeptData();
  };

  // Keep the scanner lifecycle stable while still calling the latest check-in handler.
  // The handler closes over live dashboard state, so it must not be added to the
  // camera effect dependencies (doing so would restart the camera on every render).
  useEffect(() => {
    checkInHandlerRef.current = handleCheckInValue;
  });

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCheckInValue(checkInInput);
  };

  // QR Scanning via live camera stream (Works in all browsers using jsQR + hardware BarcodeDetector fallback)
  useEffect(() => {
    if (!checkInScannerOpen) {
      checkInStreamRef.current?.getTracks().forEach(track => track.stop());
      checkInStreamRef.current = null;
      if (checkInVideoRef.current) checkInVideoRef.current.srcObject = null;
      return;
    }
    const videoElement = checkInVideoRef.current;
    let cancelled = false;
    let frame = 0;
    let activeStream: MediaStream | null = null;
    const startScanner = async () => {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        if (cancelled) {
          activeStream.getTracks().forEach(track => track.stop());
          return;
        }
        checkInStreamRef.current = activeStream;
        if (videoElement) {
          videoElement.srcObject = activeStream;
          await videoElement.play();
        }

        const BarcodeDetectorCtor = (window as any).BarcodeDetector;
        const detector = BarcodeDetectorCtor ? new BarcodeDetectorCtor({ formats: ['qr_code'] }) : null;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const scan = async () => {
          if (cancelled || !videoElement) return;
          const video = videoElement;
          if (video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
            let scannedValue = '';

            // 1. Try native BarcodeDetector if available
            if (detector) {
              try {
                const codes = await detector.detect(video);
                if (codes && codes.length > 0 && codes[0].rawValue) {
                  scannedValue = codes[0].rawValue;
                }
              } catch { /* fallback to jsQR */ }
            }

            // 2. High-performance universal jsQR fallback (runs in 100% of browsers)
            if (!scannedValue && ctx) {
              try {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const qr = jsQR(imgData.data, imgData.width, imgData.height, {
                  inversionAttempts: 'attemptBoth'
                });
                if (qr && qr.data) {
                  scannedValue = qr.data;
                }
              } catch { /* frame processing */ }
            }

            if (scannedValue) {
              playScanBeep();
              setCheckInInput(scannedValue);
              setCheckInScannerOpen(false);
              await checkInHandlerRef.current(scannedValue);
              return;
            }
          }
          frame = requestAnimationFrame(scan);
        };
        frame = requestAnimationFrame(scan);
      } catch (error) {
        setCheckInScannerError((error as Error).message || 'Unable to access camera. Please allow camera permissions or enter Roll Number manually.');
        setCheckInScannerOpen(false);
      }
    };
    startScanner();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      activeStream?.getTracks().forEach(track => track.stop());
      if (checkInStreamRef.current === activeStream) {
        checkInStreamRef.current = null;
        if (videoElement) videoElement.srcObject = null;
      }
    };
  }, [checkInScannerOpen]);

  // Decode QR code from uploaded image or photo
  const handleScanImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const qr = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'attemptBoth' });
        if (qr && qr.data) {
          playScanBeep();
          setCheckInInput(qr.data);
          setCheckInScannerError('');
          await handleCheckInValue(qr.data);
        } else {
          setCheckInScannerError('No QR code detected in the uploaded image. Please ensure the QR code is clearly visible.');
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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

  // Squads are displayed as one row; check-in still updates every Firebase pass in the squad.
  const handleQuickCheckInGroupFromRoster = async (group: RegistrationDisplayGroup) => {
    if (group.registrations.length <= 1) {
      await handleQuickCheckInFromRoster(group.representative);
      return;
    }
    const shouldCheckIn = !group.allCheckedIn;
    try {
      for (const registration of group.registrations) {
        if (registration.checkedIn === shouldCheckIn) continue;
        const res = await StorageService.checkInRegistration(registration.id, adminUser.fullName);
        setCheckInResult(res);
        if (!res.success) throw new Error(res.message || 'One or more squad passes could not be checked in.');
      }
      if (shouldCheckIn) confetti({ particleCount: 50, spread: 40 });
    } catch (error) {
      window.alert((error as Error).message || 'Unable to update squad check-in status.');
    }
    refreshDeptData();
  };

  // Payment Verification Handler (8.1 • Review registrations and payment evidence)
  const handleVerifyPayment = async (regId: string, status: PaymentStatus, reason?: string) => {
    if (!isDeptChief) {
      window.alert('Payment verification is handled by the central finance team.');
      return;
    }
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
      alert('Only the department coordinator can publish department announcements.');
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
      departmentCode: deptCode,
      clusterCode: isCseDepartment ? clusterCode : undefined
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
    const targetGroups = scopeName === 'filtered' ? filteredRoster : groupRegistrationsForDisplay(scopedRegistrations);
    const headers = [
      'Entry ID', 'Event Title', 'Participant / Squad', 'Roll / Members', 'Team Name',
      'Team Code', 'Email', 'Phone', 'College', 'Fee (INR)', 'Payment Status',
      'Checked In', 'Source', 'Transaction ID'
    ];
    const rows = targetGroups.map(group => {
      const r = group.representative;
      return [
        group.displayId,
        `"${r.eventTitle.replace(/"/g, '""')}"`,
        `"${(group.isTeam ? group.teamName || 'Team' : r.leaderName).replace(/"/g, '""')}"`,
        `"${group.isTeam ? group.members.map(member => `${member.name}${member.rollNumber ? ` (${member.rollNumber})` : ''}`).join('; ') : r.leaderRoll}"`,
        `"${(group.teamName || 'Solo').replace(/"/g, '""')}"`,
        group.teamCode || 'N/A',
        r.leaderEmail,
        r.leaderPhone,
        `"${r.leaderCollege.replace(/"/g, '""')}"`,
        sumRegistrationRevenueForRows(group.registrations),
        group.paymentStatus,
        group.allCheckedIn ? 'YES' : group.anyCheckedIn ? 'PARTIAL' : 'NO',
        r.source || 'online',
        group.registrations.find(row => row.transactionId)?.transactionId || 'N/A'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FESTRONIX_${deptCode}_${scopeName.toUpperCase()}_ROSTER_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Department Executive Report CSV for department coordinators (8.2 • Access departmental reports)
  const handleExportDeptExecutiveReport = () => {
    const headers = [
      'Event ID', 'Event Title', 'Category', 'Format', 'Coordinator', 'Phone', 'Email',
      'Registrations', 'Fee (INR)', 'Total Revenue (INR)',
      'Checked-In (Turnout)', 'Turnout %'
    ];
    const rows = events.map(evt => {
      const evtRegs = registrations.filter(r => r.eventId === evt.id);
      const verifiedRegs = evtRegs.filter(r => r.paymentStatus === 'verified');
      const checkedInCount = evtRegs.filter(r => r.checkedIn).length;
      const totalRev = sumVerifiedRegistrationRevenue(evtRegs);
      const turnoutPct = evtRegs.length > 0 ? Math.round((checkedInCount / evtRegs.length) * 100) : 0;

      return [
        evt.id,
        `"${evt.title.replace(/"/g, '""')}"`,
        evt.category,
        evt.format,
        `"${evt.coordinatorName.replace(/"/g, '""')}"`,
        evt.coordinatorPhone,
        evt.coordinatorEmail,
        evtRegs.length,
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
    return departmentStaff
      .map(admin => {
        const assignedEvents = (admin.assignedEvents || [])
          .map(eventId => events.find(event => event.id === eventId || event.slug === eventId))
          .filter((event): event is FestEvent => Boolean(event));
        return { ...admin, assignedEventDetails: assignedEvents };
      })
      .filter(admin => admin.assignedEventDetails.length > 0);
  }, [departmentStaff, events]);

  const openCreateStaffForm = () => {
    setEditingStaffId(null);
    setStaffAccountMode('new');
    setExistingStaffIdentifier('');
    setStaffForm(createEmptyStaffForm());
    setStaffError('');
    setStaffMessage('');
    setStaffFormOpen(true);
  };

  const openEditStaffForm = (staff: AdminUser) => {
    if (!managedStaffRoles.has(staff.role as ManagedStaffRole)) return;
    setEditingStaffId(staff.id);
    setStaffAccountMode('new');
    setExistingStaffIdentifier('');
    setStaffForm({
      fullName: staff.fullName,
      username: staff.username,
      designation: staff.designation,
      role: staff.role as ManagedStaffRole,
      email: staff.email,
      phone: staff.phone || '',
      password: '',
      assignedEvents: staff.assignedEvents || []
    });
    setStaffError('');
    setStaffMessage('');
    setStaffFormOpen(true);
  };

  const handleStaffSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStaffError('');
    setStaffMessage('');
    const assignedEvents = staffForm.assignedEvents;
    if (!editingStaffId && staffAccountMode === 'existing') {
      if (!existingStaffIdentifier.trim()) {
        setStaffError('Enter the existing account email address or username.');
        return;
      }
    } else {
      if (!staffForm.fullName.trim() || !staffForm.username.trim() || !staffForm.email.trim() || !staffForm.designation.trim()) {
        setStaffError('Name, username, designation, and email are required.');
        return;
      }
      if (!editingStaffId && staffForm.password.trim().length < 12) {
        setStaffError('The initial password must be at least 12 characters.');
        return;
      }
    }
    if (!editingStaffId && staffAccountMode === 'new') {
      // This is only a fast UX check. The Edge Function and database guard
      // remain authoritative so stale browser caches cannot bypass it.
      const requestedUsername = staffForm.username.trim().toLowerCase();
      const requestedEmail = staffForm.email.trim().toLowerCase();
      const duplicate = AdminAuthService.getAllAdmins().find(admin =>
        admin.username.trim().toLowerCase() === requestedUsername ||
        admin.email.trim().toLowerCase() === requestedEmail
      );
      if (duplicate) {
        const sameUsername = duplicate.username.trim().toLowerCase() === requestedUsername;
        const sameEmail = duplicate.email.trim().toLowerCase() === requestedEmail;
        setStaffError(
          sameUsername && sameEmail
            ? 'That username and email are already assigned to an active portal account.'
            : sameUsername
              ? 'That username is already assigned to an active portal account.'
              : 'That email address is already assigned to an active portal account.'
        );
        return;
      }
    }
    if (assignedEvents.length === 0) {
      setStaffError('Select at least one department event for this coordinator account.');
      return;
    }

    setStaffSaving(true);
    try {
      // Never submit browser-cache event identifiers. The public event reader
      // can fall back to old local data for resilience, but staff permissions
      // are a backend write and must be based on the current Supabase rows.
      const liveEvents = await StorageService.fetchLiveEvents();
      const liveEventByKey = new Map<string, FestEvent>();
      liveEvents.forEach(liveEvent => {
        liveEventByKey.set(liveEvent.id.toLowerCase(), liveEvent);
        liveEventByKey.set(liveEvent.slug.toLowerCase(), liveEvent);
      });
      const resolvedAssignedEvents = assignedEvents.map(identifier => {
        const liveEvent = liveEventByKey.get(identifier.trim().toLowerCase());
        if (!liveEvent) {
          throw new Error(`The selected event “${identifier}” is not available in the live database. Refresh the event list and select an active department event.`);
        }
        if (!eventMatchesScope(liveEvent)) {
          throw new Error(`The selected event “${liveEvent.title}” is outside your assigned ${scopeDisplayName} scope.`);
        }
        return liveEvent.id;
      });
      const uniqueAssignedEvents = [...new Set(resolvedAssignedEvents)];

      const payload = {
        fullName: staffForm.fullName.trim(),
        username: staffForm.username.trim().toLowerCase(),
        designation: staffForm.designation.trim(),
        role: staffForm.role as AdminRole,
        departmentCode: deptCode,
        clusterCode,
        email: staffForm.email.trim().toLowerCase(),
        phone: staffForm.phone.trim(),
        accessBoundary: `${deptCode} department operations`,
        assignedEvents: uniqueAssignedEvents,
        ...(staffForm.password.trim() ? { password: staffForm.password.trim() } : {})
      };

      if (editingStaffId) {
        await AdminAuthService.updateAdmin(editingStaffId, payload);
        setStaffMessage('Staff permissions and profile updated successfully.');
      } else if (staffAccountMode === 'existing') {
        await AdminAuthService.assignExistingAccount({
          identifier: existingStaffIdentifier,
          role: staffForm.role as AdminRole,
          departmentCode: deptCode,
          clusterCode,
          designation: staffForm.designation.trim(),
          accessBoundary: `${deptCode} department operations`,
          assignedEvents: uniqueAssignedEvents
        });
        setStaffMessage('Existing account assigned to this department successfully. The person can sign in with their current password.');
      } else {
        await AdminAuthService.addAdmin(payload);
        setStaffMessage(`Account created. Share username “${payload.username}” and the password you entered with the staff member.`);
      }
      const refreshed = await AdminAuthService.fetchAdmins();
      setDepartmentStaff(filterDepartmentStaffByEventScope(refreshed, events));
      setStaffFormOpen(false);
    } catch (error) {
      setStaffError(error instanceof Error ? error.message : 'Unable to save this staff account.');
    } finally {
      setStaffSaving(false);
    }
  };

  const handleStaffDelete = async (staff: AdminUser) => {
    if (!managedStaffRoles.has(staff.role as ManagedStaffRole)) return;
    if (!window.confirm(`Permanently delete ${staff.fullName}'s account? This removes their Firebase Authentication account, profile, portal role, and event assignments. The action cannot be undone.`)) return;
    setStaffError('');
    setStaffMessage('');
    try {
      await AdminAuthService.deleteAdmin(staff.id);
      setDepartmentStaff(current => current.filter(item => item.id !== staff.id));
      setStaffMessage(`${staff.fullName}'s account was deleted from the backend.`);
    } catch (error) {
      setStaffError(error instanceof Error ? error.message : 'Unable to delete this staff account.');
    }
  };

  // Copy contact to clipboard
  const handleCopyContact = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(`${label} copied!`);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordMessage(null);

    if (passwordNext.length < 12) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 12 characters.' });
      return;
    }
    if (passwordNext !== passwordConfirm) {
      setPasswordMessage({ type: 'error', text: 'The new password and confirmation do not match.' });
      return;
    }
    if (passwordNext === passwordCurrent) {
      setPasswordMessage({ type: 'error', text: 'Choose a new password different from the current password.' });
      return;
    }

    setPasswordSaving(true);
    try {
      await AdminAuthService.changePassword(passwordCurrent, passwordNext);
      setPasswordCurrent('');
      setPasswordNext('');
      setPasswordConfirm('');
      setPasswordMessage({ type: 'success', text: 'Password changed successfully. Use it the next time you sign in.' });
    } catch (error) {
      setPasswordMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to change your password.'
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  // Readiness Metrics (8.2 • Readiness Monitor)
  // Derived only from live Firebase-backed state. Capacity is intentionally
  // excluded because registrations are unlimited; the final 20% now measures
  // whether each scoped event has at least one confirmed participant.
  const readinessMetrics = useMemo(() => {
    const totalEventsCount = events.length;
    const eventsWithVenues = events.filter(e => e.venue && e.venue.trim().length > 0).length;
    const eventsWithCoords = events.filter(e => e.coordinatorName && e.coordinatorPhone).length;
    const pendingPaymentCount = registrations.filter(r => r.paymentStatus === 'verification_pending').length;
    const confirmedRegistrationCount = registrations.filter(r =>
      r.paymentStatus === 'verified' || r.paymentStatus === 'not_applicable'
    ).length;
    const eventsWithConfirmedRegistrations = new Set(
      registrations
        .filter(r => r.paymentStatus === 'verified' || r.paymentStatus === 'not_applicable')
        .map(r => r.eventId)
    ).size;

    let score = 0;
    if (totalEventsCount > 0) {
      score += (eventsWithVenues / totalEventsCount) * 30; // 30% venue allocation
      score += (eventsWithCoords / totalEventsCount) * 30; // 30% coordinator appointment
      score += (Math.min(eventsWithConfirmedRegistrations, totalEventsCount) / totalEventsCount) * 20;
    }
    // 20% for payment review queue health (100% if 0 pending)
    score += pendingPaymentCount === 0 ? 20 : Math.max(5, 20 - (pendingPaymentCount * 2));

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      eventsWithVenues,
      eventsWithCoords,
      pendingPaymentCount,
      confirmedRegistrationCount,
      totalEventsCount
    };
  }, [events, registrations]);

  return (
    <div className="admin-shell-layout">
      {/* 1. Left Vertical Sidebar Navigation */}
      <DeptSidebar
        adminUser={adminUser}
        deptCode={deptCode}
        deptName={deptInfo?.name}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isDeptChief={isDeptChief}
        isEventCoord={isEventCoord}
        eventsCount={isEventCoord ? visibleEvents.length : events.length}
        readinessScore={readinessMetrics.score}
        rosterCount={scopedRegistrations.length}
        pendingPaymentsCount={scopedRegistrations.filter(r => r.paymentStatus === 'verification_pending').length}
        announcementsCount={announcements.length}
        coordinatorsCount={departmentCoordinatorsList.length}
        onSwitchToFest={onSwitchToFest}
        onLogout={onLogout}
      />

      {/* 2. Main Viewport Canvas */}
      <div className="admin-main-viewport">
        {/* Shared Executive Command Header */}
        <AdminHeader
          adminUser={adminUser}
          onLogout={onLogout}
          onSwitchToFest={onSwitchToFest}
          fluid={true}
        />

        {/* Main Content Area */}
        <main className="admin-content-container" style={{ padding: '24px 28px', maxWidth: '1440px', width: '100%', boxSizing: 'border-box' }}>

        {deptSyncError && (
          <div role="alert" style={{ marginBottom: '18px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.45)', color: '#FCD34D', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span>
              {deptSyncError}
              {lastSuccessfulSync ? ` Last successful sync: ${lastSuccessfulSync.toLocaleString()}.` : ' No successful sync this session.'}
            </span>
            <button type="button" onClick={() => void refreshDeptData()} style={{ background: 'transparent', border: '1px solid rgba(245,158,11,0.5)', borderRadius: '6px', color: '#FCD34D', padding: '5px 10px', cursor: 'pointer', fontWeight: 700 }}>
              Retry
            </button>
          </div>
        )}

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
              {isEventCoord ? 'Event Access:' : 'Operational Scope:'}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setEventScope('assigned')}
                className={`admin-btn ${eventScope === 'assigned' ? 'admin-btn-emerald' : 'admin-btn-ghost'}`}
                style={{ padding: '6px 14px', fontSize: '0.78rem' }}
              >
                <span>{isEventCoord ? '🎯 My Assigned Events' : '🎯 Assigned to Me'} ({assignedEventsList.length})</span>
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
                  <span>🏢 All {scopeDisplayName} Events ({events.length})</span>
                  <span style={{ fontSize: '0.62rem', background: '#38BDF8', color: '#000', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                    DEPARTMENT COORDINATOR VIEW
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Add New Department Event Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {isDeptChief && (
              <button
                onClick={openCreateStaffForm}
                className="admin-btn admin-btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.82rem', fontWeight: 700 }}
              >
                <UserPlus size={16} />
                <span>Manage Staff ({departmentCoordinatorsList.length})</span>
              </button>
            )}
            {isDeptChief && (
              <button
                onClick={() => {
                  setEventCreateError('');
                  setIsAddEventOpen(true);
                }}
                className="admin-btn admin-btn-emerald"
                style={{ padding: '8px 18px', fontSize: '0.82rem', fontWeight: 700 }}
              >
                <Plus size={16} />
                <span>+ Add Department Event</span>
              </button>
            )}
          </div>
        </div>

        {isEventCoord && visibleEvents.length === 0 && (
          <div className="admin-card" role="status" style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '22px', marginBottom: '24px' }}>
            <AlertCircle size={22} color={eventAccessError ? '#F87171' : '#38BDF8'} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ color: '#FFFFFF', margin: '0 0 6px', fontSize: '1rem' }}>
                {eventAccessError ? 'Assigned event access could not be refreshed' : 'No events assigned to this account'}
              </h3>
              <p style={{ color: '#A8B3C2', margin: 0, fontSize: '0.84rem', lineHeight: 1.5 }}>
                {eventAccessError || 'This portal shows analytics and check-in data only for explicitly assigned events. Ask an administrator to assign an event to this account.'}
              </p>
            </div>
          </div>
        )}

        {/* 4 Stat KPI Cards */}
        {(!isEventCoord || visibleEvents.length > 0) && (
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
                  width: '100%',
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
                  ₹{sumVerifiedRegistrationRevenue(scopedRegistrations).toLocaleString()}
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

          {/* Card 3: Registrations */}
          <div className="admin-kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Registrations
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginTop: '4px' }}>
                  {scopedRegistrations.length}
                </div>
              </div>
              <div className="admin-kpi-icon-pod">
                <Layers size={22} color="#CBD5E1" />
              </div>
            </div>
            <div className="admin-progress-track">
              <div
                className="admin-progress-fill"
                style={{ width: '100%', background: 'linear-gradient(90deg, #6366F1, #818CF8)' }}
              />
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '8px' }}>
              Across {visibleEvents.length} events
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
        )}

        {/* Active Module Canvas */}

        {activeTab === 'security' && (
          <div style={{ maxWidth: '720px' }}>
            <div style={{ marginBottom: '18px' }}>
              <h3 className="font-title" style={{ fontSize: '1.2rem', color: '#FFFFFF', margin: 0 }}>
                Security & Access
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#A8B3C2', margin: '5px 0 0' }}>
                Change the password for {adminUser.email}. Your current password is verified securely by Firebase Authentication.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="admin-card" style={{ padding: '22px', display: 'grid', gap: '16px' }}>
              <label style={{ display: 'grid', gap: '7px', color: '#CBD5E1', fontSize: '0.8rem', fontWeight: 700 }}>
                Current password
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={passwordCurrent}
                  onChange={e => setPasswordCurrent(e.target.value)}
                  className="admin-input"
                  placeholder="Enter your current password"
                />
              </label>
              <label style={{ display: 'grid', gap: '7px', color: '#CBD5E1', fontSize: '0.8rem', fontWeight: 700 }}>
                New password
                <input
                  type="password"
                  required
                  minLength={12}
                  autoComplete="new-password"
                  value={passwordNext}
                  onChange={e => setPasswordNext(e.target.value)}
                  className="admin-input"
                  placeholder="At least 12 characters"
                />
              </label>
              <label style={{ display: 'grid', gap: '7px', color: '#CBD5E1', fontSize: '0.8rem', fontWeight: 700 }}>
                Confirm new password
                <input
                  type="password"
                  required
                  minLength={12}
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  className="admin-input"
                  placeholder="Repeat the new password"
                />
              </label>

              {passwordMessage && (
                <div
                  role="alert"
                  style={{
                    padding: '11px 13px',
                    borderRadius: '9px',
                    color: passwordMessage.type === 'success' ? '#6EE7B7' : '#FCA5A5',
                    background: passwordMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    border: `1px solid ${passwordMessage.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                    fontSize: '0.8rem'
                  }}
                >
                  {passwordMessage.text}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-cyber-primary" disabled={passwordSaving} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <KeyRound size={15} />
                  {passwordSaving ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 1: EVENTS MANAGEMENT */}
        {!isEventCoord && activeTab === 'events' && (
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
                    onClick={() => {
                      setEventCreateError('');
                      setIsAddEventOpen(true);
                    }}
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
                    <span>+ Add Department Event</span>
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
                {isDeptChief && (
                  <button
                    onClick={() => setEventScope('all')}
                    className="btn-cyber-primary"
                    style={{ padding: '8px 20px', fontSize: '0.82rem' }}
                  >
                    Switch to View All {scopeDisplayName} Events
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
                {visibleEvents.map(event => {
                  const eventRegs = registrations.filter(r => r.eventId === event.id);
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

                        <div style={{ marginBottom: '12px', fontSize: '0.78rem', color: '#34D399', fontWeight: 700 }}>
                          {eventRegs.length} registrations
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
                          <button
                            onClick={() => setEditingEvent(event)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(220, 227, 229, 0.2)',
                              borderRadius: '6px',
                              padding: '6px 12px',
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
                            <span>Edit Event</span>
                          </button>
                          {isDeptChief && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteDepartmentEvent(event)}
                              disabled={deletingEventId === event.id}
                              aria-label={`Permanently delete ${event.title}`}
                              title="Permanently delete event"
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                color: '#FCA5A5',
                                cursor: deletingEventId === event.id ? 'not-allowed' : 'pointer',
                                opacity: deletingEventId === event.id ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Trash2 size={13} />
                              <span>{deletingEventId === event.id ? 'Deleting…' : 'Delete'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <section className="admin-card" style={{ padding: '22px', marginTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div>
                  <h3 className="font-title" style={{ display: 'flex', alignItems: 'center', gap: '9px', color: '#FFFFFF', fontSize: '1.1rem', margin: 0 }}>
                    <Users size={19} color="#38BDF8" />
                    Event Coordinators ({departmentCoordinatorsList.length})
                  </h3>
                  <p style={{ color: '#94A3B8', fontSize: '0.78rem', margin: '5px 0 0' }}>
                    Coordinators assigned to events in your {scopeDisplayName} scope.
                  </p>
                </div>
                {isDeptChief && (
                  <button
                    type="button"
                    onClick={openCreateStaffForm}
                    className="admin-btn admin-btn-primary"
                    style={{ padding: '8px 14px', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    <UserPlus size={15} />
                    Manage Event Coordinators
                  </button>
                )}
              </div>

              {departmentCoordinatorsList.length === 0 ? (
                <div style={{ padding: '18px', border: '1px dashed rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#94A3B8', fontSize: '0.82rem' }}>
                  No event coordinators are currently assigned to events in this scope.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  {departmentCoordinatorsList.map(coordinator => (
                    <article key={coordinator.id} style={{ background: 'rgba(16, 26, 53, 0.8)', border: '1px solid rgba(56, 189, 248, 0.18)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ color: '#FFFFFF', fontSize: '0.96rem', margin: 0, overflowWrap: 'anywhere' }}>{coordinator.fullName}</h4>
                          <p style={{ color: '#A8B3C2', fontSize: '0.74rem', margin: '4px 0 0' }}>{coordinator.designation || 'Event Coordinator'}</p>
                        </div>
                        <span style={{ flexShrink: 0, color: '#38BDF8', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.22)', padding: '3px 7px', borderRadius: '999px', fontSize: '0.66rem', fontWeight: 800 }}>
                          EVENT COORDINATOR
                        </span>
                      </div>

                      <div style={{ display: 'grid', gap: '6px', color: '#CBD5E1', fontSize: '0.76rem', overflowWrap: 'anywhere' }}>
                        <a href={`mailto:${coordinator.email}`} style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#CBD5E1', textDecoration: 'none' }}>
                          <Mail size={14} color="#789593" /> {coordinator.email}
                        </a>
                        {coordinator.phone && (
                          <a href={`tel:${coordinator.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#CBD5E1', textDecoration: 'none' }}>
                            <Phone size={14} color="#789593" /> {coordinator.phone}
                          </a>
                        )}
                      </div>

                      <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.14)', marginTop: '12px', paddingTop: '11px' }}>
                        <div style={{ color: '#94A3B8', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '7px' }}>
                          Assigned Events
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {coordinator.assignedEventDetails.map(event => (
                            <span key={event.id} style={{ maxWidth: '100%', color: '#A7F3D0', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '4px 8px', borderRadius: '7px', fontSize: '0.72rem', overflowWrap: 'anywhere' }}>
                              {event.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB: DEPARTMENT-SCOPED REVENUE ANALYSIS */}
        {activeTab === 'revenue' && (!isEventCoord || visibleEvents.length > 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header & Export Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                padding: '22px 26px',
                background: 'linear-gradient(135deg, rgba(20, 31, 62, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#38BDF8',
                      background: 'rgba(56, 189, 248, 0.12)',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      border: '1px solid rgba(56, 189, 248, 0.25)'
                    }}
                  >
                    {isEventCoord ? 'ASSIGNED EVENTS SCOPE' : `${deptCode} DEPARTMENT SCOPE`} • STRICTLY CONFIDENTIAL
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>• Financial Ledger</span>
                </div>
                <h2
                  className="font-title"
                  style={{
                    fontSize: '1.45rem',
                    color: '#FFFFFF',
                    margin: 0,
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <TrendingUp size={24} color="#34D399" />
                  <span>{isEventCoord ? `${analyticsScopeName} Analytics` : `${analyticsScopeName} Revenue Analysis`}</span>
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '4px 0 0', maxWidth: '780px' }}>
                  {isEventCoord
                    ? `Real-time registrations, collections, and gateway attendance for ${analyticsScopeName.toLowerCase()}.`
                    : `Real-time collections ledger, payment reconciliations, and registrations strictly restricted to ${analyticsScopeName}.`}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleExportDeptRevenueCSV}
                  className="admin-btn admin-btn-emerald"
                  style={{ padding: '9px 18px', fontSize: '0.84rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={16} />
                  <span>{isEventCoord ? 'Export Event Analytics (CSV)' : `Export ${deptCode} Revenue (CSV)`}</span>
                </button>
              </div>
            </div>

            {/* Department 4 Financial KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Card 1: Verified Revenue */}
              <div
                style={{
                  background: 'rgba(16, 26, 53, 0.85)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.08)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {isEventCoord ? 'Verified Collections' : `${deptCode} Verified Collections`}
                    </span>
                    <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#FFFFFF', marginTop: '4px', letterSpacing: '-0.02em' }}>
                      ₹{deptRevenueAnalytics.totalVerified.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'rgba(52, 211, 153, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(52, 211, 153, 0.3)'
                    }}
                  >
                    <IndianRupee size={22} color="#34D399" />
                  </div>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                  <span style={{ color: '#34D399', fontWeight: 700 }}>{deptRevenueAnalytics.verifiedCount} registrations</span> bank approved
                </div>
              </div>

              {/* Card 2: Pending Pipeline */}
              <div
                style={{
                  background: 'rgba(16, 26, 53, 0.85)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 20px rgba(251, 191, 36, 0.08)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Pending Central Review
                    </span>
                    <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#FFFFFF', marginTop: '4px', letterSpacing: '-0.02em' }}>
                      ₹{deptRevenueAnalytics.totalPending.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'rgba(251, 191, 36, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(251, 191, 36, 0.3)'
                    }}
                  >
                    <Clock size={22} color="#FBBF24" />
                  </div>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                  <span style={{ color: '#FBBF24', fontWeight: 700 }}>{deptRevenueAnalytics.pendingCount} registrations</span> awaiting payment clearance
                </div>
              </div>

              {/* Card 3: Total Potential Gross */}
              <div
                style={{
                  background: 'rgba(16, 26, 53, 0.85)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 20px rgba(56, 189, 248, 0.08)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {isEventCoord ? 'Potential Gross' : `${deptCode} Potential Gross`}
                    </span>
                    <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#FFFFFF', marginTop: '4px', letterSpacing: '-0.02em' }}>
                      ₹{deptRevenueAnalytics.totalGross.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(56, 189, 248, 0.3)'
                    }}
                  >
                    <TrendingUp size={22} color="#38BDF8" />
                  </div>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                  Average <span style={{ color: '#38BDF8', fontWeight: 700 }}>₹{deptRevenueAnalytics.avgPerDelegate}</span> per verified delegate
                </div>
              </div>

              {/* Card 4: Registrations */}
              <div
                style={{
                  background: 'rgba(16, 26, 53, 0.85)',
                  border: '1px solid rgba(192, 132, 252, 0.3)',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 20px rgba(192, 132, 252, 0.08)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#C084FC', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Verified Registrations
                    </span>
                    <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#FFFFFF', marginTop: '4px', letterSpacing: '-0.02em' }}>
                      {deptRevenueAnalytics.verifiedCount}
                    </div>
                  </div>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'rgba(192, 132, 252, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(192, 132, 252, 0.3)'
                    }}
                  >
                    <Layers size={22} color="#C084FC" />
                  </div>
                </div>
                <div className="admin-progress-track" style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', margin: '8px 0 6px' }}>
                  <div
                    className="admin-progress-fill"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(90deg, #9333EA, #C084FC)',
                      height: '100%',
                      borderRadius: '3px'
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  ₹{deptRevenueAnalytics.totalVerified.toLocaleString('en-IN')} collected from verified registrations
                </div>
              </div>
            </div>

            {/* Department Event-Wise Revenue Breakdown */}
            <div
              style={{
                background: 'rgba(20, 31, 62, 0.85)',
                border: '1px solid rgba(220, 227, 229, 0.18)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={18} color="#38BDF8" />
                    <h3 className="font-title" style={{ fontSize: '1.15rem', color: '#FFFFFF', margin: 0, fontWeight: 700 }}>
                      {isEventCoord
                        ? `Assigned Event Breakdown (${deptRevenueAnalytics.eventBreakdown.length})`
                        : `${deptCode} Event-Wise Revenue Breakdown (${deptRevenueAnalytics.eventBreakdown.length} Arenas)`}
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '4px 0 0' }}>
                    {isEventCoord
                      ? 'Financial reconciliation and registration performance for each event assigned to this coordinator.'
                      : `Financial reconciliation and registration performance for each arena hosted by ${deptCode}.`}
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(220, 227, 229, 0.12)', fontSize: '0.74rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <th style={{ padding: '12px 14px' }}>Event Arena</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Category</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Ticket Fee</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Registrations</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Verified (₹)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Pending (₹)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total Gross (₹)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right', minWidth: '150px' }}>Seat Fill Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptRevenueAnalytics.eventBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                          {isEventCoord ? 'No assigned event data is available yet.' : 'No events registered under this department yet.'}
                        </td>
                      </tr>
                    ) : (
                      deptRevenueAnalytics.eventBreakdown.map(item => (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: '1px solid rgba(220, 227, 229, 0.08)',
                            fontSize: '0.84rem',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '14px 14px' }}>
                            <div style={{ color: '#FFFFFF', fontWeight: 700 }}>{item.title}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{item.totalRegs} registrations</div>
                          </td>
                          <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                color: '#38BDF8',
                                background: 'rgba(56, 189, 248, 0.12)',
                                padding: '3px 7px',
                                borderRadius: '4px'
                              }}
                            >
                              {item.category}
                            </span>
                          </td>
                          <td style={{ padding: '14px 14px', textAlign: 'right', color: '#DCE3E5', fontWeight: 600 }}>
                            ₹{item.fee}
                          </td>
                          <td style={{ padding: '14px 14px', textAlign: 'center', color: '#FFFFFF', fontWeight: 700 }}>
                            {item.totalRegs}
                          </td>
                          <td style={{ padding: '14px 14px', textAlign: 'right', color: '#34D399', fontWeight: 800 }}>
                            ₹{item.verifiedRev.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '14px 14px', textAlign: 'right', color: '#FBBF24', fontWeight: 600 }}>
                            ₹{item.pendingRev.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '14px 14px', textAlign: 'right', color: '#FFFFFF', fontWeight: 700 }}>
                            ₹{item.grossRev.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '14px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                              <div style={{ width: '70px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    width: `${Math.min(100, item.fillRate)}%`,
                                    height: '100%',
                                    background: item.fillRate >= 90 ? '#F43F5E' : 'linear-gradient(90deg, #38BDF8, #34D399)',
                                    borderRadius: '3px'
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '0.74rem', color: '#38BDF8', fontWeight: 700, minWidth: '35px' }}>
                                {item.fillRate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Two-Column Grid: Channel Breakdown & Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
              {/* Payment Channel Collections */}
              <div
                style={{
                  background: 'rgba(20, 31, 62, 0.85)',
                  border: '1px solid rgba(220, 227, 229, 0.18)',
                  borderRadius: '16px',
                  padding: '24px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <TrendingUp size={18} color="#38BDF8" />
                  <h3 className="font-title" style={{ fontSize: '1.08rem', color: '#FFFFFF', margin: 0 }}>
                    {isEventCoord ? 'Assigned Event Collections by Channel' : `${deptCode} Collections by Channel`}
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Online Channel */}
                  <div
                    style={{
                      padding: '14px 16px',
                      background: 'rgba(16, 26, 53, 0.9)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>Online Delegate Portal</div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                        {deptRevenueAnalytics.onlineCount} registrations • Razorpay / Direct UPI QR
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38BDF8' }}>
                        ₹{deptRevenueAnalytics.onlineVerified.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#34D399', fontWeight: 700 }}>
                        {deptRevenueAnalytics.totalVerified > 0 ? ((deptRevenueAnalytics.onlineVerified / deptRevenueAnalytics.totalVerified) * 100).toFixed(1) : 0}% of settled
                      </div>
                    </div>
                  </div>

                  {/* Spot Desk Channel */}
                  <div
                    style={{
                      padding: '14px 16px',
                      background: 'rgba(16, 26, 53, 0.9)',
                      border: '1px solid rgba(52, 211, 153, 0.2)',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>{isEventCoord ? 'Event Spot Desk' : 'Department Spot Desk'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                        {deptRevenueAnalytics.spotCount} registrations • On-campus walk-in delegates
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34D399' }}>
                        ₹{deptRevenueAnalytics.spotVerified.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#34D399', fontWeight: 700 }}>
                        {deptRevenueAnalytics.totalVerified > 0 ? ((deptRevenueAnalytics.spotVerified / deptRevenueAnalytics.totalVerified) * 100).toFixed(1) : 0}% of settled
                      </div>
                    </div>
                  </div>

                  {/* Rejected Transactions */}
                  <div
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(244, 63, 94, 0.08)',
                      border: '1px solid rgba(244, 63, 94, 0.25)',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F43F5E' }}>Rejected Claims</div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                        {deptRevenueAnalytics.rejectedCount} fraudulent or failed submissions rejected
                      </div>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F43F5E' }}>
                      ₹{deptRevenueAnalytics.totalRejected.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Department Financial Summary Card */}
              <div
                style={{
                  background: 'rgba(20, 31, 62, 0.85)',
                  border: '1px solid rgba(220, 227, 229, 0.18)',
                  borderRadius: '16px',
                  padding: '24px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <ShieldCheck size={18} color="#34D399" />
                  <h3 className="font-title" style={{ fontSize: '1.08rem', color: '#FFFFFF', margin: 0 }}>
                    {isEventCoord ? 'Event Financial Security & Compliance' : `${deptCode} Financial Security & Compliance`}
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem', color: '#94A3B8' }}>
                  <div style={{ padding: '12px 14px', background: 'rgba(16, 26, 53, 0.9)', borderRadius: '10px', border: '1px solid rgba(220, 227, 229, 0.1)' }}>
                    <div style={{ color: '#FFFFFF', fontWeight: 700, marginBottom: '2px' }}>{isEventCoord ? 'Assigned Event Access' : 'Strict Department Privacy Boundary'}</div>
                    <div>{isEventCoord
                      ? 'This view contains registration and payment data only for events explicitly assigned to your coordinator account.'
                      : `This view is strictly scoped to ${deptCode}. Other departments' financial ledgers and overall fest totals are inaccessible to maintain audit confidentiality.`}</div>
                  </div>

                  <div style={{ padding: '12px 14px', background: 'rgba(16, 26, 53, 0.9)', borderRadius: '10px', border: '1px solid rgba(220, 227, 229, 0.1)' }}>
                    <div style={{ color: '#FFFFFF', fontWeight: 700, marginBottom: '2px' }}>Payment Clearance Workflow</div>
                    <div>{isEventCoord
                      ? 'Online payment verification is managed by Central Finance. Approved payments appear in the ledger for your assigned events.'
                      : 'Verification of online UPI transactions is authorized by Central Finance & Dean SAC. Once approved, funds reflect instantly as Verified in your departmental ledger.'}</div>
                  </div>

                  <div style={{ padding: '12px 14px', background: 'rgba(16, 26, 53, 0.9)', borderRadius: '10px', border: '1px solid rgba(220, 227, 229, 0.1)' }}>
                    <div style={{ color: '#FFFFFF', fontWeight: 700, marginBottom: '2px' }}>Spot Desk Reconciliation</div>
                    <div>Spot entries registered at your desk with cash or UPI are marked instant-verified and logged with coordinator timestamp for same-day accounts settlement.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filterable Registration Audit Ledger */}
            <div
              style={{
                background: 'rgba(20, 31, 62, 0.85)',
                border: '1px solid rgba(220, 227, 229, 0.18)',
                borderRadius: '16px',
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h3 className="font-title" style={{ fontSize: '1.12rem', color: '#FFFFFF', margin: 0, fontWeight: 700 }}>
                    {isEventCoord ? 'Assigned Event Registration Ledger' : `${deptCode} Registration Ledger`} ({filteredDeptRevenueGroups.length})
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '3px 0 0' }}>
                    {isEventCoord
                      ? 'Each registered team appears once. Open View team for its full roster; individual passes remain listed separately.'
                      : `Registered teams appear once in this ${deptCode}-only view. Open View team to see each member and their pass status.`}
                  </p>
                </div>

                {/* Filter Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Search Bar */}
                  <div style={{ position: 'relative', width: '220px' }}>
                    <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="Search participant / UTR..."
                      value={deptRevenueSearch}
                      onChange={e => setDeptRevenueSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 10px 7px 30px',
                        borderRadius: '8px',
                        background: 'rgba(16, 26, 53, 0.9)',
                        border: '1px solid rgba(220, 227, 229, 0.2)',
                        color: '#FFFFFF',
                        fontSize: '0.78rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Event Filter */}
                  <select
                    value={deptRevenueEventFilter}
                    onChange={e => setDeptRevenueEventFilter(e.target.value)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      background: 'rgba(16, 26, 53, 0.9)',
                      border: '1px solid rgba(220, 227, 229, 0.2)',
                      color: '#FFFFFF',
                      fontSize: '0.78rem',
                      maxWidth: '180px'
                    }}
                  >
                    <option value="all">All {scopeDisplayName}</option>
                    {visibleEvents.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>

                  {/* Payment Status Filter */}
                  <select
                    value={deptRevenueStatusFilter}
                    onChange={e => setDeptRevenueStatusFilter(e.target.value as any)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      background: 'rgba(16, 26, 53, 0.9)',
                      border: '1px solid rgba(220, 227, 229, 0.2)',
                      color: '#FFFFFF',
                      fontSize: '0.78rem'
                    }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="verified">Verified Only</option>
                    <option value="verification_pending">Pending Only</option>
                    <option value="rejected">Rejected Only</option>
                  </select>

                  {(deptRevenueEventFilter !== 'all' || deptRevenueStatusFilter !== 'all' || deptRevenueSearch) && (
                    <button
                      onClick={() => {
                        setDeptRevenueEventFilter('all');
                        setDeptRevenueStatusFilter('all');
                        setDeptRevenueSearch('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#38BDF8',
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Team-aware registration ledger */}
              <div style={{ overflowX: 'auto', maxHeight: '480px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1080px' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#101B35', zIndex: 2 }}>
                    <tr style={{ borderBottom: '1px solid rgba(220, 227, 229, 0.16)', fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <th style={{ padding: '10px 12px' }}>Registration / Team</th>
                      <th style={{ padding: '10px 12px' }}>Participant / Squad</th>
                      <th style={{ padding: '10px 12px' }}>Roll / Members</th>
                      <th style={{ padding: '10px 12px' }}>Event Arena</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Fee</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Channel</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Txn / UTR ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeptRevenueGroups.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                          No registration records match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredDeptRevenueGroups.slice(0, 50).map(group => {
                        const r = group.representative;
                        const groupFee = sumRegistrationRevenueForRows(group.registrations);
                        const transactionId = group.registrations.find(row => row.transactionId || row.razorpayPaymentId)?.transactionId ||
                          group.registrations.find(row => row.razorpayPaymentId)?.razorpayPaymentId;
                        const statuses = group.paymentStatus.toLowerCase();
                        const verified = statuses === 'verified';
                        const rejected = statuses === 'rejected';
                        const statusLabel = statuses === 'verification_pending' ? 'Pending' : statuses === 'not_applicable' ? 'No payment' : statuses.replaceAll('_', ' ');
                        return (
                        <tr
                          key={group.key}
                          style={{
                            borderBottom: '1px solid rgba(220, 227, 229, 0.07)',
                            fontSize: '0.8rem',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '12px 12px', fontFamily: 'monospace', color: '#38BDF8', fontWeight: 600 }}>
                            <div>{group.displayId}</div>
                            <div style={{ marginTop: '3px', color: '#94A3B8', fontSize: '0.68rem', fontWeight: 500 }}>
                              {group.isTeam ? `${group.members.length} members · ${group.registrations.length} passes` : r.id}
                            </div>
                          </td>
                          <td style={{ padding: '12px 12px' }}>
                            <div style={{ color: '#FFFFFF', fontWeight: 700 }}>{group.isTeam ? (group.teamName || 'Registered team') : (r.leaderName || 'Individual Delegate')}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '3px' }}>
                              {group.isTeam ? `Contact: ${r.leaderName || 'Team lead'}${r.leaderEmail ? ` · ${r.leaderEmail}` : ''}${r.leaderPhone ? ` · ${r.leaderPhone}` : ''}` : (r.leaderRoll || r.leaderEmail)}
                            </div>
                          </td>
                          <td style={{ padding: '12px 12px', minWidth: '165px' }}>
                            {group.isTeam ? <>
                              <div style={{ color: '#FFFFFF', fontWeight: 700 }}>{group.members.length} delegates</div>
                              <div style={{ color: '#94A3B8', fontSize: '0.68rem', lineHeight: 1.45, marginTop: '3px' }}>
                                {group.members.slice(0, 3).map(member => member.rollNumber || member.name).join(', ')}{group.members.length > 3 ? '…' : ''}
                              </div>
                              <button type="button" onClick={() => setSelectedLedgerTeam(group)} style={{ marginTop: '6px', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '7px', background: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8', padding: '4px 9px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>
                                View team
                              </button>
                            </> : <div style={{ color: '#CBD5E1', fontFamily: 'monospace', fontSize: '0.74rem' }}>{r.leaderRoll || r.buyerRoll || 'Roll unavailable'}</div>}
                          </td>
                          <td style={{ padding: '12px 12px', color: '#DCE3E5' }}>
                            {r.eventTitle}
                          </td>
                          <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 800, color: '#FFFFFF' }}>
                            ₹{groupFee.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: r.source === 'spot' ? '#FBBF24' : '#38BDF8',
                                textTransform: 'uppercase'
                              }}
                            >
                              {r.source === 'spot' ? 'Spot' : 'Online'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background:
                                  verified
                                    ? 'rgba(52, 211, 153, 0.15)'
                                    : rejected
                                    ? 'rgba(244, 63, 94, 0.15)'
                                    : 'rgba(251, 191, 36, 0.15)',
                                color:
                                  verified
                                    ? '#34D399'
                                    : rejected
                                    ? '#F43F5E'
                                    : '#FBBF24',
                                border: `1px solid ${
                                  verified
                                    ? 'rgba(52, 211, 153, 0.3)'
                                    : rejected
                                    ? 'rgba(244, 63, 94, 0.3)'
                                    : 'rgba(251, 191, 36, 0.3)'
                                }`
                              }}
                            >
                              {statusLabel.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '12px 12px', fontFamily: 'monospace', fontSize: '0.74rem', color: '#94A3B8' }}>
                            {transactionId || (r.paymentScreenshotUrl ? 'Proof Attached' : '—')}
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {filteredDeptRevenueGroups.length > 50 && (
                <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.76rem', color: '#94A3B8' }}>
                  Showing first 50 of {filteredDeptRevenueGroups.length} teams and individual entries. Export CSV for full registration records.
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'checkin' && (!isEventCoord || visibleEvents.length > 0) && (
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
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
                  {isEventCoord ? 'Assigned Event Gate Check-In & Attendance' : `${deptCode} Fast Gate Check-In & Attendance Desk`}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#A8B3C2', margin: 0 }}>
                  {isEventCoord
                    ? 'Scan passes or search attendee IDs for your assigned events only.'
                    : 'Select a specific event below or check in across all department arenas via QR scan or student Roll No'}
                </p>
              </div>

              {/* Specific Events Dropdown Selector */}
              <div style={{ marginBottom: '22px', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#38BDF8', marginBottom: '8px', letterSpacing: '0.04em' }}>
                  🎯 SELECT SPECIFIC EVENT FOR ATTENDANCE CHECK-IN:
                </label>
                <select
                  value={checkInEventFilter}
                  onChange={e => {
                    setCheckInEventFilter(e.target.value);
                    setCheckInResult(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: '#101A35',
                    border: '1px solid rgba(56, 189, 248, 0.5)',
                    color: '#FFFFFF',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    boxShadow: '0 0 16px rgba(56, 189, 248, 0.12)'
                  }}
                >
                  <option value="all">{isEventCoord ? '🎯 All assigned events' : `🏢 All ${scopeDisplayName} Events`} ({visibleEvents.length})</option>
                  {visibleEvents.map(event => {
                    const eventRegsCount = scopedRegistrations.filter(r => r.eventId === event.id).length;
                    return (
                      <option key={event.id} value={event.id}>
                        🎯 {event.title} • {event.date} ({eventRegsCount} registered)
                      </option>
                    );
                  })}
                </select>

                {checkInEventFilter !== 'all' && (
                  <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={13} color="#6EE7B7" />
                    <span>Currently Filtered for: <strong>{visibleEvents.find(e => e.id === checkInEventFilter)?.title}</strong></span>
                  </div>
                )}
              </div>

              {checkInScannerOpen ? (
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '14px', background: '#020617', minHeight: '280px', marginBottom: '16px', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
                  <video ref={checkInVideoRef} muted playsInline style={{ width: '100%', minHeight: '280px', maxHeight: '360px', display: 'block', objectFit: 'cover' }} />
                  {/* Targeting Reticle */}
                  <div style={{ position: 'absolute', inset: '16% 16%', border: '2px solid #38BDF8', borderRadius: '16px', boxShadow: '0 0 0 999px rgba(2, 6, 23, 0.45)', pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px', textAlign: 'center', color: '#FFFFFF', fontSize: '0.74rem', background: 'rgba(2,6,23,0.75)', padding: '6px 12px', borderRadius: '8px', pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
                    🎯 Point camera at Pass QR code • Auto-scanning active
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckInScannerOpen(false)}
                    style={{ position: 'absolute', right: '12px', top: '12px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(2,6,23,0.85)', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', zIndex: 10 }}
                  >
                    <StopCircle size={15} color="#F43F5E" />
                    <span>Stop Camera</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => { setCheckInScannerError(''); setCheckInScannerOpen(true); }}
                    className="admin-btn admin-btn-emerald"
                    style={{ flex: 1, minWidth: '220px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', fontSize: '0.84rem', fontWeight: 700 }}
                  >
                    <Camera size={17} />
                    <span>Open Live Camera QR Scanner</span>
                  </button>

                  <label
                    className="admin-btn admin-btn-ghost"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 18px', cursor: 'pointer', border: '1px solid rgba(56, 189, 248, 0.35)', color: '#38BDF8', fontSize: '0.82rem', fontWeight: 600 }}
                    title="Upload student pass screenshot or photo"
                  >
                    <Upload size={16} />
                    <span>Scan from Pass Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScanImageFile}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              )}
              {checkInScannerError && <div style={{ marginBottom: '14px', color: '#FCA5A5', fontSize: '0.76rem' }}>{checkInScannerError}</div>}

              <form onSubmit={handleCheckInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <input
                    type="text"
                    value={checkInInput}
                    onChange={e => setCheckInInput(e.target.value)}
                    placeholder="Enter Student Roll No (e.g. 22VCECS104) or Reg ID / Token"
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

            {/* Live Attendance Rate Breakdown Widget for Selected Event */}
            <div
              style={{
                background: 'rgba(20, 31, 62, 0.85)',
                border: '1px solid rgba(220, 227, 229, 0.18)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                  {checkInEventFilter === 'all'
                    ? (isEventCoord ? 'Live Attendance · Assigned Events' : `Live Attendance (${deptCode} Department Total)`)
                    : `Live Attendance for "${visibleEvents.find(e => e.id === checkInEventFilter)?.title || 'Event'}"`}
                </h4>
                {checkInRegistrations.length > 0 && (
                  <span style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 700 }}>
                    {Math.round((checkInRegistrations.filter(r => r.checkedIn).length / checkInRegistrations.length) * 100)}% Turnout Rate
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#A8B3C2' }}>TOTAL ENROLLED</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                    {checkInRegistrations.length}
                  </div>
                </div>
                <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#34D399' }}>VENUE CHECKED-IN</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34D399', marginTop: '4px' }}>
                    {checkInRegistrations.filter(r => r.checkedIn).length}
                  </div>
                </div>
                <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#FBBF24' }}>PENDING ARRIVAL</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FBBF24', marginTop: '4px' }}>
                    {checkInRegistrations.filter(r => !r.checkedIn).length}
                  </div>
                </div>
              </div>
            </div>

            {/* Event Attendees Roster & 1-Click Check-In Table */}
            <div
              style={{
                background: 'rgba(20, 31, 62, 0.85)',
                border: '1px solid rgba(220, 227, 229, 0.18)',
                borderRadius: '16px',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                    {checkInEventFilter === 'all' ? 'All Enrolled Attendees' : `Attendees: ${visibleEvents.find(e => e.id === checkInEventFilter)?.title}`}
                  </h4>
                  <div style={{ fontSize: '0.74rem', color: '#A8B3C2', marginTop: '2px' }}>
                    Showing {filteredCheckInAttendees.length} entries (squads count once) • Click "Check In" to mark attendance directly
                  </div>
                </div>

                {/* Attendee Search */}
                <div style={{ position: 'relative', minWidth: '260px' }}>
                  <Search size={14} color="#789593" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                  <input
                    type="text"
                    placeholder="Search by student name, roll number, or reg ID..."
                    value={checkInAttendeeSearch}
                    onChange={e => setCheckInAttendeeSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 34px',
                      borderRadius: '8px',
                      background: 'rgba(16, 26, 53, 0.95)',
                      border: '1px solid rgba(220, 227, 229, 0.2)',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(220, 227, 229, 0.15)', background: 'rgba(16, 26, 53, 0.6)', color: '#A8B3C2' }}>
                      <th style={{ padding: '10px 14px' }}>Entry ID</th>
                      <th style={{ padding: '10px 14px' }}>Participant / Squad</th>
                      <th style={{ padding: '10px 14px' }}>Roll / Members</th>
                      <th style={{ padding: '10px 14px' }}>Event</th>
                      <th style={{ padding: '10px 14px' }}>Attendance Status</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCheckInAttendees.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#A8B3C2' }}>
                          No registered delegates found for this event matching your query.
                        </td>
                      </tr>
                    ) : (
                      filteredCheckInAttendees.map(group => {
                        const r = group.representative;
                        const checkedIn = group.allCheckedIn;
                        return (
                        <tr
                          key={group.key}
                          style={{
                            borderBottom: '1px solid rgba(220, 227, 229, 0.08)',
                            background: checkedIn ? 'rgba(52, 211, 153, 0.04)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#DCE3E5' }}>
                            {group.displayId}
                            {group.isTeam && <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{group.memberCount} members</div>}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#FFFFFF' }}>
                            {group.isTeam ? group.teamName || 'Team' : r.leaderName}
                            {group.isTeam && <div style={{ fontSize: '0.68rem', color: '#A8B3C2' }}>Contact: {r.leaderName}</div>}
                          </td>
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#38BDF8' }}>
                            {group.isTeam
                              ? group.members.slice(0, 3).map(member => member.rollNumber || member.name).join(', ') + (group.members.length > 3 ? '…' : '')
                              : r.leaderRoll || r.buyerRoll || '—'}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#CBD5E1', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.eventTitle}>
                            {r.eventTitle}
                            {group.isTeam && <div style={{ fontSize: '0.68rem', color: '#BACEBB' }}>Squad {group.teamCode}</div>}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {checkedIn ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(52, 211, 153, 0.15)', color: '#34D399', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                                <CheckCircle2 size={11} /> CHECKED IN
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24', border: '1px solid rgba(251, 191, 36, 0.4)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                                <Clock size={11} /> {group.anyCheckedIn ? 'PARTIAL' : 'PENDING'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                            {checkedIn ? (
                              <span style={{ fontSize: '0.72rem', color: '#A8B3C2' }}>Checked in</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleQuickCheckInGroupFromRoster(group)}
                                style={{
                                  background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '5px 12px',
                                  color: '#04120D',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <CheckCircle2 size={12} />
                                <span>{group.anyCheckedIn ? 'Check All' : 'Check In'}</span>
                              </button>
                            )}
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Department-scoped operations staff management */}
      {staffFormOpen && isDeptChief && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px' }}
          onClick={() => !staffSaving && setStaffFormOpen(false)}
        >
          <div
            style={{ width: 'min(720px, 100%)', maxHeight: '92vh', overflowY: 'auto', background: '#101A35', border: '1px solid rgba(96,165,250,0.42)', borderRadius: '14px', padding: '24px', boxShadow: '0 24px 70px rgba(0,0,0,0.65)' }}
            onClick={event => event.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#FFFFFF', fontSize: '1.22rem', fontWeight: 800 }}>{editingStaffId ? 'Edit department staff' : 'Add department staff'}</h3>
                <p style={{ margin: '4px 0 0', color: '#A8B3C2', fontSize: '0.78rem' }}>Department locked to {deptCode}. The server will reject cross-department assignments.</p>
              </div>
              <button type="button" onClick={() => !staffSaving && setStaffFormOpen(false)} style={{ border: '1px solid rgba(148,163,184,0.35)', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', color: '#CBD5E1', cursor: 'pointer', padding: '7px' }}>
                <XCircle size={18} />
              </button>
            </div>

            {staffError && <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(127,29,29,0.3)', border: '1px solid rgba(248,113,113,0.5)', color: '#FCA5A5', fontSize: '0.8rem' }}>{staffError}</div>}

            <form onSubmit={handleStaffSave} style={{ display: 'grid', gap: '14px' }}>
              {!editingStaffId && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '4px', borderRadius: '10px', background: 'rgba(30, 41, 75, 0.7)', border: '1px solid rgba(96,165,250,0.25)' }}>
                  <button type="button" onClick={() => { setStaffAccountMode('new'); setExistingStaffIdentifier(''); setStaffError(''); }} style={{ border: '1px solid transparent', borderRadius: '7px', padding: '10px 12px', background: staffAccountMode === 'new' ? '#2563EB' : 'transparent', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}>
                    Create new account
                  </button>
                  <button type="button" onClick={() => { setStaffAccountMode('existing'); setStaffError(''); }} style={{ border: '1px solid transparent', borderRadius: '7px', padding: '10px 12px', background: staffAccountMode === 'existing' ? '#0EA5E9' : 'transparent', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}>
                    Assign existing account
                  </button>
                </div>
              )}

              {!editingStaffId && staffAccountMode === 'existing' && (
                <div style={{ padding: '13px 14px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(56,189,248,0.4)' }}>
                  <div style={{ color: '#E0F2FE', fontWeight: 800, fontSize: '0.86rem', marginBottom: '4px' }}>Use an existing Firebase staff account</div>
                  <div style={{ color: '#BAE6FD', fontSize: '0.75rem', lineHeight: 1.45, marginBottom: '10px' }}>Enter the account email or username. No duplicate login is created and the existing password remains unchanged.</div>
                  <label style={{ color: '#CBD5E1', fontSize: '0.78rem' }}>
                    Existing account email or username *
                    <input value={existingStaffIdentifier} onChange={event => setExistingStaffIdentifier(event.target.value)} placeholder="person@example.com or username" required style={{ display: 'block', width: '100%', marginTop: '5px', boxSizing: 'border-box', padding: '10px 11px', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.45)', background: '#0B1020', color: '#FFFFFF' }} />
                  </label>
                </div>
              )}

              {(staffAccountMode === 'new' || Boolean(editingStaffId)) && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ color: '#CBD5E1', fontSize: '0.78rem' }}>
                  Full name *
                  <input value={staffForm.fullName} onChange={event => setStaffForm({ ...staffForm, fullName: event.target.value })} required style={{ display: 'block', width: '100%', marginTop: '5px', boxSizing: 'border-box', padding: '10px 11px', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.35)', background: '#0B1020', color: '#FFFFFF' }} />
                </label>
                <label style={{ color: '#CBD5E1', fontSize: '0.78rem' }}>
                  Username *
                  <input value={staffForm.username} onChange={event => setStaffForm({ ...staffForm, username: event.target.value })} required pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,63}" style={{ display: 'block', width: '100%', marginTop: '5px', boxSizing: 'border-box', padding: '10px 11px', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.35)', background: '#0B1020', color: '#FFFFFF' }} />
                </label>
              </div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ color: '#CBD5E1', fontSize: '0.78rem' }}>
                  Login role *
                  <select value={staffForm.role} onChange={event => setStaffForm({ ...staffForm, role: event.target.value as ManagedStaffRole })} style={{ display: 'block', width: '100%', marginTop: '5px', boxSizing: 'border-box', padding: '10px 11px', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.35)', background: '#0B1020', color: '#FFFFFF' }}>
                    <option value="event_coordinator">Event Coordinator</option>
                  </select>
                </label>
                <label style={{ color: '#CBD5E1', fontSize: '0.78rem' }}>
                  Designation *
                  <input value={staffForm.designation} onChange={event => setStaffForm({ ...staffForm, designation: event.target.value })} required style={{ display: 'block', width: '100%', marginTop: '5px', boxSizing: 'border-box', padding: '10px 11px', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.35)', background: '#0B1020', color: '#FFFFFF' }} />
                </label>
              </div>

              {(staffAccountMode === 'new' || Boolean(editingStaffId)) && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ color: '#CBD5E1', fontSize: '0.78rem' }}>
                  Email *
                  <input type="email" value={staffForm.email} onChange={event => setStaffForm({ ...staffForm, email: event.target.value })} required style={{ display: 'block', width: '100%', marginTop: '5px', boxSizing: 'border-box', padding: '10px 11px', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.35)', background: '#0B1020', color: '#FFFFFF' }} />
                </label>
                <label style={{ color: '#CBD5E1', fontSize: '0.78rem' }}>
                  Phone
                  <input value={staffForm.phone} onChange={event => setStaffForm({ ...staffForm, phone: event.target.value })} style={{ display: 'block', width: '100%', marginTop: '5px', boxSizing: 'border-box', padding: '10px 11px', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.35)', background: '#0B1020', color: '#FFFFFF' }} />
                </label>
              </div>}

              {(staffAccountMode === 'new' || Boolean(editingStaffId)) && <label style={{ color: '#CBD5E1', fontSize: '0.78rem' }}>
                {editingStaffId ? 'New password (optional)' : 'Initial password *'}
                <input type="password" value={staffForm.password} onChange={event => setStaffForm({ ...staffForm, password: event.target.value })} required={!editingStaffId} minLength={12} placeholder={editingStaffId ? 'Leave blank to keep current password' : 'At least 12 characters'} style={{ display: 'block', width: '100%', marginTop: '5px', boxSizing: 'border-box', padding: '10px 11px', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.35)', background: '#0B1020', color: '#FFFFFF' }} />
              </label>}

              <div style={{ border: '1px solid rgba(148,163,184,0.22)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.84rem' }}>Assigned Event Access</div>
                    <div style={{ color: '#94A3B8', fontSize: '0.72rem' }}>Only events belonging to this department are listed.</div>
                  </div>
                  <span style={{ color: '#38BDF8', fontSize: '0.72rem', fontWeight: 700 }}>{staffForm.assignedEvents.length} selected</span>
                </div>
                {events.length > 0 ? (
                  <div style={{ display: 'grid', gap: '7px', maxHeight: '170px', overflowY: 'auto' }}>
                    {events.map(eventItem => (
                      <label key={eventItem.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#CBD5E1', fontSize: '0.78rem' }}>
                        <input type="checkbox" checked={staffForm.assignedEvents.includes(eventItem.id)} onChange={change => setStaffForm({ ...staffForm, assignedEvents: change.target.checked ? [...staffForm.assignedEvents, eventItem.id] : staffForm.assignedEvents.filter(id => id !== eventItem.id) })} />
                        <span>{eventItem.title}</span>
                      </label>
                    ))}
                  </div>
                ) : <div style={{ color: '#FBBF24', fontSize: '0.78rem' }}>Create a department event before assigning event coordinators.</div>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '9px', marginTop: '4px' }}>
                <button type="button" disabled={staffSaving} onClick={() => setStaffFormOpen(false)} style={{ border: '1px solid rgba(148,163,184,0.35)', borderRadius: '8px', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', color: '#CBD5E1', cursor: staffSaving ? 'not-allowed' : 'pointer' }}>Cancel</button>
                <button type="submit" disabled={staffSaving} style={{ border: '1px solid rgba(96,165,250,0.6)', borderRadius: '8px', padding: '10px 16px', background: '#2563EB', color: '#FFFFFF', fontWeight: 800, cursor: staffSaving ? 'wait' : 'pointer', opacity: staffSaving ? 0.7 : 1 }}>{staffSaving ? 'Saving…' : editingStaffId ? 'Save staff changes' : staffAccountMode === 'existing' ? 'Assign existing account' : 'Create staff account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spot Registration Modal (8.1 Create spot registrations on fest day) */}
      {isSpotRegOpen && isDeptChief && (
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
                    placeholder="Optional payment reference"
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
      {isBroadcastOpen && isDeptChief && (
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
                  <option value="department">All {scopeDisplayName} Events & Delegates</option>
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
      {editingEvent && isDeptChief && (
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Event Day</label>
                  <select
                    value={editingEvent.date}
                    onChange={e => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box', colorScheme: 'dark' }}
                  >
                    <option value="">Select event day</option>
                    <option value="Dec 1, 2026">Dec 1 (Day 1)</option>
                    <option value="Dec 2, 2026">Dec 2 (Day 2)</option>
                    <option value="Dec 1-2, 2026">Dec 1 &amp; Dec 2 (Both days)</option>
                    {editingEvent.date && !['Dec 1, 2026', 'Dec 2, 2026', 'Dec 1-2, 2026'].includes(editingEvent.date) && (
                      <option value={editingEvent.date}>Current: {editingEvent.date}</option>
                    )}
                  </select>
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

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>WhatsApp Group Link</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="url" value={editingEvent.whatsappGroupLink || ''} onChange={e => setEditingEvent({ ...editingEvent, whatsappGroupLink: e.target.value })} placeholder="https://chat.whatsapp.com/..." maxLength={2048} style={{ flex: 1, minWidth: 0, padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }} />
                  <button type="button" disabled={!editingEvent.whatsappGroupLink?.trim()} onClick={() => setEditingEvent({ ...editingEvent, whatsappGroupLink: '' })} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(248, 113, 113, 0.45)', background: 'rgba(127, 29, 29, 0.2)', color: editingEvent.whatsappGroupLink?.trim() ? '#FCA5A5' : '#738096', cursor: editingEvent.whatsappGroupLink?.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>Clear link</button>
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
                    // Approval status is global-admin only; never mutate it here.
                    status: e.target.value as any
                  })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF' }}
                >
                  {editingEvent.approvalStatus === 'approved' && (
                    <option value="open">Open (Published & Accepting Registrations)</option>
                  )}
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
      {isAddEventOpen && isDeptChief && (
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
            {eventCreateError && (
              <div
                role="alert"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginBottom: '16px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(248, 113, 113, 0.65)',
                  background: 'rgba(127, 29, 29, 0.35)',
                  color: '#FCA5A5',
                  fontSize: '0.82rem',
                  lineHeight: 1.45
                }}
              >
                <AlertCircle size={17} style={{ flex: '0 0 auto', marginTop: '1px' }} />
                <span>{eventCreateError}</span>
              </div>
            )}
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


              {/* Schedule & Venue */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>Event Day</label>
                  <select
                    value={newEventDate}
                    onChange={e => setNewEventDate(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box', colorScheme: 'dark' }}
                  >
                    <option value="">Select event day</option>
                    <option value="Dec 1, 2026">Dec 1 (Day 1)</option>
                    <option value="Dec 2, 2026">Dec 2 (Day 2)</option>
                    <option value="Dec 1-2, 2026">Dec 1 &amp; Dec 2 (Both days)</option>
                  </select>
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

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#DCE3E5', marginBottom: '4px' }}>WhatsApp Group Link</label>
                <input type="url" value={newEventWhatsAppGroupLink} onChange={e => setNewEventWhatsAppGroupLink(e.target.value)} placeholder="https://chat.whatsapp.com/..." maxLength={2048} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 26, 53, 0.9)', border: '1px solid rgba(220, 227, 229, 0.2)', color: '#FFFFFF', boxSizing: 'border-box' }} />
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

              {/* Department events are always reviewed by SAC before publishing. */}
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  background: 'rgba(14, 116, 144, 0.16)',
                  color: '#BAE6FD',
                  fontSize: '0.78rem',
                  lineHeight: 1.45
                }}
              >
                <strong style={{ color: '#38BDF8' }}>Publishing workflow:</strong>{' '}
                this event will be saved to the backend as <strong>Pending SAC approval</strong>. It becomes visible for public registration only after an administrator approves it.
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
                  disabled={isCreatingEvent}
                  className="btn-cyber-primary"
                  style={{ padding: '8px 20px', borderRadius: '8px', fontWeight: 700, opacity: isCreatingEvent ? 0.7 : 1, cursor: isCreatingEvent ? 'wait' : 'pointer' }}
                >
                  {isCreatingEvent ? 'Saving to backend…' : 'Create & Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <TeamRosterModal group={selectedLedgerTeam} onClose={() => setSelectedLedgerTeam(null)} />

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

      {eventPendingDelete && (
        <ConfirmActionModal
          title="Delete event permanently?"
          message={`“${eventPendingDelete.title}” and all of its registrations, tickets, passes, teams, claims, email records, and event-coordinator assignments will be removed. The event itself is hidden from the site and admin list.`}
          confirmLabel="Delete event"
          busy={deletingEventId === eventPendingDelete.id}
          error={eventDeleteError}
          onConfirm={() => void confirmDeleteDepartmentEvent()}
          onCancel={() => { setEventPendingDelete(null); setEventDeleteError(null); }}
        />
      )}
      </div>
    </div>
  );
};
