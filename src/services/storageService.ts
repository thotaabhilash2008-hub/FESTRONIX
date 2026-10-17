import { FestEvent, Registration, Announcement, FestStats, PaymentStatus, Teammate, Team, Department } from '../types/festronix';
import { INITIAL_EVENTS, INITIAL_REGISTRATIONS, INITIAL_ANNOUNCEMENTS, INITIAL_TEAMS, DEPARTMENTS } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Database } from '../lib/database.types';

const STORAGE_KEYS = {
  EVENTS: 'festronix_events_v2',
  REGISTRATIONS: 'festronix_registrations_v2',
  ANNOUNCEMENTS: 'festronix_announcements_v2',
  TEAMS: 'festronix_teams_v2',
  DEPARTMENTS: 'festronix_departments_v2'
};

type EventRow = Database['public']['Tables']['events']['Row'];
type AnnouncementRow = Database['public']['Tables']['announcements']['Row'];

/**
 * Transforms Supabase events table row to FestEvent
 */
function eventFromDb(row: EventRow): FestEvent {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    departmentId: row.department_id || '',
    departmentCode: row.department_code,
    category: row.category,
    format: row.format,
    minTeamSize: row.min_team_size,
    maxTeamSize: row.max_team_size,
    fee: row.fee,
    capacity: row.capacity,
    registeredCount: row.registered_count,
    deadline: row.deadline,
    date: row.date_display,
    time: row.time_display,
    venue: row.venue,
    description: row.description,
    rules: Array.isArray(row.rules) ? (row.rules as string[]) : [],
    prizes: (row.prizes as any) || { first: 'Trophy' },
    eligibility: row.eligibility,
    coordinatorName: row.coordinator_name,
    coordinatorPhone: row.coordinator_phone,
    coordinatorEmail: row.coordinator_email,
    status: row.status,
    bannerGradient: row.banner_gradient
  };
}

/**
 * Transforms FestEvent to Supabase events insert payload
 */
function eventToDb(evt: FestEvent) {
  let deadlineIso: string | null = null;
  if (evt.deadline) {
    try {
      const parsed = new Date(evt.deadline);
      if (!isNaN(parsed.getTime())) {
        deadlineIso = parsed.toISOString();
      }
    } catch {
      deadlineIso = null;
    }
  }

  return {
    slug: evt.slug,
    title: evt.title,
    department_code: evt.departmentCode,
    category: evt.category,
    format: evt.format,
    min_team_size: evt.minTeamSize,
    max_team_size: evt.maxTeamSize,
    fee: evt.fee,
    capacity: evt.capacity,
    registered_count: evt.registeredCount,
    deadline: deadlineIso,
    date_display: evt.date,
    time_display: evt.time,
    venue: evt.venue,
    description: evt.description,
    rules: evt.rules as any,
    prizes: evt.prizes as any,
    eligibility: evt.eligibility || 'All college delegates',
    coordinator_name: evt.coordinatorName,
    coordinator_phone: evt.coordinatorPhone,
    coordinator_email: evt.coordinatorEmail,
    status: evt.status,
    banner_gradient: evt.bannerGradient || 'linear-gradient(135deg, #142042 0%, #283B78 50%, #789593 100%)'
  };
}

/**
 * Transforms Supabase announcements row to Announcement
 */
function announcementFromDb(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    scope: row.scope,
    departmentCode: row.department_code || undefined,
    date: row.date_display || new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

/**
 * Transforms Supabase registration join row to Registration
 */
function registrationFromDb(row: any): Registration {
  const ticket = Array.isArray(row.tickets) && row.tickets.length > 0 ? row.tickets[0] : row.tickets;
  const members: Teammate[] = Array.isArray(row.registration_members)
    ? row.registration_members.map((m: any) => ({
        name: m.name,
        email: m.email,
        phone: m.phone,
        college: m.college,
        rollNumber: m.roll_number
      }))
    : [];

  return {
    id: row.display_id || row.id,
    userId: row.user_id || undefined,
    buyerRoll: row.buyer_roll || undefined,
    eventId: row.event_id,
    eventTitle: row.event_title,
    departmentCode: row.department_code || row.events?.department_code || undefined,
    teamName: row.team_name || undefined,
    teamCode: row.team_code || undefined,
    leaderName: row.leader_name,
    leaderEmail: row.leader_email,
    leaderPhone: row.leader_phone,
    leaderCollege: row.leader_college,
    leaderRoll: row.leader_roll,
    teammates: members,
    format: row.format,
    fee: Number(row.fee) || 0,
    source: row.source,
    registrationDate: row.created_at
      ? new Date(row.created_at).toISOString().replace('T', ' ').slice(0, 16)
      : new Date().toISOString().replace('T', ' ').slice(0, 16),
    paymentStatus: row.payment_status,
    transactionId: row.transaction_id || undefined,
    paymentScreenshotUrl: row.payment_screenshot_url || undefined,
    rejectionReason: row.rejection_reason || undefined,
    verifiedBy: row.verified_by || undefined,
    verifiedAt: row.verified_at || undefined,
    qrToken: ticket?.qr_token || `FEST26-${(row.display_id || row.id).slice(-4)}`,
    checkedIn: Boolean(ticket?.checked_in),
    checkedInAt: ticket?.checked_in_at || undefined,
    checkedInBy: ticket?.checked_in_by || undefined
  };
}

export class StorageService {
  private static isRealtimeInitialized = false;

  /**
   * Initialize Supabase Realtime channel for live multi-client updates
   */
  static initRealtime(): void {
    if (this.isRealtimeInitialized || !isSupabaseConfigured()) return;
    this.isRealtimeInitialized = true;

    try {
      supabase
        .channel('festronix_live_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => {
          this.fetchRegistrations();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
          this.fetchRegistrations();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
          this.fetchEvents();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
          this.fetchAnnouncements();
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription error:', err);
    }
  }

  // ==========================================
  // EVENTS
  // ==========================================

  static getCustomEvents(): FestEvent[] {
    const raw = localStorage.getItem('festronix_custom_events_v1');
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static saveCustomEvents(events: FestEvent[]): void {
    localStorage.setItem('festronix_custom_events_v1', JSON.stringify(events));
  }

  /**
   * Synchronous cached getter for fast render cycles
   */
  static getEvents(): FestEvent[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    let baseList = INITIAL_EVENTS;
    if (raw) {
      try {
        baseList = JSON.parse(raw);
      } catch {
        baseList = INITIAL_EVENTS;
      }
    }
    const custom = this.getCustomEvents();
    const combined = [...custom];
    for (const b of baseList) {
      if (!combined.some(c => c.id === b.id || c.slug === b.slug)) {
        combined.push(b);
      }
    }
    return combined;
  }

  static saveEvents(events: FestEvent[]): void {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }

  /**
   * Asynchronous fetch directly from Supabase (or fallback)
   */
  static async fetchEvents(): Promise<FestEvent[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('title', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped = data.map(eventFromDb);
          const custom = this.getCustomEvents();
          const combined = [...custom];
          for (const m of mapped) {
            if (!combined.some(c => c.id === m.id || c.slug === m.slug)) {
              combined.push(m);
            }
          }
          this.saveEvents(combined);
          window.dispatchEvent(new CustomEvent('festronix:events-updated', { detail: combined }));
          return combined;
        }
      } catch (err) {
        console.warn('Supabase fetchEvents warning, using cache:', err);
      }
    }
    return this.getEvents();
  }

  static async addEvent(newEvent: FestEvent): Promise<FestEvent> {
    const custom = this.getCustomEvents();
    custom.unshift(newEvent);
    this.saveCustomEvents(custom);

    const events = this.getEvents();
    this.saveEvents(events);
    window.dispatchEvent(new CustomEvent('festronix:events-updated', { detail: events }));

    if (isSupabaseConfigured()) {
      try {
        const payload = eventToDb(newEvent);
        await supabase.from('events').insert(payload);
      } catch (err) {
        console.warn('Supabase addEvent warning:', err);
      }
    }

    return newEvent;
  }

  static async updateEvent(updatedEvent: FestEvent): Promise<boolean> {
    const custom = this.getCustomEvents();
    const cIdx = custom.findIndex(c => c.id === updatedEvent.id || c.slug === updatedEvent.slug);
    if (cIdx !== -1) {
      custom[cIdx] = updatedEvent;
      this.saveCustomEvents(custom);
    }

    const events = this.getEvents().map(e => (e.id === updatedEvent.id || e.slug === updatedEvent.slug ? updatedEvent : e));
    this.saveEvents(events);
    window.dispatchEvent(new CustomEvent('festronix:events-updated', { detail: events }));

    if (isSupabaseConfigured()) {
      try {
        const payload = eventToDb(updatedEvent);
        await supabase
          .from('events')
          .update(payload)
          .or(`id.eq.${updatedEvent.id},slug.eq.${updatedEvent.slug}`);
      } catch (err) {
        console.warn('Supabase updateEvent warning:', err);
      }
    }

    return true;
  }

  static async deleteEvent(eventId: string): Promise<boolean> {
    const custom = this.getCustomEvents().filter(e => e.id !== eventId && e.slug !== eventId);
    this.saveCustomEvents(custom);

    const events = this.getEvents().filter(e => e.id !== eventId && e.slug !== eventId);
    this.saveEvents(events);
    window.dispatchEvent(new CustomEvent('festronix:events-updated', { detail: events }));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('events').delete().or(`id.eq.${eventId},slug.eq.${eventId}`);
      } catch (err) {
        console.warn('Supabase deleteEvent warning:', err);
      }
    }

    return true;
  }

  // ==========================================
  // REGISTRATIONS
  // ==========================================

  /**
   * Robust department resolver for any registration
   * Resolves by explicit departmentCode, teamCode prefix, eventId, or event title heuristics
   */
  static resolveDepartmentForRegistration(r: Registration, cachedEvents?: FestEvent[]): string {
    // 1. Explicit department code on registration
    if (r.departmentCode) {
      return r.departmentCode.toUpperCase();
    }

    // 2. Derive from teamCode prefix (e.g. FX-CS-..., FX-ECE-..., FX-IT-..., FX-AIML-...)
    if (r.teamCode) {
      const match = r.teamCode.match(/^FX-([A-Za-z&]+)-/i);
      if (match) {
        const prefix = match[1].toUpperCase();
        if (prefix === 'CS' || prefix === 'CSE') return 'CSE';
        if (prefix === 'ECE') return 'ECE';
        if (prefix === 'AIML' || prefix === 'AI&ML') return 'AI&ML';
        if (prefix === 'IT') return 'IT';
        if (prefix === 'EEE') return 'EEE';
        if (prefix === 'MECH' || prefix === 'ME') return 'MECH';
        if (prefix === 'CIVIL' || prefix === 'CE') return 'CIVIL';
        if (prefix === 'MBA') return 'MBA';
      }
    }

    // 3. Match against events list
    const events = cachedEvents || this.getEvents();
    const matched = events.find(e => 
      e.id === r.eventId || 
      e.slug === r.eventId ||
      (r.eventTitle && e.title && (
        r.eventTitle.toLowerCase().trim() === e.title.toLowerCase().trim() ||
        r.eventTitle.toLowerCase().includes(e.title.toLowerCase()) || 
        e.title.toLowerCase().includes(r.eventTitle.toLowerCase())
      ))
    );
    if (matched && matched.departmentCode) {
      return matched.departmentCode.toUpperCase();
    }

    // 4. Infer from event title keywords
    const title = (r.eventTitle || '').toLowerCase();
    if (title.includes('hackathon') || title.includes('code') || title.includes('web') || title.includes('bug')) return 'CSE';
    if (title.includes('circuit') || title.includes('embedded') || title.includes('iot') || title.includes('signal') || title.includes('silicon')) return 'ECE';
    if (title.includes('prompt') || title.includes('ai') || title.includes('ml') || title.includes('vision') || title.includes('bot') || title.includes('neural')) return 'AI&ML';
    if (title.includes('apex') || title.includes('valorant') || title.includes('cloud') || title.includes('cyber') || title.includes('security') || title.includes('devops')) return 'IT';
    if (title.includes('solar') || title.includes('grid') || title.includes('ev') || title.includes('power') || title.includes('voltrush')) return 'EEE';
    if (title.includes('cad') || title.includes('robo') || title.includes('thermal') || title.includes('mech') || title.includes('drone') || title.includes('aerowings')) return 'MECH';
    if (title.includes('bridge') || title.includes('survey') || title.includes('concrete') || title.includes('civil') || title.includes('struc') || title.includes('autocad')) return 'CIVIL';
    if (title.includes('shark') || title.includes('pitch') || title.includes('biz') || title.includes('case') || title.includes('market') || title.includes('venture')) return 'MBA';

    return 'CSE';
  }

  /**
   * Synchronous cached getter for registrations with automatic seed merging
   */
  static getRegistrations(): Registration[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
    let current: Registration[] = [];
    if (raw) {
      try {
        current = JSON.parse(raw);
        if (!Array.isArray(current)) current = [];
      } catch {
        current = [];
      }
    }

    // Merge any missing initial seed registrations to guarantee all departments have live demo data
    const existingIds = new Set(current.map(r => r.id));
    let hasNew = false;
    for (const init of INITIAL_REGISTRATIONS) {
      if (!existingIds.has(init.id)) {
        current.push(init);
        hasNew = true;
      }
    }

    if (hasNew || !raw) {
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(current));
    }
    return current;
  }

  static saveRegistrations(regs: Registration[]): void {
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(regs));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('festronix:regs-updated', { detail: regs }));
    }
  }

  /**
   * Asynchronous fetch of registrations from Supabase
   */
  static async fetchRegistrations(): Promise<Registration[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('registrations')
          .select(`
            *,
            events (department_code, title),
            tickets (qr_token, checked_in, checked_in_at, checked_in_by),
            registration_members (name, email, phone, college, roll_number)
          `)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const remoteMapped = data.map(registrationFromDb);
          const localRegs = this.getRegistrations();
          const remoteIds = new Set(remoteMapped.map(r => r.id));
          // Merge remote data with local cached registrations
          const merged = [...remoteMapped, ...localRegs.filter(r => !remoteIds.has(r.id))];
          this.saveRegistrations(merged);
          return merged;
        }
      } catch (err) {
        console.warn('Supabase fetchRegistrations warning, using cache:', err);
      }
    }
    return this.getRegistrations();
  }

  /**
   * Duplicate registration prevention (FR-REG-05 & FR-SPOT-04)
   * Checks if a participant roll number is already registered for an event
   */
  static checkDuplicateRegistration(
    eventId: string,
    rollNumber: string
  ): { isDuplicate: boolean; existingReg?: Registration } {
    if (!eventId || !rollNumber) return { isDuplicate: false };
    const cleanRoll = rollNumber.trim().toLowerCase();
    const regs = this.getRegistrations();
    const existing = regs.find(r => {
      if (r.paymentStatus === 'rejected') return false; // Rejected registrations are allowed to re-register
      const isSameEvent = r.eventId === eventId || r.eventId.toLowerCase() === eventId.toLowerCase();
      if (!isSameEvent) return false;
      const isLeader = r.leaderRoll && r.leaderRoll.trim().toLowerCase() === cleanRoll;
      const isBuyer = r.buyerRoll && r.buyerRoll.trim().toLowerCase() === cleanRoll;
      const isTeammate = r.teammates && r.teammates.some(t => t.rollNumber && t.rollNumber.trim().toLowerCase() === cleanRoll);
      return isLeader || isBuyer || isTeammate;
    });

    return {
      isDuplicate: Boolean(existing),
      existingReg: existing
    };
  }

  /**
   * Create a registration.
   * Uses Supabase RPC 'create_registration' with atomic capacity check when online.
   */
  static async addRegistration(
    newReg: Omit<Registration, 'id' | 'qrToken' | 'checkedIn'>
  ): Promise<Registration> {
    // Capacity & Status Validation (FR-REG-01, FR-REG-06, FR-SPOT-04)
    const events = this.getEvents();
    const event = events.find(e => e.id === newReg.eventId || e.slug === newReg.eventId);
    if (event) {
      if (event.registeredCount >= event.capacity) {
        throw new Error(`Event "${event.title}" has reached its maximum capacity of ${event.capacity} seats.`);
      }
      if (event.status !== 'open') {
        throw new Error(`Registration for "${event.title}" is currently closed (${event.status}).`);
      }
    }

    // Duplicate Registration Prevention (FR-REG-05, FR-SPOT-04)
    const rollToCheck = newReg.buyerRoll || newReg.leaderRoll;
    if (rollToCheck) {
      const dup = this.checkDuplicateRegistration(newReg.eventId, rollToCheck);
      if (dup.isDuplicate && dup.existingReg) {
        throw new Error(`Participant (${rollToCheck}) is already registered for "${dup.existingReg.eventTitle}" (Pass ID: ${dup.existingReg.id}). Duplicate registrations are not permitted.`);
      }
    }

    if (newReg.teammates && newReg.teammates.length > 0) {
      for (const tm of newReg.teammates) {
        if (tm.rollNumber) {
          const tmDup = this.checkDuplicateRegistration(newReg.eventId, tm.rollNumber);
          if (tmDup.isDuplicate && tmDup.existingReg) {
            throw new Error(`Teammate (${tm.name} - ${tm.rollNumber}) is already registered for this event.`);
          }
        }
      }
    }

    // --- SUPABASE RPC REGISTRATION FLOW ---
    if (isSupabaseConfigured()) {
      try {
        // Resolve event UUID
        let targetEventUuid = newReg.eventId;
        const cachedEvents = this.getEvents();
        const foundEvent = cachedEvents.find(e => e.id === newReg.eventId || e.slug === newReg.eventId);
        if (foundEvent && foundEvent.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(foundEvent.id)) {
          targetEventUuid = foundEvent.id;
        }

        // Validate userId as UUID or pass null
        const targetUserId = (newReg.userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newReg.userId))
          ? newReg.userId
          : null;

        let rpcRes: any = null;
        let rpcError: any = null;

        const rpcPayload = {
          p_event_id: targetEventUuid,
          p_user_id: targetUserId,
          p_buyer_roll: newReg.buyerRoll || newReg.leaderRoll || null,
          p_leader_name: newReg.leaderName,
          p_leader_email: newReg.leaderEmail,
          p_leader_phone: newReg.leaderPhone,
          p_leader_college: newReg.leaderCollege,
          p_leader_roll: newReg.leaderRoll,
          p_format: newReg.format,
          p_fee: newReg.fee,
          p_source: newReg.source,
          p_payment_status: newReg.paymentStatus,
          p_transaction_id: newReg.transactionId || null,
          p_payment_screenshot_url: newReg.paymentScreenshotUrl || null,
          p_teammates: (newReg.teammates || []) as any
        };

        // Try create_registration first, fallback to register_for_event
        const try1 = await supabase.rpc('create_registration', rpcPayload);
        if (!try1.error) {
          rpcRes = try1.data;
        } else {
          rpcError = try1.error;
          const try2 = await supabase.rpc('register_for_event', rpcPayload);
          if (!try2.error) {
            rpcRes = try2.data;
            rpcError = null;
          }
        }

        if (!rpcError && rpcRes && (rpcRes as any).success) {
          const regPayload = (rpcRes as any).registration;
          const matchedEvt = this.getEvents().find(e => e.id === newReg.eventId || e.slug === newReg.eventId);
          const fullReg: Registration = {
            id: regPayload.id,
            userId: newReg.userId,
            buyerRoll: newReg.buyerRoll,
            eventId: newReg.eventId,
            eventTitle: regPayload.eventTitle || newReg.eventTitle,
            departmentCode: newReg.departmentCode || matchedEvt?.departmentCode || this.resolveDepartmentForRegistration(newReg as any),
            teamName: newReg.teamName,
            teamCode: newReg.teamCode,
            leaderName: newReg.leaderName,
            leaderEmail: newReg.leaderEmail,
            leaderPhone: newReg.leaderPhone,
            leaderCollege: newReg.leaderCollege,
            leaderRoll: newReg.leaderRoll,
            teammates: newReg.teammates || [],
            format: newReg.format,
            fee: Number(newReg.fee) || 0,
            source: newReg.source,
            registrationDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
            paymentStatus: newReg.paymentStatus,
            transactionId: newReg.transactionId,
            paymentScreenshotUrl: newReg.paymentScreenshotUrl,
            qrToken: regPayload.qrToken,
            checkedIn: false
          };

          const currentRegs = this.getRegistrations();
          currentRegs.unshift(fullReg);
          this.saveRegistrations(currentRegs);

          // If team registration, save team entity
          if (newReg.teamCode || newReg.teamName) {
            const evts = this.getEvents();
            const matchedEvt = evts.find(e => e.id === newReg.eventId || e.slug === newReg.eventId);
            this.createTeam({
              teamCode: newReg.teamCode || this.generateTeamCode(newReg.eventId),
              teamName: newReg.teamName || `${newReg.leaderName}'s Squad`,
              eventId: newReg.eventId,
              eventTitle: newReg.eventTitle,
              registrationId: fullReg.id,
              leaderId: newReg.userId,
              leaderName: newReg.leaderName,
              leaderRoll: newReg.leaderRoll,
              leaderEmail: newReg.leaderEmail,
              leaderPhone: newReg.leaderPhone,
              leaderCollege: newReg.leaderCollege,
              members: newReg.teammates || [],
              maxTeamSize: matchedEvt?.maxTeamSize || 4,
              minTeamSize: matchedEvt?.minTeamSize || 2
            });
          }

          // Update cached event count
          const events = this.getEvents();
          const evtIdx = events.findIndex(e => e.id === newReg.eventId || e.slug === newReg.eventId);
          if (evtIdx !== -1) {
            events[evtIdx].registeredCount += 1;
            if (events[evtIdx].registeredCount >= events[evtIdx].capacity) {
              events[evtIdx].status = 'full';
            }
            this.saveEvents(events);
          }

          return fullReg;
        } else if (rpcError) {
          console.warn('RPC register error, proceeding with local fallback:', rpcError.message);
        }
      } catch (err) {
        console.warn('Supabase register error:', err);
      }
    }

    // --- LOCAL FALLBACK FLOW ---
    const registrations = this.getRegistrations();
    const id = `FEST-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrToken = `FEST26-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${id.slice(-4)}`;
    const matchedEvt = this.getEvents().find(e => e.id === newReg.eventId || e.slug === newReg.eventId);

    const fullReg: Registration = {
      ...newReg,
      id,
      qrToken,
      checkedIn: false,
      fee: Number(newReg.fee) || 0,
      departmentCode: newReg.departmentCode || matchedEvt?.departmentCode || this.resolveDepartmentForRegistration(newReg as any)
    };

    registrations.unshift(fullReg);
    this.saveRegistrations(registrations);

    // If team registration, save team entity
    if (newReg.teamCode || newReg.teamName) {
      const evts = this.getEvents();
      const matchedEvt = evts.find(e => e.id === newReg.eventId || e.slug === newReg.eventId);
      this.createTeam({
        teamCode: newReg.teamCode || this.generateTeamCode(newReg.eventId),
        teamName: newReg.teamName || `${newReg.leaderName}'s Squad`,
        eventId: newReg.eventId,
        eventTitle: newReg.eventTitle,
        registrationId: fullReg.id,
        leaderId: newReg.userId,
        leaderName: newReg.leaderName,
        leaderRoll: newReg.leaderRoll,
        leaderEmail: newReg.leaderEmail,
        leaderPhone: newReg.leaderPhone,
        leaderCollege: newReg.leaderCollege,
        members: newReg.teammates || [],
        maxTeamSize: matchedEvt?.maxTeamSize || 4,
        minTeamSize: matchedEvt?.minTeamSize || 2
      });
    }

    // Update event registered count
    const allEvents = this.getEvents();
    const evtIndex = allEvents.findIndex(e => e.id === newReg.eventId || e.slug === newReg.eventId);
    if (evtIndex !== -1) {
      allEvents[evtIndex].registeredCount += 1;
      if (allEvents[evtIndex].registeredCount >= allEvents[evtIndex].capacity) {
        allEvents[evtIndex].status = 'full';
      }
      this.saveEvents(allEvents);
    }

    return fullReg;
  }

  static async addMultipleRegistrations(
    batch: Array<Omit<Registration, 'id' | 'qrToken' | 'checkedIn'>>
  ): Promise<Registration[]> {
    const created: Registration[] = [];
    for (const item of batch) {
      const reg = await this.addRegistration(item);
      created.push(reg);
    }
    return created;
  }

  /**
   * Update payment status and log audit trail
   */
  static async updatePaymentStatus(
    regId: string,
    status: PaymentStatus,
    reviewerName: string,
    rejectionReason?: string
  ): Promise<boolean> {
    const regs = this.getRegistrations();
    const idx = regs.findIndex(r => r.id === regId || r.qrToken === regId);
    if (idx !== -1) {
      regs[idx].paymentStatus = status;
      regs[idx].verifiedBy = reviewerName;
      regs[idx].verifiedAt = new Date().toLocaleString();
      if (rejectionReason) {
        regs[idx].rejectionReason = rejectionReason;
      } else {
        delete regs[idx].rejectionReason;
      }
      this.saveRegistrations(regs);
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('registrations')
          .update({
            payment_status: status,
            verified_by: reviewerName,
            verified_at: new Date().toISOString(),
            rejection_reason: rejectionReason || null
          })
          .eq('display_id', regId);

        // Record audit trail
        await supabase.from('audit_logs').insert({
          action: `PAYMENT_${status.toUpperCase()}`,
          entity_type: 'registration',
          metadata: {
            display_id: regId,
            status,
            reviewer: reviewerName,
            reason: rejectionReason || null
          }
        });
      } catch (err) {
        console.warn('Supabase updatePaymentStatus warning:', err);
      }
    }

    return true;
  }

  /**
   * Fast entry check-in via QR Token or Registration ID
   */
  static async checkInRegistration(
    qrTokenOrId: string,
    staffName: string
  ): Promise<{
    success: boolean;
    status: 'VALID' | 'ALREADY_CHECKED_IN' | 'NOT_FOUND' | 'PAYMENT_PENDING';
    registration?: Registration;
    message: string;
  }> {
    // --- SUPABASE CHECK-IN FLOW ---
    if (isSupabaseConfigured()) {
      try {
        const { data: checkInRes, error } = await supabase.rpc('check_in_registration', {
          p_qr_token_or_id: qrTokenOrId,
          p_staff_name: staffName
        });

        if (!error && checkInRes) {
          const res = checkInRes as any;
          // Update local cache
          const regs = this.getRegistrations();
          const cleanQuery = qrTokenOrId.trim().toLowerCase();
          const target = regs.find(
            r =>
              r.qrToken.toLowerCase() === cleanQuery ||
              r.id.toLowerCase() === cleanQuery ||
              (r.leaderRoll && r.leaderRoll.trim().toLowerCase() === cleanQuery) ||
              (r.buyerRoll && r.buyerRoll.trim().toLowerCase() === cleanQuery) ||
              (r.teamCode && r.teamCode.trim().toLowerCase() === cleanQuery) ||
              (r.teammates && r.teammates.some(t => t.rollNumber && t.rollNumber.trim().toLowerCase() === cleanQuery))
          );

          if (res.success && target) {
            target.checkedIn = true;
            target.checkedInAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            target.checkedInBy = staffName;
            this.saveRegistrations(regs);
            return {
              success: true,
              status: 'VALID',
              message: res.message || `Access Granted! Welcome ${target.leaderName}`,
              registration: target
            };
          } else if (res.status === 'ALREADY_CHECKED_IN' || res.status === 'PAYMENT_PENDING') {
            return {
              success: false,
              status: res.status,
              message: res.message,
              registration: target
            };
          }
          // If Supabase returned NOT_FOUND, fall through to local fallback below
        }
      } catch (err) {
        console.warn('Supabase checkIn error, falling back:', err);
      }
    }

    // --- LOCAL FALLBACK FLOW ---
    const regs = this.getRegistrations();
    const cleanQuery = qrTokenOrId.trim().toLowerCase();
    const reg = regs.find(
      r =>
        r.qrToken.toLowerCase() === cleanQuery ||
        r.id.toLowerCase() === cleanQuery ||
        (r.leaderRoll && r.leaderRoll.trim().toLowerCase() === cleanQuery) ||
        (r.buyerRoll && r.buyerRoll.trim().toLowerCase() === cleanQuery) ||
        (r.teamCode && r.teamCode.trim().toLowerCase() === cleanQuery) ||
        (r.teammates && r.teammates.some(t => t.rollNumber && t.rollNumber.trim().toLowerCase() === cleanQuery))
    );

    if (!reg) {
      return {
        success: false,
        status: 'NOT_FOUND',
        message: 'No registration found matching token, ID, or Roll number: ' + qrTokenOrId
      };
    }

    if (reg.paymentStatus === 'verification_pending' || reg.paymentStatus === 'rejected' || reg.paymentStatus === 'payment_required') {
      return {
        success: false,
        status: 'PAYMENT_PENDING',
        registration: reg,
        message: `Entry blocked: Payment is currently ${reg.paymentStatus.replace('_', ' ').toUpperCase()}. Must be verified first.`
      };
    }

    if (reg.checkedIn) {
      return {
        success: false,
        status: 'ALREADY_CHECKED_IN',
        registration: reg,
        message: `ALREADY CHECKED IN at ${reg.checkedInAt} by ${reg.checkedInBy || 'Desk'}`
      };
    }

    reg.checkedIn = true;
    reg.checkedInAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    reg.checkedInBy = staffName;

    this.saveRegistrations(regs);

    return {
      success: true,
      status: 'VALID',
      registration: reg,
      message: `Access Granted! Welcome ${reg.leaderName} (${reg.eventTitle})`
    };
  }

  /**
   * Fast entry check-in status toggle for admin console
   */
  static async toggleCheckInRegistration(
    regId: string,
    staffName: string
  ): Promise<{ success: boolean; checkedIn: boolean }> {
    const regs = this.getRegistrations();
    const target = regs.find(r => r.id === regId || r.qrToken === regId);
    if (!target) return { success: false, checkedIn: false };

    const newCheckedIn = !target.checkedIn;
    target.checkedIn = newCheckedIn;
    target.checkedInAt = newCheckedIn ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;
    target.checkedInBy = newCheckedIn ? staffName : undefined;
    this.saveRegistrations(regs);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('registrations')
          .update({
            checked_in: newCheckedIn,
            checked_in_at: newCheckedIn ? new Date().toISOString() : null,
            checked_in_by: newCheckedIn ? staffName : null
          })
          .eq('display_id', target.id);
      } catch (err) {
        console.warn('Supabase toggle check in warning:', err);
      }
    }
    return { success: true, checkedIn: newCheckedIn };
  }

  /**
   * Upload payment screenshot to Supabase Storage bucket 'payment-screenshots'
   */
  static async uploadPaymentScreenshot(
    file: File,
    regDisplayId: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    if (isSupabaseConfigured()) {
      try {
        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `${regDisplayId}_${Date.now()}.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('payment-screenshots')
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicData } = supabase.storage
          .from('payment-screenshots')
          .getPublicUrl(filePath);

        return { success: true, url: publicData.publicUrl };
      } catch (err: any) {
        console.warn('Storage upload error, using object URL fallback:', err);
      }
    }

    // Local fallback URL
    const localUrl = URL.createObjectURL(file);
    return { success: true, url: localUrl };
  }

  // ==========================================
  // ANNOUNCEMENTS
  // ==========================================

  static getAnnouncements(): Announcement[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
      return INITIAL_ANNOUNCEMENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  }

  static saveAnnouncements(announcements: Announcement[]): void {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
  }

  static async fetchAnnouncements(): Promise<Announcement[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped = data.map(announcementFromDb);
          this.saveAnnouncements(mapped);
          window.dispatchEvent(new CustomEvent('festronix:announcements-updated', { detail: mapped }));
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase fetchAnnouncements warning:', err);
      }
    }
    return this.getAnnouncements();
  }

  static async addAnnouncement(data: Omit<Announcement, 'id' | 'date'>): Promise<Announcement> {
    const list = this.getAnnouncements();
    const newAnn: Announcement = {
      ...data,
      id: `ann-${Date.now()}`,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    list.unshift(newAnn);
    this.saveAnnouncements(list);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('announcements').insert({
          title: data.title,
          message: data.message,
          type: data.type,
          scope: data.scope,
          department_code: data.departmentCode || null,
          date_display: newAnn.date
        });
      } catch (err) {
        console.warn('Supabase addAnnouncement warning:', err);
      }
    }

    return newAnn;
  }

  static async deleteAnnouncement(annId: string): Promise<void> {
    const list = this.getAnnouncements().filter(a => a.id !== annId);
    this.saveAnnouncements(list);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('announcements').delete().eq('id', annId);
      } catch (err) {
        console.warn('Supabase deleteAnnouncement warning:', err);
      }
    }
  }

  // ==========================================
  // AGGREGATE STATS
  // ==========================================

  static getStats(): FestStats {
    const regs = this.getRegistrations();
    const events = this.getEvents();

    const totalRegistrations = regs.length;
    const verifiedCount = regs.filter(r => r.paymentStatus === 'verified' || r.paymentStatus === 'not_applicable').length;
    const pendingCount = regs.filter(r => r.paymentStatus === 'verification_pending').length;
    const rejectedCount = regs.filter(r => r.paymentStatus === 'rejected').length;
    const spotCount = regs.filter(r => r.source === 'spot').length;
    const onlineCount = regs.filter(r => r.source === 'online').length;
    const checkedInCount = regs.filter(r => Boolean(r.checkedIn)).length;

    const totalCollected = regs
      .filter(r => r.paymentStatus === 'verified')
      .reduce((sum, r) => sum + (Number(r.fee) || 0), 0);

    const totalCapacity = events.reduce((sum, e) => sum + (Number(e.capacity) || 0), 0);

    return {
      totalRegistrations,
      verifiedCount,
      pendingCount,
      rejectedCount,
      spotCount,
      onlineCount,
      totalCollected,
      totalCapacity,
      checkedInCount
    };
  }

  static getDepartmentStats(deptCode: string): FestStats {
    const cleanDept = deptCode.toUpperCase();
    const allEvents = this.getEvents().filter(
      e => e.departmentCode.toUpperCase() === cleanDept
    );
    const regs = this.getRegistrations().filter(r => 
      this.resolveDepartmentForRegistration(r, allEvents) === cleanDept
    );

    const totalRegistrations = regs.length;
    const verifiedCount = regs.filter(r => r.paymentStatus === 'verified' || r.paymentStatus === 'not_applicable').length;
    const pendingCount = regs.filter(r => r.paymentStatus === 'verification_pending').length;
    const rejectedCount = regs.filter(r => r.paymentStatus === 'rejected').length;
    const spotCount = regs.filter(r => r.source === 'spot').length;
    const onlineCount = regs.filter(r => r.source === 'online').length;
    const checkedInCount = regs.filter(r => Boolean(r.checkedIn)).length;

    const totalCollected = regs
      .filter(r => r.paymentStatus === 'verified')
      .reduce((sum, r) => sum + (Number(r.fee) || 0), 0);

    const totalCapacity = allEvents.reduce((sum, e) => sum + (Number(e.capacity) || 0), 0);

    return {
      totalRegistrations,
      verifiedCount,
      pendingCount,
      rejectedCount,
      spotCount,
      onlineCount,
      totalCollected,
      totalCapacity,
      checkedInCount
    };
  }

  static getDepartmentRegistrations(deptCode: string): Registration[] {
    const cleanDept = deptCode.toUpperCase();
    const allEvents = this.getEvents().filter(e => e.departmentCode.toUpperCase() === cleanDept);
    return this.getRegistrations().filter(r => this.resolveDepartmentForRegistration(r, allEvents) === cleanDept);
  }

  // ==========================================
  // DEPARTMENTS (Full Dynamic CRUD for Super Admin)
  // ==========================================

  static getDepartments(): Department[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.warn('Failed to parse cached departments:', err);
      }
    }
    // Default to DEPARTMENTS mock data and persist
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(DEPARTMENTS));
    return [...DEPARTMENTS];
  }

  static saveDepartments(departments: Department[]): void {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
    window.dispatchEvent(new CustomEvent('festronix:departments-updated', { detail: departments }));
  }

  static addDepartment(dept: Omit<Department, 'id'> & { id?: string }): Department {
    const departments = this.getDepartments();
    const cleanCode = dept.code.trim().toUpperCase();
    const id = dept.id || `dept-${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const newDept: Department = {
      id,
      code: cleanCode,
      name: dept.name.trim(),
      description: dept.description?.trim() || 'Academic Department for FESTRONIX 2026',
      chiefCoordinator: dept.chiefCoordinator?.trim() || 'Department Chief',
      contact: dept.contact?.trim() || `${cleanCode.toLowerCase()}.festronix@vardhaman.org`,
      iconName: dept.iconName || 'Cpu'
    };

    const existingIdx = departments.findIndex(d => d.code.toUpperCase() === cleanCode || d.id === id);
    if (existingIdx !== -1) {
      departments[existingIdx] = newDept;
    } else {
      departments.push(newDept);
    }

    this.saveDepartments(departments);
    return newDept;
  }

  static updateDepartment(idOrCode: string, updated: Partial<Department>): Department | null {
    const departments = this.getDepartments();
    const cleanKey = idOrCode.trim().toUpperCase();
    const idx = departments.findIndex(d => d.id === idOrCode || d.code.toUpperCase() === cleanKey);

    if (idx === -1) return null;

    const current = departments[idx];
    const merged: Department = {
      ...current,
      ...updated,
      code: updated.code ? updated.code.trim().toUpperCase() : current.code
    };
    departments[idx] = merged;
    this.saveDepartments(departments);
    return merged;
  }

  static deleteDepartment(idOrCode: string): boolean {
    const departments = this.getDepartments();
    const cleanKey = idOrCode.trim().toUpperCase();
    const filtered = departments.filter(d => d.id !== idOrCode && d.code.toUpperCase() !== cleanKey);
    this.saveDepartments(filtered);
    return true;
  }

  // ==========================================
  // TEAMS (Industry-Standard Squad System)
  // ==========================================

  static getTeams(): Team[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TEAMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(INITIAL_TEAMS));
      return INITIAL_TEAMS;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TEAMS;
    } catch {
      return INITIAL_TEAMS;
    }
  }

  static saveTeams(teams: Team[]): void {
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('festronix:teams-updated', { detail: teams }));
    }
  }

  static generateTeamCode(eventCodeOrSlug: string): string {
    const prefix = 'FX';
    const cleanTag = (eventCodeOrSlug || 'TEAM')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase();
    const randNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${cleanTag}-${randNum}`;
  }

  /**
   * Resilient, industry-standard team discovery.
   * Matches across local storage, registered passes, and Supabase cloud.
   * Supports alphanumeric normalization (handles case, spaces, and hyphens gracefully).
   */
  static async findTeamWithValidation(
    code: string,
    eventId?: string
  ): Promise<{ team: Team | null; error?: string }> {
    const rawClean = code.trim();
    if (!rawClean) return { team: null, error: 'Please enter a team code.' };

    const normQuery = rawClean.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (normQuery.length < 3) {
      return { team: null, error: 'Team code is too short. Please verify with your Team Leader.' };
    }

    let found: Team | null = null;

    // 1. Check local teams store
    const localTeams = this.getTeams();
    found = localTeams.find(t => t.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normQuery) || null;

    // 1b. Check INITIAL_TEAMS as fallback (in case local storage doesn't have recently seeded squads)
    if (!found) {
      found = INITIAL_TEAMS.find(t => t.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normQuery) || null;
      if (found) {
        this.saveTeams([found, ...localTeams.filter(t => t.teamCode !== found!.teamCode)]);
      }
    }

    // 2. Check local registrations (in case registered via pass)
    if (!found) {
      const regs = this.getRegistrations();
      const regMatch = regs.find(
        r => r.teamCode && r.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normQuery
      );
      if (regMatch) {
        found = {
          id: `TEAM-${regMatch.id.slice(-4)}`,
          teamCode: regMatch.teamCode!,
          teamName: regMatch.teamName || `${regMatch.leaderName}'s Squad`,
          eventId: regMatch.eventId,
          eventTitle: regMatch.eventTitle,
          registrationId: regMatch.id,
          leaderName: regMatch.leaderName,
          leaderRoll: regMatch.leaderRoll,
          leaderEmail: regMatch.leaderEmail,
          leaderPhone: regMatch.leaderPhone,
          leaderCollege: regMatch.leaderCollege,
          members: regMatch.teammates || [],
          maxTeamSize: 4,
          minTeamSize: 2,
          createdAt: regMatch.registrationDate
        };
        this.saveTeams([found, ...localTeams.filter(t => t.teamCode !== found!.teamCode)]);
      }
    }

    // 3. Check Supabase cloud database if connected
    if (!found && isSupabaseConfigured()) {
      try {
        // Try RPC first if available
        const { data: rpcData, error: rpcErr } = await supabase.rpc('find_team_by_code', {
          p_code: rawClean
        });

        if (!rpcErr && rpcData && rpcData.success && rpcData.team) {
          found = rpcData.team as Team;
          this.saveTeams([found, ...this.getTeams().filter(t => t.teamCode !== found!.teamCode)]);
        } else {
          // Direct table query fallback
          const { data: tableData } = await supabase
            .from('teams')
            .select('*')
            .or(`team_code.ilike.%${normQuery}%`)
            .maybeSingle();

          if (tableData) {
            found = {
              id: tableData.id,
              teamCode: tableData.team_code,
              teamName: tableData.team_name,
              eventId: tableData.event_id,
              eventTitle: tableData.event_title,
              registrationId: tableData.registration_id,
              leaderId: tableData.leader_id,
              leaderName: tableData.leader_name,
              leaderRoll: tableData.leader_roll,
              leaderEmail: tableData.leader_email,
              leaderPhone: tableData.leader_phone,
              leaderCollege: tableData.leader_college,
              members: tableData.members || [],
              maxTeamSize: tableData.max_team_size || 4,
              minTeamSize: tableData.min_team_size || 2,
              createdAt: tableData.created_at
            };
            this.saveTeams([found, ...this.getTeams().filter(t => t.teamCode !== found!.teamCode)]);
          }
        }
      } catch (err) {
        console.warn('Supabase cloud team lookup warning:', err);
      }
    }

    if (!found) {
      return {
        team: null,
        error: `Team code "${rawClean}" not found. Verify the code with your Team Leader.`
      };
    }

    // Event validation
    if (eventId) {
      const events = this.getEvents();
      const currentEvt = events.find(e => e.id === eventId || e.slug === eventId);
      if (currentEvt) {
        const cleanTgt = currentEvt.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanFound = found.eventTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

        const isExactId = found.eventId === currentEvt.id || found.eventId === currentEvt.slug;
        const isOverlapTitle = cleanTgt.includes(cleanFound) || cleanFound.includes(cleanTgt);
        
        // Extract key nouns (e.g. 'codesphere', 'hackathon', 'robowars')
        const getKeywords = (str: string) => str.toLowerCase().split(/[\s:,\-_]+/).filter(w => w.length > 3);
        const tgtWords = getKeywords(currentEvt.title);
        const foundWords = getKeywords(found.eventTitle);
        const hasKeywordMatch = tgtWords.some(w => foundWords.includes(w));

        if (!isExactId && !isOverlapTitle && !hasKeywordMatch) {
          return {
            team: null,
            error: `Team code "${found.teamCode}" belongs to "${found.eventTitle}", but you are registering for "${currentEvt.title}".`
          };
        }
      }
    }

    return { team: found };
  }

  static findTeamByCode(code: string, eventId?: string): Team | null {
    const clean = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const teams = this.getTeams();
    return teams.find(t => t.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === clean) || null;
  }

  /**
   * Instantly creates or reserves a squad so that the Team Code is LIVE and JOINABLE immediately!
   */
  static async reserveOrRegisterTeam(newTeamData: Omit<Team, 'id' | 'createdAt'>): Promise<Team> {
    const teams = this.getTeams();
    const normCode = newTeamData.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const existingIdx = teams.findIndex(t => t.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normCode);

    let team: Team;
    if (existingIdx !== -1) {
      team = {
        ...teams[existingIdx],
        teamName: newTeamData.teamName || teams[existingIdx].teamName,
        leaderName: newTeamData.leaderName || teams[existingIdx].leaderName,
        leaderRoll: newTeamData.leaderRoll || teams[existingIdx].leaderRoll,
        leaderEmail: newTeamData.leaderEmail || teams[existingIdx].leaderEmail,
        leaderPhone: newTeamData.leaderPhone || teams[existingIdx].leaderPhone,
        leaderCollege: newTeamData.leaderCollege || teams[existingIdx].leaderCollege,
        eventTitle: newTeamData.eventTitle || teams[existingIdx].eventTitle,
        eventId: newTeamData.eventId || teams[existingIdx].eventId
      };
      teams[existingIdx] = team;
    } else {
      const id = `TEAM-${Math.floor(1000 + Math.random() * 9000)}`;
      team = {
        ...newTeamData,
        id,
        createdAt: new Date().toISOString()
      };
      teams.unshift(team);
    }

    this.saveTeams(teams);

    // Sync to Supabase cloud if configured
    if (isSupabaseConfigured()) {
      try {
        await supabase.rpc('create_or_reserve_team', {
          p_team_code: team.teamCode,
          p_team_name: team.teamName,
          p_event_id: team.eventId,
          p_event_title: team.eventTitle,
          p_leader_name: team.leaderName,
          p_leader_roll: team.leaderRoll,
          p_leader_email: team.leaderEmail,
          p_leader_phone: team.leaderPhone,
          p_leader_college: team.leaderCollege,
          p_leader_id: team.leaderId || null,
          p_max_team_size: team.maxTeamSize,
          p_min_team_size: team.minTeamSize
        });
      } catch (err) {
        // Fallback: direct table upsert
        try {
          await supabase.from('teams').upsert({
            id: team.id,
            team_code: team.teamCode,
            team_name: team.teamName,
            event_id: team.eventId,
            event_title: team.eventTitle,
            leader_name: team.leaderName,
            leader_roll: team.leaderRoll,
            leader_email: team.leaderEmail,
            leader_phone: team.leaderPhone,
            leader_college: team.leaderCollege,
            members: team.members || [],
            max_team_size: team.maxTeamSize,
            min_team_size: team.minTeamSize
          });
        } catch {}
      }
    }

    return team;
  }

  static createTeam(newTeamData: Omit<Team, 'id' | 'createdAt'>): Team {
    const teams = this.getTeams();
    const normCode = newTeamData.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const existingIdx = teams.findIndex(t => t.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normCode);
    if (existingIdx !== -1) {
      return teams[existingIdx];
    }

    const id = `TEAM-${Math.floor(1000 + Math.random() * 9000)}`;
    const team: Team = {
      ...newTeamData,
      id,
      createdAt: new Date().toISOString()
    };
    teams.unshift(team);
    this.saveTeams(teams);

    // Async cloud backup
    if (isSupabaseConfigured()) {
      this.reserveOrRegisterTeam(newTeamData).catch(() => {});
    }

    return team;
  }

  static async joinTeam(
    teamCode: string,
    member: Teammate
  ): Promise<{ success: boolean; team?: Team; registration?: Registration; error?: string }> {
    const cleanCode = teamCode.trim().toUpperCase();
    const normCode = cleanCode.replace(/[^A-Za-z0-9]/g, '');

    // Lookup team via multi-source finder
    const lookup = await this.findTeamWithValidation(cleanCode);
    if (!lookup.team) {
      return {
        success: false,
        error: lookup.error || `Team Code "${cleanCode}" was not found.`
      };
    }

    const team = lookup.team;

    // Check capacity
    const currentMemberCount = 1 + (team.members?.length || 0);
    if (currentMemberCount >= team.maxTeamSize) {
      return {
        success: false,
        error: `Team "${team.teamName}" is already at full capacity (${team.maxTeamSize} max members).`
      };
    }

    // Check if member is already leader or joined
    const memberRoll = (member.rollNumber || '').trim().toLowerCase();
    const memberEmail = (member.email || '').trim().toLowerCase();

    const isLeader =
      (team.leaderRoll && team.leaderRoll.trim().toLowerCase() === memberRoll) ||
      (team.leaderEmail && team.leaderEmail.trim().toLowerCase() === memberEmail);

    const alreadyJoined = (team.members || []).some(
      m =>
        (m.rollNumber && m.rollNumber.trim().toLowerCase() === memberRoll) ||
        (m.email && memberEmail !== '' && m.email.trim().toLowerCase() === memberEmail)
    );

    if (isLeader) {
      return {
        success: false,
        error: `You are already registered as the Team Leader of "${team.teamName}"!`
      };
    }

    if (alreadyJoined) {
      return {
        success: false,
        error: `You (${member.name}) are already a member of squad "${team.teamName}"!`
      };
    }

    // Add member to squad
    const updatedMembers = [...(team.members || []), member];
    team.members = updatedMembers;

    // Update local teams
    const teams = this.getTeams();
    const teamIdx = teams.findIndex(t => t.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normCode);
    if (teamIdx !== -1) {
      teams[teamIdx] = team;
    } else {
      teams.unshift(team);
    }
    this.saveTeams(teams);

    // Sync member into registrations roster
    const regs = this.getRegistrations();
    let regIdx = regs.findIndex(
      r =>
        (team.registrationId && r.id === team.registrationId) ||
        (r.teamCode && r.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normCode) ||
        (r.eventId === team.eventId && r.leaderRoll.toLowerCase() === team.leaderRoll.toLowerCase())
    );

    let updatedReg: Registration | undefined;

    if (regIdx !== -1) {
      regs[regIdx].teammates = [...(regs[regIdx].teammates || []), member];
      if (!regs[regIdx].teamCode) regs[regIdx].teamCode = team.teamCode;
      if (!regs[regIdx].teamName) regs[regIdx].teamName = team.teamName;
      updatedReg = regs[regIdx];
      this.saveRegistrations(regs);
    } else {
      // Create dedicated digital pass for joined member
      const id = `FEST-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const qrToken = `FEST26-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${id.slice(-4)}`;
      const newReg: Registration = {
        id,
        qrToken,
        eventId: team.eventId,
        eventTitle: team.eventTitle,
        leaderName: team.leaderName,
        leaderRoll: team.leaderRoll,
        leaderEmail: team.leaderEmail,
        leaderPhone: team.leaderPhone,
        leaderCollege: team.leaderCollege,
        buyerRoll: member.rollNumber,
        teammates: team.members,
        format: 'team',
        teamName: team.teamName,
        teamCode: team.teamCode,
        fee: 0,
        source: 'online',
        registrationDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
        paymentStatus: 'verified',
        checkedIn: false
      };
      regs.unshift(newReg);
      this.saveRegistrations(regs);
      updatedReg = newReg;
    }

    // Sync to Supabase cloud
    if (isSupabaseConfigured()) {
      try {
        await supabase.rpc('join_team_by_code', {
          p_code: cleanCode,
          p_member: member
        });
      } catch (err) {
        try {
          await supabase
            .from('teams')
            .update({ members: updatedMembers })
            .ilike('team_code', cleanCode);
        } catch {}
      }
    }

    return { success: true, team, registration: updatedReg };
  }

  static resetToDefaults(): void {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(INITIAL_REGISTRATIONS));
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(INITIAL_TEAMS));
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(DEPARTMENTS));
  }
}

// Auto-initialize realtime updates
StorageService.initRealtime();
