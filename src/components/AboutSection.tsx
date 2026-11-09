import React from 'react';
import { ShieldCheck, Layers, Briefcase, Terminal, Info } from 'lucide-react';
import { Tilt3DCard } from './3d';
import { ScrollReveal } from './animations';

export const AboutSection: React.FC = () => {
  return (
    <section
      id="about"
      className="public-section about-section"
      style={{
        padding: '110px 20px 80px',
        maxWidth: '1280px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}
    >
      {/* Editorial Header */}
      <ScrollReveal threshold="top 85%" duration={0.8}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
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
              letterSpacing: '0.16em',
              marginBottom: '14px',
              boxShadow: 'none'
            }}
          >
            <Info size={14} color="#38BDF8" />
            <span>ABOUT THE FESTIVAL</span>
          </div>

          <h2
            className="text-editorial-headline"
            style={{
              fontSize: 'clamp(2.4rem, 5.5vw, 3.8rem)',
              fontWeight: 800,
              margin: '0 0 16px 0',
              lineHeight: 1.15,
              display: 'inline-block'
            }}
          >
            WHERE INNOVATION MEETS <span style={{ color: '#3B82F6' }}>ENGINEERING EXCELLENCE</span>
          </h2>

          <p
            style={{
              color: '#CBD5E1',
              maxWidth: '740px',
              margin: '0 auto',
              fontSize: 'clamp(0.98rem, 1.4vw, 1.12rem)',
              lineHeight: 1.75,
              
            }}
          >
            Organized by the Student Activity Council (SAC) under the leadership of Dean SAC Md. Asif at Vardhaman College of Engineering, FESTRONIX 2026 brings together 9 engineering departments for competitive challenges, technical workshops, and real-world project exhibitions.
          </p>
        </div>
      </ScrollReveal>

      {/* Numbered Editorial Dossier Cards */}
      <ScrollReveal threshold="top 80%" stagger={0.12} duration={0.8}>
        <div className="public-six-grid about-dossier-grid"
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
                padding: '28px',
                borderRadius: '12px',
                background: '#0F172A',
                border: '1px solid #1E293B',
                boxShadow: 'none',
                backdropFilter: 'none',
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
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Layers size={22} color="#38BDF8" />
                  </div>
                  <span style={{ color: "#64748B", fontSize: "0.8rem", fontWeight: 700 }}>01</span>
                </div>

                <h3
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    marginBottom: '10px',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Technical Competitions
                </h3>

                <p style={{ color: '#CBD5E1', fontSize: '0.94rem', lineHeight: 1.7 }}>
                  From combat robotics and autonomous drone obstacle courses to 24-hour hackathons, every event is evaluated by experienced faculty juries and industry experts.
                </p>
              </div>

              <div
                style={{
                  marginTop: '24px',
                  paddingTop: '18px',
                  borderTop: '1px solid rgba(148, 163, 184, 0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  color: '#38BDF8',
                  fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif"
                }}
              >
                <Terminal size={14} color="#38BDF8" />
                <span>30+ COMPETITIVE ARENAS</span>
              </div>
            </div>
          </Tilt3DCard>

          {/* Dossier 02 */}
          <Tilt3DCard maxTilt={5} scale={1.02}>
            <div
              className="cyber-card"
              style={{
                padding: '28px',
                borderRadius: '12px',
                background: '#0F172A',
                border: '1px solid #1E293B',
                boxShadow: 'none',
                backdropFilter: 'none',
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
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ShieldCheck size={22} color="#FFFFFF" />
                  </div>
                  <span style={{ color: "#64748B", fontSize: "0.8rem", fontWeight: 700 }}>02</span>
                </div>

                <h3
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    marginBottom: '10px',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Campus & Infrastructure
                </h3>

                <p style={{ color: '#CBD5E1', fontSize: '0.94rem', lineHeight: 1.7 }}>
                  Hosted across Vardhaman College of Engineering's 20+ acre campus in Shamshabad, Hyderabad.
                  Recognized with NAAC 'A++' Grade and NBA Accreditation for high-precision technical education.
                </p>
              </div>

              <div
                style={{
                  marginTop: '24px',
                  paddingTop: '18px',
                  borderTop: '1px solid rgba(148, 163, 184, 0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  color: '#E2E8F0',
                  fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif"
                }}
              >
                <ShieldCheck size={14} color="#38BDF8" />
                <span>NAAC A++ • SHAMSHABAD HYDERABAD</span>
              </div>
            </div>
          </Tilt3DCard>

          {/* Dossier 03 */}
          <Tilt3DCard maxTilt={5} scale={1.02}>
            <div
              className="cyber-card"
              style={{
                padding: '28px',
                borderRadius: '12px',
                background: '#0F172A',
                border: '1px solid #1E293B',
                boxShadow: 'none',
                backdropFilter: 'none',
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
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Briefcase size={22} color="#38BDF8" />
                  </div>
                  <span style={{ color: "#64748B", fontSize: "0.8rem", fontWeight: 700 }}>03</span>
                </div>

                <h3
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    marginBottom: '10px',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Innovation & Incubation
                </h3>

                <p style={{ color: '#CBD5E1', fontSize: '0.94rem', lineHeight: 1.7 }}>
                  Outstanding projects and teams receive mentoring from the Center for Innovation and Entrepreneurship (CIE), patent guidance, and participation certificates.
                </p>
              </div>

              <div
                style={{
                  marginTop: '24px',
                  paddingTop: '18px',
                  borderTop: '1px solid rgba(148, 163, 184, 0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  color: '#38BDF8',
                  fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif"
                }}
              >
                <Briefcase size={14} color="#38BDF8" />
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
