import React, { useEffect } from 'react';
import { FileText, ShieldAlert, CheckCircle, Scale, AlertTriangle, ArrowRight, BookOpen } from 'lucide-react';
import { LegalHeader } from './LegalHeader';

interface TermsAndConditionsPageProps {
  onBackToHome: () => void;
  onNavigateToPrivacy: () => void;
  onNavigateToRefund: () => void;
}

export const TermsAndConditionsPage: React.FC<TermsAndConditionsPageProps> = ({
  onBackToHome,
  onNavigateToPrivacy,
  onNavigateToRefund
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Terms & Conditions • Festronix 2026';
  }, []);

  const handleNavigate = (page: 'privacy' | 'terms' | 'refund') => {
    if (page === 'terms') return;
    if (page === 'privacy') onNavigateToPrivacy();
    if (page === 'refund') onNavigateToRefund();
  };

  return (
    <div style={{ backgroundColor: '#080C16', color: '#F3F0EA', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <LegalHeader activePage="terms" onNavigate={handleNavigate} onBackToHome={onBackToHome} />

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
              background: 'rgba(192, 132, 252, 0.12)',
              border: '1px solid rgba(192, 132, 252, 0.35)',
              color: '#C084FC',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '14px'
            }}
          >
            <Scale size={13} />
            <span>FESTIVAL REGULATIONS & PARTICIPATION CONTRACT</span>
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
            Terms & Conditions
          </h1>

          <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, maxWidth: '760px' }}>
            Welcome to <strong>Festronix '26</strong>, organized by the <strong>Student Activity Council (SAC)</strong> at <strong>Vardhaman College of Engineering, Hyderabad</strong>. By accessing this web application, registering for any battleground arena, or acquiring an entry pass, you enter into a legally binding agreement with the following festival terms.
          </p>
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#64748B' }}>
            Applicable for: Festronix 2026 (December 1 & 2, 2026) • Last Updated: November 14, 2026
          </div>
        </div>

        {/* Section 1: Eligibility and Identification */}
        <section style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <BookOpen size={20} color="#C084FC" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              1. Participant Eligibility & Identification
            </h2>
          </div>
          <div style={{ background: 'rgba(20, 31, 62, 0.65)', border: '1px solid rgba(220, 227, 229, 0.12)', borderRadius: '14px', padding: '22px' }}>
            <ul style={{ color: '#DCE3E5', fontSize: '0.9rem', lineHeight: 1.8, paddingLeft: '20px', margin: 0 }}>
              <li><strong>Student Status:</strong> All competitive participants must be bona fide undergraduate or postgraduate students currently enrolled in an AICTE/UGC recognized engineering, technology, or science college.</li>
              <li><strong>Mandatory Identification:</strong> Participants must carry their original physical institutional College ID Card along with their official digital Festronix Entry Pass QR token. Entry will be denied if college credentials cannot be verified.</li>
              <li><strong>Impersonation:</strong> Any form of proxy attendance, impersonation, or forged identity will result in immediate disqualification and debarment from the college premises.</li>
            </ul>
          </div>
        </section>

        {/* Section 2: Registration, Passes & Non-Transferability */}
        <section style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <ShieldAlert size={20} color="#38BDF8" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              2. Pass Validity & Non-Transferability
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px', padding: '18px' }}>
              <p style={{ color: '#DCE3E5', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
                <strong style={{ color: '#38BDF8' }}>Non-Transferable:</strong> Digital event passes are exclusively assigned to the individual delegate or registered team named during registration. Passes cannot be resold, gifted, bartered, or transferred to another student.
              </p>
            </div>
            <div style={{ background: 'rgba(20, 31, 62, 0.65)', border: '1px solid rgba(220, 227, 229, 0.12)', borderRadius: '12px', padding: '18px' }}>
              <p style={{ color: '#CBD5E1', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
                <strong>Single Device Validation:</strong> Each unique QR code can be scanned and verified only once at the gate per event session. Duplicated passes or duplicate scans will be flagged as security violations.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Code of Conduct & Campus Discipline */}
        <section style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <AlertTriangle size={20} color="#FBBF24" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              3. Code of Conduct & Campus Discipline
            </h2>
          </div>
          <p style={{ color: '#CBD5E1', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '14px' }}>
            All delegates, visitors, and participants are required to uphold academic integrity and civilized decorum on Vardhaman College campus grounds:
          </p>
          <ul style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.8, paddingLeft: '24px', margin: 0 }}>
            <li><strong style={{ color: '#FFFFFF' }}>Prohibited Substances:</strong> Smoking, tobacco, vaping, alcohol, narcotics, and any unlawful materials are strictly banned across the entire campus perimeter.</li>
            <li><strong style={{ color: '#FFFFFF' }}>Zero Ragging Policy:</strong> Vardhaman adheres to a zero-tolerance policy against ragging, harassment, or verbal abuse in compliance with Supreme Court of India directives.</li>
            <li><strong style={{ color: '#FFFFFF' }}>Campus Property:</strong> Damaging college labs, exhibition hardware, auditorium seating, or festival installations will mandate severe financial penalties and disciplinary reporting to the student's parent institution.</li>
          </ul>
        </section>

        {/* Section 4: Event Rules & Judges' Decisions */}
        <section style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <CheckCircle size={20} color="#34D399" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              4. Event Rules & Finality of Decisions
            </h2>
          </div>
          <div style={{ background: 'rgba(20, 31, 62, 0.65)', border: '1px solid rgba(220, 227, 229, 0.12)', borderRadius: '14px', padding: '22px' }}>
            <p style={{ color: '#CBD5E1', fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 12px' }}>
              1. <strong>Final Decision:</strong> In all competitive tournaments, hackathons, and symposiums, the verdict of the appointed jury and event faculty leads is <strong>final and non-disputable</strong>.
            </p>
            <p style={{ color: '#CBD5E1', fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 12px' }}>
              2. <strong>Schedule Alterations:</strong> The organizing committee reserves the right to modify venue rooms, time slots, or rounds due to logistical necessities, weather contingencies, or academic schedules.
            </p>
            <p style={{ color: '#CBD5E1', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
              3. <strong>Cash Prize Distribution:</strong> Prize winners must present their authentic identification, PAN/bank credentials (where necessary for tax/statutory compliances), and sign official acknowledgment forms to receive cash awards.
            </p>
          </div>
        </section>

        {/* Section 5: Limitation of Liability */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Scale size={20} color="#94A3B8" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              5. Intellectual Property & Liability
            </h2>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.7, margin: '0 0 14px' }}>
            Vardhaman College of Engineering and the Student Activity Council will not be liable for the loss, theft, or damage of personal laptops, phones, electronic components, or personal luggage brought to the venue. Participants are responsible for their belongings at all times.
          </p>
          <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>
            By entering the campus, attendees consent to being photographed and recorded in official fest videography, which may be published for institutional, promotional, and archival purposes.
          </p>
        </section>

        {/* Footer Link Navigation to Other Policies */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid rgba(220, 227, 229, 0.15)', paddingTop: '24px' }}>
          <button
            onClick={onNavigateToPrivacy}
            style={{
              background: 'none',
              border: 'none',
              color: '#38BDF8',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Read Privacy Policy</span>
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

