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
  ChevronUp
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
  const [sacLeadName, setSacLeadName] = useState('Prof. R. Srinivas (Dean SAC)');
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
  const [newDeliverableDate, setNewDeliverableDate] = useState('Oct 28, 2026');

  // Sync sponsors on external updates
  useEffect(() => {
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
    setPocRole('Partnerships Lead');
    setPocContact('+91 ');
    setPocEmail('');
    setSacLeadName('Prof. R. Srinivas (Dean SAC)');
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
            dueDate: 'Oct 28, 2026'
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

    const nextStatus: Record<SponsorDeliverable['status'], SponsorDeliverable['status']> = {
      'completed': 'in_progress',
      'in_progress': 'scheduled',
      'scheduled': 'completed'
    };

    const updatedDeliverables = sponsor.deliverables.map(d => {
      if (d.id === delId) {
        return { ...d, status: nextStatus[d.status] };
      }
      return d;
    });

    PartnerStorageService.updateSponsor(sponsorId, { deliverables: updatedDeliverables });
    refreshList();
  };

  // Add Deliverable to Sponsor
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
      status: 'in_progress',
      description: newDeliverableDesc.trim() || 'Strategic brand asset fulfillment for FESTRONIX 2026.',
      dueDate: newDeliverableDate.trim() || 'Oct 28, 2026'
    };

    PartnerStorageService.updateSponsor(sponsorId, {
      deliverables: [...sponsor.deliverables, newDel]
    });

    setNewDeliverableTitle('');
    setNewDeliverableDesc('');
    refreshList();
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

  return (
    <div className="admin-tab-pane">
      
      {/* Top Section Header */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '16px',
          marginBottom: '24px' 
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Super Admin Governance
            </span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Sponsors & Strategic Partners Management
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
            Full control over official partners, corporate agreements, MoU status, on-ground stalls, and signed deliverables.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleResetDefaults}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(199, 203, 212, 0.2)',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#C7CBD4',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Restore original factory partners"
          >
            <RotateCcw size={14} />
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
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.4)'
            }}
          >
            <Plus size={16} />
            <span>Add New Sponsor / Partner</span>
          </button>
        </div>
      </div>

      {/* 4 Mini KPI Cards */}
      <div className="partner-grid-4" style={{ marginBottom: '24px' }}>
        <div className="partner-stat-card">
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Active Sponsors & Partners</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38BDF8', marginTop: '4px' }}>
            {sponsors.length} Corporate Brands
          </div>
          <div style={{ fontSize: '0.72rem', color: '#34D399', marginTop: '2px' }}>
            100% Verified Partners
          </div>
        </div>

        <div className="partner-stat-card">
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Deliverables Progress</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34D399', marginTop: '4px' }}>
            {completedDeliverables} / {totalDeliverables} Completed
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            {totalDeliverables > 0 ? Math.round((completedDeliverables / totalDeliverables) * 100) : 0}% Fulfillment Rate
          </div>
        </div>

        <div className="partner-stat-card">
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>VIP Passes Allocated</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FBBF24', marginTop: '4px' }}>
            {totalVipPasses} Executive Badges
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            VIP Lounge & Stage Access
          </div>
        </div>

        <div className="partner-stat-card">
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Active MoU Status</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#A855F7', marginTop: '4px' }}>
            {sponsors.filter(s => s.mouStatus === 'Signed & Executed').length} Signed
          </div>
          <div style={{ fontSize: '0.72rem', color: '#A855F7', marginTop: '2px' }}>
            Legally Binding Agreements
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '12px',
          marginBottom: '20px' 
        }}
      >
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search company, POC, or stall number..."
            style={{
              width: '100%',
              background: 'rgba(15, 20, 32, 0.8)',
              border: '1px solid rgba(199, 203, 212, 0.18)',
              borderRadius: '8px',
              padding: '9px 12px 9px 36px',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Tier filter */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['all', 'Official Event Partner', 'Official Tech Partner', 'Gold Sponsor'].map(t => (
            <button
              key={t}
              onClick={() => setSelectedTierFilter(t)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid',
                background: selectedTierFilter === t ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: selectedTierFilter === t ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255, 255, 255, 0.1)',
                color: selectedTierFilter === t ? '#38BDF8' : '#94A3B8'
              }}
            >
              {t === 'all' ? 'All Tiers' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Sponsors Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {filteredSponsors.map(sponsor => {
          const isExpanded = expandedSponsorId === sponsor.id;
          const completedCount = sponsor.deliverables.filter(d => d.status === 'completed').length;
          const progressPercent = sponsor.deliverables.length > 0 
            ? Math.round((completedCount / sponsor.deliverables.length) * 100) 
            : 0;

          return (
            <div 
              key={sponsor.id} 
              className="partner-card"
              style={{
                border: '1px solid rgba(199, 203, 212, 0.16)',
                background: 'rgba(12, 17, 30, 0.95)'
              }}
            >
              {/* Header Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                
                {/* Brand & Tier */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div 
                    style={{ 
                      width: '58px', 
                      height: '58px', 
                      borderRadius: '12px', 
                      background: 'rgba(255, 255, 255, 0.05)', 
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: '8px'
                    }}
                  >
                    <img 
                      src={sponsor.logo} 
                      alt={sponsor.companyName} 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                        {sponsor.companyName}
                      </h3>
                      <span 
                        style={{ 
                          padding: '3px 10px', 
                          borderRadius: '9999px', 
                          background: `${sponsor.tierBadgeColor}20`,
                          color: sponsor.tierBadgeColor,
                          border: `1px solid ${sponsor.tierBadgeColor}40`,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em'
                        }}
                      >
                        {sponsor.tier}
                      </span>
                    </div>
                    <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: '3px 0 6px 0' }}>
                      {sponsor.tagline}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '0.75rem', color: '#C7CBD4' }}>
                      <span>Stall: <strong style={{ color: '#38BDF8' }}>{sponsor.stallNumber}</strong> ({sponsor.stallLocation})</span>
                      <span>•</span>
                      <span>MoU: <strong style={{ color: '#34D399' }}>{sponsor.mouStatus}</strong></span>
                      <span>•</span>
                      <span>Invoice: <strong style={{ color: '#34D399' }}>{sponsor.invoiceStatus}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleOpenEditModal(sponsor)}
                    style={{
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      color: '#38BDF8',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    title="Edit sponsor details"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSponsor(sponsor.id, sponsor.companyName)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#F87171',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    title="Delete sponsor"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>

                  <button
                    onClick={() => setExpandedSponsorId(isExpanded ? null : sponsor.id)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#C7CBD4',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>{isExpanded ? 'Hide Deliverables' : `Deliverables (${completedCount}/${sponsor.deliverables.length})`}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

              </div>

              {/* Quick Metrics Strip */}
              <div 
                style={{ 
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(199, 203, 212, 0.08)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  fontSize: '0.78rem'
                }}
              >
                <div>
                  <span style={{ color: '#94A3B8' }}>Partner POC:</span>{' '}
                  <strong style={{ color: '#FFFFFF' }}>{sponsor.pocName}</strong> ({sponsor.pocContact})
                </div>
                <div>
                  <span style={{ color: '#94A3B8' }}>SAC Lead:</span>{' '}
                  <strong style={{ color: '#FFFFFF' }}>{sponsor.sacLeadName}</strong>
                </div>
                <div>
                  <span style={{ color: '#94A3B8' }}>Keynote Slot:</span>{' '}
                  <strong style={{ color: '#FBBF24' }}>{sponsor.metrics.stageKeynoteTime}</strong>
                </div>
                <div>
                  <span style={{ color: '#94A3B8' }}>VIP Passes:</span>{' '}
                  <strong style={{ color: '#34D399' }}>{sponsor.metrics.vipLoungePasses} Passes</strong>
                </div>
              </div>

              {/* Expanded Deliverables Management Section */}
              {isExpanded && (
                <div 
                  style={{ 
                    marginTop: '18px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(56, 189, 248, 0.2)' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFFFFF' }}>
                      Deliverables Checklist (Click status pill to toggle status live)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 700 }}>
                      Progress: {progressPercent}% Completed
                    </div>
                  </div>

                  {/* Deliverables List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {sponsor.deliverables.map(del => (
                      <div 
                        key={del.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'rgba(21, 28, 44, 0.6)',
                          border: '1px solid rgba(199, 203, 212, 0.08)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', padding: '2px 6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                            {del.category}
                          </span>
                          <div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>
                              {del.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                              {del.description} • Due: {del.dueDate}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            onClick={() => handleToggleDeliverableStatus(sponsor.id, del.id)}
                            className={`status-pill status-${del.status.replace('_', '-')}`}
                            style={{ cursor: 'pointer', border: 'none' }}
                            title="Click to toggle status (Completed -> In Progress -> Scheduled)"
                          >
                            {del.status === 'completed' && <CheckCircle2 size={12} />}
                            {del.status === 'in_progress' && <Clock size={12} />}
                            {del.status === 'scheduled' && <Calendar size={12} />}
                            <span>{del.status.replace('_', ' ')}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteDeliverable(sponsor.id, del.id)}
                            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
                            title="Delete deliverable"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Deliverable Inline Form */}
                  <div 
                    style={{ 
                      background: 'rgba(15, 23, 42, 0.7)', 
                      padding: '12px 14px', 
                      borderRadius: '8px',
                      border: '1px dashed rgba(199, 203, 212, 0.2)' 
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38BDF8', marginBottom: '8px' }}>
                      + Add New Deliverable for {sponsor.companyName}:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px' }}>
                      <input
                        type="text"
                        value={newDeliverableTitle}
                        onChange={e => setNewDeliverableTitle(e.target.value)}
                        placeholder="Deliverable title (e.g. VIP Dinner Keynote)"
                        style={{
                          background: 'rgba(8, 12, 22, 0.8)',
                          border: '1px solid rgba(199, 203, 212, 0.2)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          color: '#FFFFFF',
                          fontSize: '0.78rem',
                          outline: 'none'
                        }}
                      />
                      <select
                        value={newDeliverableCat}
                        onChange={e => setNewDeliverableCat(e.target.value as any)}
                        style={{
                          background: 'rgba(8, 12, 22, 0.95)',
                          border: '1px solid rgba(199, 203, 212, 0.2)',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          color: '#FFFFFF',
                          fontSize: '0.78rem',
                          outline: 'none'
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
                          background: 'rgba(8, 12, 22, 0.8)',
                          border: '1px solid rgba(199, 203, 212, 0.2)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          color: '#FFFFFF',
                          fontSize: '0.78rem',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={() => handleAddDeliverable(sponsor.id)}
                        style={{
                          background: '#0284C7',
                          border: 'none',
                          color: '#FFFFFF',
                          borderRadius: '6px',
                          padding: '6px 14px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
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
        })}
      </div>

      {/* ========================================================
          CREATE / EDIT SPONSOR MODAL
          ======================================================== */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div 
            className="modal-content"
            style={{ 
              maxWidth: '750px', 
              background: '#0D1424', 
              border: '1px solid rgba(56, 189, 248, 0.4)' 
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(199, 203, 212, 0.12)' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  {editingSponsor ? `Edit Sponsor: ${editingSponsor.companyName}` : 'Add New Corporate Sponsor / Partner'}
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                  Super Admin controls for Festronix 2026 strategic collaborations
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveSponsor} style={{ padding: '20px 24px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
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
                  >
                    <option value="Official Event Partner">Official Event Partner</option>
                    <option value="Official Tech Partner">Official Tech Partner</option>
                    <option value="Gold Sponsor">Gold Sponsor</option>
                    <option value="Platinum Partner">Platinum Partner</option>
                    <option value="Title Sponsor">Title Sponsor</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C7CBD4', display: 'block', marginBottom: '4px' }}>
                  Tagline / Core Value Proposition:
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="e.g. Empowering Student Communities & Tech Innovations"
                  className="cyber-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '14px' }}>
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
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setLogo('/connect_club_transparent.png')}
                      style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', cursor: 'pointer' }}
                    >
                      Preset: Connect Club
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogo('/vencorpia_transparent.png')}
                      style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', cursor: 'pointer' }}
                    >
                      Preset: Vencorpia
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogo('/vce_logo.png')}
                      style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', cursor: 'pointer' }}
                    >
                      Preset: VCE Crest
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
                      height: '42px',
                      background: 'rgba(12, 14, 18, 0.85)',
                      border: '1px solid rgba(199, 203, 212, 0.2)',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
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
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C7CBD4', display: 'block', marginBottom: '4px' }}>
                    MoU / Agreement Status:
                  </label>
                  <select
                    value={mouStatus}
                    onChange={e => setMouStatus(e.target.value as any)}
                    className="cyber-input"
                  >
                    <option value="Signed & Executed">Signed & Executed</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Draft Sent">Draft Sent</option>
                  </select>
                </div>
              </div>

              {/* Point of Contact & College Liaison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C7CBD4', display: 'block', marginBottom: '4px' }}>
                    Partner POC Name & Contact:
                  </label>
                  <input
                    type="text"
                    value={pocName}
                    onChange={e => setPocName(e.target.value)}
                    placeholder="e.g. Harshith Reddy (+91 98480 12345)"
                    className="cyber-input"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C7CBD4', display: 'block', marginBottom: '4px' }}>
                    SAC Lead Liaison:
                  </label>
                  <input
                    type="text"
                    value={sacLeadName}
                    onChange={e => setSacLeadName(e.target.value)}
                    placeholder="e.g. Prof. R. Srinivas (Dean SAC)"
                    className="cyber-input"
                  />
                </div>
              </div>

              {/* Stall Location & Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C7CBD4', display: 'block', marginBottom: '4px' }}>
                    Stall Number & Location:
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={stallNumber}
                      onChange={e => setStallNumber(e.target.value)}
                      placeholder="Stall #A-01"
                      style={{ width: '110px' }}
                      className="cyber-input"
                    />
                    <input
                      type="text"
                      value={stallLocation}
                      onChange={e => setStallLocation(e.target.value)}
                      placeholder="Central Block Atrium"
                      className="cyber-input"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C7CBD4', display: 'block', marginBottom: '4px' }}>
                    Keynote Stage Slot:
                  </label>
                  <input
                    type="text"
                    value={stageKeynoteTime}
                    onChange={e => setStageKeynoteTime(e.target.value)}
                    placeholder="e.g. Day 1 • 11:30 AM (Inaugural Stage)"
                    className="cyber-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C7CBD4', display: 'block', marginBottom: '4px' }}>
                    VIP Passes Allocated:
                  </label>
                  <input
                    type="number"
                    value={vipLoungePasses}
                    onChange={e => setVipLoungePasses(Number(e.target.value))}
                    className="cyber-input"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C7CBD4', display: 'block', marginBottom: '4px' }}>
                    Branded Banners Allocated:
                  </label>
                  <input
                    type="number"
                    value={brandedBannersAllocated}
                    onChange={e => setBrandedBannersAllocated(Number(e.target.value))}
                    className="cyber-input"
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(199, 203, 212, 0.1)', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(199, 203, 212, 0.2)',
                    color: '#C7CBD4',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontSize: '0.85rem',
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
