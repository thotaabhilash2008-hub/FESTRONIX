import React from 'react';
import { ArrowLeft, Shield, FileText, AlertCircle, ShieldCheck } from 'lucide-react';

interface LegalHeaderProps {
  activePage: 'privacy' | 'terms' | 'refund';
  onNavigate: (page: 'privacy' | 'terms' | 'refund') => void;
  onBackToHome: () => void;
}

export const LegalHeader: React.FC<LegalHeaderProps> = ({
  activePage,
  onNavigate,
  onBackToHome
}) => {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(8, 12, 22, 0.92)',
        borderBottom: '1px solid rgba(120, 149, 147, 0.22)',
        padding: '16px 24px'
      }}
    >
      <div
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        {/* Brand / Back button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBackToHome}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(220, 227, 229, 0.25)',
              color: '#DCE3E5',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = '#DCE3E5';
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #38BDF8 60%, #C084FC 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              FESTRONIX '26
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                color: '#34D399',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                background: 'rgba(52, 211, 153, 0.1)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 700,
                letterSpacing: '0.06em'
              }}
            >
              LEGAL & POLICIES
            </span>
          </div>
        </div>

        {/* Legal Pages Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('privacy')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: activePage === 'privacy' ? 700 : 500,
              cursor: 'pointer',
              border: activePage === 'privacy' ? '1px solid #38BDF8' : '1px solid transparent',
              background: activePage === 'privacy' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activePage === 'privacy' ? '#38BDF8' : '#94A3B8',
              transition: 'all 0.15s ease'
            }}
          >
            <Shield size={14} />
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => onNavigate('terms')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: activePage === 'terms' ? 700 : 500,
              cursor: 'pointer',
              border: activePage === 'terms' ? '1px solid #C084FC' : '1px solid transparent',
              background: activePage === 'terms' ? 'rgba(192, 132, 252, 0.15)' : 'transparent',
              color: activePage === 'terms' ? '#C084FC' : '#94A3B8',
              transition: 'all 0.15s ease'
            }}
          >
            <FileText size={14} />
            <span>Terms & Conditions</span>
          </button>

          <button
            onClick={() => onNavigate('refund')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: activePage === 'refund' ? 700 : 500,
              cursor: 'pointer',
              border: activePage === 'refund' ? '1px solid #F59E0B' : '1px solid transparent',
              background: activePage === 'refund' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: activePage === 'refund' ? '#FBBF24' : '#94A3B8',
              transition: 'all 0.15s ease'
            }}
          >
            <AlertCircle size={14} />
            <span>Refund Policy (No Refund)</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
