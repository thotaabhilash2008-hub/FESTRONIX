import React from 'react';
import { ShieldCheck, MapPin, Phone, Mail, Globe, Sparkles, Shield, Rocket } from 'lucide-react';

interface FooterProps {
  onOpenAdmin?: () => void;
  onOpenSponsors?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, onOpenSponsors }) => {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(120, 149, 147, 0.25)',
        backgroundColor: '#0C1326',
        padding: '60px 20px 30px',
        position: 'relative',
        zIndex: 10
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '40px',
          marginBottom: '50px'
        }}
      >
        {/* Col 1: Brand & College */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: '1.5rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                display: 'inline-block',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #DCE3E5 50%, #BACEBB 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              FESTRONIX '26
            </span>
          </div>
          <p style={{ color: '#A8B3C2', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '16px' }}>
            The official national-level technology festival of Vardhaman College of Engineering, Hyderabad.
            Orchestrated by the Student Affairs Council (SAC).
          </p>
          <div style={{ fontSize: '0.78rem', color: '#A8B3C2', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={13} color="#BACEBB" />
            <span>Autonomous • NAAC 'A++' Grade • NBA Accredited</span>
          </div>
        </div>

        {/* Col 2: Venue & Location */}
        <div>
          <h4
            style={{
              fontSize: '0.85rem',
              color: '#DCE3E5',
              marginBottom: '14px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              letterSpacing: '0.08em'
            }}
          >
            CAMPUS VENUE
          </h4>
          <div style={{ display: 'flex', gap: '10px', color: '#A8B3C2', fontSize: '0.83rem', lineHeight: 1.6 }}>
            <MapPin size={16} color="#BACEBB" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#FFFFFF' }}>Vardhaman College of Engineering</strong><br />
              Kacharam, Shamshabad, Hyderabad,<br />
              Telangana 501218, India
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.78rem', color: '#BACEBB' }}>
            15 mins from Rajiv Gandhi International Airport (RGIA)
          </div>
        </div>

        {/* Col 3: Helpline & SAC Contacts */}
        <div>
          <h4
            style={{
              fontSize: '0.85rem',
              color: '#DCE3E5',
              marginBottom: '14px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              letterSpacing: '0.08em'
            }}
          >
            CENTRAL DESK & QUERIES
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.83rem', color: '#A8B3C2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={14} color="#BACEBB" />
              <span>SAC Helpline: +91 98480 99112</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={14} color="#789593" />
              <span>festronix.support@vardhaman.org</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={14} color="#DCE3E5" />
              <span>www.vardhaman.org</span>
            </div>

            {/* Official Event & Tech Partners */}
            <div
              style={{
                marginTop: '16px',
                paddingTop: '14px',
                borderTop: '1px solid rgba(120, 149, 147, 0.25)'
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#DCE3E5',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  marginBottom: '10px'
                }}
              >
                OFFICIAL EVENT & TECH PARTNERS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <a
                  href="https://connectclub.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Connect Club"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    textDecoration: 'none',
                    color: '#F3F0EA',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <img
                    src="/connect_club_transparent.png"
                    alt="Connect Club"
                    style={{
                      height: '24px',
                      width: 'auto',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.25))'
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Connect Club</span>
                </a>

                <a
                  href="https://vencorpia.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Vencorpia — One Stop for Effortless Events"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    textDecoration: 'none',
                    color: '#F3F0EA',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <img
                    src="/vencorpia_transparent.png"
                    alt="Vencorpia"
                    style={{
                      height: '22px',
                      width: 'auto',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 0 6px rgba(0, 194, 255, 0.3))'
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Vencorpia</span>
                </a>
              </div>
            </div>

            
            {onOpenSponsors && (
              <div style={{ marginTop: '8px' }}>
                <button
                  onClick={onOpenSponsors}
                  style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(56, 189, 248, 0.2) 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.45)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    color: '#E9D5FF',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: "'Space Grotesk', sans-serif"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(56, 189, 248, 0.35) 100%)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(56, 189, 248, 0.2) 100%)';
                    e.currentTarget.style.color = '#E9D5FF';
                  }}
                >
                  <Rocket size={14} color="#C084FC" />
                  <span>View All Sponsors & Partners</span>
                </button>
              </div>
            )}

            
          {onOpenSponsors && (
            <button
              onClick={onOpenSponsors}
              style={{
                background: 'none',
                border: 'none',
                color: '#C084FC',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Sponsors & Campus Ambassadors
            </button>
          )}
          {onOpenAdmin && (
              <div style={{ marginTop: '6px' }}>
                <button
                  onClick={onOpenAdmin}
                  style={{
                    background: 'rgba(40, 59, 120, 0.35)',
                    border: '1px solid rgba(120, 149, 147, 0.45)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    color: '#BACEBB',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: "'Space Grotesk', sans-serif"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(40, 59, 120, 0.6)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(40, 59, 120, 0.35)';
                    e.currentTarget.style.color = '#BACEBB';
                  }}
                >
                  <Shield size={14} color="#BACEBB" />
                  <span>Admin Portal (Dean SAC & HODs)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          paddingTop: '24px',
          borderTop: '1px solid rgba(220, 227, 229, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.75rem',
          color: '#A8B3C2'
        }}
      >
        <div>
          © 2026 FESTRONIX • Vardhaman College of Engineering. All rights reserved.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              style={{
                background: 'none',
                border: 'none',
                color: '#789593',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Faculty & Admin Gateway
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#BACEBB' }}>
            <Sparkles size={11} color="#BACEBB" />
            <span>Designed with passion for engineering excellence</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
