import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Key,
  Lock,
  Shield,
  ShieldCheck,
  User
} from 'lucide-react';
import { AdminAuthService, AdminUser } from '../../services/adminAuthService';

interface AdminLoginViewProps {
  onLoginSuccess: (user: AdminUser) => void;
  onBackToFest: () => void;
}

/**
 * Single credential entry point for every staff portal.
 *
 * Role, department, and event scope are deliberately not collected from the
 * browser. The authenticated Supabase user and its active admin role decide
 * which portal is opened after login.
 */
export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onLoginSuccess, onBackToFest }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const result = await AdminAuthService.loginWithCredentials(identifier, password);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Invalid login credentials.');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '28px 16px',
        position: 'relative',
        zIndex: 10
      }}
    >
      <div style={{ width: '100%', maxWidth: '460px', marginBottom: '18px' }}>
        <button
          type="button"
          onClick={onBackToFest}
          className="admin-btn admin-btn-ghost"
          style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem' }}
        >
          <ArrowLeft size={14} />
          <span>Return to Festronix</span>
        </button>
      </div>

      <main
        className="admin-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '32px 28px',
          position: 'relative'
        }}
      >
        <div className="admin-card-top-accent" />

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 52%, #0284C7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 0 30px rgba(56, 189, 248, 0.35)'
            }}
          >
            <Shield size={28} color="#FFFFFF" />
          </div>
          <h1
            style={{
              fontFamily: "var(--font-title, 'Space Grotesk', sans-serif)",
              fontSize: '1.55rem',
              fontWeight: 800,
              color: '#FFFFFF',
              margin: '0 0 8px'
            }}
          >
            FESTRONIX '26 ADMIN CONSOLE
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.86rem', margin: 0 }}>
            Sign in to continue
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.14)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#FCA5A5',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              marginBottom: '18px'
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="admin-login-identifier"
              style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, marginBottom: '6px' }}
            >
              Email or username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="#38BDF8" style={{ position: 'absolute', left: '14px', top: '15px' }} />
              <input
                id="admin-login-identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={event => setIdentifier(event.target.value)}
                placeholder="Enter your email or username"
                required
                className="admin-form-input"
                style={{ paddingLeft: '42px' }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-login-password"
              style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, marginBottom: '6px' }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={16} color="#38BDF8" style={{ position: 'absolute', left: '14px', top: '15px' }} />
              <input
                id="admin-login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                className="admin-form-input"
                style={{ paddingLeft: '42px', paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(current => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '12px',
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
              marginTop: '2px',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #0284C7 100%)'
            }}
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <Lock size={16} />
                <span>Sign in</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(220, 227, 232, 0.08)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '0.72rem',
            color: '#64748B'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="#34D399" />
            <span>SECURE ROLE-BASED SESSION</span>
          </div>
        </div>
      </main>
    </div>
  );
};
