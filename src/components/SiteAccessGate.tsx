import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Eye, EyeOff, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface SiteAccessGateProps {
  onUnlock: () => void;
}

const ACCESS_PASSWORD = 'vmeg@cc';
export const ACCESS_STORAGE_KEY = 'festronix_access_unlocked';

export const isSiteAccessGranted = (): boolean => true;

export const SiteAccessGate: React.FC<SiteAccessGateProps> = ({ onUnlock }) => {
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === ACCESS_PASSWORD) {
      setIsSuccess(true);
      setError('');
      try {
        sessionStorage.setItem(ACCESS_STORAGE_KEY, 'granted');
        localStorage.setItem(ACCESS_STORAGE_KEY, 'granted');
      } catch (err) {
        console.warn('Unable to persist access token in storage:', err);
      }
      setTimeout(() => {
        onUnlock();
      }, 400);
    } else {
      setError('Incorrect passcode. Access denied.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: '#080C16',
        overflow: 'hidden'
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 50% 20%, rgba(56, 189, 248, 0.15), transparent 50%), radial-gradient(circle at 80% 80%, rgba(136, 178, 174, 0.1), transparent 40%)',
          pointerEvents: 'none'
        }}
      />

      {/* Access Gate Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '440px',
          background: 'linear-gradient(160deg, rgba(14, 21, 37, 0.92) 0%, rgba(8, 12, 22, 0.96) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.28)',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.12)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          transition: 'transform 0.2s ease',
          transform: isShaking ? 'translateX(-10px)' : 'none',
          animation: isShaking ? 'gateShake 0.4s ease' : undefined
        }}
      >
        <style>{`
          @keyframes gateShake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
          }
        `}</style>

        {/* Lock Icon Emblem */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: isSuccess
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05))'
              : 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(56, 189, 248, 0.04))',
            border: isSuccess
              ? '1px solid rgba(34, 197, 94, 0.4)'
              : '1px solid rgba(56, 189, 248, 0.3)',
            marginBottom: '20px',
            boxShadow: isSuccess
              ? '0 0 24px rgba(34, 197, 94, 0.35)'
              : '0 0 24px rgba(56, 189, 248, 0.25)'
          }}
        >
          {isSuccess ? (
            <Unlock style={{ width: '28px', height: '28px', color: '#4ADE80' }} />
          ) : (
            <Lock style={{ width: '28px', height: '28px', color: '#38BDF8' }} />
          )}
        </div>

        {/* Badge & Title */}
        <div
          style={{
            display: 'inline-block',
            fontSize: '0.72rem',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            letterSpacing: '0.22em',
            color: '#88B2AE',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}
        >
          VARDHAMAN COLLEGE OF ENGINEERING
        </div>

        <h2
          style={{
            margin: '0 0 8px 0',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.65rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: '#F8FAFC'
          }}
        >
          FESTRONIX '26
        </h2>

        <p
          style={{
            margin: '0 0 28px 0',
            color: '#94A3B8',
            fontSize: '0.88rem',
            lineHeight: 1.5
          }}
        >
          Please enter the website access code to proceed into the portal.
        </p>

        {/* Password Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={passcode}
              onChange={e => {
                setPasscode(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter passcode"
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '14px 44px 14px 18px',
                borderRadius: '12px',
                backgroundColor: 'rgba(8, 12, 22, 0.8)',
                border: error
                  ? '1px solid #EF4444'
                  : '1px solid rgba(56, 189, 248, 0.35)',
                color: '#F8FAFC',
                fontSize: '0.98rem',
                letterSpacing: showPassword ? 'normal' : '0.15em',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                boxShadow: error
                  ? '0 0 12px rgba(239, 68, 68, 0.3)'
                  : 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
              }}
              onFocus={e => {
                if (!error) e.target.style.borderColor = '#38BDF8';
              }}
              onBlur={e => {
                if (!error) e.target.style.borderColor = 'rgba(56, 189, 248, 0.35)';
              }}
            />

            {/* Toggle show/hide button */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
              title={showPassword ? 'Hide passcode' : 'Show passcode'}
            >
              {showPassword ? (
                <EyeOff style={{ width: '18px', height: '18px' }} />
              ) : (
                <Eye style={{ width: '18px', height: '18px' }} />
              )}
            </button>
          </div>

          {/* Error / Success Feedback */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: '#F87171',
                fontSize: '0.82rem',
                fontWeight: 600,
                textAlign: 'left'
              }}
            >
              <ShieldAlert style={{ width: '15px', height: '15px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: '#4ADE80',
                fontSize: '0.82rem',
                fontWeight: 600
              }}
            >
              <CheckCircle2 style={{ width: '15px', height: '15px', flexShrink: 0 }} />
              <span>Access granted! Entering Festronix...</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSuccess || !passcode}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 24px',
              marginTop: '6px',
              borderRadius: '12px',
              background: isSuccess
                ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                : 'linear-gradient(135deg, #0284C7, #0369A1)',
              border: 'none',
              color: '#FFFFFF',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.94rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              cursor: isSuccess || !passcode ? 'not-allowed' : 'pointer',
              opacity: !passcode ? 0.6 : 1,
              transition: 'all 0.2s ease',
              boxShadow: isSuccess
                ? '0 0 20px rgba(34, 197, 94, 0.4)'
                : '0 4px 15px rgba(2, 132, 199, 0.4)'
            }}
            onMouseEnter={e => {
              if (!isSuccess && passcode) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(2, 132, 199, 0.6)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(2, 132, 199, 0.4)';
            }}
          >
            <span>{isSuccess ? 'Verified' : 'Enter Website'}</span>
            <ArrowRight style={{ width: '17px', height: '17px' }} />
          </button>
        </form>

        <div
          style={{
            marginTop: '24px',
            fontSize: '0.74rem',
            color: '#64748B',
            letterSpacing: '0.05em'
          }}
        >
          Student Activity Council (SAC) • National Level Technical Fest
        </div>
      </div>
    </div>
  );
};
