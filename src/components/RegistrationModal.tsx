import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, School, QrCode, Upload, CheckCircle2, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FestEvent, Teammate, Registration } from '../types/festronix';
import { StorageService } from '../services/storageService';

interface RegistrationModalProps {
  event: FestEvent | null;
  onClose: () => void;
  onSuccess: (registration: Registration) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  event,
  onClose,
  onSuccess
}) => {
  useEffect(() => {
    if (!event) return;
    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [event]);

  if (!event) return null;

  const [step, setStep] = useState<number>(1);

  // Form State
  const [leader, setLeader] = useState({
    name: '',
    email: '',
    phone: '',
    college: 'Vardhaman College of Engineering',
    rollNumber: ''
  });

  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [transactionId, setTransactionId] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Total members needed for Duo / Team
  const maxTeammates = event.format === 'individual' ? 0 : event.maxTeamSize - 1;
  const minTeammates = event.format === 'individual' ? 0 : event.minTeamSize - 1;

  const handleAddTeammateSlot = () => {
    if (teammates.length < maxTeammates) {
      setTeammates([
        ...teammates,
        { name: '', email: '', phone: '', college: leader.college, rollNumber: '' }
      ]);
    }
  };

  const handleUpdateTeammate = (index: number, field: keyof Teammate, value: string) => {
    const updated = [...teammates];
    updated[index][field] = value;
    setTeammates(updated);
  };

  const handleRemoveTeammate = (index: number) => {
    setTeammates(teammates.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('File size exceeds 5MB limit. Please upload a smaller screenshot.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
        setErrorMessage('');
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep1 = () => {
    if (!leader.name.trim() || !leader.email.trim() || !leader.phone.trim() || !leader.rollNumber.trim()) {
      setErrorMessage('Please fill in all participant / leader details.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const validateStep2 = () => {
    if (event.format !== 'individual' && teammates.length < minTeammates) {
      setErrorMessage(`At least ${minTeammates} teammate(s) required for this ${event.format} event.`);
      return false;
    }
    for (let i = 0; i < teammates.length; i++) {
      const tm = teammates[i];
      if (!tm.name.trim() || !tm.phone.trim() || !tm.rollNumber.trim()) {
        setErrorMessage(`Please complete all fields for Teammate #${i + 1}.`);
        return false;
      }
    }
    setErrorMessage('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (event.fee > 0) {
      if (!transactionId.trim()) {
        setErrorMessage('Please enter the UPI Transaction ID / UTR reference number.');
        return;
      }
      if (!screenshotPreview) {
        setErrorMessage('Please upload the payment transaction screenshot.');
        return;
      }
    }

    // Register via StorageService
    const newReg = StorageService.addRegistration({
      eventId: event.id,
      eventTitle: event.title,
      leaderName: leader.name,
      leaderEmail: leader.email,
      leaderPhone: leader.phone,
      leaderCollege: leader.college,
      leaderRoll: leader.rollNumber,
      teammates,
      format: event.format,
      fee: event.fee,
      source: 'online',
      registrationDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      paymentStatus: event.fee === 0 ? 'not_applicable' : 'verification_pending',
      transactionId: event.fee > 0 ? transactionId : undefined,
      paymentScreenshotUrl: screenshotPreview || undefined
    });

    // Fire festive celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    onSuccess(newReg);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ padding: '30px', maxWidth: '700px' }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#FF4D94', letterSpacing: '0.08em', fontWeight: 700 }}>
              EVENT REGISTRATION DESK
            </span>
            <h3 className="font-title" style={{ fontSize: '1.4rem', color: '#F8FAFC', marginTop: '2px' }}>
              {event.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94A3B8',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Tracker Steps */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            paddingBottom: '14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: step >= 1 ? '#FF1A8C' : 'rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem'
              }}
            >
              1
            </span>
            <span style={{ fontSize: '0.82rem', color: step >= 1 ? '#fff' : '#64748b', fontWeight: 600 }}>
              Team Lead
            </span>
          </div>

          {event.format !== 'individual' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: step >= 2 ? '#FF1A8C' : 'rgba(255,255,255,0.2)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}
              >
                2
              </span>
              <span style={{ fontSize: '0.82rem', color: step >= 2 ? '#fff' : '#64748b', fontWeight: 600 }}>
                Teammates
              </span>
            </div>
          )}

          {event.fee > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: (event.format === 'individual' ? step === 2 : step === 3) ? '#FF1A8C' : 'rgba(255,255,255,0.2)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}
              >
                {event.format === 'individual' ? 2 : 3}
              </span>
              <span style={{ fontSize: '0.82rem', color: (event.format === 'individual' ? step === 2 : step === 3) ? '#fff' : '#64748b', fontWeight: 600 }}>
                UPI Payment
              </span>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '0.85rem',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Participant / Leader Details */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '0.9rem', color: '#FF4D94', fontWeight: 600 }}>
              Primary Participant / Team Leader Details:
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#9B8E7B', display: 'block', marginBottom: '6px' }}>
                FULL NAME *
              </label>
              <input
                type="text"
                className="cyber-input"
                placeholder="e.g. Rahul Sharma"
                value={leader.name}
                onChange={e => setLeader({ ...leader, name: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#9B8E7B', display: 'block', marginBottom: '6px' }}>
                  COLLEGE EMAIL *
                </label>
                <input
                  type="email"
                  className="cyber-input"
                  placeholder="rahul@college.edu"
                  value={leader.email}
                  onChange={e => setLeader({ ...leader, email: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#9B8E7B', display: 'block', marginBottom: '6px' }}>
                  PHONE NUMBER (WHATSAPP) *
                </label>
                <input
                  type="tel"
                  className="cyber-input"
                  placeholder="+91 98765 43210"
                  value={leader.phone}
                  onChange={e => setLeader({ ...leader, phone: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#9B8E7B', display: 'block', marginBottom: '6px' }}>
                  COLLEGE / INSTITUTION NAME *
                </label>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="e.g. Vardhaman College of Engineering"
                  value={leader.college}
                  onChange={e => setLeader({ ...leader, college: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#9B8E7B', display: 'block', marginBottom: '6px' }}>
                  ROLL / STUDENT ID *
                </label>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="22VCECS104"
                  value={leader.rollNumber}
                  onChange={e => setLeader({ ...leader, rollNumber: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) {
                    if (event.format !== 'individual') {
                      setStep(2);
                    } else if (event.fee > 0) {
                      setStep(2);
                    } else {
                      handleSubmit({ preventDefault: () => {} } as any);
                    }
                  }
                }}
                className="btn-cyber-primary"
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Teammates (for Duo / Team) */}
        {step === 2 && event.format !== 'individual' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#FF4D94', fontWeight: 600 }}>
                Add Teammates ({teammates.length + 1} / {event.maxTeamSize} Members)
              </div>
              {teammates.length < maxTeammates && (
                <button
                  type="button"
                  onClick={handleAddTeammateSlot}
                  className="btn-cyber-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  + Add Member
                </button>
              )}
            </div>

            {teammates.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px dashed rgba(255, 215, 0, 0.3)',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}
              >
                <p style={{ color: '#9B8E7B', fontSize: '0.88rem', marginBottom: '12px' }}>
                  This event requires a team of {event.minTeamSize} to {event.maxTeamSize} members.
                </p>
                <button
                  type="button"
                  onClick={handleAddTeammateSlot}
                  className="btn-cyber-secondary"
                >
                  Click to Add Teammate #1
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '350px', overflowY: 'auto' }}>
                {teammates.map((tm, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '16px',
                      background: 'rgba(18, 14, 30, 0.7)',
                      border: '1px solid rgba(124, 58, 237, 0.3)',
                      borderRadius: '10px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#A78BFA', fontWeight: 700 }}>
                        Teammate #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeammate(idx)}
                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Remove
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        className="cyber-input"
                        placeholder="Teammate Full Name *"
                        value={tm.name}
                        onChange={e => handleUpdateTeammate(idx, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        className="cyber-input"
                        placeholder="Roll / Student ID *"
                        value={tm.rollNumber}
                        onChange={e => handleUpdateTeammate(idx, 'rollNumber', e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input
                        type="email"
                        className="cyber-input"
                        placeholder="Email (Optional)"
                        value={tm.email}
                        onChange={e => handleUpdateTeammate(idx, 'email', e.target.value)}
                      />
                      <input
                        type="tel"
                        className="cyber-input"
                        placeholder="Phone Number *"
                        value={tm.phone}
                        onChange={e => handleUpdateTeammate(idx, 'phone', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <button type="button" onClick={() => setStep(1)} className="btn-cyber-secondary">
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (validateStep2()) {
                    if (event.fee > 0) {
                      setStep(3);
                    } else {
                      handleSubmit({ preventDefault: () => {} } as any);
                    }
                  }
                }}
                className="btn-cyber-primary"
              >
                <span>{event.fee > 0 ? 'Proceed to Payment' : 'Confirm Registration'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 (or Step 2 for solo paid): UPI Payment Instructions & Proof Upload */}
        {((step === 3 && event.format !== 'individual') || (step === 2 && event.format === 'individual')) && event.fee > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Payment Box */}
            <div
              style={{
                padding: '20px',
                background: 'rgba(10, 16, 40, 0.85)',
                border: '1px solid rgba(255, 26, 140, 0.5)',
                borderRadius: '12px',
                display: 'grid',
                gridTemplateColumns: '1fr 1.3fr',
                gap: '20px',
                alignItems: 'center'
              }}
            >
              {/* QR Code Presentation */}
              <div style={{ textAlign: 'center', background: '#fff', padding: '12px', borderRadius: '10px' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=festronix2026@vce%26pn=Festronix%20VCE%26am=${event.fee}%26cu=INR`}
                  alt="UPI Payment QR"
                  style={{ width: '140px', height: '140px', display: 'block', margin: '0 auto' }}
                />
                <div style={{ fontSize: '0.72rem', color: '#0c0a14', fontWeight: 700, marginTop: '6px' }}>
                  SCAN WITH ANY UPI APP
                </div>
              </div>

              {/* Instructions */}
              <div>
                <div style={{ fontSize: '0.75rem', color: '#9B8E7B' }}>OFFICIAL UPI ID:</div>
                <div className="font-title" style={{ fontSize: '1.05rem', color: '#FF1A8C', fontWeight: 700 }}>
                  festronix2026@vce
                </div>
                <div style={{ fontSize: '0.78rem', color: '#D4C5A9', marginTop: '6px' }}>
                  Beneficiary: <strong>Festronix SAC Vardhaman</strong>
                </div>
                <div style={{ fontSize: '1.25rem', color: '#fbbf24', fontWeight: 800, marginTop: '8px' }}>
                  Payable Amount: ₹{event.fee}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#9B8E7B', marginTop: '6px', lineHeight: 1.4 }}>
                  Supports PhonePe, Google Pay, Paytm, BHIM, CRED, and all banking apps.
                </div>
              </div>
            </div>

            {/* Proof Submission inputs */}
            <div>
              <label style={{ fontSize: '0.8rem', color: '#D4C5A9', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                UPI TRANSACTION ID / UTR NUMBER (12 Digits) *
              </label>
              <input
                type="text"
                className="cyber-input"
                placeholder="e.g. 428901928374 or UPI-SBIN-89384729"
                value={transactionId}
                onChange={e => setTransactionId(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#D4C5A9', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                PAYMENT RECEIPT SCREENSHOT *
              </label>
              <div
                style={{
                  border: '2px dashed rgba(255, 26, 140, 0.45)',
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center',
                  background: 'rgba(5, 10, 25, 0.5)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  id="screenshot-upload"
                />
                <label htmlFor="screenshot-upload" style={{ cursor: 'pointer', display: 'block' }}>
                  {screenshotPreview ? (
                    <div>
                      <img
                        src={screenshotPreview}
                        alt="Screenshot Preview"
                        style={{ maxHeight: '120px', borderRadius: '6px', margin: '0 auto', display: 'block' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#34d399', display: 'block', marginTop: '6px' }}>
                        ✓ Screenshot uploaded (Click to change)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <Upload size={28} color="#FF1A8C" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: '0.85rem', color: '#F5F0E8', fontWeight: 600 }}>
                        Click to upload payment screenshot
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#9B8E7B', marginTop: '4px' }}>
                        Supports PNG, JPG, WebP up to 5MB
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* PRD Compliance Disclaimer */}
            <div
              style={{
                padding: '12px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#fef3c7',
                lineHeight: 1.45
              }}
            >
              <strong>Notice per PRD Guidelines:</strong> Submitting payment proof sets status to <em>"Verification Pending"</em>. Proof files are stored privately and manually reviewed by authorized event/finance coordinators before final approval.
            </div>

            {/* Submit / Back */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setStep(event.format === 'individual' ? 1 : 2)}
                className="btn-cyber-secondary"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                className="btn-cyber-primary"
              >
                <span>Submit Proof & Register</span>
                <CheckCircle2 size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
