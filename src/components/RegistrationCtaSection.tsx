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
      <ScrollReveal threshold="top 85%" duration={0.8}>
        <Tilt3DCard maxTilt={3} scale={1.01}>
          <div
            className="cyber-card"
            style={{
              position: 'relative',
              borderRadius: '26px',
              padding: 'clamp(40px, 6vw, 72px)',
              background: 'linear-gradient(135deg, rgba(15, 22, 38, 0.96) 0%, rgba(10, 15, 26, 0.98) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              boxShadow: '0 24px 70px -15px rgba(0, 0, 0, 0.95), 0 0 40px rgba(56, 189, 248, 0.12)',
              backdropFilter: 'blur(24px)',
              overflow: 'hidden',
              textAlign: 'center'
            }}
          >
            {/* Subtle Light Sweep across the Monolith */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(105deg, transparent 25%, rgba(255, 255, 255, 0.06) 48%, rgba(56, 189, 248, 0.15) 50%, transparent 60%)',
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
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38BDF8',
                fontSize: '0.75rem',
                fontWeight: 800,
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '0.16em',
                marginBottom: '20px',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.2)'
              }}
            >
              <Ticket size={14} color="#38BDF8" />
              <span>07 // OFFICIAL FESTIVAL ADMISSION</span>
            </div>

            {/* Heading */}
            <h2
              className="text-editorial-headline"
              style={{
                fontSize: 'clamp(2.4rem, 5.5vw, 4.0rem)',
                fontWeight: 800,
                margin: '0 0 18px 0',
                lineHeight: 1.15,
                padding: '4px 0'
              }}
            >
              CLAIM YOUR <span style={{ color: '#38BDF8', textShadow: '0 0 24px rgba(56, 189, 248, 0.5)' }}>FESTRONIX PASS</span>
            </h2>

            <p
              style={{
                color: '#CBD5E1',
                maxWidth: '680px',
                margin: '0 auto 38px',
                fontSize: 'clamp(0.98rem, 1.4vw, 1.12rem)',
                lineHeight: 1.75,
                textShadow: '0 1px 4px rgba(0,0,0,0.8)'
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
                { icon: <QrCode size={16} color="#38BDF8" />, text: 'Cryptographic QR Mobile Pass' },
                { icon: <Shield size={16} color="#34D399" />, text: 'SAC Official Endorsement' },
                { icon: <Sparkles size={16} color="#FBBF24" />, text: '₹5,00,000+ Prize Pool Access' }
              ].map((perk, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 20px',
                    borderRadius: '10px',
                    background: 'rgba(8, 12, 22, 0.85)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    fontSize: '0.84rem',
                    color: '#FFFFFF',
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
                  gap: '10px',
                  color: '#FFFFFF'
                }}
              >
                <Ticket size={17} color="#38BDF8" />
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
