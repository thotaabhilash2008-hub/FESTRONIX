import { DEPARTMENTS } from '../data/mockData';
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

export const isSuperAdminRole = (role: AdminRole): boolean => {
  return role === 'dean_sac' || role === 'connect_club' || role === 'vencorpia' || role === 'super_admin';
};

export const getDynamicDepartments = (): Array<{ id: string; code: string; name: string; description: string; chiefCoordinator: string; contact: string; iconName: string }> => {
  try {
    const raw = localStorage.getItem('festronix_departments_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEPARTMENTS;
};

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
}

const STORAGE_KEY_ADMIN_SESSION = 'festronix_admin_session_v1';

export const PRESET_ADMINS: Array<AdminUser & { password: string }> = [
  // ==========================================
  // 5. SAC / SUPER-ADMIN (3 Super Admins: Fest-wide Administration)
  // ==========================================
  {
    id: 'admin_dean_sac',
    username: 'dean_sac',
    password: 'deansac2026',
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
    password: 'connect2026',
    fullName: 'Aditya Varma & Core Team',
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

  // ==========================================
  // 6. FINANCE / PAYMENT REVIEWER
  // ==========================================
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

  // ==========================================
  // 7. VOLUNTEER / CHECK-IN STAFF
  // ==========================================
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

  // ==========================================
  // 3. EVENT COORDINATOR
  // ==========================================
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
    accessBoundary: 'Assigned event(s) only unless separately authorised'
  },

  // ==========================================
  // 4. DEPARTMENT CHIEF COORDINATOR (9 DEPARTMENTS)
  // ==========================================
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

export class AdminAuthService {
  static getCurrentAdmin(): AdminUser | null {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_SESSION);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Login for Central Oversight (Dean SAC, Connect Club, Vencorpia, Super Admin)
   */
  static async loginCentral(
    usernameOrEmail: string,
    password: string
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    const cleanId = usernameOrEmail.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, error: 'Please enter Username/Email and Password.' };
    }

    // --- 1. SUPABASE ROLE-BASED AUTH CHECK ---
    if (isSupabaseConfigured()) {
      try {
        let authEmail = cleanId;
        if (!cleanId.includes('@')) {
          // Check preset matching email
          const matchingPreset = PRESET_ADMINS.find(p => p.username.toLowerCase() === cleanId);
          if (matchingPreset) {
            authEmail = matchingPreset.email;
          }
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: cleanPass
        });

        if (!authError && authData.user) {
          // Check role in admin_roles table
          const { data: roleData } = await supabase
            .from('admin_roles')
            .select('*')
            .eq('user_id', authData.user.id)
            .maybeSingle();

          if (roleData) {
            const sessionUser: AdminUser = {
              id: authData.user.id,
              username: cleanId,
              fullName: authData.user.user_metadata?.full_name || 'Admin',
              designation: roleData.designation || 'Central Administrator',
              role: roleData.role as AdminRole,
              email: authData.user.email || '',
              departmentCode: roleData.department_code || undefined
            };
            localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(sessionUser));
            return { success: true, user: sessionUser };
          }
        }
      } catch (err) {
        console.warn('Supabase admin login check warning, checking preset credentials:', err);
      }
    }

    // --- 2. DYNAMIC ADMINS CHECK ---
    const allAdmins = this.getAllAdmins();

    const matchedAdmin = allAdmins.find(a => {
      const u = a.username.toLowerCase();
      const e = a.email.toLowerCase();
      if (u === cleanId || e === cleanId) return true;
      if (a.role === 'dean_sac' && (cleanId === 'dean' || cleanId === 'dean_sac')) return true;
      if (a.role === 'connect_club' && (cleanId === 'connect' || cleanId === 'connect_club')) return true;
      if (a.role === 'vencorpia' && (cleanId === 'vencorpia' || cleanId === 'vencorpia_club')) return true;
      if (a.role === 'finance_reviewer' && (cleanId === 'finance' || cleanId === 'finance_reviewer')) return true;
      if (a.role === 'volunteer_checkin' && (cleanId === 'volunteer' || cleanId === 'volunteer_staff')) return true;
      if (a.role === 'event_coordinator' && (cleanId === 'eventcoord' || cleanId === 'event_coord')) return true;
      return false;
    });

    if (matchedAdmin) {
      const isPassCorrect = 
        matchedAdmin.password === cleanPass ||
        (matchedAdmin.role === 'connect_club' && cleanPass === 'connectclub2026') ||
        (matchedAdmin.role === 'vencorpia' && cleanPass === 'vencorpia') ||
        (matchedAdmin.role === 'finance_reviewer' && cleanPass === 'finance2026') ||
        (matchedAdmin.role === 'volunteer_checkin' && cleanPass === 'volunteer2026') ||
        (matchedAdmin.role === 'event_coordinator' && cleanPass === 'eventcoord2026');

      if (isPassCorrect) {
        const sessionUser: AdminUser = {
          id: matchedAdmin.id,
          username: matchedAdmin.username,
          fullName: matchedAdmin.fullName,
          designation: matchedAdmin.designation,
          role: matchedAdmin.role,
          email: matchedAdmin.email,
          phone: matchedAdmin.phone,
          departmentCode: matchedAdmin.departmentCode,
          departmentName: matchedAdmin.departmentName,
          accessBoundary: matchedAdmin.accessBoundary
        };
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(sessionUser));
        return { success: true, user: sessionUser };
      } else {
        return { success: false, error: `Incorrect password for ${matchedAdmin.fullName || matchedAdmin.username}.` };
      }
    }

    return {
      success: false,
      error: 'Invalid credentials. Please verify your username and password.'
    };
  }

  static loginDean(usernameOrEmail: string, password: string) {
    return this.loginCentral(usernameOrEmail, password);
  }

  /**
   * Login for Department HODs and Coordinators
   */
  static async loginDepartment(
    deptCode: string,
    usernameOrCode: string,
    password: string,
    coordinatorName?: string
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    const cleanDept = deptCode.trim().toUpperCase();
    const cleanId = usernameOrCode.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanDept) {
      return { success: false, error: 'Please select an Engineering Department.' };
    }

    if (!cleanId || !cleanPass) {
      return { success: false, error: 'Please provide credentials or department passcode.' };
    }

    // --- 1. SUPABASE ADMIN ROLE CHECK ---
    if (isSupabaseConfigured()) {
      try {
        let authEmail = cleanId;
        if (!cleanId.includes('@')) {
          const matchingPreset = PRESET_ADMINS.find(
            p => (p.departmentCode?.toUpperCase() === cleanDept || (cleanDept === 'MECHANICAL' && p.departmentCode?.toUpperCase() === 'MECH')) && p.username.toLowerCase() === cleanId
          );
          if (matchingPreset) {
            authEmail = matchingPreset.email;
          }
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: cleanPass
        });

        if (!authError && authData.user) {
          const { data: roleData } = await supabase
            .from('admin_roles')
            .select('*')
            .eq('user_id', authData.user.id)
            .maybeSingle();

          if (roleData && (roleData.department_code?.toUpperCase() === cleanDept || roleData.role === 'dean_sac' || roleData.role === 'super_admin')) {
            const deptInfo = getDynamicDepartments().find(d => d.code.toUpperCase() === cleanDept);
            const sessionUser: AdminUser = {
              id: authData.user.id,
              username: cleanId,
              fullName: coordinatorName || authData.user.user_metadata?.full_name || 'Coordinator',
              designation: roleData.designation || `Faculty Coordinator (${cleanDept})`,
              role: roleData.role as AdminRole,
              departmentCode: cleanDept,
              departmentName: deptInfo?.name || cleanDept,
              email: authData.user.email || ''
            };
            localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(sessionUser));
            return { success: true, user: sessionUser };
          }
        }
      } catch (err) {
        console.warn('Supabase dept admin login check warning:', err);
      }
    }

    // --- 2. DYNAMIC DEPT ADMINS & HOD CHECK ---
    const allAdmins = this.getAllAdmins();
    const deptAdmins = allAdmins.filter(a => {
      const code = a.departmentCode?.toUpperCase();
      if (code === cleanDept) return true;
      if (cleanDept === 'MECHANICAL' && code === 'MECH') return true;
      if (cleanDept === 'MECH' && code === 'MECHANICAL') return true;
      return false;
    });

    const matchingDeptUser = deptAdmins.find(a => 
      a.username.toLowerCase() === cleanId || 
      a.email.toLowerCase() === cleanId ||
      cleanId === cleanDept.toLowerCase() ||
      (cleanDept === 'MECHANICAL' && (cleanId === 'hod_mech' || cleanId === 'mech'))
    );

    const isUniversalCoordPass = cleanPass === 'festcoord2026' || 
      cleanPass === `${cleanDept.toLowerCase()}2026` ||
      (cleanDept === 'MECHANICAL' && cleanPass === 'mech2026');

    if (matchingDeptUser) {
      const isDeptPass = matchingDeptUser.password === cleanPass || 
        (cleanDept === 'MECHANICAL' && (cleanPass === 'mech2026' || cleanPass === 'mechanical2026'));

      if (isDeptPass || isUniversalCoordPass) {
        const sessionUser: AdminUser = {
          id: matchingDeptUser.id,
          username: matchingDeptUser.username,
          fullName: coordinatorName ? coordinatorName : matchingDeptUser.fullName,
          designation: coordinatorName ? `Faculty Coordinator (${cleanDept})` : matchingDeptUser.designation,
          role: matchingDeptUser.role,
          departmentCode: matchingDeptUser.departmentCode,
          departmentName: matchingDeptUser.departmentName,
          email: matchingDeptUser.email,
          phone: matchingDeptUser.phone,
          accessBoundary: matchingDeptUser.accessBoundary || "Their department's events"
        };
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(sessionUser));
        return { success: true, user: sessionUser };
      } else {
        return { success: false, error: `Invalid password for ${cleanDept} department.` };
      }
    }

    if (isUniversalCoordPass) {
      const deptInfo = getDynamicDepartments().find(d => d.code.toUpperCase() === cleanDept);
      const sessionUser: AdminUser = {
        id: `admin_coord_${cleanDept.toLowerCase()}_${Date.now()}`,
        username: cleanId,
        fullName: coordinatorName || `Faculty Coordinator (${cleanDept})`,
        designation: `Department Coordinator (${cleanDept})`,
        role: 'dept_chief_coordinator',
        departmentCode: cleanDept,
        departmentName: deptInfo?.name || cleanDept,
        email: `${cleanDept.toLowerCase()}.coord@vardhaman.org`,
        accessBoundary: "Their department's events"
      };
      localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(sessionUser));
      return { success: true, user: sessionUser };
    }

    return {
      success: false,
      error: `Invalid credentials for ${cleanDept} department.`
    };
  }

  // ==========================================
  // UNIFIED ADMINS DIRECTORY & CRUD
  // (Supports Super Admin adding, updating, creating, and deleting HODs, Coordinators & Payment Reviewers)
  // ==========================================

  private static readonly STORAGE_KEY_ADMINS_LIST = 'festronix_all_admins_v2';

  static getAllAdmins(): Array<AdminUser & { password?: string; assignedEvents?: string[] }> {
    const raw = localStorage.getItem(this.STORAGE_KEY_ADMINS_LIST);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse managed admins:', e);
      }
    }
    // Backward compatibility: load PRESET_ADMINS + any older custom coordinators
    const oldCustom = this.getCustomCoordinators();
    const initialList = [...PRESET_ADMINS, ...oldCustom];
    localStorage.setItem(this.STORAGE_KEY_ADMINS_LIST, JSON.stringify(initialList));
    return initialList;
  }

  static saveAllAdmins(list: Array<AdminUser & { password?: string; assignedEvents?: string[] }>): void {
    localStorage.setItem(this.STORAGE_KEY_ADMINS_LIST, JSON.stringify(list));
  }

  static getCustomCoordinators(): Array<AdminUser & { password?: string; assignedEvents?: string[] }> {
    const raw = localStorage.getItem('festronix_custom_coordinators_v1');
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static getCoordinators(): Array<AdminUser & { password?: string; assignedEvents?: string[] }> {
    return this.getAllAdmins();
  }

  static addAdmin(
    admin: Omit<AdminUser, 'id'> & { password?: string; assignedEvents?: string[] }
  ): AdminUser & { password?: string; assignedEvents?: string[] } {
    const list = this.getAllAdmins();
    const prefix = admin.role === 'finance_reviewer'
      ? 'reviewer'
      : (admin.role === 'dept_chief_coordinator' || admin.role === 'dept_coordinator')
      ? `hod_${(admin.departmentCode || 'dept').toLowerCase()}`
      : admin.role === 'volunteer_checkin'
      ? 'volunteer'
      : `coord_${(admin.departmentCode || 'central').toLowerCase()}`;

    const newAdmin = {
      ...admin,
      id: `${prefix}_${Date.now().toString().slice(-4)}`
    };
    list.push(newAdmin);
    this.saveAllAdmins(list);
    return newAdmin;
  }

  static addCoordinator(
    coordinator: Omit<AdminUser, 'id'> & { password?: string; assignedEvents?: string[] }
  ): AdminUser & { password?: string; assignedEvents?: string[] } {
    return this.addAdmin(coordinator);
  }

  static updateAdmin(
    id: string,
    updated: Partial<AdminUser & { password?: string; assignedEvents?: string[] }>
  ): boolean {
    const list = this.getAllAdmins();
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updated };
      this.saveAllAdmins(list);

      // If active session matches this user, update active session too
      const current = this.getCurrentAdmin();
      if (current && current.id === id) {
        const refreshedSession: AdminUser = {
          ...current,
          ...updated
        };
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(refreshedSession));
      }
      return true;
    }
    return false;
  }

  static updateCoordinator(
    id: string,
    updated: Partial<AdminUser & { password?: string; assignedEvents?: string[] }>
  ): boolean {
    return this.updateAdmin(id, updated);
  }

  static deleteAdmin(id: string): boolean {
    const list = this.getAllAdmins();
    const filtered = list.filter(c => c.id !== id);
    this.saveAllAdmins(filtered);
    return true;
  }

  static deleteCoordinator(id: string): boolean {
    return this.deleteAdmin(id);
  }

  static async logout(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase logout warning:', err);
      }
    }
    localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
  }
}
