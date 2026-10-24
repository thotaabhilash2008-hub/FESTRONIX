import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { AdminUser } from '../../services/adminAuthService';

interface AdminHeroBannerProps {
  adminUser: AdminUser;
}

export const AdminHeroBanner: React.FC<AdminHeroBannerProps> = ({ adminUser }) => {
  // Dynamic formatted date e.g. "Wednesday, 24 Oct 2026"
  const [dateStr] = useState(() => {
    const d = new Date();
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  });

  return (
    <div className="admin-hero-banner">
      {/* Background Campus Artwork: Official Vardhaman College of Engineering */}
      <img
        src="/vce_campus_bg.jpg"
        alt="Vardhaman College of Engineering Campus"
        className="admin-hero-bg"
        style={{ objectPosition: 'center 45%' }}
      />

      {/* Cyber Celestial Gradient Overlay */}
      <div className="admin-hero-overlay" />

      {/* Golden Glowing Arc Ribbon Accent */}
      <div
        style={{
          position: 'absolute',
          right: '5%',
          bottom: '-15%',
          width: '500px',
          height: '250px',
          borderRadius: '50%',
          borderTop: '2px solid rgba(245, 158, 11, 0.45)',
          boxShadow: '0 -15px 35px rgba(245, 158, 11, 0.3)',
          filter: 'blur(1px)',
          transform: 'rotate(-12deg)',
          pointerEvents: 'none'
        }}
      />

      {/* Content Grid */}
      <div className="admin-hero-content">
        {/* Left: User Welcome */}
        <div>
          <div style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 600 }}>
            Welcome Back,
          </div>

          <h2
            style={{
              fontFamily: "var(--font-title, 'Space Grotesk', sans-serif)",
              fontSize: '1.9rem',
              fontWeight: 800,
              color: '#FFFFFF',
              margin: '3px 0 4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{adminUser.fullName}</span>
            <span style={{ fontSize: '1.6rem' }}>👋</span>
          </h2>

          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
            {adminUser.designation}
          </div>

          <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#94A3B8', margin: '0 0 14px' }}>
            "Empowering students. Building experiences."
          </p>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.35) 0%, rgba(124, 58, 237, 0.35) 100%)',
              border: '1px solid rgba(147, 197, 253, 0.4)',
              color: '#93C5FD',
              fontFamily: "var(--font-title, 'Space Grotesk', sans-serif)",
              fontSize: '0.74rem',
              fontWeight: 800,
              letterSpacing: '0.06em'
            }}
          >
            FESTRONIX 2026
          </span>
        </div>

        {/* Center / Right: College Motto & Live Date */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '22px' }}>
          {/* Calendar Widget */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 14px',
              borderRadius: '12px',
              background: 'rgba(10, 16, 32, 0.75)',
              border: '1px solid rgba(220, 227, 232, 0.18)',
              backdropFilter: 'blur(16px)',
              color: '#E2E8F0',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            <Calendar size={15} color="#38BDF8" />
            <span>{dateStr}</span>
          </div>

          {/* Inspirational Tagline */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontStyle: 'italic',
                fontSize: '1.45rem',
                color: '#E2E8F0',
                textShadow: '0 0 20px rgba(255, 255, 255, 0.4)',
                letterSpacing: '0.02em',
                lineHeight: 1.2
              }}
            >
              "Bigger Ideas
            </div>
            <div
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontStyle: 'italic',
                fontSize: '1.45rem',
                color: '#CBD5E1',
                textShadow: '0 0 20px rgba(255, 255, 255, 0.4)',
                letterSpacing: '0.02em',
                lineHeight: 1.2
              }}
            >
              Brighter Minds"
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '8px'
              }}
            >
              <img
                src="/vce_logo.png"
                alt="VCE Crest"
                style={{ width: '20px', height: '24px', objectFit: 'contain' }}
              />
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  color: '#CBD5E1',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}
              >
                Vardhaman College of Engineering • Hyderabad, India
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
