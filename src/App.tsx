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
import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import { FestEvent, Registration, Announcement, User } from './types/festronix';

export const App: React.FC = () => {
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

  const refreshData = () => {
    const evts = StorageService.getEvents();
    const regs = StorageService.getRegistrations();
    const anns = StorageService.getAnnouncements();

    setEvents(evts);
    setRegistrations(regs);
    setAnnouncements(anns);
  };

  useEffect(() => {
    refreshData();

    // Reactive auth listener
    const handleAuthChange = (e: any) => {
      setCurrentUser(e.detail);
    };
    window.addEventListener('festronix:auth', handleAuthChange);
    return () => window.removeEventListener('festronix:auth', handleAuthChange);
  }, []);

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

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Background Cyber Grid */}
      <div className="cyber-grid-overlay" />

      {/* FULLSCREEN INTRO VIDEO: Edge-to-edge with no headings, borders, or frames */}
      <FullscreenIntro
        isOpen={isIntroOpen}
        onFinish={() => setIsIntroOpen(false)}
      />

      {/* Floating Modern Navbar */}
      <Navbar
        onOpenIntro={() => setIsIntroOpen(true)}
        onOpenPasses={() => setIsPassesModalOpen(true)}
        onOpenMultiPass={() => setIsMultiPassModalOpen(true)}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onSignOut={() => AuthService.signOut()}
        announcements={announcements}
        passesCount={registrations.length}
        onNavigateExplore={handleNavigateExplore}
        onNavigateHyped={handleNavigateHyped}
        onSelectDepartment={handleSelectDepartment}
        onSelectCategory={handleSelectCategory}
      />

      {/* Main Experience View */}
      <main style={{ flex: 1, position: 'relative', zIndex: 10 }}>
        <HeroSection
          onExploreEvents={handleNavigateExplore}
          onOpenIntro={() => setIsIntroOpen(true)}
          onRegisterNow={() => {
            const openEvent = events.find(e => e.status === 'open') || events[0];
            if (openEvent) setRegisterEvent(openEvent);
          }}
        />

        {/* TOP HYPED EVENTS (Ranked by Total Registrations) */}
        <HypedEventsSection
          events={events}
          onSelectEvent={evt => setDetailEvent(evt)}
          onRegisterEvent={evt => setRegisterEvent(evt)}
          onExploreAll={handleNavigateExplore}
        />

        {/* EVENT CATALOG with Select by Department & Select by Event Category */}
        <EventCatalog
          events={events}
          onSelectEvent={evt => setDetailEvent(evt)}
          onRegisterEvent={evt => setRegisterEvent(evt)}
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
      </main>

      {/* Footer */}
      <Footer />

      {/* User Modals */}
      <EventDetailModal
        event={detailEvent}
        onClose={() => setDetailEvent(null)}
        onRegister={evt => setRegisterEvent(evt)}
      />

      <RegistrationModal
        event={registerEvent}
        currentUser={currentUser}
        onClose={() => setRegisterEvent(null)}
        onSuccess={handleRegistrationSuccess}
        onOpenMultiPass={() => setIsMultiPassModalOpen(true)}
      />

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
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
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
  );
};

export default App;

