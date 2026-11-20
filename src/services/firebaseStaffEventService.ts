import type { FestEvent } from '../types/festronix';
import { firebaseApp } from '../lib/firebase';
import { callFirebaseCallable } from './firebaseFunctionClient';

export interface FirebaseStaffIdentity {
  id: string;
  username?: string;
  fullName: string;
  designation: string;
  role: string;
  departmentCode?: string;
  clusterCode?: string;
  email?: string;
  phone?: string;
  accessBoundary?: string;
  assignedEvents: string[];
}

export interface FirebaseStaffScope {
  kind: 'global' | 'department' | 'assigned_events' | 'central_operations';
  departmentCode?: string;
  clusterCode?: string;
  eventIds?: string[];
}

async function call<TResponse>(name: string, data: Record<string, unknown> = {}): Promise<TResponse> {
  if (!firebaseApp) throw new Error('Firebase is not configured for this environment.');
  try {
    return await callFirebaseCallable<TResponse>(name, data);
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    const message = error instanceof Error ? error.message : 'The Firebase operation failed.';
    if (code.includes('unauthenticated')) throw new Error('Your staff session has expired. Sign in again.');
    if (code.includes('permission-denied')) throw new Error('Your staff role does not have permission for this operation.');
    if (code.includes('failed-precondition') || code.includes('already-exists') || code.includes('invalid-argument')) {
      throw new Error(message);
    }
    throw new Error('Firebase could not complete the operation. Please retry; if it continues, contact the administrator.');
  }
}

export const FirebaseStaffEventService = {
  async getAccess(): Promise<{ user: FirebaseStaffIdentity; scope: FirebaseStaffScope }> {
    return call('getStaffAccess');
  },

  async fetchEvents(): Promise<FestEvent[]> {
    const result = await call<{ events: FestEvent[] }>('listStaffEvents');
    return result.events;
  },

  async fetchEvent(eventId: string): Promise<FestEvent> {
    const result = await call<{ event: FestEvent }>('getStaffEvent', { eventId });
    return result.event;
  },

  async createEvent(event: Partial<FestEvent>): Promise<FestEvent> {
    const result = await call<{ event: FestEvent }>('createStaffEvent', { event });
    return result.event;
  },

  async updateEvent(eventId: string, event: Partial<FestEvent>): Promise<FestEvent> {
    const result = await call<{ event: FestEvent }>('updateStaffEvent', { eventId, event });
    return result.event;
  },

  async approveEvent(eventId: string): Promise<void> {
    await call<{ success: boolean }>('approveStaffEvent', { eventId });
  },

  async deleteEvent(eventId: string): Promise<void> {
    await call<{ success: boolean; deleted: boolean }>('deleteStaffEvent', { eventId });
  },
};
