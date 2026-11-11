import React from 'react';
import { Cpu, Globe, Radio, Zap, Wrench, Building2, BrainCircuit, Briefcase, Mail, Database } from 'lucide-react';
import { DEPARTMENTS } from '../data/mockData';
import { ScrollReveal } from './animations';

const iconMap: Record<string, React.ReactNode> = {
  Cpu: <Cpu size={18} color="#38BDF8" />,
  Database: <Database size={18} color="#38BDF8" />,
  Globe: <Globe size={18} color="#38BDF8" />,
  Radio: <Radio size={18} color="#38BDF8" />,
  Zap: <Zap size={18} color="#38BDF8" />,
  Wrench: <Wrench size={18} color="#38BDF8" />,
  Building: <Building2 size={18} color="#38BDF8" />,
  Brain: <BrainCircuit size={18} color="#38BDF8" />,
  Briefcase: <Briefcase size={18} color="#38BDF8" />
};

export const DepartmentsSection: React.FC = () => {
  // Duplicate array for seamless infinite looping
  const duplicatedDepartments = [...DEPARTMENTS, ...DEPARTMENTS];

  return (
    <section id="departments" className="public-section departments-section" style={{ padding: '80px 0 70px', maxWidth: '100%', margin: '0 auto', position: 'relative', zIndex: 10, overflow: 'hidden' }}>
      <ScrollReveal threshold="top 90%" duration={0.8}>
        <div style={{ textAlign: 'center', marginBottom: '36px', padding: '0 20px' }}>
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
              boxShadow: 'none'
            }}
          >
            <Building2 size={14} color="#38BDF8" />
            <span>ENGINEERING DEPARTMENTS</span>
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
            9 PARTICIPATING <span style={{ color: '#38BDF8' }}>DEPARTMENTS</span>
          </h2>

          <p style={{ color: '#CBD5E1', maxWidth: '660px', margin: '0 auto', fontSize: 'clamp(0.96rem, 1.4vw, 1.05rem)', lineHeight: 1.7 }}>
            Academic departments hosting specialized technical competitions, workshops, and flagship tracks.
          </p>
        </div>
      </ScrollReveal>

      {/* Infinite Horizontal Scrolling Track */}
      <div className="dept-marquee-container">
        <div className="dept-marquee-track">
          {duplicatedDepartments.map((dept, index) => (
            <div key={`${dept.id}-${index}`} className="dept-mini-card">
              <div>
                {/* Header: Icon & Dept Code */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div
                    style={{
                      padding: '7px',
                      background: 'rgba(56, 189, 248, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {iconMap[dept.iconName] || <Cpu size={18} color="#38BDF8" />}
                  </div>
                  <span
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: '#38BDF8',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {dept.code}
                  </span>
                </div>

                {/* Department Name */}
                <h3
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    marginBottom: '6px',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                  title={dept.name}
                >
                  {dept.name}
                </h3>

                {/* Department Description */}
                <p
                  style={{
                    fontSize: '0.76rem',
                    color: '#94A3B8',
                    lineHeight: 1.45,
                    marginBottom: '12px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    height: '34px'
                  }}
                >
                  {dept.description}
                </p>
              </div>

              {/* Coordinator Contact */}
              <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(148, 163, 184, 0.14)' }}>
                <div style={{ fontSize: '0.62rem', color: '#64748B', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                  Lead Coordinator
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F1F5F9', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {dept.chiefCoordinator}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#38BDF8',
                    marginTop: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  <Mail size={11} color="#38BDF8" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{dept.contact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DepartmentsSection;
