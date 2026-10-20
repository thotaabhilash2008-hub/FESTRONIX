import React from 'react';
import { ShieldCheck, Cpu, Rocket, Terminal, Sparkles } from 'lucide-react';
import { Tilt3DCard } from './3d';
import { ScrollReveal } from './animations';

export const AboutSection: React.FC = () => {
  return (
    <section
      id="about"
      style={{
        padding: '110px 20px 80px',
        maxWidth: '1280px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}
    >
      {/* Editorial Header */}
      <ScrollReveal threshold="top 85%" duration={0.9}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 18px',
              borderRadius: '9999px',
              background: 'rgba(255, 107, 53, 0.1)',
              border: '1px solid rgba(255, 107, 53, 0.35)',
              color: '#FF6B35',
              fontSize: '0.75rem',
              fontWeight: 800,
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '0.16em',
              marginBottom: '14px'
            }}
          >
            <Sparkles size={14} color="#FF6B35" />
            <span>01 // THE GENESIS & MISSION</span>
          </div>

          <h2
            className="text-editorial-headline"
            style={{
              fontSize: 'clamp(2.4rem, 5.5vw, 3.8rem)',
              fontWeight: 800,
              margin: '0 0 16px 0',
              lineHeight: 1.1,
              display: 'inline-block'
            }}
          >
            WHERE ENGINEERING MEETS <span style={{ color: '#FF6B35' }}>RAW ADRENALINE</span>
          </h2>

          <p
            style={{
              color: '#777F8E',
              maxWidth: '740px',
              margin: '0 auto',
              fontSize: 'clamp(0.98rem, 1.4vw, 1.1rem)',
              lineHeight: 1.75
            }}
          >
            Orchestrated by the Student Affairs Council (SAC) at Vardhaman College of Engineering,
            FESTRONIX 2026 converges 9 engineering faculties into a battle-tested proving ground
            for autonomous robotics, precision algorithms, and seed-funded startup ventures.
          </p>
        </div>
      </ScrollReveal>

      {/* Numbered Editorial Dossier Cards */}
      <ScrollReveal threshold="top 80%" stagger={0.12} duration={0.9}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}
        >
          {/* Dossier 01 */}
          <Tilt3DCard maxTilt={5} scale={1.02}>
            <div
              className="cyber-card"
              style={{
                padding: '36px',
                borderRadius: '20px',
                background: 'rgba(21, 24, 32, 0.92)',
                border: '1px solid rgba(199, 203, 212, 0.18)',
                height: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'rgba(255, 107, 53, 0.12)',
                      border: '1px solid rgba(255, 107, 53, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Cpu size={22} color="#FF6B35" />
                  </div>
                  <span className="text-editorial-meta" style={{ color: '#FF6B35', fontWeight: 800 }}>
                    DOSSIER 01
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#F3F0EA',
                    marginBottom: '10px',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Battle-Hardened Arenas
                </h3>

                <p style={{ color: '#777F8E', fontSize: '0.92rem', lineHeight: 1.7 }}>
                  From heavy steel combat RoboWars and autonomous drone obstacle courses to 24-hour non-stop
                  hackathons, every arena is supervised by expert faculty juries and verified technical standards.
                </p>
              </div>

              <div
                style={{
                  marginTop: '24px',
                  paddingTop: '18px',
                  borderTop: '1px solid rgba(199, 203, 212, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  color: '#C7CBD4',
                  fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif"
                }}
              >
                <Terminal size={14} color="#FF6B35" />
                <span>30+ COMPETITIVE ARENAS</span>
              </div>
            </div>
          </Tilt3DCard>

          {/* Dossier 02 */}
          <Tilt3DCard maxTilt={5} scale={1.02}>
            <div
              className="cyber-card"
              style={{
                padding: '36px',
                borderRadius: '20px',
                background: 'rgba(21, 24, 32, 0.92)',
                border: '1px solid rgba(199, 203, 212, 0.18)',
                height: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'rgba(199, 203, 212, 0.12)',
                      border: '1px solid rgba(199, 203, 212, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ShieldCheck size={22} color="#C7CBD4" />
                  </div>
                  <span className="text-editorial-meta" style={{ color: '#C7CBD4', fontWeight: 800 }}>
                    DOSSIER 02
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#F3F0EA',
                    marginBottom: '10px',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Autonomous Vanguard
                </h3>

                <p style={{ color: '#777F8E', fontSize: '0.92rem', lineHeight: 1.7 }}>
                  Hosted across Vardhaman College of Engineering's 20+ acre campus in Shamshabad, Hyderabad.
                  Recognized with NAAC 'A++' Grade and NBA Accreditation for high-precision technical education.
                </p>
              </div>

              <div
                style={{
                  marginTop: '24px',
                  paddingTop: '18px',
                  borderTop: '1px solid rgba(199, 203, 212, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  color: '#C7CBD4',
                  fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif"
                }}
              >
                <ShieldCheck size={14} color="#C7CBD4" />
                <span>NAAC A++ • SHAMSHABAD HYDERABAD</span>
              </div>
            </div>
          </Tilt3DCard>

          {/* Dossier 03 */}
          <Tilt3DCard maxTilt={5} scale={1.02}>
            <div
              className="cyber-card"
              style={{
                padding: '36px',
                borderRadius: '20px',
                background: 'rgba(21, 24, 32, 0.92)',
                border: '1px solid rgba(199, 203, 212, 0.18)',
                height: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'rgba(255, 107, 53, 0.12)',
                      border: '1px solid rgba(255, 107, 53, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Rocket size={22} color="#FF6B35" />
                  </div>
                  <span className="text-editorial-meta" style={{ color: '#FF6B35', fontWeight: 800 }}>
                    DOSSIER 03
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#F3F0EA',
                    marginBottom: '10px',
                    letterSpacing: '-0.02em'
                  }}
                >
                  CIE Capital & Grants
                </h3>

                <p style={{ color: '#777F8E', fontSize: '0.92rem', lineHeight: 1.7 }}>
                  Winners gain direct access to CIE incubation seed capital, institutional patent mentoring,
                  and live cloud credits, plus automated digital cryptographic pass issuance for every attendee.
                </p>
              </div>

              <div
                style={{
                  marginTop: '24px',
                  paddingTop: '18px',
                  borderTop: '1px solid rgba(199, 203, 212, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  color: '#FF6B35',
                  fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif"
                }}
              >
                <Rocket size={14} color="#FF6B35" />
                <span>₹5,00,000+ AWARDS & CIE GRANTS</span>
              </div>
            </div>
          </Tilt3DCard>
        </div>
      </ScrollReveal>
    </section>
  );
};

export default AboutSection;
