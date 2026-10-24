import React, { useState } from 'react';
import { 
  Award, 
  Copy, 
  Check, 
  Share2, 
  Trophy, 
  Users, 
  DollarSign, 
  Zap, 
  Flame, 
  Download, 
  Gift, 
  TrendingUp, 
  ExternalLink, 
  PlusCircle, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  AmbassadorProfile, 
  AMBASSADOR_PROFILES, 
  AMBASSADOR_MILESTONES, 
  AMBASSADOR_LEADERBOARD, 
  MARKETING_TEMPLATES 
} from './partnerData';

interface AmbassadorDashboardProps {
  onBackToFest: () => void;
}

export const AmbassadorDashboard: React.FC<AmbassadorDashboardProps> = ({ onBackToFest }) => {
  const [selectedAmbassadorId, setSelectedAmbassadorId] = useState<string>('amb_aditya');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);

  // Offline registration state
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [offlineName, setOfflineName] = useState<string>('');
  const [offlineCollege, setOfflineCollege] = useState<string>('');
  const [offlineEvent, setOfflineEvent] = useState<string>('CodeSprint 2026');
  const [offlineSuccess, setOfflineSuccess] = useState<boolean>(false);

  // Profiles list with local mutations
  const [profiles, setProfiles] = useState<AmbassadorProfile[]>(AMBASSADOR_PROFILES);

  const currentAmbassador = profiles.find(p => p.id === selectedAmbassadorId) || profiles[0];
  const referralUrl = `https://festronix-fawn.vercel.app/?ref=${currentAmbassador.referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentAmbassador.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `⚡ *FESTRONIX 2026 @ Vardhaman College of Engineering!*\n🏆 ₹5,00,000+ Prize Pool across 30+ Flagship Arenas.\n\n🎟️ Register with my exclusive Campus Ambassador link for verified cryptographic pass & fast-track check-in:\n👉 ${referralUrl}\n\nUse Referral Code: *${currentAmbassador.referralCode}*`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCopyTemplate = (tplId: string, templateText: string) => {
    const customized = templateText.replace(/{CODE}/g, currentAmbassador.referralCode);
    navigator.clipboard.writeText(customized);
    setCopiedTemplateId(tplId);
    setTimeout(() => setCopiedTemplateId(null), 2500);
  };

  const handleLogOfflineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineName.trim()) return;

    const newRef = {
      id: `off-${Date.now()}`,
      studentName: offlineName.trim(),
      college: offlineCollege.trim() || currentAmbassador.college,
      eventsRegistered: [offlineEvent],
      date: 'Just Now',
      amount: 400
    };

    setProfiles(prev => 
      prev.map(p => {
        if (p.id === currentAmbassador.id) {
          return {
            ...p,
            totalReferrals: p.totalReferrals + 1,
            totalRevenue: p.totalRevenue + 400,
            points: p.points + 100,
            stipendEarned: p.stipendEarned + 80,
            recentReferrals: [newRef, ...p.recentReferrals]
          };
        }
        return p;
      })
    );

    setOfflineSuccess(true);
    setTimeout(() => {
      setOfflineSuccess(false);
      setShowLogModal(false);
      setOfflineName('');
      setOfflineCollege('');
    }, 2000);
  };

  const handleDownloadBanner = (bannerName: string) => {
    const blob = new Blob([
      `FESTRONIX 2026 AMBASSADOR MEDIA KIT\nBanner: ${bannerName}\nAmbassador: ${currentAmbassador.name}\nReferral Code: ${currentAmbassador.referralCode}\nLink: ${referralUrl}\nResolution: 1080x1920 HD / 300 DPI\nIssued by: Student Affairs Council (SAC) Vardhaman`
    ], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Festronix_${bannerName.replace(/\s+/g, '_')}_${currentAmbassador.referralCode}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Top Header & Ambassador Switcher */}
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
            <span style={{ fontSize: '0.78rem', color: '#C084FC', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Student Leadership & Outreach Program
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Campus Ambassador Hub
          </h1>
        </div>

        {/* Ambassador Quick Profile Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Switch Profile:</span>
          {profiles.map(amb => (
            <button
              key={amb.id}
              onClick={() => setSelectedAmbassadorId(amb.id)}
              className={`profile-chip ${selectedAmbassadorId === amb.id ? 'active-ambassador' : ''}`}
            >
              <span 
                style={{ 
                  width: '20px', 
                  height: '20px', 
                  borderRadius: '50%', 
                  background: 'rgba(168, 85, 247, 0.3)', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 800
                }}
              >
                {amb.avatar}
              </span>
              <span>{amb.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Hero Card: Ambassador Identity & Share Tools */}
      <div 
        className="partner-card" 
        style={{ 
          marginBottom: '24px', 
          background: 'linear-gradient(135deg, rgba(28, 16, 48, 0.95) 0%, rgba(13, 16, 32, 0.98) 100%)',
          borderColor: 'rgba(168, 85, 247, 0.3)' 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          
          {/* Left: Avatar & Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div 
              style={{ 
                width: '76px', 
                height: '76px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)', 
                border: '2px solid rgba(255, 255, 255, 0.25)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '1.6rem',
                fontWeight: 800,
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
              }}
            >
              {currentAmbassador.avatar}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  {currentAmbassador.name}
                </h2>
                <span 
                  style={{ 
                    padding: '3px 10px', 
                    borderRadius: '9999px', 
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: '#C084FC',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                  }}
                >
                  {currentAmbassador.badge}
                </span>
                <span 
                  style={{ 
                    padding: '3px 10px', 
                    borderRadius: '9999px', 
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#FBBF24',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  Rank #{currentAmbassador.rank} Overall
                </span>
              </div>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', margin: '0 0 10px 0' }}>
                {currentAmbassador.college}
              </p>
              
              {/* Code Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    background: 'rgba(0, 0, 0, 0.4)', 
                    border: '1px dashed rgba(168, 85, 247, 0.5)', 
                    padding: '6px 12px', 
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#F3F0EA'
                  }}
                >
                  <span>{currentAmbassador.referralCode}</span>
                  <button
                    onClick={handleCopyCode}
                    style={{ background: 'none', border: 'none', color: '#C084FC', cursor: 'pointer', display: 'flex', padding: 0 }}
                    title="Copy code"
                  >
                    {copiedCode ? <Check size={14} color="#34D399" /> : <Copy size={14} />}
                  </button>
                </div>

                <button
                  onClick={handleCopyLink}
                  style={{
                    background: 'rgba(168, 85, 247, 0.2)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {copiedLink ? <Check size={14} color="#34D399" /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Referral Link'}</span>
                </button>

                <button
                  onClick={handleWhatsAppShare}
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Share2 size={14} />
                  <span>Share on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action: Log Offline Peer Registration */}
          <div>
            <button
              onClick={() => setShowLogModal(true)}
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                padding: '12px 18px',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)'
              }}
            >
              <PlusCircle size={16} />
              <span>Log Offline Registration</span>
            </button>
          </div>

        </div>
      </div>

      {/* 4 Performance Metric Cards */}
      <div className="partner-grid-4" style={{ marginBottom: '28px' }}>
        <div className="partner-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Total Registrations</span>
            <Users size={18} color="#C084FC" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF' }}>
            {currentAmbassador.totalReferrals} Students
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34D399', marginTop: '4px' }}>
            Across 14 Flagship Arenas
          </div>
        </div>

        <div className="partner-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Stipend Earned</span>
            <DollarSign size={18} color="#34D399" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34D399' }}>
            ₹{currentAmbassador.stipendEarned.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
            Direct UPI Payout on Day 2
          </div>
        </div>

        <div className="partner-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Referral Points</span>
            <Zap size={18} color="#FBBF24" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FBBF24' }}>
            {currentAmbassador.points.toLocaleString()} Pts
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
            100 Pts per Pass Sold
          </div>
        </div>

        <div className="partner-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Gross Turnover</span>
            <TrendingUp size={18} color="#38BDF8" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF' }}>
            ₹{currentAmbassador.totalRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '4px' }}>
            Fest Value Influenced
          </div>
        </div>
      </div>

      {/* Two Column Layout: Milestone Rewards & Marketing Kit */}
      <div className="partner-grid-2" style={{ marginBottom: '28px' }}>
        
        {/* Left: Milestone Progression & Perks */}
        <div className="partner-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Milestone Rewards & Perks
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                Unlock exclusive goodies, free VIP passes, and formal Dean recommendations
              </p>
            </div>
            <Gift size={20} color="#C084FC" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {AMBASSADOR_MILESTONES.map(mile => {
              const isAchieved = currentAmbassador.totalReferrals >= mile.targetReferrals;
              return (
                <div 
                  key={mile.id}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: isAchieved ? 'rgba(168, 85, 247, 0.1)' : 'rgba(21, 28, 44, 0.4)',
                    border: '1px solid',
                    borderColor: isAchieved ? 'rgba(168, 85, 247, 0.35)' : 'rgba(199, 203, 212, 0.08)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <div style={{ marginTop: '2px' }}>
                    {isAchieved ? (
                      <CheckCircle2 size={18} color="#34D399" />
                    ) : (
                      <div 
                        style={{ 
                          width: '18px', 
                          height: '18px', 
                          borderRadius: '50%', 
                          border: '2px solid #64748B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          color: '#64748B'
                        }}
                      >
                        {mile.targetReferrals}
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isAchieved ? '#FFFFFF' : '#94A3B8' }}>
                        {mile.rewardTitle}
                      </div>
                      <span 
                        style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          background: isAchieved ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          color: isAchieved ? '#34D399' : '#94A3B8'
                        }}
                      >
                        {isAchieved ? 'UNLOCKED' : `${mile.targetReferrals} Referrals Needed`}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '4px', lineHeight: 1.4 }}>
                      {mile.perksDescription}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Marketing Toolkit & Promo Collaterals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Copy-Paste Promo Broadcasts */}
          <div className="partner-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0, marginBottom: '6px' }}>
              Ambassador Promo Broadcast Kit
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0, marginBottom: '14px' }}>
              One-click pre-composed promotional copy formatted for group broadcasts
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {MARKETING_TEMPLATES.map(tpl => (
                <div 
                  key={tpl.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(21, 28, 44, 0.6)',
                    border: '1px solid rgba(199, 203, 212, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>
                      {tpl.channel}
                    </div>
                    <button
                      onClick={() => handleCopyTemplate(tpl.id, tpl.text)}
                      style={{
                        background: 'rgba(168, 85, 247, 0.15)',
                        border: '1px solid rgba(168, 85, 247, 0.35)',
                        color: '#C084FC',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedTemplateId === tpl.id ? <Check size={12} color="#34D399" /> : <Copy size={12} />}
                      <span>{copiedTemplateId === tpl.id ? 'Copied!' : 'Copy Text'}</span>
                    </button>
                  </div>
                  <div 
                    style={{ 
                      fontSize: '0.75rem', 
                      color: '#94A3B8', 
                      background: 'rgba(0,0,0,0.3)', 
                      padding: '8px', 
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-line',
                      maxHeight: '70px',
                      overflowY: 'auto'
                    }}
                  >
                    {tpl.text.replace(/{CODE}/g, currentAmbassador.referralCode)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Download Official Graphics */}
          <div className="partner-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0, marginBottom: '6px' }}>
              Download High-Res Posters & Banners
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0, marginBottom: '14px' }}>
              Official promotional graphic assets to blast on your campus channels
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { name: 'Instagram Story (9:16 Vertical)', size: '4.2 MB' },
                { name: 'WhatsApp Status Banner (HD)', size: '3.1 MB' },
                { name: 'College Notice Board Poster (A3 Print)', size: '12.4 MB' },
                { name: 'Fest Schedule & Arenas Deck', size: '6.8 MB' }
              ].map(item => (
                <button
                  key={item.name}
                  onClick={() => handleDownloadBanner(item.name)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '10px',
                    textAlign: 'left',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
                    e.currentTarget.style.background = 'rgba(168, 85, 247, 0.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{item.name}</span>
                    <Download size={13} color="#C084FC" />
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{item.size} • Ready to Print</span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* State-Wide Ambassador Leaderboard */}
      <div className="partner-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              State-Wide Ambassador Leaderboard
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
              Live rankings across Telangana & Andhra Pradesh engineering colleges
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FBBF24', fontSize: '0.82rem', fontWeight: 700 }}>
            <Trophy size={16} />
            <span>Top 3 Qualify for Grand Cash Felicitation</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(199, 203, 212, 0.12)', color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <th style={{ padding: '10px 14px' }}>Rank</th>
                <th style={{ padding: '10px 14px' }}>Campus Ambassador</th>
                <th style={{ padding: '10px 14px' }}>Engineering College</th>
                <th style={{ padding: '10px 14px' }}>Tier Badge</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Registrations</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Points</th>
              </tr>
            </thead>
            <tbody>
              {AMBASSADOR_LEADERBOARD.map(item => {
                const isUser = item.name === currentAmbassador.name;
                return (
                  <tr 
                    key={item.rank}
                    style={{
                      borderBottom: '1px solid rgba(199, 203, 212, 0.06)',
                      background: isUser ? 'rgba(168, 85, 247, 0.12)' : 'transparent',
                      fontWeight: isUser ? 700 : 500
                    }}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      {item.rank === 1 ? (
                        <span style={{ color: '#FBBF24', fontWeight: 800 }}>🥇 #1</span>
                      ) : item.rank === 2 ? (
                        <span style={{ color: '#E2E8F0', fontWeight: 800 }}>🥈 #2</span>
                      ) : item.rank === 3 ? (
                        <span style={{ color: '#B45309', fontWeight: 800 }}>🥉 #3</span>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>#{item.rank}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#FFFFFF' }}>
                      {item.name} {isUser && <span style={{ color: '#C084FC', fontSize: '0.72rem' }}>(You)</span>}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#94A3B8' }}>
                      {item.college}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span 
                        style={{ 
                          padding: '3px 8px', 
                          borderRadius: '9999px', 
                          background: 'rgba(255, 255, 255, 0.05)', 
                          fontSize: '0.72rem',
                          color: '#C7CBD4'
                        }}
                      >
                        {item.badge}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#34D399', fontWeight: 700 }}>
                      {item.referrals}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#FBBF24', fontWeight: 700 }}>
                      {item.points.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Log Offline Registration */}
      {showLogModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 12, 22, 0.88)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div 
            className="partner-card" 
            style={{ 
              maxWidth: '480px', 
              width: '100%', 
              background: '#0E1424', 
              border: '1px solid rgba(168, 85, 247, 0.4)' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Log Offline Peer Registration
              </h3>
              <button 
                onClick={() => setShowLogModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '16px' }}>
              Enter student details who registered through your offline campus desk or direct cash payment. Referral points and stipend will credit immediately!
            </p>

            <form onSubmit={handleLogOfflineSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.75rem', color: '#C7CBD4', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Student Full Name:
                </label>
                <input
                  type="text"
                  required
                  value={offlineName}
                  onChange={e => setOfflineName(e.target.value)}
                  placeholder="e.g. S. Karthik"
                  style={{
                    width: '100%',
                    background: 'rgba(21, 28, 44, 0.8)',
                    border: '1px solid rgba(199, 203, 212, 0.2)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.75rem', color: '#C7CBD4', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  College & Department:
                </label>
                <input
                  type="text"
                  value={offlineCollege}
                  onChange={e => setOfflineCollege(e.target.value)}
                  placeholder={`e.g. ${currentAmbassador.college}`}
                  style={{
                    width: '100%',
                    background: 'rgba(21, 28, 44, 0.8)',
                    border: '1px solid rgba(199, 203, 212, 0.2)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '0.75rem', color: '#C7CBD4', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Flagship Event Chosen:
                </label>
                <select
                  value={offlineEvent}
                  onChange={e => setOfflineEvent(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(21, 28, 44, 0.95)',
                    border: '1px solid rgba(199, 203, 212, 0.2)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value="CodeSprint 2026">CodeSprint 2026 (Algorithmic Speed)</option>
                  <option value="RoboWars National Battle">RoboWars Heavyweight Clash</option>
                  <option value="Autonomous Drone GP">Autonomous Drone GP</option>
                  <option value="NeuroHacks AI Hackathon">NeuroHacks 36-Hr AI Hackathon</option>
                  <option value="All-Access VIP Fest Pass">All-Access VIP Fest Pass</option>
                </select>
              </div>

              {offlineSuccess ? (
                <div style={{ color: '#34D399', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', padding: '10px' }}>
                  ✓ Registration successfully verified and credited to {currentAmbassador.referralCode}!
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowLogModal(false)}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#C7CBD4',
                      borderRadius: '8px',
                      padding: '10px',
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
                      flex: 1,
                      background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)',
                      border: 'none',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Submit & Credit Points
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
