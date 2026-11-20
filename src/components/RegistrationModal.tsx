import React, { useState, useEffect } from 'react';
import { 
  X, Upload, CheckCircle2, ArrowRight, ArrowLeft, AlertTriangle, Plus, Minus,
  ShieldCheck, Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FestEvent, Teammate, Registration, User as UserType, AdditionalMember } from '../types/festronix';
import { StorageService } from '../services/storageService';
import { isSupabaseConfigured } from '../lib/supabase';
import { isFirebaseConfigured } from '../lib/firebase';
import { getEventRegistrationBlockReason } from '../lib/eventRegistration';
import { sendRegistrationPassEmail } from '../services/registrationEmailService';
import { completeRazorpayCheckout } from '../services/razorpayService';
import { LocalQrCode } from './LocalQrCode';

interface RegistrationModalProps {
  event: FestEvent | null;
  currentUser?: UserType | null;
  pageMode?: boolean;
  onClose: () => void;
  onSuccess: (registration: Registration) => void;
  onOpenMultiPass?: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  event,
  currentUser,
  pageMode = false,
  onClose,
  onSuccess,
  onOpenMultiPass,
}) => {
  const isTeamEvent = event ? event.format !== 'individual' : false;

  // Step State
  const [step, setStep] = useState<number>(1);
  const [passQuantity, setPassQuantity] = useState<number>(1);
  const [additionalMembers, setAdditionalMembers] = useState<AdditionalMember[]>([]);

  // Helper to synchronize additional members roster when booking multiple passes
  const handlePassQuantityChange = (newQty: number) => {
    const validQty = Math.max(1, Math.min(10, newQty));
    setPassQuantity(validQty);
    setAdditionalMembers(prev => {
      const needed = validQty - 1;
      if (needed <= 0) return [];
      const updated = [...prev];
      while (updated.length < needed) {
        updated.push({ name: '', rollNumber: '', deptSection: '' });
      }
      return updated.slice(0, needed);
    });
  };

  // Form State: Primary Participant / Leader
  const [leader, setLeader] = useState({
    name: currentUser?.fullName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    college: currentUser?.college || 'Vardhaman College of Engineering',
    rollNumber: currentUser?.rollNumber || ''
  });
  // Team Specific States
  const [teamName, setTeamName] = useState<string>('');
  const [generatedTeamCode, setGeneratedTeamCode] = useState<string>('');
  const [teammates, setTeammates] = useState<Teammate[]>([]);

  // Payment States
  const [transactionId, setTransactionId] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  // Keep the legacy manual-proof state for recovery compatibility, but do not
  // expose it as a public payment choice. Paid registrations always open Razorpay.
  const [paymentMethod] = useState<'razorpay' | 'manual_proof'>('razorpay');
  const [razorpayMode, setRazorpayMode] = useState<'test' | 'live' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Prevent background scroll
  useEffect(() => {
    if (!event || pageMode) return;
    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [event, pageMode]);

  // Prefill the leader profile, create a hidden team reference for registration,
  // and prepare the minimum required teammate forms. No team record is written
  // while the participant is editing the form.
  useEffect(() => {
    if (!currentUser) return;
    setLeader({
      name: currentUser.fullName,
      email: currentUser.email,
      phone: currentUser.phone,
      college: currentUser.college,
      rollNumber: currentUser.rollNumber
    });
  }, [currentUser]);

  useEffect(() => {
    if (!event || !isTeamEvent) return;
    setGeneratedTeamCode(StorageService.generateTeamCode(event.departmentCode || event.slug || 'FX'));
    setTeamName('');
    setTeammates(Array.from({ length: Math.max(0, event.minTeamSize - 1) }, () => ({
      name: '', email: '', phone: '', college: '', rollNumber: ''
    })));
  }, [event?.id]);

  if (!event) return null;

  const maxTeammates = event.format === 'individual' ? 0 : event.maxTeamSize - 1;
  const minTeammates = event.format === 'individual' ? 0 : event.minTeamSize - 1;

  const handleTeamNameChange = (newName: string) => setTeamName(newName);

  const handleAddTeammateSlot = () => {
    if (teammates.length < maxTeammates) {
      setTeammates([
        ...teammates,
        { name: '', email: '', phone: '', college: '', rollNumber: '' }
      ]);
    }
  };

  const handleUpdateTeammate = (
    index: number,
    field: 'name' | 'email' | 'phone' | 'college' | 'rollNumber' | 'deptSection',
    value: string
  ) => {
    const updated = [...teammates];
    updated[index][field] = value;
    setTeammates(updated);
  };

  const handleRemoveTeammate = (index: number) => {
    setTeammates(current => current.filter((_, i) => i !== index));
    setErrorMessage('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setErrorMessage('Upload a JPEG, PNG, or WebP payment screenshot.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('File size exceeds 5MB limit. Please upload a smaller screenshot.');
        return;
      }
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
        setErrorMessage('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 1 validation (FR-REG-01, FR-REG-05, FR-REG-06)
  const validateStep1 = () => {
    const registrationBlockReason = getEventRegistrationBlockReason(
      event,
      isTeamEvent ? 1 : passQuantity
    );
    if (registrationBlockReason) {
      setErrorMessage(registrationBlockReason);
      return false;
    }
    if (!leader.name.trim() || !leader.email.trim() || !leader.phone.trim() || !leader.college.trim() || !leader.rollNumber.trim()) {
      setErrorMessage('Please fill in all participant / leader details.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leader.email.trim())) {
      setErrorMessage('Enter a valid email address for the team leader.');
      return false;
    }
    // Duplicate check for leader
    const dup = StorageService.checkDuplicateRegistration(event.id, leader.rollNumber.trim());
    if (dup.isDuplicate && dup.existingReg) {
      setErrorMessage(`You (${leader.rollNumber.trim()}) are already registered for this event (Pass ID: ${dup.existingReg.id}). Duplicate registrations are not permitted.`);
      return false;
    }
    if (isTeamEvent && !teamName.trim()) {
      setErrorMessage('Please enter a team name for your squad.');
      return false;
    }

    // Validate additional members when booking more than 1 pass
    if (!isTeamEvent && passQuantity > 1) {
      const seenRolls = new Set<string>();
      seenRolls.add(leader.rollNumber.trim().toUpperCase());

      for (let i = 0; i < additionalMembers.length; i++) {
        const mem = additionalMembers[i];
        const passNum = i + 2;
        if (!mem.name.trim()) {
          setErrorMessage(`Please enter the full name for Pass #${passNum}.`);
          return false;
        }
        if (!mem.rollNumber.trim()) {
          setErrorMessage(`Please enter the roll number for Pass #${passNum} (${mem.name || 'Member'}).`);
          return false;
        }
        if (!mem.deptSection.trim()) {
          setErrorMessage(`Please enter the Department & Section (e.g. CSE - A) for Pass #${passNum} (${mem.name}).`);
          return false;
        }

        const cleanRoll = mem.rollNumber.trim().toUpperCase();
        if (seenRolls.has(cleanRoll)) {
          setErrorMessage(`Duplicate roll number detected: "${cleanRoll}" is entered more than once.`);
          return false;
        }
        seenRolls.add(cleanRoll);

        const dup = StorageService.checkDuplicateRegistration(event.id, cleanRoll);
        if (dup.isDuplicate && dup.existingReg) {
          setErrorMessage(`Member "${mem.name}" (${cleanRoll}) is already registered for this event (Pass ID: ${dup.existingReg.id}).`);
          return false;
        }
      }
    }

    setErrorMessage('');
    return true;
  };

  // Step 2 validation (Teammate roster validation: FR-REG-03)
  const validateStep2 = () => {
    const totalTeamSize = 1 + teammates.length;
    if (isTeamEvent) {
      if (totalTeamSize < event.minTeamSize) {
        setErrorMessage(`This event requires at least ${event.minTeamSize} team members. Add all required teammate details to continue.`);
        return false;
      }
      if (totalTeamSize > event.maxTeamSize) {
        setErrorMessage(`This event permits a maximum of ${event.maxTeamSize} team members.`);
        return false;
      }
    }

    const seenRolls = new Set<string>();
    seenRolls.add(leader.rollNumber.trim().toUpperCase());

    for (let i = 0; i < teammates.length; i++) {
      const tm = teammates[i];
      if (!tm.name.trim() || !tm.email.trim() || !tm.phone.trim() || !tm.college.trim() || !tm.rollNumber.trim()) {
        setErrorMessage(`Enter the name, email, phone, college/institution, and roll number for Teammate #${i + 1}.`);
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tm.email.trim())) {
        setErrorMessage(`Enter a valid email address for Teammate #${i + 1}.`);
        return false;
      }
      const cleanRoll = tm.rollNumber.trim().toUpperCase();
      if (seenRolls.has(cleanRoll)) {
        setErrorMessage(`Duplicate roll number detected: ${tm.rollNumber.trim()} is used more than once.`);
        return false;
      }
      seenRolls.add(cleanRoll);
    }
    setErrorMessage('');
    return true;
  };

  const buildRegistrationBatch = async (
    status: Registration['paymentStatus'],
    transactionReference?: string,
    paymentProof?: string
  ): Promise<Array<Omit<Registration, 'id' | 'qrToken' | 'checkedIn'>>> => {
    if (isTeamEvent) {
      if (!teamName.trim() || !generatedTeamCode.trim()) {
        throw new Error('Enter a team name and all required teammate details before checkout.');
      }
    }

    const dateNow = new Date().toISOString().replace('T', ' ').slice(0, 16);
    return Array.from({ length: passQuantity }, (_, index) => {
      const isLeaderPass = index === 0;
      const memberInfo = isLeaderPass ? null : additionalMembers[index - 1];
      return {
        userId: currentUser?.id,
        buyerRoll: leader.rollNumber.trim(),
        eventId: event.id,
        eventTitle: `${event.title}${passQuantity > 1 ? ` (Pass #${index + 1}${memberInfo ? `: ${memberInfo.name.trim()}` : ''})` : ''}`,
        departmentCode: event.departmentCode,
        leaderName: isLeaderPass ? leader.name.trim() : memberInfo!.name.trim(),
        leaderEmail: leader.email.trim(),
        leaderPhone: leader.phone.trim(),
        leaderCollege: leader.college.trim(),
        leaderRoll: isLeaderPass ? leader.rollNumber.trim() : memberInfo!.rollNumber.trim().toUpperCase(),
        deptSection: memberInfo ? memberInfo.deptSection.trim().toUpperCase() : undefined,
        teammates: isTeamEvent ? teammates : [],
        format: event.format,
        teamName: isTeamEvent ? teamName.trim() : undefined,
        teamCode: isTeamEvent ? generatedTeamCode.trim() : undefined,
        fee: event.fee,
        source: 'online' as const,
        registrationDate: dateNow,
        paymentStatus: status,
        transactionId: event.fee > 0 ? transactionReference : undefined,
        paymentScreenshotUrl: paymentProof
      };
    });
  };

  const finishSuccessfulRegistration = (created: Registration[]) => {
    const finalReg = created[created.length - 1];
    confetti({ particleCount: 110, spread: 75, origin: { y: 0.6 } });
    if (!finalReg) return;

    // The pass is already stored and can be opened immediately. Email delivery
    // remains independent so a provider outage cannot cause duplicate retries.
    onSuccess(finalReg);
    void Promise.all(created.map(registration => sendRegistrationPassEmail(registration)))
      .then(emailResults => {
        const emailFailure = emailResults.find(result => !result.sent);
        if (emailFailure) console.warn('Registration completed, but pass email delivery is pending:', emailFailure.message);
      })
      .catch(error => console.warn('Registration completed, but pass email delivery failed:', error));
  };

  const handleRazorpayPayment = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage('');
    setRazorpayMode(null);
    try {
      const batch = await buildRegistrationBatch(event.fee > 0 ? 'verification_pending' : 'not_applicable');
      const created = await completeRazorpayCheckout(event, batch, setRazorpayMode);
      finishSuccessfulRegistration(created);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Razorpay payment could not be confirmed. If your bank shows a charge, check My Passes before retrying; the server will complete or refund it.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Team Leader or Solo Registration Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Razorpay is the only public payment path. The manual-proof branch below
    // remains in the component for administrative recovery/history, but it is
    // intentionally not selectable by registrants.
    if (event.fee > 0) {
      await handleRazorpayPayment();
      return;
    }

    if (event.fee > 0) {
      if (!transactionId.trim()) {
        setErrorMessage('Please enter the UPI Transaction ID / UTR reference number.');
        return;
      }
      if (!screenshotPreview) {
        setErrorMessage('Please upload the payment transaction screenshot.');
        return;
      }
      if (!isFirebaseConfigured && isSupabaseConfigured() && !screenshotFile) {
        setErrorMessage('Select the payment screenshot file so it can be uploaded securely.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      let finalScreenshotUrl = screenshotPreview || undefined;
      if (screenshotFile) {
        const uploadRes = await StorageService.uploadPaymentScreenshot(screenshotFile, leader.rollNumber, leader.email);
        if (!uploadRes.success || !uploadRes.url) throw new Error(uploadRes.error || 'Unable to upload payment proof.');
        finalScreenshotUrl = uploadRes.url;
      }
      const status = event.fee === 0 ? 'not_applicable' : 'verification_pending';
      const batch = await buildRegistrationBatch(status, event.fee > 0 ? transactionId.trim() : undefined, finalScreenshotUrl);
      const created = await StorageService.addMultipleRegistrations(batch);
      finishSuccessfulRegistration(created);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={pageMode ? 'registration-page-shell' : 'modal-backdrop'}
      data-lenis-prevent={pageMode ? undefined : true}
      onClick={pageMode ? undefined : onClose}
    >
      <div
        className={pageMode ? 'registration-page-content' : 'modal-content registration-modal-content'}
        data-lenis-prevent-wheel
        data-lenis-prevent-touch
        onClick={pageMode ? undefined : e => e.stopPropagation()}
        style={{
          padding: pageMode ? 'clamp(20px, 3.5vw, 56px) 0 72px' : 'clamp(18px, 3.5vw, 28px)',
          maxWidth: pageMode ? '900px' : '720px',
          width: pageMode ? 'min(100% - 24px, 900px)' : '95%',
          maxHeight: pageMode ? 'none' : 'calc(100dvh - 24px)',
          overflowY: pageMode ? 'visible' : 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        }}
      >
        {pageMode && (
          <div className="registration-page-intro">
            <div className="pass-page-kicker"><span className="live-dot" /> OPEN REGISTRATION • GUEST ACCESS</div>
            <h1>Secure your place at FESTRONIX</h1>
            <p>Enter your details manually. No account is required; your registration status and pass are linked to your email and registration ID.</p>
          </div>
        )}

        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#BACEBB', letterSpacing: '0.1em', fontWeight: 800 }}>
              {isTeamEvent ? 'SQUAD & TEAM REGISTRATION DESK' : 'INDIVIDUAL PASS DESK'}
            </span>
            <h3 className="font-title" style={{ fontSize: '1.4rem', color: '#FFFFFF', marginTop: '2px' }}>
              {event.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(220, 227, 229, 0.08)',
              border: '1px solid rgba(220, 227, 229, 0.15)',
              color: '#A8B3C2',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {!currentUser && (
          <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.10)', border: '1px solid rgba(56, 189, 248, 0.32)', color: '#DCE3E5', fontSize: '0.82rem', lineHeight: 1.45 }}>
            Guest registration is enabled. Enter your details manually; your registration pass and status updates will be sent to your Gmail.
          </div>
        )}

        {/* Multi-Pass Shortcut (Only for solo passes) */}
        {!isTeamEvent && onOpenMultiPass && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(40, 59, 120, 0.25)',
              border: '1px solid rgba(120, 149, 147, 0.35)',
              borderRadius: '8px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.78rem'
            }}
          >
            <span style={{ color: '#DCE3E5' }}>
              Want to buy passes for multiple solo events simultaneously?
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenMultiPass();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#BACEBB',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>Open Multi-Pass Desk →</span>
            </button>
          </div>
        )}

        {/* Progress Tracker Steps */}
        {(
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '22px',
              paddingBottom: '14px',
              borderBottom: '1px solid rgba(220, 227, 229, 0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: step >= 1 ? 'linear-gradient(135deg, #283B78 0%, #3E4264 100%)' : 'rgba(220, 227, 229, 0.1)',
                  border: step >= 1 ? '1px solid #789593' : '1px solid rgba(220, 227, 229, 0.2)',
                  color: step >= 1 ? '#FFFFFF' : '#A8B3C2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.75rem'
                }}
              >
                1
              </span>
              <span style={{ fontSize: '0.82rem', color: step >= 1 ? '#BACEBB' : '#64748b', fontWeight: 600 }}>
                {isTeamEvent ? 'Team & Leader' : 'Participant Details'}
              </span>
            </div>

            {isTeamEvent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: step >= 2 ? 'linear-gradient(135deg, #283B78 0%, #3E4264 100%)' : 'rgba(220, 227, 229, 0.1)',
                    border: step >= 2 ? '1px solid #789593' : '1px solid rgba(220, 227, 229, 0.2)',
                    color: step >= 2 ? '#FFFFFF' : '#A8B3C2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.75rem'
                  }}
                >
                  2
                </span>
                <span style={{ fontSize: '0.82rem', color: step >= 2 ? '#BACEBB' : '#64748b', fontWeight: 600 }}>
                  Team Members
                </span>
              </div>
            )}

            {event.fee > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: (isTeamEvent ? step === 3 : step === 2) ? 'linear-gradient(135deg, #283B78 0%, #3E4264 100%)' : 'rgba(220, 227, 229, 0.1)',
                    border: (isTeamEvent ? step === 3 : step === 2) ? '1px solid #789593' : '1px solid rgba(220, 227, 229, 0.2)',
                    color: (isTeamEvent ? step === 3 : step === 2) ? '#FFFFFF' : '#A8B3C2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.75rem'
                  }}
                >
                  {isTeamEvent ? 3 : 2}
                </span>
                <span style={{ fontSize: '0.82rem', color: (isTeamEvent ? step === 3 : step === 2) ? '#BACEBB' : '#64748b', fontWeight: 600 }}>
                  Razorpay Payment
                </span>
              </div>
            )}
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '0.84rem',
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

        {/* ============================================================== */}
        {/* TEAM / SOLO PARTICIPANT DETAILS (STEP 1) */}
        {/* ============================================================== */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Auto-filled User Status */}
            {currentUser ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(52, 211, 153, 0.12)',
                  border: '1px solid rgba(52, 211, 153, 0.35)',
                  borderRadius: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#34D399" />
                  <span style={{ fontSize: '0.8rem', color: '#DCE3E5' }}>
                    Auto-filled from verified profile: <strong style={{ color: '#FFFFFF' }}>{currentUser.fullName}</strong> ({currentUser.rollNumber})
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(52, 211, 153, 0.2)',
                    color: '#34D399',
                    fontWeight: 700
                  }}
                >
                  VERIFIED DELEGATE
                </span>
              </div>
            ) : null}

            {isTeamEvent && (
              <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(20, 31, 62, 0.95) 0%, rgba(16, 26, 53, 0.95) 100%)', border: '1px solid rgba(120, 149, 147, 0.35)', borderRadius: '12px' }}>
                <label style={{ fontSize: '0.78rem', color: '#BACEBB', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  SQUAD / TEAM NAME *
                </label>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="e.g. Cyber Titans"
                  value={teamName}
                  onChange={e => handleTeamNameChange(e.target.value)}
                  required
                />
                <div style={{ fontSize: '0.76rem', color: '#A8B3C2', marginTop: '8px', lineHeight: 1.45 }}>
                  Enter the details for every teammate on the next step. Everyone is registered together after checkout.
                </div>
              </div>
            )}
            <div style={{ fontSize: '0.88rem', color: '#DCE3E5', fontWeight: 600, letterSpacing: '0.04em' }}>
              {isTeamEvent ? 'Team Leader Details:' : 'Primary Participant Details:'}
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#A8B3C2', display: 'block', marginBottom: '6px' }}>
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
                <label style={{ fontSize: '0.78rem', color: '#A8B3C2', display: 'block', marginBottom: '6px' }}>
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
                <label style={{ fontSize: '0.78rem', color: '#A8B3C2', display: 'block', marginBottom: '6px' }}>
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
                <label style={{ fontSize: '0.78rem', color: '#A8B3C2', display: 'block', marginBottom: '6px' }}>
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
                <label style={{ fontSize: '0.78rem', color: '#A8B3C2', display: 'block', marginBottom: '6px' }}>
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

            {/* Solo Pass Quantity Selector (Only for individual events) */}
            {!isTeamEvent && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'rgba(16, 26, 53, 0.85)',
                  border: '1px solid rgba(120, 149, 147, 0.35)',
                  borderRadius: '10px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>
                    Number of Passes to Book
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#A8B3C2' }}>
                    {event.fee === 0 ? 'Reserve multiple free entry passes' : `₹${event.fee} per pass • Total: ₹${event.fee * passQuantity}`}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handlePassQuantityChange(passQuantity - 1)}
                    style={{
                      width: '30px',
                      height: '30px',
                      background: 'rgba(40, 59, 120, 0.4)',
                      border: '1px solid rgba(120, 149, 147, 0.4)',
                      color: '#FFFFFF',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Minus size={13} />
                  </button>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#BACEBB', width: '24px', textAlign: 'center' }}>
                    {passQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePassQuantityChange(passQuantity + 1)}
                    style={{
                      width: '30px',
                      height: '30px',
                      background: 'rgba(40, 59, 120, 0.4)',
                      border: '1px solid rgba(120, 149, 147, 0.4)',
                      color: '#FFFFFF',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* Additional Members Information (When passQuantity > 1) */}
            {!isTeamEvent && passQuantity > 1 && (
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(20, 31, 62, 0.75)',
                  border: '1px solid rgba(120, 149, 147, 0.35)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={16} color="#BACEBB" />
                      <span>Additional Pass Members ({passQuantity - 1})</span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        background: 'rgba(120, 149, 147, 0.2)',
                        border: '1px solid rgba(120, 149, 147, 0.4)',
                        borderRadius: '6px',
                        color: '#BACEBB'
                      }}
                    >
                      Mandatory for Entry
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#A8B3C2', marginTop: '3px' }}>
                    Pass #1 belongs to you ({leader.name || 'Primary Attendee'}). Please provide Name, Roll Number, and Dept & Section for passes #2 to #{passQuantity}.
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {additionalMembers.map((member, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '14px',
                        background: 'rgba(16, 26, 53, 0.88)',
                        border: '1px solid rgba(220, 227, 229, 0.16)',
                        borderRadius: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#BACEBB' }}>
                          Pass #{idx + 2} Member
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#A8B3C2' }}>
                          Attendee #{idx + 2}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.72rem', color: '#A8B3C2', display: 'block', marginBottom: '4px' }}>
                            MEMBER FULL NAME *
                          </label>
                          <input
                            type="text"
                            className="cyber-input"
                            style={{ height: '38px', fontSize: '0.84rem' }}
                            placeholder="e.g. Sravan Kumar"
                            value={member.name}
                            onChange={e => {
                              const updated = [...additionalMembers];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              setAdditionalMembers(updated);
                            }}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.72rem', color: '#A8B3C2', display: 'block', marginBottom: '4px' }}>
                            ROLL / STUDENT ID *
                          </label>
                          <input
                            type="text"
                            className="cyber-input"
                            style={{ height: '38px', fontSize: '0.84rem' }}
                            placeholder="e.g. 22VCECS109"
                            value={member.rollNumber}
                            onChange={e => {
                              const updated = [...additionalMembers];
                              updated[idx] = { ...updated[idx], rollNumber: e.target.value.toUpperCase() };
                              setAdditionalMembers(updated);
                            }}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.72rem', color: '#A8B3C2', display: 'block', marginBottom: '4px' }}>
                            DEPT & SECTION *
                          </label>
                          <input
                            type="text"
                            className="cyber-input"
                            style={{ height: '38px', fontSize: '0.84rem' }}
                            placeholder="e.g. CSE - B or IT - A"
                            value={member.deptSection}
                            onChange={e => {
                              const updated = [...additionalMembers];
                              updated[idx] = { ...updated[idx], deptSection: e.target.value.toUpperCase() };
                              setAdditionalMembers(updated);
                            }}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) {
                    if (isTeamEvent) {
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

        {/* ============================================================== */}
        {/* STEP 2: Manually Enter Teammate Details */}
        {/* ============================================================== */}
        {isTeamEvent && step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.92rem', color: '#FFFFFF', fontWeight: 700 }}>
                  Enter Every Team Member
                </div>
                <div style={{ fontSize: '0.74rem', color: '#A8B3C2' }}>
                  {teammates.length + 1} / {event.maxTeamSize} members • minimum {event.minTeamSize}
                </div>
              </div>

              {teammates.length < maxTeammates && (
                <button
                  type="button"
                  onClick={handleAddTeammateSlot}
                  className="btn-cyber-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  + Add Teammate
                </button>
              )}
            </div>

            <div
              style={{
                padding: '12px 14px',
                background: 'rgba(40, 59, 120, 0.25)',
                border: '1px solid rgba(120, 149, 147, 0.35)',
                borderRadius: '8px',
                fontSize: '0.76rem',
                color: '#DCE3E5',
                lineHeight: 1.5
              }}
            >
              Enter each teammate’s name, email, phone, college/institution, and roll number here. All team members are registered together after payment is verified.
            </div>

            {teammates.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  background: 'rgba(16, 26, 53, 0.85)',
                  border: '1px dashed rgba(120, 149, 147, 0.4)',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}
              >
                <p style={{ color: '#A8B3C2', fontSize: '0.86rem', marginBottom: '12px' }}>
                  Add teammate details to continue. This event requires at least {minTeammates} teammate(s) in addition to the team leader.
                </p>
                <button
                  type="button"
                  onClick={handleAddTeammateSlot}
                  className="btn-cyber-secondary"
                  style={{ fontSize: '0.8rem' }}
                >
                  + Add Teammate Details Now
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '320px', overflowY: 'auto' }}>
                {teammates.map((tm, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '14px',
                      background: 'linear-gradient(135deg, rgba(20, 35, 65, 0.95) 0%, rgba(16, 26, 53, 0.95) 100%)',
                      border: '1px solid rgba(52, 211, 153, 0.4)',
                      borderRadius: '10px',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: 'rgba(52, 211, 153, 0.2)', color: '#34D399', letterSpacing: '0.04em' }}>
                          ✓ SQUAD MEMBER #{idx + 1}
                        </span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                          {tm.name || 'Pending Details'}
                        </span>
                        {tm.rollNumber && (
                          <span style={{ fontSize: '0.78rem', color: '#BACEBB', fontFamily: 'monospace' }}>
                            ({tm.rollNumber})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeammate(idx)}
                        disabled={teammates.length <= minTeammates}
                        title={teammates.length <= minTeammates ? 'The event minimum team size must be met.' : 'Remove teammate'}
                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.74rem' }}
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
                        required
                      />
                      <input
                        type="text"
                        className="cyber-input"
                        placeholder="Roll / Student ID *"
                        value={tm.rollNumber}
                        onChange={e => handleUpdateTeammate(idx, 'rollNumber', e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input
                        type="email"
                        className="cyber-input"
                        placeholder="Email for teammate’s individual pass *"
                        value={tm.email || ''}
                        onChange={e => handleUpdateTeammate(idx, 'email', e.target.value)}
                        required
                      />
                      <input
                        type="tel"
                        className="cyber-input"
                        placeholder="Phone Number *"
                        value={tm.phone || ''}
                        onChange={e => handleUpdateTeammate(idx, 'phone', e.target.value)}
                        required
                      />
                    </div>

                    <input
                      type="text"
                      className="cyber-input"
                      placeholder="College / Institution Name *"
                      value={tm.college || ''}
                      onChange={e => handleUpdateTeammate(idx, 'college', e.target.value)}
                      required
                      style={{ marginTop: '8px' }}
                    />
                  </div>
                ))}

                {teammates.length < maxTeammates && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(40, 59, 120, 0.25)',
                      border: '1px dashed rgba(120, 149, 147, 0.4)',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.76rem',
                      color: '#BACEBB'
                    }}
                  >
                    <span>
                      <strong>{maxTeammates - teammates.length} additional teammate slot(s) available.</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleAddTeammateSlot}
                      style={{ background: 'none', border: '1px solid rgba(120, 149, 147, 0.4)', borderRadius: '6px', color: '#FFFFFF', padding: '4px 10px', fontSize: '0.74rem', cursor: 'pointer' }}
                    >
                      + Add Manual Slot
                    </button>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
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
                <span>{event.fee > 0 ? 'Proceed to Payment' : 'Confirm & Register Team'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3 (or Step 2 for Solo): Razorpay Payment */}
        {/* ============================================================== */}
        {((step === 3 && isTeamEvent) || (step === 2 && !isTeamEvent)) && event.fee > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Squad Summary Card for Leader */}
            {isTeamEvent && (
              <div
                style={{
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, rgba(20, 31, 62, 0.95) 0%, rgba(16, 26, 53, 0.95) 100%)',
                  border: '1px solid rgba(52, 211, 153, 0.35)',
                  borderRadius: '10px'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#34D399', fontWeight: 800, letterSpacing: '0.06em' }}>
                    TEAM ROSTER READY FOR PAYMENT
                  </span>
                </div>
                <div style={{ fontSize: '0.92rem', color: '#FFFFFF', fontWeight: 700, marginTop: '4px' }}>
                  {teamName || 'Your Squad'} • Leader: {leader.name} ({leader.rollNumber})
                </div>
                <div style={{ fontSize: '0.76rem', color: '#DCE3E5', marginTop: '4px' }}>
                  Teammates ({teammates.length}):{' '}
                  {teammates.length > 0
                    ? teammates.map(t => `${t.name || 'Member'} (${t.rollNumber || 'ID'})`).join(', ')
                    : 'No additional teammates'}
                </div>
              </div>
            )}
            {paymentMethod === 'razorpay' ? (
              <div
                style={{
                  padding: '22px',
                  background: 'linear-gradient(135deg, rgba(16, 42, 72, 0.96), rgba(16, 26, 53, 0.96))',
                  border: '1px solid rgba(56, 189, 248, 0.45)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 800, letterSpacing: '0.08em' }}>
                      {razorpayMode === 'test' ? 'SECURE PAYMENT • RAZORPAY TEST MODE' : razorpayMode === 'live' ? 'SECURE PAYMENT • RAZORPAY LIVE' : 'SECURE PAYMENT • RAZORPAY'}
                    </div>
                    <div style={{ color: '#FFFFFF', fontSize: '1.18rem', fontWeight: 800, marginTop: '5px' }}>
                      ₹{event.fee * passQuantity} <span style={{ color: '#BACEBB', fontSize: '0.78rem', fontWeight: 600 }}>INR</span>
                    </div>
                    <div style={{ color: '#DCE3E5', fontSize: '0.76rem', lineHeight: 1.45, marginTop: '5px' }}>
                      Razorpay securely processes your payment. Your pass is created only after our backend verifies it.
                    </div>
                  </div>
                  <ShieldCheck size={28} color="#34D399" />
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 11px',
                  borderRadius: '8px',
                  background: 'rgba(52, 211, 153, 0.08)',
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                  color: '#BACEBB',
                  fontSize: '0.7rem',
                  lineHeight: 1.4
                }}>
                  <CheckCircle2 size={14} color="#34D399" />
                  <span>No screenshot or UTR is required. Your pass is issued after Razorpay verification.</span>
                </div>
              </div>
            ) : (
              <>
            {/* Manual Payment Proof Box (preserved fallback) */}
            <div
              style={{
                padding: '18px',
                background: 'rgba(16, 26, 53, 0.92)',
                border: '1px solid rgba(120, 149, 147, 0.35)',
                borderRadius: '12px',
                display: 'grid',
                gridTemplateColumns: '1fr 1.3fr',
                gap: '18px',
                alignItems: 'center'
              }}
            >
              {/* QR Code Presentation */}
              <div style={{ textAlign: 'center', background: '#FFFFFF', padding: '12px', borderRadius: '10px' }}>
                <LocalQrCode
                  value={`upi://pay?pa=festronix2026@vce&pn=Festronix%20VCE&am=${event.fee * passQuantity}&cu=INR`}
                  size={135}
                  alt="UPI payment QR"
                />
                <div style={{ fontSize: '0.7rem', color: '#101A35', fontWeight: 800, marginTop: '6px' }}>
                  SCAN WITH ANY UPI APP
                </div>
              </div>

              {/* Instructions */}
              <div>
                <div style={{ fontSize: '0.72rem', color: '#A8B3C2' }}>OFFICIAL UPI ID:</div>
                <div className="font-title" style={{ fontSize: '1.05rem', color: '#BACEBB', fontWeight: 700 }}>
                  festronix2026@vce
                </div>
                <div style={{ fontSize: '0.76rem', color: '#DCE3E5', marginTop: '6px' }}>
                  Beneficiary: <strong>Festronix SAC Vardhaman</strong>
                </div>
                <div style={{ fontSize: '1.25rem', color: '#fbbf24', fontWeight: 800, marginTop: '8px' }}>
                  Payable Amount: ₹{event.fee * passQuantity}
                  {isTeamEvent && (
                    <span style={{ fontSize: '0.75rem', color: '#BACEBB', marginLeft: '6px', fontWeight: 600 }}>
                      (Total Team Fee)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#A8B3C2', marginTop: '6px', lineHeight: 1.4 }}>
                  Supports PhonePe, Google Pay, Paytm, BHIM, and CRED.
                </div>
              </div>
            </div>

            {/* Proof Submission inputs */}
            <div>
              <label style={{ fontSize: '0.78rem', color: '#DCE3E5', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
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
              <label style={{ fontSize: '0.78rem', color: '#DCE3E5', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                PAYMENT RECEIPT SCREENSHOT *
              </label>
              <div
                style={{
                  border: '2px dashed rgba(120, 149, 147, 0.45)',
                  borderRadius: '10px',
                  padding: '14px',
                  textAlign: 'center',
                  background: 'rgba(16, 26, 53, 0.75)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
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
                        style={{ maxHeight: '110px', borderRadius: '6px', margin: '0 auto', display: 'block' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#BACEBB', display: 'block', marginTop: '6px', fontWeight: 600 }}>
                        ✓ Screenshot uploaded (Click to replace)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <Upload size={26} color="#BACEBB" style={{ margin: '0 auto 6px' }} />
                      <div style={{ fontSize: '0.84rem', color: '#FFFFFF', fontWeight: 600 }}>
                        Click to upload payment screenshot
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#A8B3C2', marginTop: '4px' }}>
                        Supports PNG, JPG, WebP up to 5MB
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

              </>
            )}

            {/* Submit / Back */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setStep(isTeamEvent ? 2 : 1)}
                className="btn-cyber-secondary"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-cyber-primary"
              >
                <span>{isSubmitting ? (paymentMethod === 'razorpay' ? 'Opening Razorpay...' : 'Registering...') : (paymentMethod === 'razorpay' ? (isTeamEvent ? 'Pay & Register Team' : 'Pay & Register') : (isTeamEvent ? 'Submit Proof & Register Team' : 'Submit Proof & Register'))}</span>
                <CheckCircle2 size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
