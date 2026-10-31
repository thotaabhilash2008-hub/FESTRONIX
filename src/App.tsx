import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { HypedEventsSection } from './components/HypedEventsSection';
import { EventCatalog } from './components/EventCatalog';
import { DepartmentsSection } from './components/DepartmentsSection';
import { PrizesSection } from './components/PrizesSection';
import { Footer } from './components/Footer';
import { FullscreenIntro } from './components/FullscreenIntro';
import { EventDetailModal } from './components/EventDetailModal';
import { RegistrationModal } from './components/RegistrationModal';
import { DigitalPassModal } from './components/DigitalPassModal';
import { AuthModal } from './components/AuthModal';
import { MultiPassModal } from './components/MultiPassModal';
import { AdminPortal } from './components/admin/AdminPortal';
import { PublicSponsorsPage } from './components/PublicSponsorsPage';
import { GlitterBackground } from './components/GlitterBackground';
import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import { FestEvent, Registration, Announcement, User } from './types/festronix';
import { ScrollAnimationsProvider } from './components/animations';
import { KineticStage3D } from './components/3d';
import { AboutSection } from './components/AboutSection';
import { RegistrationCtaSection } from './components/RegistrationCtaSection';

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


  // User Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(AuthService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  // State
  const [events, setEvents] = useState<FestEvent[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Navigation & Filtering State
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [catalogViewMode, setCatalogViewMode] = useState<'all' | 'department' | 'category'>('all');

  // Intro video & modals
  const [isIntroOpen, setIsIntroOpen] = useState<boolean>(true);
  const [detailEvent, setDetailEvent] = useState<FestEvent | null>(null);
  const [registerEvent, setRegisterEvent] = useState<FestEvent | null>(null);
  const [isPassesModalOpen, setIsPassesModalOpen] = useState<boolean>(false);
  const [isMultiPassModalOpen, setIsMultiPassModalOpen] = useState<boolean>(false);

  // Pending actions after login
  const [pendingRegisterEvent, setPendingRegisterEvent] = useState<FestEvent | null>(null);
  const [pendingAction, setPendingAction] = useState<'multipass' | null>(null);
  const [authCustomNotice, setAuthCustomNotice] = useState<string | null>(null);

  const refreshData = async () => {
    // 1. Immediate sync from cached store (instant render)
    const evts = StorageService.getEvents();
    const regs = StorageService.getRegistrations();
    const anns = StorageService.getAnnouncements();

    setEvents(evts);
    setRegistrations(regs);
    setAnnouncements(anns);

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

  const handleOpenAdmin = () => {
    window.location.hash = '#admin';
    setIsAdminView(true);
  };

  const handleOpenSponsorsPage = () => {
    window.location.hash = '#sponsors';
    setIsSponsorsPageOpen(true);
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
    setRegisterEvent(null);
    refreshData();
    setIsPassesModalOpen(true);
  };

  const handleMultiPassSuccess = (newRegs: Registration[]) => {
    setIsMultiPassModalOpen(false);
    refreshData();
    setIsPassesModalOpen(true);
  };

  // Navigation handlers
  const handleNavigateExplore = () => {
    setSelectedDept('all');
    setSelectedCategory('all');
    setCatalogViewMode('all');
    const el = document.getElementById('events');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNavigateHyped = () => {
    const el = document.getElementById('hyped-events');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectDepartment = (deptCode: string) => {
    setSelectedDept(deptCode);
    setCatalogViewMode('department');
    const el = document.getElementById('events');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectCategory = (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    setCatalogViewMode('category');
    const el = document.getElementById('events');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartEventRegistration = (evt: FestEvent) => {
    if (!currentUser) {
      setPendingRegisterEvent(evt);
      setPendingAction(null);
      setDetailEvent(null);
      setAuthCustomNotice(`Sign in to continue registering for "${evt.title}". Your profile details will fill into the registration form.`);
      handleOpenAuth('signin');
      return;
    }

    setDetailEvent(null);
    setRegisterEvent(evt);
  };

  const handleStartMultiPass = () => {
    if (!currentUser) {
      setPendingAction('multipass');
      setPendingRegisterEvent(null);
      setAuthCustomNotice('Please sign in with your college credentials to book passes. Your student details will automatically auto-fill!');
      handleOpenAuth('signin');
    } else {
      setIsMultiPassModalOpen(true);
    }
  };

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    if (!currentUser && registerEvent && mode === 'signin') {
      setAuthCustomNotice(`Sign in to continue registering for "${registerEvent.title}". Your profile details will fill into the registration form.`);
    }
    setIsAuthModalOpen(true);
  };

  // Render Public Sponsors Page if in #sponsors or #partners view
  if (isSponsorsPageOpen) {
    return (
      <PublicSponsorsPage
        onBackToHome={handleBackFromSponsorsPage}
        onExploreEvents={() => {
          handleBackFromSponsorsPage();
          setTimeout(() => handleNavigateExplore(), 100);
        }}
        onRegisterNow={handleStartMultiPass}
      />
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
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Background Continuous Scroll-Driven 3D Kinetic Stage */}
      <KineticStage3D />

      {/* Background Glitter Starfield & Cyber Grid */}
      <GlitterBackground />
      <div className="glitter-stardust-layer" />
      <div className="cyber-grid-overlay" />

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
        onOpenPasses={() => setIsPassesModalOpen(true)}
        onOpenMultiPass={handleStartMultiPass}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onSignOut={() => AuthService.signOut()}
        announcements={announcements}
        passesCount={registrations.length}
        onNavigateExplore={handleNavigateExplore}
        onNavigateHyped={handleNavigateHyped}
        onSelectDepartment={handleSelectDepartment}
        onSelectCategory={handleSelectCategory}
        onOpenAdmin={handleOpenAdmin}
        onOpenSponsors={handleOpenSponsorsPage}
      />

      {/* Main Experience View */}
      <main style={{ flex: 1, position: 'relative', zIndex: 10 }}>
        {/* HERO SECTION: Cinematic Introduction */}
        <HeroSection
          onExploreEvents={handleNavigateExplore}
          onOpenIntro={() => setIsIntroOpen(true)}
          onRegisterNow={handleStartMultiPass}
        />

        {/* ABOUT FESTRONIX: Scroll-Driven Transformation */}
        <AboutSection />

        {/* TOP HYPED EVENTS (Ranked by Total Registrations) */}
        <HypedEventsSection
          events={events}
          onSelectEvent={evt => setDetailEvent(evt)}
          onRegisterEvent={handleStartEventRegistration}
          onExploreAll={handleNavigateExplore}
        />

        {/* EVENT CATALOG with Select by Department & Select by Event Category */}
        <EventCatalog
          events={events}
          onSelectEvent={evt => setDetailEvent(evt)}
          onRegisterEvent={handleStartEventRegistration}
          selectedDept={selectedDept}
          onSelectDept={setSelectedDept}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          activeViewMode={catalogViewMode}
          onSetActiveViewMode={setCatalogViewMode}
        />

        {/* Engineering Departments Overview */}
        <DepartmentsSection />

        {/* Mega Cash Prizes & Perks */}
        <PrizesSection />

        {/* Closing Registration CTA: Final Cinematic Moment */}
        <RegistrationCtaSection
          onOpenMultiPass={handleStartMultiPass}
          onExploreEvents={handleNavigateExplore}
        />
      </main>

      {/* Footer */}
      <Footer onOpenAdmin={handleOpenAdmin} />

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
          onOpenAuth={handleOpenAuth}
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
        onOpenAuth={() => handleOpenAuth('signin')}
        onSuccess={handleMultiPassSuccess}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        customNotice={authCustomNotice}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingRegisterEvent(null);
          setPendingAction(null);
          setAuthCustomNotice(null);
        }}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          setAuthCustomNotice(null);

          // Resume the selected event registration after authentication.
          if (pendingRegisterEvent) {
            const evt = pendingRegisterEvent;
            setPendingRegisterEvent(null);
            setRegisterEvent(evt);
          } else if (pendingAction === 'multipass') {
            setPendingAction(null);
            setIsMultiPassModalOpen(true);
          }
        }}
      />

      {isPassesModalOpen && (
        <DigitalPassModal
          registrations={registrations}
          currentUser={currentUser}
          onClose={() => setIsPassesModalOpen(false)}
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

