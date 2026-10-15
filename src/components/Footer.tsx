import React from 'react';
import { ShieldCheck, MapPin, Phone, Mail, Globe, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255, 26, 140, 0.25)',
        backgroundColor: '#06040d',
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
                background: 'linear-gradient(135deg, #FF1A8C 0%, #FF66B2 50%, #FFFFFF 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              FESTRONIX '26
            </span>
          </div>
          <p style={{ color: '#CBD5E1', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '16px' }}>
            The official national-level technology festival of Vardhaman College of Engineering, Hyderabad.
            Orchestrated by the Student Affairs Council (SAC).
          </p>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={13} color="#FF1A8C" />
            <span>Autonomous • NAAC 'A++' Grade • NBA Accredited</span>
          </div>
        </div>

        {/* Col 2: Venue & Location */}
        <div>
          <h4
            style={{
              fontSize: '0.85rem',
              color: '#FF4D94',
              marginBottom: '14px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              letterSpacing: '0.08em'
            }}
          >
            CAMPUS VENUE
          </h4>
          <div style={{ display: 'flex', gap: '10px', color: '#94A3B8', fontSize: '0.83rem', lineHeight: 1.6 }}>
            <MapPin size={16} color="#FF1A8C" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#F8FAFC' }}>Vardhaman College of Engineering</strong><br />
              Kacharam, Shamshabad, Hyderabad,<br />
              Telangana 501218, India
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.78rem', color: '#FF66B2' }}>
            15 mins from Rajiv Gandhi International Airport (RGIA)
          </div>
        </div>

        {/* Col 3: Helpline & SAC Contacts */}
        <div>
          <h4
            style={{
              fontSize: '0.85rem',
              color: '#FF4D94',
              marginBottom: '14px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              letterSpacing: '0.08em'
            }}
          >
            CENTRAL DESK & QUERIES
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.83rem', color: '#CBD5E1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={14} color="#FF1A8C" />
              <span>SAC Helpline: +91 98480 99112</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={14} color="#FF4D94" />
              <span>festronix.support@vardhaman.org</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={14} color="#FF66B2" />
              <span>www.vardhaman.org</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.75rem',
          color: '#6B5E4E'
        }}
      >
        <div>
          © 2026 FESTRONIX • Vardhaman College of Engineering. All rights reserved.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9B8E7B' }}>
          <Sparkles size={11} color="#FF1A8C" />
          <span>Designed with passion for engineering excellence</span>
        </div>
      </div>
    </footer>
  );
};
