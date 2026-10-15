import { DEPARTMENTS } from '../data/mockData';

export type AdminRole = 
  | 'dean_sac' 
  | 'connect_club' 
  | 'vencorpia' 
  | 'dept_chief_coordinator'
  | 'dept_coordinator'
  | 'event_coordinator' 
  | 'finance_reviewer' 
  | 'volunteer_checkin';

export const isSuperAdminRole = (role: AdminRole): boolean => {
  return role === 'dean_sac' || role === 'connect_club' || role === 'vencorpia';
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

  static loginCentral(usernameOrEmail: string, password: string): { success: boolean; user?: AdminUser; error?: string } {
    const cleanId = usernameOrEmail.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, error: 'Please enter Username/Email and Password.' };
    }

    const dean = PRESET_ADMINS.find(a => a.role === 'dean_sac');
    const connect = PRESET_ADMINS.find(a => a.role === 'connect_club');
    const vencorpia = PRESET_ADMINS.find(a => a.role === 'vencorpia');
    const finance = PRESET_ADMINS.find(a => a.role === 'finance_reviewer');
    const volunteer = PRESET_ADMINS.find(a => a.role === 'volunteer_checkin');
    const eventCoord = PRESET_ADMINS.find(a => a.role === 'event_coordinator');

    // 1. Check Dean SAC Credentials
    if (dean && (dean.username.toLowerCase() === cleanId || dean.email.toLowerCase() === cleanId)) {
      if (dean.password === cleanPass) {
        const sessionUser: AdminUser = {
          id: dean.id,
          username: dean.username,
          fullName: dean.fullName,
          designation: dean.designation,
          role: dean.role,
          email: dean.email,
          phone: dean.phone,
          accessBoundary: dean.accessBoundary
        };
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(sessionUser));
        return { success: true, user: sessionUser };
      } else {
        return { success: false, error: 'Incorrect password for Dean SAC.' };
      }
    }

    // 2. Check Connect Club Credentials
    if (connect && (connect.username.toLowerCase() === cleanId || connect.email.toLowerCase() === cleanId || cleanId === 'connect')) {
      if (connect.password === cleanPass || cleanPass === 'connectclub2026') {
        const sessionUser: AdminUser = {
          id: connect.id,
          username: connect.username,
          fullName: connect.fullName,
          designation: connect.designation,
          role: connect.role,
          email: connect.email,
          phone: connect.phone,
          accessBoundary: connect.accessBoundary
        };
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(sessionUser));
        return { success: true, user: sessionUser };
      } else {
        return { success: false, error: 'Incorrect password for Connect Club.' };
      }
    }

    // 3. Check Vencorpia Credentials
    if (vencorpia && (vencorpia.username.toLowerCase() === cleanId || vencorpia.email.toLowerCase() === cleanId || cleanId === 'vencorpia_club')) {
      if (vencorpia.password === cleanPass || cleanPass === 'vencorpia' || cleanPass === 'vencorpia2026') {
        const sessionUser: AdminUser = {
          id: vencorpia.id,
          username: vencorpia.username,
          fullName: vencorpia.fullName,
          designation: vencorpia.designation,
          role: vencorpia.role,
          email: vencorpia.email,
          phone: vencorpia.phone,
          accessBoundary: vencorpia.accessBoundary
        };
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(sessionUser));
        return { success: true, user: sessionUser };
      } else {
        return { success: false, error: 'Incorrect password for Vencorpia.' };
      }
    }

    // 4. Check Finance Reviewer Credentials
    if (finance && (finance.username.toLowerCase() === cleanId || cleanId === 'finance' || finance.email.toLowerCase() === cleanId)) {
      if (finance.password === cleanPass || cleanPass === 'finance2026') {
        const sessionUser: AdminUser = {
          id: finance.id,
          username: finance.username,
          fullName: finance.fullName,
          designation: finance.designation,
          role: finance.role,
          email: finance.email,
          phone: finance.phone,
          accessBoundary: finance.accessBoundary
        };
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(sessionUser));
        return { success: true, user: sessionUser };
      } else {
        return { success: false, error: 'Incorrect password for Finance / Payment Reviewer.' };
      }
    }

    // 5. Check Volunteer / Check-in Staff Credentials
    if (volunteer && (volunteer.username.toLowerCase() === cleanId || cleanId === 'volunteer' || volunteer.email.toLowerCase() === cleanId)) {
      if (volunteer.password === cleanPass || cleanPass === 'volunteer2026') {
        const sessionUser: AdminUser = {
          id: volunteer.id,
          username: volunteer.username,
          fullName: volunteer.fullName,
          designation: volunteer.designation,
          role: volunteer.role,
          email: volunteer.email,
          phone: volunteer.phone,
          accessBoundary: volunteer.accessBoundary
        };
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(sessionUser));
        return { success: true, user: sessionUser };
      } else {
        return { success: false, error: 'Incorrect password for Volunteer / Check-in Staff.' };
      }
    }

    // 6. Check Event Coordinator Credentials
    if (eventCoord && (eventCoord.username.toLowerCase() === cleanId || cleanId === 'eventcoord' || cleanId === 'event_coord')) {
      if (eventCoord.password === cleanPass || cleanPass === 'eventcoord2026') {
        const sessionUser: AdminUser = {
          id: eventCoord.id,
          username: eventCoord.username,
          fullName: eventCoord.fullName,
          designation: eventCoord.designation,
          role: eventCoord.role,
          email: eventCoord.email,
          phone: eventCoord.phone,
          departmentCode: eventCoord.departmentCode,
          departmentName: eventCoord.departmentName,
          accessBoundary: eventCoord.accessBoundary
        };
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(sessionUser));
        return { success: true, user: sessionUser };
      } else {
        return { success: false, error: 'Incorrect password for Event Coordinator.' };
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

  static loginDepartment(
    deptCode: string,
    usernameOrCode: string,
    password: string,
    coordinatorName?: string
  ): { success: boolean; user?: AdminUser; error?: string } {
    const cleanDept = deptCode.trim().toUpperCase();
    const cleanId = usernameOrCode.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanDept) {
      return { success: false, error: 'Please select an Engineering Department.' };
    }

    if (!cleanId || !cleanPass) {
      return { success: false, error: 'Please provide credentials or department passcode.' };
    }

    // Match preset HOD for this department (supports MECHANICAL / MECH aliases)
    const preset = PRESET_ADMINS.find(a => {
      const code = a.departmentCode?.toUpperCase();
      if (code === cleanDept) return true;
      if (cleanDept === 'MECHANICAL' && code === 'MECH') return true;
      if (cleanDept === 'MECH' && code === 'MECHANICAL') return true;
      return false;
    });

    // Accept HOD credentials or general dept coordinator passcode 'festcoord2026'
    const isDeptPass = preset && (
      preset.password === cleanPass ||
      (cleanDept === 'MECHANICAL' && (cleanPass === 'mech2026' || cleanPass === 'mechanical2026'))
    );
    const isCoordPass = cleanPass === 'festcoord2026' || 
      cleanPass === `${cleanDept.toLowerCase()}2026` ||
      (cleanDept === 'MECHANICAL' && cleanPass === 'mech2026');

    if (preset && (
      cleanId === preset.username.toLowerCase() || 
      cleanId === preset.email.toLowerCase() || 
      cleanId === cleanDept.toLowerCase() ||
      (cleanDept === 'MECHANICAL' && (cleanId === 'hod_mech' || cleanId === 'mech'))
    )) {
      if (isDeptPass || isCoordPass) {
        const sessionUser: AdminUser = {
          id: preset.id,
          username: preset.username,
          fullName: coordinatorName ? coordinatorName : preset.fullName,
          designation: coordinatorName ? `Faculty Coordinator (${cleanDept})` : preset.designation,
          role: preset.role,
          departmentCode: preset.departmentCode,
          departmentName: preset.departmentName,
          email: preset.email,
          phone: preset.phone,
          accessBoundary: preset.accessBoundary || "Their department's events"
        };
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(sessionUser));
        return { success: true, user: sessionUser };
      } else {
        return { success: false, error: `Invalid password for ${cleanDept} department.` };
      }
    }

    // Allow custom coordinator login for the department with dept passcode
    if (isCoordPass) {
      const deptInfo = DEPARTMENTS.find(d => d.code.toUpperCase() === cleanDept);
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

  static logout(): void {
    localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
  }
}
