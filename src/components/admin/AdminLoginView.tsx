import React, { useState, useEffect } from 'react';
import { 
  Shield, Building2, User, Key, ArrowRight, ArrowLeft, Award, Lock,
  AlertCircle, FileText, CreditCard, Eye, EyeOff, ShieldCheck, Users, Phone, Mail, CheckCircle2
} from 'lucide-react';
import { AdminAuthService, AdminUser } from '../../services/adminAuthService';
import { StorageService } from '../../services/storageService';
import { Department, FestEvent } from '../../types/festronix';
import { OrganisationalStructureModal } from './OrganisationalStructureModal';

interface AdminLoginViewProps {
  onLoginSuccess: (user: AdminUser) => void;
  onBackToFest: () => void;
}

export const OFFICIAL_STAFF_COORDINATORS: Record<string, {
  name: string;
  email: string;
  phone: string;
  deptName: string;
  coordinators?: Array<{ name: string; email: string; phone: string }>;
}> = {
  MECH: {
    name: 'B Dhanraj',
    email: 'dhanraj2205@vardhaman.org',
    phone: '9441381799',
    deptName: 'Mechanical Engineering'
  },
  ECE: {
    name: 'R Phani Vidyadhar',
    email: 'rphaniv@vardhaman.org',
    phone: '8801333811',
    deptName: 'Electronics & Communication'
  },
  EEE: {
    name: 'S Vinod Reddy',
    email: 's.vinodreddy@vardhaman.org',
    phone: '8125421181',
    deptName: 'Electrical & Electronics'
  },
  CSD: {
    name: 'V Vinod Kumar',
    email: 'vinodkumar1807@vardhaman.org',
    phone: '8897715060',
    deptName: 'CSE (Data Science)'
  },
  CSE: {
    name: 'M Raghavendra',
    email: 'raghavendra1797@vardhaman.org',
    phone: '6303169820',
    deptName: 'Computer Science & Engineering',
    coordinators: [
      { name: 'M Raghavendra', email: 'raghavendra1797@vardhaman.org', phone: '6303169820' },
      { name: 'Ch Bala Subramanyam', email: 'balu1681@vardhaman.org', phone: '8184864242' },
      { name: 'BJV Varma', email: 'varma@vardhaman.org', phone: '8143275536' }
    ]
  },
  IT: {
    name: 'P Dastagiri Reddy',
    email: 'dastagiri1918@vardhaman.org',
    phone: '9966676005',
    deptName: 'Information Technology'
  },
  CIVIL: {
    name: 'K Chaitanya',
    email: 'chaitanya_vce1658@vardhaman.org',
    phone: '7416413410',
    deptName: 'Civil Engineering'
  },
  CSM: {
    name: 'P Rajashekar',
    email: 'rajashekhar1833@vardhaman.org',
    phone: '7386407609',
    deptName: 'CSE (AI & Machine Learning)'
  },
  MBA: {
    name: 'Prof. R. L. Narayana',
    email: 'mba.festronix@vardhaman.org',
    phone: '+91 98480 22008',
    deptName: 'Master of Business Administration'
  }
};

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onLoginSuccess, onBackToFest }) => {
  // 3 Distinct Login Types requested by user:
  // 1. asif sir / cc / vencorpia (super_admin)
  // 2. dept co ordinator (dept)
  // 3. event co ordinators (event_coord)
  // + ops (finance & volunteer)
  const [activeTab, setActiveTab] = useState<'super_admin' | 'dept' | 'event_coord' | 'ops'>('super_admin');
  const [isStructureOpen, setIsStructureOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>(() => StorageService.getDepartments());
  const [allEvents, setAllEvents] = useState<FestEvent[]>(() => StorageService.getEvents());

  // Password visibility toggles
  const [showSuperPassword, setShowSuperPassword] = useState(false);
  const [showDeptPassword, setShowDeptPassword] = useState(false);
  const [showEventPassword, setShowEventPassword] = useState(false);
  const [showOpsPassword, setShowOpsPassword] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setDepartments(StorageService.getDepartments());
      setAllEvents(StorageService.getEvents());
    };
    window.addEventListener('festronix:departments-updated', handleUpdate);
    window.addEventListener('festronix:events-updated', handleUpdate);
    return () => {
      window.removeEventListener('festronix:departments-updated', handleUpdate);
      window.removeEventListener('festronix:events-updated', handleUpdate);
    };
  }, []);

  // 1. ASIF SIR / CC / VENCORPIA Form
  const [superEmail, setSuperEmail] = useState('dean.sac@vardhaman.org');
  const [superPassword, setSuperPassword] = useState('deansac2026');

  // 2. DEPT COORDINATOR Form
  const [selectedDept, setSelectedDept] = useState('CSE');
  const [deptEmail, setDeptEmail] = useState('raghavendra1797@vardhaman.org');
  const [deptPassword, setDeptPassword] = useState('cse2026');
  const [coordName, setCoordName] = useState('M Raghavendra');

  // 3. EVENT COORDINATORS Form
  const [eventDept, setEventDept] = useState('CSE');
  const [selectedEventId, setSelectedEventId] = useState(() => {
    const cseEvt = StorageService.getEvents().find(e => e.departmentCode.toUpperCase() === 'CSE');
    return cseEvt?.id || 'evt-1';
  });
  const [eventEmail, setEventEmail] = useState('raghavendra1797@vardhaman.org');
  const [eventPassword, setEventPassword] = useState('eventcoord2026');

  // 4. Operational Staff Form (Finance & Volunteer Check-in)
  const [opsRole, setOpsRole] = useState<'finance' | 'volunteer'>('finance');
  const [opsEmail, setOpsEmail] = useState('');
  const [opsPassword, setOpsPassword] = useState('finance2026');

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // When changing department in Dept Coordinator tab
  const handleDeptSelect = (deptCode: string) => {
    setSelectedDept(deptCode);
    setErrorMessage('');
    const staffInfo = OFFICIAL_STAFF_COORDINATORS[deptCode];
    if (staffInfo) {
      setDeptEmail(staffInfo.email);
      setCoordName(staffInfo.name);
      if (deptCode === 'CSE') {
        setDeptPassword('raghavendra2026');
      } else {
        setDeptPassword(`${deptCode.toLowerCase()}2026`);
      }
    } else {
      setDeptEmail(`${deptCode.toLowerCase()}.festronix@vardhaman.org`);
      setCoordName('');
      setDeptPassword(`${deptCode.toLowerCase()}2026`);
    }
  };

  // When changing department in Event Coordinator tab
  const handleEventDeptSelect = (deptCode: string) => {
    setEventDept(deptCode);
    setErrorMessage('');
    const deptEvents = allEvents.filter(e => e.departmentCode.toUpperCase() === deptCode.toUpperCase());
    const firstEvt = deptEvents[0];
    if (firstEvt) {
      setSelectedEventId(firstEvt.id);
      setEventEmail(firstEvt.coordinatorEmail || OFFICIAL_STAFF_COORDINATORS[deptCode]?.email || '');
    } else {
      setSelectedEventId('');
      setEventEmail(OFFICIAL_STAFF_COORDINATORS[deptCode]?.email || '');
    }
    setEventPassword('eventcoord2026');
  };

  // Submit Handler: 1. ASIF SIR / CC / VENCORPIA
  const handleSuperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await AdminAuthService.loginCentral(superEmail, superPassword);
      setLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Failed to authenticate Central Council credentials.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || 'Authentication error.');
    }
  };

  // Submit Handler: 2. DEPT COORDINATOR
  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await AdminAuthService.loginDepartment(selectedDept, deptEmail, deptPassword, coordName);
      setLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Failed to authenticate Department Coordinator credentials.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || 'Authentication error.');
    }
  };

  // Submit Handler: 3. EVENT COORDINATORS
  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const matchedEvt = allEvents.find(ev => ev.id === selectedEventId);
      const res = await AdminAuthService.loginEventCoordinator(
        eventDept,
        selectedEventId,
        eventEmail,
        eventPassword,
        matchedEvt?.coordinatorName
      );
      setLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Failed to authenticate Event Coordinator credentials.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || 'Authentication error.');
    }
  };

  // Submit Handler: Operational Roles (Finance & Volunteer)
  const handleOpsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const targetEmail = opsEmail.trim() || (opsRole === 'finance' ? 'accounts.fest@vardhaman.org' : 'volunteers.fest@vardhaman.org');
      const res = await AdminAuthService.loginCentral(targetEmail, opsPassword);
      setLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Failed to authenticate staff credentials.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || 'Failed to authenticate staff credentials.');
    }
  };

  // Active department staff info
  const activeStaffInfo = OFFICIAL_STAFF_COORDINATORS[selectedDept];
  const activeDeptEvents = allEvents.filter(e => e.departmentCode.toUpperCase() === eventDept.toUpperCase());
  const activeSelectedEvent = allEvents.find(e => e.id === selectedEventId) || activeDeptEvents[0];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 16px',
        position: 'relative',
        zIndex: 10
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        <button
          onClick={onBackToFest}
          className="admin-btn admin-btn-ghost"
          style={{
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '0.8rem'
          }}
        >
          <ArrowLeft size={14} />
          <span>Return to Festronix Public Portal</span>
        </button>

        <button
          onClick={() => setIsStructureOpen(true)}
          className="admin-btn admin-btn-primary"
          style={{
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.4) 0%, rgba(56, 189, 248, 0.25) 100%)',
            borderColor: 'rgba(56, 189, 248, 0.4)'
          }}
        >
          <FileText size={14} />
          <span>Staff Coordinators & Org Guide</span>
        </button>
      </div>

      {/* Main Terminal Card */}
      <div
        className="admin-card"
        style={{
          width: '100%',
          maxWidth: '720px',
          padding: '36px 32px',
          position: 'relative'
        }}
      >
        <div className="admin-card-top-accent" />

        {/* Portal Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              position: 'relative',
              width: '60px',
              height: '60px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #0284C7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 0 35px rgba(56, 189, 248, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '22px',
                border: '1.5px dashed rgba(56, 189, 248, 0.6)',
                animation: 'adminRotateContinuous 25s linear infinite'
              }}
            />
            <Shield size={28} color="#FFFFFF" />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span className="admin-live-beacon">
              <span className="admin-live-beacon-dot" />
              <span>COMMAND TERMINAL • ROLE-BASED ACCESS CONTROL</span>
            </span>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-title, 'Space Grotesk', sans-serif)",
              fontSize: '1.6rem',
              fontWeight: 800,
              color: '#FFFFFF',
              margin: '0 0 4px',
              letterSpacing: '0.03em'
            }}
          >
            FESTRONIX '26 ADMIN CONSOLE
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: 0 }}>
            Vardhaman College of Engineering • Student Activity Council (SAC)
          </p>
        </div>

        {/* 3-Tier Login Types Navigation (Requested by user) */}
        <div
          className="admin-tab-nav"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            marginBottom: '10px'
          }}
        >
          {/* Tab 1: Asif Sir / CC / Vencorpia */}
          <button
            type="button"
            className={`admin-tab-item ${activeTab === 'super_admin' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('super_admin');
              setErrorMessage('');
            }}
            style={{ justifyContent: 'center', padding: '10px 6px', textAlign: 'center' }}
          >
            <Award size={15} color={activeTab === 'super_admin' ? '#FBBF24' : '#94A3B8'} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>1. ASIF SIR / CC / VENCORPIA</span>
          </button>

          {/* Tab 2: Dept Coordinator */}
          <button
            type="button"
            className={`admin-tab-item ${activeTab === 'dept' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('dept');
              setErrorMessage('');
            }}
            style={{ justifyContent: 'center', padding: '10px 6px', textAlign: 'center' }}
          >
            <Building2 size={15} color={activeTab === 'dept' ? '#38BDF8' : '#94A3B8'} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>2. DEPT COORDINATOR</span>
          </button>

          {/* Tab 3: Event Coordinators */}
          <button
            type="button"
            className={`admin-tab-item ${activeTab === 'event_coord' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('event_coord');
              setErrorMessage('');
            }}
            style={{ justifyContent: 'center', padding: '10px 6px', textAlign: 'center' }}
          >
            <Users size={15} color={activeTab === 'event_coord' ? '#A78BFA' : '#94A3B8'} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>3. EVENT COORDINATORS</span>
          </button>
        </div>

        {/* Operational Staff Sub-Pill */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab(activeTab === 'ops' ? 'super_admin' : 'ops');
              setErrorMessage('');
            }}
            style={{
              background: activeTab === 'ops' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${activeTab === 'ops' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '9999px',
              padding: '4px 12px',
              fontSize: '0.72rem',
              color: activeTab === 'ops' ? '#34D399' : '#94A3B8',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CreditCard size={13} />
            <span>Operations Staff (Finance Desk & QR Volunteer Gate)</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.14)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#FCA5A5',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 1: ASIF SIR / CC / VENCORPIA (SUPER ADMIN CENTRAL AUTHORITY)      */}
        {/* ==================================================================== */}
        {activeTab === 'super_admin' && (
          <form onSubmit={handleSuperSubmit} className="admin-tab-pane" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '12px',
                padding: '12px 14px'
              }}
            >
              <div style={{ fontSize: '0.74rem', color: '#FCD34D', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Central Leadership • Quick Select Authority
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSuperEmail('dean.sac@vardhaman.org');
                    setSuperPassword('deansac2026');
                  }}
                  style={{
                    background: superEmail === 'dean.sac@vardhaman.org' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.7)',
                    border: `1px solid ${superEmail === 'dean.sac@vardhaman.org' ? '#F59E0B' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '8px',
                    padding: '8px',
                    color: '#FFFFFF',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  👑 Asif Sir (Dean SAC)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSuperEmail('connect.club@vardhaman.org');
                    setSuperPassword('connect2026');
                  }}
                  style={{
                    background: superEmail === 'connect.club@vardhaman.org' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.7)',
                    border: `1px solid ${superEmail === 'connect.club@vardhaman.org' ? '#F59E0B' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '8px',
                    padding: '8px',
                    color: '#FFFFFF',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  ⚡ CC (CONNECT Club)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSuperEmail('vencorpia@vardhaman.org');
                    setSuperPassword('vencorpia2026');
                  }}
                  style={{
                    background: superEmail === 'vencorpia@vardhaman.org' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.7)',
                    border: `1px solid ${superEmail === 'vencorpia@vardhaman.org' ? '#F59E0B' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '8px',
                    padding: '8px',
                    color: '#FFFFFF',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  🚀 Vencorpia Leadership
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSuperEmail('admin@gmail.com');
                    setSuperPassword('admin2026');
                  }}
                  style={{
                    background: superEmail === 'admin@gmail.com' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.7)',
                    border: `1px solid ${superEmail === 'admin@gmail.com' ? '#F59E0B' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '8px',
                    padding: '8px',
                    color: '#FFFFFF',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  🛡️ System Admin
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, marginBottom: '6px' }}>
                Authority Email or Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#FBBF24" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                <input
                  type="text"
                  autoComplete="username"
                  value={superEmail}
                  onChange={e => setSuperEmail(e.target.value)}
                  placeholder="Enter email or username (e.g. dean.sac@vardhaman.org)"
                  required
                  className="admin-form-input"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, marginBottom: '6px' }}>
                Security Passcode
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={16} color="#FBBF24" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                <input
                  type={showSuperPassword ? 'text' : 'password'}
                  value={superPassword}
                  onChange={e => setSuperPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="admin-form-input"
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowSuperPassword(!showSuperPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '13px',
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title={showSuperPassword ? 'Hide passcode' : 'Show passcode'}
                >
                  {showSuperPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-primary"
              style={{
                padding: '14px',
                fontSize: '0.94rem',
                width: '100%',
                marginTop: '4px',
                background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #0284C7 100%)'
              }}
            >
              {loading ? (
                <span>Authenticating SAC Central Console...</span>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Sign In as Central Authority (Dean SAC / CC / Vencorpia)</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: DEPT COORDINATOR (OFFICIAL STAFF COORDINATORS)                */}
        {/* ==================================================================== */}
        {activeTab === 'dept' && (
          <form onSubmit={handleDeptSubmit} className="admin-tab-pane" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, marginBottom: '8px' }}>
                Select Department ({departments.length} Academic Branches)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '6px', marginBottom: '8px' }}>
                {departments.map(dept => {
                  const isSelected = selectedDept === dept.code;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => handleDeptSelect(dept.code)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '10px',
                        border: isSelected ? '1px solid #38BDF8' : '1px solid rgba(220, 227, 232, 0.14)',
                        background: isSelected ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.4) 0%, rgba(56, 189, 248, 0.3) 100%)' : 'rgba(14, 21, 38, 0.8)',
                        color: isSelected ? '#FFFFFF' : '#94A3B8',
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 0 15px rgba(56, 189, 248, 0.25)' : 'none'
                      }}
                    >
                      {dept.code}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Official Staff Coordinator Callout */}
            {activeStaffInfo && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Official Staff Coordinator • {activeStaffInfo.deptName}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{selectedDept} Desk</span>
                </div>

                {activeStaffInfo.coordinators ? (
                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#BAE6FD', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} color="#38BDF8" />
                      <span>3 Official CSE Staff Coordinators — Click to choose login account:</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                      {activeStaffInfo.coordinators.map((c, idx) => {
                        const isChosen = deptEmail.toLowerCase() === c.email.toLowerCase();
                        const defaultPass = c.email.startsWith('raghavendra') ? 'raghavendra2026' : c.email.startsWith('balu') ? 'balu2026' : 'varma2026';
                        return (
                          <button
                            key={c.email}
                            type="button"
                            onClick={() => {
                              setDeptEmail(c.email);
                              setCoordName(c.name);
                              setDeptPassword(defaultPass);
                            }}
                            style={{
                              background: isChosen ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.35) 0%, rgba(56, 189, 248, 0.3) 100%)' : 'rgba(15, 23, 42, 0.7)',
                              border: `1.5px solid ${isChosen ? '#38BDF8' : 'rgba(255, 255, 255, 0.12)'}`,
                              borderRadius: '10px',
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              color: '#FFFFFF',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.15s ease',
                              boxShadow: isChosen ? '0 0 16px rgba(56, 189, 248, 0.25)' : 'none'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.84rem', color: isChosen ? '#38BDF8' : '#FFFFFF' }}>
                                {idx + 1}. {c.name}
                              </div>
                              <div style={{ color: '#BAE6FD', fontSize: '0.72rem', marginTop: '2px' }}>
                                {c.email}
                              </div>
                              <div style={{ color: '#94A3B8', fontSize: '0.68rem', marginTop: '3px' }}>
                                📞 {c.phone}
                              </div>
                            </div>
                            {isChosen && <CheckCircle2 size={18} color="#38BDF8" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.88rem' }}>{activeStaffInfo.name}</div>
                      <div style={{ fontSize: '0.74rem', color: '#BAE6FD', display: 'flex', gap: '10px', marginTop: '2px' }}>
                        <span><Mail size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />{activeStaffInfo.email}</span>
                        <span><Phone size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />{activeStaffInfo.phone}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDeptEmail(activeStaffInfo.email);
                        setCoordName(activeStaffInfo.name);
                      }}
                      style={{
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#BAE6FD',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        cursor: 'pointer'
                      }}
                    >
                      Fill Credentials
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, marginBottom: '6px' }}>
                Coordinator Email
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#38BDF8" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                <input
                  type="text"
                  autoComplete="username"
                  value={deptEmail}
                  onChange={e => setDeptEmail(e.target.value)}
                  placeholder={`Enter email or leave blank for ${selectedDept.toLowerCase()}.festronix@vardhaman.org`}
                  className="admin-form-input"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, marginBottom: '6px' }}>
                Department Passcode
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={16} color="#38BDF8" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                <input
                  type={showDeptPassword ? 'text' : 'password'}
                  value={deptPassword}
                  onChange={e => setDeptPassword(e.target.value)}
                  placeholder={`Enter passcode (e.g. ${selectedDept.toLowerCase()}2026 or festcoord2026)`}
                  required
                  className="admin-form-input"
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowDeptPassword(!showDeptPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '13px',
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title={showDeptPassword ? 'Hide passcode' : 'Show passcode'}
                >
                  {showDeptPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-primary"
              style={{
                padding: '14px',
                fontSize: '0.94rem',
                width: '100%',
                marginTop: '4px'
              }}
            >
              {loading ? (
                <span>Accessing {selectedDept} Department Desk...</span>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Access {selectedDept} Department Operations</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: EVENT COORDINATORS (DEPARTMENT-WISE EVENT OPERATIONS)         */}
        {/* ==================================================================== */}
        {activeTab === 'event_coord' && (
          <form onSubmit={handleEventSubmit} className="admin-tab-pane" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, marginBottom: '8px' }}>
                1. Select Event Department
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '6px', marginBottom: '8px' }}>
                {departments.map(dept => {
                  const isSelected = eventDept === dept.code;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => handleEventDeptSelect(dept.code)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '10px',
                        border: isSelected ? '1px solid #A78BFA' : '1px solid rgba(220, 227, 232, 0.14)',
                        background: isSelected ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(167, 139, 250, 0.3) 100%)' : 'rgba(14, 21, 38, 0.8)',
                        color: isSelected ? '#FFFFFF' : '#94A3B8',
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 0 15px rgba(167, 139, 250, 0.25)' : 'none'
                      }}
                    >
                      {dept.code}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Department Events Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, marginBottom: '8px' }}>
                2. Select Assigned Event ({activeDeptEvents.length} in {eventDept})
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeDeptEvents.map(evt => {
                  const isChosen = selectedEventId === evt.id;
                  return (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => {
                        setSelectedEventId(evt.id);
                        if (evt.coordinatorEmail) setEventEmail(evt.coordinatorEmail);
                      }}
                      style={{
                        background: isChosen ? 'rgba(139, 92, 246, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                        border: `1px solid ${isChosen ? '#A78BFA' : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.82rem' }}>{evt.title}</div>
                        <div style={{ color: '#C4B5FD', fontSize: '0.72rem', marginTop: '2px' }}>
                          Format: {evt.format} • Fee: ₹{evt.fee} • Venue: {evt.venue}
                        </div>
                      </div>
                      {isChosen && <CheckCircle2 size={16} color="#A78BFA" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CSE 3 Coordinators Quick Switch for Events */}
            {eventDept === 'CSE' && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#C4B5FD', fontWeight: 700, marginBottom: '6px' }}>
                  Select CSE Event Coordinator Login:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '6px' }}>
                  {OFFICIAL_STAFF_COORDINATORS.CSE.coordinators?.map(c => {
                    const isPicked = eventEmail.toLowerCase() === c.email.toLowerCase();
                    const defaultPass = c.email.startsWith('raghavendra') ? 'raghavendra2026' : c.email.startsWith('balu') ? 'balu2026' : 'varma2026';
                    return (
                      <button
                        key={c.email}
                        type="button"
                        onClick={() => {
                          setEventEmail(c.email);
                          setEventPassword(defaultPass);
                        }}
                        style={{
                          background: isPicked ? 'rgba(139, 92, 246, 0.35)' : 'rgba(15, 23, 42, 0.65)',
                          border: `1px solid ${isPicked ? '#A78BFA' : 'rgba(255, 255, 255, 0.12)'}`,
                          borderRadius: '8px',
                          padding: '6px 10px',
                          color: '#FFFFFF',
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ fontWeight: isPicked ? 800 : 600, color: isPicked ? '#A78BFA' : '#FFFFFF' }}>{c.name}</div>
                        <div style={{ fontSize: '0.68rem', color: '#C4B5FD' }}>{c.email}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Selected Event Staff Coordinator Details */}
            {activeSelectedEvent && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  fontSize: '0.78rem'
                }}
              >
                <span style={{ color: '#C4B5FD', fontWeight: 700 }}>Lead Event Coordinator: </span>
                <strong style={{ color: '#FFFFFF' }}>{activeSelectedEvent.coordinatorName || 'Department Operations'}</strong>
                <div style={{ color: '#94A3B8', fontSize: '0.72rem', marginTop: '4px' }}>
                  {activeSelectedEvent.coordinatorEmail} • {activeSelectedEvent.coordinatorPhone}
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, marginBottom: '6px' }}>
                Event Coordinator Email
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#A78BFA" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                <input
                  type="text"
                  autoComplete="username"
                  value={eventEmail}
                  onChange={e => setEventEmail(e.target.value)}
                  placeholder="Enter event coordinator email"
                  className="admin-form-input"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, marginBottom: '6px' }}>
                Event Operations Passcode
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={16} color="#A78BFA" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                <input
                  type={showEventPassword ? 'text' : 'password'}
                  value={eventPassword}
                  onChange={e => setEventPassword(e.target.value)}
                  placeholder="Enter passcode (e.g. eventcoord2026 or festcoord2026)"
                  required
                  className="admin-form-input"
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowEventPassword(!showEventPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '13px',
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title={showEventPassword ? 'Hide passcode' : 'Show passcode'}
                >
                  {showEventPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="admin-btn"
              style={{
                padding: '14px',
                fontSize: '0.94rem',
                width: '100%',
                marginTop: '4px',
                background: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 50%, #A78BFA 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              {loading ? (
                <span>Accessing Event Operations Desk...</span>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Access {eventDept} Event Operations ({activeSelectedEvent?.title?.slice(0, 24)}...)</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: OPS & FINANCE (PAYMENT AUDIT & QR VOLUNTEER STAFF)            */}
        {/* ==================================================================== */}
        {activeTab === 'ops' && (
          <form onSubmit={handleOpsSubmit} className="admin-tab-pane" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.28)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <CreditCard size={24} color="#34D399" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Operational Staff • Accounts & Gate Entry Crew
                </div>
                <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px', lineHeight: 1.4 }}>
                  <strong>Finance Reviewer:</strong> Audit transaction proofs and revenue records. <br />
                  <strong>Volunteer Gate Crew:</strong> Rapid ticket scan, QR validation, and participant entry.
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, marginBottom: '6px' }}>
                Operational Staff Email
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#34D399" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                <input
                  type="text"
                  autoComplete="username"
                  value={opsEmail}
                  onChange={e => setOpsEmail(e.target.value)}
                  placeholder={`Enter email or leave blank for ${opsRole === 'finance' ? 'accounts.fest@vardhaman.org' : 'volunteers.fest@vardhaman.org'}`}
                  className="admin-form-input"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, marginBottom: '6px' }}>
                Staff Access Passcode
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={16} color="#34D399" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                <input
                  type={showOpsPassword ? 'text' : 'password'}
                  value={opsPassword}
                  onChange={e => setOpsPassword(e.target.value)}
                  placeholder="Enter staff security passcode"
                  required
                  className="admin-form-input"
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowOpsPassword(!showOpsPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '13px',
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title={showOpsPassword ? 'Hide passcode' : 'Show passcode'}
                >
                  {showOpsPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-emerald"
              style={{
                padding: '14px',
                fontSize: '0.94rem',
                width: '100%',
                marginTop: '4px'
              }}
            >
              {loading ? (
                <span>Verifying Operational Credentials...</span>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Enter Operational Terminal</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Security Footer */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(220, 227, 232, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.72rem',
            color: '#64748B',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="#34D399" />
            <span>256-BIT TLS ENCRYPTED SESSION</span>
          </div>
          <div>FESTRONIX 2026 • SAC VARDHAMAN</div>
        </div>
      </div>

      {/* Organizational Structure Modal */}
      <OrganisationalStructureModal
        isOpen={isStructureOpen}
        onClose={() => setIsStructureOpen(false)}
      />
    </div>
  );
};
