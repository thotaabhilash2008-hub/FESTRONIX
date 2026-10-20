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
              background: 'rgba(46, 78, 140, 0.16)',
              border: '1px solid rgba(61, 104, 178, 0.35)',
              color: '#3D68B2',
              fontSize: '0.75rem',
              fontWeight: 800,
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '0.14em',
              marginBottom: '12px'
            }}
          >
            <Crown size={14} color="#3D68B2" />
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
            ₹5,00,000+ IN <span style={{ color: '#3D68B2' }}>AWARDS & GRANTS</span>
          </h2>

          <p style={{ color: '#777F8E', maxWidth: '660px', margin: '0 auto', fontSize: '0.96rem', lineHeight: 1.7 }}>
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
                borderTop: '2px solid #3D68B2',
                background: 'rgba(21, 24, 32, 0.94)',
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(46, 78, 140, 0.18)',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  marginBottom: '20px',
                  border: '1px solid rgba(61, 104, 178, 0.35)'
                }}
              >
                <Crown size={26} color="#3D68B2" />
              </div>

              <h3
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: '#F3F0EA',
                  marginBottom: '8px',
                  letterSpacing: '-0.02em'
                }}
              >
                Cash Rewards
              </h3>

              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: '#3D68B2',
                  marginBottom: '14px',
                  lineHeight: 1
                }}
              >
                ₹3,50,000+
              </div>

              <p style={{ color: '#777F8E', fontSize: '0.9rem', lineHeight: 1.65 }}>
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
                borderTop: '2px solid #C7CBD4',
                background: 'rgba(21, 24, 32, 0.94)',
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(199, 203, 212, 0.12)',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  marginBottom: '20px',
                  border: '1px solid rgba(199, 203, 212, 0.3)'
                }}
              >
                <Rocket size={26} color="#C7CBD4" />
              </div>

              <h3
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: '#F3F0EA',
                  marginBottom: '8px',
                  letterSpacing: '-0.02em'
                }}
              >
                Startup Incubation
              </h3>

              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: '#C7CBD4',
                  marginBottom: '14px',
                  lineHeight: 1
                }}
              >
                ₹1,50,000+
              </div>

              <p style={{ color: '#777F8E', fontSize: '0.9rem', lineHeight: 1.65 }}>
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
                borderTop: '2px solid rgba(199, 203, 212, 0.4)',
                background: 'rgba(21, 24, 32, 0.94)',
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(111, 150, 147, 0.14)',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  marginBottom: '20px',
                  border: '1px solid rgba(111, 150, 147, 0.35)'
                }}
              >
                <Gem size={26} color="#88B2AE" />
              </div>

              <h3
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: '#F3F0EA',
                  marginBottom: '8px',
                  letterSpacing: '-0.02em'
                }}
              >
                SAC Verified Honors
              </h3>

              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: '#F3F0EA',
                  marginBottom: '14px',
                  lineHeight: 1
                }}
              >
                SAC Endorsed
              </div>

              <p style={{ color: '#777F8E', fontSize: '0.9rem', lineHeight: 1.65 }}>
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
