import React from 'react';
import { Cpu, Globe, Radio, Zap, Wrench, Building2, BrainCircuit, Briefcase, Mail, Database } from 'lucide-react';
import { DEPARTMENTS } from '../data/mockData';
import { Tilt3DCard } from './3d';
import { ScrollReveal } from './animations';

const iconMap: Record<string, React.ReactNode> = {
  Cpu: <Cpu size={24} color="#38BDF8" />,
  Database: <Database size={24} color="#38BDF8" />,
  Globe: <Globe size={24} color="#38BDF8" />,
  Radio: <Radio size={24} color="#38BDF8" />,
  Zap: <Zap size={24} color="#38BDF8" />,
  Wrench: <Wrench size={24} color="#38BDF8" />,
  Building: <Building2 size={24} color="#38BDF8" />,
  Brain: <BrainCircuit size={24} color="#38BDF8" />,
  Briefcase: <Briefcase size={24} color="#38BDF8" />
};

export const DepartmentsSection: React.FC = () => {
  return (
    <section id="departments" style={{ padding: '100px 20px 80px', maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
      <ScrollReveal threshold="top 90%" duration={0.8}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
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
            <BrainCircuit size={14} color="#38BDF8" />
            <span>04 // PARTICIPATING ENGINEERING FACULTIES</span>
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
            9 INNOVATION <span style={{ color: '#38BDF8', textShadow: '0 0 24px rgba(56, 189, 248, 0.5)' }}>FACULTIES</span>
          </h2>

          <p style={{ color: '#CBD5E1', maxWidth: '660px', margin: '0 auto', fontSize: 'clamp(0.96rem, 1.4vw, 1.05rem)', lineHeight: 1.7, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            Premier academic departments powering specialized tournament arenas and technical juries.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal threshold="top 85%" stagger={0.08} duration={0.8}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '22px'
          }}
        >
          {DEPARTMENTS.map(dept => {
            return (
              <Tilt3DCard key={dept.id} maxTilt={5} scale={1.02}>
                <div
                  className="cyber-card"
                  style={{
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderTop: '2px solid rgba(56, 189, 248, 0.5)',
                    background: 'rgba(15, 22, 38, 0.94)',
                    border: '1px solid rgba(148, 163, 184, 0.22)',
                    boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.9)',
                    backdropFilter: 'blur(20px)',
                    height: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div
                        style={{
                          padding: '10px',
                          background: 'rgba(8, 12, 22, 0.85)',
                          borderRadius: '10px',
                          border: '1px solid rgba(148, 163, 184, 0.2)'
                        }}
                      >
                        {iconMap[dept.iconName] || <Cpu size={24} color="#38BDF8" />}
                      </div>
                      <span
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          color: '#38BDF8',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          background: 'rgba(56, 189, 248, 0.14)',
                          border: '1px solid rgba(56, 189, 248, 0.4)'
                        }}
                      >
                        {dept.code}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: '#FFFFFF',
                        marginBottom: '8px',
                        letterSpacing: '-0.02em'
                      }}
                    >
                      {dept.name}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: '#CBD5E1', lineHeight: 1.65, marginBottom: '18px' }}>
                      {dept.description}
                    </p>
                  </div>

                  <div style={{ paddingTop: '14px', borderTop: '1px solid rgba(148, 163, 184, 0.16)' }}>
                    <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                      Chief Coordinator
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                      {dept.chiefCoordinator}
                    </div>
                    <div
                      style={{
                        fontSize: '0.76rem',
                        color: '#38BDF8',
                        marginTop: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 600
                      }}
                    >
                      <Mail size={12} color="#38BDF8" /> {dept.contact}
                    </div>
                  </div>
                </div>
              </Tilt3DCard>
            );
          })}
        </div>
      </ScrollReveal>
    </section>
  );
};

export default DepartmentsSection;
