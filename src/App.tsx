import React, { lazy, Suspense, useState, useEffect } from 'react';
import { HeroSection } from './components/HeroSection';
const EventDetailModal = lazy(() => import('./components/EventDetailModal').then(module => ({ default: module.EventDetailModal })));
const RegistrationModal = lazy(() => import('./components/RegistrationModal').then(module => ({ default: module.RegistrationModal })));
const DigitalPassModal = lazy(() => import('./components/DigitalPassModal').then(module => ({ default: module.DigitalPassModal })));
const MultiPassModal = lazy(() => import('./components/MultiPassModal').then(module => ({ default: module.MultiPassModal })));
const AdminPortal = lazy(() => import('./components/admin/AdminPortal').then(module => ({ default: module.AdminPortal })));
const PublicSponsorsPage = lazy(() => import('./components/PublicSponsorsPage').then(module => ({ default: module.PublicSponsorsPage })));
const AllEventsPage = lazy(() => import('./components/AllEventsPage'));
const PrivacyPolicyPage = lazy(() => import('./components/legal/PrivacyPolicyPage').then(module => ({ default: module.PrivacyPolicyPage })));
const TermsAndConditionsPage = lazy(() => import('./components/legal/TermsAndConditionsPage').then(module => ({ default: module.TermsAndConditionsPage })));
const RefundPolicyPage = lazy(() => import('./components/legal/RefundPolicyPage').then(module => ({ default: module.RefundPolicyPage })));

import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import { FestEvent, Registration, User } from './types/festronix';
import { isSupabaseConfigured } from './lib/supabase';
import { ScrollAnimationsProvider } from './components/animations';

const GUEST_PASS_CACHE_KEY = 'festronix_guest_pass_cache_v1';
const COMING_SOON_ONLY = true;

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

const ComingSoonPage: React.FC = () => (
  <ScrollAnimationsProvider>
    <div
      className="public-site-shell coming-soon-shell"
      style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: 'radial-gradient(ellipse 70% 35% at 50% 0%, rgba(30, 58, 138, 0.16) 0%, transparent 80%)'
        }}
      />
      <main
        className="public-main coming-soon-main"
        style={{ flex: 1, position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column' }}
      >
        <HeroSection />
      </main>
    </div>
  </ScrollAnimationsProvider>
);

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

  // Modal state
  const [detailEvent, setDetailEvent] = useState<FestEvent | null>(null);
  const [registerEvent, setRegisterEvent] = useState<FestEvent | null>(null);
  const [activePassId, setActivePassId] = useState<string | undefined>(undefined);
  const [isMultiPassModalOpen, setIsMultiPassModalOpen] = useState<boolean>(false);

  const refreshData = async () => {
    // The configured build is backend-only: never render an old browser cache
    // as if it were current public/admin data. Offline localStorage mode is
    // retained only for an explicitly unconfigured development build.
    if (isSupabaseConfigured()) {
      setEvents([]);
      setRegistrations([]);
    } else {
      setEvents(StorageService.getEvents());
      setRegistrations(StorageService.getRegistrations());
    }

    // 2. Fetch fresh data from Supabase backend in parallel
    try {
      const [liveEvts, liveRegs] = await Promise.all([
        StorageService.fetchEvents(),
        StorageService.fetchRegistrations()
      ]);
      setEvents(liveEvts);
      setRegistrations(liveRegs);
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
    window.addEventListener('festronix:events-updated', handleEventsUpdate);
    window.addEventListener('festronix:regs-updated', handleRegsUpdate);

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
  if (!COMING_SOON_ONLY && isPrivacyPageOpen) {
    return (
      <Suspense fallback={null}>
        <PrivacyPolicyPage
          onBackToHome={handleBackFromLegalPage}
          onNavigateToTerms={handleOpenTermsPage}
          onNavigateToRefund={handleOpenRefundPage}
        />
      </Suspense>
    );
  }

  if (!COMING_SOON_ONLY && isTermsPageOpen) {
    return (
      <Suspense fallback={null}>
        <TermsAndConditionsPage
          onBackToHome={handleBackFromLegalPage}
          onNavigateToPrivacy={handleOpenPrivacyPage}
          onNavigateToRefund={handleOpenRefundPage}
        />
      </Suspense>
    );
  }

  if (!COMING_SOON_ONLY && isRefundPageOpen) {
    return (
      <Suspense fallback={null}>
        <RefundPolicyPage
          onBackToHome={handleBackFromLegalPage}
          onNavigateToPrivacy={handleOpenPrivacyPage}
          onNavigateToTerms={handleOpenTermsPage}
        />
      </Suspense>
    );
  }

  // Render Public Sponsors Page if in #sponsors or #partners view
  if (!COMING_SOON_ONLY && isSponsorsPageOpen) {
    return (
      <Suspense fallback={null}>
        <PublicSponsorsPage
          onBackToHome={handleBackFromSponsorsPage}
          onExploreEvents={handleOpenAllEventsPage}
          onRegisterNow={handleStartMultiPass}
        />
      </Suspense>
    );
  }

  if (!COMING_SOON_ONLY && isAllEventsPageOpen && !isRegistrationPageOpen && !isPassesPageOpen && !isAdminView) {
    return (
      <Suspense fallback={null}>
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

        {detailEvent && (
          <EventDetailModal
            event={detailEvent}
            onClose={() => setDetailEvent(null)}
            onRegister={handleStartEventRegistration}
          />
        )}

        {isMultiPassModalOpen && (
          <MultiPassModal
            isOpen={isMultiPassModalOpen}
            onClose={() => setIsMultiPassModalOpen(false)}
            events={events}
            currentUser={currentUser}
            onSuccess={handleMultiPassSuccess}
          />
        )}
      </Suspense>
    );
  }

  if (!COMING_SOON_ONLY && isPassesPageOpen) {
    return (
      <Suspense fallback={null}>
        <DigitalPassModal
          registrations={registrations}
          events={events}
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
      </Suspense>
    );
  }

  if (!COMING_SOON_ONLY && isRegistrationPageOpen) {
    return registerEvent ? (
      <Suspense fallback={null}>
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
      </Suspense>
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
  if (!COMING_SOON_ONLY && isAdminView) {
    return (
      <Suspense fallback={null}>
        <AdminPortal onBackToFest={handleBackFromAdmin} />
      </Suspense>
    );
  }

  return <ComingSoonPage />;
};

export default App;

