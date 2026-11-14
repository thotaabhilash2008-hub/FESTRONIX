import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { EventsGlimpseSection } from './components/EventsGlimpseSection';
import { DepartmentsSection } from './components/DepartmentsSection';
import { PrizesSection } from './components/PrizesSection';
import { Footer } from './components/Footer';
import { FullscreenIntro } from './components/FullscreenIntro';
import { EventDetailModal } from './components/EventDetailModal';
import { RegistrationModal } from './components/RegistrationModal';
import { DigitalPassModal } from './components/DigitalPassModal';
import { MultiPassModal } from './components/MultiPassModal';
import { AdminPortal } from './components/admin/AdminPortal';
import { PublicSponsorsPage } from './components/PublicSponsorsPage';
import { AllEventsPage } from './components/AllEventsPage';
import { PrivacyPolicyPage } from './components/legal/PrivacyPolicyPage';
import { TermsAndConditionsPage } from './components/legal/TermsAndConditionsPage';
import { RefundPolicyPage } from './components/legal/RefundPolicyPage';

import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import { FestEvent, Registration, Announcement, User } from './types/festronix';
import { isSupabaseConfigured } from './lib/supabase';
import { ScrollAnimationsProvider } from './components/animations';
import { KineticStage3D } from './components/3d';
import { AboutSection } from './components/AboutSection';
import { RegistrationCtaSection } from './components/RegistrationCtaSection';

const GUEST_PASS_CACHE_KEY = 'festronix_guest_pass_cache_v1';

const cachePassesOnDevice = (passes: Registration[]) => {
  if (typeof window === 'undefined' || passes.length === 0) return;

  try {
    const existing = JSON.parse(localStorage.getItem(GUEST_PASS_CACHE_KEY) || '[]');
    const byId = new Map<string, Registration>();
    [...(Array.isArray(existing) ? existing : []), ...passes].forEach(pass => {
      if (!pass?.id) return;
      // Do not cache large payment screenshots or one-time delivery tokens.
      byId.set(pass.id, { ...pass, paymentScreenshotUrl: undefined, emailDeliveryToken: undefined });
    });
    localStorage.setItem(GUEST_PASS_CACHE_KEY, JSON.stringify(Array.from(byId.values()).slice(-25)));

    const ids = Array.from(byId.keys()).slice(-25);
    localStorage.setItem('festronix_my_registered_pass_ids', JSON.stringify(ids));
    const latest = passes[passes.length - 1];
    if (latest.leaderEmail) localStorage.setItem('festronix_last_registered_email', latest.leaderEmail);
    if (latest.leaderRoll) localStorage.setItem('festronix_last_registered_roll', latest.leaderRoll);
    localStorage.setItem('festronix_last_pass_id', latest.id);
  } catch (error) {
    console.warn('Unable to cache guest pass on this device:', error);
  }
};

export const App: React.FC = () => {
  // Admin View State (supports #admin hash, /admin pathname, or portal button)
  const checkIsAdmin = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      hash === '#admin' ||
      path === '/admin' ||
      path === '/admin/' ||
      path.startsWith('/admin') ||
      search.includes('admin=true')
    );
  };

  const [isAdminView, setIsAdminView] = useState<boolean>(checkIsAdmin);

    // Public Sponsors Page View State (supports #sponsors, #partners, /sponsors, /partners)
  const checkIsSponsorsPage = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      hash === '#sponsors' ||
      hash === '#partners' ||
      path === '/sponsors' ||
      path === '/sponsors/' ||
      path === '/partners' ||
      path === '/partners/' ||
      path.startsWith('/sponsors') ||
      path.startsWith('/partners') ||
      search.includes('sponsors=true') ||
      search.includes('partners=true')
    );
  };

  const [isSponsorsPageOpen, setIsSponsorsPageOpen] = useState<boolean>(checkIsSponsorsPage);

  const checkIsPassesPage = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    return path === '/passes' || path === '/passes/';
  };

  const getRegistrationSlug = () => {
    if (typeof window === 'undefined') return '';
    const match = window.location.pathname.match(/^\/register\/([^/]+)\/?$/i);
    return match ? decodeURIComponent(match[1]) : '';
  };

  const checkIsAllEventsPage = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path === '/events' ||
      path === '/events/' ||
      hash === '#all-events' ||
      hash === '#events-all' ||
      search.includes('events=all')
    );
  };

  const checkIsPrivacyPage = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return (
      path === '/privacy' ||
      path === '/privacy/' ||
      path === '/privacy-policy' ||
      path === '/privacy-policy/' ||
      hash === '#privacy' ||
      hash === '#privacy-policy'
    );
  };

  const checkIsTermsPage = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return (
      path === '/terms' ||
      path === '/terms/' ||
      path === '/terms-and-conditions' ||
      path === '/terms-and-conditions/' ||
      hash === '#terms' ||
      hash === '#terms-and-conditions'
    );
  };

  const checkIsRefundPage = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return (
      path === '/refund' ||
      path === '/refund/' ||
      path === '/refund-policy' ||
      path === '/refund-policy/' ||
      hash === '#refund' ||
      hash === '#refund-policy'
    );
  };

  const [isPassesPageOpen, setIsPassesPageOpen] = useState<boolean>(checkIsPassesPage);
  const [isAllEventsPageOpen, setIsAllEventsPageOpen] = useState<boolean>(checkIsAllEventsPage);
  const [isPrivacyPageOpen, setIsPrivacyPageOpen] = useState<boolean>(checkIsPrivacyPage);
  const [isTermsPageOpen, setIsTermsPageOpen] = useState<boolean>(checkIsTermsPage);
  const [isRefundPageOpen, setIsRefundPageOpen] = useState<boolean>(checkIsRefundPage);
  const [isRegistrationPageOpen, setIsRegistrationPageOpen] = useState<boolean>(() => Boolean(getRegistrationSlug()));
  const [registrationSlug, setRegistrationSlug] = useState<string>(getRegistrationSlug);


  // User Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(AuthService.getCurrentUser());

  // State
  const [events, setEvents] = useState<FestEvent[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Intro video & modals
  const [isIntroOpen, setIsIntroOpen] = useState<boolean>(true);
  const [detailEvent, setDetailEvent] = useState<FestEvent | null>(null);
  const [registerEvent, setRegisterEvent] = useState<FestEvent | null>(null);
  const [isPassesModalOpen, setIsPassesModalOpen] = useState<boolean>(false);
  const [activePassId, setActivePassId] = useState<string | undefined>(undefined);
  const [isMultiPassModalOpen, setIsMultiPassModalOpen] = useState<boolean>(false);


  const refreshData = async () => {
    // The configured build is backend-only: never render an old browser cache
    // as if it were current public/admin data. Offline localStorage mode is
    // retained only for an explicitly unconfigured development build.
    if (isSupabaseConfigured()) {
      setEvents([]);
      setRegistrations([]);
      setAnnouncements([]);
    } else {
      setEvents(StorageService.getEvents());
      setRegistrations(StorageService.getRegistrations());
      setAnnouncements(StorageService.getAnnouncements());
    }

    // 2. Fetch fresh data from Supabase backend in parallel
    try {
      const [liveEvts, liveRegs, liveAnns] = await Promise.all([
        StorageService.fetchEvents(),
        StorageService.fetchRegistrations(),
        StorageService.fetchAnnouncements()
      ]);
      setEvents(liveEvts);
      setRegistrations(liveRegs);
      setAnnouncements(liveAnns);
    } catch (err) {
      console.warn('Background sync warning:', err);
    }
  };

  useEffect(() => {
    refreshData();

    // Reactive auth listener
    const handleAuthChange = (e: any) => {
      setCurrentUser(e.detail);
    };
    window.addEventListener('festronix:auth', handleAuthChange);

    // Reactive live data update listeners
    const handleEventsUpdate = (e: any) => setEvents(e.detail);
    const handleRegsUpdate = (e: any) => setRegistrations(e.detail);
    const handleAnnsUpdate = (e: any) => setAnnouncements(e.detail);

    window.addEventListener('festronix:events-updated', handleEventsUpdate);
    window.addEventListener('festronix:regs-updated', handleRegsUpdate);
    window.addEventListener('festronix:announcements-updated', handleAnnsUpdate);

    // Reactive listener for #admin, /admin, and back/forward navigation
    const handleLocationChange = () => {
      setIsAdminView(checkIsAdmin());
      setIsSponsorsPageOpen(checkIsSponsorsPage());
      setIsPassesPageOpen(checkIsPassesPage());
      setIsAllEventsPageOpen(checkIsAllEventsPage());
      setIsPrivacyPageOpen(checkIsPrivacyPage());
      setIsTermsPageOpen(checkIsTermsPage());
      setIsRefundPageOpen(checkIsRefundPage());
      const slug = getRegistrationSlug();
      setRegistrationSlug(slug);
      setIsRegistrationPageOpen(Boolean(slug));
    };
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('festronix:auth', handleAuthChange);
      window.removeEventListener('festronix:events-updated', handleEventsUpdate);
      window.removeEventListener('festronix:regs-updated', handleRegsUpdate);
      window.removeEventListener('festronix:announcements-updated', handleAnnsUpdate);
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  useEffect(() => {
    if (!isRegistrationPageOpen || !registrationSlug || registerEvent || events.length === 0) return;
    const cleanSlug = registrationSlug.toLowerCase();
    const event = events.find(item => item.slug.toLowerCase() === cleanSlug || item.id.toLowerCase() === cleanSlug);
    if (event) setRegisterEvent(event);
  }, [events, isRegistrationPageOpen, registrationSlug, registerEvent]);

  const handleOpenAdmin = () => {
    window.location.hash = '#admin';
    setIsAdminView(true);
  };

  const handleOpenSponsorsPage = () => {
    window.location.hash = '#sponsors';
    setIsSponsorsPageOpen(true);
  };

  const navigateHome = () => {
    window.history.pushState(null, '', '/');
    window.location.hash = '';
    setIsPassesPageOpen(false);
    setIsAllEventsPageOpen(false);
    setIsRegistrationPageOpen(false);
    setIsPrivacyPageOpen(false);
    setIsTermsPageOpen(false);
    setIsRefundPageOpen(false);
    setRegistrationSlug('');
    setRegisterEvent(null);
    setIsPassesModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPrivacyPage = () => {
    window.history.pushState(null, '', '/privacy');
    window.location.hash = '';
    setIsPrivacyPageOpen(true);
    setIsTermsPageOpen(false);
    setIsRefundPageOpen(false);
    setIsAllEventsPageOpen(false);
    setIsSponsorsPageOpen(false);
    setIsPassesPageOpen(false);
    setIsRegistrationPageOpen(false);
    setIsAdminView(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleOpenTermsPage = () => {
    window.history.pushState(null, '', '/terms');
    window.location.hash = '';
    setIsTermsPageOpen(true);
    setIsPrivacyPageOpen(false);
    setIsRefundPageOpen(false);
    setIsAllEventsPageOpen(false);
    setIsSponsorsPageOpen(false);
    setIsPassesPageOpen(false);
    setIsRegistrationPageOpen(false);
    setIsAdminView(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleOpenRefundPage = () => {
    window.history.pushState(null, '', '/refund');
    window.location.hash = '';
    setIsRefundPageOpen(true);
    setIsPrivacyPageOpen(false);
    setIsTermsPageOpen(false);
    setIsAllEventsPageOpen(false);
    setIsSponsorsPageOpen(false);
    setIsPassesPageOpen(false);
    setIsRegistrationPageOpen(false);
    setIsAdminView(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleBackFromLegalPage = () => {
    window.history.pushState(null, '', '/');
    window.location.hash = '';
    setIsPrivacyPageOpen(false);
    setIsTermsPageOpen(false);
    setIsRefundPageOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleOpenAllEventsPage = () => {
    window.history.pushState(null, '', '/events');
    window.location.hash = '';
    setIsAllEventsPageOpen(true);
    setIsSponsorsPageOpen(false);
    setIsPassesPageOpen(false);
    setIsRegistrationPageOpen(false);
    setIsAdminView(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleBackFromAllEventsPage = () => {
    if (window.location.pathname.toLowerCase().startsWith('/events')) {
      window.history.pushState(null, '', '/');
    }
    window.location.hash = '';
    setIsAllEventsPageOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleOpenPassesPage = (passId?: string) => {
    const suffix = passId ? `?registration=${encodeURIComponent(passId)}` : '';
    window.history.pushState(null, '', `/passes${suffix}`);
    setActivePassId(passId);
    setIsPassesPageOpen(true);
    setIsAllEventsPageOpen(false);
    setIsRegistrationPageOpen(false);
    setIsPassesModalOpen(false);
  };

  const handleBackFromSponsorsPage = () => {
    if (
      window.location.pathname.toLowerCase().startsWith('/sponsors') ||
      window.location.pathname.toLowerCase().startsWith('/partners')
    ) {
      window.history.pushState(null, '', '/');
    }
    window.location.hash = '';
    setIsSponsorsPageOpen(false);
    refreshData();
  };

  const handleBackFromAdmin = () => {
    if (window.location.pathname.toLowerCase().startsWith('/admin')) {
      window.history.pushState(null, '', '/');
    }
    window.location.hash = '';
    setIsAdminView(false);
    refreshData();
  };

  const handleRegistrationSuccess = (newReg: Registration) => {
    cachePassesOnDevice([newReg]);
    setRegisterEvent(null);
    refreshData();
    handleOpenPassesPage(newReg.id);
  };

  const handleMultiPassSuccess = (newRegs: Registration[]) => {
    cachePassesOnDevice(newRegs);
    setIsMultiPassModalOpen(false);
    refreshData();
    handleOpenPassesPage(newRegs[newRegs.length - 1]?.id);
  };

  // Navigation handlers
  const handleNavigateExplore = () => {
    const el = document.getElementById('events');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNavigateHyped = () => {
    const el = document.getElementById('hyped-events');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartEventRegistration = (evt: FestEvent) => {
    setDetailEvent(null);
    window.history.pushState(null, '', `/register/${encodeURIComponent(evt.slug || evt.id)}`);
    setRegistrationSlug(evt.slug || evt.id);
    setIsRegistrationPageOpen(true);
    setRegisterEvent(evt);
  };

  const handleStartMultiPass = () => {
    setIsMultiPassModalOpen(true);
  };

  const activePassLookup = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('registration') || activePassId
    : activePassId;

  // Render Legal Pages (/privacy, /terms, /refund)
  if (isPrivacyPageOpen) {
    return (
      <PrivacyPolicyPage
        onBackToHome={handleBackFromLegalPage}
        onNavigateToTerms={handleOpenTermsPage}
        onNavigateToRefund={handleOpenRefundPage}
      />
    );
  }

  if (isTermsPageOpen) {
    return (
      <TermsAndConditionsPage
        onBackToHome={handleBackFromLegalPage}
        onNavigateToPrivacy={handleOpenPrivacyPage}
        onNavigateToRefund={handleOpenRefundPage}
      />
    );
  }

  if (isRefundPageOpen) {
    return (
      <RefundPolicyPage
        onBackToHome={handleBackFromLegalPage}
        onNavigateToPrivacy={handleOpenPrivacyPage}
        onNavigateToTerms={handleOpenTermsPage}
      />
    );
  }

  // Render Public Sponsors Page if in #sponsors or #partners view
  if (isSponsorsPageOpen) {
    return (
      <PublicSponsorsPage
        onBackToHome={handleBackFromSponsorsPage}
        onExploreEvents={handleOpenAllEventsPage}
        onRegisterNow={handleStartMultiPass}
      />
    );
  }

  if (isAllEventsPageOpen && !isRegistrationPageOpen && !isPassesPageOpen && !isAdminView) {
    return (
      <>
        <AllEventsPage
          events={events}
          passesCount={registrations.length}
          onBackToHome={handleBackFromAllEventsPage}
          onSelectEvent={evt => setDetailEvent(evt)}
          onRegisterEvent={handleStartEventRegistration}
          onOpenMultiPass={handleStartMultiPass}
          onOpenPasses={() => handleOpenPassesPage()}
          onOpenAdmin={handleOpenAdmin}
          onOpenSponsors={handleOpenSponsorsPage}
        />

        <EventDetailModal
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onRegister={handleStartEventRegistration}
        />

        <MultiPassModal
          isOpen={isMultiPassModalOpen}
          onClose={() => setIsMultiPassModalOpen(false)}
          events={events}
          currentUser={currentUser}
          onSuccess={handleMultiPassSuccess}
        />
      </>
    );
  }

  if (isPassesPageOpen) {
    return (
      <DigitalPassModal
        registrations={registrations}
        currentUser={currentUser}
        activePassId={activePassLookup}
        pageMode
        onClose={navigateHome}
        onBrowseEvents={handleOpenAllEventsPage}
        onOpenMultiPass={() => {
          navigateHome();
          setIsMultiPassModalOpen(true);
        }}
      />
    );
  }

  if (isRegistrationPageOpen) {
    return registerEvent ? (
      <RegistrationModal
        event={registerEvent}
        currentUser={currentUser}
        pageMode
        onClose={navigateHome}
        onSuccess={handleRegistrationSuccess}
        onOpenMultiPass={() => {
          navigateHome();
          setIsMultiPassModalOpen(true);
        }}
      />
    ) : (
      <div className="registration-page-shell registration-page-loading">
        <div>
          <span className="pass-page-kicker"><span className="live-dot" /> LOADING LIVE EVENT</span>
          <h1>Preparing registration desk…</h1>
          <p>Loading the current event details from the backend.</p>
        </div>
      </div>
    );
  }

  // Render Admin Console if in #admin view
  if (isAdminView) {
    return (
      <AdminPortal onBackToFest={handleBackFromAdmin} />
    );
  }

  return (
    <ScrollAnimationsProvider enableSmoothScroll={!isIntroOpen}>
      <div className="public-site-shell" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Background Continuous Scroll-Driven 3D Kinetic Stage */}
      <KineticStage3D />
      {/* Subtle ambient depth */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: 'radial-gradient(ellipse 70% 35% at 50% 0%, rgba(30, 58, 138, 0.16) 0%, transparent 80%)'
        }}
      />

      {/* FULLSCREEN INTRO VIDEO: Edge-to-edge with no headings, borders, or frames */}
      <FullscreenIntro
        isOpen={isIntroOpen}
        onFinish={() => setIsIntroOpen(false)}
      />

      {/* Top Margin Obsidian Bar: Ensures 100% solid obsidian background above the floating navbar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '14px',
          backgroundColor: '#080C16',
          zIndex: 49,
          pointerEvents: 'none'
        }}
      />

      {/* Floating Modern Navbar */}
      <Navbar
        onOpenIntro={() => setIsIntroOpen(true)}
        onOpenPasses={() => handleOpenPassesPage()}
        onOpenMultiPass={handleStartMultiPass}
        announcements={announcements}
        passesCount={registrations.length}
        onNavigateExplore={handleNavigateExplore}
        onNavigateHyped={handleNavigateHyped}
        onOpenAdmin={handleOpenAdmin}
        onOpenSponsors={handleOpenSponsorsPage}
        onOpenAllEvents={handleOpenAllEventsPage}
      />

      {/* Main Experience View */}
      <main className="public-main" style={{ flex: 1, position: 'relative', zIndex: 10 }}>
        {/* HERO SECTION: Cinematic Introduction */}
        <HeroSection
          onExploreEvents={handleNavigateExplore}
          onViewAllEvents={handleOpenAllEventsPage}
          onOpenIntro={() => setIsIntroOpen(true)}
          onRegisterNow={handleStartMultiPass}
        />

        {/* ABOUT FESTRONIX: Scroll-Driven Transformation */}
        <AboutSection />

        {/* UNIFIED EVENTS GLIMPSE: Popular, Day 1, Day 2 Infinite Marquees */}
        <EventsGlimpseSection
          events={events}
          onSelectEvent={evt => setDetailEvent(evt)}
          onRegisterEvent={handleStartEventRegistration}
          onViewAllEvents={handleOpenAllEventsPage}
        />

        {/* Engineering Departments Overview */}
        <DepartmentsSection />

        {/* Mega Cash Prizes & Perks */}
        <PrizesSection />

        {/* Closing Registration CTA: Final Cinematic Moment */}
        <RegistrationCtaSection
          onOpenMultiPass={handleStartMultiPass}
          onExploreEvents={handleOpenAllEventsPage}
        />
      </main>

      {/* Footer */}
      <Footer
        onOpenAdmin={handleOpenAdmin}
        onOpenSponsors={handleOpenSponsorsPage}
        onOpenPrivacy={handleOpenPrivacyPage}
        onOpenTerms={handleOpenTermsPage}
        onOpenRefund={handleOpenRefundPage}
      />

      {/* User Modals */}
      <EventDetailModal
        event={detailEvent}
        onClose={() => setDetailEvent(null)}
        onRegister={handleStartEventRegistration}
      />

      {registerEvent && (
        <RegistrationModal
          event={registerEvent}
          currentUser={currentUser}
          onClose={() => setRegisterEvent(null)}
          onSuccess={handleRegistrationSuccess}
          onOpenMultiPass={() => {
            setRegisterEvent(null);
            handleStartMultiPass();
          }}
        />
      )}

      <MultiPassModal
        isOpen={isMultiPassModalOpen}
        onClose={() => setIsMultiPassModalOpen(false)}
        events={events}
        currentUser={currentUser}
        onSuccess={handleMultiPassSuccess}
      />


      {isPassesModalOpen && (
        <DigitalPassModal
          registrations={registrations}
          currentUser={currentUser}
          activePassId={activePassId}
          onClose={() => {
            setIsPassesModalOpen(false);
            setActivePassId(undefined);
          }}
          onBrowseEvents={handleNavigateExplore}
          onOpenMultiPass={() => {
            setIsPassesModalOpen(false);
            setIsMultiPassModalOpen(true);
          }}
        />
      )}
      </div>
    </ScrollAnimationsProvider>
  );
};

export default App;

