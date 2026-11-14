import React, { useState, useEffect } from 'react';
import { 
  Shield, Building2, User, Key, ArrowRight, ArrowLeft, Award, Lock,
  AlertCircle, FileText, CreditCard, Eye, EyeOff, ShieldCheck, Users, Phone, Mail, CheckCircle2
} from 'lucide-react';
import { AdminAuthService, AdminUser } from '../../services/adminAuthService';
import { StorageService } from '../../services/storageService';
import { Department, FestEvent } from '../../types/festronix';
import { DEPARTMENTS, INITIAL_EVENTS } from '../../data/mockData';
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
  cluster?: string;
  coordinators?: Array<{ name: string; email: string; phone: string }>;
}> = {
  'CSE 1': {
    name: 'BJV Varma',
    email: 'varma@vardhaman.org',
    phone: '8143275536',
    deptName: 'Computer Science & Engineering',
    cluster: '1st cluster (Verma)'
  },
  'CSE-1': {
    name: 'BJV Varma',
    email: 'varma@vardhaman.org',
    phone: '8143275536',
    deptName: 'Computer Science & Engineering',
    cluster: '1st cluster (Verma)'
  },
  'CSE 2': {
    name: 'Ch Bala Subramanyam',
    email: 'balu1681@vardhaman.org',
    phone: '8184864242',
    deptName: 'Computer Science & Engineering',
    cluster: '2nd cluster (Balu)'
  },
  'CSE-2': {
    name: 'Ch Bala Subramanyam',
    email: 'balu1681@vardhaman.org',
    phone: '8184864242',
    deptName: 'Computer Science & Engineering',
    cluster: '2nd cluster (Balu)'
  },
  'CSE 3': {
    name: 'M Raghavendra',
    email: 'raghavendra1797@vardhaman.org',
    phone: '6303169820',
    deptName: 'Computer Science & Engineering',
    cluster: '3rd cluster (Raghavendra)'
  },
  'CSE-3': {
    name: 'M Raghavendra',
    email: 'raghavendra1797@vardhaman.org',
    phone: '6303169820',
    deptName: 'Computer Science & Engineering',
    cluster: '3rd cluster (Raghavendra)'
  },
  CSE: {
    name: 'BJV Varma',
    email: 'varma@vardhaman.org',
    phone: '8143275536',
    deptName: 'Computer Science & Engineering',
    cluster: '1st cluster (Verma)'
  },
  MECH: {
    name: 'B Dhanraj',
    email: 'dhanraj2205@vardhaman.org',
    phone: '9441381799',
    deptName: 'Mechanical Engineering'
  },
  MECHANICAL: {
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
  const [activeTab, setActiveTab] = useState<'super_admin' | 'dept' | 'event_coord'>('super_admin');
  const [isStructureOpen, setIsStructureOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>(() => {
    const list = StorageService.getDepartments();
    return list.length > 0 ? list : DEPARTMENTS;
  });
  const [allEvents, setAllEvents] = useState<FestEvent[]>(() => {
    const list = StorageService.getEvents();
    return list.length > 0 ? list : INITIAL_EVENTS;
  });

  const effectiveDepartments: Department[] = (departments && departments.length > 0) ? departments : DEPARTMENTS;
  const effectiveEvents: FestEvent[] = (allEvents && allEvents.length > 0) ? allEvents : INITIAL_EVENTS;

  // 3 distinct CSE departments: CSE 1 (Verma), CSE 2 (Balu), CSE 3 (Raghavendra)
  const loginDepartments = React.useMemo(() => {
    const list: Array<{ id: string; code: string; name: string; cluster?: string }> = [
      { id: 'dept-cse-1', code: 'CSE 1', name: 'Computer Science (Cluster 1 - Verma)', cluster: '1st cluster' },
      { id: 'dept-cse-2', code: 'CSE 2', name: 'Computer Science (Cluster 2 - Balu)', cluster: '2nd cluster' },
      { id: 'dept-cse-3', code: 'CSE 3', name: 'Computer Science (Cluster 3 - Raghavendra)', cluster: '3rd cluster' }
    ];

    effectiveDepartments.forEach(dept => {
      const codeUpper = dept.code.toUpperCase();
      if (codeUpper !== 'CSE') {
        const displayCode = codeUpper === 'MECHANICAL' ? 'MECH' : dept.code;
        list.push({ id: dept.id, code: displayCode, name: dept.name });
      }
    });

    return list;
  }, [effectiveDepartments]);

  // Password visibility toggles
  const [showSuperPassword, setShowSuperPassword] = useState(false);
  const [showDeptPassword, setShowDeptPassword] = useState(false);
  const [showEventPassword, setShowEventPassword] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setDepartments(StorageService.getDepartments());
      setAllEvents(StorageService.getEvents());
    };
    StorageService.fetchDepartments().then(deps => {
      if (deps && deps.length > 0) setDepartments(deps);
    }).catch(() => {});
    StorageService.fetchEvents().then(evts => {
      if (evts && evts.length > 0) setAllEvents(evts);
    }).catch(() => {});

    window.addEventListener('festronix:departments-updated', handleUpdate);
    window.addEventListener('festronix:events-updated', handleUpdate);
    return () => {
      window.removeEventListener('festronix:departments-updated', handleUpdate);
      window.removeEventListener('festronix:events-updated', handleUpdate);
    };
  }, []);

  // 1. Central Administration Form
  const [superEmail, setSuperEmail] = useState('');
  const [superPassword, setSuperPassword] = useState('');

  // 2. DEPT COORDINATOR Form (defaults to CSE 1 - Verma)
  const [selectedDept, setSelectedDept] = useState('CSE 1');
  const [deptEmail, setDeptEmail] = useState('');
  const [deptPassword, setDeptPassword] = useState('');
  const [coordName, setCoordName] = useState('');

  // 3. EVENT COORDINATORS Form
  const [eventDept, setEventDept] = useState('CSE 1');
  const [selectedEventId, setSelectedEventId] = useState(() => {
    const cseEvt = StorageService.getEvents().find(e => e.departmentCode.toUpperCase() === 'CSE');
    return cseEvt?.id || 'evt-1';
  });
  const [eventCoordName, setEventCoordName] = useState(() => {
    const cseEvt = StorageService.getEvents().find(e => e.departmentCode.toUpperCase() === 'CSE');
    return cseEvt?.coordinatorName || '';
  });
  const [eventEmail, setEventEmail] = useState(() => {
    const cseEvt = StorageService.getEvents().find(e => e.departmentCode.toUpperCase() === 'CSE');
    return cseEvt?.coordinatorEmail || '';
  });
  const [eventPassword, setEventPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // When changing department in Dept Coordinator tab
  const handleDeptSelect = (deptCode: string) => {
    setSelectedDept(deptCode);
    setErrorMessage('');
    setDeptEmail('');
    setDeptPassword('');
    setCoordName('');
  };

  // When changing department in Event Coordinator tab
  const handleEventDeptSelect = (deptCode: string) => {
    setEventDept(deptCode);
    setErrorMessage('');
    const effectiveDept = deptCode.startsWith('CSE') ? 'CSE' : (deptCode === 'MECH' ? 'MECHANICAL' : deptCode);
    const deptEvents = effectiveEvents.filter(e => {
      const code = e.departmentCode.toUpperCase();
      return code === effectiveDept || (effectiveDept === 'MECHANICAL' && code === 'MECH');
    });
    const firstEvt = deptEvents[0];
    if (firstEvt) {
      setSelectedEventId(firstEvt.id);
      setEventCoordName(firstEvt.coordinatorName || '');
      setEventEmail(firstEvt.coordinatorEmail || '');
    } else {
      setSelectedEventId('');
      setEventCoordName('');
      setEventEmail('');
    }
    setEventPassword('');
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
        eventCoordName.trim() || matchedEvt?.coordinatorName
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

  // Active department staff info
  const activeStaffInfo = OFFICIAL_STAFF_COORDINATORS[selectedDept] || OFFICIAL_STAFF_COORDINATORS[selectedDept.toUpperCase()];
  const activeEventDept = eventDept.startsWith('CSE') ? 'CSE' : (eventDept === 'MECH' ? 'MECHANICAL' : eventDept);
  const activeDeptEvents = effectiveEvents.filter(e => {
    const code = e.departmentCode.toUpperCase();
    return code === activeEventDept || (activeEventDept === 'MECHANICAL' && code === 'MECH');
  });
  const activeSelectedEvent = effectiveEvents.find(e => e.id === selectedEventId) || activeDeptEvents[0];
  const activeEventStaffInfo = OFFICIAL_STAFF_COORDINATORS[eventDept] || OFFICIAL_STAFF_COORDINATORS[activeEventDept];

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
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>1. CENTRAL ADMINISTRATION</span>
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
                  placeholder="Enter administrator email or username"
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
                  placeholder="Enter security passcode"
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
                  <span>Sign In as Central Authority</span>
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
                Select Department ({loginDepartments.length} Academic Branches)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '6px', marginBottom: '8px' }}>
                {loginDepartments.map(dept => {
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

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>{activeStaffInfo.name}</span>
                      {activeStaffInfo.cluster && (
                        <span style={{ fontSize: '0.72rem', color: '#38BDF8', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          {activeStaffInfo.cluster}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#BAE6FD', display: 'flex', gap: '10px', marginTop: '4px' }}>
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
                      borderRadius: '8px',
                      padding: '5px 10px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Select {activeStaffInfo.name.split(' ').pop()} Email
                  </button>
                </div>
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
                  placeholder="Enter coordinator email or username"
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
                  placeholder="Enter department passcode"
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
                1. Select Event Department ({loginDepartments.length} Academic Branches)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '6px', marginBottom: '8px' }}>
                {loginDepartments.map(dept => {
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

            {/* Active Coordinator Callout Card for Event Dept */}
            {activeEventStaffInfo && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.86rem' }}>
                      {activeEventStaffInfo.name}
                    </span>
                    {activeEventStaffInfo.cluster && (
                      <span style={{ fontSize: '0.68rem', color: '#C4B5FD', background: 'rgba(139, 92, 246, 0.18)', border: '1px solid rgba(139, 92, 246, 0.35)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        {activeEventStaffInfo.cluster}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#DDD6FE', display: 'flex', gap: '10px', marginTop: '3px' }}>
                    <span><Mail size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />{activeEventStaffInfo.email}</span>
                    <span><Phone size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />{activeEventStaffInfo.phone}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEventEmail(activeEventStaffInfo.email);
                  }}
                  style={{
                    background: 'rgba(139, 92, 246, 0.18)',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    color: '#DDD6FE',
                    borderRadius: '8px',
                    padding: '5px 10px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Select {activeEventStaffInfo.name.split(' ').pop()} Email
                </button>
              </div>
            )}

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
                        if (evt.coordinatorName) setEventCoordName(evt.coordinatorName);
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
                Event Coordinator Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#A78BFA" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                <input
                  type="text"
                  value={eventCoordName}
                  onChange={e => setEventCoordName(e.target.value)}
                  placeholder="Enter event coordinator full name"
                  className="admin-form-input"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, marginBottom: '6px' }}>
                Event Coordinator Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#A78BFA" style={{ position: 'absolute', left: '14px', top: '15px' }} />
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
                  placeholder="Enter event passcode"
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
