import React from 'react';
import { Rocket, Ticket, ArrowRight, Sparkles, Shield, QrCode } from 'lucide-react';
import { Tilt3DCard } from './3d';
import { ScrollReveal } from './animations';

interface RegistrationCtaSectionProps {
  onOpenMultiPass: () => void;
  onExploreEvents: () => void;
}

export const RegistrationCtaSection: React.FC<RegistrationCtaSectionProps> = ({
  onOpenMultiPass,
  onExploreEvents
}) => {
  return (
    <section
      id="register-cta"
      style={{
        padding: '110px 20px 100px',
        maxWidth: '1140px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}
    >
      <ScrollReveal threshold="top 85%" duration={0.9}>
        <Tilt3DCard maxTilt={3} scale={1.01}>
          <div
            className="cyber-card"
            style={{
              position: 'relative',
              borderRadius: '26px',
              padding: 'clamp(36px, 6vw, 68px)',
              background: 'linear-gradient(135deg, rgba(21, 24, 32, 0.96) 0%, rgba(14, 16, 22, 0.98) 100%)',
              border: '1px solid rgba(199, 203, 212, 0.28)',
              boxShadow: '0 24px 70px -15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 107, 53, 0.15)',
              backdropFilter: 'blur(24px)',
              overflow: 'hidden',
              textAlign: 'center'
            }}
          >
            {/* Subtle Amber Light Sweep across the Monolith */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(105deg, transparent 25%, rgba(255, 255, 255, 0.08) 48%, rgba(255, 107, 53, 0.18) 50%, transparent 60%)',
                backgroundSize: '200% 100%',
                animation: 'gleamSweep 4.5s infinite linear',
                pointerEvents: 'none'
              }}
            />

            {/* Top Admission Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 18px',
                borderRadius: '9999px',
                background: 'rgba(111, 150, 147, 0.12)',
                border: '1px solid rgba(136, 178, 174, 0.4)',
                color: '#88B2AE',
                fontSize: '0.75rem',
                fontWeight: 800,
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '0.16em',
                marginBottom: '20px'
              }}
            >
              <Ticket size={14} color="#88B2AE" />
              <span>07 // OFFICIAL FESTIVAL ADMISSION</span>
            </div>

            {/* Heading */}
            <h2
              className="text-editorial-headline"
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 4.2rem)',
                fontWeight: 800,
                margin: '0 0 18px 0',
                lineHeight: 1.05
              }}
            >
              CLAIM YOUR <span style={{ color: '#88B2AE' }}>FESTRONIX PASS</span>
            </h2>

            <p
              style={{
                color: '#777F8E',
                maxWidth: '680px',
                margin: '0 auto 38px',
                fontSize: 'clamp(0.96rem, 1.4vw, 1.1rem)',
                lineHeight: 1.7
              }}
            >
              Step directly into the arena. Book your all-access multi-event pass or reserve squad slots in individual technical championships.
            </p>

            {/* Perks Strip */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '14px',
                marginBottom: '42px'
              }}
            >
              {[
                { icon: <QrCode size={15} color="#88B2AE" />, text: 'Cryptographic QR Mobile Pass' },
                { icon: <Shield size={15} color="#C7CBD4" />, text: 'SAC Official Endorsement' },
                { icon: <Sparkles size={15} color="#3D68B2" />, text: '₹5,00,000+ Prize Pool Access' }
              ].map((perk, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 18px',
                    borderRadius: '10px',
                    background: 'rgba(8, 9, 13, 0.85)',
                    border: '1px solid rgba(199, 203, 212, 0.16)',
                    fontSize: '0.82rem',
                    color: '#C7CBD4',
                    fontWeight: 700,
                    fontFamily: "'Space Grotesk', sans-serif"
                  }}
                >
                  {perk.icon}
                  <span>{perk.text}</span>
                </div>
              ))}
            </div>

            {/* Primary Action Buttons */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px'
              }}
            >
              <button
                onClick={onOpenMultiPass}
                className="btn-cyber-gold"
                style={{
                  padding: '16px 38px',
                  fontSize: '0.96rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <Rocket size={18} />
                <span>Book All-Access Multi-Pass</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={onExploreEvents}
                className="btn-cyber-secondary"
                style={{
                  padding: '15px 32px',
                  fontSize: '0.92rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <Ticket size={17} color="#C7CBD4" />
                <span>Browse Individual Events</span>
              </button>
            </div>
          </div>
        </Tilt3DCard>
      </ScrollReveal>
    </section>
  );
};

export default RegistrationCtaSection;
