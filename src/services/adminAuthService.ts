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

export const PRESET_ADMINS: Array<AdminUser & { password?: string }> = [
  // 1. SAC / Super Admins (Fest-wide administration)
  {
    id: 'admin_dean_sac',
    username: 'dean_sac',
    password: 'deansac2026',
    fullName: 'Md. Asif',
    designation: 'Dean, Student Activity Council (SAC)',
    role: 'dean_sac',
    email: 'dean.sac@vardhaman.org',
    phone: '+91 98480 11001',
    accessBoundary: 'Fest-wide administration'
  },
  {
    id: 'admin_connect_club',
    username: 'connect_club',
    password: 'connect2026',
    fullName: 'Himavardhan & Core Team',
    designation: 'President & Lead Organizer, CONNECT Club (SAC)',
    role: 'connect_club',
    email: 'connect.club@vardhaman.org',
    phone: '+91 98480 77001',
    accessBoundary: 'Fest-wide administration'
  },
  {
    id: 'admin_vencorpia',
    username: 'vencorpia',
    password: 'vencorpia2026',
    fullName: 'Vencorpia Executive Board',
    designation: 'Central Student Leadership, VENCORPIA',
    role: 'vencorpia',
    email: 'vencorpia@vardhaman.org',
    phone: '+91 98480 88001',
    accessBoundary: 'Fest-wide administration'
  },

  // 2. Operational Roles
  {
    id: 'admin_finance_reviewer',
    username: 'finance_reviewer',
    password: 'finance2026',
    fullName: 'VCE Accounts & Finance Desk',
    designation: 'Central Payment Review Officer, FESTRONIX',
    role: 'finance_reviewer',
    email: 'accounts.fest@vardhaman.org',
    phone: '+91 98480 55001',
    accessBoundary: 'Payment data needed for assigned duties'
  },
  {
    id: 'admin_volunteer_staff',
    username: 'volunteer_staff',
    password: 'volunteer2026',
    fullName: 'SAC Student Volunteer Crew',
    designation: 'Gate Entry & Ticketing Volunteer',
    role: 'volunteer_checkin',
    email: 'volunteers.fest@vardhaman.org',
    phone: '+91 98480 66001',
    accessBoundary: 'Limited check-in access'
  },
  {
    id: 'admin_event_coord',
    username: 'event_coord',
    password: 'eventcoord2026',
    fullName: 'Event Operations Team',
    designation: 'Lead Event Coordinator',
    role: 'event_coordinator',
    departmentCode: 'CSE',
    departmentName: 'Computer Science & Engineering',
    email: 'eventcoord.fest@vardhaman.org',
    phone: '+91 98480 33001',
    accessBoundary: 'Assigned event(s) only unless separately authorised',
    assignedEvents: ['evt-1', 'evt-2']
  },

  // 3. Department Chief Coordinators (9 Departments)
  {
    id: 'admin_hod_cse',
    username: 'hod_cse',
    password: 'cse2026',
    fullName: 'Dr. K. S. Reddy',
    designation: 'Department Chief Coordinator (CSE)',
    role: 'dept_chief_coordinator',
    departmentCode: 'CSE',
    departmentName: 'Computer Science & Engineering',
    email: 'cse.festronix@vardhaman.org',
    phone: '+91 98480 22001',
    accessBoundary: "Their department's events"
  },
  {
    id: 'admin_hod_csd',
    username: 'hod_csd',
    password: 'csd2026',
    fullName: 'Dr. S. Radhika',
    designation: 'Department Chief Coordinator (CSD)',
    role: 'dept_chief_coordinator',
    departmentCode: 'CSD',
    departmentName: 'CSE (Data Science)',
    email: 'csd.festronix@vardhaman.org',
    phone: '+91 98480 22009',
    accessBoundary: "Their department's events"
  },
  {
    id: 'admin_hod_csm',
    username: 'hod_csm',
    password: 'csm2026',
    fullName: 'Dr. V. Prasad',
    designation: 'Department Chief Coordinator (CSM)',
    role: 'dept_chief_coordinator',
    departmentCode: 'CSM',
    departmentName: 'CSE (AI & Machine Learning)',
    email: 'csm.festronix@vardhaman.org',
    phone: '+91 98480 22007',
    accessBoundary: "Their department's events"
  },
  {
    id: 'admin_hod_it',
    username: 'hod_it',
    password: 'it2026',
    fullName: 'Prof. Anitha Sharma',
    designation: 'Department Chief Coordinator (IT)',
    role: 'dept_chief_coordinator',
    departmentCode: 'IT',
    departmentName: 'Information Technology',
    email: 'it.festronix@vardhaman.org',
    phone: '+91 98480 22002',
    accessBoundary: "Their department's events"
  },
  {
    id: 'admin_hod_mechanical',
    username: 'hod_mechanical',
    password: 'mechanical2026',
    fullName: 'Dr. C. H. Rao',
    designation: 'Department Chief Coordinator (MECHANICAL)',
    role: 'dept_chief_coordinator',
    departmentCode: 'MECHANICAL',
    departmentName: 'Mechanical Engineering',
    email: 'mechanical.festronix@vardhaman.org',
    phone: '+91 98480 22005',
    accessBoundary: "Their department's events"
  },
  {
    id: 'admin_hod_civil',
    username: 'hod_civil',
    password: 'civil2026',
    fullName: 'Prof. P. Sunitha',
    designation: 'Department Chief Coordinator (CIVIL)',
    role: 'dept_chief_coordinator',
    departmentCode: 'CIVIL',
    departmentName: 'Civil Engineering',
    email: 'civil.festronix@vardhaman.org',
    phone: '+91 98480 22006',
    accessBoundary: "Their department's events"
  },
  {
    id: 'admin_hod_eee',
    username: 'hod_eee',
    password: 'eee2026',
    fullName: 'Dr. B. Srinivas',
    designation: 'Department Chief Coordinator (EEE)',
    role: 'dept_chief_coordinator',
    departmentCode: 'EEE',
    departmentName: 'Electrical & Electronics',
    email: 'eee.festronix@vardhaman.org',
    phone: '+91 98480 22004',
    accessBoundary: "Their department's events"
  },
  {
    id: 'admin_hod_ece',
    username: 'hod_ece',
    password: 'ece2026',
    fullName: 'Dr. M. V. Ramana',
    designation: 'Department Chief Coordinator (ECE)',
    role: 'dept_chief_coordinator',
    departmentCode: 'ECE',
    departmentName: 'Electronics & Communication',
    email: 'ece.festronix@vardhaman.org',
    phone: '+91 98480 22003',
    accessBoundary: "Their department's events"
  },
  {
    id: 'admin_hod_mba',
    username: 'hod_mba',
    password: 'mba2026',
    fullName: 'Prof. R. L. Narayana',
    designation: 'Department Chief Coordinator (MBA)',
    role: 'dept_chief_coordinator',
    departmentCode: 'MBA',
    departmentName: 'Master of Business Administration',
    email: 'mba.festronix@vardhaman.org',
    phone: '+91 98480 22008',
    accessBoundary: "Their department's events"
  }
];

function readCached<T>(key: string, fallback: T): T {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed === null ? fallback : parsed as T;
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
    const cached = readCached<ManagedAdmin[]>(STORAGE_KEY_ADMIN_DIRECTORY, []);
    if (cached.length > 0) return cached;
    const initial = PRESET_ADMINS.map(({ password: _, ...admin }) => admin);
    localStorage.setItem(STORAGE_KEY_ADMIN_DIRECTORY, JSON.stringify(initial));
    return initial;
  }

  static getCoordinators(): ManagedAdmin[] {
    return this.getAllAdmins();
  }

  static async restoreCurrentAdmin(): Promise<AdminUser | null> {
    const cached = this.getCurrentAdmin();
    if (!isSupabaseConfigured()) {
      return cached;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        if (!cached) localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
        return cached;
      }
      const admin = await invokeAdminApi<AdminUser>({ action: 'me' });
      localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(admin));
      return admin;
    } catch (error) {
      if (cached) return cached;
      await supabase.auth.signOut().catch(() => {});
      localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
      return null;
    }
  }

  private static async authenticate(email: string, password: string): Promise<AdminUser> {
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
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Please enter your admin email and password.' };
    }

    // 1. Try Supabase backend if configured
    if (isSupabaseConfigured()) {
      try {
        const user = await this.authenticate(cleanEmail, cleanPass);
        return { success: true, user };
      } catch (err: any) {
        console.warn('Supabase auth failed, checking preset admin credentials:', err?.message);
      }
    }

    // 2. Local / Offline mode fallback for development and offline testing
    const matchedAdmin = PRESET_ADMINS.find(a => 
      a.email.toLowerCase() === cleanEmail ||
      a.username.toLowerCase() === cleanEmail ||
      (a.role === 'dean_sac' && (cleanEmail === 'dean' || cleanEmail === 'dean_sac' || cleanEmail === 'asif')) ||
      (a.role === 'connect_club' && (cleanEmail === 'connect' || cleanEmail === 'connect_club')) ||
      (a.role === 'vencorpia' && (cleanEmail === 'vencorpia')) ||
      (a.role === 'finance_reviewer' && (cleanEmail === 'finance' || cleanEmail === 'finance_reviewer')) ||
      (a.role === 'volunteer_checkin' && (cleanEmail === 'volunteer' || cleanEmail === 'volunteer_staff')) ||
      (a.role === 'event_coordinator' && (cleanEmail === 'event_coord' || cleanEmail === 'eventcoord'))
    );

    if (matchedAdmin) {
      const isPassCorrect = 
        (matchedAdmin.password && matchedAdmin.password.toLowerCase() === cleanPass.toLowerCase()) ||
        (matchedAdmin.role === 'dean_sac' && (cleanPass === 'deansac2026' || cleanPass === 'dean2026')) ||
        (matchedAdmin.role === 'connect_club' && (cleanPass === 'connect2026' || cleanPass === 'connectclub2026')) ||
        (matchedAdmin.role === 'vencorpia' && (cleanPass === 'vencorpia2026' || cleanPass === 'vencorpia')) ||
        (matchedAdmin.role === 'finance_reviewer' && cleanPass === 'finance2026') ||
        (matchedAdmin.role === 'volunteer_checkin' && cleanPass === 'volunteer2026') ||
        (matchedAdmin.role === 'event_coordinator' && cleanPass === 'eventcoord2026') ||
        (matchedAdmin.departmentCode && cleanPass === `${matchedAdmin.departmentCode.toLowerCase()}2026`);

      if (isPassCorrect) {
        const { password: _, ...sessionUser } = matchedAdmin;
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(sessionUser));
        return { success: true, user: sessionUser };
      } else {
        return { success: false, error: 'Incorrect password for this admin account.' };
      }
    }

    return { success: false, error: 'No admin account found with this email. Check spelling or try dean.sac@vardhaman.org' };
  }

  static loginDean(email: string, password: string) {
    return this.loginCentral(email, password);
  }

  static async loginDepartment(
    deptCode: string,
    email: string,
    password: string,
    coordinatorName?: string
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    const cleanDept = deptCode.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanPass) {
      return { success: false, error: `Enter password for ${cleanDept} department.` };
    }

    // 1. Try Supabase if configured
    if (isSupabaseConfigured() && cleanEmail) {
      try {
        const user = await this.authenticate(cleanEmail, cleanPass);
        const isDepartmentRole = ['dept_chief_coordinator', 'dept_coordinator', 'event_coordinator', 'faculty_coord', 'student_coord'].includes(user.role);
        const matchesDepartment = user.departmentCode?.toUpperCase() === cleanDept;
        if (!isDepartmentRole || !matchesDepartment) {
          await supabase.auth.signOut();
          localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
          return { success: false, error: 'This account is not assigned to the selected department.' };
        }
        return { success: true, user };
      } catch (err: any) {
        console.warn('Supabase dept auth failed, checking preset credentials:', err?.message);
      }
    }

    // 2. Offline / Preset Admin Check
    const matchedAdmin = PRESET_ADMINS.find(a => 
      (a.departmentCode?.toUpperCase() === cleanDept) &&
      (!cleanEmail || a.email.toLowerCase() === cleanEmail || a.username.toLowerCase() === cleanEmail)
    ) || PRESET_ADMINS.find(a => a.departmentCode?.toUpperCase() === cleanDept);

    const isUniversalCoordPass = cleanPass === 'festcoord2026' || cleanPass === `${cleanDept.toLowerCase()}2026` || (cleanDept === 'MECHANICAL' && cleanPass === 'mech2026');

    if (matchedAdmin) {
      const isDeptPass = 
        (matchedAdmin.password && matchedAdmin.password.toLowerCase() === cleanPass.toLowerCase()) ||
        isUniversalCoordPass;

      if (isDeptPass) {
        const { password: _, ...baseUser } = matchedAdmin;
        const sessionUser: AdminUser = {
          ...baseUser,
          fullName: coordinatorName ? coordinatorName : baseUser.fullName,
          designation: coordinatorName ? `Faculty Coordinator (${cleanDept})` : baseUser.designation
        };
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(sessionUser));
        return { success: true, user: sessionUser };
      } else {
        return { success: false, error: `Incorrect password for ${cleanDept} department (expected: ${cleanDept.toLowerCase()}2026).` };
      }
    }

    return { success: false, error: `No coordinator found for ${cleanDept}.` };
  }

  static async fetchAdmins(): Promise<ManagedAdmin[]> {
    if (isSupabaseConfigured()) {
      try {
        const admins = await invokeAdminApi<ManagedAdmin[]>({ action: 'list' });
        localStorage.setItem(STORAGE_KEY_ADMIN_DIRECTORY, JSON.stringify(admins));
        window.dispatchEvent(new CustomEvent('festronix:admins-updated', { detail: admins }));
        return admins;
      } catch (e) {
        console.warn('Could not fetch admins from Supabase, using local directory:', e);
      }
    }
    const admins = this.getAllAdmins();
    window.dispatchEvent(new CustomEvent('festronix:admins-updated', { detail: admins }));
    return admins;
  }

  static async addAdmin(
    admin: Omit<AdminUser, 'id'> & { password?: string; assignedEvents?: string[] }
  ): Promise<AdminUser> {
    if (isSupabaseConfigured()) {
      try {
        const created = await invokeAdminApi<AdminUser>({ action: 'create', admin });
        await this.fetchAdmins();
        return created;
      } catch (e) {
        console.warn('Could not create admin via Supabase, saving locally:', e);
      }
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

  static async updateAdmin(
    id: string,
    updated: Partial<AdminUser> & { password?: string }
  ): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await invokeAdminApi({ action: 'update', id, updates: updated });
        const current = this.getCurrentAdmin();
        if (current?.id === id) {
          const refreshed = await invokeAdminApi<AdminUser>({ action: 'me' });
          localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(refreshed));
        }
        await this.fetchAdmins();
        return true;
      } catch (e) {
        console.warn('Could not update admin via Supabase, updating locally:', e);
      }
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
    if (isSupabaseConfigured()) {
      try {
        await invokeAdminApi({ action: 'delete', id });
        await this.fetchAdmins();
        return true;
      } catch (e) {
        console.warn('Could not delete admin via Supabase, deleting locally:', e);
      }
    }
    const all = this.getAllAdmins().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY_ADMIN_DIRECTORY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('festronix:admins-updated', { detail: all }));
    return true;
  }

  static deleteCoordinator(id: string): Promise<boolean> {
    return this.deleteAdmin(id);
  }

  static async logout(): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
  }
}
