import React, { useEffect } from 'react';
import { Shield, Lock, Eye, Server, UserCheck, HelpCircle, FileText, ArrowRight } from 'lucide-react';
import { LegalHeader } from './LegalHeader';

interface PrivacyPolicyPageProps {
  onBackToHome: () => void;
  onNavigateToTerms: () => void;
  onNavigateToRefund: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
  onBackToHome,
  onNavigateToTerms,
  onNavigateToRefund
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Privacy Policy • Festronix 2026';
  }, []);

  const handleNavigate = (page: 'privacy' | 'terms' | 'refund') => {
    if (page === 'privacy') return;
    if (page === 'terms') onNavigateToTerms();
    if (page === 'refund') onNavigateToRefund();
  };

  return (
    <div style={{ backgroundColor: '#080C16', color: '#F3F0EA', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <LegalHeader activePage="privacy" onNavigate={handleNavigate} onBackToHome={onBackToHome} />

      <main style={{ flex: 1, maxWidth: '960px', width: '100%', margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Page Title & Intro */}
        <div style={{ marginBottom: '40px', borderBottom: '1px solid rgba(220, 227, 229, 0.12)', paddingBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '9999px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38BDF8',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '14px'
            }}
          >
            <Shield size={13} />
            <span>DATA PROTECTION & PRIVACY</span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: 800,
              color: '#FFFFFF',
              margin: '0 0 12px',
              lineHeight: 1.2
            }}
          >
            Privacy Policy
          </h1>

          <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, maxWidth: '760px' }}>
            This Privacy Policy governs the manner in which the <strong>Festronix '26 Organizing Committee</strong> and the <strong>Student Activity Council (SAC)</strong> at <strong>Vardhaman College of Engineering, Hyderabad</strong> collect, use, maintain, and protect information collected from students, participants, and visitors of the Festronix portal.
          </p>
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#64748B' }}>
            Effective Date: Academic Session 2026-2027 • Last Updated: November 14, 2026
          </div>
        </div>

        {/* Section 1: Information We Collect */}
        <section style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Eye size={20} color="#38BDF8" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              1. Information We Collect
            </h2>
          </div>
          <p style={{ color: '#CBD5E1', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '14px' }}>
            When registering for flagship events, hackathons, workshops, or obtaining entry passes through Festronix '26, we may collect the following personal details:
          </p>
          <ul style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.8, paddingLeft: '24px', margin: '0 0 16px' }}>
            <li><strong style={{ color: '#FFFFFF' }}>Primary Delegate Information:</strong> Full name, institutional roll number / student ID, official/personal email address, and active mobile contact number.</li>
            <li><strong style={{ color: '#FFFFFF' }}>Academic Affiliation:</strong> Name of enrolled college/university, academic branch/department, and year of study.</li>
            <li><strong style={{ color: '#FFFFFF' }}>Team Member Details:</strong> For team battlegrounds and duo events: full names, roll numbers, and contact details of all participating teammates.</li>
            <li><strong style={{ color: '#FFFFFF' }}>Transaction Verification Tokens:</strong> Razorpay payment order IDs, transaction reference IDs, and payment status verification tokens.</li>
          </ul>
        </section>

        {/* Section 2: How We Use Collected Information */}
        <section style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <UserCheck size={20} color="#34D399" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              2. Purpose and Usage of Data
            </h2>
          </div>
          <p style={{ color: '#CBD5E1', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '14px' }}>
            Collected information is utilized strictly for the execution and coordination of Festronix 2026:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(20, 31, 62, 0.65)', border: '1px solid rgba(220, 227, 229, 0.12)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ color: '#38BDF8', fontWeight: 700, fontSize: '0.92rem', marginBottom: '6px' }}>Digital Pass Generation</div>
              <p style={{ color: '#94A3B8', fontSize: '0.84rem', lineHeight: 1.6, margin: 0 }}>
                Generating unique encrypted QR codes and digital tickets for seamless gate entry and badge validation at Vardhaman campus.
              </p>
            </div>
            <div style={{ background: 'rgba(20, 31, 62, 0.65)', border: '1px solid rgba(220, 227, 229, 0.12)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ color: '#34D399', fontWeight: 700, fontSize: '0.92rem', marginBottom: '6px' }}>Attendance & Spot Verification</div>
              <p style={{ color: '#94A3B8', fontSize: '0.84rem', lineHeight: 1.6, margin: 0 }}>
                Verifying student credentials at department arena desks, ensuring fair play and authentic attendance logging.
              </p>
            </div>
            <div style={{ background: 'rgba(20, 31, 62, 0.65)', border: '1px solid rgba(220, 227, 229, 0.12)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ color: '#C084FC', fontWeight: 700, fontSize: '0.92rem', marginBottom: '6px' }}>Certification & Prize Disbursement</div>
              <p style={{ color: '#94A3B8', fontSize: '0.84rem', lineHeight: 1.6, margin: 0 }}>
                Issuing authenticated certificates of participation/merit and coordinating cash prize distributions to recognized winners.
              </p>
            </div>
            <div style={{ background: 'rgba(20, 31, 62, 0.65)', border: '1px solid rgba(220, 227, 229, 0.12)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ color: '#FBBF24', fontWeight: 700, fontSize: '0.92rem', marginBottom: '6px' }}>Important Broadcasts & Updates</div>
              <p style={{ color: '#94A3B8', fontSize: '0.84rem', lineHeight: 1.6, margin: 0 }}>
                Transmitting critical event schedule shifts, venue allocations, and emergency fest updates directly to registered participants.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Payment Security & Gateways */}
        <section style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Lock size={20} color="#F59E0B" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              3. Payment Security & Financial Data
            </h2>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <p style={{ color: '#DCE3E5', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>
              <strong style={{ color: '#FBBF24' }}>Zero Card/UPI Storage:</strong> Festronix '26 does <em>NOT</em> store, inspect, or process raw credit card numbers, debit card PINs, CVVs, or UPI credentials. All financial transactions are directed securely through <strong>Razorpay Payment Gateway</strong>, a certified Level-1 PCI-DSS compliant institution.
            </p>
          </div>
        </section>

        {/* Section 4: Non-Disclosure to Third Parties */}
        <section style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Server size={20} color="#A855F7" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              4. Non-Disclosure & Data Protection
            </h2>
          </div>
          <p style={{ color: '#CBD5E1', fontSize: '0.92rem', lineHeight: 1.7, margin: '0 0 12px' }}>
            We strictly enforce a non-commercial privacy policy. Student names, emails, phone numbers, and academic IDs are <strong>never sold, leased, or traded</strong> to third-party telemarketers or commercial advertisers.
          </p>
          <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>
            Data is stored in authenticated, encrypted Supabase databases protected by strict Row-Level Security (RLS) policies accessible exclusively to authorized Student Activity Council administrators and verified Department Coordinators.
          </p>
        </section>

        {/* Section 5: Grievance Redressal */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <HelpCircle size={20} color="#38BDF8" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              5. Contact Us & Grievances
            </h2>
          </div>
          <div style={{ background: 'rgba(20, 31, 62, 0.75)', border: '1px solid rgba(220, 227, 229, 0.15)', borderRadius: '14px', padding: '24px' }}>
            <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '1rem', marginBottom: '6px' }}>
              Student Activity Council (SAC) — Privacy Desk
            </div>
            <div style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.7 }}>
              Vardhaman College of Engineering, Kacharam, Shamshabad, Hyderabad, Telangana 501218<br />
              Dean SAC: <strong>Md. Asif</strong> • Email: <a href="mailto:sac@vardhaman.org" style={{ color: '#38BDF8' }}>sac@vardhaman.org</a><br />
              Technical Queries: <a href="mailto:festronix@vardhaman.org" style={{ color: '#38BDF8' }}>festronix@vardhaman.org</a>
            </div>
          </div>
        </section>

        {/* Footer Link Navigation to Other Policies */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid rgba(220, 227, 229, 0.15)', paddingTop: '24px' }}>
          <button
            onClick={onNavigateToTerms}
            style={{
              background: 'none',
              border: 'none',
              color: '#C084FC',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Read Terms & Conditions</span>
            <ArrowRight size={14} />
          </button>

          <button
            onClick={onNavigateToRefund}
            style={{
              background: 'none',
              border: 'none',
              color: '#FBBF24',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Read Refund Policy (No Refund)</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </main>
    </div>
  );
};

