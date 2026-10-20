import React from 'react';
import { Cpu, Globe, Radio, Zap, Wrench, Building2, BrainCircuit, Briefcase, Mail, Database } from 'lucide-react';
import { DEPARTMENTS } from '../data/mockData';
import { Tilt3DCard } from './3d';
import { ScrollReveal } from './animations';

const iconMap: Record<string, React.ReactNode> = {
  Cpu: <Cpu size={24} color="#C7CBD4" />,
  Database: <Database size={24} color="#FF6B35" />,
  Globe: <Globe size={24} color="#C7CBD4" />,
  Radio: <Radio size={24} color="#FF6B35" />,
  Zap: <Zap size={24} color="#C7CBD4" />,
  Wrench: <Wrench size={24} color="#FF6B35" />,
  Building: <Building2 size={24} color="#C7CBD4" />,
  Brain: <BrainCircuit size={24} color="#FF6B35" />,
  Briefcase: <Briefcase size={24} color="#C7CBD4" />
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
            <BrainCircuit size={14} color="#FF6B35" />
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
            9 INNOVATION <span style={{ color: '#FF6B35' }}>FACULTIES</span>
          </h2>

          <p style={{ color: '#777F8E', maxWidth: '660px', margin: '0 auto', fontSize: '0.96rem', lineHeight: 1.7 }}>
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
                    borderTop: '2px solid rgba(199, 203, 212, 0.3)',
                    background: 'rgba(21, 24, 32, 0.92)',
                    height: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div
                        style={{
                          padding: '10px',
                          background: 'rgba(8, 9, 13, 0.8)',
                          borderRadius: '10px',
                          border: '1px solid rgba(199, 203, 212, 0.18)'
                        }}
                      >
                        {iconMap[dept.iconName] || <Cpu size={24} color="#C7CBD4" />}
                      </div>
                      <span
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          color: '#FF6B35',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          background: 'rgba(255, 107, 53, 0.1)',
                          border: '1px solid rgba(255, 107, 53, 0.35)'
                        }}
                      >
                        {dept.code}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: '#F3F0EA',
                        marginBottom: '8px',
                        letterSpacing: '-0.02em'
                      }}
                    >
                      {dept.name}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#777F8E', lineHeight: 1.6, marginBottom: '18px' }}>
                      {dept.description}
                    </p>
                  </div>

                  <div style={{ paddingTop: '14px', borderTop: '1px solid rgba(199, 203, 212, 0.1)' }}>
                    <div style={{ fontSize: '0.68rem', color: '#777F8E', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Chief Coordinator
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#C7CBD4', marginTop: '2px' }}>
                      {dept.chiefCoordinator}
                    </div>
                    <div
                      style={{
                        fontSize: '0.74rem',
                        color: '#FF6B35',
                        marginTop: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Mail size={12} color="#FF6B35" /> {dept.contact}
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
