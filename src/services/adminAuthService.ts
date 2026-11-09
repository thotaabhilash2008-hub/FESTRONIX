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
const STORAGE_KEY_ADMIN_DIRECTORY = 'festronix_all_admins_v3';
const ADMIN_SESSION_TIMEOUT_MS = 5000;
const ADMIN_API_TIMEOUT_MS = 7000;

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    Promise.resolve(promise).then(
      value => {
        window.clearTimeout(timer);
        resolve(value);
      },
      error => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function readCached<T>(key: string, fallback: T): T {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed === null ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
}

function normalizeAdminRole(role: string): AdminRole {
  return (role === 'dept_chief_coordinator' ? 'dept_coordinator' : role) as AdminRole;
}

async function getEdgeError(error: any): Promise<string> {
  const context = error?.context;
  if (context && typeof context.json === 'function') {
    const details = await context.json().catch(() => null);
    if (details?.error) return details.error;
  }
  return error?.message || 'The admin request failed.';
}

async function invokeAdminApi<T>(body: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured()) throw new Error('Supabase backend is not configured.');
  const { data, error } = await supabase.functions.invoke<T>('admin-users', { body });
  if (error) throw new Error(await getEdgeError(error));
  if (!data) throw new Error('The admin service returned an empty response.');
  return data;
}

async function invokeAuthApi<T>(body: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured()) throw new Error('Supabase backend is not configured.');
  const { data, error } = await supabase.functions.invoke<T>('admin-auth', { body });
  if (error) throw new Error(await getEdgeError(error));
  if (!data) throw new Error('The authentication service returned an empty response.');
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
    // This cache is a display cache only. It is never populated with seeded
    // accounts, aliases, or passwords; the backend is the source of truth.
    return readCached<ManagedAdmin[]>(STORAGE_KEY_ADMIN_DIRECTORY, []);
  }

  static getCoordinators(): ManagedAdmin[] {
    return this.getAllAdmins();
  }

  private static async resolveAdminFromAuth(user: any, fallbackEmail: string): Promise<AdminUser> {
    const email = (user.email || fallbackEmail || '').trim().toLowerCase();
    try {
      const { data: roleRow, error } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (roleRow) {
        return {
          id: user.id,
          username: roleRow.username || email.split('@')[0],
          fullName: roleRow.full_name || email,
          designation: roleRow.designation || 'Administrator',
          role: normalizeAdminRole(roleRow.role),
          departmentCode: roleRow.department_code || undefined,
          email: roleRow.email || email,
          phone: roleRow.phone || undefined,
          accessBoundary: roleRow.access_boundary || undefined
        };
      }
    } catch (error) {
      console.warn('Could not query the admin role:', error);
    }

    try {
      const edgeUser = await invokeAdminApi<AdminUser>({ action: 'me' });
      if (edgeUser?.role) return { ...edgeUser, role: normalizeAdminRole(edgeUser.role) };
    } catch {
      // Fall through to a clear authorization error.
    }

    throw new Error('No active admin role is assigned to this account. Contact a super admin.');
  }

  static async restoreCurrentAdmin(): Promise<AdminUser | null> {
    const cached = this.getCurrentAdmin();
    if (!isSupabaseConfigured()) return cached;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const fresh = await this.resolveAdminFromAuth(session.user, session.user.email || '');
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(fresh));
        return fresh;
      }
    } catch {
      // Keep a cached profile for a short network interruption. Protected
      // requests still require a valid Supabase session on the backend.
    }
    return cached;
  }

  private static async authenticate(
    identifier: string,
    password: string,
    options: { portal: 'central' | 'department' | 'event'; departmentCode?: string; eventId?: string } = { portal: 'central' }
  ): Promise<AdminUser> {
    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) throw new Error('Enter your username or email and password.');

    const result = await invokeAuthApi<{
      user: AdminUser;
      session?: { access_token: string; refresh_token: string };
    }>({ identifier: cleanIdentifier, password, ...options });

    if (!result.user || !result.session?.access_token || !result.session.refresh_token) {
      throw new Error('The authentication service returned an incomplete session.');
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token
    });
    if (sessionError) throw new Error('Unable to establish the admin session. Please try again.');

    const admin = { ...result.user, role: normalizeAdminRole(result.user.role) };
    localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(admin));
    return admin;
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const current = currentPassword.trim();
    if (!current) throw new Error('Enter your current password.');
    if (newPassword.length < 12) throw new Error('New password must be at least 12 characters.');
    if (!isSupabaseConfigured()) throw new Error('Supabase backend is not configured.');

    const { data: sessionData } = await withTimeout(
      supabase.auth.getSession(),
      ADMIN_SESSION_TIMEOUT_MS,
      'Supabase session verification timed out. Please try again.'
    );
    const email = sessionData.session?.user?.email?.trim().toLowerCase();
    if (!email) throw new Error('Your admin session has expired. Sign in again.');

    const { error: verifyError } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password: current }),
      ADMIN_API_TIMEOUT_MS,
      'Password verification timed out. Please try again.'
    );
    if (verifyError) {
      if (/invalid login credentials|invalid_credentials/i.test(verifyError.message || '')) {
        throw new Error('Current password is incorrect.');
      }
      throw new Error(verifyError.message || 'Unable to verify your current password.');
    }

    const { error: updateError } = await withTimeout(
      supabase.auth.updateUser({ password: newPassword }),
      ADMIN_API_TIMEOUT_MS,
      'Password update timed out. Please try again.'
    );
    if (updateError) throw new Error(updateError.message || 'Unable to change your password.');
  }

  static async loginCentral(
    identifier: string,
    password: string
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    if (!identifier.trim() || !password.trim()) {
      return { success: false, error: 'Please enter your username or email and password.' };
    }
    try {
      return { success: true, user: await this.authenticate(identifier, password, { portal: 'central' }) };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Invalid login credentials.' };
    }
  }

  static loginDean(email: string, password: string) {
    return this.loginCentral(email, password);
  }

  static async loginDepartment(
    deptCode: string,
    identifier: string,
    password: string,
    _coordinatorName?: string
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    const departmentCode = deptCode.trim().toUpperCase();
    if (!identifier.trim() || !password.trim()) {
      return { success: false, error: `Enter the ${departmentCode} coordinator username or email and password.` };
    }
    try {
      return {
        success: true,
        user: await this.authenticate(identifier, password, { portal: 'department', departmentCode })
      };
    } catch (error: any) {
      return { success: false, error: error?.message || `Authentication failed for ${departmentCode}.` };
    }
  }

  static async loginEventCoordinator(
    deptCode: string,
    eventId: string,
    identifier: string,
    password: string,
    _coordinatorName?: string
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    const departmentCode = deptCode.trim().toUpperCase();
    if (!identifier.trim() || !password.trim()) {
      return { success: false, error: 'Enter the event coordinator username or email and password.' };
    }
    try {
      return {
        success: true,
        user: await this.authenticate(identifier, password, {
          portal: 'event',
          departmentCode,
          eventId
        })
      };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Event coordinator authentication failed.' };
    }
  }

  static async fetchAdmins(): Promise<ManagedAdmin[]> {
    if (!isSupabaseConfigured()) return this.getAllAdmins();
    try {
      const admins = await invokeAdminApi<ManagedAdmin[]>({ action: 'list' });
      const safeAdmins = Array.isArray(admins)
        ? admins.map(admin => ({ ...admin, role: normalizeAdminRole(admin.role) }))
        : [];
      localStorage.setItem(STORAGE_KEY_ADMIN_DIRECTORY, JSON.stringify(safeAdmins));
      window.dispatchEvent(new CustomEvent('festronix:admins-updated', { detail: safeAdmins }));
      return safeAdmins;
    } catch (error) {
      console.warn('Could not fetch admins via the backend:', error);
      return this.getAllAdmins();
    }
  }

  static async addAdmin(
    admin: Omit<AdminUser, 'id'> & { password?: string; assignedEvents?: string[] }
  ): Promise<AdminUser> {
    const created = await invokeAdminApi<AdminUser>({ action: 'create', admin });
    await this.fetchAdmins();
    return { ...created, role: normalizeAdminRole(created.role) };
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
      localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify({ ...refreshed, role: normalizeAdminRole(refreshed.role) }));
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
    if (isSupabaseConfigured()) await supabase.auth.signOut().catch(() => {});
    localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
    window.dispatchEvent(new CustomEvent('festronix:admin-auth', { detail: null }));
  }
}
