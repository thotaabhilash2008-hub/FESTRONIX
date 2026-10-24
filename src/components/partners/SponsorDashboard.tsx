import React, { useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  MapPin, 
  Download, 
  PhoneCall, 
  Mail, 
  ExternalLink, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  Eye, 
  Layers, 
  Ticket,
  ChevronRight,
  Send
} from 'lucide-react';
import { SponsorProfile, SPONSOR_PROFILES, SponsorDeliverable } from './partnerData';

interface SponsorDashboardProps {
  onBackToFest: () => void;
}

export const SponsorDashboard: React.FC<SponsorDashboardProps> = ({ onBackToFest }) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string>('connect_club');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [supportMessage, setSupportMessage] = useState<string>('');
  const [supportSent, setSupportSent] = useState<boolean>(false);

  const currentSponsor: SponsorProfile = 
    SPONSOR_PROFILES.find(p => p.id === selectedProfileId) || SPONSOR_PROFILES[0];

  const filteredDeliverables = currentSponsor.deliverables.filter(item => {
    if (activeCategoryFilter === 'all') return true;
    return item.category === activeCategoryFilter;
  });

  const completedCount = currentSponsor.deliverables.filter(d => d.status === 'completed').length;
  const progressPercent = Math.round((completedCount / currentSponsor.deliverables.length) * 100);

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setSupportSent(true);
    setTimeout(() => {
      setSupportSent(false);
      setSupportMessage('');
    }, 4000);
  };

  const handleDownloadDeck = (docName: string) => {
    // Generate simulated executive collateral download
    const blob = new Blob([
      `FESTRONIX 2026 • OFFICIAL SPONSORSHIP COLLATERAL\nVardhaman College of Engineering, Hyderabad\nDocument: ${docName}\nPartner: ${currentSponsor.companyName}\nTier: ${currentSponsor.tier}\nTimestamp: ${new Date().toISOString()}\nStatus: Verified by Student Affairs Council (SAC)`
    ], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Festronix26_${currentSponsor.companyName.replace(/\s+/g, '_')}_${docName.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Top Profile Switcher & Quick Greeting */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '16px',
          marginBottom: '28px' 
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Corporate Relations & Sponsor Suite
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Sponsor Executive Lounge
          </h1>
        </div>

        {/* Profile Selector Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Active Partner:</span>
          {SPONSOR_PROFILES.map(profile => (
            <button
              key={profile.id}
              onClick={() => setSelectedProfileId(profile.id)}
              className={`profile-chip ${selectedProfileId === profile.id ? 'active' : ''}`}
            >
              <img 
                src={profile.logo} 
                alt={profile.companyName} 
                style={{ height: '18px', width: 'auto', objectFit: 'contain' }} 
              />
              <span>{profile.companyName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Profile Showcase Card */}
      <div 
        className="partner-card" 
        style={{ 
          marginBottom: '24px', 
          background: 'linear-gradient(135deg, rgba(14, 21, 37, 0.95) 0%, rgba(10, 15, 27, 0.98) 100%)',
          borderColor: 'rgba(56, 189, 248, 0.25)' 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          
          {/* Brand Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div 
              style={{ 
                width: '76px', 
                height: '76px', 
                borderRadius: '16px', 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '12px'
              }}
            >
              <img 
                src={currentSponsor.logo} 
                alt={currentSponsor.companyName} 
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  {currentSponsor.companyName}
                </h2>
                <span 
                  style={{ 
                    padding: '3px 10px', 
                    borderRadius: '9999px', 
                    background: `${currentSponsor.tierBadgeColor}20`,
                    color: currentSponsor.tierBadgeColor,
                    border: `1px solid ${currentSponsor.tierBadgeColor}40`,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                  }}
                >
                  {currentSponsor.tier}
                </span>
              </div>
              <p style={{ color: '#94A3B8', fontSize: '0.86rem', margin: 0, marginBottom: '8px' }}>
                {currentSponsor.tagline}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.78rem', color: '#C7CBD4' }}>
                <a 
                  href={currentSponsor.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#38BDF8', textDecoration: 'none' }}
                >
                  <span>{currentSponsor.website.replace('https://', '')}</span>
                  <ExternalLink size={12} />
                </a>
                <span>•</span>
                <span>MOU: <strong style={{ color: '#34D399' }}>{currentSponsor.mouStatus}</strong></span>
                <span>•</span>
                <span>Invoice: <strong style={{ color: '#34D399' }}>{currentSponsor.invoiceStatus}</strong></span>
              </div>
            </div>
          </div>

          {/* Dedicated SAC Point of Contact */}
          <div 
            style={{ 
              background: 'rgba(21, 28, 44, 0.7)', 
              border: '1px solid rgba(199, 203, 212, 0.12)', 
              borderRadius: '12px', 
              padding: '14px 18px',
              minWidth: '260px'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '6px' }}>
              Dedicated College Liaison
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>
              {currentSponsor.sacLeadName}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PhoneCall size={12} />
              <span>{currentSponsor.sacLeadContact}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#A8B3C2', marginTop: '6px' }}>
              Partner SPOC: {currentSponsor.pocName} ({currentSponsor.pocRole})
            </div>
          </div>

        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="partner-grid-4" style={{ marginBottom: '28px' }}>
        <div className="partner-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Projected Footfall</span>
            <Users size={18} color="#38BDF8" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF' }}>
            {currentSponsor.metrics.estimatedReach}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34D399', marginTop: '4px' }}>
            Across 45+ Engineering Colleges
          </div>
        </div>

        <div className="partner-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Digital Reach</span>
            <Eye size={18} color="#A855F7" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF' }}>
            {currentSponsor.metrics.impressionsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#A855F7', marginTop: '4px' }}>
            Web, Mobile, Instagram & Passes
          </div>
        </div>

        <div className="partner-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Stage Keynote Slot</span>
            <Calendar size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.3 }}>
            {currentSponsor.metrics.stageKeynoteTime}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginTop: '4px' }}>
            Auditorium Main Stage
          </div>
        </div>

        <div className="partner-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>VIP Passes Allocated</span>
            <Ticket size={18} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF' }}>
            {currentSponsor.metrics.vipLoungePasses} Passes
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34D399', marginTop: '4px' }}>
            VIP Stage & Executive Lounge
          </div>
        </div>
      </div>

      {/* Two Column Layout: Deliverables Tracker & Campus Booth / Assets */}
      <div className="partner-grid-2" style={{ marginBottom: '28px' }}>
        
        {/* Left: Deliverables & Branding Checklist */}
        <div className="partner-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Deliverables & Brand Presence
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                Track live fulfillment of signed sponsorship benefits
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38BDF8' }}>
                {completedCount} / {currentSponsor.deliverables.length} Complete
              </span>
              <div 
                style={{ 
                  width: '120px', 
                  height: '6px', 
                  background: 'rgba(255,255,255,0.1)', 
                  borderRadius: '9999px',
                  marginTop: '6px',
                  overflow: 'hidden' 
                }}
              >
                <div 
                  style={{ 
                    width: `${progressPercent}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #38BDF8, #10B981)',
                    borderRadius: '9999px' 
                  }} 
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {['all', 'branding', 'digital', 'stage', 'on_ground'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  background: activeCategoryFilter === cat ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  borderColor: activeCategoryFilter === cat ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                  color: activeCategoryFilter === cat ? '#38BDF8' : '#94A3B8'
                }}
              >
                {cat.toUpperCase().replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Deliverables List */}
          <div>
            {filteredDeliverables.map(item => (
              <div key={item.id} className="deliverable-row">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  {item.status === 'completed' ? (
                    <CheckCircle2 size={18} color="#34D399" style={{ flexShrink: 0, marginTop: '2px' }} />
                  ) : item.status === 'in_progress' ? (
                    <Clock size={18} color="#FBBF24" style={{ flexShrink: 0, marginTop: '2px' }} />
                  ) : (
                    <Calendar size={18} color="#38BDF8" style={{ flexShrink: 0, marginTop: '2px' }} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>
                      {item.description}
                    </div>
                    {item.location && (
                      <div style={{ fontSize: '0.72rem', color: '#38BDF8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={11} />
                        <span>{item.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ alignSelf: 'center', flexShrink: 0 }}>
                  <span className={`status-pill status-${item.status.replace('_', '-')}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: On-Ground Stall Allocation & Executive Collaterals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Stall Allocation Card */}
          <div className="partner-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0, marginBottom: '6px' }}>
              On-Ground Tech Stall & Booth
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0, marginBottom: '16px' }}>
              Designated zone for your corporate setup and interaction counters
            </p>

            <div 
              style={{ 
                background: 'rgba(56, 189, 248, 0.08)', 
                border: '1px solid rgba(56, 189, 248, 0.25)', 
                borderRadius: '12px', 
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginBottom: '14px'
              }}
            >
              <div 
                style={{ 
                  background: 'rgba(56, 189, 248, 0.2)', 
                  padding: '12px', 
                  borderRadius: '10px',
                  color: '#38BDF8',
                  fontWeight: 800,
                  fontSize: '1rem' 
                }}
              >
                {currentSponsor.stallNumber}
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                  {currentSponsor.stallLocation}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                  Includes 2x 15A Power Outlets • High-Speed 1Gbps Fiber Wi-Fi • 2 Spotlights • 1 Executive Table & 4 Chairs
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#A8B3C2', lineHeight: 1.5 }}>
              Setup Time Window: <strong>Oct 27, 2:00 PM – 9:00 PM</strong>. Student volunteers will be stationed at Gate 1 for freight escort.
            </div>
          </div>

          {/* Executive Downloads */}
          <div className="partner-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0, marginBottom: '6px' }}>
              Official Documents & Media Kit
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0, marginBottom: '14px' }}>
              Download certified collaterals, campus maps, and receipts
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { name: 'Sponsorship Agreement & Signed MOU', type: 'PDF Document', size: '2.4 MB' },
                { name: 'Festronix 2026 Vector Logo Pack & Brand Guidelines', type: 'ZIP Archive', size: '14.8 MB' },
                { name: 'Campus Blueprint & Stall Logistics Map', type: 'High-Res PDF', size: '5.1 MB' },
                { name: 'Dean SAC Official Letter of Appreciation', type: 'Certified PDF', size: '1.2 MB' }
              ].map(doc => (
                <div 
                  key={doc.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(21, 28, 44, 0.5)',
                    border: '1px solid rgba(199, 203, 212, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={16} color="#38BDF8" />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#FFFFFF' }}>{doc.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{doc.type} • {doc.size}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadDeck(doc.name)}
                    style={{
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38BDF8',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Download size={12} />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Assistance & Hotline Card */}
      <div 
        className="partner-card" 
        style={{ 
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
          borderColor: 'rgba(199, 203, 212, 0.2)' 
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px 0' }}>
              Direct SAC Corporate Hotline
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '0 0 14px 0', lineHeight: 1.5 }}>
              Need instant logistics changes, additional guest passes, or banner adjustments during the fest? Connect directly with the central desk.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#C7CBD4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PhoneCall size={14} color="#34D399" />
                <span>Executive Helpline: <strong>+91 98480 99112</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} color="#38BDF8" />
                <span>Email: <strong>sponsorship.festronix@vardhaman.org</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Query Box */}
          <form onSubmit={handleSendSupport}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
              Send Rapid Query / Special Request to Dean SAC:
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={supportMessage}
                onChange={e => setSupportMessage(e.target.value)}
                placeholder="e.g., Need 5 more VIP parking passes for our leadership team..."
                style={{
                  flex: 1,
                  background: 'rgba(8, 12, 22, 0.8)',
                  border: '1px solid rgba(199, 203, 212, 0.2)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0 18px',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Send size={14} />
                <span>Send</span>
              </button>
            </div>
            {supportSent && (
              <div style={{ color: '#34D399', fontSize: '0.78rem', marginTop: '6px', fontWeight: 600 }}>
                ✓ Request received by SAC Corporate Desk. A student coordinator will contact you shortly.
              </div>
            )}
          </form>
        </div>
      </div>

    </div>
  );
};
