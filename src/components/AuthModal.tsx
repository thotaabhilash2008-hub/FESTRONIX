import React, { useState, useEffect } from 'react';
import { X, User, Lock, Mail, Phone, School, Eye, EyeOff, LogIn, UserPlus, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AuthService } from '../services/authService';
import { isSupabaseConfigured } from '../lib/supabase';
import { User as UserType } from '../types/festronix';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserType) => void;
  initialMode?: 'signin' | 'signup';
  customNotice?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin',
  customNotice
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sign In State
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up State
  const [signUpData, setSignUpData] = useState({
    fullName: '',
    rollNumber: '',
    username: '',
    email: '',
    phone: '',
    college: 'Vardhaman College of Engineering',
    password: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMsg(null);
    setIsLoading(false);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sanitizeError = (raw?: string) => {
    if (!raw) return 'Authentication error. Please try again.';
    const lower = raw.toLowerCase();
    if (lower.includes('disabled') || lower.includes('email logins are disabled')) {
      return 'Email sign-in is unavailable. Please check the Supabase authentication settings or contact the organizers.';
    }
    return raw;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await AuthService.signIn(signInIdentifier, signInPassword);
      if (!res.success || !res.user) {
        setError(sanitizeError(res.error));
        setIsLoading(false);
        return;
      }

      setSuccessMsg(`Welcome back, ${res.user.fullName}!`);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });

      setTimeout(() => {
        onSuccess(res.user!);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(sanitizeError(err?.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await AuthService.signUp({
        fullName: signUpData.fullName,
        rollNumber: signUpData.rollNumber,
        username: signUpData.username || signUpData.rollNumber,
        email: signUpData.email,
        phone: signUpData.phone,
        college: signUpData.college,
        password: signUpData.password
      });

      if (!res.success || !res.user) {
        setError(sanitizeError(res.error));
        setIsLoading(false);
        return;
      }

      setSuccessMsg(`Account created! Welcome to Festronix, ${res.user.fullName}.`);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });

      setTimeout(() => {
        onSuccess(res.user!);
        onClose();
      }, 800);
    } catch (err: any) {
      setError(sanitizeError(err?.message));
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (roll = '25881A05FC') => {
    setSignInIdentifier(roll);
    setSignInPassword('password123');
    setError(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          padding: '28px 32px',
          background: 'linear-gradient(135deg, rgba(20, 31, 62, 0.98) 0%, rgba(16, 26, 53, 0.98) 100%)',
          border: '1px solid rgba(220, 227, 229, 0.22)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(40, 59, 120, 0.35)',
          borderRadius: '20px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #283B78 0%, #3E4264 50%, #789593 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#BACEBB',
                fontWeight: 800,
                fontSize: '0.82rem',
                fontFamily: "var(--font-heading)"
              }}
            >
              FX
            </div>
            <div>
              <h3 className="font-title" style={{ fontSize: '1.25rem', color: '#FFFFFF', margin: 0, fontWeight: 700 }}>
                {mode === 'signin' ? 'Sign In to Festronix' : 'Create Student Account'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                Vardhaman College of Engineering • Festronix '26
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(220, 227, 229, 0.08)',
              border: '1px solid rgba(220, 227, 229, 0.15)',
              color: '#A8B3C2',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#A8B3C2')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Contextual Notice */}
        {customNotice && (
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(40, 59, 120, 0.45)',
              border: '1px solid rgba(120, 149, 147, 0.4)',
              borderRadius: '12px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <Sparkles size={18} color="#BACEBB" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.82rem', color: '#FFFFFF', lineHeight: 1.4 }}>
              <strong>Login Required:</strong> {customNotice}
            </div>
          </div>
        )}

        {/* Tab Toggle: Sign In / Sign Up */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(16, 26, 53, 0.75)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid rgba(220, 227, 229, 0.15)',
            marginBottom: '20px'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: 'none',
              background: mode === 'signin' ? 'linear-gradient(135deg, #283B78 0%, #3B539C 100%)' : 'transparent',
              color: mode === 'signin' ? '#FFFFFF' : '#A8B3C2',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            <LogIn size={15} color={mode === 'signin' ? '#BACEBB' : '#A8B3C2'} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: 'none',
              background: mode === 'signup' ? 'linear-gradient(135deg, #283B78 0%, #3B539C 100%)' : 'transparent',
              color: mode === 'signup' ? '#FFFFFF' : '#A8B3C2',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            <UserPlus size={15} color={mode === 'signup' ? '#BACEBB' : '#A8B3C2'} />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '0.8rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(120, 149, 147, 0.2)',
              border: '1px solid rgba(120, 149, 147, 0.5)',
              borderRadius: '8px',
              color: '#BACEBB',
              fontSize: '0.82rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600
            }}
          >
            <CheckCircle2 size={16} color="#BACEBB" style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#DCE3E5', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                EMAIL ADDRESS *
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  color="#BACEBB"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="email"
                  required
                  className="cyber-input"
                  style={{ paddingLeft: '38px', height: '42px', fontSize: '0.85rem' }}
                  placeholder="Enter the email address on your account"
                  value={signInIdentifier}
                  onChange={e => setSignInIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#DCE3E5', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                PASSWORD *
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  color="#BACEBB"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="cyber-input"
                  style={{ paddingLeft: '38px', paddingRight: '40px', height: '42px', fontSize: '0.85rem' }}
                  placeholder="Enter your password"
                  value={signInPassword}
                  onChange={e => setSignInPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#A8B3C2',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Demo shortcuts are limited to local development. */}
            {!isSupabaseConfigured() && <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '8px 12px',
                background: 'rgba(16, 26, 53, 0.75)',
                border: '1px dashed rgba(120, 149, 147, 0.35)',
                borderRadius: '8px',
                fontSize: '0.75rem'
              }}
            >
              <span style={{ color: '#A8B3C2' }}>Quick fill demo:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('25881A05FC')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#BACEBB',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  25881A05FC (Dhanush)
                </button>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>•</span>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('22VCECS104')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#789593',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  22VCECS104 (Rahul)
                </button>
              </div>
            </div>}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-cyber-primary"
              style={{
                width: '100%',
                height: '44px',
                marginTop: '6px',
                justifyContent: 'center',
                fontSize: '0.88rem',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In & Continue'}</span>
              <LogIn size={16} />
            </button>
          </form>
        ) : (
          /* SIGN UP FORM */
          <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.76rem', color: '#DCE3E5', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  FULL NAME *
                </label>
                <input
                  type="text"
                  required
                  className="cyber-input"
                  style={{ height: '38px', fontSize: '0.82rem' }}
                  placeholder="Rahul Sharma"
                  value={signUpData.fullName}
                  onChange={e => setSignUpData({ ...signUpData, fullName: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', color: '#DCE3E5', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  ROLL NUMBER / ID *
                </label>
                <input
                  type="text"
                  required
                  className="cyber-input"
                  style={{ height: '38px', fontSize: '0.82rem' }}
                  placeholder="22VCECS104"
                  value={signUpData.rollNumber}
                  onChange={e => setSignUpData({ ...signUpData, rollNumber: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.76rem', color: '#DCE3E5', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  USERNAME (OPTIONAL)
                </label>
                <input
                  type="text"
                  className="cyber-input"
                  style={{ height: '38px', fontSize: '0.82rem' }}
                  placeholder="rahul_dev"
                  value={signUpData.username}
                  onChange={e => setSignUpData({ ...signUpData, username: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', color: '#DCE3E5', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  PHONE (WHATSAPP) *
                </label>
                <input
                  type="tel"
                  required
                  className="cyber-input"
                  style={{ height: '38px', fontSize: '0.82rem' }}
                  placeholder="+91 98765 43210"
                  value={signUpData.phone}
                  onChange={e => setSignUpData({ ...signUpData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.76rem', color: '#DCE3E5', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                COLLEGE EMAIL *
              </label>
              <input
                type="email"
                required
                className="cyber-input"
                style={{ height: '38px', fontSize: '0.82rem' }}
                placeholder="student@vardhaman.org"
                value={signUpData.email}
                onChange={e => setSignUpData({ ...signUpData, email: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.76rem', color: '#DCE3E5', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                COLLEGE / INSTITUTION
              </label>
              <input
                type="text"
                className="cyber-input"
                style={{ height: '38px', fontSize: '0.82rem' }}
                placeholder="Vardhaman College of Engineering"
                value={signUpData.college}
                onChange={e => setSignUpData({ ...signUpData, college: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.76rem', color: '#DCE3E5', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  PASSWORD *
                </label>
                <input
                  type="password"
                  required
                  className="cyber-input"
                  style={{ height: '38px', fontSize: '0.82rem' }}
                  placeholder="Min 6 characters"
                  value={signUpData.password}
                  onChange={e => setSignUpData({ ...signUpData, password: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', color: '#DCE3E5', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  CONFIRM PASSWORD *
                </label>
                <input
                  type="password"
                  required
                  className="cyber-input"
                  style={{ height: '38px', fontSize: '0.82rem' }}
                  placeholder="Repeat password"
                  value={signUpData.confirmPassword}
                  onChange={e => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-cyber-primary"
              style={{
                width: '100%',
                height: '44px',
                marginTop: '8px',
                justifyContent: 'center',
                fontSize: '0.88rem',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              <span>{isLoading ? 'Creating Account...' : 'Create Account & Continue'}</span>
              <Sparkles size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
