import React from 'react';
import { Crown, Rocket, Gem } from 'lucide-react';
import { Tilt3DCard } from './3d';
import { ScrollReveal } from './animations';

export const PrizesSection: React.FC = () => {
  return (
    <section id="prizes" style={{ padding: '100px 20px 80px', maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
      <ScrollReveal threshold="top 90%" duration={0.8}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 18px',
              borderRadius: '9999px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38BDF8',
              fontSize: '0.75rem',
              fontWeight: 800,
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '0.14em',
              marginBottom: '12px',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.2)'
            }}
          >
            <Crown size={14} color="#38BDF8" />
            <span>06 // REWARD POOL & INCUBATION</span>
          </div>

          <h2
            className="text-editorial-headline"
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
              fontWeight: 800,
              margin: '0 0 14px 0',
              display: 'inline-block'
            }}
          >
            ₹5,00,000+ IN <span style={{ color: '#FBBF24', textShadow: '0 0 24px rgba(251, 191, 36, 0.5)' }}>AWARDS & GRANTS</span>
          </h2>

          <p style={{ color: '#CBD5E1', maxWidth: '660px', margin: '0 auto', fontSize: 'clamp(0.96rem, 1.4vw, 1.05rem)', lineHeight: 1.7, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            Direct cash rewards, startup incubation seed funding, and verified SAC podium merit recognition.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal threshold="top 85%" stagger={0.12} duration={0.8}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}
        >
          {/* Card 1: Direct Cash Rewards */}
          <Tilt3DCard maxTilt={5} scale={1.02}>
            <div
              className="cyber-card"
              style={{
                padding: '36px',
                borderTop: '2px solid #38BDF8',
                background: 'rgba(15, 22, 38, 0.94)',
                border: '1px solid rgba(148, 163, 184, 0.22)',
                boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(20px)',
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(56, 189, 248, 0.14)',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  marginBottom: '20px',
                  border: '1px solid rgba(56, 189, 248, 0.35)'
                }}
              >
                <Crown size={26} color="#38BDF8" />
              </div>

              <h3
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  marginBottom: '8px',
                  letterSpacing: '-0.02em'
                }}
              >
                Cash Rewards
              </h3>

              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '2.1rem',
                  fontWeight: 800,
                  color: '#38BDF8',
                  marginBottom: '14px',
                  lineHeight: 1,
                  textShadow: '0 0 16px rgba(56, 189, 248, 0.4)'
                }}
              >
                ₹3,50,000+
              </div>

              <p style={{ color: '#CBD5E1', fontSize: '0.92rem', lineHeight: 1.65 }}>
                Direct bank disbursement to winners across 30+ competitive categories including Hackathons, RoboWars, and E-Sports championships.
              </p>
            </div>
          </Tilt3DCard>

          {/* Card 2: CIE Startup Incubation */}
          <Tilt3DCard maxTilt={5} scale={1.02}>
            <div
              className="cyber-card"
              style={{
                padding: '36px',
                borderTop: '2px solid #FBBF24',
                background: 'rgba(15, 22, 38, 0.94)',
                border: '1px solid rgba(148, 163, 184, 0.22)',
                boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(20px)',
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(251, 191, 36, 0.14)',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  marginBottom: '20px',
                  border: '1px solid rgba(251, 191, 36, 0.35)'
                }}
              >
                <Rocket size={26} color="#FBBF24" />
              </div>

              <h3
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  marginBottom: '8px',
                  letterSpacing: '-0.02em'
                }}
              >
                Startup Incubation
              </h3>

              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '2.1rem',
                  fontWeight: 800,
                  color: '#FBBF24',
                  marginBottom: '14px',
                  lineHeight: 1,
                  textShadow: '0 0 16px rgba(251, 191, 36, 0.4)'
                }}
              >
                ₹1,50,000+
              </div>

              <p style={{ color: '#CBD5E1', fontSize: '0.92rem', lineHeight: 1.65 }}>
                Seed incubation grant from Vardhaman Centre for Innovation and Entrepreneurship (CIE), plus cloud computing credits and legal mentoring.
              </p>
            </div>
          </Tilt3DCard>

          {/* Card 3: SAC Certified Trophies */}
          <Tilt3DCard maxTilt={5} scale={1.02}>
            <div
              className="cyber-card"
              style={{
                padding: '36px',
                borderTop: '2px solid #34D399',
                background: 'rgba(15, 22, 38, 0.94)',
                border: '1px solid rgba(148, 163, 184, 0.22)',
                boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(20px)',
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(52, 211, 153, 0.14)',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  marginBottom: '20px',
                  border: '1px solid rgba(52, 211, 153, 0.35)'
                }}
              >
                <Gem size={26} color="#34D399" />
              </div>

              <h3
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  marginBottom: '8px',
                  letterSpacing: '-0.02em'
                }}
              >
                SAC Verified Honors
              </h3>

              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '2.1rem',
                  fontWeight: 800,
                  color: '#34D399',
                  marginBottom: '14px',
                  lineHeight: 1,
                  textShadow: '0 0 16px rgba(52, 211, 153, 0.4)'
                }}
              >
                SAC Endorsed
              </div>

              <p style={{ color: '#CBD5E1', fontSize: '0.92rem', lineHeight: 1.65 }}>
                Machined liquid silver trophies for podium finishers, merit certificates, and cryptographic verification on digital passes.
              </p>
            </div>
          </Tilt3DCard>
        </div>
      </ScrollReveal>
    </section>
  );
};

export default PrizesSection;
