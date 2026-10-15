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
            color: '#00F0D0',
            fontSize: '0.78rem',
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '0.15em',
            marginBottom: '8px',
            fontWeight: 600
          }}
        >
          <Crown size={14} color="#00F0D0" />
          <span>PRIZE POOL & REWARDS</span>
        </div>
        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 400,
            margin: '0 0 10px 0',
            letterSpacing: '0.04em',
            display: 'inline-block',
            background: 'linear-gradient(135deg, #FFD700 0%, #FFFFFF 40%, #00F0D0 75%, #C026D3 100%)',
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
            borderTop: '2px solid rgba(255, 215, 0, 0.6)',
            background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.05) 0%, rgba(15, 11, 28, 0.85) 100%)'
          }}
        >
          <div
            style={{
              padding: '12px',
              background: 'rgba(255, 215, 0, 0.1)',
              borderRadius: '12px',
              display: 'inline-flex',
              marginBottom: '16px',
              border: '1px solid rgba(255, 215, 0, 0.25)'
            }}
          >
            <Crown size={28} color="#FFD700" />
          </div>
          <h3
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.5rem',
              color: '#F8FAFC',
              marginBottom: '8px',
              letterSpacing: '0.03em'
            }}
          >
            Cash Rewards
          </h3>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '2.2rem',
              color: '#FFD700',
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
            borderTop: '2px solid rgba(0, 240, 208, 0.6)',
            background: 'linear-gradient(180deg, rgba(0, 240, 208, 0.05) 0%, rgba(15, 11, 28, 0.85) 100%)'
          }}
        >
          <div
            style={{
              padding: '12px',
              background: 'rgba(0, 240, 208, 0.1)',
              borderRadius: '12px',
              display: 'inline-flex',
              marginBottom: '16px',
              border: '1px solid rgba(0, 240, 208, 0.25)'
            }}
          >
            <Rocket size={28} color="#00F0D0" />
          </div>
          <h3
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.5rem',
              color: '#F8FAFC',
              marginBottom: '8px',
              letterSpacing: '0.03em'
            }}
          >
            Startup Incubation
          </h3>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '2.2rem',
              color: '#00F0D0',
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
            borderTop: '2px solid rgba(192, 38, 211, 0.6)',
            background: 'linear-gradient(180deg, rgba(192, 38, 211, 0.05) 0%, rgba(15, 11, 28, 0.85) 100%)'
          }}
        >
          <div
            style={{
              padding: '12px',
              background: 'rgba(192, 38, 211, 0.1)',
              borderRadius: '12px',
              display: 'inline-flex',
              marginBottom: '16px',
              border: '1px solid rgba(192, 38, 211, 0.25)'
            }}
          >
            <Gem size={28} color="#F0ABFC" />
          </div>
          <h3
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.5rem',
              color: '#F8FAFC',
              marginBottom: '8px',
              letterSpacing: '0.03em'
            }}
          >
            Certifications & Trophies
          </h3>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '2.2rem',
              color: '#F0ABFC',
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
