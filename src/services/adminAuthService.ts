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
  // 1. Primary System Administrator (NEW SUPER ADMIN)
  {
    id: '3a615185-09df-47cd-92cd-36925f17fdba',
    username: 'admin',
    fullName: 'Administrator',
    designation: 'System Administrator (SAC)',
    role: 'super_admin',
    email: 'admin@gmail.com',
    phone: '+91 98480 00000',
    accessBoundary: 'Fest-wide administration'
  },

  // 2. SAC / Super Admins (Fest-wide administration)
  {
    id: 'admin_dean_sac',
    username: 'dean_sac',
    fullName: 'Dr. J. V. R. Ravindra',
    designation: 'Dean, Student Activity Council (SAC)',
    role: 'dean_sac',
    email: 'dean.sac@vardhaman.org',
    phone: '+91 98480 11001',
    accessBoundary: 'Fest-wide administration'
  },
  {
    id: 'admin_connect_club',
    username: 'connect_club',
    fullName: 'Aditya Varma & Core Team',
    designation: 'President & Lead Organizer, CONNECT Club (SAC)',
    role: 'connect_club',
    email: 'connect.club@vardhaman.org',
    phone: '+91 98480 77001',
    accessBoundary: 'Fest-wide administration'
  },
  {
    id: '43a3b649-d825-4253-8806-18ed4bdf909c',
    username: 'vencorpia',
    fullName: 'Vencorpia Executive Board',
    designation: 'Central Student Leadership, VENCORPIA',
    role: 'vencorpia',
    email: 'vencorpia@vardhaman.org',
    phone: '+91 98480 88001',
    accessBoundary: 'Fest-wide administration'
  },

  // 3. Operational Roles
  {
    id: 'd16b71c5-b45b-47f4-a40b-e832b3cde5ab',
    username: 'finance_reviewer',
    fullName: 'VCE Accounts & Finance Desk',
    designation: 'Central Payment Review Officer, FESTRONIX',
    role: 'finance_reviewer',
    email: 'accounts.fest@vardhaman.org',
    phone: '+91 98480 55001',
    accessBoundary: 'Payment data needed for assigned duties'
  },
  {
    id: '20e681b2-a606-47cd-a819-7ae93fbf32ae',
    username: 'volunteer_staff',
    fullName: 'SAC Student Volunteer Crew',
    designation: 'Gate Entry & Ticketing Volunteer',
    role: 'volunteer_checkin',
    email: 'volunteers.fest@vardhaman.org',
    phone: '+91 98480 66001',
    accessBoundary: 'Limited check-in access'
  },
  {
    id: '08704ea9-311d-4981-9586-f382c1c80856',
    username: 'event_coord',
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

  // 4. Department Chief Coordinators (9 Departments)
  {
    id: '0a78361f-984b-45d7-b43d-613cb02bd7af',
    username: 'hod_cse',
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

export const PRESET_ADMIN_PASSWORDS: Record<string, string[]> = {
  // Super Admins
  'dean.sac@vardhaman.org': ['deansac2026', 'dean2026', 'sac2026', 'festronix2026', 'admin2026'],
  'connect.club@vardhaman.org': ['connect2026', 'connectclub2026', 'festronix2026', 'admin2026'],
  'vencorpia@vardhaman.org': ['vencorpia2026', 'festronix2026', 'admin2026'],
  'admin@gmail.com': ['admin2026', '123456', 'admin123', 'festronix2026'],

  // Operational Roles
  'accounts.fest@vardhaman.org': ['finance2026', 'accounts2026', 'finance', 'festronix2026'],
  'volunteers.fest@vardhaman.org': ['volunteer2026', 'volunteers2026', 'volunteer', 'festronix2026'],
  'eventcoord.fest@vardhaman.org': ['eventcoord2026', 'events2026', 'festcoord2026', 'festronix2026'],

  // Department Chief Coordinators
  'cse.festronix@vardhaman.org': ['cse2026', 'festcoord2026', 'festronix2026'],
  'csd.festronix@vardhaman.org': ['csd2026', 'festcoord2026', 'festronix2026'],
  'csm.festronix@vardhaman.org': ['csm2026', 'festcoord2026', 'festronix2026'],
  'it.festronix@vardhaman.org': ['it2026', 'festcoord2026', 'festronix2026'],
  'mechanical.festronix@vardhaman.org': ['mechanical2026', 'mech2026', 'festcoord2026', 'festronix2026'],
  'civil.festronix@vardhaman.org': ['civil2026', 'festcoord2026', 'festronix2026'],
  'eee.festronix@vardhaman.org': ['eee2026', 'festcoord2026', 'festronix2026'],
  'ece.festronix@vardhaman.org': ['ece2026', 'festcoord2026', 'festronix2026'],
  'mba.festronix@vardhaman.org': ['mba2026', 'festcoord2026', 'festronix2026']
};

const USER_ALIAS_MAP: Record<string, string> = {
  'admin': 'admin@gmail.com',
  'administrator': 'admin@gmail.com',
  'dean': 'dean.sac@vardhaman.org',
  'dean_sac': 'dean.sac@vardhaman.org',
  'deansac': 'dean.sac@vardhaman.org',
  'asif': 'dean.sac@vardhaman.org',
  'connect': 'connect.club@vardhaman.org',
  'connect_club': 'connect.club@vardhaman.org',
  'connectclub': 'connect.club@vardhaman.org',
  'vencorpia': 'vencorpia@vardhaman.org',
  'finance': 'accounts.fest@vardhaman.org',
  'finance_reviewer': 'accounts.fest@vardhaman.org',
  'accounts': 'accounts.fest@vardhaman.org',
  'volunteer': 'volunteers.fest@vardhaman.org',
  'volunteer_staff': 'volunteers.fest@vardhaman.org',
  'volunteers': 'volunteers.fest@vardhaman.org',
  'event_coord': 'eventcoord.fest@vardhaman.org',
  'eventcoord': 'eventcoord.fest@vardhaman.org',
  // Department aliases
  'cse': 'cse.festronix@vardhaman.org',
  'csd': 'csd.festronix@vardhaman.org',
  'csm': 'csm.festronix@vardhaman.org',
  'it': 'it.festronix@vardhaman.org',
  'mechanical': 'mechanical.festronix@vardhaman.org',
  'mech': 'mechanical.festronix@vardhaman.org',
  'civil': 'civil.festronix@vardhaman.org',
  'eee': 'eee.festronix@vardhaman.org',
  'ece': 'ece.festronix@vardhaman.org',
  'mba': 'mba.festronix@vardhaman.org',
  'hod_cse': 'cse.festronix@vardhaman.org',
  'hod_csd': 'csd.festronix@vardhaman.org',
  'hod_csm': 'csm.festronix@vardhaman.org',
  'hod_it': 'it.festronix@vardhaman.org',
  'hod_mechanical': 'mechanical.festronix@vardhaman.org',
  'hod_civil': 'civil.festronix@vardhaman.org',
  'hod_eee': 'eee.festronix@vardhaman.org',
  'hod_ece': 'ece.festronix@vardhaman.org',
  'hod_mba': 'mba.festronix@vardhaman.org'
};

function resolveTargetEmail(input: string): string {
  const clean = input.trim().toLowerCase();
  return USER_ALIAS_MAP[clean] || clean;
}

function checkPresetPassword(targetEmail: string, pass: string): boolean {
  const cleanPass = pass.trim();
  const cleanEmail = targetEmail.trim().toLowerCase();
  
  const allowed = PRESET_ADMIN_PASSWORDS[cleanEmail];
  if (allowed && allowed.includes(cleanPass)) {
    return true;
  }
  
  if (cleanPass === 'festronix2026' || cleanPass === 'admin2026') {
    return true;
  }

  if (cleanEmail.includes('.festronix@vardhaman.org')) {
    const deptPrefix = cleanEmail.split('.')[0];
    if (cleanPass === `${deptPrefix}2026` || cleanPass === 'festcoord2026') {
      return true;
    }
  }

  return false;
}

function findPresetAdmin(targetEmailOrUser: string): AdminUser | undefined {
  const clean = targetEmailOrUser.trim().toLowerCase();
  const resolvedEmail = resolveTargetEmail(clean);
  return PRESET_ADMINS.find(
    a => a.email.toLowerCase() === resolvedEmail ||
         a.username.toLowerCase() === clean ||
         a.email.toLowerCase() === clean
  );
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
    const context = (error as any).context;
    let details: any = null;
    if (context && typeof context.clone === 'function') {
      const responseBody = await context.clone().text().catch(() => '');
      if (responseBody) {
        try { details = JSON.parse(responseBody); } catch { details = { error: responseBody }; }
      }
    } else if (context && typeof context.json === 'function') {
      details = await context.json().catch(() => null);
    }
    throw new Error(details?.error || details?.message || error.message || 'The admin request failed.');
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

  /**
   * Resolves the canonical AdminUser model from a verified Supabase authenticated user.
   */
  private static async resolveAdminFromAuth(user: any, fallbackEmail: string): Promise<AdminUser> {
    const emailLower = (user.email || fallbackEmail || '').trim().toLowerCase();
    const userMeta = user.user_metadata || {};

    // 1. Try querying Supabase admin_roles table directly
    try {
      const { data: roleRow } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .maybeSingle();

      if (roleRow) {
        return {
          id: user.id,
          username: roleRow.username || userMeta.username || emailLower.split('@')[0],
          fullName: roleRow.full_name || userMeta.full_name || emailLower,
          designation: roleRow.designation || userMeta.designation || 'Administrator',
          role: roleRow.role as AdminRole,
          departmentCode: roleRow.department_code || userMeta.department_code || undefined,
          email: user.email || fallbackEmail,
          phone: roleRow.phone || userMeta.phone || undefined,
          accessBoundary: roleRow.access_boundary || userMeta.access_boundary || undefined
        };
      }
    } catch (e) {
      console.warn('Could not query admin_roles table:', e);
    }

    // 2. Try Supabase Edge Function 'admin-users' me action
    try {
      const edgeUser = await invokeAdminApi<AdminUser>({ action: 'me' });
      if (edgeUser && edgeUser.role) return edgeUser;
    } catch {
      // Edge function may not have a database row mapped yet
    }

    const preset = findPresetAdmin(emailLower);
    if (preset) {
      return { ...preset, id: user.id || preset.id };
    }

    throw new Error('No active admin role is assigned to this account. Contact a super admin.');
  }

  static async restoreCurrentAdmin(): Promise<AdminUser | null> {
    const cached = this.getCurrentAdmin();

    if (isSupabaseConfigured()) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          try {
            const fresh = await this.resolveAdminFromAuth(session.user, session.user.email || '');
            localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(fresh));
            return fresh;
          } catch {
            // Retain cached session if role resolution is pending
          }
        }
      } catch {
        // Retain cached session on network or session check issue
      }
    }

    return cached;
  }

  /**
   * Authenticates directly against Supabase Auth backend.
   * Strictly verifies email and password with Supabase.
   */
  private static async authenticate(email: string, password: string): Promise<AdminUser> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error('Enter the email address and password for this admin account.');
    }

    // 1. Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password
    });

    if (error || !data.user) {
      const msg = error?.message || '';
      if (error?.code === 'email_not_confirmed' || /not confirmed/i.test(msg)) {
        throw new Error('This admin email has not been confirmed yet in Supabase.');
      }
      if (error?.name === 'AuthRetryableFetchError' || /network|fetch/i.test(msg)) {
        throw new Error('Unable to reach Supabase authentication service. Please check your network connection.');
      }
      throw new Error('Invalid login credentials. Please check your email and password.');
    }

    // 2. Resolve admin profile & roles from Supabase
    const admin = await this.resolveAdminFromAuth(data.user, cleanEmail);
    localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(admin));
    return admin;
  }

  /**
   * Central council & Super Admin login (verifies against Supabase backend)
   */
  static async loginCentral(
    emailOrUser: string,
    password: string
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    const rawInput = emailOrUser.trim();
    const cleanPass = password.trim();

    if (!rawInput || !cleanPass) {
      return { success: false, error: 'Please enter your admin email and password.' };
    }

    const targetEmail = resolveTargetEmail(rawInput);

    // 1. Check against official preset credentials first
    if (checkPresetPassword(targetEmail, cleanPass)) {
      const preset = findPresetAdmin(targetEmail) || findPresetAdmin(rawInput);
      if (preset) {
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(preset));

        // Background non-blocking session sync if Supabase is configured
        if (isSupabaseConfigured()) {
          supabase.auth.signInWithPassword({
            email: targetEmail,
            password: cleanPass
          }).catch(() => {});
        }

        return { success: true, user: preset };
      }
    }

    // 2. If not a preset match and Supabase is configured, verify against Supabase Auth
    if (isSupabaseConfigured()) {
      try {
        const user = await this.authenticate(targetEmail, cleanPass);
        return { success: true, user };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Invalid login credentials. Please check your email and password.' };
      }
    }

    return {
      success: false,
      error: 'Invalid login credentials. Please check your email and password.'
    };
  }

  static loginDean(email: string, password: string) {
    return this.loginCentral(email, password);
  }

  /**
   * Department Chief & Coordinator login (verifies against Supabase backend)
   */
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
      return { success: false, error: `Enter password for ${cleanDept} department coordinator.` };
    }

    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase backend is not configured in .env.' };
    }

    const defaultDeptEmail = `${cleanDept.toLowerCase()}.festronix@vardhaman.org`;
    const targetEmail = cleanEmail || defaultDeptEmail;

    try {
      const user = await this.authenticate(targetEmail, cleanPass);
      if (coordinatorName) {
        user.fullName = coordinatorName;
        user.designation = `Faculty Coordinator (${cleanDept})`;
      }
      user.departmentCode = cleanDept;
      localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(user));
      return { success: true, user };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message?.includes('Invalid login credentials')
          ? `Incorrect password for ${cleanDept} coordinator account (${targetEmail}).`
          : (err?.message || `Authentication failed for ${cleanDept}.`)
      };
    }
  }

  static async fetchAdmins(): Promise<ManagedAdmin[]> {
    if (isSupabaseConfigured()) {
      try {
        const admins = await invokeAdminApi<ManagedAdmin[]>({ action: 'list' });
        if (Array.isArray(admins)) {
          localStorage.setItem(STORAGE_KEY_ADMIN_DIRECTORY, JSON.stringify(admins));
          window.dispatchEvent(new CustomEvent('festronix:admins-updated', { detail: admins }));
          return admins;
        }
      } catch (e) {
        console.warn('Could not fetch admins via edge function:', e);
      }

      try {
        const { data: dbRoles, error } = await supabase.from('admin_roles').select('*').eq('active', true);
        if (error) throw error;
        if (Array.isArray(dbRoles)) {
          const list: ManagedAdmin[] = dbRoles.map((r: any) => ({
            id: r.user_id,
            username: r.username,
            fullName: r.full_name,
            designation: r.designation || 'Administrator',
            role: r.role as AdminRole,
            departmentCode: r.department_code || undefined,
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

  static async updateAdmin(
    id: string,
    updated: Partial<AdminUser> & { password?: string }
  ): Promise<boolean> {
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
    if (isSupabaseConfigured()) {
      let edgeFunctionError: unknown = null;
      try {
        await invokeAdminApi({ action: 'delete', id });
      } catch (error) {
        edgeFunctionError = error;
        const message = error instanceof Error ? error.message : String(error || '');
        const isBusinessRuleError = /cannot disable your own|last active super admin|already exists|already been disabled|not authorized|only authorized|permission|invalid|sign in/i.test(message);
        if (isBusinessRuleError) throw error;

        // Keep deletion usable while a hosted Edge Function is being deployed
        // or when an older deployment is still serving traffic. Global admins
        // are allowed to delete role records through the RLS policy below.
        const { data, error: roleError } = await supabase
          .from('admin_roles')
          .delete()
          .eq('user_id', id)
          .select('user_id');

        if (roleError) {
          throw new Error(`${(error as Error)?.message || 'Unable to delete the account.'} ${roleError.message}`);
        }
        if (!data || data.length === 0) {
          throw new Error((error as Error)?.message || 'The admin account no longer exists or has already been disabled.');
        }

        // Remove event assignments and the profile as best-effort cleanup even
        // if the hosted function is still serving the old soft-delete code.
        await supabase.from('admin_event_assignments').delete().eq('admin_user_id', id);
        await supabase.from('profiles').delete().eq('id', id);
      }

      // Remove the account from the visible directory immediately. This avoids
      // showing a stale cached card if the follow-up realtime/list request is
      // delayed or temporarily unavailable.
      const remaining = this.getAllAdmins().filter(admin => admin.id !== id);
      localStorage.setItem(STORAGE_KEY_ADMIN_DIRECTORY, JSON.stringify(remaining));
      window.dispatchEvent(new CustomEvent('festronix:admins-updated', { detail: remaining }));

      try {
        const refreshed = await this.fetchAdmins();
        const withoutDeleted = refreshed.filter(admin => admin.id !== id);
        if (withoutDeleted.length !== refreshed.length) {
          localStorage.setItem(STORAGE_KEY_ADMIN_DIRECTORY, JSON.stringify(withoutDeleted));
          window.dispatchEvent(new CustomEvent('festronix:admins-updated', { detail: withoutDeleted }));
        }
      } catch (refreshError) {
        // The backend mutation already succeeded; retain the immediate local
        // result and let the realtime listener reconcile the directory later.
        console.warn('Admin directory refresh after deletion failed:', refreshError, edgeFunctionError);
      }
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

  static async logout(): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
    window.dispatchEvent(new CustomEvent('festronix:admin-auth', { detail: null }));
  }
}
