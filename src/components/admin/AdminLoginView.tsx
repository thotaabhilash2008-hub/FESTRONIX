import React, { useState } from 'react';
import { Shield, Building2, User, Key, ArrowRight, ArrowLeft, Award, Lock, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { AdminAuthService, AdminUser, PRESET_ADMINS } from '../../services/adminAuthService';
import { DEPARTMENTS } from '../../data/mockData';

interface AdminLoginViewProps {
  onLoginSuccess: (user: AdminUser) => void;
  onBackToFest: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onLoginSuccess, onBackToFest }) => {
  const [activeTab, setActiveTab] = useState<'dean' | 'dept'>('dean');

  // Central Leadership Form (Dean SAC, Connect Club, Vencorpia)
  const [deanUsername, setDeanUsername] = useState('');
  const [deanPassword, setDeanPassword] = useState('');

  // Department Form
  const [selectedDept, setSelectedDept] = useState('CSE');
  const [deptUsername, setDeptUsername] = useState('');
  const [deptPassword, setDeptPassword] = useState('');
  const [coordName, setCoordName] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeptSelect = (deptCode: string) => {
    setSelectedDept(deptCode);
    setErrorMessage('');
  };

  const handleDeanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    setTimeout(() => {
      const res = AdminAuthService.loginCentral(deanUsername, deanPassword);
      setLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Failed to authenticate Central Council credentials.');
      }
    }, 300);
  };

  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    setTimeout(() => {
      const res = AdminAuthService.loginDepartment(selectedDept, deptUsername, deptPassword, coordName);
      setLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Failed to authenticate Department credentials.');
      }
    }, 300);
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
      {/* Top Bar with Return link */}
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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

        <span
          style={{
            fontSize: '0.72rem',
            color: '#789593',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}
        >
          SECURE SAC GATEWAY
        </span>
      </div>

      {/* Main Login Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'linear-gradient(145deg, rgba(20, 31, 62, 0.96) 0%, rgba(16, 26, 53, 0.98) 100%)',
          border: '1px solid rgba(220, 227, 229, 0.22)',
          borderRadius: '24px',
          padding: '34px 30px',
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
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #283B78 0%, #3B539C 50%, #789593 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 0 25px rgba(120, 149, 147, 0.45)'
            }}
          >
            <Shield size={28} color="#FFFFFF" />
          </div>

          <h2
            className="font-title"
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: '#FFFFFF',
              margin: '0 0 4px',
              letterSpacing: '0.04em'
            }}
          >
            FESTRONIX '26 ADMIN CONSOLE
          </h2>
          <p style={{ color: '#A8B3C2', fontSize: '0.82rem', margin: 0 }}>
            Vardhaman College of Engineering • Student Activity Council (SAC)
          </p>
        </div>

        {/* Dual Tab Navigation */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            padding: '6px',
            background: 'rgba(16, 26, 53, 0.8)',
            border: '1px solid rgba(220, 227, 229, 0.15)',
            borderRadius: '14px',
            marginBottom: '26px'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('dean');
              setErrorMessage('');
            }}
            style={{
              padding: '11px 12px',
              borderRadius: '10px',
              border: activeTab === 'dean' ? '1px solid rgba(120, 149, 147, 0.5)' : 'none',
              background: activeTab === 'dean' ? 'linear-gradient(135deg, #283B78 0%, #1e2c5a 100%)' : 'transparent',
              color: activeTab === 'dean' ? '#FFFFFF' : '#A8B3C2',
              fontWeight: activeTab === 'dean' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'dean' ? '0 4px 15px rgba(40, 59, 120, 0.4)' : 'none',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            <Award size={16} color={activeTab === 'dean' ? '#BACEBB' : '#A8B3C2'} />
            <span>1. DEAN SAC, CONNECT & VENCORPIA</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('dept');
              setErrorMessage('');
            }}
            style={{
              padding: '11px 12px',
              borderRadius: '10px',
              border: activeTab === 'dept' ? '1px solid rgba(120, 149, 147, 0.5)' : 'none',
              background: activeTab === 'dept' ? 'linear-gradient(135deg, #283B78 0%, #1e2c5a 100%)' : 'transparent',
              color: activeTab === 'dept' ? '#FFFFFF' : '#A8B3C2',
              fontWeight: activeTab === 'dept' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'dept' ? '0 4px 15px rgba(40, 59, 120, 0.4)' : 'none',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            <Building2 size={16} color={activeTab === 'dept' ? '#BACEBB' : '#A8B3C2'} />
            <span>2. DEPT HOD & COORD</span>
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
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: DEAN SAC, CONNECT CLUB & VENCORPIA LOGIN FORM */}
        {activeTab === 'dean' && (
          <form onSubmit={handleDeanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(40, 59, 120, 0.22)',
                border: '1px solid rgba(120, 149, 147, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <Award size={22} color="#BACEBB" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Dean SAC, Connect Club & Vencorpia Central Access
                </div>
                <div style={{ fontSize: '0.74rem', color: '#A8B3C2' }}>
                  Central festival administration for Dean SAC, Connect Club & Vencorpia organizers with separate secure credentials.
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', fontWeight: 600, marginBottom: '6px' }}>
                Dean SAC, Connect Club, or Vencorpia Username / Email
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#789593" style={{ position: 'absolute', left: '14px', top: '13px' }} />
                <input
                  type="text"
                  value={deanUsername}
                  onChange={e => setDeanUsername(e.target.value)}
                  placeholder="e.g. dean_sac, connect_club, or vencorpia"
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
                Access Password
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={16} color="#789593" style={{ position: 'absolute', left: '14px', top: '13px' }} />
                <input
                  type="password"
                  value={deanPassword}
                  onChange={e => setDeanPassword(e.target.value)}
                  placeholder="Enter secret pass"
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
                marginTop: '6px'
              }}
            >
              {loading ? (
                <span>Authenticating Council Access...</span>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Enter Central Council Console</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: DEPT HOD & COORDINATOR LOGIN FORM */}
        {activeTab === 'dept' && (
          <form onSubmit={handleDeptSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#DCE3E5', fontWeight: 600, marginBottom: '6px' }}>
                Select Department
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
                HOD / Coordinator Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#789593" style={{ position: 'absolute', left: '14px', top: '13px' }} />
                <input
                  type="text"
                  value={deptUsername}
                  onChange={e => setDeptUsername(e.target.value)}
                  placeholder={`e.g. hod_${selectedDept.toLowerCase().replace('&', '')}`}
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
                Coordinator Name (Optional - For Gate Check-in logs)
              </label>
              <input
                type="text"
                value={coordName}
                onChange={e => setCoordName(e.target.value)}
                placeholder="e.g. Prof. Rajesh / Student Lead"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(16, 26, 53, 0.9)',
                  border: '1px solid rgba(220, 227, 229, 0.25)',
                  color: '#FFFFFF',
                  fontSize: '0.84rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
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
                marginTop: '6px'
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
      </div>
    </div>
  );
};
