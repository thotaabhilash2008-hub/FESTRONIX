import { User } from '../types/festronix';

const STORAGE_KEYS = {
  USERS: 'festronix_users_v1',
  SESSION: 'festronix_auth_session_v1'
};

const INITIAL_USERS: User[] = [
  {
    id: 'user_vce_001',
    username: 'rahul104',
    rollNumber: '22VCECS104',
    fullName: 'Rahul Sharma',
    email: 'rahul.sharma@vardhaman.org',
    phone: '+91 98765 43210',
    college: 'Vardhaman College of Engineering',
    password: 'password123',
    createdAt: '2026-03-01 10:00'
  },
  {
    id: 'user_vce_002',
    username: 'sneha_it',
    rollNumber: '22VCEIT045',
    fullName: 'Sneha Reddy',
    email: 'sneha.r@vardhaman.org',
    phone: '+91 98480 12345',
    college: 'Vardhaman College of Engineering',
    password: 'password123',
    createdAt: '2026-03-02 11:30'
  }
];

export class AuthService {
  static getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_USERS;
    }
  }

  static saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  static getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static signIn(identifier: string, password: string): { success: boolean; user?: User; error?: string } {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, error: 'Please enter both Username/Roll Number and Password.' };
    }

    const users = this.getUsers();
    const user = users.find(
      u =>
        u.username.toLowerCase() === cleanId ||
        u.rollNumber.toLowerCase() === cleanId ||
        u.email.toLowerCase() === cleanId
    );

    if (!user) {
      return { success: false, error: 'No account found with this Username or Roll Number. Please Sign Up.' };
    }

    if (user.password !== cleanPass) {
      return { success: false, error: 'Incorrect password. Please verify and try again.' };
    }

    // Save active session
    const safeUser: User = { ...user };
    delete safeUser.password;
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(safeUser));
    window.dispatchEvent(new CustomEvent('festronix:auth', { detail: safeUser }));

    return { success: true, user: safeUser };
  }

  static signUp(data: {
    username: string;
    rollNumber: string;
    fullName: string;
    email: string;
    phone: string;
    college: string;
    password: string;
  }): { success: boolean; user?: User; error?: string } {
    const roll = data.rollNumber.trim().toUpperCase();
    const username = (data.username || roll).trim().toLowerCase();
    const name = data.fullName.trim();
    const email = data.email.trim().toLowerCase();
    const phone = data.phone.trim();
    const college = (data.college || 'Vardhaman College of Engineering').trim();
    const password = data.password.trim();

    if (!roll || !name || !email || !password) {
      return { success: false, error: 'Please fill in all mandatory fields.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const users = this.getUsers();

    if (users.some(u => u.rollNumber.toUpperCase() === roll)) {
      return { success: false, error: `An account is already registered with Roll Number "${roll}". Please Sign In.` };
    }

    if (users.some(u => u.username.toLowerCase() === username)) {
      return { success: false, error: `Username "${username}" is already taken. Please pick another one.` };
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      username,
      rollNumber: roll,
      fullName: name,
      email,
      phone,
      college,
      password,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    users.push(newUser);
    this.saveUsers(users);

    // Auto-login newly registered user
    const safeUser: User = { ...newUser };
    delete safeUser.password;
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(safeUser));
    window.dispatchEvent(new CustomEvent('festronix:auth', { detail: safeUser }));

    return { success: true, user: safeUser };
  }

  static signOut(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    window.dispatchEvent(new CustomEvent('festronix:auth', { detail: null }));
  }
}
