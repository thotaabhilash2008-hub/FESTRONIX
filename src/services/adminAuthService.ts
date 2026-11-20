import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updatePassword as firebaseUpdatePassword,
} from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { FirebaseStaffEventService } from './firebaseStaffEventService';
import { FirebaseAdminUserService } from './firebaseAdminUserService';

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

export const isFinanceAdminRole = (role: AdminRole): boolean =>
  role === 'finance_reviewer';

export const isCheckinAdminRole = (role: AdminRole): boolean =>
  role === 'volunteer_checkin' || role === 'checkin_staff';

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  designation: string;
  role: AdminRole;
  departmentCode?: string;
  departmentName?: string;
  clusterCode?: string;
  email: string;
  phone?: string;
  accessBoundary?: string;
  assignedEvents?: string[];
}

type ManagedAdmin = AdminUser;

const STORAGE_KEY_ADMIN_SESSION = 'festronix_admin_session_v1';
const STORAGE_KEY_ADMIN_DIRECTORY = 'festronix_all_admins_v3';

const normalizeManagedAdmin = (admin: Record<string, any>): ManagedAdmin => ({
  ...admin,
  departmentCode: admin.departmentCode || admin.department_code || undefined,
  clusterCode: admin.clusterCode || admin.cluster_code || undefined,
  assignedEvents: Array.isArray(admin.assignedEvents) ? admin.assignedEvents : undefined
} as ManagedAdmin);
function resolveTargetEmail(input: string): string {
  return input.trim().toLowerCase();
}
function staffLoginError(error: unknown, fallback: string): string {
  const code = error && typeof error === 'object' && 'code' in error
    ? String((error as { code?: unknown }).code || '').toLowerCase()
    : '';
  const message = error instanceof Error ? error.message : '';

  if (/auth\/(invalid-credential|wrong-password|user-not-found|invalid-email)/.test(code)) {
    return 'Email or password is incorrect.';
  }
  if (code.includes('too-many-requests')) {
    return 'Too many sign-in attempts. Wait a few minutes and try again.';
  }
  if (code.includes('network-request-failed')) {
    return 'Unable to reach Firebase Authentication. Check your connection and try again.';
  }
  if (message && !/^Firebase: Error \(auth\//.test(message)) return message;
  return fallback;
}
function readCached<T>(key: string, fallback: T): T {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed === null ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
}

async function invokeAdminApi<T>(body: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase backend is not configured.');
  }
  const { data, error } = await supabase.functions.invoke<T>('admin-users', { body });
  if (error) {
    // Supabase wraps non-2xx Edge Function responses in FunctionsHttpError.
    // Its response body is not always available through `error.message`, so
    // preserve the API's actionable validation message whenever possible.
    const context = (error as any).context as Response | undefined;
    let details: any = null;
    if (context && typeof context.clone === 'function') {
      const responseCopy = context.clone();
      details = await responseCopy.json().catch(async () => {
        const text = await context.clone().text().catch(() => '');
        return text ? { error: text } : null;
      });
    }
    const message = details?.error || details?.message || (error as any).message;
    const status = context?.status || (error as any).status;
    if (status === 401) {
      throw new Error('Your admin backend session could not be verified. Sign out and sign in again.');
    }
    throw new Error(typeof message === 'string' && message.trim() ? message : 'The admin request failed.');
  }
  if (!data) throw new Error('The admin service returned an empty response.');
  return data;
}

export class AdminAuthService {
  private static realtimeInitialized = false;
  private static identityChangeHandler: (() => void) | null = null;

  /** Lets the portal re-resolve the signed-in identity when roles change. */
  static setIdentityChangeHandler(handler: (() => void) | null): void {
    this.identityChangeHandler = handler;
  }

  private static async authenticateWithFirebase(
    identifier: string,
    password: string,
    portal: 'auto' | 'central' | 'department' | 'event' = 'auto',
    departmentCode?: string,
    clusterCode?: string,
    eventId?: string
  ): Promise<AdminUser> {
    if (!isFirebaseConfigured || !firebaseAuth) {
      throw new Error('Firebase staff authentication is not configured for this deployment.');
    }

    const email = resolveTargetEmail(identifier);
    if (!email.includes('@')) {
      throw new Error('Sign in with the email address assigned to your staff account.');
    }
    if (!password) throw new Error('Enter your password.');

    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      const access = await FirebaseStaffEventService.getAccess();
      const user = normalizeManagedAdmin(access.user as unknown as Record<string, any>);
      const role = user.role;
      const requestedDepartment = departmentCode?.trim().toUpperCase();
      const requestedCluster = clusterCode?.trim().toUpperCase();

      if (portal === 'central' && !(
        ['super_admin', 'dean_sac', 'connect_club', 'vencorpia', 'finance_reviewer'].includes(role)
      )) {
        throw new Error('This account is not authorized for the central admin portal.');
      }
      if (portal === 'department') {
        if (!['dept_chief_coordinator', 'dept_coordinator'].includes(role)) {
          throw new Error('This account is not authorized for the department coordinator portal.');
        }
        if (requestedDepartment && user.departmentCode?.toUpperCase() !== requestedDepartment) {
          throw new Error('This account is assigned to a different department.');
        }
        if (requestedCluster && user.clusterCode?.toUpperCase() !== requestedCluster) {
          throw new Error(user.clusterCode
            ? 'This account is assigned to a different CSE cluster.'
            : 'This account has no CSE cluster assignment. Ask an administrator to assign one.');
        }
      }
      if (portal === 'event') {
        if (!['event_coordinator', 'faculty_coord', 'student_coord'].includes(role)) {
          throw new Error('This account is not an event coordinator.');
        }
        if (requestedDepartment && user.departmentCode?.toUpperCase() !== requestedDepartment) {
          throw new Error('This account is assigned to a different department.');
        }
        if (eventId) {
          const assigned = await FirebaseStaffEventService.fetchEvents();
          if (!assigned.some(event => event.id === eventId || event.slug === eventId)) {
            throw new Error('This coordinator is not assigned to the selected event.');
          }
        }
      }

      localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(user));
      return user;
    } catch (error) {
      await firebaseSignOut(firebaseAuth).catch(() => undefined);
      localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
      throw error;
    }
  }
  static initRealtime(): void {
    if (isFirebaseConfigured) return;
    if (this.realtimeInitialized || !isSupabaseConfigured()) return;
    this.realtimeInitialized = true;
    try {
      supabase
        .channel('festronix_admin_directory_live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_roles' }, () => {
          void this.fetchAdmins().catch(error => console.warn('Admin directory realtime refresh failed:', error));
          this.identityChangeHandler?.();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_event_assignments' }, () => {
          void this.fetchAdmins().catch(error => console.warn('Admin assignment realtime refresh failed:', error));
          this.identityChangeHandler?.();
        })
        .subscribe();
    } catch (error) {
      console.warn('Admin realtime subscription error:', error);
    }
  }

  static getCurrentAdmin(): AdminUser | null {
    const cached = readCached<AdminUser | null>(STORAGE_KEY_ADMIN_SESSION, null);
    return cached ? normalizeManagedAdmin(cached) : null;
  }

  static async fetchCurrentAdminEventAssignments(): Promise<string[]> {
    if (!isFirebaseConfigured || !firebaseAuth?.currentUser) {
      throw new Error('Sign in with an authorized Firebase staff account first.');
    }
    const access = await FirebaseStaffEventService.getAccess();
    return [...new Set(access.user.assignedEvents.map(id => String(id).trim()).filter(Boolean))];
  }
  static getAllAdmins(): ManagedAdmin[] {
    const cached = readCached<ManagedAdmin[]>(STORAGE_KEY_ADMIN_DIRECTORY, []);
    const normalized = cached.map(admin => normalizeManagedAdmin(admin));
    if (normalized.length > 0) {
      localStorage.setItem(STORAGE_KEY_ADMIN_DIRECTORY, JSON.stringify(normalized));
    }
    return normalized;
  }
  static getCoordinators(): ManagedAdmin[] {
    return this.getAllAdmins();
  }

  static async restoreCurrentAdmin(): Promise<AdminUser | null> {
    if (!isFirebaseConfigured || !firebaseAuth) {
      localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
      return null;
    }

    try {
      // Firebase restores persisted browser sessions asynchronously. Wait for
      // that initialization before checking currentUser, otherwise a page
      // refresh can incorrectly look like an expired staff session.
      await firebaseAuth.authStateReady();
      const currentUser = firebaseAuth.currentUser;
      if (!currentUser) {
        localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
        return null;
      }

      await currentUser.getIdToken(true);
      const access = await FirebaseStaffEventService.getAccess();
      const fresh = normalizeManagedAdmin(access.user as unknown as Record<string, any>);
      localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(fresh));
      return fresh;
    } catch {
      await firebaseSignOut(firebaseAuth).catch(() => undefined);
      localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
      return null;
    }
  }
  static async loginWithCredentials(
    identifier: string,
    password: string
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    const cleanIdentifier = identifier.trim().toLowerCase();
    if (!cleanIdentifier || !password) {
      return { success: false, error: 'Enter your staff email and password.' };
    }

    try {
      const user = await this.authenticateWithFirebase(cleanIdentifier, password);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: staffLoginError(error, 'Unable to sign in. Please try again.') };
    }
  }

  static async loginCentral(
    emailOrUser: string,
    password: string
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    if (!emailOrUser.trim() || !password) {
      return { success: false, error: 'Enter your staff email and password.' };
    }

    try {
      const user = await this.authenticateWithFirebase(emailOrUser, password, 'central');
      return { success: true, user };
    } catch (error) {
      return { success: false, error: staffLoginError(error, 'Unable to sign in. Please try again.') };
    }
  }
  static loginDean(email: string, password: string) {
    return this.loginCentral(email, password);
  }

  /**
   * Department Staff Coordinator login
   */
  static async loginDepartment(
    deptCode: string,
    email: string,
    password: string,
    _coordinatorName?: string
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    const cleanDepartment = deptCode.trim().toUpperCase();
    const rawEmail = email.trim().toLowerCase();
    const compactDepartment = cleanDepartment.replace(/[\s-]+/g, '');
    const clusterMatch = /^CSE([1-3])$/.exec(compactDepartment);
    const requestedCluster = clusterMatch ? 'CSE-' + clusterMatch[1] : undefined;
    const requestedDepartment = requestedCluster ? 'CSE' : cleanDepartment;

    if (!cleanDepartment || !rawEmail || !password) {
      return { success: false, error: 'Enter your department, staff email, and password.' };
    }

    try {
      const user = await this.authenticateWithFirebase(
        rawEmail,
        password,
        'department',
        requestedDepartment,
        requestedCluster
      );
      return { success: true, user };
    } catch (error) {
      return { success: false, error: staffLoginError(error, 'Unable to sign in to the department portal.') };
    }
  }
  static async loginEventCoordinator(
    deptCode: string,
    eventId: string,
    email: string,
    password: string,
    _coordinatorName?: string
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    const cleanDepartment = deptCode.trim().toUpperCase();
    const requestedDepartment = cleanDepartment.startsWith('CSE') ? 'CSE' : cleanDepartment;
    const rawEmail = email.trim().toLowerCase();

    if (!cleanDepartment || !eventId.trim() || !rawEmail || !password) {
      return { success: false, error: 'Enter the event, staff email, and password.' };
    }

    try {
      const user = await this.authenticateWithFirebase(
        rawEmail,
        password,
        'event',
        requestedDepartment,
        undefined,
        eventId
      );
      return { success: true, user };
    } catch (error) {
      return { success: false, error: staffLoginError(error, 'Unable to sign in to this event portal.') };
    }
  }
  static async fetchAdmins(): Promise<ManagedAdmin[]> {
    if (isFirebaseConfigured) {
      const admins = (await FirebaseAdminUserService.list()).map(admin => normalizeManagedAdmin(admin as Record<string, any>));
      localStorage.setItem(STORAGE_KEY_ADMIN_DIRECTORY, JSON.stringify(admins));
      window.dispatchEvent(new CustomEvent('festronix:admins-updated', { detail: admins }));
      return admins;
    }
    if (isSupabaseConfigured()) {
      try {
        const admins = await invokeAdminApi<ManagedAdmin[]>({ action: 'list' });
        if (Array.isArray(admins)) {
          const normalizedAdmins = admins.map(admin => normalizeManagedAdmin(admin as Record<string, any>));
          localStorage.setItem(STORAGE_KEY_ADMIN_DIRECTORY, JSON.stringify(normalizedAdmins));
          window.dispatchEvent(new CustomEvent('festronix:admins-updated', { detail: normalizedAdmins }));
          return normalizedAdmins;
        }
      } catch (e) {
        console.warn('Could not fetch admins via edge function:', e);
      }

      try {
        const { data: dbRoles, error } = await supabase.from('admin_roles').select('*').eq('active', true);
        if (error) throw error;
        if (Array.isArray(dbRoles)) {
          const list: ManagedAdmin[] = dbRoles.map((r: any) => normalizeManagedAdmin({
            id: r.user_id,
            username: r.username,
            fullName: r.full_name,
            designation: r.designation || 'Administrator',
            role: r.role as AdminRole,
            departmentCode: r.department_code || undefined,
            clusterCode: r.cluster_code || undefined,
            email: r.email,
            phone: r.phone || undefined,
            accessBoundary: r.access_boundary || undefined
          }));
          localStorage.setItem(STORAGE_KEY_ADMIN_DIRECTORY, JSON.stringify(list));
          window.dispatchEvent(new CustomEvent('festronix:admins-updated', { detail: list }));
          return list;
        }
      } catch (e) {
        console.warn('Could not fetch admin_roles table:', e);
      }

      // Graceful fallback when remote admin directory is not initialized
      const fallbackAdmins = this.getAllAdmins();
      return fallbackAdmins;
    }

    const admins = this.getAllAdmins();
    window.dispatchEvent(new CustomEvent('festronix:admins-updated', { detail: admins }));
    return admins;
  }

  static async addAdmin(
    admin: Omit<AdminUser, 'id'> & { password?: string; assignedEvents?: string[] }
  ): Promise<AdminUser> {
    if (isFirebaseConfigured) {
      const created = await FirebaseAdminUserService.create(admin);
      await this.fetchAdmins();
      return normalizeManagedAdmin(created as Record<string, any>);
    }
    if (isSupabaseConfigured()) {
      const created = await invokeAdminApi<AdminUser>({ action: 'create', admin });
      await this.fetchAdmins();
      return created;
    }
    const all = this.getAllAdmins();
    const created: AdminUser = {
      ...admin,
      id: `admin_${Date.now()}`
    };
    all.push(created);
    localStorage.setItem(STORAGE_KEY_ADMIN_DIRECTORY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('festronix:admins-updated', { detail: all }));
    return created;
  }

  static addCoordinator(
    coordinator: Omit<AdminUser, 'id'> & { password?: string; assignedEvents?: string[] }
  ): Promise<AdminUser> {
    return this.addAdmin(coordinator);
  }

  /**
   * Grants a scoped portal role to an already-authenticated Supabase account.
   * This never creates a second Auth identity or changes the account password.
   */
  static async assignExistingAccount(options: {
    identifier: string;
    role: AdminRole;
    departmentCode?: string;
    clusterCode?: string;
    designation?: string;
    accessBoundary?: string;
    assignedEvents?: string[];
  }): Promise<AdminUser> {
    if (isFirebaseConfigured) {
      const assigned = await FirebaseAdminUserService.assignExisting(options);
      await this.fetchAdmins();
      return normalizeManagedAdmin(assigned as Record<string, any>);
    }
    const assigned = await invokeAdminApi<AdminUser>({
      action: 'assign_existing',
      identifier: options.identifier.trim(),
      role: options.role,
      departmentCode: options.departmentCode,
      clusterCode: options.clusterCode,
      designation: options.designation,
      accessBoundary: options.accessBoundary,
      assignedEvents: options.assignedEvents || []
    });
    await this.fetchAdmins();
    return assigned;
  }

  static async updateAdmin(
    id: string,
    updated: Partial<AdminUser> & { password?: string }
  ): Promise<boolean> {
    if (isFirebaseConfigured) {
      const updatedAdmin = await FirebaseAdminUserService.update(id, updated);
      const current = this.getCurrentAdmin();
      if (current?.id === id) localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(normalizeManagedAdmin(updatedAdmin as Record<string, any>)));
      await this.fetchAdmins();
      return true;
    }
    if (isSupabaseConfigured()) {
      await invokeAdminApi({ action: 'update', id, updates: updated });
      const current = this.getCurrentAdmin();
      if (current?.id === id) {
        const refreshed = await invokeAdminApi<AdminUser>({ action: 'me' });
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(refreshed));
      }
      await this.fetchAdmins();
      return true;
    }
    const all = this.getAllAdmins();
    const index = all.findIndex(a => a.id === id);
    if (index !== -1) {
      all[index] = { ...all[index], ...updated };
      localStorage.setItem(STORAGE_KEY_ADMIN_DIRECTORY, JSON.stringify(all));
      const current = this.getCurrentAdmin();
      if (current?.id === id) {
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(all[index]));
      }
      window.dispatchEvent(new CustomEvent('festronix:admins-updated', { detail: all }));
      return true;
    }
    return false;
  }

  static updateCoordinator(id: string, updated: Partial<AdminUser> & { password?: string }): Promise<boolean> {
    return this.updateAdmin(id, updated);
  }

  static async deleteAdmin(id: string): Promise<boolean> {
    if (isFirebaseConfigured) {
      await FirebaseAdminUserService.delete(id);
      await this.fetchAdmins();
      return true;
    }
    if (isSupabaseConfigured()) {
      await invokeAdminApi({ action: 'delete', id });
      await this.fetchAdmins();
      return true;
    }
    const all = this.getAllAdmins().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY_ADMIN_DIRECTORY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('festronix:admins-updated', { detail: all }));
    return true;
  }

  static deleteCoordinator(id: string): Promise<boolean> {
    return this.deleteAdmin(id);
  }

  static async sendPasswordReset(email: string): Promise<void> {
    if (!isFirebaseConfigured || !firebaseAuth) {
      throw new Error('Firebase staff authentication is not configured for this deployment.');
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error('Enter the staff email address first.');
    }

    try {
      await sendPasswordResetEmail(firebaseAuth, cleanEmail);
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
      if (code.includes('user-not-found') || code.includes('user-disabled') || code.includes('invalid-email')) {
        // Keep the response identical for existing and non-existing addresses.
        return;
      }
      if (code.includes('network-request-failed')) {
        throw new Error('Unable to reach Firebase. Check your connection and try again.');
      }
      throw new Error('Unable to send a password reset email right now. Try again later or contact the administrator.');
    }
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!currentPassword) throw new Error('Enter your current password.');
    if (newPassword.length < 8) throw new Error('New password must be at least 8 characters.');
    if (!isFirebaseConfigured || !firebaseAuth?.currentUser) {
      throw new Error('Sign in to Firebase again before changing your password.');
    }

    const user = firebaseAuth.currentUser;
    const email = user.email;
    if (!email) throw new Error('The signed-in Firebase account has no email address.');

    const credential = EmailAuthProvider.credential(email, currentPassword);
    try {
      await reauthenticateWithCredential(user, credential);
      await firebaseUpdatePassword(user, newPassword);
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
      if (code.includes('wrong-password') || code.includes('invalid-credential')) {
        throw new Error('Current password is incorrect.');
      }
      if (code.includes('requires-recent-login')) {
        throw new Error('Sign out and sign in again, then retry changing your password.');
      }
      throw new Error(error instanceof Error ? error.message : 'Unable to change your Firebase password.');
    }
  }
  static async logout(): Promise<void> {
    try {
      if (firebaseAuth?.currentUser) await firebaseSignOut(firebaseAuth);
    } finally {
      localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
      window.dispatchEvent(new CustomEvent('festronix:admin-auth', { detail: null }));
    }
  }
}
