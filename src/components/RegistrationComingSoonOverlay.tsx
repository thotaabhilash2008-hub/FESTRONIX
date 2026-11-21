import React, { useEffect } from 'react';
import { Clock3, Sparkles } from 'lucide-react';

/**
 * Public-facing gate kept above the homepage while registrations are paused.
 * It is purely presentational: it never reads or writes event/registration data.
 */
export const RegistrationComingSoonOverlay: React.FC = () => {
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="registration-coming-soon-title"
      aria-describedby="registration-coming-soon-description"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background:
          'radial-gradient(circle at 50% 18%, rgba(99, 102, 241, 0.28) 0%, rgba(8, 12, 22, 0.94) 48%, rgba(3, 5, 11, 0.98) 100%)',
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        touchAction: 'none',
        overscrollBehavior: 'none',
      }}
    >
      <style>{`
        .festronix-gate-card::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, rgba(129,140,248,0.9), rgba(56,189,248,0.55) 45%, rgba(244,114,182,0.7));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        @keyframes festronix-gate-pulse {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.12); opacity: 0.95; }
        }
        .festronix-gate-orb { animation: festronix-gate-pulse 2.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .festronix-gate-orb { animation: none; }
        }
      `}</style>

      <div
        className="festronix-gate-card"
        style={{
          position: 'relative',
          width: 'min(100%, 560px)',
          borderRadius: '28px',
          padding: '48px 40px 40px',
          textAlign: 'center',
          color: '#F8FAFC',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.92) 0%, rgba(8, 12, 22, 0.96) 100%)',
          boxShadow: '0 40px 120px rgba(0, 0, 0, 0.55)',
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          aria-hidden="true"
          className="festronix-gate-orb"
          style={{
            position: 'absolute',
            top: '-68px',
            left: '50%',
            width: '180px',
            height: '180px',
            marginLeft: '-90px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.55) 0%, rgba(56,189,248,0.16) 55%, transparent 70%)',
            filter: 'blur(6px)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '999px',
            border: '1px solid rgba(148, 163, 184, 0.28)',
            background: 'rgba(148, 163, 184, 0.08)',
            color: '#CBD5E1',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          <Sparkles size={13} aria-hidden="true" />
          Festronix 2026
        </div>

        <h1
          id="registration-coming-soon-title"
          style={{
            margin: '24px 0 14px',
            fontSize: 'clamp(36px, 7vw, 58px)',
            lineHeight: 1.02,
            letterSpacing: '-0.045em',
            fontWeight: 800,
            background: 'linear-gradient(120deg, #FFFFFF 0%, #A5B4FC 48%, #67E8F9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Registrations
          <br />
          opening soon
        </h1>

        <p
          id="registration-coming-soon-description"
          style={{
            margin: '0 auto',
            maxWidth: '420px',
            color: '#94A3B8',
            fontSize: '15px',
            lineHeight: 1.7,
          }}
        >
          We’re putting the final touches on the pass desk. The registration portal will open here shortly — stay tuned.
        </p>

        <div
          style={{
            marginTop: '30px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: '999px',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(129, 140, 248, 0.35)',
            color: '#C7D2FE',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <Clock3 size={16} aria-hidden="true" />
          Coming soon
        </div>
      </div>
    </div>
  );
};

export default RegistrationComingSoonOverlay;
