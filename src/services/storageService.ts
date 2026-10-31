import { FestEvent, Registration, Announcement, FestStats, PaymentStatus, Teammate, Team, Department } from '../types/festronix';
import { INITIAL_EVENTS, INITIAL_REGISTRATIONS, INITIAL_ANNOUNCEMENTS, INITIAL_TEAMS, DEPARTMENTS } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getEventRegistrationBlockReason, registrationDeadlineToIso } from '../lib/eventRegistration';
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
const PAYMENT_PROOF_BUCKET = 'payment-screenshots';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined | null): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

function paymentProofObjectPath(reference?: string): string | null {
  if (!reference || reference.startsWith('blob:') || reference.startsWith('data:')) return null;
  const marker = `/${PAYMENT_PROOF_BUCKET}/`;
  const markerIndex = reference.indexOf(marker);
  if (/^https?:\/\//i.test(reference) && markerIndex < 0) return null;
  const path = (markerIndex >= 0 ? reference.slice(markerIndex + marker.length) : reference).split(/[?#]/, 1)[0];
  try {
    return decodeURIComponent(path).replace(/^\/+/, '');
  } catch {
    return path.replace(/^\/+/, '');
  }
}

/**
 * Transforms Supabase events table row to FestEvent
 */
function eventFromDb(row: EventRow): FestEvent {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline || undefined,
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
    bannerGradient: row.banner_gradient,
    paymentInstructions: row.payment_instructions || undefined,
    faqs: Array.isArray(row.faqs) ? row.faqs as { question: string; answer: string }[] : [],
    approvalStatus: row.approval_status
  };
}

/**
 * Transforms FestEvent to Supabase events insert payload
 */
function eventToDb(evt: FestEvent) {
  const deadlineIso = registrationDeadlineToIso(evt.deadline);

  return {
    slug: evt.slug,
    title: evt.title,
    tagline: evt.tagline || null,
    department_code: evt.departmentCode,
    category: evt.category,
    format: evt.format,
    min_team_size: evt.minTeamSize,
    max_team_size: evt.maxTeamSize,
    fee: evt.fee,
    capacity: evt.capacity,
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
    banner_gradient: evt.bannerGradient || 'linear-gradient(135deg, #142042 0%, #283B78 50%, #789593 100%)',
    payment_instructions: evt.paymentInstructions || null,
    faqs: (evt.faqs || []) as any,
    approval_status: evt.approvalStatus || 'approved'
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
    scope: row.scope === 'event' ? 'department' : row.scope,
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
    checkedIn: Boolean(ticket?.checked_in ?? row.checked_in),
    checkedInAt: ticket?.checked_in_at || row.checked_in_at || undefined,
    checkedInBy: ticket?.checked_in_by || row.checked_in_by || undefined
  };
}

function teamFromDb(row: any): Team {
  return {
    id: String(row.id || ''),
    teamCode: String(row.team_code ?? row.teamCode ?? ''),
    teamName: String(row.team_name ?? row.teamName ?? ''),
    eventId: String(row.event_id ?? row.eventId ?? ''),
    eventTitle: String(row.event_title ?? row.eventTitle ?? ''),
    registrationId: String(row.registration_id ?? row.registrationId ?? ''),
    leaderId: row.leader_id ?? row.leaderId ?? undefined,
    leaderName: String(row.leader_name ?? row.leaderName ?? ''),
    leaderRoll: String(row.leader_roll ?? row.leaderRoll ?? ''),
    leaderEmail: String(row.leader_email ?? row.leaderEmail ?? ''),
    leaderPhone: String(row.leader_phone ?? row.leaderPhone ?? ''),
    leaderCollege: String(row.leader_college ?? row.leaderCollege ?? 'Vardhaman College of Engineering'),
    members: Array.isArray(row.members) ? row.members : [],
    maxTeamSize: Number(row.max_team_size ?? row.maxTeamSize) || 4,
    minTeamSize: Number(row.min_team_size ?? row.minTeamSize) || 2,
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
    memberCount: Number(row.member_count ?? row.memberCount) || 0,
    totalMemberCount: Number(row.total_member_count ?? row.totalMemberCount) || undefined,
    paymentStatus: row.payment_status ?? row.paymentStatus ?? undefined,
    leaderQrGenerated: Boolean(row.leader_qr_generated ?? row.leaderQrGenerated),
    leaderRegistrationStatus: row.leader_registration_status ?? row.leaderRegistrationStatus ?? undefined,
    updatedAt: row.updated_at ?? row.updatedAt ?? undefined,
    isCurrentUserLeader: Boolean(row.isCurrentUserLeader ?? row.is_current_user_leader),
    isCurrentUserMember: Boolean(row.isCurrentUserMember ?? row.is_current_user_member)
  };
}

export class StorageService {
  private static isRealtimeInitialized = false;

  private static canUseLocalDevelopmentMode(operation: string): boolean {
    if (isSupabaseConfigured()) return false;
    if (import.meta.env.DEV) return true;
    throw new Error(`${operation} requires a configured Supabase backend. Local browser storage is disabled in production.`);
  }

  /**
   * Initialize Supabase Realtime channel for live multi-client updates
   */
  static initRealtime(): void {
    if (this.isRealtimeInitialized) return;
    this.isRealtimeInitialized = true;

    // Cross-tab broadcast channel for immediate local tab synchronization
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('festronix_teams_sync_bus');
        bc.onmessage = (event) => {
          if (event.data?.type === 'TEAM_UPDATED' && event.data?.team) {
            StorageService.absorbRemoteTeam(event.data.team);
          }
        };
      } catch {}
    }

    if (!isSupabaseConfigured()) return;

    try {
      supabase
        .channel('festronix_live_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => {
          this.fetchRegistrations();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'registration_members' }, () => {
          this.fetchRegistrations();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
          this.fetchRegistrations();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_proofs' }, () => {
          this.fetchRegistrations();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
          this.fetchEvents();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, () => {
          this.fetchDepartments();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
          this.fetchAnnouncements();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
          this.fetchCloudTeams();
        })
        .on('broadcast', { event: 'team_reserved' }, (payload: any) => {
          if (payload?.payload?.team) {
            StorageService.absorbRemoteTeam(payload.payload.team);
          }
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

  static getDeletedEventIds(): string[] {
    const raw = localStorage.getItem('festronix_deleted_events_v1');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }

  static saveDeletedEventIds(ids: string[]): void {
    localStorage.setItem('festronix_deleted_events_v1', JSON.stringify(ids));
  }

  static saveCustomEvents(events: FestEvent[]): void {
    localStorage.setItem('festronix_custom_events_v1', JSON.stringify(events));
  }

  /**
   * Synchronous cached getter for instant render cycles
   */
  static getEvents(): FestEvent[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {}
    }
    return isSupabaseConfigured() ? [] : INITIAL_EVENTS;
  }

  static saveEvents(events: FestEvent[]): void {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }

  /**
   * Asynchronous fetch directly from Supabase (Single Source of Truth)
   */
  static async fetchEvents(): Promise<FestEvent[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_deleted', false)
        .order('title', { ascending: true });
      if (error) throw new Error(`Unable to load events: ${error.message}`);
      const mapped = (data || []).map(eventFromDb);
      this.saveEvents(mapped);
      window.dispatchEvent(new CustomEvent('festronix:events-updated', { detail: mapped }));
      return mapped;
    }
    return this.getEvents();
  }

  static async addEvent(newEvent: FestEvent): Promise<FestEvent> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('events').insert(eventToDb(newEvent)).select('*').single();
      if (error) throw new Error(`Unable to create event: ${error.message}`);
      if (!data) throw new Error('The database did not return the created event.');
      const created = eventFromDb(data);
      const events = [created, ...this.getEvents().filter(e => e.id !== created.id && e.slug !== created.slug)];
      this.saveEvents(events);
      window.dispatchEvent(new CustomEvent('festronix:events-updated', { detail: events }));
      return created;
    }

    this.canUseLocalDevelopmentMode('Creating events');

    const events = [newEvent, ...this.getEvents().filter(e => e.id !== newEvent.id && e.slug !== newEvent.slug)];
    this.saveEvents(events);
    window.dispatchEvent(new CustomEvent('festronix:events-updated', { detail: events }));
    return newEvent;
  }

  static async updateEvent(updatedEvent: FestEvent): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const query = supabase.from('events').update({ ...eventToDb(updatedEvent), updated_at: new Date().toISOString() });
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updatedEvent.id);
      const { data, error } = await (isUuid
        ? query.eq('id', updatedEvent.id)
        : query.eq('slug', updatedEvent.slug)).select('*').maybeSingle();
      if (error) throw new Error(`Unable to update event: ${error.message}`);
      if (!data) throw new Error('The event was not found or you do not have permission to update it.');
      const saved = eventFromDb(data);
      const events = this.getEvents().map(e => e.id === saved.id || e.slug === saved.slug ? saved : e);
      this.saveEvents(events);
      window.dispatchEvent(new CustomEvent('festronix:events-updated', { detail: events }));
      return true;
    }

    this.canUseLocalDevelopmentMode('Updating events');
    const events = this.getEvents().map(e => e.id === updatedEvent.id || e.slug === updatedEvent.slug ? updatedEvent : e);
    this.saveEvents(events);
    window.dispatchEvent(new CustomEvent('festronix:events-updated', { detail: events }));

    return true;
  }

  static async deleteEvent(eventId: string, slug?: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
      let eventUuid = eventId;
      if (!isUuid) {
        const { data: event, error: lookupError } = await supabase
          .from('events').select('id').eq('slug', slug || eventId).maybeSingle();
        if (lookupError) throw new Error(`Unable to find event: ${lookupError.message}`);
        if (!event) throw new Error('The event was not found.');
        eventUuid = event.id;
      }
      const { data, error } = await supabase.rpc('soft_delete_event', { p_event_id: eventUuid });
      if (error) throw new Error(`Unable to delete event: ${error.message}`);
      if (!(data as any)?.success) throw new Error('The event was not found or you do not have permission to delete it.');
      const events = this.getEvents().filter(e => e.id !== eventUuid && e.id !== eventId && e.slug !== (slug || eventId));
      this.saveEvents(events);
      window.dispatchEvent(new CustomEvent('festronix:events-updated', { detail: events }));
      return true;
    }

    this.canUseLocalDevelopmentMode('Deleting events');
    const events = this.getEvents().filter(e => e.id !== eventId && e.slug !== eventId && (!slug || (e.id !== slug && e.slug !== slug)));
    this.saveEvents(events);
    window.dispatchEvent(new CustomEvent('festronix:events-updated', { detail: events }));

    return true;
  }

  // ==========================================
  // REGISTRATIONS
  // ==========================================

  private static async resolveRegistrationEvent(eventId: string): Promise<{ id: string; event?: FestEvent }> {
    const cached = this.getEvents().find(event => event.id === eventId || event.slug === eventId);

    if (!isSupabaseConfigured()) {
      return { id: cached?.id || eventId, event: cached };
    }

    const query = supabase
      .from('events')
      .select('*')
      .eq('is_deleted', false);
    const { data, error } = await (isUuid(eventId)
      ? query.eq('id', eventId).maybeSingle()
      : query.eq('slug', eventId).maybeSingle());

    if (error) throw new Error(`Unable to resolve the selected event: ${error.message}`);
    if (!data) throw new Error('The selected event no longer exists or is unavailable. Refresh the events list and try again.');

    const event = eventFromDb(data as EventRow);
    const events = [event, ...this.getEvents().filter(item => item.id !== event.id && item.slug !== event.slug)];
    this.saveEvents(events);
    return { id: event.id, event };
  }

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

    // Demo seed registrations are only available in an offline development build.
    if (isSupabaseConfigured()) return current;
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
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          events (department_code, title),
          tickets (qr_token, checked_in, checked_in_at, checked_in_by),
          registration_members (name, email, phone, college, roll_number)
        `)
        .order('created_at', { ascending: false });
      if (error) throw new Error(`Unable to load registrations: ${error.message}`);
      const mapped = await this.signPaymentProofUrls((data || []).map(registrationFromDb));
      this.saveRegistrations(mapped);
      return mapped;
    }
    return this.getRegistrations();
  }

  private static async signPaymentProofUrls(registrations: Registration[]): Promise<Registration[]> {
    const pathsByRegistration = registrations
      .map(registration => ({ id: registration.id, path: paymentProofObjectPath(registration.paymentScreenshotUrl) }))
      .filter((entry): entry is { id: string; path: string } => Boolean(entry.path));
    if (pathsByRegistration.length === 0) return registrations;

    const { data, error } = await supabase.storage.from(PAYMENT_PROOF_BUCKET)
      .createSignedUrls([...new Set(pathsByRegistration.map(entry => entry.path))], 60 * 60);
    if (error) {
      console.warn('Unable to sign payment proof URLs:', error.message);
      return registrations;
    }

    const urlsByPath = new Map((data || []).map(item => [item.path, item.signedUrl]));
    return registrations.map(registration => {
      const path = paymentProofObjectPath(registration.paymentScreenshotUrl);
      const signedUrl = path ? urlsByPath.get(path) : undefined;
      return signedUrl ? { ...registration, paymentScreenshotUrl: signedUrl } : registration;
    });
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
    const requestedEvent = this.getEvents().find(event => event.id === eventId || event.slug === eventId);
    const canonicalEventId = requestedEvent?.id || eventId;
    const regs = this.getRegistrations();
    const existing = regs.find(r => {
      if (r.paymentStatus === 'rejected') return false; // Rejected registrations are allowed to re-register
      const isSameEvent = r.eventId === eventId
        || r.eventId.toLowerCase() === eventId.toLowerCase()
        || r.eventId === canonicalEventId
        || r.eventId.toLowerCase() === canonicalEventId.toLowerCase();
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
    if (!isSupabaseConfigured()) {
      // Offline development checks only. Supabase is the source of truth in configured builds.
      const events = this.getEvents();
      const event = events.find(e => e.id === newReg.eventId || e.slug === newReg.eventId);
      if (event) {
        const blockReason = getEventRegistrationBlockReason(event);
        if (blockReason) throw new Error(blockReason);
      }

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
    }

    // --- SUPABASE RPC REGISTRATION FLOW ---
    if (isSupabaseConfigured()) {
      try {
        const { id: targetEventUuid, event: matchedEvent } = await this.resolveRegistrationEvent(newReg.eventId);
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) throw new Error('Your sign-in session has expired. Sign in again before registering.');

        const rpcPayload = {
          p_event_id: targetEventUuid,
          p_user_id: newReg.source === 'spot' ? null : authData.user.id,
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
          p_teammates: (newReg.teammates || []) as any,
          p_team_name: newReg.teamName || null,
          p_team_code: newReg.teamCode || null
        };

        const { data: rpcRes, error: rpcError } = await supabase.rpc('create_registration', rpcPayload);
        if (rpcError) throw new Error(`Unable to create registration: ${rpcError.message}`);

        if (rpcRes && (rpcRes as any).success) {
          const regPayload = (rpcRes as any).registration;
          const fullReg: Registration = {
            id: regPayload.id,
            userId: newReg.source === 'spot' ? undefined : authData.user.id,
            buyerRoll: newReg.buyerRoll,
            eventId: targetEventUuid,
            eventTitle: regPayload.eventTitle || newReg.eventTitle,
            departmentCode: newReg.departmentCode || matchedEvent?.departmentCode || this.resolveDepartmentForRegistration(newReg as any),
            teamName: regPayload.teamName || newReg.teamName,
            teamCode: regPayload.teamCode || newReg.teamCode,
            leaderName: newReg.leaderName,
            leaderEmail: newReg.leaderEmail,
            leaderPhone: newReg.leaderPhone,
            leaderCollege: newReg.leaderCollege,
            leaderRoll: newReg.leaderRoll,
            teammates: newReg.teammates || [],
            format: regPayload.format || newReg.format,
            fee: Number(regPayload.fee ?? newReg.fee) || 0,
            source: newReg.source,
            registrationDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
            paymentStatus: regPayload.paymentStatus || newReg.paymentStatus,
            transactionId: regPayload.transactionId || newReg.transactionId,
            paymentScreenshotUrl: newReg.paymentScreenshotUrl,
            qrToken: regPayload.qrToken,
            checkedIn: false
          };

          // Re-read the row created by the RPC so every portal receives the same
          // server-derived fee, status, event UUID, ticket, and roster data.
          let regWithSignedProof = fullReg;
          try {
            const liveRegs = await this.fetchRegistrations();
            regWithSignedProof = liveRegs.find(reg => reg.id === fullReg.id) || fullReg;
          } catch (refreshError) {
            console.warn('Registration created, but the immediate canonical refresh failed:', refreshError);
            [regWithSignedProof] = await this.signPaymentProofUrls([fullReg]);
            const currentRegs = this.getRegistrations();
            this.saveRegistrations([regWithSignedProof, ...currentRegs.filter(reg => reg.id !== regWithSignedProof.id)]);
          }
          await this.fetchEvents().catch(() => undefined);

          // If team registration, save team entity
          if (newReg.teamCode || newReg.teamName) {
            const evts = this.getEvents();
            const matchedEvt = evts.find(e => e.id === targetEventUuid || e.slug === newReg.eventId);
            this.createTeam({
              teamCode: regWithSignedProof.teamCode || newReg.teamCode || this.generateTeamCode(targetEventUuid),
              teamName: newReg.teamName || `${newReg.leaderName}'s Squad`,
              eventId: targetEventUuid,
              eventTitle: matchedEvent?.title || newReg.eventTitle,
              registrationId: regWithSignedProof.id,
              leaderId: newReg.source === 'spot' ? undefined : authData.user.id,
              leaderName: newReg.leaderName,
              leaderRoll: newReg.leaderRoll,
              leaderEmail: newReg.leaderEmail,
              leaderPhone: newReg.leaderPhone,
              leaderCollege: newReg.leaderCollege,
              members: newReg.teammates || [],
              maxTeamSize: matchedEvt?.maxTeamSize || 4,
              minTeamSize: matchedEvt?.minTeamSize || 2
            });
            this.syncTeammatePassesForTeam(regWithSignedProof);
          }

          return regWithSignedProof;
        }
        throw new Error((rpcRes as any)?.error || 'The database rejected this registration.');
      } catch (err) {
        throw err instanceof Error ? err : new Error('Unable to create registration in Supabase.');
      }
    }

    this.canUseLocalDevelopmentMode('Creating registrations');

    // Offline development flow only.
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
      this.syncTeammatePassesForTeam(fullReg);
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
    if (batch.length === 0) return [];

    if (isSupabaseConfigured()) {
      if (batch.length > 10) throw new Error('You can create at most 10 passes in one order.');

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error('Your sign-in session has expired. Sign in again before registering.');

      const resolved = await Promise.all(batch.map(async item => {
        const { id } = await this.resolveRegistrationEvent(item.eventId);
        return {
          eventId: id,
          buyerRoll: item.buyerRoll || item.leaderRoll || null,
          leaderName: item.leaderName,
          leaderEmail: item.leaderEmail,
          leaderPhone: item.leaderPhone,
          leaderCollege: item.leaderCollege,
          leaderRoll: item.leaderRoll,
          format: item.format,
          fee: item.fee,
          paymentStatus: item.paymentStatus,
          transactionId: item.transactionId || null,
          paymentScreenshotUrl: item.paymentScreenshotUrl || null,
          teammates: (item.teammates || []) as any,
          teamName: item.teamName || null,
          teamCode: item.teamCode || null
        };
      }));

      const { data, error } = await supabase.rpc('create_registrations', {
        p_user_id: authData.user.id,
        p_items: resolved as any,
        p_source: 'online'
      });
      if (error) throw new Error(`Unable to create registrations: ${error.message}`);
      if (!(data as any)?.success) throw new Error((data as any)?.error || 'The database rejected this registration order.');

      const createdPayloads = Array.isArray((data as any).registrations) ? (data as any).registrations : [];
      const liveRegs = await this.fetchRegistrations();
      await this.fetchEvents().catch(() => undefined);
      const created = createdPayloads.map((payload: any, index: number) => {
        const canonical = liveRegs.find(reg => reg.id === payload.id);
        if (canonical) return canonical;
        const source = batch[index];
        return {
          ...source,
          id: payload.id,
          eventId: payload.eventId || resolved[index].eventId,
          fee: Number(payload.fee ?? source.fee) || 0,
          paymentStatus: payload.paymentStatus || source.paymentStatus,
          qrToken: payload.qrToken || '',
          checkedIn: false
        } as Registration;
      });
      if (created.length !== batch.length) throw new Error('The database did not return every created registration. Refresh and check My Passes.');
      return created;
    }

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
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.rpc('review_registration_payment', {
        p_display_id: regId,
        p_status: status,
        p_rejection_reason: rejectionReason || null
      });
      if (error) throw new Error(`Unable to update payment status: ${error.message}`);
      if (!(data as any)?.success) throw new Error((data as any)?.error || 'The database rejected the payment update.');

      const regs = this.getRegistrations();
      const idx = regs.findIndex(r => r.id === regId || r.qrToken === regId);
      if (idx !== -1) {
        regs[idx] = {
          ...regs[idx],
          paymentStatus: status,
          verifiedBy: (data as any).verifiedBy || reviewerName,
          verifiedAt: (data as any).verifiedAt || new Date().toISOString(),
          rejectionReason: status === 'rejected' ? rejectionReason : undefined
        };
        this.saveRegistrations(regs);
      }
      return true;
    }

    this.canUseLocalDevelopmentMode('Reviewing payments');
    const regs = this.getRegistrations();
    const idx = regs.findIndex(r => r.id === regId || r.qrToken === regId);
    if (idx === -1) throw new Error('Registration not found.');
    regs[idx] = {
      ...regs[idx],
      paymentStatus: status,
      verifiedBy: reviewerName,
      verifiedAt: new Date().toISOString(),
      rejectionReason: status === 'rejected' ? rejectionReason : undefined
    };
    this.saveRegistrations(regs);
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
      const { data, error } = await supabase.rpc('check_in_registration', {
        p_qr_token_or_id: qrTokenOrId,
        p_staff_name: staffName
      });
      if (error) throw new Error(`Unable to check in participant: ${error.message}`);
      if (!data) throw new Error('The check-in service returned no result.');
      const result = data as any;
      const regs = this.getRegistrations();
      const target = regs.find(r => r.qrToken.toLowerCase() === qrTokenOrId.trim().toLowerCase() || r.id.toLowerCase() === qrTokenOrId.trim().toLowerCase());
      if (result.success && target) {
        target.checkedIn = true;
        target.checkedInAt = result.registration?.checkedInAt || new Date().toISOString();
        target.checkedInBy = result.registration?.checkedInBy || staffName;
        this.saveRegistrations(regs);
      }
      const serverRegistration = result.registration ? {
        id: result.registration.id,
        eventId: result.registration.eventId || '',
        eventTitle: result.registration.eventTitle || '',
        leaderName: result.registration.leaderName || '',
        leaderEmail: '',
        leaderPhone: '',
        leaderCollege: result.registration.leaderCollege || '',
        leaderRoll: result.registration.leaderRoll || '',
        teammates: [],
        format: 'individual',
        fee: 0,
        source: 'online',
        registrationDate: '',
        paymentStatus: result.registration.paymentStatus || 'not_applicable',
        qrToken: result.registration.qrToken || qrTokenOrId,
        checkedIn: Boolean(result.registration.checkedIn),
        checkedInAt: result.registration.checkedInAt,
        checkedInBy: result.registration.checkedInBy
      } as Registration : undefined;
      return {
        success: Boolean(result.success),
        status: result.status || (result.success ? 'VALID' : 'NOT_FOUND'),
        message: result.message || 'Check-in request completed.',
        registration: serverRegistration
      };
    }

    this.canUseLocalDevelopmentMode('Checking in participants');

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
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.rpc('toggle_check_in_registration', {
        p_display_id: regId,
        p_staff_name: staffName
      });
      if (error) throw new Error(`Unable to update check-in status: ${error.message}`);
      if (!(data as any)?.success) throw new Error((data as any)?.error || 'The database rejected the check-in update.');
      const newCheckedIn = Boolean((data as any).checkedIn);
      const regs = this.getRegistrations();
      const target = regs.find(r => r.id === regId || r.qrToken === regId);
      if (target) {
        target.checkedIn = newCheckedIn;
        target.checkedInAt = newCheckedIn ? new Date().toISOString() : undefined;
        target.checkedInBy = newCheckedIn ? staffName : undefined;
        this.saveRegistrations(regs);
      }
      return { success: true, checkedIn: newCheckedIn };
    }

    this.canUseLocalDevelopmentMode('Changing check-in status');
    const regs = this.getRegistrations();
    const target = regs.find(r => r.id === regId || r.qrToken === regId);
    if (!target) return { success: false, checkedIn: false };
    const newCheckedIn = !target.checkedIn;
    target.checkedIn = newCheckedIn;
    target.checkedInAt = newCheckedIn ? new Date().toISOString() : undefined;
    target.checkedInBy = newCheckedIn ? staffName : undefined;
    this.saveRegistrations(regs);
    return { success: true, checkedIn: newCheckedIn };
  }

  /**
   * Upload payment screenshot to Supabase Storage bucket 'payment-screenshots'
   */
  static async uploadPaymentScreenshot(
    file: File,
    _regDisplayId: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    if (isSupabaseConfigured()) {
      try {
        const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
        if (!allowedTypes.has(file.type)) throw new Error('Upload a JPEG, PNG, or WebP image.');
        if (file.size > 5 * 1024 * 1024) throw new Error('Payment proof must be 5 MB or smaller.');
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) throw new Error('Sign in before uploading payment proof.');
        const fileExt = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
        const filePath = `${authData.user.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(PAYMENT_PROOF_BUCKET)
          .upload(filePath, file, { upsert: false, contentType: file.type, cacheControl: '3600' });

        if (uploadError) {
          throw uploadError;
        }
        return { success: true, url: filePath };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Unable to upload payment proof.' };
      }
    }

    this.canUseLocalDevelopmentMode('Uploading payment proofs');
    const localUrl = URL.createObjectURL(file);
    return { success: true, url: localUrl };
  }

  // ==========================================
  // ANNOUNCEMENTS
  // ==========================================

  static getAnnouncements(): Announcement[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    if (!raw) {
      if (isSupabaseConfigured()) return [];
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
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(`Unable to load announcements: ${error.message}`);
      const mapped = (data || []).map(announcementFromDb);
      this.saveAnnouncements(mapped);
      window.dispatchEvent(new CustomEvent('festronix:announcements-updated', { detail: mapped }));
      return mapped;
    }
    return this.getAnnouncements();
  }

  static async addAnnouncement(data: Omit<Announcement, 'id' | 'date'>): Promise<Announcement> {
    if (isSupabaseConfigured()) {
      const { data: authData } = await supabase.auth.getUser();
      const dateDisplay = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const { data: row, error } = await supabase.from('announcements').insert({
        title: data.title,
        message: data.message,
        type: data.type,
        scope: data.scope,
        department_code: data.departmentCode || null,
        published_by: authData.user?.id || null,
        date_display: dateDisplay
      }).select('*').single();
      if (error) throw new Error(`Unable to create announcement: ${error.message}`);
      if (!row) throw new Error('The database did not return the created announcement.');
      const created = announcementFromDb(row);
      const list = [created, ...this.getAnnouncements().filter(item => item.id !== created.id)];
      this.saveAnnouncements(list);
      window.dispatchEvent(new CustomEvent('festronix:announcements-updated', { detail: list }));
      return created;
    }

    this.canUseLocalDevelopmentMode('Creating announcements');
    const list = this.getAnnouncements();
    const newAnn: Announcement = {
      ...data,
      id: `ann-${Date.now()}`,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    list.unshift(newAnn);
    this.saveAnnouncements(list);
    return newAnn;
  }

  static async deleteAnnouncement(annId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('announcements').delete().eq('id', annId).select('id').maybeSingle();
      if (error) throw new Error(`Unable to delete announcement: ${error.message}`);
      if (!data) throw new Error('Announcement was not found or you do not have permission to delete it.');
      const list = this.getAnnouncements().filter(item => item.id !== data.id);
      this.saveAnnouncements(list);
      window.dispatchEvent(new CustomEvent('festronix:announcements-updated', { detail: list }));
      return;
    }

    this.canUseLocalDevelopmentMode('Deleting announcements');
    const list = this.getAnnouncements().filter(a => a.id !== annId);
    this.saveAnnouncements(list);
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
    if (isSupabaseConfigured()) return [];
    // Default to DEPARTMENTS mock data and persist for offline development.
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(DEPARTMENTS));
    return [...DEPARTMENTS];
  }

  static saveDepartments(departments: Department[]): void {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
    window.dispatchEvent(new CustomEvent('festronix:departments-updated', { detail: departments }));
  }

  static async fetchDepartments(): Promise<Department[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('departments').select('*').order('name', { ascending: true });
      if (error) throw new Error(`Unable to load departments: ${error.message}`);
      const mapped: Department[] = (data || []).map((d: any) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        description: d.description || '',
        chiefCoordinator: d.chief_coordinator || '',
        contact: d.contact || '',
        iconName: d.icon_name || 'Cpu'
      }));
      this.saveDepartments(mapped);
      return mapped;
    }
    return this.getDepartments();
  }

  static async addDepartment(dept: Omit<Department, 'id'> & { id?: string }): Promise<Department> {
    const cleanCode = dept.code.trim().toUpperCase();
    const payload = {
      code: cleanCode,
      name: dept.name.trim(),
      description: dept.description?.trim() || 'Academic Department for FESTRONIX 2026',
      chief_coordinator: dept.chiefCoordinator?.trim() || 'Department Chief',
      contact: dept.contact?.trim() || `${cleanCode.toLowerCase()}.festronix@vardhaman.org`,
      icon_name: dept.iconName || 'Cpu'
    };
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('departments').insert(payload).select('*').single();
      if (error) throw new Error(`Unable to create department: ${error.message}`);
      if (!data) throw new Error('The database did not return the created department.');
      const created: Department = {
        id: data.id, code: data.code, name: data.name,
        description: data.description || '', chiefCoordinator: data.chief_coordinator || '',
        contact: data.contact || '', iconName: data.icon_name || 'Cpu'
      };
      this.saveDepartments([...this.getDepartments(), created]);
      return created;
    }

    this.canUseLocalDevelopmentMode('Creating departments');
    const newDept: Department = {
      id: dept.id || `dept-${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      code: cleanCode,
      name: payload.name,
      description: payload.description,
      chiefCoordinator: payload.chief_coordinator,
      contact: payload.contact,
      iconName: payload.icon_name
    };
    const departments = this.getDepartments();
    const existingIdx = departments.findIndex(d => d.code.toUpperCase() === cleanCode || d.id === newDept.id);
    if (existingIdx < 0) departments.push(newDept);
    else departments[existingIdx] = newDept;
    this.saveDepartments(departments);
    return newDept;
  }

  static async updateDepartment(idOrCode: string, updated: Partial<Department>): Promise<Department | null> {
    const cleanKey = idOrCode.trim().toUpperCase();
    if (isSupabaseConfigured()) {
      const payload = {
        ...(updated.code !== undefined ? { code: updated.code.trim().toUpperCase() } : {}),
        ...(updated.name !== undefined ? { name: updated.name.trim() } : {}),
        ...(updated.description !== undefined ? { description: updated.description.trim() } : {}),
        ...(updated.chiefCoordinator !== undefined ? { chief_coordinator: updated.chiefCoordinator.trim() } : {}),
        ...(updated.contact !== undefined ? { contact: updated.contact.trim() } : {}),
        ...(updated.iconName !== undefined ? { icon_name: updated.iconName } : {})
      };
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
      const query = supabase.from('departments').update(payload);
      const { data, error } = await (isUuid ? query.eq('id', idOrCode) : query.eq('code', cleanKey)).select('*').maybeSingle();
      if (error) throw new Error(`Unable to update department: ${error.message}`);
      if (!data) throw new Error('Department was not found or you do not have permission to update it.');
      const saved: Department = {
        id: data.id, code: data.code, name: data.name,
        description: data.description || '', chiefCoordinator: data.chief_coordinator || '',
        contact: data.contact || '', iconName: data.icon_name || 'Cpu'
      };
      this.saveDepartments(this.getDepartments().map(dept => dept.id === saved.id ? saved : dept));
      return saved;
    }

    this.canUseLocalDevelopmentMode('Updating departments');
    const departments = this.getDepartments();
    const idx = departments.findIndex(d => d.id === idOrCode || d.code.toUpperCase() === cleanKey);
    if (idx === -1) return null;
    const merged = { ...departments[idx], ...updated, code: updated.code?.trim().toUpperCase() || departments[idx].code };
    departments[idx] = merged;
    this.saveDepartments(departments);
    return merged;
  }

  static async deleteDepartment(idOrCode: string): Promise<boolean> {
    const cleanKey = idOrCode.trim().toUpperCase();
    if (isSupabaseConfigured()) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
      const query = supabase.from('departments').delete();
      const { data, error } = await (isUuid ? query.eq('id', idOrCode) : query.eq('code', cleanKey)).select('id,code').maybeSingle();
      if (error) throw new Error(`Unable to delete department. Remove or reassign its events and coordinators first: ${error.message}`);
      if (!data) throw new Error('Department was not found or you do not have permission to delete it.');
      this.saveDepartments(this.getDepartments().filter(dept => dept.id !== data.id));
      return true;
    }

    this.canUseLocalDevelopmentMode('Deleting departments');
    const departments = this.getDepartments();
    this.saveDepartments(departments.filter(d => d.id !== idOrCode && d.code.toUpperCase() !== cleanKey));
    return true;
  }

  // ==========================================
  // TEAMS (Industry-Standard Squad System)
  // ==========================================

  static getTeams(): Team[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TEAMS);
    if (!raw) {
      if (isSupabaseConfigured()) return [];
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(INITIAL_TEAMS));
      return INITIAL_TEAMS;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : (isSupabaseConfigured() ? [] : INITIAL_TEAMS);
    } catch {
      return isSupabaseConfigured() ? [] : INITIAL_TEAMS;
    }
  }

  private static _inFlightTeams: Map<string, Team> = new Map();

  static absorbRemoteTeam(team: Team): void {
    if (!team || !team.teamCode) return;
    const norm = team.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    this._inFlightTeams.set(norm, team);

    const localTeams = this.getTeams();
    const existingIdx = localTeams.findIndex(t => t.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === norm);
    if (existingIdx !== -1) {
      localTeams[existingIdx] = { ...localTeams[existingIdx], ...team };
    } else {
      localTeams.unshift(team);
    }
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(localTeams));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('festronix:teams-updated', { detail: localTeams }));
    }
  }

  static broadcastTeam(team: Team): void {
    if (!team || !team.teamCode) return;
    const norm = team.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    this._inFlightTeams.set(norm, team);

    // Cross-tab broadcast
    try {
      if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('festronix_teams_sync_bus');
        bc.postMessage({ type: 'TEAM_UPDATED', team });
        bc.close();
      }
    } catch {}

    // In-window custom event broadcast
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('festronix:teams-updated', { detail: { team } }));
      } catch {}
    }

    // Supabase realtime broadcast
    if (typeof window !== 'undefined' && isSupabaseConfigured()) {
      try {
        const sbChannel = supabase.channel('festronix_live_sync');
        sbChannel.send({
          type: 'broadcast',
          event: 'team_reserved',
          payload: { team }
        }).catch(() => {});
      } catch {}
    }
  }

  /**
   * Check if team leader has paid the event fee
   */
  static isTeamLeaderPaid(teamCodeOrTeam: string | Team, eventId?: string): { isPaid: boolean; leaderReg?: Registration } {
    const allRegs = this.getRegistrations();
    let normCode = '';
    let leaderRoll = '';
    let regId = '';
    let evtId = eventId || '';

    if (typeof teamCodeOrTeam === 'string') {
      normCode = teamCodeOrTeam.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const teams = this.getTeams();
      const t = teams.find(team => team.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normCode);
      if (t) {
        leaderRoll = t.leaderRoll || '';
        regId = t.registrationId || '';
        if (!evtId) evtId = t.eventId;
      }
    } else {
      normCode = teamCodeOrTeam.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      leaderRoll = teamCodeOrTeam.leaderRoll || '';
      regId = teamCodeOrTeam.registrationId || '';
      if (!evtId) evtId = teamCodeOrTeam.eventId;
    }

    const leaderReg = allRegs.find(
      r =>
        (regId && r.id === regId) ||
        (r.teamCode && r.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normCode && (r.fee > 0 || r.transactionId || r.paymentScreenshotUrl)) ||
        (evtId && r.eventId === evtId && leaderRoll && r.leaderRoll && r.leaderRoll.toLowerCase() === leaderRoll.toLowerCase())
    );

    const isPaid = !!leaderReg && (leaderReg.paymentStatus === 'verified' || leaderReg.paymentStatus === 'verification_pending');
    return { isPaid, leaderReg };
  }

  /**
   * Synchronize all teammate passes for a team once the leader submits payment
   */
  static syncTeammatePassesForTeam(leaderReg: Registration): void {
    if (!leaderReg.teamCode) return;
    const normCode = leaderReg.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const regs = this.getRegistrations();
    let updated = false;

    for (let i = 0; i < regs.length; i++) {
      const r = regs[i];
      if (r.id !== leaderReg.id && r.teamCode && r.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normCode) {
        // Upgrade teammate pass from pending payment
        if (r.paymentStatus === 'payment_required' || !r.qrToken || r.qrToken === '') {
          r.paymentStatus = leaderReg.paymentStatus;
          if (!r.qrToken || r.qrToken === '') {
            r.qrToken = `FEST26-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${r.id.slice(-4)}`;
          }
          if (leaderReg.transactionId) r.transactionId = leaderReg.transactionId;
          if (leaderReg.paymentScreenshotUrl) r.paymentScreenshotUrl = leaderReg.paymentScreenshotUrl;
          updated = true;
        }
      }
    }

    if (updated) {
      this.saveRegistrations(regs);
      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('festronix:registrations-updated', { detail: { registrations: regs } }));
        } catch {}
      }
    }

    // Also update team entity
    const teams = this.getTeams();
    const tIdx = teams.findIndex(t => t.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normCode);
    if (tIdx !== -1) {
      teams[tIdx].registrationId = leaderReg.id;
      // Merge leader's teammates with team's members
      const existingMembers = teams[tIdx].members || [];
      const leaderMembers = leaderReg.teammates || [];
      const mergedMembers = [...existingMembers];
      leaderMembers.forEach(lm => {
        if (!mergedMembers.some(em => (em.rollNumber && lm.rollNumber && em.rollNumber.trim().toLowerCase() === lm.rollNumber.trim().toLowerCase()))) {
          mergedMembers.push(lm);
        }
      });
      teams[tIdx].members = mergedMembers;
      this.saveTeams(teams);
      this.broadcastTeam(teams[tIdx]);
    }
  }

  /**
   * Remove a member from a squad
   */
  static removeTeamMember(teamCode: string, identifier: string): { success: boolean; team?: Team } {
    const normCode = teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const cleanId = (identifier || '').trim().toLowerCase();
    const teams = this.getTeams();
    const tIdx = teams.findIndex(t => t.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normCode);
    if (tIdx === -1) return { success: false };

    const team = teams[tIdx];
    team.members = (team.members || []).filter(
      m => (m.rollNumber || '').trim().toLowerCase() !== cleanId && (m.email || '').trim().toLowerCase() !== cleanId && (m.name || '').trim().toLowerCase() !== cleanId
    );
    teams[tIdx] = team;
    this.saveTeams(teams);
    this.broadcastTeam(team);

    // Also remove or cancel their registration pass if present
    const regs = this.getRegistrations();
    const filteredRegs = regs.filter(r => {
      const isThisTeam = r.teamCode && r.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normCode;
      const isThisMember = (r.buyerRoll && r.buyerRoll.trim().toLowerCase() === cleanId) ||
        (r.leaderRoll && r.leaderRoll.trim().toLowerCase() === cleanId && r.id !== team.registrationId);
      return !(isThisTeam && isThisMember && r.id !== team.registrationId);
    });
    this.saveRegistrations(filteredRegs);

    return { success: true, team };
  }

  static async fetchCloudTeams(): Promise<Team[]> {
    if (!isSupabaseConfigured()) return this.getTeams();
    const { data, error } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(`Unable to load your teams: ${error.message}`);
    const teams = (data || []).map(teamFromDb);
    this.saveTeams(teams);
    return teams;
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
   * Seamlessly resolves team codes across:
   * 1. In-flight dynamic memory (just generated codes)
   * 2. Local storage teams
   * 3. Seeded fallback teams
   * 4. Registrations pass table
   * 5. Supabase cloud database
   * 6. Algorithmic In-Progress Squad Resolver (allows newly shared codes e.g. FX-MECH-2721 to be verified instantly)
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

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.rpc('find_team_by_code', { p_code: rawClean });
      if (error) return { team: null, error: `Unable to look up this team: ${error.message}` };
      if (!(data as any)?.success || !(data as any)?.team) {
        return { team: null, error: (data as any)?.error || `Team code "${rawClean}" was not found.` };
      }

      const found = teamFromDb((data as any).team);
      if (eventId) {
        const currentEvent = this.getEvents().find(e => e.id === eventId || e.slug === eventId);
        if (currentEvent && found.eventId !== currentEvent.id && found.eventId !== currentEvent.slug) {
          return {
            team: null,
            error: `Team code "${found.teamCode}" belongs to "${found.eventTitle}", but you are registering for "${currentEvent.title}".`
          };
        }
      }

      const cached = this.getTeams().filter(t => t.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() !== normQuery);
      this.saveTeams([found, ...cached]);
      return { team: found };
    }

    let found: Team | null = null;

    // 0. Check in-flight dynamic teams map
    if (this._inFlightTeams.has(normQuery)) {
      found = this._inFlightTeams.get(normQuery)!;
    }

    // 1. Check local teams store
    if (!found) {
      const localTeams = this.getTeams();
      found = localTeams.find(t => t.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normQuery) || null;
    }

    // 1b. Check INITIAL_TEAMS as fallback
    if (!found) {
      found = INITIAL_TEAMS.find(t => t.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normQuery) || null;
      if (found) {
        this.saveTeams([found, ...this.getTeams().filter(t => t.teamCode !== found!.teamCode)]);
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
        this.saveTeams([found, ...this.getTeams().filter(t => t.teamCode !== found!.teamCode)]);
      }
    }

    // 3. Check Supabase cloud database if connected
    if (!found && isSupabaseConfigured()) {
      try {
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

    // 4. DYNAMIC RESOLUTION FOR JUST-GENERATED IN-FLIGHT TEAM CODES
    // If the code was just generated by the leader on their screen (e.g. FX-MECH-2721)
    // and hasn't completed payment/DB sync yet, decode the code and resolve the squad dynamically!
    if (!found) {
      const events = this.getEvents();
      const currentEvt = eventId ? events.find(e => e.id === eventId || e.slug === eventId) : null;

      // Syntax pattern: FX-<TAG>-<NUM> or <TAG>-<NUM> or FX<TAG><NUM>
      // Examples: FX-MECH-2721, FX-CSE-1029, FX-CADG-4821, FXMECH2721
      const pattern = /^(?:FX[-_]?)?([A-Za-z0-9]{2,6})[-_]?(\d{3,5})$/i;
      const match = rawClean.match(pattern);

      if (match) {
        const rawTag = match[1].toUpperCase();
        const randNum = match[2];
        const normalizedFormat = `FX-${rawTag}-${randNum}`;

        // Check if tag corresponds to current event
        let isMatchingCurrentEvent = false;
        if (currentEvt) {
          const deptMatch = (currentEvt.departmentCode || '').toUpperCase().includes(rawTag) || rawTag.includes((currentEvt.departmentCode || '').toUpperCase());
          const slugMatch = (currentEvt.slug || '').toUpperCase().replace(/[^A-Z0-9]/g, '').includes(rawTag);
          const titleMatch = (currentEvt.title || '').toUpperCase().replace(/[^A-Z0-9]/g, '').includes(rawTag);
          isMatchingCurrentEvent = deptMatch || slugMatch || titleMatch;
        }

        if (isMatchingCurrentEvent && currentEvt) {
          // Instantly instantiate and reserve this active in-flight squad!
          found = {
            id: `TEAM-${normQuery}`,
            teamCode: normalizedFormat,
            teamName: `Squad ${normalizedFormat}`,
            eventId: currentEvt.id,
            eventTitle: currentEvt.title,
            registrationId: '',
            leaderName: 'Squad Leader (Registration in progress)',
            leaderRoll: '',
            leaderEmail: '',
            leaderPhone: '',
            leaderCollege: 'Vardhaman College of Engineering',
            members: [],
            maxTeamSize: currentEvt.maxTeamSize || 4,
            minTeamSize: currentEvt.minTeamSize || 2,
            createdAt: new Date().toISOString()
          };
          this._inFlightTeams.set(normQuery, found);
          this.saveTeams([found, ...this.getTeams().filter(t => t.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() !== normQuery)]);
          this.broadcastTeam(found);
        } else if (currentEvt) {
          // Tag belongs to another department or event
          const otherDept = DEPARTMENTS.find(d => d.code.toUpperCase() === rawTag || d.id.toUpperCase() === rawTag);
          const otherEvt = events.find(e => 
            (e.departmentCode && e.departmentCode.toUpperCase() === rawTag) ||
            (e.slug && e.slug.toUpperCase().replace(/[^A-Z0-9]/g, '').includes(rawTag))
          );

          if (otherDept || otherEvt) {
            const deptLabel = otherDept ? otherDept.name : (otherEvt?.departmentCode || rawTag);
            const evtLabel = otherEvt ? `"${otherEvt.title}"` : `${deptLabel} Department`;
            return {
              team: null,
              error: `Team code "${rawClean}" belongs to ${evtLabel}. You are currently registering for "${currentEvt.title}" (${currentEvt.departmentCode}). Please open the matching event to join.`
            };
          }
        } else {
          // No specific event was requested; try to match rawTag to any event
          const matchedEvt = events.find(e => 
            (e.departmentCode && e.departmentCode.toUpperCase() === rawTag) ||
            (e.slug && e.slug.toUpperCase().replace(/[^A-Z0-9]/g, '').includes(rawTag))
          );
          if (matchedEvt) {
            found = {
              id: `TEAM-${normQuery}`,
              teamCode: normalizedFormat,
              teamName: `Squad ${normalizedFormat}`,
              eventId: matchedEvt.id,
              eventTitle: matchedEvt.title,
              registrationId: '',
              leaderName: 'Squad Leader (Registration in progress)',
              leaderRoll: '',
              leaderEmail: '',
              leaderPhone: '',
              leaderCollege: 'Vardhaman College of Engineering',
              members: [],
              maxTeamSize: matchedEvt.maxTeamSize || 4,
              minTeamSize: matchedEvt.minTeamSize || 2,
              createdAt: new Date().toISOString()
            };
            this._inFlightTeams.set(normQuery, found);
            this.saveTeams([found, ...this.getTeams().filter(t => t.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() !== normQuery)]);
            this.broadcastTeam(found);
          }
        }
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
   * Fetches the privacy-safe live dashboard for a team. Members can see the
   * roster summary, leader name, capacity, and payment state without gaining
   * access to the leader's payment proof or private contact fields.
   */
  static async fetchTeamDashboard(teamCode: string, eventId?: string): Promise<Team | null> {
    if (!teamCode.trim()) return null;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.rpc('get_team_dashboard', { p_code: teamCode.trim() });
      let team: Team | null = null;

      if (!error && (data as any)?.success && (data as any)?.team) {
        team = teamFromDb((data as any).team);
      } else {
        // Keep older Supabase projects usable until the dashboard migration is
        // applied. The existing lookup still provides safe roster metadata;
        // payment state is derived from the participant registrations cache.
        const fallback = await this.findTeamWithValidation(teamCode, eventId);
        if (!fallback.team) {
          throw new Error(error?.message || fallback.error || 'The team dashboard is unavailable.');
        }
        team = { ...fallback.team };
        const normalizedCode = team.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const matchingRegistrations = this.getRegistrations().filter(
          registration => registration.teamCode && registration.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normalizedCode
        );
        const event = this.getEvents().find(item => item.id === team!.eventId || item.slug === team!.eventId);
        const leaderRegistration = matchingRegistrations.find(registration => registration.fee > 0);
        team.paymentStatus = event?.fee === 0
          ? 'not_applicable'
          : leaderRegistration?.paymentStatus || matchingRegistrations[0]?.paymentStatus || 'payment_required';
        team.totalMemberCount = 1 + Math.max(team.memberCount || 0, team.members?.length || 0);
      }

      if (eventId && team.eventId !== eventId && team.eventId !== this.getEvents().find(e => e.id === eventId || e.slug === eventId)?.id) {
        return null;
      }

      const normCode = team.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const teams = [team, ...this.getTeams().filter(t => t.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() !== normCode)];
      this._inFlightTeams.set(normCode, team);
      this.saveTeams(teams);
      return team;
    }

    return this.findTeamByCode(teamCode, eventId);
  }

  /**
   * Instantly creates or reserves a squad so that the Team Code is LIVE and JOINABLE immediately!
   */
  static async reserveOrRegisterTeam(newTeamData: Omit<Team, 'id' | 'createdAt'>): Promise<Team> {
    if (isSupabaseConfigured()) {
      const normCode = newTeamData.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const { data, error } = await supabase.rpc('create_or_reserve_team', {
        p_team_code: newTeamData.teamCode,
        p_team_name: newTeamData.teamName,
        p_event_id: newTeamData.eventId,
        p_event_title: newTeamData.eventTitle,
        p_leader_name: newTeamData.leaderName,
        p_leader_roll: newTeamData.leaderRoll,
        p_leader_email: newTeamData.leaderEmail,
        p_leader_phone: newTeamData.leaderPhone,
        p_leader_college: newTeamData.leaderCollege,
        p_leader_id: newTeamData.leaderId || null,
        p_max_team_size: newTeamData.maxTeamSize,
        p_min_team_size: newTeamData.minTeamSize
      });
      if (error) throw new Error(`Unable to reserve the team: ${error.message}`);
      if (!(data as any)?.success || !(data as any)?.team) {
        throw new Error((data as any)?.error || 'The database did not reserve this team.');
      }

      const team = teamFromDb((data as any).team);
      const teams = [team, ...this.getTeams().filter(t => t.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() !== normCode)];
      this._inFlightTeams.set(normCode, team);
      this.saveTeams(teams);
      this.broadcastTeam(team);
      return team;
    }

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

    this._inFlightTeams.set(normCode, team);
    this.saveTeams(teams);
    this.broadcastTeam(team);

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
    this._inFlightTeams.set(normCode, team);
    this.saveTeams(teams);
    this.broadcastTeam(team);

    // Async cloud backup
    if (isSupabaseConfigured()) {
      this.reserveOrRegisterTeam(newTeamData).catch(() => {});
    }

    return team;
  }

  static async joinTeam(
    teamCode: string,
    member: Teammate
  ): Promise<{ success: boolean; team?: Team; registration?: Registration; isLeaderPaid?: boolean; error?: string }> {
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
    const currentMemberCount = 1 + (team.memberCount ?? team.members?.length ?? 0);
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
      team.isCurrentUserLeader ||
      (team.leaderRoll && team.leaderRoll.trim().toLowerCase() === memberRoll) ||
      (team.leaderEmail && team.leaderEmail.trim().toLowerCase() === memberEmail);

    const alreadyJoined = (team.members || []).some(
      m =>
        (m.rollNumber && m.rollNumber.trim().toLowerCase() === memberRoll) ||
        (m.email && memberEmail !== '' && m.email.trim().toLowerCase() === memberEmail)
    ) || Boolean(team.isCurrentUserMember);

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

    let backendJoin: any = null;
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.rpc('join_team_membership', {
        p_code: cleanCode,
        p_member: member
      });
      if (error) return { success: false, error: `Unable to join the team: ${error.message}` };
      if (!(data as any)?.success) {
        return { success: false, error: (data as any)?.error || 'The database rejected this team join.' };
      }
      backendJoin = data;
      if ((data as any).team) {
        const serverTeam = teamFromDb((data as any).team);
        Object.assign(team, serverTeam, {
          // The membership RPC intentionally redacts private roster details
          // from a normal member. Keep the local member visible until the
          // privacy-safe dashboard refresh completes.
          members: [...(team.members || []), member]
        });
      }
    }

    // Add the confirmed member to the local view after the backend accepted it.
    const updatedMembers = [...(team.members || []), member];
    team.members = updatedMembers;

    // Update local teams and broadcast
    const teams = this.getTeams();
    const teamIdx = teams.findIndex(t => t.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normCode);
    if (teamIdx !== -1) {
      teams[teamIdx] = team;
    } else {
      teams.unshift(team);
    }
    this._inFlightTeams.set(normCode, team);
    this.saveTeams(teams);
    this.broadcastTeam(team);

    // Joining reserves a place in the team only. It must not create an
    // official registration or QR ticket before the leader completes the
    // event checkout.
    const liveTeam = isSupabaseConfigured()
      ? await this.fetchTeamDashboard(team.teamCode, team.eventId).catch(() => team)
      : team;
    return {
      success: true,
      team: liveTeam || team,
      isLeaderPaid: Boolean((backendJoin as any)?.isLeaderPaid)
    };

    // Check event fee and leader payment status
    const matchedEvt = this.getEvents().find(e => e.id === team.eventId || e.slug === team.eventId);
    const eventFee = Number(matchedEvt?.fee) || 0;
    const { isPaid: localLeaderPaid, leaderReg } = this.isTeamLeaderPaid(team);
    const isLeaderPaid = isSupabaseConfigured()
      ? Boolean((backendJoin as any)?.isLeaderPaid)
      : localLeaderPaid;
    const leaderPaymentStatus = (backendJoin as any)?.leaderPaymentStatus || leaderReg?.paymentStatus;
    const leaderTransactionId = (backendJoin as any)?.leaderTransactionId || leaderReg?.transactionId;

    // Online team joins are committed by the database RPC. Never manufacture
    // a local-only pass here: admin, HOD, finance, coordinator, and gate
    // portals must all see the same registration and ticket rows.
    if (isSupabaseConfigured() && (backendJoin as any)?.registration) {
      const payload = (backendJoin as any).registration;
      let canonical: Registration | undefined;
      try {
        const liveRegs = await this.fetchRegistrations();
        canonical = liveRegs.find(reg => reg.id === payload.id);
      } catch (refreshError) {
        console.warn('Team member joined, but the immediate canonical refresh failed:', refreshError);
      }

      const registration = canonical || {
        id: payload.id,
        userId: undefined,
        buyerRoll: member.rollNumber,
        eventId: payload.eventId || team.eventId,
        eventTitle: payload.eventTitle || team.eventTitle,
        departmentCode: matchedEvt?.departmentCode || this.resolveDepartmentForRegistration({ eventId: team.eventId, eventTitle: team.eventTitle } as Registration),
        teamName: payload.teamName || team.teamName,
        teamCode: payload.teamCode || team.teamCode,
        leaderName: payload.leaderName || member.name,
        leaderEmail: payload.leaderEmail || member.email,
        leaderPhone: payload.leaderPhone || member.phone,
        leaderCollege: payload.leaderCollege || member.college,
        leaderRoll: payload.leaderRoll || member.rollNumber,
        teammates: team.members || [],
        format: payload.format || 'team',
        fee: Number(payload.fee) || 0,
        source: 'online',
        registrationDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
        paymentStatus: payload.paymentStatus || (eventFee === 0 ? 'not_applicable' : (isLeaderPaid && (leaderPaymentStatus === 'verified' || leaderPaymentStatus === 'verification_pending') ? leaderPaymentStatus : 'payment_required')),
        transactionId: payload.transactionId || (isLeaderPaid ? leaderTransactionId : undefined),
        paymentScreenshotUrl: payload.paymentScreenshotUrl || (isLeaderPaid ? leaderReg?.paymentScreenshotUrl : undefined),
        qrToken: payload.qrToken || '',
        checkedIn: Boolean(payload.checkedIn)
      } as Registration;

      return { success: true, team, registration, isLeaderPaid };
    }

    // If event is free: not_applicable
    // If event has fee: if leader has paid: use leader's status; otherwise: payment_required (LOCKED!)
    let paymentStatus: PaymentStatus = 'payment_required';
    if (eventFee === 0) {
      paymentStatus = 'not_applicable';
    } else if (isLeaderPaid && (leaderPaymentStatus === 'verified' || leaderPaymentStatus === 'verification_pending')) {
      paymentStatus = leaderPaymentStatus;
    }

    // QR Token is only generated if payment is covered (or event is free)
    // If payment is pending from leader, token is locked (empty string)
    const id = `FEST-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrToken = (paymentStatus === 'verified' || paymentStatus === 'verification_pending' || paymentStatus === 'not_applicable')
      ? `FEST26-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${id.slice(-4)}`
      : '';

    // Sync member into registrations roster
    const regs = this.getRegistrations();
    let regIdx = regs.findIndex(
      r =>
        (team.registrationId && r.id === team.registrationId) ||
        (r.teamCode && r.teamCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normCode) ||
        (r.eventId === team.eventId && r.leaderRoll && team.leaderRoll && r.leaderRoll.toLowerCase() === team.leaderRoll.toLowerCase())
    );

    let updatedReg: Registration | undefined;

    if (regIdx !== -1) {
      regs[regIdx].teammates = [...(regs[regIdx].teammates || []), member];
      if (!regs[regIdx].teamCode) regs[regIdx].teamCode = team.teamCode;
      if (!regs[regIdx].teamName) regs[regIdx].teamName = team.teamName;
      this.saveRegistrations(regs);
    }

    // Create dedicated digital pass for joined member
    const newReg: Registration = {
      id,
      qrToken,
      eventId: team.eventId,
      eventTitle: team.eventTitle,
      departmentCode: matchedEvt?.departmentCode || 'MECH',
      leaderName: member.name,
      leaderRoll: member.rollNumber,
      leaderEmail: member.email,
      leaderPhone: member.phone,
      leaderCollege: member.college,
      buyerRoll: member.rollNumber,
      teammates: team.members,
      format: 'team',
      teamName: team.teamName,
      teamCode: team.teamCode,
      fee: 0,
      source: 'online',
      registrationDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      paymentStatus,
      transactionId: isLeaderPaid ? leaderTransactionId : undefined,
      paymentScreenshotUrl: isLeaderPaid ? leaderReg?.paymentScreenshotUrl : undefined,
      checkedIn: false
    };
    regs.unshift(newReg);
    this.saveRegistrations(regs);
    updatedReg = newReg;

    return { success: true, team, registration: updatedReg, isLeaderPaid };
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
