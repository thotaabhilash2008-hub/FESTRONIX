import React, { useState, useEffect } from 'react';
import { X, Ticket, Plus, Minus, ShoppingBag, CheckCircle2, ArrowRight, ArrowLeft, QrCode, Upload, User, AlertCircle, Shield, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FestEvent, Registration, User as UserType, AdditionalMember } from '../types/festronix';
import { StorageService } from '../services/storageService';

interface MultiPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: FestEvent[];
  currentUser: UserType | null;
  onOpenAuth: () => void;
  onSuccess: (newRegistrations: Registration[]) => void;
}

interface CartItem {
  event: FestEvent;
  quantity: number;
}

export const MultiPassModal: React.FC<MultiPassModalProps> = ({
  isOpen,
  onClose,
  events,
  currentUser,
  onOpenAuth,
  onSuccess
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedItems, setSelectedItems] = useState<{ [eventId: string]: number }>({});
  const [additionalMembersByEvent, setAdditionalMembersByEvent] = useState<{
    [eventId: string]: AdditionalMember[];
  }>({});
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');

  // Buyer details state (auto-populated if user is logged in)
  const [buyerInfo, setBuyerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    college: 'Vardhaman College of Engineering',
    rollNumber: ''
  });

  const [transactionId, setTransactionId] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setBuyerInfo({
        name: currentUser.fullName,
        email: currentUser.email,
        phone: currentUser.phone,
        college: currentUser.college,
        rollNumber: currentUser.rollNumber
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleEventSelection = (eventId: string) => {
    setSelectedItems(prev => {
      const copy = { ...prev };
      if (copy[eventId]) {
        delete copy[eventId];
      } else {
        copy[eventId] = 1;
      }
      return copy;
    });
    setAdditionalMembersByEvent(prev => {
      const copy = { ...prev };
      delete copy[eventId];
      return copy;
    });
  };

  const updateQuantity = (eventId: string, delta: number) => {
    let nextQty = 0;
    setSelectedItems(prev => {
      const current = prev[eventId] || 0;
      nextQty = Math.max(0, Math.min(10, current + delta));
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[eventId];
        return copy;
      }
      return { ...prev, [eventId]: nextQty };
    });

    setAdditionalMembersByEvent(prev => {
      const needed = Math.max(0, nextQty - 1);
      const copy = { ...prev };
      if (needed <= 0) {
        delete copy[eventId];
        return copy;
      }
      const existing = copy[eventId] || [];
      const updated = [...existing];
      while (updated.length < needed) {
        updated.push({ name: '', rollNumber: '', deptSection: '' });
      }
      copy[eventId] = updated.slice(0, needed);
      return copy;
    });
  };

  const selectedEventEntries = Object.entries(selectedItems)
    .map(([eventId, qty]) => {
      const evt = events.find(e => e.id === eventId);
      return evt ? { event: evt, quantity: qty } : null;
    })
    .filter((item): item is CartItem => item !== null);

  const totalPassCount = selectedEventEntries.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = selectedEventEntries.reduce((sum, item) => sum + item.event.fee * item.quantity, 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('File size exceeds 5MB. Please upload a smaller screenshot.');
        return;
      }
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
        setErrorMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProceedToPayment = () => {
    if (totalPassCount === 0) {
      setErrorMessage('Please select at least one event pass to proceed.');
      return;
    }
    if (!buyerInfo.name.trim() || !buyerInfo.rollNumber.trim() || !buyerInfo.email.trim() || !buyerInfo.phone.trim()) {
      setErrorMessage('Please fill in all buyer / student details.');
      return;
    }

    // Validate additional members for any event with quantity > 1
    for (const item of selectedEventEntries) {
      if (item.quantity > 1) {
        const extra = additionalMembersByEvent[item.event.id] || [];
        const seenRolls = new Set<string>();
        seenRolls.add(buyerInfo.rollNumber.trim().toUpperCase());

        for (let i = 0; i < item.quantity - 1; i++) {
          const mem = extra[i];
          const passNum = i + 2;
          if (!mem || !mem.name.trim()) {
            setErrorMessage(`Please enter the full name for Pass #${passNum} of "${item.event.title}".`);
            return;
          }
          if (!mem.rollNumber.trim()) {
            setErrorMessage(`Please enter the roll number for Pass #${passNum} of "${item.event.title}".`);
            return;
          }
          if (!mem.deptSection.trim()) {
            setErrorMessage(`Please enter Department & Section (e.g. CSE - A) for Pass #${passNum} of "${item.event.title}".`);
            return;
          }

          const cleanRoll = mem.rollNumber.trim().toUpperCase();
          if (seenRolls.has(cleanRoll)) {
            setErrorMessage(`Duplicate roll number "${cleanRoll}" detected for "${item.event.title}".`);
            return;
          }
          seenRolls.add(cleanRoll);

          const dup = StorageService.checkDuplicateRegistration(item.event.id, cleanRoll);
          if (dup.isDuplicate && dup.existingReg) {
            setErrorMessage(`Member "${mem.name}" (${cleanRoll}) is already registered for "${item.event.title}".`);
            return;
          }
        }
      }
    }

    setErrorMessage(null);

    if (totalAmount === 0) {
      // Free events: submit directly
      handleFinalSubmit();
    } else {
      setStep(2);
    }
  };

  const handleFinalSubmit = async () => {
    if (totalAmount > 0) {
      if (!transactionId.trim()) {
        setErrorMessage('Please enter the UPI Transaction ID / UTR number.');
        return;
      }
      if (!screenshotPreview) {
        setErrorMessage('Please upload your payment screenshot.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let finalScreenshotUrl = screenshotPreview || undefined;

      // Upload to Supabase Storage if file is present
      if (screenshotFile) {
        const uploadRes = await StorageService.uploadPaymentScreenshot(screenshotFile, buyerInfo.rollNumber);
        if (uploadRes.url) {
          finalScreenshotUrl = uploadRes.url;
        }
      }

      // Generate registrations for each pass
      const batchData: Array<Omit<Registration, 'id' | 'qrToken' | 'checkedIn'>> = [];
      const dateNow = new Date().toISOString().replace('T', ' ').slice(0, 16);

      for (const item of selectedEventEntries) {
        const extra = additionalMembersByEvent[item.event.id] || [];
        for (let i = 0; i < item.quantity; i++) {
          const isBuyer = i === 0;
          const memberInfo = isBuyer ? null : extra[i - 1];

          batchData.push({
            userId: currentUser?.id,
            buyerRoll: buyerInfo.rollNumber.trim().toUpperCase(),
            eventId: item.event.id,
            eventTitle: `${item.event.title}${item.quantity > 1 ? ` (Pass #${i + 1}${memberInfo ? `: ${memberInfo.name.trim()}` : ''})` : ''}`,
            leaderName: isBuyer ? buyerInfo.name.trim() : memberInfo!.name.trim(),
            leaderEmail: buyerInfo.email.trim(),
            leaderPhone: buyerInfo.phone.trim(),
            leaderCollege: buyerInfo.college.trim(),
            leaderRoll: isBuyer ? buyerInfo.rollNumber.trim().toUpperCase() : memberInfo!.rollNumber.trim().toUpperCase(),
            deptSection: memberInfo ? memberInfo.deptSection.trim().toUpperCase() : undefined,
            teammates: [],
            format: item.event.format,
            fee: item.event.fee,
            source: 'online',
            registrationDate: dateNow,
            paymentStatus: item.event.fee === 0 ? 'not_applicable' : 'verification_pending',
            transactionId: item.event.fee > 0 ? transactionId : undefined,
            paymentScreenshotUrl: finalScreenshotUrl
          });
        }
      }

      const created = await StorageService.addMultipleRegistrations(batchData);

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      onSuccess(created);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to complete registration passes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter events
  const filteredEvents = events.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(searchFilter.toLowerCase()) || e.departmentCode.toLowerCase().includes(searchFilter.toLowerCase());
    const matchDept = selectedDeptFilter === 'all' || e.departmentCode === selectedDeptFilter;
    return matchSearch && matchDept && e.status === 'open';
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '850px',
          width: '95%',
          padding: '28px',
          background: 'linear-gradient(135deg, rgba(20, 31, 62, 0.98) 0%, rgba(16, 26, 53, 0.98) 100%)',
          border: '1px solid rgba(220, 227, 229, 0.22)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9), 0 0 35px rgba(40, 59, 120, 0.4)',
          borderRadius: '20px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #283B78 0%, #3B539C 50%, #789593 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(120, 149, 147, 0.4)'
              }}
            >
              <Ticket size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="font-title" style={{ fontSize: '1.35rem', color: '#FFFFFF', margin: 0, fontWeight: 700 }}>
                  FESTRONIX REGISTRATION PORTAL
                </h3>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(120, 149, 147, 0.2)',
                    border: '1px solid rgba(120, 149, 147, 0.4)',
                    color: '#BACEBB',
                    fontWeight: 700
                  }}
                >
                  SINGLE & MULTI-PASS
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#A8B3C2', margin: '2px 0 0' }}>
                Select any event(s), choose pass quantities for you or your team, and complete booking in one step
              </p>
            </div>
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
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#A8B3C2')}
          >
            <X size={18} />
          </button>
        </div>

        {/* User Account / Sign In Pill */}
        <div
          style={{
            padding: '12px 16px',
            background: currentUser ? 'rgba(40, 59, 120, 0.25)' : 'rgba(16, 26, 53, 0.75)',
            border: '1px solid rgba(120, 149, 147, 0.35)',
            borderRadius: '10px',
            marginBottom: '18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #283B78 0%, #789593 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.75rem'
                }}
              >
                {currentUser.fullName.charAt(0)}
              </div>
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>
                  {currentUser.fullName} ({currentUser.rollNumber})
                </span>
                <span style={{ fontSize: '0.72rem', color: '#BACEBB', marginLeft: '6px' }}>
                  • Passes will be linked to your account
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} color="#BACEBB" />
              <span style={{ fontSize: '0.8rem', color: '#A8B3C2' }}>
                Have a student account? Sign in to autofill your pass details.
              </span>
            </div>
          )}

          {!currentUser && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="btn-cyber-secondary"
              style={{ padding: '5px 12px', fontSize: '0.75rem' }}
            >
              Sign In / Sign Up
            </button>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '0.82rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Select Events & Buyer Details */}
        {step === 1 ? (
          <div>
            {/* Buyer Details Inputs (if not filled or want to edit) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                marginBottom: '18px',
                padding: '14px',
                background: 'rgba(16, 26, 53, 0.85)',
                border: '1px solid rgba(220, 227, 229, 0.15)',
                borderRadius: '10px'
              }}
            >
              <div>
                <label style={{ fontSize: '0.72rem', color: '#A8B3C2', display: 'block', marginBottom: '4px' }}>
                  BUYER FULL NAME *
                </label>
                <input
                  type="text"
                  className="cyber-input"
                  style={{ height: '36px', fontSize: '0.82rem' }}
                  placeholder="Rahul Sharma"
                  value={buyerInfo.name}
                  onChange={e => setBuyerInfo({ ...buyerInfo, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#A8B3C2', display: 'block', marginBottom: '4px' }}>
                  ROLL / STUDENT ID *
                </label>
                <input
                  type="text"
                  className="cyber-input"
                  style={{ height: '36px', fontSize: '0.82rem' }}
                  placeholder="22VCECS104"
                  value={buyerInfo.rollNumber}
                  onChange={e => setBuyerInfo({ ...buyerInfo, rollNumber: e.target.value.toUpperCase() })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#A8B3C2', display: 'block', marginBottom: '4px' }}>
                  COLLEGE EMAIL *
                </label>
                <input
                  type="email"
                  className="cyber-input"
                  style={{ height: '36px', fontSize: '0.82rem' }}
                  placeholder="rahul@college.edu"
                  value={buyerInfo.email}
                  onChange={e => setBuyerInfo({ ...buyerInfo, email: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#A8B3C2', display: 'block', marginBottom: '4px' }}>
                  PHONE NUMBER *
                </label>
                <input
                  type="tel"
                  className="cyber-input"
                  style={{ height: '36px', fontSize: '0.82rem' }}
                  placeholder="+91 98765 43210"
                  value={buyerInfo.phone}
                  onChange={e => setBuyerInfo({ ...buyerInfo, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Filter toolbar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
              <input
                type="text"
                className="cyber-input"
                style={{ height: '36px', fontSize: '0.8rem', flex: 1 }}
                placeholder="Search event name or department code..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
              />

              <select
                className="cyber-select"
                style={{ height: '36px', fontSize: '0.8rem', width: '160px' }}
                value={selectedDeptFilter}
                onChange={e => setSelectedDeptFilter(e.target.value)}
              >
                <option value="all">All Depts</option>
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
                <option value="CSM">AI & ML</option>
                <option value="CSD">Data Science</option>
              </select>
            </div>

            {/* Event Selection Grid */}
            <div
              style={{
                maxHeight: '280px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingRight: '4px',
                marginBottom: '18px'
              }}
            >
              {filteredEvents.map(evt => {
                const qty = selectedItems[evt.id] || 0;
                const isSelected = qty > 0;

                return (
                  <div
                    key={evt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(40, 59, 120, 0.35)' : 'rgba(16, 26, 53, 0.75)',
                      border: isSelected ? '1px solid rgba(120, 149, 147, 0.55)' : '1px solid rgba(220, 227, 229, 0.12)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleEventSelection(evt.id)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#283B78' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(120, 149, 147, 0.15)',
                              color: '#BACEBB',
                              fontWeight: 700
                            }}
                          >
                            {evt.departmentCode}
                          </span>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                            {evt.title}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#A8B3C2', marginTop: '2px' }}>
                          {evt.date} • {evt.venue} • {evt.fee === 0 ? 'Free Entry' : `₹${evt.fee}/pass`}
                        </div>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="font-title" style={{ fontSize: '0.95rem', fontWeight: 800, color: evt.fee === 0 ? '#BACEBB' : '#DCE3E5', marginRight: '6px' }}>
                        {evt.fee === 0 ? 'FREE' : `₹${evt.fee * (qty || 1)}`}
                      </span>

                      {isSelected && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(16, 26, 53, 0.9)',
                            border: '1px solid rgba(120, 149, 147, 0.4)',
                            borderRadius: '6px',
                            overflow: 'hidden'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => updateQuantity(evt.id, -1)}
                            style={{
                              width: '28px',
                              height: '28px',
                              background: 'none',
                              border: 'none',
                              color: '#DCE3E5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Minus size={13} />
                          </button>
                          <span style={{ width: '24px', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(evt.id, 1)}
                            style={{
                              width: '28px',
                              height: '28px',
                              background: 'none',
                              border: 'none',
                              color: '#DCE3E5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Additional Members for Events with Multiple Passes */}
            {selectedEventEntries.some(item => item.quantity > 1) && (
              <div
                style={{
                  marginTop: '16px',
                  marginBottom: '16px',
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
                      <span>Additional Pass Members</span>
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
                      Required for Extra Passes
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#A8B3C2', marginTop: '3px' }}>
                    Pass #1 for each event is registered for you ({buyerInfo.name || 'Buyer'}). Please enter attendee details for all extra passes below.
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {selectedEventEntries
                    .filter(item => item.quantity > 1)
                    .map(item => {
                      const members = additionalMembersByEvent[item.event.id] || [];
                      return (
                        <div
                          key={item.event.id}
                          style={{
                            padding: '14px',
                            background: 'rgba(16, 26, 53, 0.9)',
                            border: '1px solid rgba(120, 149, 147, 0.25)',
                            borderRadius: '10px'
                          }}
                        >
                          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#BACEBB' }}>{item.event.departmentCode}</span>
                            <span>•</span>
                            <span>{item.event.title}</span>
                            <span style={{ fontSize: '0.72rem', color: '#A8B3C2', fontWeight: 400 }}>
                              ({item.quantity - 1} Extra Pass{item.quantity - 1 > 1 ? 'es' : ''})
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {Array.from({ length: item.quantity - 1 }).map((_, idx) => {
                              const mem = members[idx] || { name: '', rollNumber: '', deptSection: '' };
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    padding: '10px',
                                    background: 'rgba(10, 16, 32, 0.65)',
                                    border: '1px solid rgba(220, 227, 229, 0.1)',
                                    borderRadius: '6px'
                                  }}
                                >
                                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#BACEBB', marginBottom: '8px' }}>
                                    Pass #{idx + 2} Attendee
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
                                    <div>
                                      <label style={{ fontSize: '0.68rem', color: '#A8B3C2', display: 'block', marginBottom: '3px' }}>
                                        MEMBER FULL NAME *
                                      </label>
                                      <input
                                        type="text"
                                        className="cyber-input"
                                        style={{ height: '34px', fontSize: '0.8rem' }}
                                        placeholder="e.g. Sravan Kumar"
                                        value={mem.name}
                                        onChange={e => {
                                          const copy = { ...additionalMembersByEvent };
                                          const evList = [...(copy[item.event.id] || [])];
                                          while (evList.length < item.quantity - 1) {
                                            evList.push({ name: '', rollNumber: '', deptSection: '' });
                                          }
                                          evList[idx] = { ...evList[idx], name: e.target.value };
                                          copy[item.event.id] = evList;
                                          setAdditionalMembersByEvent(copy);
                                        }}
                                        required
                                      />
                                    </div>

                                    <div>
                                      <label style={{ fontSize: '0.68rem', color: '#A8B3C2', display: 'block', marginBottom: '3px' }}>
                                        ROLL / STUDENT ID *
                                      </label>
                                      <input
                                        type="text"
                                        className="cyber-input"
                                        style={{ height: '34px', fontSize: '0.8rem' }}
                                        placeholder="e.g. 22VCECS109"
                                        value={mem.rollNumber}
                                        onChange={e => {
                                          const copy = { ...additionalMembersByEvent };
                                          const evList = [...(copy[item.event.id] || [])];
                                          while (evList.length < item.quantity - 1) {
                                            evList.push({ name: '', rollNumber: '', deptSection: '' });
                                          }
                                          evList[idx] = { ...evList[idx], rollNumber: e.target.value.toUpperCase() };
                                          copy[item.event.id] = evList;
                                          setAdditionalMembersByEvent(copy);
                                        }}
                                        required
                                      />
                                    </div>

                                    <div>
                                      <label style={{ fontSize: '0.68rem', color: '#A8B3C2', display: 'block', marginBottom: '3px' }}>
                                        DEPT & SECTION *
                                      </label>
                                      <input
                                        type="text"
                                        className="cyber-input"
                                        style={{ height: '34px', fontSize: '0.8rem' }}
                                        placeholder="e.g. CSE - B"
                                        value={mem.deptSection}
                                        onChange={e => {
                                          const copy = { ...additionalMembersByEvent };
                                          const evList = [...(copy[item.event.id] || [])];
                                          while (evList.length < item.quantity - 1) {
                                            evList.push({ name: '', rollNumber: '', deptSection: '' });
                                          }
                                          evList[idx] = { ...evList[idx], deptSection: e.target.value.toUpperCase() };
                                          copy[item.event.id] = evList;
                                          setAdditionalMembersByEvent(copy);
                                        }}
                                        required
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Bottom Summary Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                background: 'rgba(16, 26, 53, 0.95)',
                border: '1px solid rgba(120, 149, 147, 0.35)',
                borderRadius: '12px'
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: '#A8B3C2' }}>SELECTED PASSES</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>
                  {totalPassCount} Pass{totalPassCount !== 1 ? 'es' : ''} across {selectedEventEntries.length} Event{selectedEventEntries.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#A8B3C2' }}>TOTAL AMOUNT</div>
                  <div className="font-title" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FBBF24' }}>
                    {totalAmount === 0 ? 'FREE' : `₹${totalAmount}`}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={totalPassCount === 0}
                  onClick={handleProceedToPayment}
                  className="btn-cyber-primary"
                  style={{
                    padding: '10px 22px',
                    fontSize: '0.88rem',
                    opacity: totalPassCount === 0 ? 0.5 : 1,
                    cursor: totalPassCount === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <span>{totalAmount === 0 ? 'Generate Free Passes' : 'Proceed to Payment'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: Unified Bulk UPI Payment */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Payment instructions card */}
            <div
              style={{
                padding: '20px',
                background: 'rgba(16, 26, 53, 0.92)',
                border: '1px solid rgba(120, 149, 147, 0.35)',
                borderRadius: '12px',
                display: 'grid',
                gridTemplateColumns: '1fr 1.3fr',
                gap: '20px',
                alignItems: 'center'
              }}
            >
              {/* QR Code Presentation */}
              <div style={{ textAlign: 'center', background: '#FFFFFF', padding: '12px', borderRadius: '10px' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=festronix2026@vce%26pn=Festronix%20VCE%26am=${totalAmount}%26cu=INR`}
                  alt="UPI Payment QR"
                  style={{ width: '135px', height: '135px', display: 'block', margin: '0 auto' }}
                />
                <div style={{ fontSize: '0.72rem', color: '#101A35', fontWeight: 800, marginTop: '6px' }}>
                  SCAN WITH ANY UPI APP
                </div>
              </div>

              {/* Instructions */}
              <div>
                <div style={{ fontSize: '0.75rem', color: '#A8B3C2' }}>COMBINED BATCH AMOUNT:</div>
                <div className="font-title" style={{ fontSize: '1.5rem', color: '#fbbf24', fontWeight: 800, marginTop: '2px' }}>
                  ₹{totalAmount} ({totalPassCount} Passes)
                </div>
                <div style={{ fontSize: '0.78rem', color: '#DCE3E5', marginTop: '6px' }}>
                  Beneficiary: <strong>Festronix SAC Vardhaman</strong>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#BACEBB', fontWeight: 700, marginTop: '4px' }}>
                  UPI ID: festronix2026@vce
                </div>
                <div style={{ fontSize: '0.72rem', color: '#A8B3C2', marginTop: '6px', lineHeight: 1.4 }}>
                  One single transaction covers all {totalPassCount} tickets. Supports PhonePe, GPay, Paytm, BHIM, etc.
                </div>
              </div>
            </div>

            {/* Proof Submission inputs */}
            <div>
              <label style={{ fontSize: '0.8rem', color: '#DCE3E5', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
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
              <label style={{ fontSize: '0.8rem', color: '#DCE3E5', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                PAYMENT RECEIPT SCREENSHOT *
              </label>
              <div
                style={{
                  border: '2px dashed rgba(120, 149, 147, 0.45)',
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center',
                  background: 'rgba(16, 26, 53, 0.75)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  id="multi-screenshot-upload"
                />
                <label htmlFor="multi-screenshot-upload" style={{ cursor: 'pointer', display: 'block' }}>
                  {screenshotPreview ? (
                    <div>
                      <img
                        src={screenshotPreview}
                        alt="Screenshot Preview"
                        style={{ maxHeight: '120px', borderRadius: '6px', margin: '0 auto', display: 'block' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#BACEBB', display: 'block', marginTop: '6px', fontWeight: 600 }}>
                        ✓ Screenshot uploaded (Click to change)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <Upload size={28} color="#BACEBB" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: '0.85rem', color: '#FFFFFF', fontWeight: 600 }}>
                        Click to upload payment screenshot
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#A8B3C2', marginTop: '4px' }}>
                        Supports PNG, JPG, WebP up to 5MB
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Back / Submit Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-cyber-secondary"
              >
                <ArrowLeft size={16} />
                <span>Back to Passes</span>
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                className="btn-cyber-primary"
                style={{ padding: '10px 24px', fontSize: '0.88rem' }}
              >
                <span>Submit & Generate {totalPassCount} Passes</span>
                <CheckCircle2 size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
