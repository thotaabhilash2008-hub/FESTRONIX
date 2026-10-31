import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type AdminRole =
  | 'super_admin'
  | 'dean_sac'
  | 'connect_club'
  | 'vencorpia'
  | 'dept_chief_coordinator'
  | 'dept_coordinator'
  | 'event_coordinator'
  | 'faculty_coord'
  | 'student_coord'
  | 'finance_reviewer'
  | 'volunteer_checkin'
  | 'checkin_staff';

export const isSuperAdminRole = (role: AdminRole): boolean =>
  role === 'dean_sac' || role === 'connect_club' || role === 'vencorpia' || role === 'super_admin';

export const isDepartmentAdminRole = (role: AdminRole): boolean =>
  role === 'dept_chief_coordinator' ||
  role === 'dept_coordinator' ||
  role === 'event_coordinator' ||
  role === 'faculty_coord' ||
  role === 'student_coord';

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  designation: string;
  role: AdminRole;
  departmentCode?: string;
  departmentName?: string;
  email: string;
  phone?: string;
  accessBoundary?: string;
  assignedEvents?: string[];
}

type ManagedAdmin = AdminUser;

const STORAGE_KEY_ADMIN_SESSION = 'festronix_admin_session_v1';
const STORAGE_KEY_ADMIN_DIRECTORY = 'festronix_all_admins_v2';

function requireBackend(): void {
  if (!isSupabaseConfigured()) {
    throw new Error('The admin portal requires a configured Supabase backend.');
  }
}

function readCached<T>(key: string, fallback: T): T {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed === null ? fallback : parsed as T;
  } catch {
    return fallback;
  }
}

async function invokeAdminApi<T>(body: Record<string, unknown>): Promise<T> {
  requireBackend();
  const { data, error } = await supabase.functions.invoke<T>('admin-users', { body });
  if (error) {
    const context = (error as any).context;
    const details = context && typeof context.json === 'function'
      ? await context.json().catch(() => null)
      : null;
    throw new Error(details?.error || error.message || 'The admin request failed.');
  }
  if (!data) throw new Error('The admin service returned an empty response.');
  return data;
}

export class AdminAuthService {
  private static realtimeInitialized = false;

  static initRealtime(): void {
    if (this.realtimeInitialized || !isSupabaseConfigured()) return;
    this.realtimeInitialized = true;
    try {
      supabase
        .channel('festronix_admin_directory_live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_roles' }, () => {
          void this.fetchAdmins().catch(error => console.warn('Admin directory realtime refresh failed:', error));
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_event_assignments' }, () => {
          void this.fetchAdmins().catch(error => console.warn('Admin assignment realtime refresh failed:', error));
        })
        .subscribe();
    } catch (error) {
      console.warn('Admin realtime subscription error:', error);
    }
  }
  static getCurrentAdmin(): AdminUser | null {
    return readCached<AdminUser | null>(STORAGE_KEY_ADMIN_SESSION, null);
  }

  static getAllAdmins(): ManagedAdmin[] {
    return readCached<ManagedAdmin[]>(STORAGE_KEY_ADMIN_DIRECTORY, []);
  }

  static getCoordinators(): ManagedAdmin[] {
    return this.getAllAdmins();
  }

  static async restoreCurrentAdmin(): Promise<AdminUser | null> {
    if (!isSupabaseConfigured()) {
      localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
      return null;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session) {
      localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
      return null;
    }

    try {
      const admin = await invokeAdminApi<AdminUser>({ action: 'me' });
      localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(admin));
      return admin;
    } catch (error) {
      await supabase.auth.signOut();
      localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
      if ((error as Error).message.toLowerCase().includes('admin role')) return null;
      throw error;
    }
  }

  private static async authenticate(email: string, password: string): Promise<AdminUser> {
    requireBackend();
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || !password) {
      throw new Error('Enter the email address assigned to your admin account and its password.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) {
      if (error.code === 'email_not_confirmed') {
        throw new Error('This admin email is not confirmed. Contact your system administrator.');
      }
      if (error.name === 'AuthRetryableFetchError' || /network|fetch/i.test(error.message)) {
        throw new Error('The sign-in service could not be reached. Check your connection and try again.');
      }
      throw new Error('Sign-in failed. Check your admin email spelling and password.');
    }
    if (!data.user) throw new Error('The sign-in service did not return an authenticated user. Please try again.');

    try {
      const admin = await invokeAdminApi<AdminUser>({ action: 'me' });
      localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(admin));
      return admin;
    } catch (error) {
      await supabase.auth.signOut();
      localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
      throw error;
    }
  }

  static async loginCentral(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    try {
      const user = await this.authenticate(email, password);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static loginDean(email: string, password: string) {
    return this.loginCentral(email, password);
  }

  static async loginDepartment(
    deptCode: string,
    email: string,
    password: string,
    _coordinatorName?: string
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    try {
      const user = await this.authenticate(email, password);
      const isDepartmentRole = ['dept_chief_coordinator', 'dept_coordinator', 'event_coordinator', 'faculty_coord', 'student_coord'].includes(user.role);
      const matchesDepartment = user.departmentCode?.toUpperCase() === deptCode.trim().toUpperCase();
      if (!isDepartmentRole || !matchesDepartment) {
        await supabase.auth.signOut();
        localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
        return { success: false, error: 'This account is not assigned to the selected department.' };
      }
      return { success: true, user };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async fetchAdmins(): Promise<ManagedAdmin[]> {
    const admins = await invokeAdminApi<ManagedAdmin[]>({ action: 'list' });
    localStorage.setItem(STORAGE_KEY_ADMIN_DIRECTORY, JSON.stringify(admins));
    window.dispatchEvent(new CustomEvent('festronix:admins-updated', { detail: admins }));
    return admins;
  }

  static async addAdmin(
    admin: Omit<AdminUser, 'id'> & { password?: string; assignedEvents?: string[] }
  ): Promise<AdminUser> {
    const created = await invokeAdminApi<AdminUser>({ action: 'create', admin });
    await this.fetchAdmins();
    return created;
  }

  static addCoordinator(
    coordinator: Omit<AdminUser, 'id'> & { password?: string; assignedEvents?: string[] }
  ): Promise<AdminUser> {
    return this.addAdmin(coordinator);
  }

  static async updateAdmin(
    id: string,
    updated: Partial<AdminUser> & { password?: string }
  ): Promise<boolean> {
    await invokeAdminApi({ action: 'update', id, updates: updated });
    const current = this.getCurrentAdmin();
    if (current?.id === id) {
      const refreshed = await invokeAdminApi<AdminUser>({ action: 'me' });
      localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(refreshed));
    }
    await this.fetchAdmins();
    return true;
  }

  static updateCoordinator(id: string, updated: Partial<AdminUser> & { password?: string }): Promise<boolean> {
    return this.updateAdmin(id, updated);
  }

  static async deleteAdmin(id: string): Promise<boolean> {
    await invokeAdminApi({ action: 'delete', id });
    await this.fetchAdmins();
    return true;
  }

  static deleteCoordinator(id: string): Promise<boolean> {
    return this.deleteAdmin(id);
  }

  static async logout(): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
  }
}
