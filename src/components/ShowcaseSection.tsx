import React from 'react';
import { Camera, Play, MapPin, Sparkles, Compass } from 'lucide-react';
import { Tilt3DCard } from './3d';
import { ScrollReveal } from './animations';

interface ShowcaseSectionProps {
  onOpenIntro: () => void;
}

export const ShowcaseSection: React.FC<ShowcaseSectionProps> = ({ onOpenIntro }) => {
  return (
    <section
      id="showcase"
      style={{
        padding: '100px 20px 80px',
        maxWidth: '1280px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}
    >
      <ScrollReveal threshold="top 85%" duration={0.9}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
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
              letterSpacing: '0.14em',
              marginBottom: '12px'
            }}
          >
            <Camera size={14} color="#FF6B35" />
            <span>05 // SPATIAL ARCHITECTURE</span>
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
            THE VARDHAMAN <span style={{ color: '#FF6B35' }}>CAMPUS ARENA</span>
          </h2>

          <p
            style={{
              color: '#777F8E',
              maxWidth: '680px',
              margin: '0 auto',
              fontSize: '0.96rem',
              lineHeight: 1.7
            }}
          >
            A premier autonomous sanctuary in Shamshabad, Hyderabad.
            High-performance computing clusters, autonomous drone grounds, and open-air auditoriums.
          </p>
        </div>
      </ScrollReveal>

      {/* Multi-Layer Spatial Depth Cards */}
      <ScrollReveal threshold="top 80%" stagger={0.12} duration={0.9}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px'
          }}
        >
          {/* Card 1: Aerial Campus Hub */}
          <Tilt3DCard maxTilt={5} scale={1.02}>
            <div
              className="cyber-card"
              style={{
                position: 'relative',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(199, 203, 212, 0.18)',
                background: 'rgba(21, 24, 32, 0.92)',
                minHeight: '390px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '30px'
              }}
            >
              <img
                src="/vce_campus_bg.jpg"
                alt="Vardhaman College of Engineering Aerial Grounds"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'grayscale(0.5) brightness(0.4) contrast(1.15)',
                  transition: 'transform 0.6s ease'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(8, 9, 13, 0.2) 0%, rgba(8, 9, 13, 0.88) 75%, #08090D 100%)'
                }}
              />
              <div style={{ position: 'relative', zIndex: 10 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    background: 'rgba(8, 9, 13, 0.9)',
                    border: '1px solid rgba(255, 107, 53, 0.4)',
                    color: '#FF6B35',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    fontFamily: "'Space Grotesk', sans-serif",
                    marginBottom: '10px'
                  }}
                >
                  <MapPin size={12} color="#FF6B35" />
                  SHAMSHABAD, HYDERABAD
                </span>
                <h3
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#F3F0EA',
                    marginBottom: '6px'
                  }}
                >
                  Central Academic Arena
                </h3>
                <p style={{ color: '#777F8E', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  Modern research clusters, open-air amphitheaters, and multi-department tournament venues.
                </p>
              </div>
            </div>
          </Tilt3DCard>

          {/* Card 2: 3D Chrome Emblem Showcase */}
          <Tilt3DCard maxTilt={5} scale={1.02}>
            <div
              className="cyber-card"
              style={{
                position: 'relative',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(199, 203, 212, 0.18)',
                background: 'rgba(21, 24, 32, 0.92)',
                minHeight: '390px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '30px'
              }}
            >
              <div style={{ position: 'relative', width: '100%', textAlign: 'center', padding: '24px 0' }}>
                <img
                  src="/festronix_3d_title_clean.png"
                  alt="Festronix 3D Chrome Identity"
                  style={{
                    width: '88%',
                    maxHeight: '160px',
                    objectFit: 'contain',
                    margin: '0 auto',
                    filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 15px rgba(255, 107, 53, 0.25))'
                  }}
                />
              </div>

              <div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    background: 'rgba(199, 203, 212, 0.1)',
                    border: '1px solid rgba(199, 203, 212, 0.3)',
                    color: '#C7CBD4',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    fontFamily: "'Space Grotesk', sans-serif",
                    marginBottom: '10px'
                  }}
                >
                  <Sparkles size={12} color="#C7CBD4" />
                  3D CHROME IDENTITY
                </span>
                <h3
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#F3F0EA',
                    marginBottom: '6px'
                  }}
                >
                  Bespoke Kinetic Identity
                </h3>
                <p style={{ color: '#777F8E', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  Engineered with real-time physical materials, environmental studio mapping, and dual-axis gyroscopic motion.
                </p>
              </div>
            </div>
          </Tilt3DCard>

          {/* Card 3: Interactive Video Cinema Portal */}
          <Tilt3DCard maxTilt={5} scale={1.02}>
            <div
              className="cyber-card"
              style={{
                position: 'relative',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(199, 203, 212, 0.18)',
                background: 'rgba(21, 24, 32, 0.92)',
                minHeight: '390px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '30px'
              }}
            >
              <div
                style={{
                  height: '180px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(37, 42, 54, 0.8) 0%, rgba(21, 24, 32, 0.95) 100%)',
                  border: '1px solid rgba(199, 203, 212, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                onClick={onOpenIntro}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(255, 107, 53, 0.2)',
                    border: '2px solid #FF6B35',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 25px rgba(255, 107, 53, 0.5)',
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <Play size={22} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: '3px' }} />
                </div>
              </div>

              <div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    background: 'rgba(255, 107, 53, 0.1)',
                    border: '1px solid rgba(255, 107, 53, 0.35)',
                    color: '#FF6B35',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    fontFamily: "'Space Grotesk', sans-serif",
                    marginBottom: '10px'
                  }}
                >
                  <Compass size={12} color="#FF6B35" />
                  CINEMATIC INTRO
                </span>
                <h3
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#F3F0EA',
                    marginBottom: '6px'
                  }}
                >
                  Google Flow Motion Film
                </h3>
                <p style={{ color: '#777F8E', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '16px' }}>
                  Watch the official Festronix aerial teaser trailer and campus flyover film.
                </p>

                <button
                  onClick={onOpenIntro}
                  className="btn-cyber-primary"
                  style={{
                    padding: '11px 20px',
                    fontSize: '0.86rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                >
                  <Play size={13} fill="#FFFFFF" />
                  <span>Replay Fullscreen Teaser</span>
                </button>
              </div>
            </div>
          </Tilt3DCard>
        </div>
      </ScrollReveal>
    </section>
  );
};

export default ShowcaseSection;
