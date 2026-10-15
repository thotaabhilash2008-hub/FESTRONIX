import { DEPARTMENTS } from '../data/mockData';

export type AdminRole = 'dean_sac' | 'connect_club' | 'vencorpia' | 'dept_coordinator';

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
}

const STORAGE_KEY_ADMIN_SESSION = 'festronix_admin_session_v1';

export const PRESET_ADMINS: Array<AdminUser & { password: string }> = [
  // 1. Dean SAC (Global Fest Oversight)
  {
    id: 'admin_dean_sac',
    username: 'dean_sac',
    password: 'deansac2026',
    fullName: 'Dr. J. V. R. Ravindra',
    designation: 'Dean, Student Activity Council (SAC)',
    role: 'dean_sac',
    email: 'dean.sac@vardhaman.org',
    phone: '+91 98480 11001'
  },
  // 2. CONNECT Club (Central Student Media & Organizing Body, SAC)
  {
    id: 'admin_connect_club',
    username: 'connect_club',
    password: 'connect2026',
    fullName: 'Aditya Varma & Core Team',
    designation: 'President & Lead Organizer, CONNECT Club (SAC)',
    role: 'connect_club',
    email: 'connect.club@vardhaman.org',
    phone: '+91 98480 77001'
  },
  // 3. VENCORPIA (Central Technical, Innovation & Entrepreneurship Body)
  {
    id: 'admin_vencorpia',
    username: 'vencorpia',
    password: 'vencorpia2026',
    fullName: 'Vencorpia Executive Board',
    designation: 'Central Student Leadership, VENCORPIA',
    role: 'vencorpia',
    email: 'vencorpia@vardhaman.org',
    phone: '+91 98480 88001'
  },
  // 4. Department HODs & Coordinators
  {
    id: 'admin_hod_cse',
    username: 'hod_cse',
    password: 'cse2026',
    fullName: 'Dr. K. S. Reddy',
    designation: 'HOD & Chief Coordinator (CSE)',
    role: 'dept_coordinator',
    departmentCode: 'CSE',
    departmentName: 'Computer Science & Engineering',
    email: 'cse.festronix@vardhaman.org',
    phone: '+91 98480 22001'
  },
  {
    id: 'admin_hod_it',
    username: 'hod_it',
    password: 'it2026',
    fullName: 'Prof. Anitha Sharma',
    designation: 'HOD & Chief Coordinator (IT)',
    role: 'dept_coordinator',
    departmentCode: 'IT',
    departmentName: 'Information Technology',
    email: 'it.festronix@vardhaman.org',
    phone: '+91 98480 22002'
  },
  {
    id: 'admin_hod_ece',
    username: 'hod_ece',
    password: 'ece2026',
    fullName: 'Dr. M. V. Ramana',
    designation: 'HOD & Chief Coordinator (ECE)',
    role: 'dept_coordinator',
    departmentCode: 'ECE',
    departmentName: 'Electronics & Communication',
    email: 'ece.festronix@vardhaman.org',
    phone: '+91 98480 22003'
  },
  {
    id: 'admin_hod_eee',
    username: 'hod_eee',
    password: 'eee2026',
    fullName: 'Dr. B. Srinivas',
    designation: 'HOD & Chief Coordinator (EEE)',
    role: 'dept_coordinator',
    departmentCode: 'EEE',
    departmentName: 'Electrical & Electronics',
    email: 'eee.festronix@vardhaman.org',
    phone: '+91 98480 22004'
  },
  {
    id: 'admin_hod_mech',
    username: 'hod_mech',
    password: 'mech2026',
    fullName: 'Dr. C. H. Rao',
    designation: 'HOD & Chief Coordinator (MECH)',
    role: 'dept_coordinator',
    departmentCode: 'MECH',
    departmentName: 'Mechanical Engineering',
    email: 'mech.festronix@vardhaman.org',
    phone: '+91 98480 22005'
  },
  {
    id: 'admin_hod_civil',
    username: 'hod_civil',
    password: 'civil2026',
    fullName: 'Prof. P. Sunitha',
    designation: 'HOD & Chief Coordinator (CIVIL)',
    role: 'dept_coordinator',
    departmentCode: 'CIVIL',
    departmentName: 'Civil Engineering',
    email: 'civil.festronix@vardhaman.org',
    phone: '+91 98480 22006'
  },
  {
    id: 'admin_hod_aiml',
    username: 'hod_aiml',
    password: 'aiml2026',
    fullName: 'Dr. V. Prasad',
    designation: 'HOD & Chief Coordinator (AI&ML)',
    role: 'dept_coordinator',
    departmentCode: 'AI&ML',
    departmentName: 'Artificial Intelligence & Machine Learning',
    email: 'aiml.festronix@vardhaman.org',
    phone: '+91 98480 22007'
  },
  {
    id: 'admin_hod_mba',
    username: 'hod_mba',
    password: 'mba2026',
    fullName: 'Prof. R. L. Narayana',
    designation: 'HOD & Chief Coordinator (MBA)',
    role: 'dept_coordinator',
    departmentCode: 'MBA',
    departmentName: 'Management & Humanities',
    email: 'mba.festronix@vardhaman.org',
    phone: '+91 98480 22008'
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
          phone: dean.phone
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
          phone: connect.phone
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
          phone: vencorpia.phone
        };
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(sessionUser));
        return { success: true, user: sessionUser };
      } else {
        return { success: false, error: 'Incorrect password for Vencorpia.' };
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

    // Match preset HOD for this department
    const preset = PRESET_ADMINS.find(a => a.departmentCode?.toUpperCase() === cleanDept);

    // Accept HOD credentials or general dept coordinator passcode 'festcoord2026'
    const isDeptPass = preset && preset.password === cleanPass;
    const isCoordPass = cleanPass === 'festcoord2026' || cleanPass === `${cleanDept.toLowerCase()}2026`;

    if (preset && (cleanId === preset.username.toLowerCase() || cleanId === preset.email.toLowerCase() || cleanId === cleanDept.toLowerCase())) {
      if (isDeptPass || isCoordPass) {
        const sessionUser: AdminUser = {
          id: preset.id,
          username: preset.username,
          fullName: coordinatorName ? coordinatorName : preset.fullName,
          designation: coordinatorName ? `Faculty Coordinator (${cleanDept})` : preset.designation,
          role: 'dept_coordinator',
          departmentCode: preset.departmentCode,
          departmentName: preset.departmentName,
          email: preset.email,
          phone: preset.phone
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
        role: 'dept_coordinator',
        departmentCode: cleanDept,
        departmentName: deptInfo?.name || cleanDept,
        email: `${cleanDept.toLowerCase()}.coord@vardhaman.org`
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
