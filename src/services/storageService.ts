import { FestEvent, Registration, Announcement, FestStats, PaymentStatus } from '../types/festronix';
import { INITIAL_EVENTS, INITIAL_REGISTRATIONS, INITIAL_ANNOUNCEMENTS } from '../data/mockData';

const STORAGE_KEYS = {
  EVENTS: 'festronix_events_v1',
  REGISTRATIONS: 'festronix_registrations_v1',
  ANNOUNCEMENTS: 'festronix_announcements_v1'
};

export class StorageService {
  static getEvents(): FestEvent[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
      return INITIAL_EVENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_EVENTS;
    }
  }

  static saveEvents(events: FestEvent[]): void {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }

  static getRegistrations(): Registration[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(INITIAL_REGISTRATIONS));
      return INITIAL_REGISTRATIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_REGISTRATIONS;
    }
  }

  static saveRegistrations(regs: Registration[]): void {
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(regs));
  }

  static addRegistration(newReg: Omit<Registration, 'id' | 'qrToken' | 'checkedIn'>): Registration {
    const registrations = this.getRegistrations();
    const id = `FEST-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrToken = `FEST26-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${id.slice(-4)}`;

    const fullReg: Registration = {
      ...newReg,
      id,
      qrToken,
      checkedIn: false
    };

    registrations.unshift(fullReg);
    this.saveRegistrations(registrations);

    // Update event registered count
    const events = this.getEvents();
    const evtIndex = events.findIndex(e => e.id === newReg.eventId);
    if (evtIndex !== -1) {
      events[evtIndex].registeredCount += 1;
      if (events[evtIndex].registeredCount >= events[evtIndex].capacity) {
        events[evtIndex].status = 'full';
      }
      this.saveEvents(events);
    }

    return fullReg;
  }

  static addMultipleRegistrations(
    batch: Array<Omit<Registration, 'id' | 'qrToken' | 'checkedIn'>>
  ): Registration[] {
    const created: Registration[] = [];
    for (const item of batch) {
      created.push(this.addRegistration(item));
    }
    return created;
  }

  static updatePaymentStatus(
    regId: string, 
    status: PaymentStatus, 
    reviewerName: string, 
    rejectionReason?: string
  ): boolean {
    const regs = this.getRegistrations();
    const idx = regs.findIndex(r => r.id === regId);
    if (idx === -1) return false;

    regs[idx].paymentStatus = status;
    regs[idx].verifiedBy = reviewerName;
    regs[idx].verifiedAt = new Date().toLocaleString();
    if (rejectionReason) {
      regs[idx].rejectionReason = rejectionReason;
    } else {
      delete regs[idx].rejectionReason;
    }

    this.saveRegistrations(regs);
    return true;
  }

  static checkInRegistration(qrTokenOrId: string, staffName: string): {
    success: boolean;
    status: 'VALID' | 'ALREADY_CHECKED_IN' | 'NOT_FOUND' | 'PAYMENT_PENDING';
    registration?: Registration;
    message: string;
  } {
    const regs = this.getRegistrations();
    const trimmed = qrTokenOrId.trim();
    const reg = regs.find(r => r.qrToken.toLowerCase() === trimmed.toLowerCase() || r.id.toLowerCase() === trimmed.toLowerCase());

    if (!reg) {
      return {
        success: false,
        status: 'NOT_FOUND',
        message: 'No registration found matching token or ID: ' + qrTokenOrId
      };
    }

    if (reg.paymentStatus === 'verification_pending' || reg.paymentStatus === 'rejected') {
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

    // Mark as checked in
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

  static getStats(): FestStats {
    const regs = this.getRegistrations();
    const events = this.getEvents();

    const totalRegistrations = regs.length;
    const verifiedCount = regs.filter(r => r.paymentStatus === 'verified' || r.paymentStatus === 'not_applicable').length;
    const pendingCount = regs.filter(r => r.paymentStatus === 'verification_pending').length;
    const rejectedCount = regs.filter(r => r.paymentStatus === 'rejected').length;
    const spotCount = regs.filter(r => r.source === 'spot').length;
    const onlineCount = regs.filter(r => r.source === 'online').length;
    const checkedInCount = regs.filter(r => r.checkedIn).length;

    const totalCollected = regs
      .filter(r => r.paymentStatus === 'verified')
      .reduce((sum, r) => sum + r.fee, 0);

    const totalCapacity = events.reduce((sum, e) => sum + e.capacity, 0);

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

  static resetToDefaults(): void {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(INITIAL_REGISTRATIONS));
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
  }
}
