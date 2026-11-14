import React from 'react';
import { Ticket, ArrowRight, Trophy, Shield, QrCode } from 'lucide-react';
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
      className="public-section registration-cta-section"
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
              borderRadius: '16px',
              padding: 'clamp(40px, 6vw, 72px)',
              background: '#0F172A',
              border: '1px solid #1E293B',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
              backdropFilter: 'none',
              overflow: 'hidden',
              textAlign: 'center'
            }}
          >
            

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
                boxShadow: 'none'
              }}
            >
              <Ticket size={14} color="#38BDF8" />
              <span>FESTIVAL PASSES & ADMISSION</span>
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
              CLAIM YOUR <span style={{ color: '#38BDF8' }}>FESTRONIX PASS</span>
            </h2>

            <p
              style={{
                color: '#CBD5E1',
                maxWidth: '680px',
                margin: '0 auto 38px',
                fontSize: 'clamp(0.98rem, 1.4vw, 1.12rem)',
                lineHeight: 1.75,
                
              }}
            >
              Register now to participate. Get your festival pass and register your team for flagship technical competitions.
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
                { icon: <QrCode size={16} color="#38BDF8" />, text: 'Instant Digital Pass & QR Entry' },
                { icon: <Shield size={16} color="#34D399" />, text: 'Official College Certificate' },
                { icon: <Trophy size={16} color="#FBBF24" />, text: '₹1,00,000+ Prize Pool Access' }
              ].map((perk, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 20px',
                    borderRadius: '10px',
                    background: '#162238',
                    border: '1px solid #1E293B',
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
                <Ticket size={18} />
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
                <span>Browse Events</span>
              </button>
            </div>
          </div>
        </Tilt3DCard>
      </ScrollReveal>
    </section>
  );
};

export default RegistrationCtaSection;
