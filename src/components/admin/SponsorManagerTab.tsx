import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Sparkles,
  Layers,
  Users,
  Eye,
  Ticket,
  FileText,
  RotateCcw,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Shield,
  User,
  Award,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminUser } from '../../services/adminAuthService';
import { SponsorProfile, SponsorDeliverable } from '../partners/partnerData';
import { PartnerStorageService } from '../../services/partnerStorageService';

interface SponsorManagerTabProps {
  adminUser: AdminUser;
}

export const SponsorManagerTab: React.FC<SponsorManagerTabProps> = ({ adminUser }) => {
  const [sponsors, setSponsors] = useState<SponsorProfile[]>(() => PartnerStorageService.getSponsors());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState('all');
  const [expandedSponsorId, setExpandedSponsorId] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<SponsorProfile | null>(null);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [tagline, setTagline] = useState('');
  const [tier, setTier] = useState<SponsorProfile['tier']>('Official Event Partner');
  const [tierBadgeColor, setTierBadgeColor] = useState('#38BDF8');
  const [logo, setLogo] = useState('/connect_club_transparent.png');
  const [website, setWebsite] = useState('https://');
  const [pocName, setPocName] = useState('');
  const [pocRole, setPocRole] = useState('Partnerships Lead');
  const [pocContact, setPocContact] = useState('+91 ');
  const [pocEmail, setPocEmail] = useState('');
  const [sacLeadName, setSacLeadName] = useState('Md. Asif (Dean SAC)');
  const [sacLeadContact, setSacLeadContact] = useState('+91 98480 99112');
  const [stallLocation, setStallLocation] = useState('Central Block Atrium • Ground Level');
  const [stallNumber, setStallNumber] = useState('Stall #A-01');
  const [mouStatus, setMouStatus] = useState<SponsorProfile['mouStatus']>('Signed & Executed');
  const [invoiceStatus, setInvoiceStatus] = useState<SponsorProfile['invoiceStatus']>('Paid & Cleared');
  const [stageKeynoteTime, setStageKeynoteTime] = useState('Day 1 • 11:30 AM');
  const [brandedBannersAllocated, setBrandedBannersAllocated] = useState(10);
  const [vipLoungePasses, setVipLoungePasses] = useState(15);
  const [estimatedReach, setEstimatedReach] = useState('35,000+ Students');
  const [impressionsCount, setImpressionsCount] = useState('1.2M Digital Impressions');

  // Add Deliverable inline state
  const [newDeliverableTitle, setNewDeliverableTitle] = useState('');
  const [newDeliverableCat, setNewDeliverableCat] = useState<SponsorDeliverable['category']>('branding');
  const [newDeliverableDesc, setNewDeliverableDesc] = useState('');
  const [newDeliverableDate, setNewDeliverableDate] = useState('Dec 1, 2026');

  // Sync sponsors on external updates
  useEffect(() => {
    PartnerStorageService.initRealtime();
    void PartnerStorageService.fetchSponsors()
      .then(setSponsors)
      .catch(error => console.warn('Sponsor manager sync warning:', error));
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

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingSponsor(null);
    setCompanyName('');
    setTagline('');
    setTier('Official Event Partner');
    setTierBadgeColor('#38BDF8');
    setLogo('/connect_club_transparent.png');
    setWebsite('https://');
    setPocName('');
    setPocRole('Lead Organizer');
    setPocContact('+91 ');
    setPocEmail('');
    setSacLeadName('Md. Asif (Dean SAC)');
    setSacLeadContact('+91 98480 99112');
    setStallLocation('Central Block Atrium • Ground Level');
    setStallNumber('Stall #A-01');
    setMouStatus('Signed & Executed');
    setInvoiceStatus('Paid & Cleared');
    setStageKeynoteTime('Day 1 • 11:30 AM');
    setBrandedBannersAllocated(10);
    setVipLoungePasses(15);
    setEstimatedReach('35,000+ Students');
    setImpressionsCount('1.2M Digital Impressions');
    setIsModalOpen(true);
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
    setPocName(sponsor.pocName);
    setPocRole(sponsor.pocRole);
    setPocContact(sponsor.pocContact);
    setPocEmail(sponsor.pocEmail);
    setSacLeadName(sponsor.sacLeadName);
    setSacLeadContact(sponsor.sacLeadContact);
    setStallLocation(sponsor.stallLocation);
    setStallNumber(sponsor.stallNumber);
    setMouStatus(sponsor.mouStatus);
    setInvoiceStatus(sponsor.invoiceStatus);
    setStageKeynoteTime(sponsor.metrics.stageKeynoteTime);
    setBrandedBannersAllocated(sponsor.metrics.brandedBannersAllocated);
    setVipLoungePasses(sponsor.metrics.vipLoungePasses);
    setEstimatedReach(sponsor.metrics.estimatedReach);
    setImpressionsCount(sponsor.metrics.impressionsCount);
    setIsModalOpen(true);
  };

  // Save (Create or Update) Sponsor
  const handleSaveSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      alert('Please enter a company or partner name.');
      return;
    }

    if (editingSponsor) {
      // Update existing
      PartnerStorageService.updateSponsor(editingSponsor.id, {
        companyName: companyName.trim(),
        tagline: tagline.trim(),
        tier,
        tierBadgeColor,
        logo: logo.trim(),
        website: website.trim(),
        pocName: pocName.trim(),
        pocRole: pocRole.trim(),
        pocContact: pocContact.trim(),
        pocEmail: pocEmail.trim(),
        sacLeadName: sacLeadName.trim(),
        sacLeadContact: sacLeadContact.trim(),
        stallLocation: stallLocation.trim(),
        stallNumber: stallNumber.trim(),
        mouStatus,
        invoiceStatus,
        metrics: {
          stageKeynoteTime,
          brandedBannersAllocated: Number(brandedBannersAllocated) || 0,
          vipLoungePasses: Number(vipLoungePasses) || 0,
          estimatedReach,
          impressionsCount
        }
      });
      confetti({ particleCount: 75, spread: 60 });
    } else {
      // Create new
      const newSponsor: SponsorProfile = {
        id: `sp_${Date.now()}`,
        companyName: companyName.trim(),
        tagline: tagline.trim() || 'Official Corporate Sponsor & Partner',
        tier,
        tierBadgeColor,
        logo: logo.trim() || '/vce_logo.png',
        website: website.trim() || 'https://vardhaman.org',
        pocName: pocName.trim() || 'Corporate Liaison Desk',
        pocRole: pocRole.trim() || 'Partner Representative',
        pocContact: pocContact.trim() || '+91 98480 99112',
        pocEmail: pocEmail.trim() || 'festronix@vardhaman.org',
        sacLeadName: sacLeadName.trim() || 'Dean SAC',
        sacLeadContact: sacLeadContact.trim() || '+91 98480 99112',
        stallLocation: stallLocation.trim() || 'Innovation Arena Hub',
        stallNumber: stallNumber.trim() || 'Stall #S-01',
        mouStatus,
        invoiceStatus,
        metrics: {
          stageKeynoteTime,
          brandedBannersAllocated: Number(brandedBannersAllocated) || 10,
          vipLoungePasses: Number(vipLoungePasses) || 10,
          estimatedReach,
          impressionsCount
        },
        deliverables: [
          {
            id: `del_${Date.now()}_1`,
            title: 'Top Floating Navbar & Mobile Branding',
            category: 'digital',
            status: 'completed',
            description: 'Brand emblem featured on festival navigation across all devices.',
            dueDate: 'Immediate'
          },
          {
            id: `del_${Date.now()}_2`,
            title: 'Main Stage LED Backdrop Loop',
            category: 'stage',
            status: 'in_progress',
            description: '4K Ultra-HD loop displayed across all keynote sessions.',
            dueDate: 'Dec 1, 2026'
          }
        ]
      };
      PartnerStorageService.addSponsor(newSponsor);
      confetti({ particleCount: 100, spread: 70 });
    }

    setIsModalOpen(false);
    refreshList();
  };

  // Delete Sponsor
  const handleDeleteSponsor = (sponsorId: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently remove sponsor "${name}"?\n\nThis will remove their profile from the Sponsor Lounge and deliverables tracking.`)) {
      PartnerStorageService.deleteSponsor(sponsorId);
      refreshList();
    }
  };

  // Toggle Deliverable Status
  const handleToggleDeliverableStatus = (sponsorId: string, delId: string) => {
    const sponsor = sponsors.find(s => s.id === sponsorId);
    if (!sponsor) return;

    const updated = sponsor.deliverables.map(d => {
      if (d.id === delId) {
        let nextStatus: SponsorDeliverable['status'] = 'completed';
        if (d.status === 'completed') nextStatus = 'in_progress';
        else if (d.status === 'in_progress') nextStatus = 'scheduled';
        else if (d.status === 'scheduled') nextStatus = 'completed';
        return { ...d, status: nextStatus };
      }
      return d;
    });

    PartnerStorageService.updateSponsor(sponsorId, { deliverables: updated });
    refreshList();
  };

  // Add Deliverable inline
  const handleAddDeliverable = (sponsorId: string) => {
    if (!newDeliverableTitle.trim()) {
      alert('Please enter a deliverable title.');
      return;
    }
    const sponsor = sponsors.find(s => s.id === sponsorId);
    if (!sponsor) return;

    const newDel: SponsorDeliverable = {
      id: `del_${Date.now()}`,
      title: newDeliverableTitle.trim(),
      category: newDeliverableCat,
      status: 'scheduled',
      description: newDeliverableDesc.trim() || 'Deliverable agreed upon as per official festival sponsorship memorandum.',
      dueDate: newDeliverableDate.trim() || 'Dec 1, 2026'
    };

    const updated = [...sponsor.deliverables, newDel];
    PartnerStorageService.updateSponsor(sponsorId, { deliverables: updated });
    setNewDeliverableTitle('');
    setNewDeliverableDesc('');
    refreshList();
    confetti({ particleCount: 40, spread: 50 });
  };

  // Delete Deliverable
  const handleDeleteDeliverable = (sponsorId: string, delId: string) => {
    const sponsor = sponsors.find(s => s.id === sponsorId);
    if (!sponsor) return;

    const updated = sponsor.deliverables.filter(d => d.id !== delId);
    PartnerStorageService.updateSponsor(sponsorId, { deliverables: updated });
    refreshList();
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    if (window.confirm('Reset all sponsors and partners back to default profiles (Connect Club, Vencorpia, CyberCore)?')) {
      PartnerStorageService.resetToDefaults();
      refreshList();
      confetti({ particleCount: 50, spread: 45 });
    }
  };

  // Filtered sponsors
  const filteredSponsors = sponsors.filter(s => {
    const matchSearch =
      s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.pocName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.stallNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchTier = selectedTierFilter === 'all' || s.tier.toLowerCase() === selectedTierFilter.toLowerCase();
    return matchSearch && matchTier;
  });

  // Aggregate stats
  const totalDeliverables = sponsors.reduce((acc, s) => acc + s.deliverables.length, 0);
  const completedDeliverables = sponsors.reduce(
    (acc, s) => acc + s.deliverables.filter(d => d.status === 'completed').length, 0
  );
  const totalVipPasses = sponsors.reduce((acc, s) => acc + (s.metrics.vipLoungePasses || 0), 0);
  const totalSignedMou = sponsors.filter(s => s.mouStatus === 'Signed & Executed').length;
  const overallProgress = totalDeliverables > 0 ? Math.round((completedDeliverables / totalDeliverables) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ========================================================
          TOP SECTION HEADER
          ======================================================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '4px'
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', borderRadius: '9999px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', marginBottom: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }} />
            <span style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Super Admin Governance
            </span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-0.02em' }}>
            Sponsors & Strategic Partners Management
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', margin: '6px 0 0 0', lineHeight: 1.5 }}>
            Full control over official partners, corporate agreements, MoU status, on-ground stalls, and signed deliverables.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleResetDefaults}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#CBD5E1',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(8px)'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
            title="Restore original factory partners"
          >
            <RotateCcw size={14} color="#94A3B8" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            style={{
              background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 50%, #7C3AED 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              padding: '10px 18px',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Plus size={16} />
            <span>Add New Sponsor / Partner</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          4 EXECUTIVE KPI METRIC CARDS (SELF-CONTAINED GRID)
          ======================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}
      >
        {/* Card 1: Active Brands */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(12, 18, 34, 0.95) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0, width: '90px', height: '90px', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Active Sponsors & Partners
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={17} color="#38BDF8" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#38BDF8', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              {sponsors.length} <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1F5F9' }}>Corporate Brands</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '0.74rem', color: '#34D399', fontWeight: 600 }}>
              <CheckCircle2 size={13} />
              <span>100% Verified Partners</span>
            </div>
          </div>
        </div>

        {/* Card 2: Deliverables Progress */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(12, 18, 34, 0.95) 100%)',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0, width: '90px', height: '90px', background: 'radial-gradient(circle, rgba(52, 211, 153, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Deliverables Progress
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={17} color="#34D399" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#34D399', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              {completedDeliverables} / {totalDeliverables} <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1F5F9' }}>Completed</span>
            </div>
            {/* Visual Progress Bar */}
            <div style={{ width: '100%', height: '6px', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.08)', marginTop: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${overallProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10B981 0%, #38BDF8 100%)',
                  borderRadius: '9999px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
            <div style={{ marginTop: '6px', fontSize: '0.74rem', color: '#94A3B8', fontWeight: 600 }}>
              {overallProgress}% Overall Fulfillment Rate
            </div>
          </div>
        </div>

        {/* Card 3: VIP Passes */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(12, 18, 34, 0.95) 100%)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0, width: '90px', height: '90px', background: 'radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              VIP Passes Allocated
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.12)', border: '1px solid rgba(251, 191, 36, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ticket size={17} color="#FBBF24" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FBBF24', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              {totalVipPasses} <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1F5F9' }}>Executive Badges</span>
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.74rem', color: '#94A3B8', fontWeight: 600 }}>
              VIP Lounge & Keynote Stage Access
            </div>
          </div>
        </div>

        {/* Card 4: MoU Status */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(12, 18, 34, 0.95) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0, width: '90px', height: '90px', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Active MoU Status
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={17} color="#A855F7" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#A855F7', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              {totalSignedMou} <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1F5F9' }}>Signed & Executed</span>
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.74rem', color: '#C084FC', fontWeight: 600 }}>
              Legally Binding Agreements
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          SEARCH AND TIER FILTER TOOLBAR
          ======================================================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: '14px',
          padding: '12px 16px',
          backdropFilter: 'blur(12px)'
        }}
      >
        <div style={{ position: 'relative', width: '340px', maxWidth: '100%' }}>
          <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search company, POC, or stall number..."
            style={{
              width: '100%',
              background: 'rgba(10, 15, 28, 0.85)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '9px',
              padding: '9px 12px 9px 36px',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              outline: 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = '#38BDF8';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(56, 189, 248, 0.2)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Tier filter pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All Tiers', count: sponsors.length },
            { key: 'Official Event Partner', label: 'Official Event Partner', count: sponsors.filter(s => s.tier === 'Official Event Partner').length },
            { key: 'Official Tech Partner', label: 'Official Tech Partner', count: sponsors.filter(s => s.tier === 'Official Tech Partner').length },
            { key: 'Gold Sponsor', label: 'Gold Sponsor', count: sponsors.filter(s => s.tier === 'Gold Sponsor').length }
          ].map(t => {
            const isSelected = selectedTierFilter === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setSelectedTierFilter(t.key)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9999px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #38BDF8' : '1px solid rgba(148, 163, 184, 0.16)',
                  background: isSelected ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.22) 0%, rgba(37, 99, 235, 0.25) 100%)' : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected ? '#FFFFFF' : '#94A3B8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{t.label}</span>
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    background: isSelected ? '#38BDF8' : 'rgba(255, 255, 255, 0.08)',
                    color: isSelected ? '#0B1120' : '#94A3B8'
                  }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          SPONSOR CARDS LIST
          ======================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredSponsors.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: 'rgba(15, 23, 42, 0.5)',
              borderRadius: '16px',
              border: '1px dashed rgba(148, 163, 184, 0.2)'
            }}
          >
            <Building2 size={36} color="#64748B" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ color: '#F1F5F9', margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700 }}>No sponsors match your filter</h4>
            <p style={{ color: '#94A3B8', margin: 0, fontSize: '0.82rem' }}>Try clearing your search query or tier filters.</p>
          </div>
        ) : (
          filteredSponsors.map(sponsor => {
            const isExpanded = expandedSponsorId === sponsor.id;
            const completedCount = sponsor.deliverables.filter(d => d.status === 'completed').length;
            const progressPercent = sponsor.deliverables.length > 0
              ? Math.round((completedCount / sponsor.deliverables.length) * 100)
              : 0;

            return (
              <div
                key={sponsor.id}
                style={{
                  background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.88) 0%, rgba(13, 18, 32, 0.96) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.18)',
                  borderRadius: '18px',
                  padding: '22px',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>

                  {/* Brand & Tier */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      <img
                        src={sponsor.logo}
                        alt={sponsor.companyName}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-0.01em' }}>
                          {sponsor.companyName}
                        </h3>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            background: `${sponsor.tierBadgeColor}18`,
                            color: sponsor.tierBadgeColor,
                            border: `1px solid ${sponsor.tierBadgeColor}45`,
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em'
                          }}
                        >
                          {sponsor.tier}
                        </span>

                        {sponsor.website && (
                          <a
                            href={sponsor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: '#64748B',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.72rem',
                              textDecoration: 'none',
                              padding: '2px 6px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.04)'
                            }}
                            title={`Visit ${sponsor.companyName} website`}
                          >
                            <Globe size={11} />
                            <span>Link</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>

                      <p style={{ color: '#94A3B8', fontSize: '0.84rem', margin: '4px 0 8px 0', lineHeight: 1.4 }}>
                        {sponsor.tagline}
                      </p>

                      {/* Operational Status Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ padding: '3px 9px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.22)', fontSize: '0.74rem', color: '#BAE6FD', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <MapPin size={11} color="#38BDF8" />
                          <span>Stall: <strong style={{ color: '#FFFFFF' }}>{sponsor.stallNumber}</strong> ({sponsor.stallLocation})</span>
                        </div>

                        <div style={{ padding: '3px 9px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.22)', fontSize: '0.74rem', color: '#A7F3D0', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }} />
                          <span>MoU: <strong style={{ color: '#FFFFFF' }}>{sponsor.mouStatus}</strong></span>
                        </div>

                        <div style={{ padding: '3px 9px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.22)', fontSize: '0.74rem', color: '#A7F3D0', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }} />
                          <span>Invoice: <strong style={{ color: '#FFFFFF' }}>{sponsor.invoiceStatus}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleOpenEditModal(sponsor)}
                      style={{
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38BDF8',
                        borderRadius: '9px',
                        padding: '8px 14px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)')}
                      title="Edit sponsor details"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteSponsor(sponsor.id, sponsor.companyName)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#F87171',
                        borderRadius: '9px',
                        padding: '8px 14px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                      title="Delete sponsor"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>

                    <button
                      onClick={() => setExpandedSponsorId(isExpanded ? null : sponsor.id)}
                      style={{
                        background: isExpanded ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: isExpanded ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.12)',
                        color: isExpanded ? '#FFFFFF' : '#CBD5E1',
                        borderRadius: '9px',
                        padding: '8px 14px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{isExpanded ? 'Hide Deliverables' : 'Deliverables'}</span>
                      <span
                        style={{
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          background: completedCount === sponsor.deliverables.length ? '#10B981' : 'rgba(56, 189, 248, 0.2)',
                          color: completedCount === sponsor.deliverables.length ? '#FFFFFF' : '#38BDF8',
                          fontSize: '0.7rem',
                          fontWeight: 800
                        }}
                      >
                        {completedCount}/{sponsor.deliverables.length}
                      </span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                </div>

                {/* Quick Metrics Strip Box */}
                <div
                  style={{
                    marginTop: '18px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.025)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={13} color="#38BDF8" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Partner POC</div>
                      <div style={{ color: '#F1F5F9', fontWeight: 600 }}>{sponsor.pocName} <span style={{ color: '#64748B', fontSize: '0.72rem' }}>({sponsor.pocContact})</span></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Shield size={13} color="#A855F7" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SAC Lead Liaison</div>
                      <div style={{ color: '#F1F5F9', fontWeight: 600 }}>{sponsor.sacLeadName}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={13} color="#FBBF24" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Keynote Stage Slot</div>
                      <div style={{ color: '#FBBF24', fontWeight: 700 }}>{sponsor.metrics.stageKeynoteTime}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Ticket size={13} color="#34D399" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>VIP Passes</div>
                      <div style={{ color: '#34D399', fontWeight: 700 }}>{sponsor.metrics.vipLoungePasses} Passes Allocated</div>
                    </div>
                  </div>
                </div>

                {/* Expanded Deliverables Management Section */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '20px',
                      paddingTop: '18px',
                      borderTop: '1px solid rgba(56, 189, 248, 0.25)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={16} color="#38BDF8" />
                        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F8FAFC' }}>
                          Deliverables Checklist
                        </span>
                        <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                          (Click status pill to toggle status live)
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Completion:</span>
                        <div style={{ width: '100px', height: '6px', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                          <div style={{ width: `${progressPercent}%`, height: '100%', background: '#38BDF8', borderRadius: '9999px' }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 800 }}>
                          {progressPercent}%
                        </span>
                      </div>
                    </div>

                    {/* Deliverables List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                      {sponsor.deliverables.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                          No deliverables registered yet for this partner. Add one below.
                        </div>
                      ) : (
                        sponsor.deliverables.map(del => {
                          let catBg = 'rgba(56, 189, 248, 0.1)';
                          let catColor = '#38BDF8';
                          if (del.category === 'stage') { catBg = 'rgba(251, 191, 36, 0.1)'; catColor = '#FBBF24'; }
                          if (del.category === 'on_ground') { catBg = 'rgba(168, 85, 247, 0.1)'; catColor = '#C084FC'; }
                          if (del.category === 'branding') { catBg = 'rgba(52, 211, 153, 0.1)'; catColor = '#34D399'; }

                          return (
                            <div
                              key={del.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                background: 'rgba(15, 23, 42, 0.75)',
                                border: '1px solid rgba(148, 163, 184, 0.12)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    color: catColor,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    padding: '3px 8px',
                                    background: catBg,
                                    borderRadius: '6px',
                                    border: `1px solid ${catColor}30`
                                  }}
                                >
                                  {del.category.replace('_', ' ')}
                                </span>
                                <div>
                                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F1F5F9' }}>
                                    {del.title}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                                    {del.description} • <span style={{ color: '#CBD5E1' }}>Due: {del.dueDate}</span>
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button
                                  onClick={() => handleToggleDeliverableStatus(sponsor.id, del.id)}
                                  style={{
                                    cursor: 'pointer',
                                    borderRadius: '9999px',
                                    padding: '5px 12px',
                                    fontSize: '0.74rem',
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.15s ease',
                                    ...(del.status === 'completed' ? {
                                      background: 'rgba(16, 185, 129, 0.16)',
                                      border: '1px solid rgba(16, 185, 129, 0.4)',
                                      color: '#34D399'
                                    } : del.status === 'in_progress' ? {
                                      background: 'rgba(245, 158, 11, 0.16)',
                                      border: '1px solid rgba(245, 158, 11, 0.4)',
                                      color: '#FBBF24'
                                    } : {
                                      background: 'rgba(56, 189, 248, 0.16)',
                                      border: '1px solid rgba(56, 189, 248, 0.4)',
                                      color: '#38BDF8'
                                    })
                                  }}
                                  title="Click to toggle status (Completed -> In Progress -> Scheduled)"
                                >
                                  {del.status === 'completed' && <CheckCircle2 size={12} />}
                                  {del.status === 'in_progress' && <Clock size={12} />}
                                  {del.status === 'scheduled' && <Calendar size={12} />}
                                  <span>{del.status.replace('_', ' ').toUpperCase()}</span>
                                </button>

                                <button
                                  onClick={() => handleDeleteDeliverable(sponsor.id, del.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#64748B',
                                    cursor: 'pointer',
                                    padding: '6px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'color 0.15s ease'
                                  }}
                                  onMouseEnter={e => (e.currentTarget.style.color = '#F87171')}
                                  onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
                                  title="Delete deliverable"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Add New Deliverable Inline Form */}
                    <div
                      style={{
                        background: 'rgba(11, 16, 29, 0.85)',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: '1px dashed rgba(56, 189, 248, 0.25)'
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38BDF8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Plus size={14} />
                        <span>Add New Deliverable for {sponsor.companyName}:</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px' }}>
                        <input
                          type="text"
                          value={newDeliverableTitle}
                          onChange={e => setNewDeliverableTitle(e.target.value)}
                          placeholder="Deliverable title (e.g. VIP Dinner Keynote)"
                          style={{
                            background: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            color: '#FFFFFF',
                            fontSize: '0.8rem',
                            outline: 'none'
                          }}
                        />
                        <select
                          value={newDeliverableCat}
                          onChange={e => setNewDeliverableCat(e.target.value as any)}
                          style={{
                            background: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            color: '#FFFFFF',
                            fontSize: '0.8rem',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="branding">Branding</option>
                          <option value="digital">Digital</option>
                          <option value="stage">Stage / Keynote</option>
                          <option value="on_ground">On-Ground / Booth</option>
                        </select>
                        <input
                          type="text"
                          value={newDeliverableDate}
                          onChange={e => setNewDeliverableDate(e.target.value)}
                          placeholder="Due Date"
                          style={{
                            background: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            color: '#FFFFFF',
                            fontSize: '0.8rem',
                            outline: 'none'
                          }}
                        />
                        <button
                          onClick={() => handleAddDeliverable(sponsor.id)}
                          style={{
                            background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                            border: 'none',
                            color: '#FFFFFF',
                            borderRadius: '8px',
                            padding: '8px 18px',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* ========================================================
          CREATE / EDIT SPONSOR MODAL
          ======================================================== */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(5, 8, 16, 0.8)',
            backdropFilter: 'blur(8px)',
            padding: '20px'
          }}
          data-lenis-prevent
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
        >
          <div
            style={{
              width: '100%',
              maxWidth: '750px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'linear-gradient(180deg, #0F172A 0%, #0A0F1D 100%)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.12)'
            }}
            data-lenis-prevent
            data-lenis-prevent-wheel
            data-lenis-prevent-touch
            onWheel={event => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '22px 28px',
                borderBottom: '1px solid rgba(148, 163, 184, 0.14)',
                background: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                  {editingSponsor ? `Edit Sponsor: ${editingSponsor.companyName}` : 'Add New Corporate Sponsor / Partner'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                  Super Admin controls for Festronix 2026 strategic collaborations
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94A3B8',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveSponsor} style={{ padding: '24px 28px' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                    Company / Organization Name: *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g. Connect Club, Vencorpia, TechCorp"
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
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
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Official Event Partner">Official Event Partner</option>
                    <option value="Official Tech Partner">Official Tech Partner</option>
                    <option value="Gold Sponsor">Gold Sponsor</option>
                    <option value="Platinum Partner">Platinum Partner</option>
                    <option value="Title Sponsor">Title Sponsor</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                  Tagline / Core Value Proposition:
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="e.g. Empowering Student Communities & Tech Innovations"
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                    Logo Path or URL: *
                  </label>
                  <input
                    type="text"
                    required
                    value={logo}
                    onChange={e => setLogo(e.target.value)}
                    placeholder="/connect_club_transparent.png or URL"
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setLogo('/connect_club_transparent.png')}
                      style={{ fontSize: '0.72rem', padding: '3px 9px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#94A3B8', cursor: 'pointer' }}
                    >
                      Preset: Connect Club
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogo('/vencorpia_transparent.png')}
                      style={{ fontSize: '0.72rem', padding: '3px 9px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#94A3B8', cursor: 'pointer' }}
                    >
                      Preset: Vencorpia
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogo('/vce_logo.png')}
                      style={{ fontSize: '0.72rem', padding: '3px 9px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#94A3B8', cursor: 'pointer' }}
                    >
                      Preset: VCE Crest
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                    Tier Accent Color:
                  </label>
                  <input
                    type="color"
                    value={tierBadgeColor}
                    onChange={e => setTierBadgeColor(e.target.value)}
                    style={{
                      width: '100%',
                      height: '42px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                    Official Website Link:
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    placeholder="https://company.com"
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                    MoU / Agreement Status:
                  </label>
                  <select
                    value={mouStatus}
                    onChange={e => setMouStatus(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Signed & Executed">Signed & Executed</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Draft Sent">Draft Sent</option>
                  </select>
                </div>
              </div>

              {/* Point of Contact & College Liaison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                    Partner POC Name & Contact:
                  </label>
                  <input
                    type="text"
                    value={pocName}
                    onChange={e => setPocName(e.target.value)}
                    placeholder="e.g. Harshith Reddy (+91 98480 12345)"
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                    SAC Lead Liaison:
                  </label>
                  <input
                    type="text"
                    value={sacLeadName}
                    onChange={e => setSacLeadName(e.target.value)}
                    placeholder="e.g. Md. Asif (Dean SAC)"
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Stall Location & Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                    Stall Number & Location:
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={stallNumber}
                      onChange={e => setStallNumber(e.target.value)}
                      placeholder="Stall #A-01"
                      style={{
                        width: '110px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                    <input
                      type="text"
                      value={stallLocation}
                      onChange={e => setStallLocation(e.target.value)}
                      placeholder="Central Block Atrium"
                      style={{
                        flex: 1,
                        background: 'rgba(15, 23, 42, 0.85)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                    Keynote Stage Slot:
                  </label>
                  <input
                    type="text"
                    value={stageKeynoteTime}
                    onChange={e => setStageKeynoteTime(e.target.value)}
                    placeholder="e.g. Day 1 • 11:30 AM (Inaugural Stage)"
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                    VIP Passes Allocated:
                  </label>
                  <input
                    type="number"
                    value={vipLoungePasses}
                    onChange={e => setVipLoungePasses(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                    Branded Banners Allocated:
                  </label>
                  <input
                    type="number"
                    value={brandedBannersAllocated}
                    onChange={e => setBrandedBannersAllocated(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(148, 163, 184, 0.14)', paddingTop: '18px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    color: '#CBD5E1',
                    borderRadius: '9px',
                    padding: '10px 18px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
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
                    borderRadius: '9px',
                    padding: '10px 24px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  {editingSponsor ? 'Save Changes' : 'Create Sponsor Profile'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
