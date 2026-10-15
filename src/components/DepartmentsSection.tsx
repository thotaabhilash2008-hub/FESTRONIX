import React from 'react';
import { Cpu, Globe, Radio, Zap, Wrench, Building2, BrainCircuit, Briefcase, Mail } from 'lucide-react';
import { DEPARTMENTS } from '../data/mockData';

const iconMap: Record<string, React.ReactNode> = {
  Cpu: <Cpu size={26} color="#00F0D0" />,
  Globe: <Globe size={26} color="#C026D3" />,
  Radio: <Radio size={26} color="#A855F7" />,
  Zap: <Zap size={26} color="#FFD700" />,
  Wrench: <Wrench size={26} color="#00F0D0" />,
  Building: <Building2 size={26} color="#38BDF8" />,
  Brain: <BrainCircuit size={26} color="#F0ABFC" />,
  Briefcase: <Briefcase size={26} color="#FFE55C" />
};

const accentColors: Record<string, string> = {
  Cpu: '#00F0D0',
  Globe: '#C026D3',
  Radio: '#A855F7',
  Zap: '#FFD700',
  Wrench: '#00F0D0',
  Building: '#38BDF8',
  Brain: '#F0ABFC',
  Briefcase: '#FFE55C'
};

export const DepartmentsSection: React.FC = () => {
  return (
    <section id="departments" style={{ padding: '80px 20px', maxWidth: '1280px', margin: '0 auto' }}>
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
          <BrainCircuit size={14} color="#00F0D0" />
          <span>FACULTIES OF INNOVATION</span>
        </div>
        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 400,
            margin: '0 0 10px 0',
            letterSpacing: '0.04em',
            display: 'inline-block',
            background: 'linear-gradient(135deg, #00F0D0 0%, #FFFFFF 40%, #C026D3 75%, #FFD700 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          PARTICIPATING DEPARTMENTS
        </h2>
        <p style={{ color: '#CBD5E1', maxWidth: '640px', margin: '0 auto', fontSize: '0.95rem' }}>
          8 premier engineering branches powering specialized arenas and technical juries.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '18px'
        }}
      >
        {DEPARTMENTS.map(dept => {
          const accent = accentColors[dept.iconName] || '#FFD700';
          return (
            <div
              key={dept.id}
              className="cyber-card"
              style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: `2px solid ${accent}30`
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div
                    style={{
                      padding: '10px',
                      background: `${accent}0D`,
                      borderRadius: '10px',
                      border: `1px solid ${accent}20`
                    }}
                  >
                    {iconMap[dept.iconName] || <Cpu size={26} color="#FFD700" />}
                  </div>
                  <span
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: accent,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: `${accent}0D`,
                      border: `1px solid ${accent}30`
                    }}
                  >
                    {dept.code}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '1.2rem',
                    color: '#F5F0E8',
                    marginBottom: '6px',
                    letterSpacing: '0.03em'
                  }}
                >
                  {dept.name}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#9B8E7B', lineHeight: 1.5, marginBottom: '14px' }}>
                  {dept.description}
                </p>
              </div>

              <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '0.68rem', color: '#6B5E4E', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Chief Coordinator
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#D4C5A9', marginTop: '2px' }}>
                  {dept.chiefCoordinator}
                </div>
                <div
                  style={{
                    fontSize: '0.73rem',
                    color: '#A78BFA',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Mail size={11} /> {dept.contact}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
