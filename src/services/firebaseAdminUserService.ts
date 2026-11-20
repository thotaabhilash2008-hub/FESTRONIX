import type { AdminRole, AdminUser } from './adminAuthService';
import { firebaseApp } from '../lib/firebase';
import { callFirebaseCallable } from './firebaseFunctionClient';

async function call<T>(data: Record<string, unknown>): Promise<T> {
  if (!firebaseApp) throw new Error('Firebase staff management is not configured.');
  try {
    return await callFirebaseCallable<T>('manageStaffAccount', data);
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    const message = error instanceof Error ? error.message : 'Firebase could not complete the staff account operation.';
    if (code.includes('unauthenticated')) throw new Error('Your administrator session has expired. Sign in again.');
    if (code.includes('permission-denied') || code.includes('already-exists') || code.includes('not-found') ||
        code.includes('invalid-argument') || code.includes('failed-precondition') || code.includes('resource-exhausted')) {
      throw new Error(message);
    }
    throw new Error('Firebase could not complete the staff account operation. Please retry.');
  }
}

export const FirebaseAdminUserService = {
  async list(): Promise<AdminUser[]> {
    const result = await call<{ admins: AdminUser[] }>({ action: 'list' });
    return Array.isArray(result.admins) ? result.admins : [];
  },

  async create(admin: Omit<AdminUser, 'id'> & { password?: string; assignedEvents?: string[] }): Promise<AdminUser> {
    const result = await call<{ admin: AdminUser }>({ action: 'create', admin });
    return result.admin;
  },

  async assignExisting(options: {
    identifier: string;
    role: AdminRole;
    departmentCode?: string;
    clusterCode?: string;
    designation?: string;
    accessBoundary?: string;
    assignedEvents?: string[];
  }): Promise<AdminUser> {
    const result = await call<{ admin: AdminUser }>({ action: 'assign_existing', ...options });
    return result.admin;
  },

  async update(id: string, updates: Partial<AdminUser> & { password?: string }): Promise<AdminUser> {
    const result = await call<{ admin: AdminUser }>({ action: 'update', id, updates });
    return result.admin;
  },

  async delete(id: string): Promise<void> {
    await call<{ success: boolean }>({ action: 'delete', id });
  },
};
