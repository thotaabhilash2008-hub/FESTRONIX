import React, { useEffect } from 'react';
import { AlertCircle, Ban, RefreshCw, HelpCircle, CheckCircle, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react';
import { LegalHeader } from './LegalHeader';

interface RefundPolicyPageProps {
  onBackToHome: () => void;
  onNavigateToPrivacy: () => void;
  onNavigateToTerms: () => void;
}

export const RefundPolicyPage: React.FC<RefundPolicyPageProps> = ({
  onBackToHome,
  onNavigateToPrivacy,
  onNavigateToTerms
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Refund Policy (No Refund) • Festronix 2026';
  }, []);

  const handleNavigate = (page: 'privacy' | 'terms' | 'refund') => {
    if (page === 'refund') return;
    if (page === 'privacy') onNavigateToPrivacy();
    if (page === 'terms') onNavigateToTerms();
  };

  return (
    <div style={{ backgroundColor: '#080C16', color: '#F3F0EA', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <LegalHeader activePage="refund" onNavigate={handleNavigate} onBackToHome={onBackToHome} />

      <main style={{ flex: 1, maxWidth: '960px', width: '100%', margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Page Title & Intro */}
        <div style={{ marginBottom: '36px', borderBottom: '1px solid rgba(220, 227, 229, 0.12)', paddingBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '9999px',
              background: 'rgba(239, 68, 68, 0.14)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              color: '#F87171',
              fontSize: '0.75rem',
              fontWeight: 800,
              marginBottom: '14px',
              letterSpacing: '0.06em'
            }}
          >
            <Ban size={13} />
            <span>CANCELLATION & REFUND CLAUSE • STRICT ZERO REFUND</span>
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
            Refund Policy
          </h1>

          <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, maxWidth: '760px' }}>
            Official Cancellation, Return, and Non-Refundable Participation Policy for <strong>Festronix '26</strong>, organized by the Student Activity Council (SAC) at <strong>Vardhaman College of Engineering, Hyderabad</strong>.
          </p>
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#64748B' }}>
            Effective for Academic Year 2026-2027 • Fest Dates: December 1 & 2, 2026
          </div>
        </div>

        {/* PRIMARY HIGHLIGHT BOX: STRICT NO REFUND */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(185, 28, 28, 0.18) 100%)',
            border: '2px solid rgba(239, 68, 68, 0.55)',
            borderRadius: '16px',
            padding: '28px',
            marginBottom: '40px',
            boxShadow: '0 12px 36px rgba(239, 68, 68, 0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Ban size={24} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                100% NON-REFUNDABLE POLICY
              </h2>
              <div style={{ color: '#FCA5A5', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                ALL PASSES & REGISTRATION FEES ARE STRICTLY FINAL
              </div>
            </div>
          </div>

          <p style={{ color: '#FEE2E2', fontSize: '0.95rem', lineHeight: 1.75, margin: '0 0 14px' }}>
            Once a registration is submitted and payment is confirmed through the portal or payment gateway, <strong>NO REFUND, CANCELLATION, OR EXCHANGE</strong> will be issued under any circumstances.
          </p>
          <p style={{ color: '#FECACA', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>
            Because Festronix allocates venue capacities, technical hardware, jury logistics, refreshments, and prize pools dynamically upon registration, all financial commitments are final and irrevocable immediately upon pass generation.
          </p>
        </div>

        {/* Section 1: Non-Refundable Scenarios */}
        <section style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <AlertCircle size={20} color="#FBBF24" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              1. Scenarios Ineligible for Refund
            </h2>
          </div>
          <div style={{ background: 'rgba(20, 31, 62, 0.65)', border: '1px solid rgba(220, 227, 229, 0.12)', borderRadius: '14px', padding: '22px' }}>
            <ul style={{ color: '#DCE3E5', fontSize: '0.9rem', lineHeight: 1.8, paddingLeft: '20px', margin: 0 }}>
              <li><strong>Change of Mind:</strong> Deciding not to participate after securing an entry pass.</li>
              <li><strong>Absence or Late Arrival:</strong> Inability to arrive at the campus venue or missing designated reporting time slots.</li>
              <li><strong>Schedule Overlaps:</strong> Registering for concurrent events scheduled in the same time bracket. Participants are responsible for reviewing dates and times prior to checkout.</li>
              <li><strong>Disqualification:</strong> Debarment by event jury or SAC administrators for misconduct, fraud, or infringement of rules.</li>
              <li><strong>Academic Obligations:</strong> Internal college examinations, attendance shortages, or academic assignments at your home institution.</li>
              <li><strong>Travel Disruptions:</strong> Delays, cancellations, or personal emergencies preventing travel to Vardhaman College campus.</li>
            </ul>
          </div>
        </section>

        {/* Section 2: Non-Transferability */}
        <section style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <ShieldCheck size={20} color="#34D399" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              2. Non-Transferability of Passes
            </h2>
          </div>
          <p style={{ color: '#CBD5E1', fontSize: '0.92rem', lineHeight: 1.7, margin: '0 0 12px' }}>
            A registered pass is exclusively associated with the individual roll number, email address, and name provided during checkout. Under no condition can passes be transferred to another student, swapped between different events, or carried forward to future college festivals.
          </p>
        </section>

        {/* Section 3: Failed Transactions & Bank Server Timeouts */}
        <section style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <CreditCard size={20} color="#38BDF8" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              3. Bank Deductions Without Pass Generation (Failed Transactions)
            </h2>
          </div>
          <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '14px', padding: '22px' }}>
            <p style={{ color: '#DCE3E5', fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 12px' }}>
              If your bank account or UPI app was debited but the browser timed out and <strong>no Festronix Pass ID / Registration ID</strong> was generated, this constitutes an incomplete bank transaction, not a festival purchase.
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#94A3B8', fontSize: '0.86rem', lineHeight: 1.6 }}>
              <RefreshCw size={18} color="#38BDF8" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Automatic Reversal:</strong> Razorpay's settlement system will automatically reconcile the failed attempt. The debited amount is returned to your original payment source by your bank within <strong>5 to 7 business banking days</strong> without any manual intervention required.
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Event Cancellation Force Majeure */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <HelpCircle size={20} color="#C084FC" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              4. Event Rescheduling & Force Majeure
            </h2>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 12px' }}>
            If an individual event is rescheduled due to technical difficulties, power contingencies, or extreme weather conditions, registrations will automatically be transferred to the revised time slot. No refunds will be provided for rescheduled sessions.
          </p>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
            In the rare and unforeseen event that an event is permanently cancelled by college administration without an alternate round, alternative event adjustments will be arbitrated at the sole discretion of the <strong>Student Activity Council (SAC)</strong>.
          </p>
        </section>

        {/* Contact Desk for Payment Verification Issues */}
        <div style={{ background: 'rgba(20, 31, 62, 0.75)', border: '1px solid rgba(220, 227, 229, 0.15)', borderRadius: '14px', padding: '24px', marginBottom: '40px' }}>
          <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '1rem', marginBottom: '6px' }}>
            Payment Dispute & Verification Desk
          </div>
          <div style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.7 }}>
            For queries concerning uncredited payment debits or technical errors:<br />
            Email: <a href="mailto:payments@vardhaman.org" style={{ color: '#38BDF8' }}>payments@vardhaman.org</a> with your Razorpay Payment ID and screenshot.<br />
            Student Activity Council, Vardhaman College of Engineering, Hyderabad.
          </div>
        </div>

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
        </div>
      </main>
    </div>
  );
};
