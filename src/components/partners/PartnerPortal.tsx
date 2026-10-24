import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Rocket, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  ExternalLink 
} from 'lucide-react';
import { SponsorDashboard } from './SponsorDashboard';
import { AmbassadorDashboard } from './AmbassadorDashboard';
import { GlitterBackground } from '../GlitterBackground';
import './partner.css';

interface PartnerPortalProps {
  initialTab?: 'sponsors' | 'ambassadors';
  onBackToFest: () => void;
}

export const PartnerPortal: React.FC<PartnerPortalProps> = ({ 
  initialTab = 'sponsors', 
  onBackToFest 
}) => {
  const [activeWing, setActiveWing] = useState<'sponsors' | 'ambassadors'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (hash.includes('ambassador') || path.includes('ambassador')) {
        return 'ambassadors';
      }
    }
    return initialTab;
  });

  const handleTabChange = (wing: 'sponsors' | 'ambassadors') => {
    setActiveWing(wing);
    if (typeof window !== 'undefined') {
      window.location.hash = wing === 'sponsors' ? '#partners' : '#ambassadors';
    }
  };

  return (
    <div className="partner-hub-container" style={{ background: '#080C16' }}>
      
      {/* Background Glitter Starfield & Ambient Glow */}
      <GlitterBackground />
      <div className="glitter-stardust-layer" />
      <div className="partner-ambient-canvas">
        <div className="partner-ambient-orb-1" />
        <div className="partner-ambient-orb-2" />
        <div className="partner-ambient-orb-3" />
      </div>

      {/* Persistent Top Navigation Bar */}
      <header className="partner-header-bar">
        
        {/* Brand Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBackToFest}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(199, 203, 212, 0.2)',
              borderRadius: '9999px',
              padding: '6px 12px',
              color: '#C7CBD4',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#C7CBD4';
              e.currentTarget.style.borderColor = 'rgba(199, 203, 212, 0.2)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Fest</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="/vce_logo.png" 
              alt="VCE" 
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }} 
            />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                FESTRONIX '26
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Partner & Outreach Ecosystem
              </div>
            </div>
          </div>
        </div>

        {/* Wing Switcher Navigation Tabs */}
        <nav className="partner-nav-tabs">
          <button
            onClick={() => handleTabChange('sponsors')}
            className={`partner-nav-tab ${activeWing === 'sponsors' ? 'active' : ''}`}
          >
            <Building2 size={15} color={activeWing === 'sponsors' ? '#38BDF8' : '#94A3B8'} />
            <span>Sponsor Executive Lounge</span>
          </button>

          <button
            onClick={() => handleTabChange('ambassadors')}
            className={`partner-nav-tab ${activeWing === 'ambassadors' ? 'active-ambassador' : ''}`}
          >
            <Rocket size={15} color={activeWing === 'ambassadors' ? '#C084FC' : '#94A3B8'} />
            <span>Campus Ambassador Hub</span>
          </button>
        </nav>

        {/* Right Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '4px 10px', 
              borderRadius: '9999px',
              background: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              color: '#34D399',
              fontSize: '0.72rem',
              fontWeight: 700 
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399' }} />
            <span>SAC Portal Online</span>
          </div>
        </div>

      </header>

      {/* Main Wing Body */}
      <main style={{ position: 'relative', zIndex: 10 }}>
        {activeWing === 'sponsors' ? (
          <SponsorDashboard onBackToFest={onBackToFest} />
        ) : (
          <AmbassadorDashboard onBackToFest={onBackToFest} />
        )}
      </main>

    </div>
  );
};
