import React, { useState } from 'react';
import { 
  Shield, Building2, User, Key, ArrowRight, ArrowLeft, Award, Lock, 
  Sparkles, CheckCircle2, AlertCircle, FileText, CreditCard, QrCode 
} from 'lucide-react';
import { AdminAuthService, AdminUser } from '../../services/adminAuthService';
import { DEPARTMENTS } from '../../data/mockData';
import { OrganisationalStructureModal } from './OrganisationalStructureModal';

interface AdminLoginViewProps {
  onLoginSuccess: (user: AdminUser) => void;
  onBackToFest: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onLoginSuccess, onBackToFest }) => {
  const [activeTab, setActiveTab] = useState<'super_admin' | 'dept' | 'ops'>('super_admin');
  const [isStructureOpen, setIsStructureOpen] = useState(false);

  // 1. 3 Super Admins Form (SAC DEAN, CONNECT CLUB, VENCORPIA)
  const [superUsername, setSuperUsername] = useState('');
  const [superPassword, setSuperPassword] = useState('');

  // 2. Department Chief Coordinator & Event Coordinator Form
  const [selectedDept, setSelectedDept] = useState('CSE');
  const [deptUsername, setDeptUsername] = useState('');
  const [deptPassword, setDeptPassword] = useState('');
  const [coordName, setCoordName] = useState('');

  // 3. Operational Staff Form (Finance Reviewer & Volunteer Check-in)
  const [opsRole, setOpsRole] = useState<'finance' | 'volunteer'>('finance');
  const [opsUsername, setOpsUsername] = useState('');
  const [opsPassword, setOpsPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeptSelect = (deptCode: string) => {
    setSelectedDept(deptCode);
    setErrorMessage('');
  };

  // Submit Handler: 3 Super Admins
  const handleSuperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await AdminAuthService.loginCentral(superUsername, superPassword);
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

  // Submit Handler: Department Chief & Event Coordinators
  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await AdminAuthService.loginDepartment(selectedDept, deptUsername, deptPassword, coordName);
      setLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Failed to authenticate Department credentials.');
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
      const res = await AdminAuthService.loginCentral(opsUsername, opsPassword);
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

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'transparent',
        backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(40, 59, 120, 0.25) 0%, transparent 80%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative'
      }}
    >
      {/* Top Bar with Return link & Organisational Structure Specification modal trigger */}
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '20px'
        }}
      >
        <button
          onClick={onBackToFest}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(220, 227, 229, 0.25)',
            borderRadius: '9999px',
            padding: '7px 16px',
            color: '#DCE3E5',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            fontFamily: "'Space Grotesk', sans-serif"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.borderColor = '#789593';
            e.currentTarget.style.background = 'rgba(40, 59, 120, 0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#DCE3E5';
            e.currentTarget.style.borderColor = 'rgba(220, 227, 229, 0.25)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
        >
          <ArrowLeft size={14} />
          <span>Return to Festronix 2026 Portal</span>
        </button>

        <button
          onClick={() => setIsStructureOpen(true)}
          style={{
            background: 'rgba(40, 59, 120, 0.45)',
            border: '1px solid rgba(120, 149, 147, 0.4)',
            borderRadius: '9999px',
            padding: '7px 14px',
            color: '#BACEBB',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.background = 'rgba(40, 59, 120, 0.7)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#BACEBB';
            e.currentTarget.style.background = 'rgba(40, 59, 120, 0.45)';
          }}
        >
          <FileText size={14} />
          <span>3. Users & Org Structure</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          background: 'linear-gradient(145deg, rgba(20, 31, 62, 0.96) 0%, rgba(16, 26, 53, 0.98) 100%)',
          border: '1px solid rgba(220, 227, 229, 0.22)',
          borderRadius: '24px',
          padding: '32px 28px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 35px rgba(40, 59, 120, 0.35)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glowing Top accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            right: '10%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #789593, #DCE3E5, #789593, transparent)'
          }}
        />

        {/* Portal Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #283B78 0%, #3B539C 50%, #789593 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              boxShadow: '0 0 25px rgba(120, 149, 147, 0.45)'
            }}
          >
            <Shield size={26} color="#FFFFFF" />
          </div>

          <h2
            className="font-title"
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#FFFFFF',
              margin: '0 0 4px',
              letterSpacing: '0.04em'
            }}
          >
            FESTRONIX '26 ADMIN CONSOLE
          </h2>
          <p style={{ color: '#A8B3C2', fontSize: '0.8rem', margin: 0 }}>
            Vardhaman College of Engineering • Student Activity Council (SAC)
          </p>
        </div>

        {/* 3-Tab Organisational Navigation */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            padding: '5px',
            background: 'rgba(16, 26, 53, 0.8)',
            border: '1px solid rgba(220, 227, 229, 0.15)',
            borderRadius: '14px',
            marginBottom: '22px'
          }}
        >
          {/* Tab 1: 3 Super Admins */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('super_admin');
              setErrorMessage('');
            }}
            style={{
              padding: '10px 8px',
              borderRadius: '10px',
              border: activeTab === 'super_admin' ? '1px solid rgba(245, 158, 11, 0.5)' : 'none',
              background: activeTab === 'super_admin' ? 'linear-gradient(135deg, #283B78 0%, #1e2c5a 100%)' : 'transparent',
              color: activeTab === 'super_admin' ? '#FFFFFF' : '#A8B3C2',
              fontWeight: activeTab === 'super_admin' ? 700 : 500,
              fontSize: '0.76rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'super_admin' ? '0 4px 15px rgba(40, 59, 120, 0.4)' : 'none',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            <Award size={14} color={activeTab === 'super_admin' ? '#fbbf24' : '#A8B3C2'} />
            <span>1. 3 SUPER ADMINS</span>
          </button>

          {/* Tab 2: Dept Chief & Event Coordinators */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('dept');
              setErrorMessage('');
            }}
            style={{
              padding: '10px 8px',
              borderRadius: '10px',
              border: activeTab === 'dept' ? '1px solid rgba(120, 149, 147, 0.5)' : 'none',
              background: activeTab === 'dept' ? 'linear-gradient(135deg, #283B78 0%, #1e2c5a 100%)' : 'transparent',
              color: activeTab === 'dept' ? '#FFFFFF' : '#A8B3C2',
              fontWeight: activeTab === 'dept' ? 700 : 500,
              fontSize: '0.76rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'dept' ? '0 4px 15px rgba(40, 59, 120, 0.4)' : 'none',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            <Building2 size={14} color={activeTab === 'dept' ? '#BACEBB' : '#A8B3C2'} />
            <span>2. DEPT & EVENT COORD</span>
          </button>

          {/* Tab 3: Finance & Volunteer Operations */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('ops');
              setErrorMessage('');
            }}
            style={{
              padding: '10px 8px',
              borderRadius: '10px',
              border: activeTab === 'ops' ? '1px solid rgba(52, 211, 153, 0.5)' : 'none',
              background: activeTab === 'ops' ? 'linear-gradient(135deg, #283B78 0%, #1e2c5a 100%)' : 'transparent',
              color: activeTab === 'ops' ? '#FFFFFF' : '#A8B3C2',
              fontWeight: activeTab === 'ops' ? 700 : 500,
              fontSize: '0.76rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'ops' ? '0 4px 15px rgba(40, 59, 120, 0.4)' : 'none',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            <CreditCard size={14} color={activeTab === 'ops' ? '#34d399' : '#A8B3C2'} />
            <span>3. FINANCE & CHECK-IN</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '18px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: 3 SUPER ADMINS (SAC DEAN, CONNECT CLUB, VENCORPIA) */}
        {activeTab === 'super_admin' && (
          <form onSubmit={handleSuperSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(40, 59, 120, 0.25)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <Award size={22} color="#fbbf24" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>
                  👑 3 Super Admins • Fest-wide Administration
                </div>
                <div style={{ fontSize: '0.74rem', color: '#DCE3E5', marginTop: '2px' }}>
                  Central governance for <strong>1. SAC DEAN</strong>, <strong>2. CONNECT CLUB</strong>, and <strong>3. VENCORPIA</strong>. Oversee fest, departments, assignments, accounts, roles, content and reports.
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', fontWeight: 600, marginBottom: '6px' }}>
                Super Admin Username / Email
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#789593" style={{ position: 'absolute', left: '14px', top: '13px' }} />
                <input
                  type="text"
                  value={superUsername}
                  onChange={e => setSuperUsername(e.target.value)}
                  placeholder="Enter super admin username (dean_sac, connect_club, or vencorpia)"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '10px',
                    background: 'rgba(16, 26, 53, 0.9)',
                    border: '1px solid rgba(220, 227, 229, 0.25)',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', fontWeight: 600, marginBottom: '6px' }}>
                Super Admin Access Passcode
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={16} color="#789593" style={{ position: 'absolute', left: '14px', top: '13px' }} />
                <input
                  type="password"
                  value={superPassword}
                  onChange={e => setSuperPassword(e.target.value)}
                  placeholder="Enter secret passcode"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '10px',
                    background: 'rgba(16, 26, 53, 0.9)',
                    border: '1px solid rgba(220, 227, 229, 0.25)',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-cyber-primary"
              style={{
                padding: '13px',
                fontSize: '0.92rem',
                fontWeight: 700,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px'
              }}
            >
              {loading ? (
                <span>Authenticating Super Admin Access...</span>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Enter Central Fest Console</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: DEPT CHIEF COORDINATOR & EVENT COORDINATOR */}
        {activeTab === 'dept' && (
          <form onSubmit={handleDeptSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(40, 59, 120, 0.2)',
                border: '1px solid rgba(120, 149, 147, 0.3)',
                fontSize: '0.75rem',
                color: '#DCE3E5'
              }}
            >
              Access boundary: <strong>Their department's events & assigned event operations</strong>. Monitor capacity, registrations, and readiness.
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', fontWeight: 600, marginBottom: '6px' }}>
                Select Academic Department (9 Official Branches)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '8px' }}>
                {DEPARTMENTS.map(dept => {
                  const isSelected = selectedDept === dept.code;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => handleDeptSelect(dept.code)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid #789593' : '1px solid rgba(220, 227, 229, 0.18)',
                        background: isSelected ? 'rgba(40, 59, 120, 0.55)' : 'rgba(16, 26, 53, 0.7)',
                        color: isSelected ? '#FFFFFF' : '#A8B3C2',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        textAlign: 'center',
                        fontFamily: "'Space Grotesk', sans-serif"
                      }}
                    >
                      {dept.code}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#BACEBB' }}>
                Selected: <strong>{DEPARTMENTS.find(d => d.code === selectedDept)?.name || selectedDept}</strong>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', fontWeight: 600, marginBottom: '6px' }}>
                Department Chief Coordinator or Event Coord Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#789593" style={{ position: 'absolute', left: '14px', top: '13px' }} />
                <input
                  type="text"
                  value={deptUsername}
                  onChange={e => setDeptUsername(e.target.value)}
                  placeholder="Enter HOD or coordinator username"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '10px',
                    background: 'rgba(16, 26, 53, 0.9)',
                    border: '1px solid rgba(220, 227, 229, 0.25)',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', fontWeight: 600, marginBottom: '6px' }}>
                Department Passcode
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={16} color="#789593" style={{ position: 'absolute', left: '14px', top: '13px' }} />
                <input
                  type="password"
                  value={deptPassword}
                  onChange={e => setDeptPassword(e.target.value)}
                  placeholder="Enter department password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '10px',
                    background: 'rgba(16, 26, 53, 0.9)',
                    border: '1px solid rgba(220, 227, 229, 0.25)',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-cyber-primary"
              style={{
                padding: '13px',
                fontSize: '0.92rem',
                fontWeight: 700,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px'
              }}
            >
              {loading ? (
                <span>Accessing {selectedDept} Desk...</span>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Access {selectedDept} Department Desk</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 3: FINANCE & VOLUNTEER STAFF */}
        {activeTab === 'ops' && (
          <form onSubmit={handleOpsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(52, 211, 153, 0.1)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <CreditCard size={22} color="#34d399" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Operational Staff • Finance & Gate Entry Crew
                </div>
                <div style={{ fontSize: '0.74rem', color: '#DCE3E5', marginTop: '2px' }}>
                  <strong>Finance Reviewer:</strong> Review payment evidence and collection reports. <br />
                  <strong>Volunteer Staff:</strong> Scan tickets and support entry operations.
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', fontWeight: 600, marginBottom: '6px' }}>
                Operational Staff Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#789593" style={{ position: 'absolute', left: '14px', top: '13px' }} />
                <input
                  type="text"
                  value={opsUsername}
                  onChange={e => setOpsUsername(e.target.value)}
                  placeholder="e.g. finance_reviewer or volunteer_staff"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '10px',
                    background: 'rgba(16, 26, 53, 0.9)',
                    border: '1px solid rgba(220, 227, 229, 0.25)',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', fontWeight: 600, marginBottom: '6px' }}>
                Staff Access Passcode
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={16} color="#789593" style={{ position: 'absolute', left: '14px', top: '13px' }} />
                <input
                  type="password"
                  value={opsPassword}
                  onChange={e => setOpsPassword(e.target.value)}
                  placeholder="Enter staff passcode"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '10px',
                    background: 'rgba(16, 26, 53, 0.9)',
                    border: '1px solid rgba(220, 227, 229, 0.25)',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-cyber-primary"
              style={{
                padding: '13px',
                fontSize: '0.92rem',
                fontWeight: 700,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px'
              }}
            >
              {loading ? (
                <span>Verifying Staff Access...</span>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Enter Operational Console</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Organisational Structure Modal */}
      <OrganisationalStructureModal
        isOpen={isStructureOpen}
        onClose={() => setIsStructureOpen(false)}
      />
    </div>
  );
};
