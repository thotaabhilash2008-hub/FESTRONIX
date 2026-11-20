import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword as firebaseUpdatePassword,
} from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { FirebaseStaffEventService } from './firebaseStaffEventService';
import { FirebaseAdminUserService } from './firebaseAdminUserService';
import { StorageService } from './storageService';

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

export const PRESET_ADMINS: Array<AdminUser & { password?: string }> = [
  // 1. Primary System Administrator (SUPER ADMIN)
  {
    id: '3a615185-09df-47cd-92cd-36925f17fdba',
    username: 'admin',
    fullName: 'System Administrator',
    designation: 'Central IT Administrator (SAC)',
    role: 'super_admin',
    email: 'admin@gmail.com',
    phone: '+91 98480 00000',
    accessBoundary: 'Fest-wide administration'
  },

  // 2. SAC Central Leadership (ASIF SIR / CC / VENCORPIA)
  {
    id: 'admin_dean_sac',
    username: 'dean_sac',
    fullName: 'Md. Asif (Dean SAC)',
    designation: 'Dean, Student Activity Council (SAC)',
    role: 'dean_sac',
    email: 'dean.sac@vardhaman.org',
    phone: '+91 98480 11001',
    accessBoundary: 'Fest-wide administration'
  },
  {
    id: 'admin_connect_club',
    username: 'connect_club',
    fullName: 'CONNECT Club (SAC Core Team)',
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
    id: '08704ea9-311d-4981-9586-f382c1c80856',
    username: 'event_coord',
    fullName: 'Event Operations Coordinator',
    designation: 'Lead Event Coordinator',
    role: 'event_coordinator',
    departmentCode: 'CSE',
    departmentName: 'Computer Science & Engineering',
    email: 'eventcoord.fest@vardhaman.org',
    phone: '+91 98480 33001',
    accessBoundary: 'Assigned event(s) only unless separately authorised',
    assignedEvents: ['evt-1', 'evt-2']
  },

  // 4. Official Department Staff Coordinators (Festronix-2k26)
  {
    id: 'admin_coord_mech',
    username: 'dhanraj_mech',
    fullName: 'B Dhanraj',
    designation: 'Staff Coordinator (Mech)',
    role: 'dept_chief_coordinator',
    departmentCode: 'MECHANICAL',
    departmentName: 'Mechanical Engineering',
    email: 'dhanraj2205@vardhaman.org',
    phone: '9441381799',
    accessBoundary: "Mechanical department's events"
  },
  {
    id: 'admin_coord_ece',
    username: 'phaniv_ece',
    fullName: 'R Phani Vidyadhar',
    designation: 'Staff Coordinator (ECE)',
    role: 'dept_chief_coordinator',
    departmentCode: 'ECE',
    departmentName: 'Electronics & Communication',
    email: 'rphaniv@vardhaman.org',
    phone: '8801333811',
    accessBoundary: "ECE department's events"
  },
  {
    id: 'admin_coord_eee',
    username: 'vinodreddy_eee',
    fullName: 'S Vinod Reddy',
    designation: 'Staff Coordinator (EEE)',
    role: 'dept_chief_coordinator',
    departmentCode: 'EEE',
    departmentName: 'Electrical & Electronics',
    email: 's.vinodreddy@vardhaman.org',
    phone: '8125421181',
    accessBoundary: "EEE department's events"
  },
  {
    id: 'admin_coord_csd',
    username: 'vinodkumar_csd',
    fullName: 'V Vinod Kumar',
    designation: 'Staff Coordinator (CSD)',
    role: 'dept_chief_coordinator',
    departmentCode: 'CSD',
    departmentName: 'CSE (Data Science)',
    email: 'vinodkumar1807@vardhaman.org',
    phone: '8897715060',
    accessBoundary: "CSD department's events"
  },
  {
    id: 'admin_coord_cse_3',
    username: 'varma_cse',
    fullName: 'BJV Varma',
    designation: 'Staff Coordinator (CSE - 1st Cluster: Verma)',
    role: 'dept_chief_coordinator',
    departmentCode: 'CSE',
    clusterCode: 'CSE-1',
    departmentName: 'Computer Science & Engineering (1st Cluster)',
    email: 'varma@vardhaman.org',
    phone: '8143275536',
    accessBoundary: "CSE 1 cluster events"
  },
  {
    id: 'admin_coord_cse_2',
    username: 'balu_cse',
    fullName: 'Ch Bala Subramanyam',
    designation: 'Staff Coordinator (CSE - 2nd Cluster: Balu)',
    role: 'dept_chief_coordinator',
    departmentCode: 'CSE',
    clusterCode: 'CSE-2',
    departmentName: 'Computer Science & Engineering (2nd Cluster)',
    email: 'balu1681@vardhaman.org',
    phone: '8184864242',
    accessBoundary: "CSE 2 cluster events"
  },
  {
    id: 'admin_coord_cse_1',
    username: 'raghavendra_cse',
    fullName: 'M Raghavendra',
    designation: 'Staff Coordinator (CSE - 3rd Cluster: Raghavendra)',
    role: 'dept_chief_coordinator',
    departmentCode: 'CSE',
    clusterCode: 'CSE-3',
    departmentName: 'Computer Science & Engineering (3rd Cluster)',
    email: 'raghavendra1797@vardhaman.org',
    phone: '6303169820',
    accessBoundary: "CSE 3 cluster events"
  },
  {
    id: 'admin_coord_it',
    username: 'dastagiri_it',
    fullName: 'P Dastagiri Reddy',
    designation: 'Staff Coordinator (IT)',
    role: 'dept_chief_coordinator',
    departmentCode: 'IT',
    departmentName: 'Information Technology',
    email: 'dastagiri1918@vardhaman.org',
    phone: '9966676005',
    accessBoundary: "IT department's events"
  },
  {
    id: 'admin_coord_civil',
    username: 'chaitanya_civil',
    fullName: 'K Chaitanya',
    designation: 'Staff Coordinator (Civil)',
    role: 'dept_chief_coordinator',
    departmentCode: 'CIVIL',
    departmentName: 'Civil Engineering',
    email: 'chaitanya_vce1658@vardhaman.org',
    phone: '7416413410',
    accessBoundary: "Civil department's events"
  },
  {
    id: 'admin_coord_csm',
    username: 'rajashekhar_csm',
    fullName: 'P Rajashekar',
    designation: 'Staff Coordinator (CSM)',
    role: 'dept_chief_coordinator',
    departmentCode: 'CSM',
    departmentName: 'CSE (AI & Machine Learning)',
    email: 'rajashekhar1833@vardhaman.org',
    phone: '7386407609',
    accessBoundary: "CSM department's events"
  },
  {
    id: 'admin_coord_mba',
    username: 'hod_mba',
    fullName: 'Prof. R. L. Narayana',
    designation: 'Staff Coordinator (MBA)',
    role: 'dept_chief_coordinator',
    departmentCode: 'MBA',
    departmentName: 'Master of Business Administration',
    email: 'mba.festronix@vardhaman.org',
    phone: '+91 98480 22008',
    accessBoundary: "MBA department's events"
  }
];

/**
 * Older admin_role rows may predate the CSE cluster migration. Keep the
 * directory and portal scope correct for those known accounts while the
 * database backfill is applied. Explicit cluster_code always wins.
 */
const inferCseClusterCode = (record: Record<string, unknown>): string | undefined => {
  const explicit = String(record.clusterCode ?? record.cluster_code ?? '').trim().toUpperCase();
  if (['CSE-1', 'CSE-2', 'CSE-3'].includes(explicit)) return explicit;

  const departmentCode = String(record.departmentCode ?? record.department_code ?? '').trim().toUpperCase();
  if (departmentCode && departmentCode !== 'CSE') return undefined;

  const identity = [record.username, record.email, record.fullName, record.full_name, record.designation]
    .map(value => String(value ?? '').toLowerCase())
    .join(' ');
  if (/\b(varma|bjv_varma)\b|varma@/.test(identity)) return 'CSE-1';
  if (/\b(balu|ch bala|bala subramanyam)\b|balu1681@/.test(identity)) return 'CSE-2';
  if (/\b(raghavendra|m raghavendra)\b|raghavendra1797@/.test(identity)) return 'CSE-3';
  return undefined;
};

const normalizeManagedAdmin = (admin: Record<string, any>): ManagedAdmin => ({
  ...admin,
  departmentCode: admin.departmentCode || admin.department_code || undefined,
  clusterCode: admin.clusterCode || admin.cluster_code || inferCseClusterCode(admin),
  assignedEvents: Array.isArray(admin.assignedEvents) ? admin.assignedEvents : undefined
} as ManagedAdmin);

export const PRESET_ADMIN_PASSWORDS: Record<string, string[]> = {
  // 1. Asif Sir / CC / Vencorpia & Super Admins
  'dean.sac@vardhaman.org': ['deansac2026', 'asif2026', 'dean2026', 'sac2026', 'festronix2026', 'admin2026'],
  'connect.club@vardhaman.org': ['connect2026', 'cc2026', 'connectclub2026', 'festronix2026', 'admin2026'],
  'vencorpia@vardhaman.org': ['vencorpia2026', 'festronix2026', 'admin2026'],
  'admin@gmail.com': ['admin2026', '123456', 'admin123', 'festronix2026'],

  // 2. Official Staff Coordinators (by email)
  'dhanraj2205@vardhaman.org': ['dhanraj2026', 'mech2026', 'mechanical2026', 'festcoord2026', 'festronix2026', '9441381799'],
  'rphaniv@vardhaman.org': ['phaniv2026', 'ece2026', 'festcoord2026', 'festronix2026', '8801333811'],
  's.vinodreddy@vardhaman.org': ['vinodreddy2026', 'eee2026', 'festcoord2026', 'festronix2026', '8125421181'],
  'vinodkumar1807@vardhaman.org': ['vinodkumar2026', 'csd2026', 'festcoord2026', 'festronix2026', '8897715060'],
  'raghavendra1797@vardhaman.org': ['raghavendra2026', 'cse2026', 'festcoord2026', 'festronix2026', '6303169820'],
  'balu1681@vardhaman.org': ['balu2026', 'cse2026', 'festcoord2026', 'festronix2026', '8184864242'],
  'varma@vardhaman.org': ['varma2026', 'cse2026', 'festcoord2026', 'festronix2026', '8143275536'],
  'dastagiri1918@vardhaman.org': ['dastagiri2026', 'it2026', 'festcoord2026', 'festronix2026', '9966676005'],
  'chaitanya_vce1658@vardhaman.org': ['chaitanya2026', 'civil2026', 'festcoord2026', 'festronix2026', '7416413410'],
  'rajashekhar1833@vardhaman.org': ['rajashekhar2026', 'csm2026', 'festcoord2026', 'festronix2026', '7386407609'],
  'mba.festronix@vardhaman.org': ['mba2026', 'festcoord2026', 'festronix2026', '9848022008'],

  // 3. Department General Channels
  'cse.festronix@vardhaman.org': ['cse2026', 'festcoord2026', 'festronix2026'],
  'csd.festronix@vardhaman.org': ['csd2026', 'festcoord2026', 'festronix2026'],
  'csm.festronix@vardhaman.org': ['csm2026', 'festcoord2026', 'festronix2026'],
  'it.festronix@vardhaman.org': ['it2026', 'festcoord2026', 'festronix2026'],
  'mechanical.festronix@vardhaman.org': ['mechanical2026', 'mech2026', 'festcoord2026', 'festronix2026'],
  'civil.festronix@vardhaman.org': ['civil2026', 'festcoord2026', 'festronix2026'],
  'eee.festronix@vardhaman.org': ['eee2026', 'festcoord2026', 'festronix2026'],
  'ece.festronix@vardhaman.org': ['ece2026', 'festcoord2026', 'festronix2026'],

  // 4. Operations & Event Coordinators
  'accounts.fest@vardhaman.org': ['finance2026', 'accounts2026', 'finance', 'festronix2026'],
  'volunteers.fest@vardhaman.org': ['volunteer2026', 'volunteers2026', 'volunteer', 'festronix2026'],
  'eventcoord.fest@vardhaman.org': ['eventcoord2026', 'events2026', 'festcoord2026', 'festronix2026']
};

const USER_ALIAS_MAP: Record<string, string> = {
  // Asif Sir (Dean SAC)
  'asif': 'dean.sac@vardhaman.org',
  'asifsir': 'dean.sac@vardhaman.org',
  'asif_sir': 'dean.sac@vardhaman.org',
  'asif@gmail.com': 'dean.sac@vardhaman.org',
  'dean': 'dean.sac@vardhaman.org',
  'dean_sac': 'dean.sac@vardhaman.org',
  'deansac': 'dean.sac@vardhaman.org',
  'dean.sac@gmail.com': 'dean.sac@vardhaman.org',
  'deansac@gmail.com': 'dean.sac@vardhaman.org',

  // CC (CONNECT Club)
  'cc': 'connect.club@vardhaman.org',
  'connect': 'connect.club@vardhaman.org',
  'connect_club': 'connect.club@vardhaman.org',
  'connectclub': 'connect.club@vardhaman.org',

  // Vencorpia
  'vencorpia': 'vencorpia@vardhaman.org',

  // System Administrator
  'admin': 'admin@gmail.com',
  'administrator': 'admin@gmail.com',

  // Staff Coordinator Usernames & Aliases
  'dhanraj': 'dhanraj2205@vardhaman.org',
  'dhanraj_mech': 'dhanraj2205@vardhaman.org',
  'b_dhanraj': 'dhanraj2205@vardhaman.org',
  'phaniv': 'rphaniv@vardhaman.org',
  'phaniv_ece': 'rphaniv@vardhaman.org',
  'r_phaniv': 'rphaniv@vardhaman.org',
  'vinodreddy': 's.vinodreddy@vardhaman.org',
  'vinodreddy_eee': 's.vinodreddy@vardhaman.org',
  's_vinodreddy': 's.vinodreddy@vardhaman.org',
  'vinodkumar': 'vinodkumar1807@vardhaman.org',
  'vinodkumar_csd': 'vinodkumar1807@vardhaman.org',
  'v_vinodkumar': 'vinodkumar1807@vardhaman.org',
  'raghavendra': 'raghavendra1797@vardhaman.org',
  'raghavendra_cse': 'raghavendra1797@vardhaman.org',
  'm_raghavendra': 'raghavendra1797@vardhaman.org',
  'balu': 'balu1681@vardhaman.org',
  'balu_cse': 'balu1681@vardhaman.org',
  'ch_balu': 'balu1681@vardhaman.org',
  'varma': 'varma@vardhaman.org',
  'varma_cse': 'varma@vardhaman.org',
  'bjv_varma': 'varma@vardhaman.org',
  'dastagiri': 'dastagiri1918@vardhaman.org',
  'dastagiri_it': 'dastagiri1918@vardhaman.org',
  'p_dastagiri': 'dastagiri1918@vardhaman.org',
  'chaitanya': 'chaitanya_vce1658@vardhaman.org',
  'chaitanya_civil': 'chaitanya_vce1658@vardhaman.org',
  'k_chaitanya': 'chaitanya_vce1658@vardhaman.org',
  'rajashekhar': 'rajashekhar1833@vardhaman.org',
  'rajashekar': 'rajashekhar1833@vardhaman.org',
  'rajashekhar_csm': 'rajashekhar1833@vardhaman.org',
  'p_rajashekhar': 'rajashekhar1833@vardhaman.org',

  // Department Codes
  'cse': 'cse.festronix@vardhaman.org',
  'cse 1': 'varma@vardhaman.org',
  'cse-1': 'varma@vardhaman.org',
  'cse1': 'varma@vardhaman.org',
  'cluster1': 'varma@vardhaman.org',
  'verma': 'varma@vardhaman.org',
  'cse 2': 'balu1681@vardhaman.org',
  'cse-2': 'balu1681@vardhaman.org',
  'cse2': 'balu1681@vardhaman.org',
  'cluster2': 'balu1681@vardhaman.org',
  'cse 3': 'raghavendra1797@vardhaman.org',
  'cse-3': 'raghavendra1797@vardhaman.org',
  'cse3': 'raghavendra1797@vardhaman.org',
  'cluster3': 'raghavendra1797@vardhaman.org',
  'csd': 'csd.festronix@vardhaman.org',
  'csm': 'csm.festronix@vardhaman.org',
  'it': 'it.festronix@vardhaman.org',
  'mechanical': 'mechanical.festronix@vardhaman.org',
  'mech': 'mechanical.festronix@vardhaman.org',
  'civil': 'civil.festronix@vardhaman.org',
  'eee': 'eee.festronix@vardhaman.org',
  'ece': 'ece.festronix@vardhaman.org',
  'mba': 'mba.festronix@vardhaman.org',

  // Operations
  'event_coord': 'eventcoord.fest@vardhaman.org',
  'eventcoord': 'eventcoord.fest@vardhaman.org'
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
  
  if (cleanPass === 'festronix2026' || cleanPass === 'festcoord2026' || cleanPass === 'eventcoord2026' || cleanPass === 'admin2026') {
    return true;
  }

  // Department check (e.g. cse2026, mech2026, festcoord2026)
  if (cleanEmail.includes('.festronix@vardhaman.org') || cleanEmail.includes('@vardhaman.org')) {
    const deptPrefix = cleanEmail.split('.')[0].replace(/[^a-z]/g, '');
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
      throw new Error('Your backend admin session is missing or expired. Sign out and sign in again with the Supabase account credentials.');
    }
    throw new Error(typeof message === 'string' && message.trim() ? message : 'The admin request failed.');
  }
  if (!data) throw new Error('The admin service returned an empty response.');
  return data;
}

async function invokeAdminAuth<T>(body: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase backend is not configured.');
  }

  const { data, error } = await supabase.functions.invoke<T>('admin-auth', { body });
  if (!error && data) return data;

  const context = (error as any)?.context as Response | undefined;
  let details: any = null;
  if (context && typeof context.clone === 'function') {
    details = await context.clone().json().catch(async () => {
      const text = await context.clone().text().catch(() => '');
      return text ? { error: text } : null;
    });
  }
  const message = details?.error || details?.message || (error as any)?.message;
  const status = context?.status || (error as any)?.status;
  const wrapped = new Error(
    typeof message === 'string' && message.trim() ? message : 'Admin authentication service is unavailable.'
  ) as Error & { status?: number; code?: string };
  wrapped.status = status;
  wrapped.code = (error as any)?.code;
  throw wrapped;
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
      throw new Error('Firebase staff authentication is not configured.');
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const directoryMatch = this.getAllAdmins().find(admin =>
      admin.username.toLowerCase() === cleanIdentifier || admin.email.toLowerCase() === cleanIdentifier
    );
    const email = resolveTargetEmail(directoryMatch?.email || cleanIdentifier);
    if (!email.includes('@')) {
      throw new Error('Sign in with the email address assigned to your staff account.');
    }

    let signedIn = false;
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      signedIn = true;
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
          throw new Error(`These credentials belong to the ${user.departmentCode || 'another'} department.`);
        }
        if (requestedCluster && user.clusterCode?.toUpperCase() !== requestedCluster) {
          throw new Error(user.clusterCode
            ? `These credentials belong to the ${user.clusterCode} CSE cluster, not ${requestedCluster}.`
            : `This account is not assigned to ${requestedCluster}. Ask an administrator to assign its cluster.`);
        }
      }
      if (portal === 'event') {
        if (!['event_coordinator', 'faculty_coord', 'student_coord'].includes(role)) {
          throw new Error('This account is not an event coordinator.');
        }
        if (requestedDepartment && user.departmentCode?.toUpperCase() !== requestedDepartment) {
          throw new Error(`These credentials belong to the ${user.departmentCode || 'another'} department.`);
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
      if (signedIn) await firebaseSignOut(firebaseAuth).catch(() => undefined);
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
    if (isFirebaseConfigured) {
      const access = await FirebaseStaffEventService.getAccess();
      return [...new Set(access.user.assignedEvents.map(id => String(id).trim()).filter(Boolean))];
    }
    if (!isSupabaseConfigured()) {
      return this.getCurrentAdmin()?.assignedEvents || [];
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error(`Unable to verify the coordinator session: ${authError.message}`);
    if (!authData.user) throw new Error('The coordinator session has expired. Sign in again.');

    const { data, error } = await supabase
      .from('admin_event_assignments')
      .select('event_id')
      .eq('admin_user_id', authData.user.id);

    if (error) throw new Error(`Unable to load assigned events: ${error.message}`);
    return [...new Set((data || [])
      .map(row => String(row.event_id || '').trim())
      .filter(Boolean))];
  }

  static getAllAdmins(): ManagedAdmin[] {
    const cached = readCached<ManagedAdmin[]>(STORAGE_KEY_ADMIN_DIRECTORY, []);
    if (cached.length > 0) {
      const normalized = cached.map(admin => normalizeManagedAdmin(admin));
      localStorage.setItem(STORAGE_KEY_ADMIN_DIRECTORY, JSON.stringify(normalized));
      return normalized;
    }
    const initial = PRESET_ADMINS
      .map(({ password: _, ...admin }) => normalizeManagedAdmin(admin));
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

    // 1. Try querying Supabase admin_roles table directly. Ambiguous accounts
    // are rejected rather than resolving to an arbitrary first role, which
    // could silently widen or narrow the operator's visible scope.
    try {
      const { data: roleRows, error: roleError } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('created_at', { ascending: true })
        .limit(2);
      if (roleError) throw roleError;
      if ((roleRows?.length || 0) > 1) {
        throw new Error('Multiple active portal roles are assigned to this account. Ask an administrator to keep exactly one active role.');
      }
      const roleRow = roleRows?.[0];

      if (roleRow) {
        // Keep the authenticated portal session aligned with the database
        // assignment table.  Returning the role row without these IDs makes
        // event coordinators look like they have no assigned events, even
        // though the assignment exists in Supabase.
        const { data: assignmentRows, error: assignmentError } = await supabase
          .from('admin_event_assignments')
          .select('event_id')
          .eq('admin_user_id', user.id);
        if (assignmentError) throw assignmentError;

        return {
          id: user.id,
          username: roleRow.username || userMeta.username || emailLower.split('@')[0],
          fullName: roleRow.full_name || userMeta.full_name || emailLower,
          designation: roleRow.designation || userMeta.designation || 'Administrator',
          role: roleRow.role as AdminRole,
          departmentCode: roleRow.department_code || userMeta.department_code || undefined,
          // A backend-authenticated session must use the explicit scope stored
          // in admin_roles. Do not infer a cluster from a display name/email:
          // that can make the UI appear to be in CSE-3 while RLS correctly
          // sees a NULL cluster and rejects the event write.
          clusterCode: roleRow.cluster_code || undefined,
          email: user.email || fallbackEmail,
          phone: roleRow.phone || userMeta.phone || undefined,
          accessBoundary: roleRow.access_boundary || userMeta.access_boundary || undefined,
          assignedEvents: (assignmentRows || [])
            .map(row => String((row as { event_id?: string }).event_id || '').trim())
            .filter(Boolean)
        };
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Multiple active portal roles')) throw e;
      console.warn('Could not query admin_roles table:', e);
    }

    // 2. Try Supabase Edge Function 'admin-users' me action
    try {
      const edgeUser = await invokeAdminApi<AdminUser>({ action: 'me' });
      if (edgeUser && edgeUser.role) return normalizeManagedAdmin(edgeUser);
    } catch {
      // Edge function may not have a database row mapped yet
    }

    // When Supabase is configured, a browser preset is never an authorization
    // source.  Falling back to a cached/preset identity made the portal look
    // authenticated while the database had no matching admin_roles row; any
    // subsequent write was (correctly) rejected by RLS.  Fail closed and make
    // the administrator assignment explicit instead.
    throw new Error('No active admin role is assigned to this account in the backend. Contact a super admin.');
  }

  static async restoreCurrentAdmin(): Promise<AdminUser | null> {
    const cached = this.getCurrentAdmin();

    if (isFirebaseConfigured && firebaseAuth) {
      const currentUser = firebaseAuth.currentUser;
      if (!currentUser) {
        localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
        return null;
      }
      try {
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

    if (isSupabaseConfigured()) {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        let session = sessionData.session;

        // A cached browser identity can outlive the short-lived access token.
        // Refresh it before resolving the protected portal; otherwise the UI
        // may render successfully while the next database request receives a
        // 401/403 from Supabase RLS.
        const expiresSoon = Boolean(
          session?.expires_at && session.expires_at * 1000 <= Date.now() + 30_000
        );
        if (sessionError || !session?.user || expiresSoon) {
          const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) throw refreshError;
          session = refreshed.session;
        }

        if (session?.user) {
          try {
            const fresh = await this.resolveAdminFromAuth(session.user, session.user.email || '');
            localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(fresh));
            return fresh;
          } catch {
            // A cached identity must never be enough to enter a protected
            // portal. Supabase Auth and the active role row are authoritative.
            localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
            return null;
          }
        }
        // Do not render a cached portal session without a live Supabase Auth
        // session. Database writes would otherwise be rejected by RLS while
        // the UI misleadingly appears authenticated.
        localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
        return null;
      } catch {
        // Fail closed when the backend session cannot be verified.
        localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
        return null;
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
   * Authenticate through the server-side username/email resolver. This keeps
   * usernames out of the browser directory as an authority and returns a real
   * Supabase session for RLS-protected portal operations.
   */
  private static async authenticateViaAdminFunction(
    identifier: string,
    password: string,
    portal: 'auto' | 'central' | 'department' | 'event' = 'auto',
    departmentCode?: string,
    clusterCode?: string,
    eventId?: string
  ): Promise<AdminUser> {
    const response = await invokeAdminAuth<{
      user: AdminUser;
      session: { access_token: string; refresh_token: string };
    }>({
      identifier: identifier.trim().toLowerCase(),
      password,
      portal,
      departmentCode,
      clusterCode,
      eventId
    });

    if (!response?.user || !response.session?.access_token || !response.session?.refresh_token) {
      throw new Error('Admin authentication returned an incomplete session.');
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.setSession(response.session);
    if (sessionError) throw new Error(`Unable to establish the backend session: ${sessionError.message}`);

    if (!sessionData.user) {
      throw new Error('Admin authentication returned a session without an authenticated user.');
    }

    // The Edge Function resolves username -> email, but the database remains
    // the authorization source. Re-read the role through the new Auth session
    // so stale/old Edge Function responses cannot create a misleading portal
    // session that will later fail against RLS.
    const user = await this.resolveAdminFromAuth(
      sessionData.user,
      response.user.email || sessionData.user.email || identifier
    );
    localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(user));
    return user;
  }

  /**
   * Authenticate any portal account from its credentials alone.
   *
   * The portal must never trust a department, event, or role selected in the
   * browser. Supabase Auth verifies the credentials and resolveAdminFromAuth
   * reads the active role, department, and event assignments from the
   * database-backed admin role record.
   */
  static async loginWithCredentials(
    identifier: string,
    password: string
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    const rawIdentifier = identifier.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!rawIdentifier || !cleanPassword) {
      return { success: false, error: 'Enter your Gmail and password.' };
    }

    // Keep the existing aliases working for official accounts. For accounts
    // created in the admin portal, use the locally synced directory when it
    // is available; the password is still verified by Supabase Auth below.
    const directoryMatch = this.getAllAdmins().find(admin =>
      admin.username.toLowerCase() === rawIdentifier ||
      admin.email.toLowerCase() === rawIdentifier
    );
    const targetEmail = resolveTargetEmail(directoryMatch?.email || rawIdentifier);

    if (!targetEmail.includes('@')) {
      return {
        success: false,
        error: 'No account was found for that Gmail. Please enter your registered Gmail address.'
      };
    }

    if (isFirebaseConfigured) {
      try {
        const user = await this.authenticateWithFirebase(rawIdentifier, cleanPassword);
        return { success: true, user };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Invalid staff login credentials.' };
      }
    }

    if (isSupabaseConfigured()) {
      try {
        const user = await this.authenticateViaAdminFunction(rawIdentifier, cleanPassword, 'auto');
        return { success: true, user };
      } catch (err: any) {
        // Keep email login compatible with environments where the new
        // admin-auth function has not been deployed yet. Never fall back to
        // preset credentials or a cached identity, and never use this fallback
        // for usernames because Supabase Auth accepts emails here only.
        if (rawIdentifier.includes('@')) {
          try {
            const user = await this.authenticate(rawIdentifier, cleanPassword);
            return { success: true, user };
          } catch (fallbackError: any) {
            return {
              success: false,
              error: fallbackError?.message || err?.message || 'Invalid login credentials.'
            };
          }
        }
        return {
          success: false,
          error: err?.message || 'Invalid login credentials. Please check your Gmail and password.'
        };
      }
    }

    // Local-only fallback for development environments without Supabase.
    // Production uses the verified backend path above.
    const preset = findPresetAdmin(targetEmail) || findPresetAdmin(rawIdentifier);
    if (preset && checkPresetPassword(targetEmail, cleanPassword)) {
      localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(preset));
      return { success: true, user: preset };
    }

    return { success: false, error: 'Supabase backend is not configured for portal login.' };
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

    if (isFirebaseConfigured) {
      try {
        const user = await this.authenticateWithFirebase(rawInput, cleanPass, 'central');
        return { success: true, user };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Invalid login credentials.' };
      }
    }

    // Supabase is authoritative whenever configured. The preset directory is
    // only a local-development fallback; using it in production would render
    // a cached admin UI without an Auth session and every protected write
    // would be rejected by Row-Level Security.
    if (!isSupabaseConfigured() && checkPresetPassword(targetEmail, cleanPass)) {
      const preset = findPresetAdmin(targetEmail) || findPresetAdmin(rawInput);
      if (preset) {
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(preset));
        return { success: true, user: preset };
      }
    }

    // 2. If not a preset match and Supabase is configured, verify against Supabase Auth
    if (isSupabaseConfigured()) {
      try {
        const user = await this.authenticateViaAdminFunction(rawInput, cleanPass, 'central');
        return { success: true, user };
      } catch (err: any) {
        if (targetEmail.includes('@')) {
          try {
            const user = await this.authenticate(targetEmail, cleanPass);
            return { success: true, user };
          } catch (fallbackError: any) {
            return { success: false, error: fallbackError?.message || err?.message || 'Invalid login credentials.' };
          }
        }
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
   * Department Staff Coordinator login
   */
  static async loginDepartment(
    deptCode: string,
    email: string,
    password: string,
    coordinatorName?: string
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    const cleanDept = deptCode.trim().toUpperCase();
    const cleanPass = password.trim();
    const rawEmail = email.trim().toLowerCase();

    // Map CSE clusters (CSE 1: Verma, CSE 2: Balu, CSE 3: Raghavendra)
    const isCse1 = cleanDept === 'CSE 1' || cleanDept === 'CSE-1' || cleanDept === 'CSE1';
    const isCse2 = cleanDept === 'CSE 2' || cleanDept === 'CSE-2' || cleanDept === 'CSE2';
    const isCse3 = cleanDept === 'CSE 3' || cleanDept === 'CSE-3' || cleanDept === 'CSE3';
    const requestedClusterCode = isCse1 ? 'CSE-1' : isCse2 ? 'CSE-2' : isCse3 ? 'CSE-3' : undefined;

    let defaultDeptEmail = `${cleanDept.toLowerCase().replace(/\s+/g, '')}.festronix@vardhaman.org`;
    if (isCse1) defaultDeptEmail = 'varma@vardhaman.org';
    else if (isCse2) defaultDeptEmail = 'balu1681@vardhaman.org';
    else if (isCse3) defaultDeptEmail = 'raghavendra1797@vardhaman.org';

    const resolvedEmail = resolveTargetEmail(rawEmail);
    const targetEmail = resolvedEmail || defaultDeptEmail;

    if (!cleanPass) {
      return { success: false, error: `Enter passcode for ${cleanDept} department coordinator.` };
    }

    if (isFirebaseConfigured) {
      try {
        const user = await this.authenticateWithFirebase(
          rawEmail,
          cleanPass,
          'department',
          (isCse1 || isCse2 || isCse3) ? 'CSE' : cleanDept,
          requestedClusterCode,
        );
        if (coordinatorName?.trim()) user.fullName = coordinatorName.trim();
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(user));
        return { success: true, user };
      } catch (err: any) {
        return { success: false, error: err?.message || `Authentication failed for ${cleanDept}.` };
      }
    }

    // 1. Check department and coordinator preset passwords
    const isDeptPresetMatch =
      cleanPass === `${cleanDept.toLowerCase().replace(/\s+/g, '')}2026` ||
      (cleanDept === 'MECHANICAL' && cleanPass === 'mech2026') ||
      (isCse1 && (cleanPass === 'varma2026' || cleanPass === '8143275536' || cleanPass === 'cse2026')) ||
      (isCse2 && (cleanPass === 'balu2026' || cleanPass === '8184864242' || cleanPass === 'cse2026')) ||
      (isCse3 && (cleanPass === 'raghavendra2026' || cleanPass === '6303169820' || cleanPass === 'cse2026')) ||
      cleanPass === 'festcoord2026' ||
      cleanPass === 'festronix2026' ||
      checkPresetPassword(targetEmail, cleanPass);

    // Preset credentials are retained only for local development without
    // Supabase. A configured production backend must issue the Auth session
    // used by the events RLS policy.
    if (!isSupabaseConfigured() && isDeptPresetMatch) {
      let preset = findPresetAdmin(targetEmail);

      // This legacy helper is still kept for compatibility with older links,
      // but the selected department must never change the identity returned by
      // the credentials.  Reject a credential from another CSE cluster before
      // constructing the local session.
      if (preset) {
        const presetDepartment = preset.departmentCode?.toUpperCase();
        const presetCluster = preset.clusterCode?.toUpperCase();
        if (requestedClusterCode && (presetDepartment !== 'CSE' || presetCluster !== requestedClusterCode)) {
          return { success: false, error: `These credentials belong to the ${presetCluster} CSE cluster, not ${requestedClusterCode}.` };
        }
        if (!requestedClusterCode && presetDepartment && presetDepartment !== cleanDept) {
          return { success: false, error: `These credentials belong to the ${presetDepartment} department.` };
        }
      }
      if (!preset) {
        if (isCse1) preset = PRESET_ADMINS.find(a => a.id === 'admin_coord_cse_1');
        else if (isCse2) preset = PRESET_ADMINS.find(a => a.id === 'admin_coord_cse_2');
        else if (isCse3) preset = PRESET_ADMINS.find(a => a.id === 'admin_coord_cse_3');
        else preset = PRESET_ADMINS.find(a => a.departmentCode === cleanDept);
      }

      const user: AdminUser = {
        ...(preset || {
          id: `admin_coord_${cleanDept.toLowerCase().replace(/\s+/g, '_')}`,
          username: `coord_${cleanDept.toLowerCase().replace(/\s+/g, '_')}`,
          fullName: coordinatorName || (isCse1 ? 'BJV Varma' : isCse2 ? 'Ch Bala Subramanyam' : isCse3 ? 'M Raghavendra' : `Staff Coordinator (${cleanDept})`),
          designation: isCse1 ? 'Staff Coordinator (CSE - 1st Cluster: Verma)' : isCse2 ? 'Staff Coordinator (CSE - 2nd Cluster: Balu)' : isCse3 ? 'Staff Coordinator (CSE - 3rd Cluster: Raghavendra)' : `Staff Coordinator (${cleanDept})`,
          role: 'dept_chief_coordinator',
          departmentCode: (isCse1 || isCse2 || isCse3) ? 'CSE' : cleanDept,
          departmentName: isCse1 ? 'Computer Science & Engineering (1st Cluster)' : isCse2 ? 'Computer Science & Engineering (2nd Cluster)' : isCse3 ? 'Computer Science & Engineering (3rd Cluster)' : cleanDept,
          clusterCode: requestedClusterCode,
          email: targetEmail
        })
      };

      if (coordinatorName) {
        user.fullName = coordinatorName;
      }
      user.departmentCode = (isCse1 || isCse2 || isCse3) ? 'CSE' : cleanDept;
      if (requestedClusterCode) user.clusterCode = requestedClusterCode;
      if (isCse1) {
        user.designation = 'Staff Coordinator (CSE - 1st Cluster: Verma)';
        user.departmentName = 'Computer Science & Engineering (1st Cluster)';
      } else if (isCse2) {
        user.designation = 'Staff Coordinator (CSE - 2nd Cluster: Balu)';
        user.departmentName = 'Computer Science & Engineering (2nd Cluster)';
      } else if (isCse3) {
        user.designation = 'Staff Coordinator (CSE - 3rd Cluster: Raghavendra)';
        user.departmentName = 'Computer Science & Engineering (3rd Cluster)';
      }

      localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(user));

      return { success: true, user };
    }

    // 2. If not preset match and Supabase is configured, authenticate with Supabase Auth
    if (isSupabaseConfigured()) {
      try {
        const user = await this.authenticateViaAdminFunction(
          rawEmail,
          cleanPass,
          'department',
          (isCse1 || isCse2 || isCse3) ? 'CSE' : cleanDept,
          requestedClusterCode
        );
        const actualDepartment = user.departmentCode?.toUpperCase();
        const actualCluster = user.clusterCode?.toUpperCase();
        if (requestedClusterCode && (actualDepartment !== 'CSE' || actualCluster !== requestedClusterCode)) {
          return {
            success: false,
            error: actualCluster
              ? `These credentials belong to the ${actualCluster} CSE cluster, not ${requestedClusterCode}.`
              : `This account is not assigned to ${requestedClusterCode} in the backend. Ask the administrator to assign the CSE cluster, then sign in again.`
          };
        }
        if (!requestedClusterCode && actualDepartment !== cleanDept) {
          return { success: false, error: `These credentials belong to the ${actualDepartment} department.` };
        }
        if (coordinatorName) {
          user.fullName = coordinatorName;
        }
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(user));
        return { success: true, user };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message?.includes('Invalid login credentials')
            ? `Incorrect passcode for ${cleanDept} coordinator account (${targetEmail}).`
            : (err?.message || `Authentication failed for ${cleanDept}.`)
        };
      }
    }

    return {
      success: false,
      error: `Incorrect passcode for ${cleanDept} coordinator. Try your assigned cluster passcode.`
    };
  }

  /**
   * Event Coordinator login (department & event scoped)
   */
  static async loginEventCoordinator(
    deptCode: string,
    eventId: string,
    email: string,
    password: string,
    coordinatorName?: string
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    const cleanDept = deptCode.trim().toUpperCase();
    const isCse = cleanDept.startsWith('CSE');
    const effectiveDeptCode = isCse ? 'CSE' : cleanDept;
    const cleanPass = password.trim();
    const rawEmail = email.trim().toLowerCase();
    const resolvedEmail = resolveTargetEmail(rawEmail);
    const targetEmail = resolvedEmail || (rawEmail ? rawEmail : `event.${effectiveDeptCode.toLowerCase()}@vardhaman.org`);

    if (!cleanPass) {
      return { success: false, error: `Enter passcode for event coordinator.` };
    }

    if (isFirebaseConfigured) {
      try {
        const user = await this.authenticateWithFirebase(rawEmail, cleanPass, 'event', effectiveDeptCode, undefined, eventId);
        if (coordinatorName?.trim()) user.fullName = coordinatorName.trim();
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(user));
        return { success: true, user };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Authentication failed for this event coordinator.' };
      }
    }

    const isMatch =
      cleanPass === 'eventcoord2026' ||
      cleanPass === 'festcoord2026' ||
      cleanPass === 'festronix2026' ||
      cleanPass === `${cleanDept.toLowerCase().replace(/\s+/g, '')}2026` ||
      cleanPass === `${effectiveDeptCode.toLowerCase()}2026` ||
      (cleanDept === 'MECHANICAL' && cleanPass === 'mech2026') ||
      checkPresetPassword(targetEmail, cleanPass);

    // The legacy event-coordinator presets are local-only. When Supabase is
    // configured, authenticate first so attendance and event operations carry
    // a real Auth token and satisfy backend RLS.
    if (!isSupabaseConfigured() && isMatch) {
      let matchedEvt: any = undefined;
      try {
        const evts = StorageService.getEvents();
        matchedEvt = evts.find(e => e.id === eventId || e.slug === eventId);
      } catch {
        // Fallback if StorageService isn't available
      }

      let resolvedName = coordinatorName?.trim();
      if (!resolvedName && matchedEvt?.coordinatorName) {
        resolvedName = matchedEvt.coordinatorName.trim();
      }
      if (!resolvedName && rawEmail && !rawEmail.startsWith('event.') && !rawEmail.startsWith('eventcoord')) {
        const prefix = rawEmail.split('@')[0];
        resolvedName = prefix.replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
      if (!resolvedName) {
        resolvedName = matchedEvt?.title ? `${matchedEvt.title} Coordinator` : `Event Coordinator (${cleanDept})`;
      }

      const user: AdminUser = {
        id: `event_coord_${eventId || effectiveDeptCode.toLowerCase()}_${Date.now()}`,
        username: `eventcoord_${effectiveDeptCode.toLowerCase()}`,
        fullName: resolvedName,
        designation: matchedEvt?.title ? `Event Coordinator • ${matchedEvt.title}` : `Event Operations Coordinator (${cleanDept})`,
        role: 'event_coordinator',
        departmentCode: effectiveDeptCode,
        departmentName: effectiveDeptCode,
        email: targetEmail,
        phone: matchedEvt?.coordinatorPhone || '+91 98480 33001',
        accessBoundary: matchedEvt?.title ? `Assigned event: ${matchedEvt.title}` : 'Assigned event operations and participant management',
        assignedEvents: eventId ? [eventId] : (matchedEvt ? [matchedEvt.id] : ['evt-1', 'evt-2'])
      };

      localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(user));

      return { success: true, user };
    }

    if (isSupabaseConfigured()) {
      try {
        const user = await this.authenticateViaAdminFunction(
          rawEmail,
          cleanPass,
          'event',
          effectiveDeptCode,
          undefined,
          eventId
        );
        const actualDepartment = user.departmentCode?.toUpperCase();
        if (actualDepartment && actualDepartment !== effectiveDeptCode) {
          return { success: false, error: `These credentials belong to the ${actualDepartment} department.` };
        }
        if (coordinatorName) user.fullName = coordinatorName;
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(user));
        return { success: true, user };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Authentication failed for this event coordinator.' };
      }
    }

    return {
      success: false,
      error: `Incorrect passcode. Try 'eventcoord2026', '${cleanDept.toLowerCase()}2026', or 'festcoord2026'.`
    };
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

  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const current = currentPassword.trim();
    if (!current) throw new Error('Enter your current password.');
    if (newPassword.length < 8) throw new Error('New password must be at least 8 characters.');

    if (isFirebaseConfigured && firebaseAuth?.currentUser?.email) {
      const user = firebaseAuth.currentUser;
      const email = user.email;
      if (!email) throw new Error('The signed-in Firebase account has no email address.');
      const credential = EmailAuthProvider.credential(email, current);
      try {
        await reauthenticateWithCredential(user, credential);
        await firebaseUpdatePassword(user, newPassword);
        return;
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

    if (isSupabaseConfigured()) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const email = sessionData.session?.user?.email?.trim().toLowerCase();
        if (email) {
          const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: current });
          if (verifyError) {
            throw new Error('Current password is incorrect.');
          }
          const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
          if (updateError) throw new Error(updateError.message || 'Unable to change your password.');
          return;
        }
      } catch (err: any) {
        if (err?.message?.includes('Current password is incorrect')) throw err;
      }
    }

    // Preset/Local admin password change
    const currentAdmin = this.getCurrentAdmin();
    if (!currentAdmin) throw new Error('Your admin session has expired. Sign in again.');
    const emailKey = currentAdmin.email.toLowerCase();
    if (PRESET_ADMIN_PASSWORDS[emailKey]) {
      PRESET_ADMIN_PASSWORDS[emailKey].unshift(newPassword);
    } else {
      PRESET_ADMIN_PASSWORDS[emailKey] = [newPassword];
    }
  }

  static async logout(): Promise<void> {
    if (isFirebaseConfigured && firebaseAuth) {
      await firebaseSignOut(firebaseAuth).catch(() => undefined);
    }
    if (!isFirebaseConfigured && isSupabaseConfigured()) {
      await supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
    window.dispatchEvent(new CustomEvent('festronix:admin-auth', { detail: null }));
  }
}
