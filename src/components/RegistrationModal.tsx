import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Phone, School, QrCode, Upload, CheckCircle2, ArrowRight, 
  ArrowLeft, AlertTriangle, Layers, Plus, Minus, Copy, Check, Users, Sparkles, 
  Share2, ShieldCheck, Search, Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FestEvent, Teammate, Registration, User as UserType, Team, AdditionalMember } from '../types/festronix';
import { StorageService } from '../services/storageService';
import { isSupabaseConfigured } from '../lib/supabase';
import { getEventRegistrationBlockReason } from '../lib/eventRegistration';

interface RegistrationModalProps {
  event: FestEvent | null;
  currentUser?: UserType | null;
  onClose: () => void;
  onSuccess: (registration: Registration) => void;
  onOpenMultiPass?: () => void;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  event,
  currentUser,
  onClose,
  onSuccess,
  onOpenMultiPass,
  onOpenAuth
}) => {
  const isTeamEvent = event ? event.format !== 'individual' : false;

  // Step & Mode State
  const [teamMode, setTeamMode] = useState<'create' | 'join'>('create');
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
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [newTeammateAlert, setNewTeammateAlert] = useState<string | null>(null);

  // Join Team Specific States
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [verifiedTeam, setVerifiedTeam] = useState<Team | null>(null);
  const [joinLookupError, setJoinLookupError] = useState<string | null>(null);
  const [joinConfirmation, setJoinConfirmation] = useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState<boolean>(false);

  const isLeaderOfVerifiedTeam = Boolean(
    currentUser && verifiedTeam && (verifiedTeam.isCurrentUserLeader || (
      (verifiedTeam.leaderRoll && currentUser.rollNumber && verifiedTeam.leaderRoll.trim().toUpperCase() === currentUser.rollNumber.trim().toUpperCase()) ||
      (verifiedTeam.leaderEmail && currentUser.email && verifiedTeam.leaderEmail.trim().toLowerCase() === currentUser.email.trim().toLowerCase())
    ))
  );

  const isAlreadyMemberOfVerifiedTeam = Boolean(
    currentUser && verifiedTeam && (verifiedTeam.isCurrentUserMember || verifiedTeam.members?.some(
      m => (m.rollNumber && currentUser.rollNumber && m.rollNumber.trim().toUpperCase() === currentUser.rollNumber.trim().toUpperCase()) ||
           (m.email && currentUser.email && m.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase())
    ))
  );
  const verifiedTeamMemberCount = verifiedTeam
    ? Math.max(verifiedTeam.memberCount ?? 0, verifiedTeam.members?.length ?? 0)
    : 0;
  const verifiedTeamTotalCount = verifiedTeam ? 1 + verifiedTeamMemberCount : 0;
  const verifiedLeaderStatus = verifiedTeam?.leaderRegistrationStatus || verifiedTeam?.paymentStatus || 'membership_pending';

  // Payment States
  const [transactionId, setTransactionId] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Prevent background scroll
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

  // Sync user credentials & initialize generated team code
  useEffect(() => {
    if (currentUser) {
      setLeader({
        name: currentUser.fullName,
        email: currentUser.email,
        phone: currentUser.phone,
        college: currentUser.college,
        rollNumber: currentUser.rollNumber
      });
    }
    if (currentUser && event && isTeamEvent) {
      const code = generatedTeamCode || StorageService.generateTeamCode(event.departmentCode || event.slug || 'FX');
      if (!generatedTeamCode) {
        setGeneratedTeamCode(code);
      }
      const initialSquadName = teamName || (currentUser?.fullName ? `${currentUser.fullName.split(' ')[0]}'s Squad` : 'Alpha Squad');
      if (!teamName) {
        setTeamName(initialSquadName);
      }

      // Instantly reserve squad so team code is LIVE and JOINABLE across the whole app
      StorageService.reserveOrRegisterTeam({
        teamCode: code,
        teamName: initialSquadName,
        eventId: event.id,
        eventTitle: event.title,
        registrationId: '',
        leaderId: currentUser?.id,
        leaderName: currentUser?.fullName || leader.name || 'Team Leader',
        leaderRoll: currentUser?.rollNumber || leader.rollNumber || '',
        leaderEmail: currentUser?.email || leader.email || '',
        leaderPhone: currentUser?.phone || leader.phone || '',
        leaderCollege: currentUser?.college || leader.college || 'Vardhaman College of Engineering',
        members: teammates || [],
        maxTeamSize: event.maxTeamSize || 4,
        minTeamSize: event.minTeamSize || 2
      }).catch(err => console.warn('Instant team reservation error:', err));
    }
  }, [currentUser, event, isTeamEvent]);

  // Real-time synchronization of squad members for team leader
  useEffect(() => {
    if (!isTeamEvent || !generatedTeamCode) return;

    const normCode = generatedTeamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    const syncLiveMembers = (team: Team) => {
      if (!team || team.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() !== normCode) return;
      const liveMembers = team.members || [];

      setTeammates(prev => {
        // Find newly joined members not in prev state
        const newlyAdded = liveMembers.filter(
          lm => !prev.some(p => p.rollNumber && lm.rollNumber && p.rollNumber.trim().toLowerCase() === lm.rollNumber.trim().toLowerCase())
        );

        if (newlyAdded.length > 0) {
          const names = newlyAdded.map(m => `${m.name} (${m.rollNumber})`).join(', ');
          setNewTeammateAlert(`🎉 Teammate Joined: ${names} just joined your squad via code ${generatedTeamCode}!`);
          setTimeout(() => setNewTeammateAlert(null), 8000);
          confetti({
            particleCount: 75,
            spread: 60,
            origin: { y: 0.65 }
          });
          return [...prev, ...newlyAdded];
        }
        return prev;
      });
    };

    // 1. Initial check from StorageService
    const existing = StorageService.getTeams().find(
      t => t.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normCode
    );
    if (existing) syncLiveMembers(existing);

    // 2. Window event listener
    const handleTeamsUpdated = (e: any) => {
      if (e?.detail?.team) {
        syncLiveMembers(e.detail.team);
      }
    };
    window.addEventListener('festronix:teams-updated', handleTeamsUpdated);

    // 3. Cross-tab BroadcastChannel listener
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('festronix_teams_sync_bus');
        bc.onmessage = evt => {
          if (evt.data?.team) {
            syncLiveMembers(evt.data.team);
          }
        };
      }
    } catch {}

    // 4. Polling fallback every 1500ms
    const intervalId = setInterval(async () => {
      const lookup = await StorageService.findTeamWithValidation(generatedTeamCode);
      if (lookup.team) {
        syncLiveMembers(lookup.team);
      }
    }, 1500);

    return () => {
      window.removeEventListener('festronix:teams-updated', handleTeamsUpdated);
      if (bc) {
        bc.close();
      }
      clearInterval(intervalId);
    };
  }, [isTeamEvent, generatedTeamCode]);

  if (!event) return null;

  const maxTeammates = event.format === 'individual' ? 0 : event.maxTeamSize - 1;
  const minTeammates = event.format === 'individual' ? 0 : event.minTeamSize - 1;

  const handleCopyCode = () => {
    if (!generatedTeamCode) return;
    navigator.clipboard.writeText(generatedTeamCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleTeamNameChange = (newName: string) => {
    setTeamName(newName);
    if (currentUser && generatedTeamCode && event && isTeamEvent) {
      StorageService.reserveOrRegisterTeam({
        teamCode: generatedTeamCode,
        teamName: newName,
        eventId: event.id,
        eventTitle: event.title,
        registrationId: '',
        leaderId: currentUser?.id,
        leaderName: leader.name || currentUser?.fullName || '',
        leaderRoll: leader.rollNumber || currentUser?.rollNumber || '',
        leaderEmail: leader.email || currentUser?.email || '',
        leaderPhone: leader.phone || currentUser?.phone || '',
        leaderCollege: leader.college || currentUser?.college || '',
        members: teammates,
        maxTeamSize: event.maxTeamSize || 4,
        minTeamSize: event.minTeamSize || 2
      }).catch(() => {});
    }
  };

  const updateLeaderAndSyncTeam = (updatedLeader: typeof leader) => {
    setLeader(updatedLeader);
    if (currentUser && generatedTeamCode && event && isTeamEvent) {
      StorageService.reserveOrRegisterTeam({
        teamCode: generatedTeamCode,
        teamName: teamName || (updatedLeader.name ? `${updatedLeader.name.split(' ')[0]}'s Squad` : 'Alpha Squad'),
        eventId: event.id,
        eventTitle: event.title,
        registrationId: '',
        leaderId: currentUser?.id,
        leaderName: updatedLeader.name || 'Team Leader',
        leaderRoll: updatedLeader.rollNumber || '',
        leaderEmail: updatedLeader.email || '',
        leaderPhone: updatedLeader.phone || '',
        leaderCollege: updatedLeader.college || 'Vardhaman College of Engineering',
        members: teammates,
        maxTeamSize: event.maxTeamSize || 4,
        minTeamSize: event.minTeamSize || 2
      }).catch(() => {});
    }
  };

  const handleAddTeammateSlot = () => {
    if (teammates.length < maxTeammates) {
      setTeammates([
        ...teammates,
        { name: '', email: '', phone: '', college: leader.college, rollNumber: '' }
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
    const memberToRemove = teammates[index];
    setTeammates(teammates.filter((_, i) => i !== index));
    if (generatedTeamCode && memberToRemove) {
      StorageService.removeTeamMember(generatedTeamCode, memberToRemove.rollNumber || memberToRemove.email);
    }
  };

  // Live Team Verification for Join Flow
  const handleVerifyJoinCode = async (codeToVerify?: string) => {
    const raw = (codeToVerify !== undefined ? codeToVerify : joinCodeInput).trim();
    if (!raw) {
      setVerifiedTeam(null);
      setJoinLookupError('Please enter a team code.');
      return;
    }

    setIsVerifyingCode(true);
    setJoinLookupError(null);
    setJoinConfirmation(null);

    try {
      const dashboard = await StorageService.fetchTeamDashboard(raw, event.id);
      if (!dashboard) {
        setVerifiedTeam(null);
        setJoinLookupError('Team not found or you do not have access to this team.');
      } else {
        setVerifiedTeam(dashboard);
        setJoinLookupError(null);
      }
    } catch {
      setJoinLookupError('Failed to lookup team code. Please check your connection.');
    } finally {
      setIsVerifyingCode(false);
    }
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
    if (!currentUser) {
      setErrorMessage('Please sign in with your college credentials to register for this event.');
      if (onOpenAuth) onOpenAuth('signin');
      return false;
    }
    const registrationBlockReason = getEventRegistrationBlockReason(
      event,
      isTeamEvent ? 1 : passQuantity
    );
    if (registrationBlockReason) {
      setErrorMessage(registrationBlockReason);
      return false;
    }
    if (!leader.name.trim() || !leader.email.trim() || !leader.phone.trim() || !leader.rollNumber.trim()) {
      setErrorMessage('Please fill in all participant / leader details.');
      return false;
    }
    // Duplicate check for leader
    const dup = StorageService.checkDuplicateRegistration(event.id, leader.rollNumber.trim());
    if (dup.isDuplicate && dup.existingReg) {
      setErrorMessage(`You (${leader.rollNumber.trim()}) are already registered for this event (Pass ID: ${dup.existingReg.id}). Duplicate registrations are not permitted.`);
      return false;
    }
    if (isTeamEvent && teamMode === 'create' && !teamName.trim()) {
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
      if (totalTeamSize > event.maxTeamSize) {
        setErrorMessage(`This event permits a maximum of ${event.maxTeamSize} team members.`);
        return false;
      }
    }

    const seenRolls = new Set<string>();
    seenRolls.add(leader.rollNumber.trim().toLowerCase());
    const liveTeamMembers = generatedTeamCode
      ? StorageService.getTeams().find(
          team => team.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === generatedTeamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
        )?.members || []
      : [];

    for (let i = 0; i < teammates.length; i++) {
      const tm = teammates[i];
      if (!tm.name.trim() || !tm.phone.trim() || !tm.rollNumber.trim()) {
        setErrorMessage(`Please complete all details for Teammate #${i + 1}.`);
        return false;
      }
      const cleanRoll = tm.rollNumber.trim().toLowerCase();
      if (seenRolls.has(cleanRoll)) {
        setErrorMessage(`Duplicate roll number detected: ${tm.rollNumber.trim()} is used more than once.`);
        return false;
      }
      seenRolls.add(cleanRoll);

      // Check if teammate is already registered
      const tmDup = StorageService.checkDuplicateRegistration(event.id, cleanRoll);
      const isAlreadyJoinedToThisTeam = liveTeamMembers.some(
        member => member.rollNumber.trim().toLowerCase() === cleanRoll
      );
      if (tmDup.isDuplicate && tmDup.existingReg && !isAlreadyJoinedToThisTeam) {
        setErrorMessage(`Teammate ${tm.name} (${tm.rollNumber}) is already registered for this event (Pass ID: ${tmDup.existingReg.id}).`);
        return false;
      }
    }
    setErrorMessage('');
    return true;
  };

  // Handle Join Team Submission
  const handleConfirmJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setErrorMessage('Authentication required. Please sign in to join this team.');
      if (onOpenAuth) onOpenAuth('signin');
      return;
    }

    if (!verifiedTeam) {
      setErrorMessage('Please enter and verify a valid team code first.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const memberData: Teammate = {
        name: leader.name.trim() || currentUser.fullName,
        email: leader.email.trim() || currentUser.email,
        phone: leader.phone.trim() || currentUser.phone,
        college: leader.college.trim() || currentUser.college,
        rollNumber: leader.rollNumber.trim() || currentUser.rollNumber
      };

      const joinRes = await StorageService.joinTeam(verifiedTeam.teamCode, memberData);

      if (!joinRes.success) {
        setErrorMessage(joinRes.error || 'Failed to join team. Please check the code.');
        setIsSubmitting(false);
        return;
      }

      // Fire celebratory confetti!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      const refreshedTeam = await StorageService.fetchTeamDashboard(verifiedTeam.teamCode, event.id).catch(() => null);
      setVerifiedTeam(refreshedTeam || joinRes.team || verifiedTeam);
      setJoinConfirmation(
        `Team membership reserved successfully. You are in ${verifiedTeam.teamName}; the Team Leader must complete checkout before your official registration and QR pass are issued.`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error joining team. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Team Leader or Solo Registration Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!currentUser) {
      setErrorMessage('Authentication required. Please sign in to finalize registration.');
      if (onOpenAuth) onOpenAuth('signin');
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
      if (isSupabaseConfigured() && !screenshotFile) {
        setErrorMessage('Select the payment screenshot file so it can be uploaded securely.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let finalScreenshotUrl = screenshotPreview || undefined;

      if (screenshotFile) {
        const uploadRes = await StorageService.uploadPaymentScreenshot(screenshotFile, leader.rollNumber);
        if (!uploadRes.success || !uploadRes.url) throw new Error(uploadRes.error || 'Unable to upload payment proof.');
        finalScreenshotUrl = uploadRes.url;
      }

      let finalTeammates = teammates;
      if (isTeamEvent && generatedTeamCode) {
        const normCode = generatedTeamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const liveTeam = await StorageService.fetchTeamDashboard(generatedTeamCode, event.id).catch(() =>
          StorageService.getTeams().find(
            t => t.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normCode
          ) || null
        );
        const alreadyJoinedRolls = new Set(
          (liveTeam?.members || [])
            .map(member => member.rollNumber.trim().toUpperCase())
            .filter(Boolean)
        );
        StorageService.getRegistrations()
          .filter(registration => registration.teamCode && registration.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normCode)
          .forEach(registration => {
            const registeredRoll = (registration.leaderRoll || registration.buyerRoll || '').trim().toUpperCase();
            if (registeredRoll && registeredRoll !== leader.rollNumber.trim().toUpperCase()) {
              alreadyJoinedRolls.add(registeredRoll);
            }
          });

        // Members who joined with the invite code already have their own
        // participant registration. Do not submit them again as new
        // teammates; the database attaches the live team roster to the
        // leader registration in the same transaction.
        finalTeammates = finalTeammates.filter(
          teammate => !alreadyJoinedRolls.has(teammate.rollNumber.trim().toUpperCase())
        );
      }

      if (isTeamEvent) {
        if (!teamName.trim() || !generatedTeamCode.trim()) {
          throw new Error('Create a valid team name and team code before submitting the registration.');
        }
        // The reservation is intentionally awaited here. The initial modal
        // effect reserves optimistically, but a fast submit must not race the
        // database registration RPC.
        await StorageService.reserveOrRegisterTeam({
          teamCode: generatedTeamCode.trim(),
          teamName: teamName.trim(),
          eventId: event.id,
          eventTitle: event.title,
          registrationId: '',
          leaderId: currentUser.id,
          leaderName: leader.name.trim(),
          leaderRoll: leader.rollNumber.trim().toUpperCase(),
          leaderEmail: leader.email.trim(),
          leaderPhone: leader.phone.trim(),
          leaderCollege: leader.college.trim(),
          members: finalTeammates,
          maxTeamSize: event.maxTeamSize,
          minTeamSize: event.minTeamSize
        });
      }

      const dateNow = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const batch: Array<Omit<Registration, 'id' | 'qrToken' | 'checkedIn'>> = [];

      for (let i = 0; i < passQuantity; i++) {
        const isLeaderPass = i === 0;
        const memberInfo = isLeaderPass ? null : additionalMembers[i - 1];

        batch.push({
          userId: currentUser?.id,
          buyerRoll: leader.rollNumber.trim(),
          eventId: event.id,
          eventTitle: `${event.title}${passQuantity > 1 ? ` (Pass #${i + 1}${memberInfo ? `: ${memberInfo.name.trim()}` : ''})` : ''}`,
          departmentCode: event.departmentCode,
          leaderName: isLeaderPass ? leader.name.trim() : memberInfo!.name.trim(),
          leaderEmail: leader.email.trim(),
          leaderPhone: leader.phone.trim(),
          leaderCollege: leader.college.trim(),
          leaderRoll: isLeaderPass ? leader.rollNumber.trim() : memberInfo!.rollNumber.trim().toUpperCase(),
          deptSection: memberInfo ? memberInfo.deptSection.trim().toUpperCase() : undefined,
          teammates: isTeamEvent ? finalTeammates : [],
          format: event.format,
          teamName: isTeamEvent ? teamName.trim() : undefined,
          teamCode: isTeamEvent ? generatedTeamCode.trim() : undefined,
          fee: event.fee,
          source: 'online',
          registrationDate: dateNow,
          paymentStatus: event.fee === 0 ? 'not_applicable' : 'verification_pending',
          transactionId: event.fee > 0 ? transactionId : undefined,
          paymentScreenshotUrl: finalScreenshotUrl
        });
      }

      const created = await StorageService.addMultipleRegistrations(batch);
      const finalReg = created[created.length - 1];

      // Fire festive celebration
      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 }
      });

      if (finalReg) onSuccess(finalReg);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" data-lenis-prevent onClick={onClose}>
      <div
        className="modal-content"
        data-lenis-prevent-wheel
        data-lenis-prevent-touch
        onClick={e => e.stopPropagation()}
        style={{
          padding: '28px',
          maxWidth: '720px',
          width: '95%',
          maxHeight: 'calc(100dvh - 40px)',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        }}
      >
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

        {/* TEAM MODE SELECTOR: Create vs Join (ONLY SHOWN FOR TEAM / DUO EVENTS) */}
        {isTeamEvent && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px',
              background: 'rgba(16, 26, 53, 0.7)',
              padding: '6px',
              borderRadius: '12px',
              border: '1px solid rgba(120, 149, 147, 0.25)'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setTeamMode('create');
                setStep(1);
                setErrorMessage('');
              }}
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                border: teamMode === 'create' ? '1px solid #789593' : '1px solid transparent',
                background: teamMode === 'create' ? 'linear-gradient(135deg, rgba(40, 59, 120, 0.8) 0%, rgba(62, 66, 100, 0.8) 100%)' : 'transparent',
                color: teamMode === 'create' ? '#FFFFFF' : '#A8B3C2',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                transition: 'all 0.2s ease'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: teamMode === 'create' ? '#BACEBB' : 'rgba(255, 255, 255, 0.08)',
                  color: teamMode === 'create' ? '#101A35' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Users size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Create a New Team
                </div>
                <div style={{ fontSize: '0.72rem', color: '#BACEBB', marginTop: '2px' }}>
                  Be Team Leader & generate invite code
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTeamMode('join');
                setErrorMessage('');
              }}
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                border: teamMode === 'join' ? '1px solid #789593' : '1px solid transparent',
                background: teamMode === 'join' ? 'linear-gradient(135deg, rgba(40, 59, 120, 0.8) 0%, rgba(62, 66, 100, 0.8) 100%)' : 'transparent',
                color: teamMode === 'join' ? '#FFFFFF' : '#A8B3C2',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                transition: 'all 0.2s ease'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: teamMode === 'join' ? '#BACEBB' : 'rgba(255, 255, 255, 0.08)',
                  color: teamMode === 'join' ? '#101A35' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Join Existing Team
                </div>
                <div style={{ fontSize: '0.72rem', color: '#BACEBB', marginTop: '2px' }}>
                  Have a team code? Join your squad
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Progress Tracker Steps (Only in Create Team & Solo Flow) */}
        {(!isTeamEvent || teamMode === 'create') && (
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
                  Squad Roster (Optional)
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
                  UPI Payment
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
        {/* CASE A: JOIN EXISTING TEAM FLOW (Only for team events in join mode) */}
        {/* ============================================================== */}
        {isTeamEvent && teamMode === 'join' && (
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
                    Joining as verified participant: <strong style={{ color: '#FFFFFF' }}>{currentUser.fullName}</strong> ({currentUser.rollNumber})
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
                  DELEGATE
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(251, 191, 36, 0.12)',
                  border: '1px solid rgba(251, 191, 36, 0.35)',
                  borderRadius: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} color="#FBBF24" />
                  <span style={{ fontSize: '0.8rem', color: '#FBBF24' }}>
                    Please sign in with your college credentials to join a team.
                  </span>
                </div>
                {onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => onOpenAuth('signin')}
                    style={{
                      background: 'rgba(251, 191, 36, 0.2)',
                      border: '1px solid #FBBF24',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      color: '#FBBF24',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Sign In
                  </button>
                )}
              </div>
            )}

            {/* Team Code Input Card */}
            <div
              style={{
                padding: '18px',
                background: 'rgba(16, 26, 53, 0.85)',
                border: '1px solid rgba(120, 149, 147, 0.35)',
                borderRadius: '12px'
              }}
            >
              <label style={{ fontSize: '0.82rem', color: '#DCE3E5', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                ENTER TEAM INVITE CODE *
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="e.g. FX-CSE-6443"
                  value={joinCodeInput}
                  onChange={e => {
                    const val = e.target.value.toUpperCase();
                    setJoinCodeInput(val);
                    const cleanLen = val.replace(/[^A-Za-z0-9]/g, '').length;
                    if (cleanLen >= 4) {
                      handleVerifyJoinCode(val);
                    } else {
                      setVerifiedTeam(null);
                      setJoinLookupError(null);
                    }
                  }}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    letterSpacing: '0.08em',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleVerifyJoinCode()}
                  className="btn-cyber-primary"
                  style={{ padding: '0 18px', whiteSpace: 'nowrap', fontSize: '0.84rem' }}
                  disabled={isVerifyingCode}
                >
                  <Search size={15} />
                  <span>{isVerifyingCode ? 'Checking...' : 'Verify Code'}</span>
                </button>
              </div>

              {joinLookupError && (
                <div style={{ color: '#f87171', fontSize: '0.76rem', marginTop: '8px', fontWeight: 600 }}>
                  ⚠️ {joinLookupError}
                </div>
              )}
              {joinConfirmation && (
                <div
                  style={{
                    color: '#A7F3D0',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(52, 211, 153, 0.45)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    marginTop: '8px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    lineHeight: 1.45
                  }}
                >
                  ✓ {joinConfirmation}
                </div>
              )}
            </div>

            {/* Live Verified Squad Card */}
            {verifiedTeam && (
              <div
                style={{
                  padding: '18px',
                  background: 'linear-gradient(135deg, rgba(20, 31, 62, 0.95) 0%, rgba(16, 26, 53, 0.95) 100%)',
                  border: isLeaderOfVerifiedTeam ? '1px solid #F59E0B' : '1px solid rgba(52, 211, 153, 0.45)',
                  borderRadius: '12px',
                  boxShadow: isLeaderOfVerifiedTeam ? '0 0 20px rgba(245, 158, 11, 0.15)' : '0 0 20px rgba(52, 211, 153, 0.15)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: isLeaderOfVerifiedTeam ? '#FBBF24' : '#34D399', fontWeight: 800, letterSpacing: '0.08em' }}>
                      {isLeaderOfVerifiedTeam ? 'YOUR SQUAD (LEADER FOUND)' : 'SQUAD VERIFIED & READY'}
                    </span>
                    <h4 style={{ fontSize: '1.25rem', color: '#FFFFFF', margin: '2px 0 0', fontWeight: 700 }}>
                      {verifiedTeam.teamName}
                    </h4>
                    <div style={{ fontSize: '0.76rem', color: '#A8B3C2', marginTop: '2px' }}>
                      Leader: <strong style={{ color: '#DCE3E5' }}>{verifiedTeam.leaderName}</strong>
                      {verifiedTeam.leaderRoll && ` (${verifiedTeam.leaderRoll})`}
                      {verifiedTeam.leaderCollege && ` • ${verifiedTeam.leaderCollege}`}
                    </div>
                  </div>

                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      color: '#BACEBB',
                      background: 'rgba(40, 59, 120, 0.5)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(120, 149, 147, 0.4)',
                      fontSize: '0.82rem'
                    }}
                  >
                    {verifiedTeam.teamCode}
                  </span>
                </div>

                {/* Leader Self-Join Notice */}
                {isLeaderOfVerifiedTeam && (
                  <div
                    style={{
                      margin: '10px 0',
                      padding: '12px 14px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FBBF24', fontWeight: 700, fontSize: '0.82rem' }}>
                      <Crown size={16} />
                      <span>You are the Team Leader of this squad!</span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#FEF3C7', lineHeight: 1.4 }}>
                      You created <strong>"{verifiedTeam.teamName}"</strong>. Share code <strong style={{ color: '#FBBF24', fontFamily: 'monospace' }}>{verifiedTeam.teamCode}</strong> with your squad teammates so they can join directly.
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setTeamMode('create');
                          setGeneratedTeamCode(verifiedTeam.teamCode);
                          setTeamName(verifiedTeam.teamName);
                        }}
                        className="btn-cyber-primary"
                        style={{ padding: '6px 14px', fontSize: '0.76rem' }}
                      >
                        <span>Manage Squad (Leader Desk)</span>
                        <ArrowRight size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(verifiedTeam.teamCode);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2500);
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '6px',
                          color: '#FFFFFF',
                          padding: '6px 12px',
                          fontSize: '0.76rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Copy size={12} />
                        <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Already Joined Notice */}
                {isAlreadyMemberOfVerifiedTeam && !isLeaderOfVerifiedTeam && (
                  <div
                    style={{
                      margin: '10px 0',
                      padding: '10px 14px',
                      background: 'rgba(52, 211, 153, 0.15)',
                      border: '1px solid #34D399',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#34D399',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>You are already a member of this squad. Your official registration and QR pass will be issued after the Team Leader completes checkout.</span>
                  </div>
                )}

                {/* Squad Members & Capacity Roster */}
                <div style={{ marginTop: '12px', borderTop: '1px solid rgba(220, 227, 229, 0.15)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.74rem', color: '#A8B3C2' }}>
                      Squad Roster ({verifiedTeamTotalCount} / {verifiedTeam.maxTeamSize} Members):
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: verifiedTeamTotalCount < verifiedTeam.maxTeamSize ? '#34D399' : '#f87171',
                        fontWeight: 700
                      }}
                    >
                      {verifiedTeamTotalCount < verifiedTeam.maxTeamSize
                        ? `${verifiedTeam.maxTeamSize - verifiedTeamTotalCount} Slot(s) Remaining`
                        : 'Squad is Full'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <div
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(40, 59, 120, 0.4)',
                        border: '1px solid rgba(120, 149, 147, 0.4)',
                        fontSize: '0.74rem',
                        color: '#FFFFFF'
                      }}
                    >
                      <div>👑 {verifiedTeam.leaderName} (Leader)</div>
                      <div style={{ fontSize: '0.64rem', color: verifiedTeam.leaderQrGenerated ? '#34D399' : '#FBBF24', marginTop: '2px' }}>
                        {verifiedLeaderStatus === 'membership_pending' ? 'MEMBERSHIP RESERVED' : verifiedLeaderStatus.toUpperCase().replace('_', ' ')}
                        {' • '}{verifiedTeam.leaderQrGenerated ? 'QR GENERATED' : 'QR NOT GENERATED'}
                      </div>
                    </div>

                    {verifiedTeam.members?.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(220, 227, 229, 0.15)',
                          fontSize: '0.74rem',
                          color: '#BACEBB'
                        }}
                      >
                        <div>👤 {m.name} ({m.rollNumber})</div>
                        <div style={{ fontSize: '0.64rem', color: m.qrGenerated ? '#34D399' : '#FBBF24', marginTop: '2px' }}>
                          {(m.registrationStatus || 'membership_pending').toUpperCase().replace('_', ' ')}
                          {' • '}{m.qrGenerated ? 'QR GENERATED' : 'QR NOT GENERATED'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Disclaimer depending on leader's payment */}
                {!isLeaderOfVerifiedTeam && (
                  ['membership_pending', 'payment_required'].includes(verifiedLeaderStatus) ? (
                    <div
                      style={{
                        marginTop: '14px',
                        padding: '10px 14px',
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        color: '#FEF3C7',
                        lineHeight: 1.4
                      }}
                    >
                      ⏳ <strong>Leader Checkout Pending:</strong> Team Leader {verifiedTeam.leaderName} has not finalized the team registration. No official member registrations or QR passes are issued yet.
                    </div>
                  ) : verifiedLeaderStatus === 'verification_pending' ? (
                    <div
                      style={{
                        marginTop: '14px',
                        padding: '10px 14px',
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        color: '#FEF3C7',
                        lineHeight: 1.4
                      }}
                    >
                      ⏳ <strong>Payment Under Review:</strong> The team checkout was submitted. QR passes are generated but remain inactive until payment is verified.
                    </div>
                  ) : verifiedLeaderStatus === 'rejected' ? (
                    <div
                      style={{
                        marginTop: '14px',
                        padding: '10px 14px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        color: '#FCA5A5',
                        lineHeight: 1.4
                      }}
                    >
                      ⚠ <strong>Payment Rejected:</strong> The Team Leader must correct the payment and resubmit checkout before member passes become active.
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: '14px',
                        padding: '8px 12px',
                        background: 'rgba(52, 211, 153, 0.08)',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        color: '#a7f3d0'
                      }}
                    >
                      ✓ <strong>Team Registration Confirmed:</strong> The Team Leader payment is verified. Your official participant registration and QR pass are active.
                    </div>
                  )
                )}
              </div>
            )}

            {/* Joining Participant Details Review */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.76rem', color: '#A8B3C2', display: 'block', marginBottom: '4px' }}>
                  YOUR FULL NAME *
                </label>
                <input
                  type="text"
                  className="cyber-input"
                  value={leader.name}
                  onChange={e => setLeader({ ...leader, name: e.target.value })}
                  placeholder="e.g. Priyanshu Roy"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', color: '#A8B3C2', display: 'block', marginBottom: '4px' }}>
                  YOUR ROLL / STUDENT ID *
                </label>
                <input
                  type="text"
                  className="cyber-input"
                  value={leader.rollNumber}
                  onChange={e => setLeader({ ...leader, rollNumber: e.target.value })}
                  placeholder="e.g. 23VCEIT201"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.76rem', color: '#A8B3C2', display: 'block', marginBottom: '4px' }}>
                  COLLEGE EMAIL *
                </label>
                <input
                  type="email"
                  className="cyber-input"
                  value={leader.email}
                  onChange={e => setLeader({ ...leader, email: e.target.value })}
                  placeholder="student@college.edu"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', color: '#A8B3C2', display: 'block', marginBottom: '4px' }}>
                  PHONE (WHATSAPP) *
                </label>
                <input
                  type="tel"
                  className="cyber-input"
                  value={leader.phone}
                  onChange={e => setLeader({ ...leader, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              {isLeaderOfVerifiedTeam ? (
                <button
                  type="button"
                  onClick={() => {
                    setTeamMode('create');
                    if (verifiedTeam) {
                      setGeneratedTeamCode(verifiedTeam.teamCode);
                      setTeamName(verifiedTeam.teamName);
                    }
                  }}
                  className="btn-cyber-primary"
                  style={{ padding: '10px 24px', fontSize: '0.88rem' }}
                >
                  <Crown size={16} />
                  <span>Switch to Squad Leader View</span>
                </button>
              ) : isAlreadyMemberOfVerifiedTeam ? (
                <div
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    background: 'rgba(52, 211, 153, 0.15)',
                    border: '1px solid #34D399',
                    color: '#34D399',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Already Joined (Pass Active)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmJoinTeam}
                  disabled={!verifiedTeam || isSubmitting || (verifiedTeamTotalCount >= verifiedTeam.maxTeamSize)}
                  className="btn-cyber-primary"
                  style={{
                    padding: '10px 24px',
                    fontSize: '0.88rem',
                    opacity: (!verifiedTeam || (verifiedTeamTotalCount >= verifiedTeam.maxTeamSize)) ? 0.5 : 1
                  }}
                >
                  <span>{isSubmitting ? 'Joining Squad...' : 'Confirm & Join Team'}</span>
                  <CheckCircle2 size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* CASE B: CREATE TEAM / SOLO PARTICIPANT (STEP 1)                */}
        {/* ============================================================== */}
        {(!isTeamEvent || teamMode === 'create') && step === 1 && (
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
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(251, 191, 36, 0.12)',
                  border: '1px solid rgba(251, 191, 36, 0.35)',
                  borderRadius: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} color="#FBBF24" />
                  <span style={{ fontSize: '0.8rem', color: '#FBBF24' }}>
                    Please sign in with your college credentials to continue.
                  </span>
                </div>
                {onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => onOpenAuth('signin')}
                    style={{
                      background: 'rgba(251, 191, 36, 0.2)',
                      border: '1px solid #FBBF24',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      color: '#FBBF24',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Sign In
                  </button>
                )}
              </div>
            )}

            {/* TEAM CREATION CARD: Generated Code & Team Name */}
            {isTeamEvent && (
              <div
                style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, rgba(20, 31, 62, 0.95) 0%, rgba(16, 26, 53, 0.95) 100%)',
                  border: '1px solid rgba(120, 149, 147, 0.35)',
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#BACEBB', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                      SQUAD / TEAM NAME *
                    </label>
                    <input
                      type="text"
                      className="cyber-input"
                      placeholder="e.g. Cyber Titans"
                      value={teamName}
                      onChange={e => handleTeamNameChange(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#A8B3C2', display: 'block', marginBottom: '6px' }}>
                      GENERATED TEAM INVITE CODE
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(16, 26, 53, 0.9)',
                        border: '1px solid rgba(120, 149, 147, 0.4)',
                        borderRadius: '8px'
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.98rem',
                          fontWeight: 800,
                          color: '#BACEBB',
                          letterSpacing: '0.08em'
                        }}
                      >
                        {generatedTeamCode}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        style={{
                          background: copiedCode ? 'rgba(52, 211, 153, 0.2)' : 'rgba(40, 59, 120, 0.4)',
                          border: `1px solid ${copiedCode ? '#34D399' : 'rgba(120, 149, 147, 0.4)'}`,
                          borderRadius: '6px',
                          color: copiedCode ? '#34D399' : '#DCE3E5',
                          padding: '4px 8px',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(220, 227, 229, 0.1)',
                    fontSize: '0.72rem',
                    color: '#A8B3C2'
                  }}
                >
                  <span>
                    Teammates can use this code to join your squad directly via their portal.
                  </span>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `Hey squad! Join my team "${teamName || 'Festronix Team'}" for ${event.title} at Festronix 2026! Use Team Code: ${generatedTeamCode}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#25D366',
                      textDecoration: 'none',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Share2 size={12} />
                    <span>Invite on WhatsApp</span>
                  </a>
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
                onChange={e => updateLeaderAndSyncTeam({ ...leader, name: e.target.value })}
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
                  onChange={e => updateLeaderAndSyncTeam({ ...leader, email: e.target.value })}
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
                  onChange={e => updateLeaderAndSyncTeam({ ...leader, phone: e.target.value })}
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
                  onChange={e => updateLeaderAndSyncTeam({ ...leader, college: e.target.value })}
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
                  onChange={e => updateLeaderAndSyncTeam({ ...leader, rollNumber: e.target.value })}
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
        {/* STEP 2: Optional Teammates Slot Allocation (For Team Events)   */}
        {/* ============================================================== */}
        {isTeamEvent && teamMode === 'create' && step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Live Teammate Joined Banner */}
            {newTeammateAlert && (
              <div
                style={{
                  padding: '12px 14px',
                  background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
                  border: '1px solid #34D399',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 20px rgba(52, 211, 153, 0.2)'
                }}
              >
                <Sparkles size={16} color="#34D399" />
                <span>{newTeammateAlert}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.92rem', color: '#FFFFFF', fontWeight: 700 }}>
                  Add Teammates Directly (Optional)
                </div>
                <div style={{ fontSize: '0.74rem', color: '#A8B3C2' }}>
                  {teammates.length + 1} / {event.maxTeamSize} Squad Members
                </div>
              </div>

              {teammates.length < maxTeammates && (
                <button
                  type="button"
                  onClick={handleAddTeammateSlot}
                  className="btn-cyber-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  + Add Member Now
                </button>
              )}
            </div>

            {/* Smart Invitation Notice */}
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
              💡 <strong>Industry Standard Flexibility:</strong> You don't need all teammate details right now! You can register your team first and share your team code (<strong style={{ color: '#BACEBB' }}>{generatedTeamCode}</strong>) with teammates so they can join later.
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
                  No members added manually yet. Teammates can join using code <strong>{generatedTeamCode}</strong>.
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
                        value={tm.email || ''}
                        onChange={e => handleUpdateTeammate(idx, 'email', e.target.value)}
                      />
                      <input
                        type="tel"
                        className="cyber-input"
                        placeholder="Phone Number *"
                        value={tm.phone || ''}
                        onChange={e => handleUpdateTeammate(idx, 'phone', e.target.value)}
                      />
                    </div>
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
                      <strong>{maxTeammates - teammates.length} more slot(s) available.</strong> Teammates can join using code <strong style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>{generatedTeamCode}</strong>.
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
        {/* STEP 3 (or Step 2 for Solo): UPI Payment & Verification Proof */}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: '#34D399', fontWeight: 800, letterSpacing: '0.06em' }}>
                    SQUAD ROSTER READY FOR PAYMENT
                  </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#BACEBB', background: 'rgba(40, 59, 120, 0.4)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.74rem' }}>
                    {generatedTeamCode}
                  </span>
                </div>
                <div style={{ fontSize: '0.92rem', color: '#FFFFFF', fontWeight: 700, marginTop: '4px' }}>
                  {teamName || 'Your Squad'} • Leader: {leader.name} ({leader.rollNumber})
                </div>
                <div style={{ fontSize: '0.76rem', color: '#DCE3E5', marginTop: '4px' }}>
                  Teammates ({teammates.length}):{' '}
                  {teammates.length > 0
                    ? teammates.map(t => `${t.name || 'Member'} (${t.rollNumber || 'ID'})`).join(', ')
                    : 'None added yet (teammates can also join later using code)'}
                </div>
              </div>
            )}
            {/* Payment Box */}
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
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=festronix2026@vce%26pn=Festronix%20VCE%26am=${event.fee * passQuantity}%26cu=INR`}
                  alt="UPI Payment QR"
                  style={{ width: '135px', height: '135px', display: 'block', margin: '0 auto' }}
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
                <span>{isSubmitting ? 'Registering...' : (isTeamEvent ? 'Submit Proof & Register Team' : 'Submit Proof & Register')}</span>
                <CheckCircle2 size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
