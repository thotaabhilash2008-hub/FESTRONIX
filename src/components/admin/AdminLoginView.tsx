import React, { useState, useEffect } from 'react';
import { 
  Shield, Building2, User, Key, ArrowRight, ArrowLeft, Award, Lock, Unlock,
  Sparkles, CheckCircle2, AlertCircle, FileText, CreditCard, QrCode, Eye, EyeOff,
  Zap, Check, ShieldCheck
} from 'lucide-react';
import { AdminAuthService, AdminUser } from '../../services/adminAuthService';
import { StorageService } from '../../services/storageService';
import { Department } from '../../types/festronix';
import { OrganisationalStructureModal } from './OrganisationalStructureModal';

interface AdminLoginViewProps {
  onLoginSuccess: (user: AdminUser) => void;
  onBackToFest: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onLoginSuccess, onBackToFest }) => {
  const [activeTab, setActiveTab] = useState<'super_admin' | 'dept' | 'ops'>('super_admin');
  const [isStructureOpen, setIsStructureOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>(() => StorageService.getDepartments());

  // Password visibility toggles
  const [showSuperPassword, setShowSuperPassword] = useState(false);
  const [showDeptPassword, setShowDeptPassword] = useState(false);
  const [showOpsPassword, setShowOpsPassword] = useState(false);

  // Quick preset feedback toast
  const [presetFeedback, setPresetFeedback] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setDepartments(StorageService.getDepartments());
    };
    window.addEventListener('festronix:departments-updated', handleUpdate);
    return () => window.removeEventListener('festronix:departments-updated', handleUpdate);
  }, []);

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

  // Quick Preset Loader
  const handleApplyPreset = (preset: {
    label: string;
    tab: 'super_admin' | 'dept' | 'ops';
    user: string;
    pass: string;
    dept?: string;
    role?: 'finance' | 'volunteer';
  }) => {
    setActiveTab(preset.tab);
    setErrorMessage('');
    if (preset.tab === 'super_admin') {
      setSuperUsername(preset.user);
      setSuperPassword(preset.pass);
    } else if (preset.tab === 'dept') {
      if (preset.dept) setSelectedDept(preset.dept);
      setDeptUsername(preset.user);
      setDeptPassword(preset.pass);
    } else if (preset.tab === 'ops') {
      if (preset.role) setOpsRole(preset.role);
      setOpsUsername(preset.user);
      setOpsPassword(preset.pass);
    }
    setPresetFeedback(`Autofilled credentials for: ${preset.label}`);
    setTimeout(() => setPresetFeedback(null), 3000);
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
          maxWidth: '680px',
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
          <span>Users & Org Structure Guide</span>
        </button>
      </div>

      {/* Main Terminal Card */}
      <div
        className="admin-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          padding: '36px 32px',
          position: 'relative'
        }}
      >
        <div className="admin-card-top-accent" />

        {/* Portal Header */}
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div
            style={{
              position: 'relative',
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #0284C7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 0 35px rgba(56, 189, 248, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
            }}
          >
            {/* Ambient rotating ring */}
            <div
              style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '24px',
                border: '1.5px dashed rgba(56, 189, 248, 0.6)',
                animation: 'adminRotateContinuous 25s linear infinite'
              }}
            />
            <Shield size={30} color="#FFFFFF" />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span className="admin-live-beacon">
              <span className="admin-live-beacon-dot" />
              <span>COMMAND TERMINAL • AIR-GAPPED VERIFICATION</span>
            </span>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-title, 'Space Grotesk', sans-serif)",
              fontSize: '1.65rem',
              fontWeight: 800,
              color: '#FFFFFF',
              margin: '0 0 6px',
              letterSpacing: '0.03em'
            }}
          >
            FESTRONIX '26 ADMIN CONSOLE
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: 0 }}>
            Vardhaman College of Engineering • Student Activity Council (SAC)
          </p>
        </div>

        {/* Quick Demo Credentials Matrix */}
        <div
          style={{
            background: 'rgba(12, 18, 34, 0.75)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '14px',
            padding: '12px 14px',
            marginBottom: '22px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Zap size={12} color="#38BDF8" />
              <span>Fast 1-Click Credential Autofill</span>
            </span>
            {presetFeedback && (
              <span style={{ fontSize: '0.72rem', color: '#34D399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={12} />
                <span>{presetFeedback}</span>
              </span>
            )}
          </div>

          <div className="admin-preset-grid">
            <button
              type="button"
              className="admin-preset-chip"
              onClick={() => handleApplyPreset({ label: 'Dean SAC', tab: 'super_admin', user: 'dean_sac', pass: 'deansac2026' })}
              title="Super Admin Fest-wide Administration"
            >
              <span>👑</span>
              <div>
                <div style={{ color: '#FBBF24', fontWeight: 700 }}>Dean SAC</div>
                <div style={{ color: '#64748B', fontSize: '0.65rem' }}>Super Admin</div>
              </div>
            </button>

            <button
              type="button"
              className="admin-preset-chip"
              onClick={() => handleApplyPreset({ label: 'Connect Club', tab: 'super_admin', user: 'connect_club', pass: 'connect2026' })}
              title="Super Admin Connect Club Lead"
            >
              <span>⚡</span>
              <div>
                <div style={{ color: '#38BDF8', fontWeight: 700 }}>Connect Club</div>
                <div style={{ color: '#64748B', fontSize: '0.65rem' }}>Super Admin</div>
              </div>
            </button>

            <button
              type="button"
              className="admin-preset-chip"
              onClick={() => handleApplyPreset({ label: 'Vencorpia', tab: 'super_admin', user: 'vencorpia', pass: 'vencorpia2026' })}
              title="Super Admin Vencorpia Board"
            >
              <span>💎</span>
              <div>
                <div style={{ color: '#A78BFA', fontWeight: 700 }}>Vencorpia</div>
                <div style={{ color: '#64748B', fontSize: '0.65rem' }}>Super Admin</div>
              </div>
            </button>

            <button
              type="button"
              className="admin-preset-chip"
              onClick={() => handleApplyPreset({ label: 'CSE HOD', tab: 'dept', dept: 'CSE', user: 'hod_cse', pass: 'csefest2026' })}
              title="Department Chief Coordinator"
            >
              <span>🏛️</span>
              <div>
                <div style={{ color: '#E2E8F0', fontWeight: 700 }}>CSE HOD</div>
                <div style={{ color: '#64748B', fontSize: '0.65rem' }}>Dept Chief</div>
              </div>
            </button>

            <button
              type="button"
              className="admin-preset-chip"
              onClick={() => handleApplyPreset({ label: 'Event Coord', tab: 'dept', dept: 'CSE', user: 'event_coord', pass: 'eventcoord2026' })}
              title="Assigned Event Coordinator"
            >
              <span>🎯</span>
              <div>
                <div style={{ color: '#34D399', fontWeight: 700 }}>Event Coord</div>
                <div style={{ color: '#64748B', fontSize: '0.65rem' }}>Lead Ops</div>
              </div>
            </button>

            <button
              type="button"
              className="admin-preset-chip"
              onClick={() => handleApplyPreset({ label: 'Finance Reviewer', tab: 'ops', role: 'finance', user: 'finance_reviewer', pass: 'finance2026' })}
              title="Payment Verification Officer"
            >
              <span>💳</span>
              <div>
                <div style={{ color: '#34D399', fontWeight: 700 }}>Finance Desk</div>
                <div style={{ color: '#64748B', fontSize: '0.65rem' }}>Reviewer</div>
              </div>
            </button>

            <button
              type="button"
              className="admin-preset-chip"
              onClick={() => handleApplyPreset({ label: 'Gate Volunteer', tab: 'ops', role: 'volunteer', user: 'volunteer_staff', pass: 'volunteer2026' })}
              title="Ticket Scanner & Check-in Staff"
            >
              <span>🎟️</span>
              <div>
                <div style={{ color: '#C084FC', fontWeight: 700 }}>Volunteer Gate</div>
                <div style={{ color: '#64748B', fontSize: '0.65rem' }}>Ticketing</div>
              </div>
            </button>
          </div>
        </div>

        {/* 3-Tab Tier Navigation */}
        <div className="admin-tab-nav" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {/* Tab 1: 3 Super Admins */}
          <button
            type="button"
            className={`admin-tab-item ${activeTab === 'super_admin' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('super_admin');
              setErrorMessage('');
            }}
            style={{ justifyContent: 'center' }}
          >
            <Award size={15} color={activeTab === 'super_admin' ? '#FBBF24' : '#94A3B8'} />
            <span>1. SUPER ADMINS</span>
          </button>

          {/* Tab 2: Dept Chief & Event Coordinators */}
          <button
            type="button"
            className={`admin-tab-item ${activeTab === 'dept' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('dept');
              setErrorMessage('');
            }}
            style={{ justifyContent: 'center' }}
          >
            <Building2 size={15} color={activeTab === 'dept' ? '#38BDF8' : '#94A3B8'} />
            <span>2. DEPT & EVENTS</span>
          </button>

          {/* Tab 3: Finance & Volunteer Operations */}
          <button
            type="button"
            className={`admin-tab-item ${activeTab === 'ops' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('ops');
              setErrorMessage('');
            }}
            style={{ justifyContent: 'center' }}
          >
            <CreditCard size={15} color={activeTab === 'ops' ? '#34D399' : '#94A3B8'} />
            <span>3. OPS & FINANCE</span>
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

        {/* TAB 1: 3 SUPER ADMINS (SAC DEAN, CONNECT CLUB, VENCORPIA) */}
        {activeTab === 'super_admin' && (
          <form onSubmit={handleSuperSubmit} className="admin-tab-pane" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.28)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <Award size={24} color="#FBBF24" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#FFFFFF' }}>
                  👑 3 Super Admins • Fest-wide Central Command
                </div>
                <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px', lineHeight: 1.4 }}>
                  Authority for <strong>SAC DEAN</strong>, <strong>CONNECT CLUB</strong>, and <strong>VENCORPIA</strong>. Manage departments, approvals, coordinators, broadcasts, and system configs.
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, marginBottom: '6px' }}>
                Super Admin Identifier / Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#38BDF8" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                <input
                  type="text"
                  value={superUsername}
                  onChange={e => setSuperUsername(e.target.value)}
                  placeholder="e.g. dean_sac, connect_club, or vencorpia"
                  required
                  className="admin-form-input"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, marginBottom: '6px' }}>
                Secret Access Passcode
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={16} color="#38BDF8" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                <input
                  type={showSuperPassword ? 'text' : 'password'}
                  value={superPassword}
                  onChange={e => setSuperPassword(e.target.value)}
                  placeholder="Enter encrypted passcode"
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
                marginTop: '6px'
              }}
            >
              {loading ? (
                <span>Authenticating Super Admin Node...</span>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Enter Fest-Wide Executive Console</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: DEPT CHIEF COORDINATOR & EVENT COORDINATOR */}
        {activeTab === 'dept' && (
          <form onSubmit={handleDeptSubmit} className="admin-tab-pane" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                fontSize: '0.77rem',
                color: '#CBD5E1',
                lineHeight: 1.4
              }}
            >
              Access boundary: <strong>Assigned departmental events and coordinators</strong>. Track event enrollment, check readiness, and issue spot passes.
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, marginBottom: '8px' }}>
                Select Department ({departments.length} Active Academic Branches)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '6px', marginBottom: '8px' }}>
                {departments.map(dept => {
                  const isSelected = selectedDept === dept.code;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => handleDeptSelect(dept.code)}
                      style={{
                        padding: '9px 6px',
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
              <div style={{ fontSize: '0.74rem', color: '#38BDF8', fontWeight: 600 }}>
                Active: {departments.find(d => d.code === selectedDept)?.name || selectedDept}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, marginBottom: '6px' }}>
                Department HOD or Event Coordinator Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#38BDF8" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                <input
                  type="text"
                  value={deptUsername}
                  onChange={e => setDeptUsername(e.target.value)}
                  placeholder="e.g. hod_cse or event_coord"
                  required
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
                marginTop: '6px'
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

        {/* TAB 3: FINANCE & VOLUNTEER STAFF */}
        {activeTab === 'ops' && (
          <form onSubmit={handleOpsSubmit} className="admin-tab-pane" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
                Operational Staff Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#34D399" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                <input
                  type="text"
                  value={opsUsername}
                  onChange={e => setOpsUsername(e.target.value)}
                  placeholder="e.g. finance_reviewer or volunteer_staff"
                  required
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
                marginTop: '6px'
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
            marginTop: '26px',
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
          <div>FESTRONIX ARCHITECTURE v2.6.4</div>
        </div>
      </div>

      {/* Organisational Structure Modal */}
      <OrganisationalStructureModal
        isOpen={isStructureOpen}
        onClose={() => setIsStructureOpen(false)}
      />
    </div>
  );
};
