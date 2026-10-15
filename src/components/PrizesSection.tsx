import React from 'react';
import { Crown, Award, Gift, Rocket, Gem } from 'lucide-react';

export const PrizesSection: React.FC = () => {
  return (
    <section id="prizes" style={{ padding: '80px 20px', maxWidth: '1280px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#FF1A8C',
            fontSize: '0.78rem',
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '0.15em',
            marginBottom: '8px',
            fontWeight: 600
          }}
        >
          <Crown size={14} color="#FF1A8C" />
          <span>PRIZE POOL & REWARDS</span>
        </div>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 700,
            margin: '0 0 10px 0',
            letterSpacing: '0.02em',
            display: 'inline-block',
            background: 'linear-gradient(135deg, #FF1A8C 0%, #FFFFFF 40%, #FF66B2 75%, #D8005A 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          ₹5,00,000+ IN AWARDS
        </h2>
        <p style={{ color: '#CBD5E1', maxWidth: '640px', margin: '0 auto', fontSize: '0.95rem' }}>
          Cash prizes, startup incubation grants, internship offers, and certified industry recognition.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}
      >
        <div
          className="cyber-card"
          style={{
            padding: '30px',
            borderTop: '2px solid rgba(255, 26, 140, 0.7)',
            background: 'linear-gradient(180deg, rgba(255, 26, 140, 0.08) 0%, rgba(15, 11, 28, 0.85) 100%)'
          }}
        >
          <div
            style={{
              padding: '12px',
              background: 'rgba(255, 26, 140, 0.12)',
              borderRadius: '12px',
              display: 'inline-flex',
              marginBottom: '16px',
              border: '1px solid rgba(255, 26, 140, 0.3)'
            }}
          >
            <Crown size={28} color="#FF1A8C" />
          </div>
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#F8FAFC',
              marginBottom: '8px',
              letterSpacing: '0.02em'
            }}
          >
            Cash Rewards
          </h3>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: '1.85rem',
              fontWeight: 800,
              color: '#FF1A8C',
              marginBottom: '12px',
              lineHeight: 1
            }}
          >
            ₹3,50,000+
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Direct cash transfer to winners across 30+ competitive categories including Hackathons, RoboWars, and E-Sports championships.
          </p>
        </div>

        <div
          className="cyber-card"
          style={{
            padding: '30px',
            borderTop: '2px solid rgba(255, 77, 148, 0.7)',
            background: 'linear-gradient(180deg, rgba(255, 77, 148, 0.08) 0%, rgba(15, 11, 28, 0.85) 100%)'
          }}
        >
          <div
            style={{
              padding: '12px',
              background: 'rgba(255, 77, 148, 0.12)',
              borderRadius: '12px',
              display: 'inline-flex',
              marginBottom: '16px',
              border: '1px solid rgba(255, 77, 148, 0.3)'
            }}
          >
            <Rocket size={28} color="#FF4D94" />
          </div>
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#F8FAFC',
              marginBottom: '8px',
              letterSpacing: '0.02em'
            }}
          >
            Startup Incubation
          </h3>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: '1.85rem',
              fontWeight: 800,
              color: '#FF4D94',
              marginBottom: '12px',
              lineHeight: 1
            }}
          >
            ₹1,50,000+
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Seed incubation funding from Vardhaman CIE, plus cloud credits and legal mentoring for promising startups.
          </p>
        </div>

        <div
          className="cyber-card"
          style={{
            padding: '30px',
            borderTop: '2px solid rgba(255, 102, 178, 0.7)',
            background: 'linear-gradient(180deg, rgba(255, 102, 178, 0.08) 0%, rgba(15, 11, 28, 0.85) 100%)'
          }}
        >
          <div
            style={{
              padding: '12px',
              background: 'rgba(255, 102, 178, 0.12)',
              borderRadius: '12px',
              display: 'inline-flex',
              marginBottom: '16px',
              border: '1px solid rgba(255, 102, 178, 0.3)'
            }}
          >
            <Gem size={28} color="#FF66B2" />
          </div>
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#F8FAFC',
              marginBottom: '8px',
              letterSpacing: '0.02em'
            }}
          >
            Certifications & Trophies
          </h3>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: '1.85rem',
              fontWeight: 800,
              color: '#FF66B2',
              marginBottom: '12px',
              lineHeight: 1
            }}
          >
            SAC Endorsed
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Exclusive metallic trophies, merit certificates for podium finishers, and verifiable digital certificates.
          </p>
        </div>
      </div>
    </section>
  );
};
