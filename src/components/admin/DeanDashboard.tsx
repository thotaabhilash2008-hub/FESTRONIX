import React, { useState, useEffect } from 'react';
import { 
  Award, Users, IndianRupee, Clock, CheckCircle2, XCircle, Search, 
  Download, Bell, Plus, Trash2, Edit3, LogOut, Globe, 
  Layers, Eye, RefreshCw, Building2,
  UserCheck, UserPlus, Phone, Mail, Copy, Check,
  Lock, Unlock, Cpu, Database, Brain, Wrench, Zap, Radio, Briefcase, Building, ShieldCheck, Key,
  Calendar, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminUser, AdminAuthService, AdminRole } from '../../services/adminAuthService';
import { StorageService } from '../../services/storageService';
import { 
  FestEvent, Registration, Announcement, FestStats, PaymentStatus, 
  EventCategory, EventFormat, Department
} from '../../types/festronix';
import { DEPARTMENTS, ORGANISATIONAL_STRUCTURE } from '../../data/mockData';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar, AdminNavTab } from './AdminSidebar';
import { AdminTopNav } from './AdminTopNav';
import { AdminHeroBanner } from './AdminHeroBanner';
import { AdminKpiCards } from './AdminKpiCards';
import { SponsorManagerTab } from './SponsorManagerTab';

interface DeanDashboardProps {
  adminUser: AdminUser;
  onLogout: () => void;
  onSwitchToFest: () => void;
}

export const DeanDashboard: React.FC<DeanDashboardProps> = ({ adminUser, onLogout, onSwitchToFest }) => {
  const [activeTab, setActiveTab] = useState<AdminNavTab>('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedTimeScope, setSelectedTimeScope] = useState<'day' | 'week' | 'month' | 'year'>('day');
  
  const [stats, setStats] = useState<FestStats>(StorageService.getStats());
  const [events, setEvents] = useState<FestEvent[]>(StorageService.getEvents());
  const [registrations, setRegistrations] = useState<Registration[]>(StorageService.getRegistrations());
  const [announcements, setAnnouncements] = useState<Announcement[]>(StorageService.getAnnouncements());
  const [departments, setDepartments] = useState<Department[]>(StorageService.getDepartments());
  const [coordinators, setCoordinators] = useState<Array<AdminUser & { password?: string; assignedEvents?: string[] }>>(
    AdminAuthService.getCoordinators()
  );

  // Search & Filter States
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterDeptFilter, setRosterDeptFilter] = useState('all');
  const [rosterPaymentFilter, setRosterPaymentFilter] = useState('all');
  const [rosterCheckInFilter, setRosterCheckInFilter] = useState<'all' | 'checked_in' | 'not_checked_in'>('all');

  // Events Filters
  const [eventSearch, setEventSearch] = useState('');
  const [eventDeptFilter, setEventDeptFilter] = useState('all');
  const [eventStatusFilter, setEventStatusFilter] = useState('all');
  const [eventCategoryFilter, setEventCategoryFilter] = useState('all');

  // Coordinators Filters
  const [coordSearch, setCoordSearch] = useState('');
  const [coordDeptFilter, setCoordDeptFilter] = useState('all');
  const [coordRoleFilter, setCoordRoleFilter] = useState('all');

  // Payment Verification Modal State & Filters
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentDeptFilter, setPaymentDeptFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');

  // New Announcement Form State
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnMessage, setNewAnnMessage] = useState('');
  const [newAnnType, setNewAnnType] = useState<'urgent' | 'general' | 'prize' | 'workshop'>('urgent');

  // Modal States
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FestEvent | null>(null);
  const [isAddCoordinatorOpen, setIsAddCoordinatorOpen] = useState(false);

  // Clipboard copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State: Add New Event
  const [evtTitle, setEvtTitle] = useState('');
  const [evtSlug, setEvtSlug] = useState('');
  const [evtTagline, setEvtTagline] = useState('');
  const [evtDeptCode, setEvtDeptCode] = useState('CSE');
  const [evtCategory, setEvtCategory] = useState<EventCategory>('technical');
  const [evtFormat, setEvtFormat] = useState<EventFormat>('individual');
  const [evtMinTeamSize, setEvtMinTeamSize] = useState(1);
  const [evtMaxTeamSize, setEvtMaxTeamSize] = useState(1);
  const [evtIsFree, setEvtIsFree] = useState(true);
  const [evtFee, setEvtFee] = useState(0);
  const [evtCapacity, setEvtCapacity] = useState(100);
  const [evtDeadline, setEvtDeadline] = useState('2026-03-26');
  const [evtDate, setEvtDate] = useState('2026-03-27');
  const [evtTime, setEvtTime] = useState('10:00 AM - 01:00 PM');
  const [evtVenue, setEvtVenue] = useState('Main Auditorium');
  const [evtDescription, setEvtDescription] = useState('');
  const [evtRules, setEvtRules] = useState('• Valid college ID card required at entry.\n• Decision of event judges is final.\n• Malpractice leads to immediate disqualification.');
  const [evtPaymentInstructions, setEvtPaymentInstructions] = useState('Scan the SAC official QR code, pay the entry fee, and upload screenshot with UTR number.');
  const [evtCoordinatorChoice, setEvtCoordinatorChoice] = useState('custom');
  const [evtCoordinatorName, setEvtCoordinatorName] = useState('');
  const [evtCoordinatorPhone, setEvtCoordinatorPhone] = useState('');
  const [evtCoordinatorEmail, setEvtCoordinatorEmail] = useState('');
  const [evtPublishStatus, setEvtPublishStatus] = useState<'open' | 'pending_approval'>('open');

  // Form State: Add New Coordinator / HOD / Staff
  const [coordFullName, setCoordFullName] = useState('');
  const [coordDeptCode, setCoordDeptCode] = useState('CSE');
  const [coordRole, setCoordRole] = useState<AdminRole>('faculty_coord');
  const [coordDesignation, setCoordDesignation] = useState('Assistant Professor & Convener');
  const [coordEmail, setCoordEmail] = useState('');
  const [coordPhone, setCoordPhone] = useState('+91 ');
  const [coordUsername, setCoordUsername] = useState('');
  const [coordPassword, setCoordPassword] = useState('festcoord2026');
  const [coordShowPassword, setCoordShowPassword] = useState(false);

  // Form State: Edit Coordinator / HOD / Staff
  const [isEditCoordinatorOpen, setIsEditCoordinatorOpen] = useState(false);
  const [editingCoordinator, setEditingCoordinator] = useState<(AdminUser & { password?: string; assignedEvents?: string[] }) | null>(null);
  const [editCoordFullName, setEditCoordFullName] = useState('');
  const [editCoordDeptCode, setEditCoordDeptCode] = useState('CSE');
  const [editCoordRole, setEditCoordRole] = useState<AdminRole>('faculty_coord');
  const [editCoordDesignation, setEditCoordDesignation] = useState('');
  const [editCoordEmail, setEditCoordEmail] = useState('');
  const [editCoordPhone, setEditCoordPhone] = useState('+91 ');
  const [editCoordUsername, setEditCoordUsername] = useState('');
  const [editCoordPassword, setEditCoordPassword] = useState('');
  const [editCoordShowPassword, setEditCoordShowPassword] = useState(false);

  // Form State: Add New Department
  const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false);
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptChief, setDeptChief] = useState('');
  const [deptContact, setDeptContact] = useState('');
  const [deptIcon, setDeptIcon] = useState('Cpu');

  // Form State: Edit Department
  const [isEditDepartmentOpen, setIsEditDepartmentOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editDeptCode, setEditDeptCode] = useState('');
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptDesc, setEditDeptDesc] = useState('');
  const [editDeptChief, setEditDeptChief] = useState('');
  const [editDeptContact, setEditDeptContact] = useState('');
  const [editDeptIcon, setEditDeptIcon] = useState('Cpu');

  const refreshAllData = async () => {
    setStats(StorageService.getStats());
    setEvents(StorageService.getEvents());
    setRegistrations(StorageService.getRegistrations());
    setAnnouncements(StorageService.getAnnouncements());
    setDepartments(StorageService.getDepartments());
    setCoordinators(AdminAuthService.getCoordinators());

    try {
      const [liveEvts, liveRegs, liveAnns] = await Promise.all([
        StorageService.fetchEvents(),
        StorageService.fetchRegistrations(),
        StorageService.fetchAnnouncements()
      ]);
      setEvents(liveEvts);
      setRegistrations(liveRegs);
      setAnnouncements(liveAnns);
      setDepartments(StorageService.getDepartments());
      setStats(StorageService.getStats());
      setCoordinators(AdminAuthService.getCoordinators());
    } catch (err) {
      console.warn('Dashboard sync warning:', err);
    }
  };

  useEffect(() => {
    refreshAllData();

    const handleRegsUpdate = () => {
      setRegistrations(StorageService.getRegistrations());
      setStats(StorageService.getStats());
    };

    const handleEventsUpdate = () => {
      setEvents(StorageService.getEvents());
      setStats(StorageService.getStats());
    };

    const handleDeptsUpdate = () => {
      setDepartments(StorageService.getDepartments());
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === 'festronix_registrations_v1' || 
        e.key === 'festronix_events_v1' || 
        e.key === 'festronix_custom_coordinators_v1' ||
        e.key === 'festronix_departments_v2' ||
        e.key === 'festronix_all_admins_v2'
      ) {
        refreshAllData();
      }
    };

    window.addEventListener('festronix:regs-updated', handleRegsUpdate);
    window.addEventListener('festronix:events-updated', handleEventsUpdate);
    window.addEventListener('festronix:departments-updated', handleDeptsUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('festronix:regs-updated', handleRegsUpdate);
      window.removeEventListener('festronix:events-updated', handleEventsUpdate);
      window.removeEventListener('festronix:departments-updated', handleDeptsUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Department CRUD Handlers
  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = deptCode.trim().toUpperCase();
    if (!cleanCode || !deptName.trim()) {
      alert('Please enter department code and name.');
      return;
    }

    StorageService.addDepartment({
      code: cleanCode,
      name: deptName.trim(),
      description: deptDesc.trim() || `${deptName.trim()} engineering division for FESTRONIX 2026.`,
      chiefCoordinator: deptChief.trim() || 'Department Chief',
      contact: deptContact.trim() || `${cleanCode.toLowerCase()}.festronix@vardhaman.org`,
      iconName: deptIcon || 'Cpu'
    });

    // If chief provided, also ensure HOD login exists
    if (deptChief.trim()) {
      const existingHod = AdminAuthService.getAllAdmins().find(
        a => a.departmentCode?.toUpperCase() === cleanCode && (a.role === 'dept_chief_coordinator' || a.role === 'dept_coordinator')
      );
      if (!existingHod) {
        AdminAuthService.addAdmin({
          username: `hod_${cleanCode.toLowerCase()}`,
          password: `${cleanCode.toLowerCase()}2026`,
          fullName: deptChief.trim(),
          designation: `Department Chief Coordinator (${cleanCode})`,
          role: 'dept_chief_coordinator',
          departmentCode: cleanCode,
          departmentName: deptName.trim(),
          email: deptContact.trim() || `${cleanCode.toLowerCase()}.festronix@vardhaman.org`,
          accessBoundary: "Their department's events"
        });
      }
    }

    confetti({ particleCount: 90, spread: 70 });
    setIsAddDepartmentOpen(false);
    setDeptCode('');
    setDeptName('');
    setDeptDesc('');
    setDeptChief('');
    setDeptContact('');
    setDeptIcon('Cpu');
    refreshAllData();
  };

  const handleOpenEditDepartment = (dept: Department) => {
    setEditingDepartment(dept);
    setEditDeptCode(dept.code);
    setEditDeptName(dept.name);
    setEditDeptDesc(dept.description);
    setEditDeptChief(dept.chiefCoordinator);
    setEditDeptContact(dept.contact);
    setEditDeptIcon(dept.iconName || 'Cpu');
    setIsEditDepartmentOpen(true);
  };

  const handleUpdateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartment) return;
    const cleanCode = editDeptCode.trim().toUpperCase();
    if (!cleanCode || !editDeptName.trim()) {
      alert('Please enter department code and name.');
      return;
    }

    StorageService.updateDepartment(editingDepartment.id, {
      code: cleanCode,
      name: editDeptName.trim(),
      description: editDeptDesc.trim(),
      chiefCoordinator: editDeptChief.trim(),
      contact: editDeptContact.trim(),
      iconName: editDeptIcon
    });

    confetti({ particleCount: 70, spread: 50 });
    setIsEditDepartmentOpen(false);
    setEditingDepartment(null);
    refreshAllData();
  };

  const handleDeleteDepartment = (deptId: string, deptCode: string, deptName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete department "${deptCode} — ${deptName}"?\n\nThis will remove it from the department matrix, catalog filters, and login views.`
    );
    if (confirmed) {
      StorageService.deleteDepartment(deptId);
      refreshAllData();
    }
  };

  const renderDeptIcon = (iconName: string, size = 18) => {
    switch ((iconName || '').toLowerCase()) {
      case 'cpu': return <Cpu size={size} />;
      case 'database': return <Database size={size} />;
      case 'brain': return <Brain size={size} />;
      case 'globe': return <Globe size={size} />;
      case 'wrench': return <Wrench size={size} />;
      case 'building':
      case 'building2': return <Building2 size={size} />;
      case 'zap': return <Zap size={size} />;
      case 'radio': return <Radio size={size} />;
      case 'briefcase': return <Briefcase size={size} />;
      default: return <Layers size={size} />;
    }
  };

  // Update format team sizes automatically when format changes
  useEffect(() => {
    if (evtFormat === 'individual') {
      setEvtMinTeamSize(1);
      setEvtMaxTeamSize(1);
    } else if (evtFormat === 'duo') {
      setEvtMinTeamSize(2);
      setEvtMaxTeamSize(2);
    } else if (evtFormat === 'team') {
      if (evtMinTeamSize === 1) setEvtMinTeamSize(2);
      if (evtMaxTeamSize <= 2) setEvtMaxTeamSize(4);
    }
  }, [evtFormat]);

  // Auto-generate slug when title changes
  const handleTitleChange = (val: string) => {
    setEvtTitle(val);
    const generatedSlug = val.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setEvtSlug(generatedSlug);
  };

  // Payment Approval Handler
  const handleVerifyPayment = async (regId: string, status: PaymentStatus, reason?: string) => {
    const success = await StorageService.updatePaymentStatus(regId, status, adminUser.fullName, reason);
    if (success) {
      if (status === 'verified') {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      }
      refreshAllData();
    }
  };

  // Fast Gate Check-In Toggle Handler
  const handleToggleCheckIn = async (regId: string) => {
    const res = await StorageService.toggleCheckInRegistration(regId, adminUser.fullName);
    if (res.success) {
      if (res.checkedIn) {
        confetti({ particleCount: 50, spread: 45, origin: { y: 0.7 } });
      }
      refreshAllData();
    }
  };

  // Broadcast Bulletin Handler
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnMessage.trim()) return;

    await StorageService.addAnnouncement({
      title: newAnnTitle.trim(),
      message: newAnnMessage.trim(),
      type: newAnnType,
      scope: 'fest-wide'
    });

    setNewAnnTitle('');
    setNewAnnMessage('');
    refreshAllData();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await StorageService.deleteAnnouncement(id);
    refreshAllData();
  };

  // Toggle Event Registration Status
  const handleToggleEventStatus = async (event: FestEvent) => {
    const nextStatus = event.status === 'open' ? 'closed' : 'open';
    const updated = { ...event, status: nextStatus as any };
    await StorageService.updateEvent(updated);
    refreshAllData();
  };

  // SAC Event Approval Handler (FR-EVT-08)
  const handleApproveEvent = async (event: FestEvent) => {
    const updated: FestEvent = {
      ...event,
      status: 'open',
      approvalStatus: 'approved'
    };
    await StorageService.updateEvent(updated);
    confetti({ particleCount: 70, spread: 50 });
    refreshAllData();
  };

  // Delete Event Handler
  const handleDeleteEvent = async (event: FestEvent) => {
    const confirmed = window.confirm(`Are you sure you want to delete event "${event.title}"? This cannot be undone.`);
    if (confirmed) {
      await StorageService.deleteEvent(event.id);
      refreshAllData();
    }
  };

  // Create New Event Handler (PRD 6.3)
  const handleCreateNewEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evtTitle.trim()) {
      alert('Please enter an event title');
      return;
    }

    const newEvent: FestEvent = {
      id: `evt_${evtDeptCode.toLowerCase()}_${Date.now().toString().slice(-4)}`,
      slug: evtSlug.trim() || evtTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: evtTitle.trim(),
      tagline: evtTagline.trim() || undefined,
      departmentCode: evtDeptCode,
      category: evtCategory,
      format: evtFormat,
      minTeamSize: evtFormat === 'individual' ? 1 : evtFormat === 'duo' ? 2 : Math.max(1, Number(evtMinTeamSize) || 2),
      maxTeamSize: evtFormat === 'individual' ? 1 : evtFormat === 'duo' ? 2 : Math.max(Number(evtMinTeamSize) || 2, Number(evtMaxTeamSize) || 4),
      fee: evtIsFree ? 0 : Math.max(0, Number(evtFee) || 0),
      capacity: Math.max(1, Number(evtCapacity) || 100),
      registeredCount: 0,
      deadline: evtDeadline || '2026-03-26',
      date: evtDate || '2026-03-27',
      time: evtTime || '10:00 AM - 01:00 PM',
      venue: evtVenue.trim() || 'Vardhaman Campus',
      description: evtDescription.trim() || 'Official FESTRONIX 2026 departmental event.',
      rules: evtRules.split('\n').map(r => r.trim()).filter(Boolean),
      coordinatorName: evtCoordinatorName.trim() || adminUser.fullName,
      coordinatorPhone: evtCoordinatorPhone.trim() || '+91 98480 22000',
      coordinatorEmail: evtCoordinatorEmail.trim() || `${evtDeptCode.toLowerCase()}.fest@vardhaman.org`,
      status: evtPublishStatus,
      approvalStatus: evtPublishStatus === 'open' ? 'approved' : 'pending',
      bannerGradient: 'linear-gradient(135deg, #142042 0%, #283B78 50%, #789593 100%)',
      prizes: {
        first: '₹10,000 + Merit Certificate',
        second: '₹5,000 + Certificate',
        third: '₹2,500 + Certificate'
      },
      paymentInstructions: !evtIsFree ? evtPaymentInstructions.trim() : undefined
    };

    await StorageService.addEvent(newEvent);
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 } });
    setIsAddEventOpen(false);

    // Reset Form
    setEvtTitle('');
    setEvtSlug('');
    setEvtTagline('');
    setEvtDescription('');
    refreshAllData();
  };

  // Save Edited Event
  const handleSaveEditedEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    await StorageService.updateEvent(editingEvent);
    setEditingEvent(null);
    refreshAllData();
  };

  // Create Coordinator / HOD / Operational Staff Handler
  const handleCreateCoordinator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordFullName.trim() || !coordUsername.trim() || !coordPassword.trim()) {
      alert('Please fill out all required credentials.');
      return;
    }

    const deptName = coordRole === 'finance_reviewer'
      ? 'Central Accounts & Finance Desk'
      : (departments.find(d => d.code === coordDeptCode)?.name || coordDeptCode);

    AdminAuthService.addCoordinator({
      username: coordUsername.trim().toLowerCase(),
      password: coordPassword.trim(),
      fullName: coordFullName.trim(),
      designation: coordDesignation.trim(),
      role: coordRole,
      departmentCode: coordRole === 'finance_reviewer' ? 'FINANCE' : coordDeptCode,
      departmentName: deptName,
      email: coordEmail.trim(),
      phone: coordPhone.trim(),
      accessBoundary: coordRole === 'finance_reviewer'
        ? 'Payment data needed for assigned duties'
        : (coordRole === 'dept_chief_coordinator' || coordRole === 'dept_coordinator')
        ? "Their department's events"
        : coordRole === 'volunteer_checkin'
        ? 'Limited check-in access'
        : 'Assigned event(s) only unless separately authorised'
    });

    confetti({ particleCount: 80, spread: 60 });
    setIsAddCoordinatorOpen(false);
    
    // Reset form
    setCoordFullName('');
    setCoordUsername('');
    setCoordPassword('festcoord2026');
    setCoordEmail('');
    setCoordPhone('+91 ');
    refreshAllData();
  };

  // Open Edit Modal for Coordinator / HOD / Payment Reviewer
  const handleOpenEditCoordinator = (coord: AdminUser & { password?: string; assignedEvents?: string[] }) => {
    setEditingCoordinator(coord);
    setEditCoordFullName(coord.fullName || '');
    setEditCoordDeptCode(coord.departmentCode || 'CSE');
    setEditCoordRole(coord.role);
    setEditCoordDesignation(coord.designation || '');
    setEditCoordEmail(coord.email || '');
    setEditCoordPhone(coord.phone || '');
    setEditCoordUsername(coord.username || '');
    setEditCoordPassword(coord.password || '');
    setEditCoordShowPassword(false);
    setIsEditCoordinatorOpen(true);
  };

  // Submit Update for Coordinator / HOD / Payment Reviewer
  const handleUpdateCoordinator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoordinator) return;
    if (!editCoordFullName.trim() || !editCoordUsername.trim() || !editCoordPassword.trim()) {
      alert('Please fill out all required credentials.');
      return;
    }

    const deptName = editCoordRole === 'finance_reviewer'
      ? 'Central Accounts & Finance Desk'
      : (departments.find(d => d.code === editCoordDeptCode)?.name || editCoordDeptCode);

    AdminAuthService.updateCoordinator(editingCoordinator.id, {
      fullName: editCoordFullName.trim(),
      username: editCoordUsername.trim().toLowerCase(),
      password: editCoordPassword.trim(),
      designation: editCoordDesignation.trim(),
      role: editCoordRole,
      departmentCode: editCoordRole === 'finance_reviewer' ? 'FINANCE' : editCoordDeptCode,
      departmentName: deptName,
      email: editCoordEmail.trim(),
      phone: editCoordPhone.trim(),
      accessBoundary: editCoordRole === 'finance_reviewer'
        ? 'Payment data needed for assigned duties'
        : (editCoordRole === 'dept_chief_coordinator' || editCoordRole === 'dept_coordinator')
        ? "Their department's events"
        : editCoordRole === 'volunteer_checkin'
        ? 'Limited check-in access'
        : 'Assigned event(s) only unless separately authorised'
    });

    confetti({ particleCount: 70, spread: 50 });
    setIsEditCoordinatorOpen(false);
    setEditingCoordinator(null);
    refreshAllData();
  };

  // Delete Coordinator / Staff Handler
  const handleDeleteCoordinator = (coordId: string, name: string, roleName?: string) => {
    if (coordId === adminUser.id) {
      alert('You cannot delete your own currently active Super Admin session.');
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to delete ${roleName || 'coordinator'} "${name}"?\n\nThis will permanently remove their credentials and revoke their portal access immediately.`
    );
    if (confirmed) {
      AdminAuthService.deleteCoordinator(coordId);
      confetti({ particleCount: 50, spread: 45, origin: { y: 0.6 } });
      refreshAllData();
    }
  };

  // Copy to clipboard helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['Registration ID', 'Event Title', 'Leader Name', 'Roll Number', 'Team Name', 'Team Code', 'Email', 'Phone', 'College', 'Format', 'Fee (INR)', 'Payment Status', 'Transaction ID', 'Checked In'];
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
      r.id.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      (r.teamName && r.teamName.toLowerCase().includes(rosterSearch.toLowerCase())) ||
      (r.teamCode && r.teamCode.toLowerCase().includes(rosterSearch.toLowerCase()));
    
    const regDept = StorageService.resolveDepartmentForRegistration(r, events);
    const matchDept = rosterDeptFilter === 'all' || regDept === rosterDeptFilter.toUpperCase();
    const matchPay = rosterPaymentFilter === 'all' || r.paymentStatus === rosterPaymentFilter;
    const matchCheckIn = 
      rosterCheckInFilter === 'all' || 
      (rosterCheckInFilter === 'checked_in' && r.checkedIn) || 
      (rosterCheckInFilter === 'not_checked_in' && !r.checkedIn);

    return matchSearch && matchDept && matchPay && matchCheckIn;
  });

  // Filtered Payments (Tab 2)
  const filteredPayments = registrations.filter(r => {
    if (paymentStatusFilter === 'pending' && r.paymentStatus !== 'verification_pending') return false;
    if (paymentStatusFilter === 'verified' && r.paymentStatus !== 'verified') return false;
    if (paymentStatusFilter === 'rejected' && r.paymentStatus !== 'rejected') return false;

    const search = paymentSearch.toLowerCase().trim();
    if (search) {
      const matchSearch =
        r.leaderName.toLowerCase().includes(search) ||
        (r.leaderRoll && r.leaderRoll.toLowerCase().includes(search)) ||
        (r.transactionId && r.transactionId.toLowerCase().includes(search)) ||
        r.eventTitle.toLowerCase().includes(search) ||
        r.id.toLowerCase().includes(search);
      if (!matchSearch) return false;
    }

    if (paymentDeptFilter !== 'all') {
      const dept = StorageService.resolveDepartmentForRegistration(r, events);
      if (dept !== paymentDeptFilter.toUpperCase()) return false;
    }

    return true;
  });

  // Filtered Events
  const filteredEvents = events.filter(e => {
    const matchSearch = 
      e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.description.toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.coordinatorName.toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.venue.toLowerCase().includes(eventSearch.toLowerCase());
    
    const matchDept = eventDeptFilter === 'all' || e.departmentCode.toUpperCase() === eventDeptFilter.toUpperCase();
    const matchStatus = eventStatusFilter === 'all' || e.status === eventStatusFilter;
    const matchCategory = eventCategoryFilter === 'all' || e.category.toLowerCase() === eventCategoryFilter.toLowerCase();

    return matchSearch && matchDept && matchStatus && matchCategory;
  });

  // Filtered Coordinators
  const filteredCoordinators = coordinators.filter(c => {
    const matchSearch = 
      c.fullName.toLowerCase().includes(coordSearch.toLowerCase()) ||
      c.username.toLowerCase().includes(coordSearch.toLowerCase()) ||
      c.designation.toLowerCase().includes(coordSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(coordSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(coordSearch));
    
    const matchDept = coordDeptFilter === 'all' || 
      (c.departmentCode && c.departmentCode.toUpperCase() === coordDeptFilter.toUpperCase()) ||
      (coordDeptFilter === 'SAC' && (!c.departmentCode || c.departmentCode === 'SAC' || c.departmentCode === 'FINANCE'));

    const matchRole = coordRoleFilter === 'all' || 
      c.role === coordRoleFilter ||
      (coordRoleFilter === 'dept_chief_coordinator' && (c.role === 'dept_chief_coordinator' || c.role === 'dept_coordinator')) ||
      (coordRoleFilter === 'finance_reviewer' && c.role === 'finance_reviewer');

    return matchSearch && matchDept && matchRole;
  });

  const handleExportRosterCSV = () => {
    const headers = ['Registration ID', 'Event Name', 'Participant / Leader Name', 'Roll Number', 'Email', 'College', 'Department / Section', 'Phone', 'Payment Status', 'Gate Checked In'];
    const rows = registrations.map(r => {
      const ev = events.find(e => e.id === r.eventId);
      return [
        r.id,
        `"${ev?.title || r.eventTitle || 'Unknown'}"`,
        `"${r.leaderName || ''}"`,
        r.leaderRoll || '',
        r.leaderEmail || '',
        `"${r.leaderCollege || ''}"`,
        `"${r.deptSection || r.departmentCode || ''}"`,
        r.leaderPhone || '',
        r.paymentStatus,
        r.checkedIn ? 'YES' : 'NO'
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FESTRONIX_2026_MASTER_ROSTER_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-shell-layout">
      {/* 1. Left Vertical Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={tab => {
          if (tab === 'reports') {
            handleExportRosterCSV();
          } else {
            setActiveTab(tab);
          }
        }}
        pendingPaymentsCount={stats.pendingCount}
        totalEventsCount={events.length}
      />

      {/* 2. Main Viewport Canvas */}
      <div className="admin-main-viewport">
        {/* Top Header Bar */}
        <AdminTopNav
          adminUser={adminUser}
          onLogout={onLogout}
          onSwitchToFest={onSwitchToFest}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
        />

        {/* Content Container */}
        <main style={{ padding: '24px 28px', maxWidth: '1440px', width: '100%', boxSizing: 'border-box' }}>
          {/* Main Dashboard Overview Screen (Matching Reference Image) */}
          {activeTab === 'dashboard' && (
            <div className="admin-tab-pane">
              {/* Hero Welcome Banner */}
              <AdminHeroBanner adminUser={adminUser} />

              {/* 4 Neon KPI Cards with Sparklines & Radial Gauge */}
              <AdminKpiCards stats={stats} />

              {/* Quick Action Buttons Strip */}
              <div className="admin-quick-actions-bar">
                <button
                  onClick={() => setIsAddDepartmentOpen(true)}
                  className="admin-action-btn-glow"
                >
                  <Plus size={16} />
                  <span>Create Department</span>
                </button>

                <button
                  onClick={() => setActiveTab('payments')}
                  className="admin-action-chip-item"
                >
                  <Clock size={15} color="#FBBF24" />
                  <span>Payment Approvals</span>
                  <span className="admin-sidebar-badge">{stats.pendingCount}</span>
                </button>

                <button
                  onClick={() => setActiveTab('events')}
                  className="admin-action-chip-item"
                >
                  <Layers size={15} color="#38BDF8" />
                  <span>View Fest Events</span>
                  <span style={{ fontSize: '0.68rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '1px 7px', borderRadius: '9999px', fontWeight: 800 }}>
                    {events.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('sponsors')}
                  className="admin-action-chip-item"
                >
                  <Briefcase size={15} color="#38BDF8" />
                  <span>Sponsors & Partners</span>
                </button>

                <button
                  onClick={() => setActiveTab('structure')}
                  className="admin-action-chip-item"
                >
                  <Users size={15} color="#A78BFA" />
                  <span>User Management</span>
                </button>

                <button
                  onClick={handleExportRosterCSV}
                  className="admin-action-chip-item"
                >
                  <Download size={15} color="#34D399" />
                  <span>Generate Reports</span>
                </button>
              </div>

              {/* Engineering Department Performance Matrix Header & Filters */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={16} color="#38BDF8" />
                    </div>
                    <h3 style={{ fontFamily: "var(--font-title, 'Space Grotesk', sans-serif)", fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      Engineering Department Performance Matrix
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '4px 0 0 38px' }}>
                    Live aggregate metrics across all academic divisions for FESTRONIX 2026.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Department Filter Select */}
                  <select
                    className="admin-form-input"
                    style={{ width: 'auto', padding: '7px 12px', fontSize: '0.78rem' }}
                  >
                    <option value="all">All Departments</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.code}>{d.code} - {d.name}</option>
                    ))}
                  </select>

                  {/* Time Scope Pills */}
                  <div style={{ display: 'flex', background: 'rgba(14, 21, 38, 0.85)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(220, 227, 232, 0.12)' }}>
                    {(['day', 'week', 'month', 'year'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedTimeScope(t)}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: selectedTimeScope === t ? 'linear-gradient(135deg, #2563EB, #7C3AED)' : 'transparent',
                          color: selectedTimeScope === t ? '#FFFFFF' : '#94A3B8',
                          fontSize: '0.72rem',
                          fontWeight: selectedTimeScope === t ? 700 : 500,
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Department Cards Grid (4 columns, matching reference image) */}
              <div className="admin-dept-matrix-grid">
                {departments.map(dept => {
                  const deptEvents = events.filter(e => e.departmentCode.toUpperCase() === dept.code.toUpperCase());
                  const deptRegs = registrations.filter(r => deptEvents.some(e => e.id === r.eventId));
                  const verifiedRegs = deptRegs.filter(r => r.paymentStatus === 'verified');
                  const checkedInCount = deptRegs.filter(r => r.checkedIn).length;
                  const totalCollected = verifiedRegs.reduce((acc, r) => acc + (Number(r.fee) || 0), 0);
                  const deptCoords = coordinators.filter(c => c.departmentCode?.toUpperCase() === dept.code.toUpperCase());

                  const deptColorConfig: Record<string, { border: string; glow: string; text: string; bg: string; icon: any }> = {
                    CSE: { border: 'rgba(56, 189, 248, 0.45)', glow: 'rgba(56, 189, 248, 0.14)', text: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', icon: Cpu },
                    CSD: { border: 'rgba(168, 85, 247, 0.45)', glow: 'rgba(168, 85, 247, 0.14)', text: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)', icon: Database },
                    CSM: { border: 'rgba(245, 158, 11, 0.45)', glow: 'rgba(245, 158, 11, 0.14)', text: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', icon: Brain },
                    IT: { border: 'rgba(6, 182, 212, 0.45)', glow: 'rgba(6, 182, 212, 0.14)', text: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)', icon: Globe },
                    MECHANICAL: { border: 'rgba(239, 68, 68, 0.45)', glow: 'rgba(239, 68, 68, 0.14)', text: '#F87171', bg: 'rgba(239, 68, 68, 0.15)', icon: Wrench },
                    CIVIL: { border: 'rgba(16, 185, 129, 0.45)', glow: 'rgba(16, 185, 129, 0.14)', text: '#34D399', bg: 'rgba(16, 185, 129, 0.15)', icon: Building },
                    EEE: { border: 'rgba(234, 179, 8, 0.45)', glow: 'rgba(234, 179, 8, 0.14)', text: '#FACC15', bg: 'rgba(234, 179, 8, 0.15)', icon: Zap },
                    ECE: { border: 'rgba(99, 102, 241, 0.45)', glow: 'rgba(99, 102, 241, 0.14)', text: '#818CF8', bg: 'rgba(99, 102, 241, 0.15)', icon: Radio },
                    MBA: { border: 'rgba(236, 72, 153, 0.45)', glow: 'rgba(236, 72, 153, 0.14)', text: '#F472B6', bg: 'rgba(236, 72, 153, 0.15)', icon: Briefcase },
                  };

                  const theme = deptColorConfig[dept.code.toUpperCase()] || deptColorConfig.CSE;
                  const IconComp = theme.icon;

                  return (
                    <div 
                      key={dept.id} 
                      className="admin-dept-matrix-card"
                      style={{
                        borderColor: theme.border,
                        boxShadow: `0 12px 36px rgba(0, 0, 0, 0.55), 0 0 18px ${theme.glow}`
                      }}
                    >
                      {/* Watermark Department Icon */}
                      <div 
                        style={{
                          position: 'absolute',
                          right: '-10px',
                          top: '-10px',
                          opacity: 0.08,
                          color: theme.text,
                          pointerEvents: 'none',
                          transform: 'rotate(-8deg)'
                        }}
                      >
                        <IconComp size={90} />
                      </div>

                      <div>
                        {/* Header Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', position: 'relative', zIndex: 1 }}>
                          <span 
                            className="admin-dept-code-tag"
                            style={{
                              background: theme.bg,
                              borderColor: theme.border,
                              color: theme.text
                            }}
                          >
                            {dept.code}
                          </span>
                          <span className="admin-dept-active-badge">
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                            <span>HOD Active</span>
                          </span>
                        </div>

                        {/* Title & Tagline */}
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px', position: 'relative', zIndex: 1 }}>
                          {dept.name}
                        </h4>
                        <p style={{ fontSize: '0.76rem', color: '#94A3B8', margin: '0 0 10px', lineHeight: 1.35, minHeight: '36px', position: 'relative', zIndex: 1 }}>
                          {dept.description}
                        </p>
                        <div style={{ fontSize: '0.76rem', color: '#CBD5E1', marginBottom: '14px', position: 'relative', zIndex: 1 }}>
                          Chief: <strong style={{ color: '#FFFFFF' }}>{dept.chiefCoordinator}</strong>
                        </div>
                      </div>

                      <div style={{ position: 'relative', zIndex: 1 }}>
                        {/* Metrics Block */}
                        <div style={{ background: 'rgba(10, 16, 32, 0.7)', borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(220, 227, 232, 0.08)', marginBottom: '14px' }}>
                          <div className="admin-dept-stat-row">
                            <span style={{ color: '#94A3B8' }}>Registrations</span>
                            <strong style={{ color: '#FFFFFF' }}>{deptRegs.length} students</strong>
                          </div>
                          <div className="admin-dept-stat-row">
                            <span style={{ color: '#94A3B8' }}>Funds Collected</span>
                            <strong style={{ color: '#34D399' }}>₹{totalCollected.toLocaleString()}</strong>
                          </div>
                          <div className="admin-dept-stat-row">
                            <span style={{ color: '#94A3B8' }}>Gate Attendance</span>
                            <strong style={{ color: checkedInCount > 0 ? '#34D399' : '#94A3B8' }}>{checkedInCount} checked-in</strong>
                          </div>
                          <div className="admin-dept-stat-row" style={{ borderBottom: 'none' }}>
                            <span style={{ color: '#94A3B8' }}>Active Coordinators</span>
                            <strong style={{ color: '#38BDF8' }}>{Math.max(1, deptCoords.length)} appointed</strong>
                          </div>
                        </div>

                        {/* Card Buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 38px', gap: '6px' }}>
                          <button
                            onClick={() => {
                              setEventDeptFilter(dept.code);
                              setActiveTab('events');
                            }}
                            className="admin-btn admin-btn-ghost"
                            style={{ padding: '7px 8px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                          >
                            <Calendar size={13} color="#94A3B8" />
                            <span>Events ({deptEvents.length})</span>
                          </button>
                          <button
                            onClick={() => {
                              setRosterDeptFilter(dept.code);
                              setActiveTab('roster');
                            }}
                            className="admin-btn admin-btn-ghost"
                            style={{ padding: '7px 8px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                          >
                            <Users size={13} color="#94A3B8" />
                            <span>Roster ({deptRegs.length})</span>
                          </button>
                          <button
                            onClick={() => {
                              handleOpenEditDepartment(dept);
                            }}
                            className="admin-btn admin-btn-ghost"
                            style={{ padding: '7px 0', fontSize: '0.74rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Edit Department"
                          >
                            <ArrowRight size={14} color="#94A3B8" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: SPONSORS & STRATEGIC PARTNERS */}
          {activeTab === 'sponsors' && (
            <SponsorManagerTab adminUser={adminUser} />
          )}

          {/* TAB 1: DEPARTMENT LEADERBOARD */}
          {activeTab === 'departments' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="font-title" style={{ fontSize: '1.15rem', color: '#FFFFFF', margin: 0 }}>
                  Engineering Department Performance Matrix
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                  Live aggregate metrics across all academic divisions for FESTRONIX 2026. Create, edit, delete, or appoint HODs dynamically.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setDeptCode('');
                    setDeptName('');
                    setDeptDesc('');
                    setDeptChief('');
                    setDeptContact('');
                    setDeptIcon('Cpu');
                    setIsAddDepartmentOpen(true);
                  }}
                  className="btn-cyber-primary"
                  style={{
                    padding: '7px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px'
                  }}
                >
                  <Plus size={15} />
                  <span>+ Create Department</span>
                </button>

                <button
                  onClick={refreshAllData}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(220, 227, 229, 0.2)',
                    borderRadius: '8px',
                    padding: '7px 14px',
                    color: '#DCE3E5',
                    fontSize: '0.8rem',
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
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '16px' }}>
              {departments.map(dept => {
                const deptStats = StorageService.getDepartmentStats(dept.code);
                const deptEvents = events.filter(e => e.departmentCode.toUpperCase() === dept.code.toUpperCase());
                const deptCoords = coordinators.filter(c => c.departmentCode?.toUpperCase() === dept.code.toUpperCase());
                const deptHod = deptCoords.find(c => c.role === 'dept_chief_coordinator' || c.role === 'dept_coordinator');

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
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
                    }}
                  >
                    <div>
                      {/* Top Header of Card with Code & Action Buttons */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: 'rgba(40, 59, 120, 0.45)',
                              border: '1px solid rgba(120, 149, 147, 0.4)',
                              color: '#BACEBB',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            {renderDeptIcon(dept.iconName, 13)}
                            {dept.code}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#A8B3C2' }}>
                            {deptEvents.length} Events Listed
                          </span>
                        </div>

                        {/* Edit & Delete Buttons for Department */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleOpenEditDepartment(dept)}
                            style={{
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.35)',
                              borderRadius: '6px',
                              color: '#60A5FA',
                              padding: '4px 7px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.7rem'
                            }}
                            title={`Edit ${dept.name}`}
                          >
                            <Edit3 size={11} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteDepartment(dept.id, dept.code, dept.name)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '6px',
                              color: '#f87171',
                              padding: '4px 7px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.7rem'
                            }}
                            title={`Delete ${dept.code} Department`}
                          >
                            <Trash2 size={11} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>
                        {dept.name}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: '#A8B3C2', margin: '0 0 6px', lineHeight: 1.35 }}>
                        {dept.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#BACEBB', marginBottom: '12px' }}>
                        <span>Chief: <strong>{dept.chiefCoordinator}</strong></span>
                        {deptHod ? (
                          <span style={{ color: '#C084FC', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(192, 132, 252, 0.15)' }}>
                            HOD Portal Active
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setCoordRole('dept_chief_coordinator');
                              setCoordDeptCode(dept.code);
                              setCoordFullName(dept.chiefCoordinator);
                              setCoordDesignation(`Department Chief Coordinator (${dept.code})`);
                              setCoordUsername(`hod_${dept.code.toLowerCase()}`);
                              setCoordPassword(`${dept.code.toLowerCase()}2026`);
                              setIsAddCoordinatorOpen(true);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#60A5FA',
                              fontSize: '0.7rem',
                              textDecoration: 'underline',
                              cursor: 'pointer'
                            }}
                          >
                            + Appoint HOD
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          padding: '12px',
                          background: 'rgba(16, 26, 53, 0.7)',
                          borderRadius: '10px',
                          border: '1px solid rgba(220, 227, 229, 0.1)',
                          marginBottom: '12px'
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                          <span style={{ color: '#A8B3C2' }}>Gate Attendance:</span>
                          <strong style={{ color: '#34D399' }}>{deptStats.checkedInCount} checked-in</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: '#A8B3C2' }}>Active Coordinators:</span>
                          <strong style={{ color: '#DCE3E5' }}>{deptCoords.length} appointed</strong>
                        </div>
                      </div>

                      {/* Interactive Quick Action Buttons on Each Department Card */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setEventDeptFilter(dept.code);
                            setActiveTab('events');
                          }}
                          style={{
                            background: 'rgba(40, 59, 120, 0.35)',
                            border: '1px solid rgba(120, 149, 147, 0.35)',
                            borderRadius: '6px',
                            padding: '6px 4px',
                            color: '#DCE3E5',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          Events ({deptEvents.length})
                        </button>

                        <button
                          onClick={() => {
                            setRosterDeptFilter(dept.code);
                            setActiveTab('roster');
                          }}
                          style={{
                            background: 'rgba(40, 59, 120, 0.35)',
                            border: '1px solid rgba(120, 149, 147, 0.35)',
                            borderRadius: '6px',
                            padding: '6px 4px',
                            color: '#DCE3E5',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          Roster ({deptStats.totalRegistrations})
                        </button>

                        <button
                          onClick={() => {
                            setEvtDeptCode(dept.code);
                            setIsAddEventOpen(true);
                          }}
                          style={{
                            background: 'rgba(120, 149, 147, 0.25)',
                            border: '1px solid rgba(120, 149, 147, 0.5)',
                            borderRadius: '6px',
                            padding: '6px 4px',
                            color: '#BACEBB',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          + Event
                        </button>
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
            {/* Payment Reviewer Operations Desk Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(20, 31, 62, 0.95) 0%, rgba(40, 59, 120, 0.45) 100%)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                borderRadius: '14px',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem' }}>💳</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>
                    Payment Reviewer Operations Desk
                  </span>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.4)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    {coordinators.filter(c => c.role === 'finance_reviewer').length} Active Reviewer(s)
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#BACEBB', marginTop: '4px' }}>
                  Super Admin can create, edit, or revoke Finance Reviewers. Reviewers log in via <em>Operational Staff</em> tab to verify student UTRs.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setCoordRole('finance_reviewer');
                    setCoordDeptCode('SAC');
                    setCoordFullName('');
                    setCoordDesignation('Central Payment Review Officer');
                    setCoordEmail('accounts.fest@vardhaman.org');
                    setCoordPhone('+91 98480 55001');
                    setCoordUsername('finance_desk_' + Math.floor(100 + Math.random() * 900));
                    setCoordPassword('finance2026');
                    setIsAddCoordinatorOpen(true);
                  }}
                  className="btn-cyber-primary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={15} />
                  <span>+ Appoint Payment Reviewer</span>
                </button>
                <button
                  onClick={() => {
                    setCoordRoleFilter('finance_reviewer');
                    setActiveTab('coordinators');
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(220, 227, 229, 0.25)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    color: '#DCE3E5',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Manage in Staff Tab
                </button>
              </div>
            </div>

            {/* Active Payment Reviewers Operations Panel */}
            <div
              style={{
                marginBottom: '20px',
                background: 'rgba(20, 31, 62, 0.75)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                borderRadius: '12px',
                padding: '16px 18px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} color="#34D399" />
                    <span>Payment Verification Staff Roster ({coordinators.filter(c => c.role === 'finance_reviewer').length})</span>
                  </h4>
                  <p style={{ fontSize: '0.74rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                    Staff assigned to review student transaction screenshots, verify UTRs, and approve passes.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setCoordRole('finance_reviewer');
                    setCoordDeptCode('FINANCE');
                    setCoordFullName('');
                    setCoordDesignation('Central Payment Review Officer');
                    setCoordEmail('accounts.fest@vardhaman.org');
                    setCoordPhone('+91 98480 55001');
                    setCoordUsername('finance_desk_' + Math.floor(100 + Math.random() * 900));
                    setCoordPassword('finance2026');
                    setIsAddCoordinatorOpen(true);
                  }}
                  className="btn-cyber-primary"
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={14} />
                  <span>+ Create Payment User</span>
                </button>
              </div>

              {coordinators.filter(c => c.role === 'finance_reviewer').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: '#A8B3C2', fontSize: '0.8rem' }}>
                  No payment users appointed yet. Click "+ Create Payment User" to add one.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '12px' }}>
                  {coordinators.filter(c => c.role === 'finance_reviewer').map(reviewer => (
                    <div
                      key={reviewer.id}
                      style={{
                        background: 'rgba(16, 26, 53, 0.9)',
                        border: '1px solid rgba(52, 211, 153, 0.25)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <div>
                            <strong style={{ fontSize: '0.88rem', color: '#FFFFFF', display: 'block' }}>{reviewer.fullName}</strong>
                            <span style={{ fontSize: '0.72rem', color: '#34D399' }}>{reviewer.designation}</span>
                          </div>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(52, 211, 153, 0.15)',
                              border: '1px solid rgba(52, 211, 153, 0.35)',
                              color: '#34D399',
                              fontWeight: 700
                            }}
                          >
                            FINANCE
                          </span>
                        </div>

                        <div style={{ fontSize: '0.74rem', color: '#DCE3E5', display: 'flex', flexDirection: 'column', gap: '4px', margin: '8px 0', background: 'rgba(20, 31, 62, 0.7)', padding: '8px 10px', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#A8B3C2' }}>Username:</span>
                            <code style={{ color: '#FFFFFF', fontWeight: 700 }}>{reviewer.username}</code>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#A8B3C2' }}>Password:</span>
                            <code style={{ color: '#34D399', fontWeight: 700 }}>{reviewer.password || 'finance2026'}</code>
                          </div>
                          {reviewer.email && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#A8B3C2' }}>Email:</span>
                              <span style={{ color: '#DCE3E5', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>{reviewer.email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', paddingTop: '8px', borderTop: '1px solid rgba(220, 227, 229, 0.1)' }}>
                        <button
                          onClick={() => handleOpenEditCoordinator(reviewer)}
                          style={{
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.35)',
                            borderRadius: '6px',
                            color: '#60A5FA',
                            padding: '4px 10px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Edit3 size={11} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCoordinator(reviewer.id, reviewer.fullName, 'Payment Reviewer')}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            borderRadius: '6px',
                            color: '#f87171',
                            padding: '4px 10px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="font-title" style={{ fontSize: '1.15rem', color: '#FFFFFF', margin: 0 }}>
                  Central Payment Verification & Approval Desk
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                  Verify UPI transaction screenshots, approve registration passes, and release digital entry passes
                </p>
              </div>

              {/* Status Filter Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'pending', label: 'Pending Review', count: stats.pendingCount, color: '#FBBF24' },
                  { id: 'verified', label: 'Verified Passes', count: stats.verifiedCount, color: '#34D399' },
                  { id: 'rejected', label: 'Rejected', count: stats.rejectedCount, color: '#f87171' },
                  { id: 'all', label: 'All Transactions', count: registrations.length, color: '#DCE3E5' }
                ].map(item => {
                  const isSel = paymentStatusFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setPaymentStatusFilter(item.id as any)}
                      style={{
                        background: isSel ? 'rgba(40, 59, 120, 0.65)' : 'rgba(20, 31, 62, 0.7)',
                        border: isSel ? `1px solid ${item.color}` : '1px solid rgba(220, 227, 229, 0.15)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        color: isSel ? '#FFFFFF' : '#A8B3C2',
                        fontSize: '0.76rem',
                        fontWeight: isSel ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{item.label}</span>
                      <span
                        style={{
                          background: isSel ? item.color : 'rgba(255, 255, 255, 0.1)',
                          color: isSel ? '#101A35' : '#DCE3E5',
                          borderRadius: '9999px',
                          padding: '1px 6px',
                          fontSize: '0.68rem',
                          fontWeight: 800
                        }}
                      >
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search and Department Filter Bar */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '18px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ flex: '1 1 300px', position: 'relative' }}>
                <Search
                  size={15}
                  color="#A8B3C2"
                  style={{ position: 'absolute', left: '12px', top: '11px', pointerEvents: 'none' }}
                />
                <input
                  type="text"
                  value={paymentSearch}
                  onChange={e => setPaymentSearch(e.target.value)}
                  placeholder="Search student, roll number, Txn ID, event, or reg ID..."
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '8px',
                    background: 'rgba(16, 26, 53, 0.85)',
                    border: '1px solid rgba(220, 227, 229, 0.2)',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ flex: '0 0 200px' }}>
                <select
                  value={paymentDeptFilter}
                  onChange={e => setPaymentDeptFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(16, 26, 53, 0.85)',
                    border: '1px solid rgba(220, 227, 229, 0.2)',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="all">All Departments ({departments.length})</option>
                  {departments.map(d => (
                    <option key={d.code} value={d.code}>
                      {d.code} — {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Transactions List */}
            {filteredPayments.length === 0 ? (
              <div
                style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  background: 'rgba(20, 31, 62, 0.6)',
                  border: '1px dashed rgba(220, 227, 229, 0.2)',
                  borderRadius: '16px'
                }}
              >
                <CheckCircle2 size={40} color={paymentStatusFilter === 'pending' ? '#34D399' : '#789593'} style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1.1rem', color: '#FFFFFF', margin: '0 0 6px' }}>
                  {paymentStatusFilter === 'pending' ? 'All Pending Payments Verified!' : 'No Matching Transactions'}
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#A8B3C2', margin: 0 }}>
                  {paymentStatusFilter === 'pending'
                    ? 'There are no pending student transactions awaiting approval.'
                    : 'Try clearing your search query or department filter.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredPayments.map(reg => {
                  const regDept = StorageService.resolveDepartmentForRegistration(reg, events);
                  return (
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
                        gap: '16px',
                        transition: 'border-color 0.2s'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#BACEBB', fontFamily: 'monospace' }}>
                            {reg.id}
                          </span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'rgba(40, 59, 120, 0.45)',
                              border: '1px solid rgba(120, 149, 147, 0.35)',
                              color: '#DCE3E5',
                              fontWeight: 700
                            }}
                          >
                            {regDept}
                          </span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background:
                                reg.paymentStatus === 'verified'
                                  ? 'rgba(52, 211, 153, 0.15)'
                                  : reg.paymentStatus === 'verification_pending'
                                  ? 'rgba(251, 191, 36, 0.15)'
                                  : 'rgba(239, 68, 68, 0.15)',
                              border:
                                reg.paymentStatus === 'verified'
                                  ? '1px solid rgba(52, 211, 153, 0.4)'
                                  : reg.paymentStatus === 'verification_pending'
                                  ? '1px solid rgba(251, 191, 36, 0.4)'
                                  : '1px solid rgba(239, 68, 68, 0.4)',
                              color:
                                reg.paymentStatus === 'verified'
                                  ? '#34D399'
                                  : reg.paymentStatus === 'verification_pending'
                                  ? '#FBBF24'
                                  : '#f87171',
                              fontWeight: 700
                            }}
                          >
                            {reg.paymentStatus === 'verified'
                              ? 'VERIFIED PASS'
                              : reg.paymentStatus === 'verification_pending'
                              ? 'NEEDS REVIEW'
                              : 'REJECTED'}
                          </span>
                          {reg.checkedIn && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: 'rgba(52, 211, 153, 0.15)',
                                border: '1px solid rgba(52, 211, 153, 0.3)',
                                color: '#34D399',
                                fontWeight: 700
                              }}
                            >
                              GATE CHECKED-IN
                            </span>
                          )}
                        </div>

                        <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>
                          {reg.leaderName} <span style={{ color: '#DCE3E5', fontFamily: 'monospace' }}>({reg.leaderRoll})</span> — {reg.eventTitle}
                        </h4>

                        <div style={{ fontSize: '0.78rem', color: '#A8B3C2' }}>
                          Txn ID: <strong style={{ color: '#DCE3E5' }}>{reg.transactionId || 'Unspecified'}</strong> • Amount: <strong style={{ color: '#BACEBB' }}>₹{reg.fee}</strong> • Phone: {reg.leaderPhone} • College: {reg.leaderCollege}
                        </div>

                        {reg.rejectionReason && (
                          <div style={{ fontSize: '0.74rem', color: '#fca5a5', marginTop: '4px' }}>
                            Reason for rejection: <em>"{reg.rejectionReason}"</em>
                          </div>
                        )}
                        {reg.verifiedBy && reg.paymentStatus === 'verified' && (
                          <div style={{ fontSize: '0.72rem', color: '#BACEBB', marginTop: '4px' }}>
                            Approved by: {reg.verifiedBy} {reg.verifiedAt ? `on ${reg.verifiedAt}` : ''}
                          </div>
                        )}
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

                        {reg.paymentStatus === 'verification_pending' ? (
                          <>
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
                          </>
                        ) : reg.paymentStatus === 'verified' ? (
                          <button
                            onClick={() => {
                              const reason = prompt('Enter reason for revoking pass:') || 'Verification revoked by Central SAC.';
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
                            <span>Revoke Approval</span>
                          </button>
                        ) : (
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
                            <span>Re-Approve Pass</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                  Create, configure, edit, and control gates for events across all academic divisions (PRD 6.3)
                </p>
              </div>

              {/* Primary Action Button: + Create New Fest Event */}
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
                <span>+ Create New Fest Event</span>
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
              <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                <Search size={15} color="#789593" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input
                  type="text"
                  placeholder="Search events by title, description, coordinator..."
                  value={eventSearch}
                  onChange={e => setEventSearch(e.target.value)}
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
                value={eventDeptFilter}
                onChange={e => setEventDeptFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(16, 26, 53, 0.9)',
                  border: '1px solid rgba(220, 227, 229, 0.2)',
                  color: '#FFFFFF',
                  fontSize: '0.82rem'
                }}
              >
                <option value="all">All Departments ({departments.length})</option>
                {departments.map(d => (
                  <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
                ))}
                <option value="SAC">SAC Central</option>
              </select>

              <select
                value={eventStatusFilter}
                onChange={e => setEventStatusFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(16, 26, 53, 0.9)',
                  border: '1px solid rgba(220, 227, 229, 0.2)',
                  color: '#FFFFFF',
                  fontSize: '0.82rem'
                }}
              >
                <option value="all">All States</option>
                <option value="open">Open (Published)</option>
                <option value="closed">Closed</option>
                <option value="pending_approval">Pending SAC Approval</option>
              </select>

              <select
                value={eventCategoryFilter}
                onChange={e => setEventCategoryFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(16, 26, 53, 0.9)',
                  border: '1px solid rgba(220, 227, 229, 0.2)',
                  color: '#FFFFFF',
                  fontSize: '0.82rem'
                }}
              >
                <option value="all">All Categories</option>
                <option value="technical">Technical</option>
                <option value="workshop">Workshop</option>
                <option value="hackathon">Hackathon</option>
                <option value="gaming">Gaming</option>
                <option value="non-technical">Non-Technical</option>
                <option value="departmental">Departmental</option>
              </select>
            </div>

            {/* Events Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {filteredEvents.map(event => (
                <div
                  key={event.id}
                  style={{
                    background: 'rgba(20, 31, 62, 0.85)',
                    border: '1px solid rgba(220, 227, 229, 0.16)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
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
                        {event.departmentCode} • {event.category.toUpperCase()} • {event.format.toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: event.status === 'open' 
                            ? 'rgba(52, 211, 153, 0.15)' 
                            : event.status === 'pending_approval'
                            ? 'rgba(251, 191, 36, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                          border: `1px solid ${
                            event.status === 'open' 
                              ? 'rgba(52, 211, 153, 0.4)' 
                              : event.status === 'pending_approval'
                              ? 'rgba(251, 191, 36, 0.4)'
                              : 'rgba(239, 68, 68, 0.4)'
                          }`,
                          color: event.status === 'open' ? '#34D399' : event.status === 'pending_approval' ? '#FBBF24' : '#f87171'
                        }}
                      >
                        {event.status === 'pending_approval' ? 'PENDING APPROVAL' : event.status.toUpperCase()}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px' }}>
                      {event.title}
                    </h4>
                    {event.tagline && (
                      <p style={{ fontSize: '0.76rem', color: '#BACEBB', margin: '0 0 6px', fontStyle: 'italic' }}>
                        "{event.tagline}"
                      </p>
                    )}
                    <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '0 0 10px', lineHeight: 1.5 }}>
                      {event.description.slice(0, 110)}...
                    </p>

                    <div style={{ fontSize: '0.74rem', color: '#DCE3E5', marginBottom: '4px' }}>
                      👤 Coordinator: <strong>{event.coordinatorName}</strong> {event.coordinatorPhone && `(${event.coordinatorPhone})`}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#A8B3C2', marginBottom: '10px' }}>
                      📍 {event.venue} • 🗓️ {event.date} • {event.time}
                    </div>

                    {/* Progress Bar for Registration Capacity */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#A8B3C2', marginBottom: '4px' }}>
                        <span>Capacity Utilization</span>
                        <strong style={{ color: '#DCE3E5' }}>{event.registeredCount} / {event.capacity} seats</strong>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, (event.registeredCount / event.capacity) * 100)}%`,
                            height: '100%',
                            background: event.registeredCount >= event.capacity ? '#EF4444' : '#34D399',
                            borderRadius: '999px'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(220, 227, 229, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', color: '#DCE3E5' }}>
                      Fee: <strong style={{ color: '#BACEBB' }}>{event.fee === 0 ? 'FREE' : `₹${event.fee}`}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {event.status === 'pending_approval' && (
                        <button
                          onClick={() => handleApproveEvent(event)}
                          style={{
                            background: 'rgba(52, 211, 153, 0.2)',
                            border: '1px solid #34D399',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            color: '#34D399',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          ✓ Approve
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleEventStatus(event)}
                        style={{
                          background: event.status === 'open' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                          border: `1px solid ${event.status === 'open' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(52, 211, 153, 0.4)'}`,
                          borderRadius: '6px',
                          padding: '6px 8px',
                          color: event.status === 'open' ? '#fca5a5' : '#34D399',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {event.status === 'open' ? 'Close Gate' : 'Open Gate'}
                      </button>

                      <button
                        onClick={() => setEditingEvent(event)}
                        style={{
                          background: 'rgba(40, 59, 120, 0.4)',
                          border: '1px solid rgba(120, 149, 147, 0.4)',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          color: '#DCE3E5',
                          fontSize: '0.72rem',
                          cursor: 'pointer'
                        }}
                        title="Edit Event Details"
                      >
                        <Edit3 size={13} />
                      </button>

                      <button
                        onClick={() => handleDeleteEvent(event)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          color: '#f87171',
                          fontSize: '0.72rem',
                          cursor: 'pointer'
                        }}
                        title="Delete Event"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: EVENT COORDINATORS DIRECTORY & APPOINTMENTS */}
        {activeTab === 'coordinators' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="font-title" style={{ fontSize: '1.15rem', color: '#FFFFFF', margin: 0 }}>
                  SAC Official Coordinator Registry & Appointments
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                  Assign faculty conveners, HODs, and student organizers to fest events with custom access credentials
                </p>
              </div>

              {/* Dedicated Action Buttons for Payment Users, HODs, and Event Coordinators */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setCoordRole('finance_reviewer');
                    setCoordDeptCode('FINANCE');
                    setCoordFullName('');
                    setCoordDesignation('Central Payment Review Officer');
                    setCoordEmail('accounts.fest@vardhaman.org');
                    setCoordPhone('+91 98480 55001');
                    setCoordUsername('finance_desk_' + Math.floor(100 + Math.random() * 900));
                    setCoordPassword('finance2026');
                    setIsAddCoordinatorOpen(true);
                  }}
                  className="btn-cyber-primary"
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                  }}
                >
                  <Plus size={14} />
                  <span>+ Create Payment User</span>
                </button>

                <button
                  onClick={() => {
                    const firstDept = departments[0]?.code || 'CSE';
                    setCoordRole('dept_chief_coordinator');
                    setCoordDeptCode(firstDept);
                    setCoordFullName('');
                    setCoordDesignation(`Department Chief Coordinator (${firstDept})`);
                    setCoordEmail(`${firstDept.toLowerCase()}.festronix@vardhaman.org`);
                    setCoordPhone('+91 ');
                    setCoordUsername(`hod_${firstDept.toLowerCase()}`);
                    setCoordPassword(`${firstDept.toLowerCase()}2026`);
                    setIsAddCoordinatorOpen(true);
                  }}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Building2 size={14} />
                  <span>+ Appoint Department HOD</span>
                </button>

                <button
                  onClick={() => {
                    setCoordRole('event_coordinator');
                    setCoordDeptCode(departments[0]?.code || 'CSE');
                    setCoordFullName('');
                    setCoordDesignation('Lead Event Operations Coordinator');
                    setCoordEmail('');
                    setCoordPhone('+91 ');
                    setCoordUsername('');
                    setCoordPassword('eventcoord2026');
                    setIsAddCoordinatorOpen(true);
                  }}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <UserPlus size={14} />
                  <span>+ Create Event Coordinator</span>
                </button>

                <button
                  onClick={() => {
                    setCoordRole('faculty_coord');
                    setCoordDeptCode(departments[0]?.code || 'CSE');
                    setCoordFullName('');
                    setCoordDesignation('Faculty Event Convener');
                    setCoordEmail('');
                    setCoordPhone('+91 ');
                    setCoordUsername('');
                    setCoordPassword('festcoord2026');
                    setIsAddCoordinatorOpen(true);
                  }}
                  className="btn-cyber-primary"
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px'
                  }}
                >
                  <UserPlus size={14} />
                  <span>+ Appoint Coordinator</span>
                </button>
              </div>
            </div>

            {/* Quick Role Categorization Pills */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
              {[
                { id: 'all', label: '👥 All Staff', count: coordinators.length },
                { id: 'finance_reviewer', label: '💳 Payment Users', count: coordinators.filter(c => c.role === 'finance_reviewer').length },
                { id: 'dept_chief_coordinator', label: '🏛️ Department HODs', count: coordinators.filter(c => c.role === 'dept_chief_coordinator' || c.role === 'dept_coordinator').length },
                { id: 'faculty_coord', label: '🎯 Event Coordinators', count: coordinators.filter(c => c.role === 'faculty_coord' || c.role === 'student_coord' || c.role === 'event_coordinator').length },
                { id: 'volunteer_checkin', label: '🎟️ Gate Volunteers', count: coordinators.filter(c => c.role === 'volunteer_checkin' || c.role === 'checkin_staff').length }
              ].map(pill => {
                const isSelected = coordRoleFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => setCoordRoleFilter(pill.id)}
                    style={{
                      background: isSelected ? 'rgba(52, 211, 153, 0.2)' : 'rgba(20, 31, 62, 0.7)',
                      border: isSelected ? '1px solid #34D399' : '1px solid rgba(220, 227, 229, 0.15)',
                      borderRadius: '20px',
                      padding: '5px 12px',
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? '#34D399' : '#DCE3E5',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{pill.label}</span>
                    <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '10px', background: isSelected ? 'rgba(52, 211, 153, 0.3)' : 'rgba(255, 255, 255, 0.1)' }}>
                      {pill.count}
                    </span>
                  </button>
                );
              })}
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
                  placeholder="Search by name, designation, email, username..."
                  value={coordSearch}
                  onChange={e => setCoordSearch(e.target.value)}
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
                value={coordDeptFilter}
                onChange={e => setCoordDeptFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(16, 26, 53, 0.9)',
                  border: '1px solid rgba(220, 227, 229, 0.2)',
                  color: '#FFFFFF',
                  fontSize: '0.82rem'
                }}
              >
                <option value="all">All Departments ({departments.length})</option>
                {departments.map(d => (
                  <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
                ))}
                <option value="SAC">SAC Central</option>
                <option value="FINANCE">Finance Desk</option>
              </select>

              <select
                value={coordRoleFilter}
                onChange={e => setCoordRoleFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(16, 26, 53, 0.9)',
                  border: '1px solid rgba(220, 227, 229, 0.2)',
                  color: '#FFFFFF',
                  fontSize: '0.82rem'
                }}
              >
                <option value="all">All Roles</option>
                <option value="dept_chief_coordinator">Department HOD / Chief</option>
                <option value="finance_reviewer">Payment Reviewer (Finance Desk)</option>
                <option value="faculty_coord">Faculty Event Convener</option>
                <option value="student_coord">Student Lead Organizer</option>
                <option value="volunteer_checkin">Volunteer Gate Staff</option>
                <option value="dean_sac">Dean SAC / Super Admin</option>
              </select>
            </div>

            {/* Coordinators Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {filteredCoordinators.map(coord => {
                const isCustom = coord.id.startsWith('coord_') || coord.id.startsWith('reviewer_') || coord.id.startsWith('hod_') || coord.id.startsWith('volunteer_');
                const isSelf = coord.id === adminUser.id;
                const isFinance = coord.role === 'finance_reviewer';
                const isHod = coord.role === 'dept_chief_coordinator' || coord.role === 'dept_coordinator';

                return (
                  <div
                    key={coord.id}
                    style={{
                      background: 'rgba(20, 31, 62, 0.85)',
                      border: isFinance 
                        ? '1px solid rgba(52, 211, 153, 0.35)' 
                        : isHod 
                        ? '1px solid rgba(168, 85, 247, 0.35)' 
                        : '1px solid rgba(220, 227, 229, 0.16)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: 'rgba(40, 59, 120, 0.6)',
                              border: '1px solid rgba(120, 149, 147, 0.4)',
                              color: '#BACEBB'
                            }}
                          >
                            {coord.departmentCode || (isFinance ? 'FINANCE' : 'CENTRAL')}
                          </span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: isFinance 
                                ? 'rgba(52, 211, 153, 0.15)' 
                                : isHod 
                                ? 'rgba(168, 85, 247, 0.15)' 
                                : isCustom 
                                ? 'rgba(52, 211, 153, 0.15)' 
                                : 'rgba(251, 191, 36, 0.15)',
                              border: isFinance 
                                ? '1px solid rgba(52, 211, 153, 0.35)' 
                                : isHod 
                                ? '1px solid rgba(168, 85, 247, 0.35)' 
                                : 'none',
                              color: isFinance 
                                ? '#34D399' 
                                : isHod 
                                ? '#C084FC' 
                                : isCustom 
                                ? '#34D399' 
                                : '#FBBF24'
                            }}
                          >
                            {isFinance ? '💳 PAYMENT REVIEWER' : isHod ? '🏛️ DEPT HOD' : coord.role.toUpperCase().replace('_', ' ')}
                          </span>
                        </div>

                        {!isSelf && (
                          <button
                            onClick={() => handleDeleteCoordinator(coord.id, coord.fullName, isHod ? 'Department HOD' : isFinance ? 'Payment Reviewer' : 'Event Coordinator')}
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              borderRadius: '6px',
                              color: '#f87171',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 600
                            }}
                            title="Delete coordinator account"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>

                      {/* Name & Designation */}
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 2px' }}>
                        {coord.fullName}
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: isHod ? '#C084FC' : isFinance ? '#34D399' : '#BACEBB', margin: '0 0 12px' }}>
                        {coord.designation}
                      </p>

                      {/* Contact Info */}
                      <div
                        style={{
                          background: 'rgba(16, 26, 53, 0.7)',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(220, 227, 229, 0.1)',
                          marginBottom: '12px',
                          fontSize: '0.76rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DCE3E5' }}>
                          <Mail size={13} color="#789593" />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{coord.email}</span>
                        </div>
                        {coord.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DCE3E5' }}>
                            <Phone size={13} color="#789593" />
                            <span>{coord.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Portal Credentials Box */}
                      <div
                        style={{
                          background: 'rgba(40, 59, 120, 0.25)',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(120, 149, 147, 0.3)',
                          fontSize: '0.74rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ color: '#A8B3C2' }}>Portal Username:</span>
                          <span style={{ color: '#FFFFFF', fontFamily: 'monospace', fontWeight: 700 }}>{coord.username}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#A8B3C2' }}>Access Key:</span>
                          <span style={{ color: '#34D399', fontFamily: 'monospace', fontWeight: 700 }}>
                            {coord.password || `${(coord.departmentCode || 'sac').toLowerCase()}2026`}
                          </span>
                        </div>
                      </div>

                      {/* Assigned Events Chips */}
                      {coord.assignedEvents && coord.assignedEvents.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#A8B3C2', display: 'block', marginBottom: '4px' }}>
                            Assigned Events:
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {coord.assignedEvents.map((evt, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '0.66rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(120, 149, 147, 0.2)',
                                  color: '#BACEBB'
                                }}
                              >
                                {evt}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Buttons: Edit, Copy, Delete */}
                    <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(220, 227, 229, 0.1)', display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleOpenEditCoordinator(coord)}
                        style={{
                          background: 'rgba(59, 130, 246, 0.15)',
                          border: '1px solid rgba(59, 130, 246, 0.35)',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          color: '#60A5FA',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                        title="Update details and password"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => {
                          const creds = `FESTRONIX 2026 Credentials:\nRole: ${coord.role}\nName: ${coord.fullName}\nPortal: http://localhost:5173/#admin\nDepartment: ${coord.departmentCode || 'CENTRAL'}\nUsername: ${coord.username}\nPasscode: ${coord.password || `${(coord.departmentCode || 'sac').toLowerCase()}2026`}`;
                          handleCopyText(creds, coord.id);
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(220, 227, 229, 0.2)',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          color: copiedId === coord.id ? '#34D399' : '#DCE3E5',
                          fontSize: '0.74rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        {copiedId === coord.id ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedId === coord.id ? 'Copied' : 'Credentials'}</span>
                      </button>

                      {!isSelf && (
                        <button
                          onClick={() => handleDeleteCoordinator(coord.id, coord.fullName, isHod ? 'Department HOD' : isFinance ? 'Payment Reviewer' : 'Event Coordinator')}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            color: '#f87171',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                          }}
                          title="Permanently Delete Coordinator"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: CAMPUS BULLETINS BROADCAST */}
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

        {/* TAB 6: MASTER STUDENT ROSTER & GATE ATTENDANCE */}
        {(activeTab === 'roster' || activeTab === 'registrations') && (
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
                  Complete database of registered delegates, pass states, credentials, and live gate attendance toggles
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
                  placeholder="Search by student name, roll number, team code, or event..."
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
                <option value="all">All Departments ({departments.length})</option>
                {departments.map(d => (
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

              <select
                value={rosterCheckInFilter}
                onChange={e => setRosterCheckInFilter(e.target.value as any)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(16, 26, 53, 0.9)',
                  border: '1px solid rgba(220, 227, 229, 0.2)',
                  color: '#FFFFFF',
                  fontSize: '0.82rem'
                }}
              >
                <option value="all">All Attendance</option>
                <option value="checked_in">Checked In Only</option>
                <option value="not_checked_in">Not Arrived</option>
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
                    <th style={{ padding: '12px 16px' }}>Gate Check-In (Live Toggle)</th>
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
                        <div style={{ fontSize: '0.72rem', color: '#A8B3C2' }}>{r.leaderEmail} • {r.leaderPhone}</div>
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
                        <button
                          onClick={() => handleToggleCheckIn(r.id)}
                          style={{
                            fontSize: '0.72rem',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: r.checkedIn ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                            border: `1px solid ${r.checkedIn ? 'rgba(52, 211, 153, 0.4)' : 'rgba(220, 227, 229, 0.2)'}`,
                            color: r.checkedIn ? '#34D399' : '#A8B3C2'
                          }}
                          title={r.checkedIn ? 'Click to revert check-in status' : 'Click to grant gate admission'}
                        >
                          {r.checkedIn ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                          <span>{r.checkedIn ? `CHECKED IN (${r.checkedInAt || 'Gate'})` : '+ CHECK IN NOW'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: 3. USERS AND ORGANISATIONAL STRUCTURE */}
        {(activeTab === 'structure' || activeTab === 'users') && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h3 className="font-title" style={{ fontSize: '1.25rem', color: '#FFFFFF', margin: 0 }}>
                    3. Users and Organisational Structure
                  </h3>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      background: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      color: '#fbbf24',
                      padding: '2px 8px',
                      borderRadius: '9999px'
                    }}
                  >
                    👑 3 SUPER ADMIN BODIES ACTIVE
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#A8B3C2', margin: 0 }}>
                  Formal operational hierarchy, responsibilities, and access boundaries as specified in FESTRONIX 2026 Charter.
                </p>
              </div>
            </div>

            {/* 3 Super Admins Spotlight Box */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(40, 59, 120, 0.45) 0%, rgba(20, 31, 62, 0.8) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '16px',
                padding: '20px 24px',
                marginBottom: '24px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Award size={22} color="#fbbf24" />
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#FFFFFF', fontWeight: 800 }}>
                  3 Super Admins • Fest-wide Administration
                </h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#DCE3E5', lineHeight: 1.5, margin: '0 0 16px' }}>
                As configured, there are exactly <strong>3 Super Admins</strong> governing the entire technical festival across all 9 academic departments, finance verification, participant registries, content, and gate operations:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div style={{ background: 'rgba(16, 26, 53, 0.85)', border: '1px solid rgba(220, 227, 229, 0.15)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase' }}>Super Admin 1</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>SAC DEAN</div>
                  <div style={{ fontSize: '0.76rem', color: '#A8B3C2' }}>Md. Asif • Dean, SAC</div>
                  <div style={{ fontSize: '0.72rem', color: '#789593', marginTop: '6px' }}>Fest-wide administration</div>
                </div>

                <div style={{ background: 'rgba(16, 26, 53, 0.85)', border: '1px solid rgba(220, 227, 229, 0.15)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase' }}>Super Admin 2</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>CONNECT CLUB</div>
                  <div style={{ fontSize: '0.76rem', color: '#A8B3C2' }}>Aditya Varma & Core Team • Media & Organizing</div>
                  <div style={{ fontSize: '0.72rem', color: '#789593', marginTop: '6px' }}>Fest-wide administration</div>
                </div>

                <div style={{ background: 'rgba(16, 26, 53, 0.85)', border: '1px solid rgba(220, 227, 229, 0.15)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase' }}>Super Admin 3</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>VENCORPIA</div>
                  <div style={{ fontSize: '0.76rem', color: '#A8B3C2' }}>Executive Leadership Board • Tech & Innovation</div>
                  <div style={{ fontSize: '0.72rem', color: '#789593', marginTop: '6px' }}>Fest-wide administration</div>
                </div>
              </div>
            </div>

            {/* Complete Roles Matrix Table */}
            <div style={{ background: 'rgba(20, 31, 62, 0.85)', border: '1px solid rgba(220, 227, 229, 0.18)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(220, 227, 229, 0.12)', background: 'rgba(40, 59, 120, 0.35)' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#FFFFFF', fontWeight: 700 }}>
                  Official FESTRONIX Roles & Access Boundaries
                </h4>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(120, 149, 147, 0.35)', color: '#DCE3E5' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 700, width: '22%' }}>Role</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, width: '45%' }}>Responsibilities</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, width: '33%' }}>Access boundary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ORGANISATIONAL_STRUCTURE.map((item, idx) => {
                      const isSuper = item.scopeTag === 'super_admin';
                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid rgba(220, 227, 229, 0.08)',
                            background: isSuper ? 'rgba(245, 158, 11, 0.07)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.88rem' }}>
                              {item.role}
                            </div>
                            {isSuper && (
                              <div style={{ fontSize: '0.72rem', color: '#fbbf24', marginTop: '4px', fontWeight: 700 }}>
                                (SAC DEAN, CONNECT CLUB, VENCORPIA)
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#DCE3E5', lineHeight: 1.5, verticalAlign: 'top' }}>
                            {item.responsibilities}
                            {item.accounts && (
                              <div style={{ marginTop: '8px', fontSize: '0.74rem', color: '#A8B3C2' }}>
                                <strong style={{ color: '#789593' }}>Active Portals: </strong>
                                {item.accounts.join(' • ')}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                background: isSuper ? 'rgba(245, 158, 11, 0.2)' : 'rgba(40, 59, 120, 0.4)',
                                color: isSuper ? '#fbbf24' : '#BACEBB',
                                border: isSuper ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(120, 149, 147, 0.3)'
                              }}
                            >
                              {item.accessBoundary}
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
      </main>

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW FEST EVENT (PRD 6.3)                                     */}
      {/* ========================================================================= */}
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
            padding: '20px',
            overflowY: 'auto'
          }}
          onClick={() => setIsAddEventOpen(false)}
        >
          <div
            style={{
              maxWidth: '720px',
              width: '100%',
              background: '#142042',
              borderRadius: '18px',
              padding: '28px',
              border: '1px solid rgba(120, 149, 147, 0.35)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="font-title" style={{ fontSize: '1.25rem', color: '#FFFFFF', margin: 0 }}>
                  Create New Fest Event
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                  Complies with PRD Section 6.3 Event Configuration Specifications
                </p>
              </div>
              <button
                onClick={() => setIsAddEventOpen(false)}
                style={{ background: 'none', border: 'none', color: '#A8B3C2', cursor: 'pointer', fontSize: '1.4rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewEvent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Department & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Academic Department *
                  </label>
                  <select
                    value={evtDeptCode}
                    onChange={e => setEvtDeptCode(e.target.value)}
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
                    {departments.map(d => (
                      <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
                    ))}
                    <option value="SAC">SAC Central Oversight</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Event Category *
                  </label>
                  <select
                    value={evtCategory}
                    onChange={e => setEvtCategory(e.target.value as any)}
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
                    <option value="technical">Technical Challenge</option>
                    <option value="hackathon">Hackathon / Sprint</option>
                    <option value="workshop">Hands-on Workshop</option>
                    <option value="gaming">Esports & Gaming</option>
                    <option value="non-technical">Non-Technical Showcase</option>
                    <option value="departmental">Departmental Flagship</option>
                  </select>
                </div>
              </div>

              {/* Event Title & Slug */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={evtTitle}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="e.g. RoboWars Arena 2026"
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
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={evtSlug}
                    onChange={e => setEvtSlug(e.target.value)}
                    placeholder="robowars-arena"
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
              </div>

              {/* Tagline */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                  Tagline / Catchphrase
                </label>
                <input
                  type="text"
                  value={evtTagline}
                  onChange={e => setEvtTagline(e.target.value)}
                  placeholder="e.g. Where metal clashes and only the smartest bot survives"
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

              {/* Participation Format & Team Sizing (FR-EVT-03, FR-EVT-04) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Format *
                  </label>
                  <select
                    value={evtFormat}
                    onChange={e => setEvtFormat(e.target.value as any)}
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
                    <option value="individual">Solo / Individual</option>
                    <option value="duo">Duo (Pair of 2)</option>
                    <option value="team">Team (Configurable Squad)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Min Team Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={evtMinTeamSize}
                    onChange={e => setEvtMinTeamSize(Number(e.target.value))}
                    disabled={evtFormat !== 'team'}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(16, 26, 53, 0.9)',
                      border: '1px solid rgba(220, 227, 229, 0.25)',
                      color: evtFormat === 'team' ? '#FFFFFF' : '#A8B3C2',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Max Team Size
                  </label>
                  <input
                    type="number"
                    min={evtMinTeamSize}
                    max={12}
                    value={evtMaxTeamSize}
                    onChange={e => setEvtMaxTeamSize(Number(e.target.value))}
                    disabled={evtFormat !== 'team'}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(16, 26, 53, 0.9)',
                      border: '1px solid rgba(220, 227, 229, 0.25)',
                      color: evtFormat === 'team' ? '#FFFFFF' : '#A8B3C2',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Fee, Capacity & Deadline (FR-EVT-05, FR-EVT-06) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Entry Fee (₹ INR)
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={evtFee}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setEvtFee(val);
                        setEvtIsFree(val === 0);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(16, 26, 53, 0.9)',
                        border: '1px solid rgba(220, 227, 229, 0.25)',
                        color: '#BACEBB',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Seat / Team Capacity *
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={500}
                    value={evtCapacity}
                    onChange={e => setEvtCapacity(Number(e.target.value))}
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
                    Registration Deadline *
                  </label>
                  <input
                    type="date"
                    value={evtDeadline}
                    onChange={e => setEvtDeadline(e.target.value)}
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
              </div>

              {/* Venue & Schedule */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Event Date *
                  </label>
                  <input
                    type="date"
                    value={evtDate}
                    onChange={e => setEvtDate(e.target.value)}
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
                    Time Slot *
                  </label>
                  <input
                    type="text"
                    value={evtTime}
                    onChange={e => setEvtTime(e.target.value)}
                    placeholder="10:00 AM - 01:00 PM"
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
                    Venue / Hall *
                  </label>
                  <input
                    type="text"
                    value={evtVenue}
                    onChange={e => setEvtVenue(e.target.value)}
                    placeholder="Main Auditorium / CSE Lab 3"
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
              </div>

              {/* Assigned Coordinator (FR-EVT-01, FR-EVT-02) */}
              <div style={{ background: 'rgba(16, 26, 53, 0.6)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(220, 227, 229, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.82rem', color: '#BACEBB', fontWeight: 700 }}>
                    Assigned Event Coordinator (FR-EVT-01)
                  </label>
                  <select
                    value={evtCoordinatorChoice}
                    onChange={e => {
                      const selectedId = e.target.value;
                      setEvtCoordinatorChoice(selectedId);
                      if (selectedId !== 'custom') {
                        const targetCoord = coordinators.find(c => c.id === selectedId);
                        if (targetCoord) {
                          setEvtCoordinatorName(targetCoord.fullName);
                          setEvtCoordinatorPhone(targetCoord.phone || '');
                          setEvtCoordinatorEmail(targetCoord.email);
                        }
                      }
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: 'rgba(20, 31, 62, 0.9)',
                      border: '1px solid rgba(120, 149, 147, 0.4)',
                      color: '#FFFFFF',
                      fontSize: '0.78rem'
                    }}
                  >
                    <option value="custom">-- Enter Custom Coordinator --</option>
                    {coordinators.map(c => (
                      <option key={c.id} value={c.id}>{c.fullName} ({c.departmentCode} - {c.designation})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <input
                    type="text"
                    value={evtCoordinatorName}
                    onChange={e => setEvtCoordinatorName(e.target.value)}
                    placeholder="Coordinator Full Name"
                    required
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'rgba(20, 31, 62, 0.9)',
                      border: '1px solid rgba(220, 227, 229, 0.2)',
                      color: '#FFFFFF',
                      fontSize: '0.8rem'
                    }}
                  />
                  <input
                    type="text"
                    value={evtCoordinatorPhone}
                    onChange={e => setEvtCoordinatorPhone(e.target.value)}
                    placeholder="Phone: +91 98480 22000"
                    required
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'rgba(20, 31, 62, 0.9)',
                      border: '1px solid rgba(220, 227, 229, 0.2)',
                      color: '#FFFFFF',
                      fontSize: '0.8rem'
                    }}
                  />
                  <input
                    type="email"
                    value={evtCoordinatorEmail}
                    onChange={e => setEvtCoordinatorEmail(e.target.value)}
                    placeholder="Official Email"
                    required
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'rgba(20, 31, 62, 0.9)',
                      border: '1px solid rgba(220, 227, 229, 0.2)',
                      color: '#FFFFFF',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>
              </div>

              {/* Description & Rules */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                  Event Detailed Description *
                </label>
                <textarea
                  rows={3}
                  value={evtDescription}
                  onChange={e => setEvtDescription(e.target.value)}
                  placeholder="Comprehensive event brief, problem statement, evaluation criteria..."
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

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                  Rules & Regulations (One per line)
                </label>
                <textarea
                  rows={3}
                  value={evtRules}
                  onChange={e => setEvtRules(e.target.value)}
                  placeholder="Enter each rule on a new line"
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

              {/* Direct Publishing vs SAC Approval Policy (FR-EVT-08) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(40, 59, 120, 0.3)', padding: '12px 16px', borderRadius: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', display: 'block' }}>
                    Publishing Governance Policy (FR-EVT-08)
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#A8B3C2' }}>
                    {evtPublishStatus === 'open' ? 'Live immediately on website for registration' : 'Saved as draft pending Dean SAC executive sign-off'}
                  </span>
                </div>
                <select
                  value={evtPublishStatus}
                  onChange={e => setEvtPublishStatus(e.target.value as any)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: evtPublishStatus === 'open' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                    border: `1px solid ${evtPublishStatus === 'open' ? '#34D399' : '#FBBF24'}`,
                    color: evtPublishStatus === 'open' ? '#34D399' : '#FBBF24',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}
                >
                  <option value="open">Direct Publish (Live)</option>
                  <option value="pending_approval">Pending SAC Approval</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddEventOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(220, 227, 229, 0.2)',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    color: '#DCE3E5',
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cyber-primary"
                  style={{
                    borderRadius: '10px',
                    padding: '10px 24px',
                    fontSize: '0.86rem',
                    fontWeight: 700
                  }}
                >
                  Create & Launch Fest Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT FEST EVENT                                                    */}
      {/* ========================================================================= */}
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
            padding: '20px',
            overflowY: 'auto'
          }}
          onClick={() => setEditingEvent(null)}
        >
          <div
            style={{
              maxWidth: '680px',
              width: '100%',
              background: '#142042',
              borderRadius: '18px',
              padding: '28px',
              border: '1px solid rgba(120, 149, 147, 0.35)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="font-title" style={{ fontSize: '1.2rem', color: '#FFFFFF', margin: 0 }}>
                Edit Event: {editingEvent.title}
              </h3>
              <button
                onClick={() => setEditingEvent(null)}
                style={{ background: 'none', border: 'none', color: '#A8B3C2', cursor: 'pointer', fontSize: '1.4rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                  Event Title
                </label>
                <input
                  type="text"
                  value={editingEvent.title}
                  onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={editingEvent.fee}
                    onChange={e => setEditingEvent({ ...editingEvent, fee: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(16, 26, 53, 0.9)',
                      border: '1px solid rgba(220, 227, 229, 0.25)',
                      color: '#BACEBB',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Seat Capacity
                  </label>
                  <input
                    type="number"
                    value={editingEvent.capacity}
                    onChange={e => setEditingEvent({ ...editingEvent, capacity: Number(e.target.value) })}
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
                    Status Gate
                  </label>
                  <select
                    value={editingEvent.status}
                    onChange={e => setEditingEvent({ ...editingEvent, status: e.target.value as any })}
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
                    <option value="open">Open (Active)</option>
                    <option value="closed">Closed</option>
                    <option value="pending_approval">Pending Approval</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Venue
                  </label>
                  <input
                    type="text"
                    value={editingEvent.venue}
                    onChange={e => setEditingEvent({ ...editingEvent, venue: e.target.value })}
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
                    Time Slot
                  </label>
                  <input
                    type="text"
                    value={editingEvent.time}
                    onChange={e => setEditingEvent({ ...editingEvent, time: e.target.value })}
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                  Assigned Coordinator Contact
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input
                    type="text"
                    value={editingEvent.coordinatorName}
                    onChange={e => setEditingEvent({ ...editingEvent, coordinatorName: e.target.value })}
                    placeholder="Name"
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'rgba(16, 26, 53, 0.9)',
                      border: '1px solid rgba(220, 227, 229, 0.2)',
                      color: '#FFFFFF',
                      fontSize: '0.8rem'
                    }}
                  />
                  <input
                    type="text"
                    value={editingEvent.coordinatorPhone}
                    onChange={e => setEditingEvent({ ...editingEvent, coordinatorPhone: e.target.value })}
                    placeholder="Phone"
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'rgba(16, 26, 53, 0.9)',
                      border: '1px solid rgba(220, 227, 229, 0.2)',
                      color: '#FFFFFF',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(220, 227, 229, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: '#DCE3E5',
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cyber-primary"
                  style={{
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '0.84rem',
                    fontWeight: 700
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APPOINT NEW COORDINATOR (PRD 6.3)                                  */}
      {/* ========================================================================= */}
      {isAddCoordinatorOpen && (
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
            padding: '20px',
            overflowY: 'auto'
          }}
          onClick={() => setIsAddCoordinatorOpen(false)}
        >
          <div
            style={{
              maxWidth: '620px',
              width: '100%',
              background: '#142042',
              borderRadius: '18px',
              padding: '28px',
              border: '1px solid rgba(120, 149, 147, 0.35)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="font-title" style={{ fontSize: '1.25rem', color: '#FFFFFF', margin: 0 }}>
                  Appoint Coordinator, Department HOD, or Operational Staff
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                  Create official credentials for Department HODs, Payment Reviewers, Faculty Conveners, or Event Organizers
                </p>
              </div>
              <button
                onClick={() => setIsAddCoordinatorOpen(false)}
                style={{ background: 'none', border: 'none', color: '#A8B3C2', cursor: 'pointer', fontSize: '1.4rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoordinator} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Name & Academic Designation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={coordFullName}
                    onChange={e => {
                      setCoordFullName(e.target.value);
                      if (!coordUsername) {
                        const sug = 'coord_' + e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
                        setCoordUsername(sug);
                      }
                    }}
                    placeholder="e.g. Dr. K. Radhika"
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
                    Academic / Desk Designation *
                  </label>
                  <input
                    type="text"
                    value={coordDesignation}
                    onChange={e => setCoordDesignation(e.target.value)}
                    placeholder="Associate Professor / Review Officer"
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
              </div>

              {/* Department & Role */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Department Division *
                  </label>
                  <select
                    value={coordDeptCode}
                    onChange={e => {
                      const newDept = e.target.value;
                      setCoordDeptCode(newDept);
                      if (coordRole === 'dept_chief_coordinator' || coordRole === 'dept_coordinator') {
                        setCoordDesignation(`Department Chief Coordinator (${newDept})`);
                        setCoordUsername(`hod_${newDept.toLowerCase()}`);
                        setCoordPassword(`${newDept.toLowerCase()}2026`);
                      }
                    }}
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
                    {departments.map(d => (
                      <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
                    ))}
                    <option value="SAC">SAC Central Team</option>
                    <option value="FINANCE">Finance & Accounts Desk</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Role Assignment *
                  </label>
                  <select
                    value={coordRole}
                    onChange={e => {
                      const newRole = e.target.value as AdminRole;
                      setCoordRole(newRole);
                      if (newRole === 'finance_reviewer') {
                        setCoordDeptCode('SAC');
                        setCoordDesignation('Central Payment Review Officer');
                        setCoordEmail('accounts.fest@vardhaman.org');
                        setCoordPhone('+91 98480 55001');
                        setCoordUsername('finance_reviewer');
                        setCoordPassword('finance2026');
                      } else if (newRole === 'dept_chief_coordinator' || newRole === 'dept_coordinator') {
                        setCoordDesignation(`Department Chief Coordinator (${coordDeptCode})`);
                        setCoordUsername(`hod_${coordDeptCode.toLowerCase()}`);
                        setCoordPassword(`${coordDeptCode.toLowerCase()}2026`);
                        setCoordEmail(`${coordDeptCode.toLowerCase()}.festronix@vardhaman.org`);
                      } else if (newRole === 'volunteer_checkin') {
                        setCoordDesignation('Gate Entry & Ticketing Volunteer');
                        setCoordUsername('volunteer_' + Math.floor(100 + Math.random() * 900));
                        setCoordPassword('volunteer2026');
                      }
                    }}
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
                    <option value="dept_chief_coordinator">🏛️ Department Chief Coordinator (HOD)</option>
                    <option value="finance_reviewer">💳 Central Payment Reviewer (Finance Desk)</option>
                    <option value="faculty_coord">⚡ Faculty Event Convener</option>
                    <option value="student_coord">🎓 Student Lead Organizer</option>
                    <option value="volunteer_checkin">🎟️ Gate Check-in & Ticketing Volunteer</option>
                    <option value="event_coordinator">🎯 Event Operations Coordinator</option>
                    <option value="dean_sac">👑 SAC Central Leadership</option>
                  </select>
                </div>
              </div>

              {/* Email & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Official Email *
                  </label>
                  <input
                    type="email"
                    value={coordEmail}
                    onChange={e => setCoordEmail(e.target.value)}
                    placeholder="coordinator@vardhaman.org"
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
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    value={coordPhone}
                    onChange={e => setCoordPhone(e.target.value)}
                    placeholder="+91 98480 22000"
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
              </div>

              {/* Portal Login Credentials */}
              <div style={{ background: 'rgba(16, 26, 53, 0.7)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(120, 149, 147, 0.3)' }}>
                <span style={{ fontSize: '0.82rem', color: '#BACEBB', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                  🔑 Portal Access Credentials
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#A8B3C2', marginBottom: '4px' }}>
                      Login Username *
                    </label>
                    <input
                      type="text"
                      value={coordUsername}
                      onChange={e => setCoordUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="e.g. hod_cse or finance_reviewer"
                      required
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'rgba(20, 31, 62, 0.9)',
                        border: '1px solid rgba(220, 227, 229, 0.2)',
                        color: '#FFFFFF',
                        fontFamily: 'monospace',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.74rem', color: '#A8B3C2' }}>
                        Portal Passcode *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const rand = `${(coordDeptCode || 'pass').toLowerCase()}${Math.floor(1000 + Math.random() * 9000)}`;
                          setCoordPassword(rand);
                        }}
                        style={{ background: 'none', border: 'none', color: '#BACEBB', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
                      >
                        Auto-Gen
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={coordShowPassword ? 'text' : 'password'}
                        value={coordPassword}
                        onChange={e => setCoordPassword(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '8px 32px 8px 10px',
                          borderRadius: '6px',
                          background: 'rgba(20, 31, 62, 0.9)',
                          border: '1px solid rgba(220, 227, 229, 0.2)',
                          color: '#34D399',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setCoordShowPassword(!coordShowPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '7px',
                          background: 'none',
                          border: 'none',
                          color: '#A8B3C2',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        {coordShowPassword ? <Unlock size={14} /> : <Lock size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddCoordinatorOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(220, 227, 229, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: '#DCE3E5',
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cyber-primary"
                  style={{
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '0.84rem',
                    fontWeight: 700
                  }}
                >
                  Appoint & Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT COORDINATOR / HOD / OPERATIONAL STAFF                          */}
      {/* ========================================================================= */}
      {isEditCoordinatorOpen && editingCoordinator && (
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
            padding: '20px',
            overflowY: 'auto'
          }}
          onClick={() => setIsEditCoordinatorOpen(false)}
        >
          <div
            style={{
              maxWidth: '620px',
              width: '100%',
              background: '#142042',
              borderRadius: '18px',
              padding: '28px',
              border: '1px solid rgba(59, 130, 246, 0.45)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="font-title" style={{ fontSize: '1.25rem', color: '#FFFFFF', margin: 0 }}>
                  Edit Profile & Access Credentials
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#60A5FA', margin: '2px 0 0' }}>
                  Updating details for <strong>{editingCoordinator.fullName}</strong> ({editingCoordinator.role})
                </p>
              </div>
              <button
                onClick={() => setIsEditCoordinatorOpen(false)}
                style={{ background: 'none', border: 'none', color: '#A8B3C2', cursor: 'pointer', fontSize: '1.4rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCoordinator} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Name & Designation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={editCoordFullName}
                    onChange={e => setEditCoordFullName(e.target.value)}
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
                    Academic / Desk Designation *
                  </label>
                  <input
                    type="text"
                    value={editCoordDesignation}
                    onChange={e => setEditCoordDesignation(e.target.value)}
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
              </div>

              {/* Department & Role */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Department Division *
                  </label>
                  <select
                    value={editCoordDeptCode}
                    onChange={e => setEditCoordDeptCode(e.target.value)}
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
                    {departments.map(d => (
                      <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
                    ))}
                    <option value="SAC">SAC Central Team</option>
                    <option value="FINANCE">Finance & Accounts Desk</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Role Assignment *
                  </label>
                  <select
                    value={editCoordRole}
                    onChange={e => setEditCoordRole(e.target.value as any)}
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
                    <option value="dept_chief_coordinator">🏛️ Department Chief Coordinator (HOD)</option>
                    <option value="finance_reviewer">💳 Central Payment Reviewer (Finance Desk)</option>
                    <option value="faculty_coord">⚡ Faculty Event Convener</option>
                    <option value="student_coord">🎓 Student Lead Organizer</option>
                    <option value="volunteer_checkin">🎟️ Gate Check-in & Ticketing Volunteer</option>
                    <option value="event_coordinator">🎯 Event Operations Coordinator</option>
                    <option value="dean_sac">👑 SAC Central Leadership</option>
                  </select>
                </div>
              </div>

              {/* Email & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Official Email *
                  </label>
                  <input
                    type="email"
                    value={editCoordEmail}
                    onChange={e => setEditCoordEmail(e.target.value)}
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
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    value={editCoordPhone}
                    onChange={e => setEditCoordPhone(e.target.value)}
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
              </div>

              {/* Portal Login Credentials */}
              <div style={{ background: 'rgba(16, 26, 53, 0.7)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <span style={{ fontSize: '0.82rem', color: '#60A5FA', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                  🔑 Portal Access Credentials
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#A8B3C2', marginBottom: '4px' }}>
                      Login Username *
                    </label>
                    <input
                      type="text"
                      value={editCoordUsername}
                      onChange={e => setEditCoordUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'rgba(20, 31, 62, 0.9)',
                        border: '1px solid rgba(220, 227, 229, 0.2)',
                        color: '#FFFFFF',
                        fontFamily: 'monospace',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.74rem', color: '#A8B3C2' }}>
                        Portal Passcode *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const rand = `${(editCoordDeptCode || 'pass').toLowerCase()}${Math.floor(1000 + Math.random() * 9000)}`;
                          setEditCoordPassword(rand);
                        }}
                        style={{ background: 'none', border: 'none', color: '#BACEBB', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
                      >
                        Auto-Gen
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={editCoordShowPassword ? 'text' : 'password'}
                        value={editCoordPassword}
                        onChange={e => setEditCoordPassword(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '8px 32px 8px 10px',
                          borderRadius: '6px',
                          background: 'rgba(20, 31, 62, 0.9)',
                          border: '1px solid rgba(220, 227, 229, 0.2)',
                          color: '#34D399',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setEditCoordShowPassword(!editCoordShowPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '7px',
                          background: 'none',
                          border: 'none',
                          color: '#A8B3C2',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        {editCoordShowPassword ? <Unlock size={14} /> : <Lock size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditCoordinatorOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(220, 227, 229, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: '#DCE3E5',
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cyber-primary"
                  style={{
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW ACADEMIC DEPARTMENT                                    */}
      {/* ========================================================================= */}
      {isAddDepartmentOpen && (
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
            padding: '20px',
            overflowY: 'auto'
          }}
          onClick={() => setIsAddDepartmentOpen(false)}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              background: '#142042',
              borderRadius: '18px',
              padding: '28px',
              border: '1px solid rgba(120, 149, 147, 0.35)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="font-title" style={{ fontSize: '1.25rem', color: '#FFFFFF', margin: 0 }}>
                  Create New Academic Department
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                  Register a new branch for FESTRONIX 2026. This creates catalog filters, matrix cards, and HOD portal access.
                </p>
              </div>
              <button
                onClick={() => setIsAddDepartmentOpen(false)}
                style={{ background: 'none', border: 'none', color: '#A8B3C2', cursor: 'pointer', fontSize: '1.4rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Code (Short) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AIML"
                    value={deptCode}
                    onChange={e => setDeptCode(e.target.value.toUpperCase())}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(16, 26, 53, 0.9)',
                      border: '1px solid rgba(220, 227, 229, 0.25)',
                      color: '#BACEBB',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Full Department Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AI & Machine Learning"
                    value={deptName}
                    onChange={e => setDeptName(e.target.value)}
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                  Branch Overview / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Flagship AI, neural networks, robotics, and generative intelligence systems..."
                  value={deptDesc}
                  onChange={e => setDeptDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(16, 26, 53, 0.9)',
                    border: '1px solid rgba(220, 227, 229, 0.25)',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Chief Coordinator / HOD Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. V. Prasad"
                    value={deptChief}
                    onChange={e => setDeptChief(e.target.value)}
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
                    Official Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="dept.festronix@vardhaman.org"
                    value={deptContact}
                    onChange={e => setDeptContact(e.target.value)}
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                  Representative Icon
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'Cpu', label: 'Cpu' },
                    { id: 'Brain', label: 'Brain' },
                    { id: 'Database', label: 'Data' },
                    { id: 'Globe', label: 'Globe' },
                    { id: 'Wrench', label: 'Mech' },
                    { id: 'Building2', label: 'Civil' },
                    { id: 'Zap', label: 'Electrical' },
                    { id: 'Radio', label: 'ECE' },
                    { id: 'Briefcase', label: 'MBA' },
                    { id: 'Layers', label: 'General' }
                  ].map(item => {
                    const isSelected = deptIcon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDeptIcon(item.id)}
                        style={{
                          background: isSelected ? 'rgba(40, 59, 120, 0.65)' : 'rgba(16, 26, 53, 0.8)',
                          border: isSelected ? '1px solid #789593' : '1px solid rgba(220, 227, 229, 0.15)',
                          borderRadius: '8px',
                          padding: '8px 4px',
                          color: isSelected ? '#BACEBB' : '#A8B3C2',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.7rem'
                        }}
                      >
                        {renderDeptIcon(item.id, 16)}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {deptChief.trim() && (
                <div style={{ background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.76rem', color: '#C084FC' }}>
                  💡 <strong>Auto-Credentialing</strong>: Creating this department will also automatically provision HOD portal credentials: Username: <code>hod_{(deptCode || 'dept').toLowerCase()}</code> | Passcode: <code>{(deptCode || 'dept').toLowerCase()}2026</code>.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddDepartmentOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(220, 227, 229, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: '#DCE3E5',
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cyber-primary"
                  style={{
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '0.84rem',
                    fontWeight: 700
                  }}
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT DEPARTMENT                                                    */}
      {/* ========================================================================= */}
      {isEditDepartmentOpen && editingDepartment && (
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
            padding: '20px',
            overflowY: 'auto'
          }}
          onClick={() => setIsEditDepartmentOpen(false)}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              background: '#142042',
              borderRadius: '18px',
              padding: '28px',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="font-title" style={{ fontSize: '1.25rem', color: '#FFFFFF', margin: 0 }}>
                  Edit Department: {editingDepartment.code}
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                  Update branch titles, description, chief coordinator, or contact channels.
                </p>
              </div>
              <button
                onClick={() => setIsEditDepartmentOpen(false)}
                style={{ background: 'none', border: 'none', color: '#A8B3C2', cursor: 'pointer', fontSize: '1.4rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateDepartment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Code (Short) *
                  </label>
                  <input
                    type="text"
                    value={editDeptCode}
                    onChange={e => setEditDeptCode(e.target.value.toUpperCase())}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(16, 26, 53, 0.9)',
                      border: '1px solid rgba(220, 227, 229, 0.25)',
                      color: '#BACEBB',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Full Department Name *
                  </label>
                  <input
                    type="text"
                    value={editDeptName}
                    onChange={e => setEditDeptName(e.target.value)}
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                  Branch Overview / Description
                </label>
                <textarea
                  rows={2}
                  value={editDeptDesc}
                  onChange={e => setEditDeptDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(16, 26, 53, 0.9)',
                    border: '1px solid rgba(220, 227, 229, 0.25)',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                    Chief Coordinator / HOD Name
                  </label>
                  <input
                    type="text"
                    value={editDeptChief}
                    onChange={e => setEditDeptChief(e.target.value)}
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
                    Official Contact Email
                  </label>
                  <input
                    type="email"
                    value={editDeptContact}
                    onChange={e => setEditDeptContact(e.target.value)}
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', marginBottom: '6px' }}>
                  Representative Icon
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'Cpu', label: 'Cpu' },
                    { id: 'Brain', label: 'Brain' },
                    { id: 'Database', label: 'Data' },
                    { id: 'Globe', label: 'Globe' },
                    { id: 'Wrench', label: 'Mech' },
                    { id: 'Building2', label: 'Civil' },
                    { id: 'Zap', label: 'Electrical' },
                    { id: 'Radio', label: 'ECE' },
                    { id: 'Briefcase', label: 'MBA' },
                    { id: 'Layers', label: 'General' }
                  ].map(item => {
                    const isSelected = editDeptIcon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setEditDeptIcon(item.id)}
                        style={{
                          background: isSelected ? 'rgba(40, 59, 120, 0.65)' : 'rgba(16, 26, 53, 0.8)',
                          border: isSelected ? '1px solid #789593' : '1px solid rgba(220, 227, 229, 0.15)',
                          borderRadius: '8px',
                          padding: '8px 4px',
                          color: isSelected ? '#BACEBB' : '#A8B3C2',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.7rem'
                        }}
                      >
                        {renderDeptIcon(item.id, 16)}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditDepartmentOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(220, 227, 229, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: '#DCE3E5',
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cyber-primary"
                  style={{
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
                  }}
                >
                  Save Department Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  );
};

