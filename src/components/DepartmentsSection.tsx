import React from 'react';
import { Cpu, Globe, Radio, Zap, Wrench, Building2, BrainCircuit, Briefcase, Mail } from 'lucide-react';
import { DEPARTMENTS } from '../data/mockData';

const iconMap: Record<string, React.ReactNode> = {
  Cpu: <Cpu size={26} color="#BACEBB" />,
  Globe: <Globe size={26} color="#789593" />,
  Radio: <Radio size={26} color="#DCE3E5" />,
  Zap: <Zap size={26} color="#BACEBB" />,
  Wrench: <Wrench size={26} color="#789593" />,
  Building: <Building2 size={26} color="#DCE3E5" />,
  Brain: <BrainCircuit size={26} color="#BACEBB" />,
  Briefcase: <Briefcase size={26} color="#789593" />
};

const accentColors: Record<string, string> = {
  Cpu: '#BACEBB',
  Globe: '#789593',
  Radio: '#DCE3E5',
  Zap: '#BACEBB',
  Wrench: '#789593',
  Building: '#DCE3E5',
  Brain: '#BACEBB',
  Briefcase: '#789593'
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
            color: '#BACEBB',
            fontSize: '0.78rem',
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '0.15em',
            marginBottom: '8px',
            fontWeight: 700
          }}
        >
          <BrainCircuit size={14} color="#BACEBB" />
          <span>FACULTIES OF INNOVATION</span>
        </div>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 700,
            margin: '0 0 10px 0',
            letterSpacing: '0.02em',
            display: 'inline-block',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #DCE3E5 40%, #BACEBB 75%, #789593 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          PARTICIPATING DEPARTMENTS
        </h2>
        <p style={{ color: '#A8B3C2', maxWidth: '640px', margin: '0 auto', fontSize: '0.95rem' }}>
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
          const accent = accentColors[dept.iconName] || '#BACEBB';
          return (
            <div
              key={dept.id}
              className="cyber-card"
              style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: `2px solid ${accent}60`
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div
                    style={{
                      padding: '10px',
                      background: 'rgba(40, 59, 120, 0.25)',
                      borderRadius: '10px',
                      border: `1px solid ${accent}40`
                    }}
                  >
                    {iconMap[dept.iconName] || <Cpu size={26} color="#BACEBB" />}
                  </div>
                  <span
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: accent,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(120, 149, 147, 0.15)',
                      border: `1px solid ${accent}45`
                    }}
                  >
                    {dept.code}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    marginBottom: '6px',
                    letterSpacing: '0.02em'
                  }}
                >
                  {dept.name}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#A8B3C2', lineHeight: 1.5, marginBottom: '14px' }}>
                  {dept.description}
                </p>
              </div>

              <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(220, 227, 229, 0.1)' }}>
                <div style={{ fontSize: '0.68rem', color: '#BACEBB', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Chief Coordinator
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#DCE3E5', marginTop: '2px' }}>
                  {dept.chiefCoordinator}
                </div>
                <div
                  style={{
                    fontSize: '0.73rem',
                    color: '#38BDF8',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Mail size={11} color="#00D2FF" /> {dept.contact}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
