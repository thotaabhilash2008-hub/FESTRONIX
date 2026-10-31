import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ExternalLink, 
  MapPin, 
  Calendar, 
  Sparkles, 
  Download, 
  Mail, 
  PhoneCall, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Ticket, 
  Layers,
  Users,
  Compass,
  Edit3,
  Trash2,
  Plus,
  Lock,
  Unlock,
  RotateCcw,
  Check,
  X,
  Key
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SponsorProfile } from './partners/partnerData';
import { PartnerStorageService } from '../services/partnerStorageService';
import { AdminAuthService, AdminUser, isSuperAdminRole } from '../services/adminAuthService';
import { GlitterBackground } from './GlitterBackground';

interface PublicSponsorsPageProps {
  onBackToHome: () => void;
  onExploreEvents?: () => void;
  onRegisterNow?: () => void;
}

export const PublicSponsorsPage: React.FC<PublicSponsorsPageProps> = ({ 
  onBackToHome, 
  onExploreEvents, 
  onRegisterNow 
}) => {
  const [sponsors, setSponsors] = useState<SponsorProfile[]>(() => PartnerStorageService.getSponsors());
  const [activeTier, setActiveTier] = useState<string>('all');

  // Super Admin Authentication & Inline Edit Mode
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => AdminAuthService.getCurrentAdmin());
  const isSuperAdmin = adminUser ? isSuperAdminRole(adminUser.role) : false;
  const [isEditModeActive, setIsEditModeActive] = useState<boolean>(() => isSuperAdmin);

  // Quick Unlock Modal (if not logged in as Super Admin)
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockUsername, setUnlockUsername] = useState('');
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // Add / Edit Sponsor Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<SponsorProfile | null>(null);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [tagline, setTagline] = useState('');
  const [tier, setTier] = useState<SponsorProfile['tier']>('Official Event Partner');
  const [tierBadgeColor, setTierBadgeColor] = useState('#38BDF8');
  const [logo, setLogo] = useState('/connect_club_transparent.png');
  const [website, setWebsite] = useState('https://');
  const [stallNumber, setStallNumber] = useState('Stall #A-01');
  const [stallLocation, setStallLocation] = useState('Central Block Atrium Innovation Hub');
  const [stageKeynoteTime, setStageKeynoteTime] = useState('Day 1 • 11:30 AM');
  const [estimatedReach, setEstimatedReach] = useState('35,000+ Students');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    PartnerStorageService.initRealtime();
    void PartnerStorageService.fetchSponsors()
      .then(setSponsors)
      .catch(error => console.warn('Public sponsor sync warning:', error));

    const handleUpdate = (e: any) => {
      if (Array.isArray(e.detail)) {
        setSponsors(e.detail);
      }
    };
    window.addEventListener('festronix:sponsors-updated', handleUpdate);
    return () => window.removeEventListener('festronix:sponsors-updated', handleUpdate);
  }, []);

  const refreshList = () => {
    setSponsors(PartnerStorageService.getSponsors());
  };

  const filteredSponsors = sponsors.filter(s => {
    if (activeTier === 'all') return true;
    return s.tier.toLowerCase().includes(activeTier.toLowerCase());
  });

  const officialSponsors = sponsors.filter(sponsor =>
    ['Title Sponsor', 'Platinum Partner', 'Gold Sponsor', 'Official Event Partner', 'Official Tech Partner']
      .includes(sponsor.tier)
  ).slice(0, 4);

  // Handle Quick Super Admin Login
  const handleSuperAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');
    const res = await AdminAuthService.loginCentral(unlockUsername.trim(), unlockPassword.trim());
    if (res.success && res.user && isSuperAdminRole(res.user.role)) {
      setAdminUser(res.user);
      setIsEditModeActive(true);
      setIsUnlockModalOpen(false);
      confetti({ particleCount: 80, spread: 60 });
    } else {
      setUnlockError(res.error || 'Invalid Super Admin credentials. Only Dean SAC, Connect Club, or Vencorpia admin accounts are authorized.');
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingSponsor(null);
    setCompanyName('');
    setTagline('');
    setTier('Official Event Partner');
    setTierBadgeColor('#38BDF8');
    setLogo('/connect_club_transparent.png');
    setWebsite('https://');
    setStallNumber('Stall #A-01');
    setStallLocation('Central Block Atrium • Ground Level');
    setStageKeynoteTime('Day 1 • 11:30 AM');
    setEstimatedReach('35,000+ Students');
    setIsEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (sponsor: SponsorProfile) => {
    setEditingSponsor(sponsor);
    setCompanyName(sponsor.companyName);
    setTagline(sponsor.tagline);
    setTier(sponsor.tier);
    setTierBadgeColor(sponsor.tierBadgeColor);
    setLogo(sponsor.logo);
    setWebsite(sponsor.website);
    setStallNumber(sponsor.stallNumber);
    setStallLocation(sponsor.stallLocation);
    setStageKeynoteTime(sponsor.metrics.stageKeynoteTime);
    setEstimatedReach(sponsor.metrics.estimatedReach);
    setIsEditModalOpen(true);
  };

  // Save Sponsor (Create or Update)
  const handleSaveSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      alert('Please enter a partner or company name.');
      return;
    }

    if (editingSponsor) {
      PartnerStorageService.updateSponsor(editingSponsor.id, {
        companyName: companyName.trim(),
        tagline: tagline.trim(),
        tier,
        tierBadgeColor,
        logo: logo.trim(),
        website: website.trim(),
        stallNumber: stallNumber.trim(),
        stallLocation: stallLocation.trim(),
        metrics: {
          ...editingSponsor.metrics,
          stageKeynoteTime,
          estimatedReach
        }
      });
      confetti({ particleCount: 70, spread: 50 });
    } else {
      const newSponsor: SponsorProfile = {
        id: `sp_${Date.now()}`,
        companyName: companyName.trim(),
        tagline: tagline.trim() || 'Official Corporate Partner & Sponsor',
        tier,
        tierBadgeColor,
        logo: logo.trim() || '/vce_logo.png',
        website: website.trim() || 'https://vardhaman.org',
        pocName: 'Corporate Relations Lead',
        pocRole: 'Partnership Lead',
        pocContact: '+91 98480 99112',
        pocEmail: 'sponsorship.festronix@vardhaman.org',
        sacLeadName: 'Prof. R. Srinivas (Dean SAC)',
        sacLeadContact: '+91 98480 99112',
        stallLocation: stallLocation.trim() || 'Central Block Innovation Zone',
        stallNumber: stallNumber.trim() || 'Stall #S-01',
        mouStatus: 'Signed & Executed',
        invoiceStatus: 'Paid & Cleared',
        metrics: {
          stageKeynoteTime,
          brandedBannersAllocated: 10,
          vipLoungePasses: 15,
          estimatedReach,
          impressionsCount: '1M+ Reach'
        },
        deliverables: [
          {
            id: `del_${Date.now()}_1`,
            title: 'Top Floating Navbar & Mobile Menu Branding',
            category: 'digital',
            status: 'completed',
            description: 'Brand emblem featured on festival navigation across all devices.',
            dueDate: 'Immediate'
          },
          {
            id: `del_${Date.now()}_2`,
            title: 'Main Auditorium Stage Keynote',
            category: 'stage',
            status: 'scheduled',
            description: 'Keynote and brand video showcase during fest ceremonies.',
            dueDate: 'Oct 28, 2026'
          }
        ]
      };
      PartnerStorageService.addSponsor(newSponsor);
      confetti({ particleCount: 90, spread: 60 });
    }

    setIsEditModalOpen(false);
    refreshList();
  };

  // Delete Sponsor
  const handleDeleteSponsor = (sponsorId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete sponsor "${name}" from the public website?`)) {
      PartnerStorageService.deleteSponsor(sponsorId);
      refreshList();
    }
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    if (window.confirm('Reset all sponsors and partners back to defaults (Connect Club, Vencorpia, CyberCore)?')) {
      PartnerStorageService.resetToDefaults();
      refreshList();
      confetti({ particleCount: 50, spread: 45 });
    }
  };

  const handleDownloadBrochure = () => {
    const blob = new Blob([
      `FESTRONIX 2026 • OFFICIAL CORPORATE SPONSORSHIP BROCHURE\nVardhaman College of Engineering, Hyderabad\nNational Level Technical Fest (Oct 28-29, 2026)\n\nKey Arenas: Autonomous Robotics, AI Hackathon, Drone Racing, 30+ Flagship Tracks.\nExpected Footfall: 35,000+ Students across 45+ Engineering Colleges.\nPrize Pool: ₹5,00,000+\n\nContact Central Desk:\nPhone: +91 98480 99112\nEmail: sponsorship.festronix@vardhaman.org\nWebsite: https://festronix-fawn.vercel.app/`
    ], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Festronix_2026_Sponsorship_Brochure.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', background: '#080C16', color: '#F3F0EA', overflowX: 'hidden' }}>
      
      {/* Background Starfield & Subtle Grid */}
      <GlitterBackground />
      <div className="glitter-stardust-layer" />
      <div className="cyber-grid-overlay" />

      {/* Top Floating Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(8, 12, 22, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(199, 203, 212, 0.14)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBackToHome}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(199, 203, 212, 0.2)',
              borderRadius: '9999px',
              padding: '8px 16px',
              color: '#F3F0EA',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(199, 203, 212, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to Home</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="/vce_logo.png" 
              alt="Vardhaman Logo" 
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }} 
            />
            <div>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                FESTRONIX '26
              </span>
              <div style={{ fontSize: '0.62rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Vardhaman College of Engineering
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Buttons: Super Admin Toggle & Explore */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Super Admin Edit Mode Switch */}
          {isEditModeActive ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: 'rgba(56, 189, 248, 0.15)', 
                  border: '1px solid rgba(56, 189, 248, 0.4)', 
                  padding: '6px 12px', 
                  borderRadius: '9999px',
                  color: '#38BDF8',
                  fontSize: '0.78rem',
                  fontWeight: 800
                }}
              >
                <Unlock size={13} color="#38BDF8" />
                <span>Super Admin Edit Active</span>
              </div>

              <button
                onClick={() => setIsEditModeActive(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '9999px',
                  padding: '6px 12px',
                  color: '#94A3B8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Exit Edit Mode
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (isSuperAdmin) {
                  setIsEditModeActive(true);
                } else {
                  setIsUnlockModalOpen(true);
                }
              }}
              style={{
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '9999px',
                padding: '8px 14px',
                color: '#38BDF8',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.6)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
              }}
              title="Unlock live editing of sponsors on this page"
            >
              <Lock size={13} />
              <span>Super Admin Edit</span>
            </button>
          )}

          {/* Action Button: Explore Arenas */}
          {onExploreEvents && (
            <button
              onClick={onExploreEvents}
              style={{
                background: 'linear-gradient(135deg, #243C74 0%, #2E4E8C 45%, #4E7C77 100%)',
                border: '1px solid rgba(220, 227, 232, 0.35)',
                borderRadius: '9999px',
                padding: '8px 18px',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 16px rgba(46, 78, 140, 0.5)'
              }}
            >
              <Compass size={14} />
              <span>Explore 30+ Arenas</span>
            </button>
          )}

        </div>
      </header>

      {/* Super Admin Control Strip (Visible when Edit Mode is Active) */}
      {isEditModeActive && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(8, 47, 73, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.35)',
            padding: '12px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            position: 'relative',
            zIndex: 35
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38BDF8' }}>
              👑 Super Admin Governance ({adminUser?.fullName || 'Dean SAC / Super Admin'})
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              • Click "+ Add Sponsor" or click "Edit" on any partner card below to update details live on the main website.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleResetDefaults}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '6px 12px',
                color: '#C7CBD4',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RotateCcw size={12} />
              <span>Reset Defaults</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                color: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)'
              }}
            >
              <Plus size={14} />
              <span>+ Add New Sponsor / Partner</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '50px 24px 20px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <div 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '9999px',
            padding: '6px 16px',
            fontSize: '0.75rem',
            color: '#38BDF8',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '20px'
          }}
        >
          <Sparkles size={14} />
          <span>FESTRONIX 2026 // OFFICIAL SPONSORS & STRATEGIC PARTNERS</span>
        </div>

        <h1 
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 'clamp(2rem, 5vw, 3.4rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '0.02em',
            margin: '0 0 18px 0',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #DCE3E8 40%, #BACEBB 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          POWERING NATIONAL INNOVATION
        </h1>

        <p 
          style={{
            maxWidth: '780px',
            margin: '0 auto 36px',
            color: '#94A3B8',
            fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
            lineHeight: 1.6
          }}
        >
          Meet the industry leaders, technology innovators, and community partners collaborating with Vardhaman College of Engineering to deliver South India's premier collegiate tech battleground.
        </p>

        {/* Tier Filter Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '40px' }}>
          {[
            { id: 'all', label: 'All Partners' },
            { id: 'partner', label: 'Event & Tech Partners' },
            { id: 'gold', label: 'Gold Sponsors' },
            { id: 'title', label: 'Title Sponsors' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTier(tab.id)}
              style={{
                padding: '8px 18px',
                borderRadius: '9999px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid',
                background: activeTier === tab.id ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(37, 99, 235, 0.3) 100%)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: activeTier === tab.id ? 'rgba(56, 189, 248, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                color: activeTier === tab.id ? '#FFFFFF' : '#94A3B8',
                transition: 'all 0.2s ease',
                boxShadow: activeTier === tab.id ? '0 0 16px rgba(56, 189, 248, 0.2)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Official Sponsors Spotlight */}
      {officialSponsors.length > 0 && (
        <section
          aria-labelledby="official-sponsors-heading"
          style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 42px', position: 'relative', zIndex: 10 }}
        >
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '26px',
              padding: '30px',
              background: 'linear-gradient(115deg, rgba(12, 23, 48, 0.98) 0%, rgba(9, 17, 32, 0.98) 55%, rgba(16, 37, 56, 0.96) 100%)',
              border: '1px solid rgba(125, 211, 252, 0.28)',
              boxShadow: '0 24px 70px rgba(0, 0, 0, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ position: 'absolute', inset: '-80px auto auto 58%', width: '280px', height: '180px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.14)', filter: 'blur(48px)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '18px', flexWrap: 'wrap', position: 'relative' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#FBBF24', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  <ShieldCheck size={15} />
                  Official ecosystem partners
                </div>
                <h2 id="official-sponsors-heading" style={{ margin: 0, color: '#FFFFFF', fontSize: 'clamp(1.45rem, 3vw, 2.15rem)', fontWeight: 900, letterSpacing: '-0.02em' }}>
                  The brands powering the arena
                </h2>
                <p style={{ margin: '9px 0 0', maxWidth: '650px', color: '#A7B7CD', fontSize: '0.92rem', lineHeight: 1.55 }}>
                  Meet the official sponsors and technology partners helping students turn ambitious ideas into working prototypes, products, and careers.
                </p>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 13px', borderRadius: '999px', color: '#7DD3FC', background: 'rgba(56, 189, 248, 0.09)', border: '1px solid rgba(125, 211, 252, 0.22)', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34D399', boxShadow: '0 0 12px #34D399' }} />
                Verified partner network
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginTop: '26px', position: 'relative' }}>
              {officialSponsors.map((sponsor, index) => (
                <a
                  key={`official-${sponsor.id}`}
                  href={sponsor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    minHeight: '142px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '18px',
                    borderRadius: '17px',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    background: index === 0 ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.045))' : 'rgba(255, 255, 255, 0.055)',
                    border: `1px solid ${sponsor.tierBadgeColor}45`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 12px 28px ${sponsor.tierBadgeColor}12`,
                    transition: 'transform 180ms ease, border-color 180ms ease, background 180ms ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = sponsor.tierBadgeColor;
                    e.currentTarget.style.background = `${sponsor.tierBadgeColor}18`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = `${sponsor.tierBadgeColor}45`;
                    e.currentTarget.style.background = index === 0 ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.045))' : 'rgba(255, 255, 255, 0.055)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ width: '112px', height: '48px', display: 'grid', placeItems: 'center', padding: '6px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.92)' }}>
                      <img src={sponsor.logo} alt={`${sponsor.companyName} logo`} style={{ maxWidth: '94px', maxHeight: '34px', objectFit: 'contain' }} />
                    </div>
                    <ExternalLink size={15} color={sponsor.tierBadgeColor} />
                  </div>
                  <div>
                    <div style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 850 }}>{sponsor.companyName}</div>
                    <div style={{ marginTop: '4px', color: sponsor.tierBadgeColor, fontSize: '0.66rem', fontWeight: 850, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{sponsor.tier}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Sponsors Showcase Grid */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 60px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px' }}>
          {filteredSponsors.map(sponsor => (
            <div
              key={sponsor.id}
              style={{
                background: 'linear-gradient(145deg, rgba(17, 24, 39, 0.9) 0%, rgba(11, 16, 28, 0.95) 100%)',
                border: '1px solid rgba(199, 203, 212, 0.16)',
                borderRadius: '20px',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = sponsor.tierBadgeColor;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px ${sponsor.tierBadgeColor}25`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(199, 203, 212, 0.16)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)';
              }}
            >
              {/* Subtle Ambient Color Glow inside Card */}
              <div
                style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '-40px',
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: sponsor.tierBadgeColor,
                  opacity: 0.15,
                  filter: 'blur(40px)',
                  pointerEvents: 'none'
                }}
              />

              {/* Inline Super Admin Controls (Visible when Edit Mode Active) */}
              {isEditModeActive && (
                <div 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: 'rgba(8, 47, 73, 0.6)', 
                    border: '1px solid rgba(56, 189, 248, 0.4)', 
                    borderRadius: '8px', 
                    padding: '6px 10px', 
                    marginBottom: '16px' 
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 800 }}>
                    ADMIN CONTROLS
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenEditModal(sponsor)}
                      style={{
                        background: 'rgba(56, 189, 248, 0.2)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#FFFFFF',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Edit3 size={11} />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteSponsor(sponsor.id, sponsor.companyName)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#F87171',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={11} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                {/* Logo & Tier Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div
                    style={{
                      height: '64px',
                      padding: '8px 14px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img 
                      src={sponsor.logo} 
                      alt={sponsor.companyName} 
                      style={{ maxHeight: '44px', maxWidth: '140px', width: 'auto', objectFit: 'contain' }} 
                    />
                  </div>

                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      background: `${sponsor.tierBadgeColor}15`,
                      color: sponsor.tierBadgeColor,
                      border: `1px solid ${sponsor.tierBadgeColor}40`,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em'
                    }}
                  >
                    {sponsor.tier}
                  </span>
                </div>

                {/* Company Name & Tagline */}
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px 0' }}>
                  {sponsor.companyName}
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                  {sponsor.tagline}
                </p>

                {/* Event Highlights & Presence */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#C7CBD4' }}>
                    <MapPin size={16} color={sponsor.tierBadgeColor} style={{ flexShrink: 0 }} />
                    <span>Campus Presence: <strong style={{ color: '#FFFFFF' }}>{sponsor.stallNumber}</strong> ({sponsor.stallLocation})</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#C7CBD4' }}>
                    <Calendar size={16} color="#FBBF24" style={{ flexShrink: 0 }} />
                    <span>Keynote / Workshop: <strong style={{ color: '#FFFFFF' }}>{sponsor.metrics.stageKeynoteTime}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#C7CBD4' }}>
                    <Users size={16} color="#34D399" style={{ flexShrink: 0 }} />
                    <span>Audience Reach: <strong style={{ color: '#34D399' }}>{sponsor.metrics.estimatedReach}</strong></span>
                  </div>
                </div>

                {/* Deliverables / Collaboration Highlights */}
                {sponsor.deliverables && sponsor.deliverables.length > 0 && (
                  <div style={{ marginBottom: '22px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '8px' }}>
                      Key Collaboration Focus
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {sponsor.deliverables.slice(0, 3).map(del => (
                        <span
                          key={del.id}
                          style={{
                            fontSize: '0.72rem',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#C7CBD4'
                          }}
                        >
                          ✓ {del.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Link to Official Website */}
              <div style={{ borderTop: '1px solid rgba(199, 203, 212, 0.1)', paddingTop: '16px' }}>
                <a
                  href={sponsor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `${sponsor.tierBadgeColor}20`;
                    e.currentTarget.style.borderColor = sponsor.tierBadgeColor;
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  }}
                >
                  <span>Visit {sponsor.companyName}</span>
                  <ExternalLink size={14} />
                </a>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* Campus Stalls & Interactive Booths Banner */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 60px', position: 'relative', zIndex: 10 }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(20, 29, 50, 0.8) 0%, rgba(12, 18, 32, 0.95) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '20px',
            padding: '36px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                ON-GROUND CAMPUS EXPO
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px 0' }}>
              Visit Partner Tech Stalls at Festronix 2026
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.88rem', margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
              All registered competitors and attendees can visit the Central Block Atrium & Innovation Arena booths to experience live product demos, interactive developer challenges, recruitment discussions, and collect exclusive tech swags.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {onRegisterNow && (
              <button
                onClick={onRegisterNow}
                style={{
                  background: 'linear-gradient(135deg, #243C74 0%, #2E4E8C 45%, #4E7C77 100%)',
                  border: '1px solid rgba(220, 227, 232, 0.35)',
                  borderRadius: '9999px',
                  padding: '12px 24px',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(46, 78, 140, 0.65)'
                }}
              >
                <Ticket size={16} />
                <span>Get Event Pass</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Become a Sponsor / Strategic Collaboration CTA */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 80px', position: 'relative', zIndex: 10 }}>
        <div
          style={{
            background: 'rgba(15, 20, 32, 0.85)',
            border: '1px solid rgba(199, 203, 212, 0.16)',
            borderRadius: '20px',
            padding: '36px 30px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px',
            alignItems: 'center'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 10px 0' }}>
              Interested in Sponsoring Festronix 2026?
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              Connect your brand with 35,000+ top engineering minds, robotics enthusiasts, and software developers across India. Custom sponsorship packages and tier deliverables are managed directly by the Student Affairs Council (SAC).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', color: '#C7CBD4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PhoneCall size={14} color="#38BDF8" />
                <span>Corporate Desk: <strong>+91 98480 99112</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} color="#34D399" />
                <span>Email: <strong>sponsorship.festronix@vardhaman.org</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '14px' }}>
            <button
              onClick={handleDownloadBrochure}
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 22px',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)'
              }}
            >
              <Download size={16} />
              <span>Download Sponsorship Brochure</span>
            </button>

            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Includes tier deliverables, stall allocation layouts, and reach telemetry.
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================
          QUICK SUPER ADMIN UNLOCK MODAL
          ======================================================== */}
      {isUnlockModalOpen && (
        <div className="modal-backdrop">
          <div 
            className="modal-content"
            style={{ 
              maxWidth: '460px', 
              background: '#0B132B', 
              border: '1px solid rgba(56, 189, 248, 0.45)',
              padding: '24px' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#38BDF8" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Super Admin Live Verification
                </h3>
              </div>
              <button 
                onClick={() => setIsUnlockModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#94A3B8', marginBottom: '16px', lineHeight: 1.5 }}>
              Authenticate with your Super Admin credentials to edit, create, or delete sponsors directly on this public page.
            </p>

            {/* Manual Form */}
            <form onSubmit={handleSuperAdminLogin} style={{ borderTop: '1px solid rgba(199, 203, 212, 0.1)', paddingTop: '14px' }}>
              {unlockError && (
                <div style={{ color: '#F87171', fontSize: '0.78rem', marginBottom: '10px' }}>
                  {unlockError}
                </div>
              )}

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '0.75rem', color: '#C7CBD4', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Username:
                </label>
                <input
                  type="text"
                  required
                  value={unlockUsername}
                  onChange={e => setUnlockUsername(e.target.value)}
                  className="cyber-input"
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.75rem', color: '#C7CBD4', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Password:
                </label>
                <input
                  type="password"
                  required
                  value={unlockPassword}
                  onChange={e => setUnlockPassword(e.target.value)}
                  className="cyber-input"
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsUnlockModalOpen(false)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#C7CBD4',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Verify & Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          LIVE IN-PLACE ADD / EDIT SPONSOR MODAL ON MAIN WEB
          ======================================================== */}
      {isEditModalOpen && (
        <div className="modal-backdrop">
          <div 
            className="modal-content"
            style={{ 
              maxWidth: '680px', 
              background: '#0D1424', 
              border: '1px solid rgba(56, 189, 248, 0.45)',
              padding: '24px' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  {editingSponsor ? `Edit Sponsor: ${editingSponsor.companyName}` : 'Add New Sponsor / Partner'}
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 700 }}>
                  Live changes will immediately appear on the public page
                </span>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSponsor}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C7CBD4', display: 'block', marginBottom: '4px' }}>
                    Company / Organization Name: *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g. Connect Club, Vencorpia, TechCorp"
                    className="cyber-input"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C7CBD4', display: 'block', marginBottom: '4px' }}>
                    Sponsorship Tier: *
                  </label>
                  <select
                    value={tier}
                    onChange={e => {
                      const val = e.target.value as any;
                      setTier(val);
                      if (val === 'Official Event Partner') setTierBadgeColor('#38BDF8');
                      if (val === 'Official Tech Partner') setTierBadgeColor('#00C2FF');
                      if (val === 'Gold Sponsor') setTierBadgeColor('#F59E0B');
                      if (val === 'Title Sponsor') setTierBadgeColor('#EC4899');
                      if (val === 'Platinum Partner') setTierBadgeColor('#A855F7');
                    }}
                    className="cyber-input"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  >
                    <option value="Official Event Partner">Official Event Partner</option>
                    <option value="Official Tech Partner">Official Tech Partner</option>
                    <option value="Gold Sponsor">Gold Sponsor</option>
                    <option value="Platinum Partner">Platinum Partner</option>
                    <option value="Title Sponsor">Title Sponsor</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C7CBD4', display: 'block', marginBottom: '4px' }}>
                  Tagline / Description:
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="e.g. Empowering Student Communities & Tech Innovations"
                  className="cyber-input"
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C7CBD4', display: 'block', marginBottom: '4px' }}>
                    Logo Path or URL: *
                  </label>
                  <input
                    type="text"
                    required
                    value={logo}
                    onChange={e => setLogo(e.target.value)}
                    placeholder="/connect_club_transparent.png or URL"
                    className="cyber-input"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setLogo('/connect_club_transparent.png')}
                      style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', cursor: 'pointer' }}
                    >
                      Connect Club
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogo('/vencorpia_transparent.png')}
                      style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', cursor: 'pointer' }}
                    >
                      Vencorpia
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogo('/vce_logo.png')}
                      style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', cursor: 'pointer' }}
                    >
                      VCE Crest
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C7CBD4', display: 'block', marginBottom: '4px' }}>
                    Tier Accent Color:
                  </label>
                  <input
                    type="color"
                    value={tierBadgeColor}
                    onChange={e => setTierBadgeColor(e.target.value)}
                    style={{
                      width: '100%',
                      height: '38px',
                      background: 'rgba(12, 14, 18, 0.85)',
                      border: '1px solid rgba(199, 203, 212, 0.2)',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C7CBD4', display: 'block', marginBottom: '4px' }}>
                    Official Website Link:
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className="cyber-input"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C7CBD4', display: 'block', marginBottom: '4px' }}>
                    Audience Reach:
                  </label>
                  <input
                    type="text"
                    value={estimatedReach}
                    onChange={e => setEstimatedReach(e.target.value)}
                    placeholder="35,000+ Students"
                    className="cyber-input"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C7CBD4', display: 'block', marginBottom: '4px' }}>
                    Stall Number & Campus Location:
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      value={stallNumber}
                      onChange={e => setStallNumber(e.target.value)}
                      placeholder="Stall #A-01"
                      style={{ width: '100px', padding: '8px 10px', fontSize: '0.85rem' }}
                      className="cyber-input"
                    />
                    <input
                      type="text"
                      value={stallLocation}
                      onChange={e => setStallLocation(e.target.value)}
                      placeholder="Central Block Atrium"
                      className="cyber-input"
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C7CBD4', display: 'block', marginBottom: '4px' }}>
                    Stage Keynote Time Slot:
                  </label>
                  <input
                    type="text"
                    value={stageKeynoteTime}
                    onChange={e => setStageKeynoteTime(e.target.value)}
                    placeholder="Day 1 • 11:30 AM (Inaugural)"
                    className="cyber-input"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(199, 203, 212, 0.1)', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#C7CBD4',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '8px 22px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  {editingSponsor ? 'Save Changes' : 'Create Sponsor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Copyright */}
      <footer
        style={{
          borderTop: '1px solid rgba(199, 203, 212, 0.1)',
          padding: '24px 20px',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: '#94A3B8'
        }}
      >
        © 2026 FESTRONIX • Vardhaman College of Engineering, Hyderabad. All rights reserved.
      </footer>

    </div>
  );
};
