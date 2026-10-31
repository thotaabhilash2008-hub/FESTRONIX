import { User } from '../types/festronix';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEYS = {
  USERS: 'festronix_users_v1',
  SESSION: 'festronix_auth_session_v1'
};

// --------------------------------------------------------------------------
// Offline / dev-mode seed users (only used when Supabase is NOT configured)
// --------------------------------------------------------------------------
const OFFLINE_SEED_USERS: User[] = [
  {
    id: 'd795cf91-7f50-497b-922f-d33c379c8085',
    username: 'dhanush',
    rollNumber: '25881A05FC',
    fullName: 'Dhanush',
    email: 'dhanushmathe@gmail.com',
    phone: '6303894505',
    college: 'Vardhaman College of Engineering',
    password: 'password123',
    createdAt: '2026-10-16 07:03'
  },
  {
    id: 'a87b0964-05e3-4142-b95d-bd2daf810b88',
    username: 'rahul104',
    rollNumber: '22VCECS104',
    fullName: 'Rahul Sharma',
    email: 'rahul104@vardhaman.org',
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
  private static isInitialized = false;

  // -----------------------------------------------------------------------
  // Initializes real-time auth state listener from Supabase
  // -----------------------------------------------------------------------
  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (isSupabaseConfigured()) {
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          localStorage.removeItem(STORAGE_KEYS.SESSION);
          window.dispatchEvent(new CustomEvent('festronix:auth', { detail: null }));
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Fetch/refresh the profile from the database
          const cached = this.getCurrentUser();
          if (!cached || cached.id !== session.user.id) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

              if (profile) {
                const user: User = this.profileToUser(profile);
                localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
                window.dispatchEvent(new CustomEvent('festronix:auth', { detail: user }));
              } else {
                // Profile may not have been created yet (trigger delay);
                // build a minimal user from auth metadata
                const user: User = {
                  id: session.user.id,
                  username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || '',
                  rollNumber: session.user.user_metadata?.roll_number || '',
                  fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                  email: session.user.email || '',
                  phone: session.user.user_metadata?.phone || '',
                  college: session.user.user_metadata?.college || 'Vardhaman College of Engineering',
                  createdAt: session.user.created_at || new Date().toISOString()
                };
                localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
                window.dispatchEvent(new CustomEvent('festronix:auth', { detail: user }));
              }
            } catch (err) {
              console.warn('Could not sync user profile from Supabase:', err);
            }
          }
        }
      });

      // On init, also try to restore from an existing Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const cached = this.getCurrentUser();
          if (!cached || cached.id !== session.user.id) {
            supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle()
              .then(({ data: profile }) => {
                if (profile) {
                  const user = this.profileToUser(profile);
                  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
                  window.dispatchEvent(new CustomEvent('festronix:auth', { detail: user }));
                }
              });
          }
        }
      });
    }
  }

  // -----------------------------------------------------------------------
  // Convert a Supabase profiles row → User object
  // -----------------------------------------------------------------------
  private static profileToUser(profile: any): User {
    return {
      id: profile.id,
      username: profile.username || profile.roll_number,
      rollNumber: profile.roll_number,
      fullName: profile.full_name,
      email: profile.email,
      phone: profile.phone || '',
      college: profile.college,
      createdAt: profile.created_at
    };
  }

  // -----------------------------------------------------------------------
  // Get cached user (fast, synchronous — used for initial render)
  // -----------------------------------------------------------------------
  static getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // -----------------------------------------------------------------------
  // Sign In
  // -----------------------------------------------------------------------
  static async signIn(
    identifier: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, error: 'Please enter your email address and password.' };
    }

    // =====================================================================
    // SUPABASE AUTH (primary path when configured)
    // =====================================================================
    if (isSupabaseConfigured()) {
      try {
        if (!cleanId.includes('@')) {
          return { success: false, error: 'Sign in with the email address on your account.' };
        }

        // Authenticate via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanId.toLowerCase(),
          password: cleanPass
        });

        if (authError || !authData.user) {
          // Provide user-friendly messages for common Supabase errors
          const msg = authError?.message?.toLowerCase() || '';

          if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
            return { success: false, error: 'Incorrect password. Please verify and try again.' };
          }
          if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
            return {
              success: false,
              error: 'Your email has not been confirmed. Please check your inbox or contact the organizers.'
            };
          }
          if (msg.includes('disabled') || msg.includes('email logins are disabled') || authError?.code === 'email_provider_disabled') {
            return {
              success: false,
              error: 'Email sign-in is currently disabled in the system. Please contact the Festronix admin team to enable it.'
            };
          }

          return {
            success: false,
            error: authError?.message || 'Sign-in failed. Please try again.'
          };
        }

        // Successfully authenticated — fetch the profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        const user: User = {
          id: authData.user.id,
          username: profile?.username || authData.user.user_metadata?.username || cleanId,
          rollNumber: profile?.roll_number || authData.user.user_metadata?.roll_number || '',
          fullName: profile?.full_name || authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'User',
          email: profile?.email || authData.user.email || '',
          phone: profile?.phone || authData.user.user_metadata?.phone || '',
          college: profile?.college || authData.user.user_metadata?.college || 'Vardhaman College of Engineering',
          createdAt: profile?.created_at || new Date().toISOString()
        };

        // Cache session locally (no password!)
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('festronix:auth', { detail: user }));

        return { success: true, user };
      } catch (err: any) {
        console.error('Supabase sign-in error:', err);
        return {
          success: false,
          error: 'A network error occurred. Please check your connection and try again.'
        };
      }
    }

    // =====================================================================
    // OFFLINE / LOCAL STORAGE FALLBACK (only when Supabase is NOT configured)
    // =====================================================================
    const localUsers = this.getOfflineUsers();
    const localMatch = localUsers.find(
      u =>
        (u.username && u.username.toLowerCase() === cleanId.toLowerCase()) ||
        (u.rollNumber && u.rollNumber.toLowerCase() === cleanId.toLowerCase()) ||
        (u.email && u.email.toLowerCase() === cleanId.toLowerCase())
    );

    if (!localMatch) {
      return { success: false, error: 'No account found with this email address. Please Sign Up.' };
    }

    if (localMatch.password !== cleanPass) {
      return { success: false, error: 'Incorrect password. Please verify and try again.' };
    }

    const safeUser: User = { ...localMatch };
    delete safeUser.password;
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(safeUser));
    window.dispatchEvent(new CustomEvent('festronix:auth', { detail: safeUser }));

    return { success: true, user: safeUser };
  }

  // -----------------------------------------------------------------------
  // Sign Up
  // -----------------------------------------------------------------------
  static async signUp(data: {
    username: string;
    rollNumber: string;
    fullName: string;
    email: string;
    phone: string;
    college: string;
    password: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
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

    // =====================================================================
    // SUPABASE SIGN UP (primary path when configured)
    // =====================================================================
    if (isSupabaseConfigured()) {
      try {
        // Register via Supabase Auth — the `handle_new_user` trigger in
        // database trigger creates the profile, and unique database indexes
        // enforce roll number and username uniqueness without exposing profiles.
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              roll_number: roll,
              username,
              phone,
              college
            }
          }
        });

        if (authError) {
          const msg = authError.message?.toLowerCase() || '';

          if (msg.includes('duplicate key') || msg.includes('idx_profiles_roll_number') || msg.includes('profiles_username')) {
            return { success: false, error: 'That roll number or username is already registered. Please sign in or choose another.' };
          }

          if (msg.includes('disabled') || msg.includes('email signups are disabled') || authError.code === 'email_provider_disabled') {
            return {
              success: false,
              error: 'Email sign-up is currently disabled in the system. Please contact the Festronix admin team to enable it in the Supabase dashboard (Authentication → Providers → Email).'
            };
          }
          if (msg.includes('already registered') || msg.includes('user already registered')) {
            return {
              success: false,
              error: `An account with this email already exists. Please Sign In instead.`
            };
          }

          return { success: false, error: authError.message };
        }

        if (!authData.user) {
          return { success: false, error: 'Sign-up failed. Please try again.' };
        }

        // Supabase can create the account without creating a session when email
        // confirmation is enabled. Do not cache a local-looking user in that
        // state: the registration RPC requires a real authenticated session.
        if (!authData.session) {
          return {
            success: false,
            error: 'Account created. Confirm your email, then sign in before registering for an event.'
          };
        }

        // Build the user object from the newly created auth user
        const newUser: User = {
          id: authData.user.id,
          username,
          rollNumber: roll,
          fullName: name,
          email,
          phone,
          college,
          createdAt: new Date().toISOString()
        };

        // Cache session locally (no password!)
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(newUser));
        window.dispatchEvent(new CustomEvent('festronix:auth', { detail: newUser }));

        return { success: true, user: newUser };
      } catch (err: any) {
        console.error('Supabase sign-up error:', err);
        return {
          success: false,
          error: 'A network error occurred. Please check your connection and try again.'
        };
      }
    }

    // =====================================================================
    // OFFLINE / LOCAL STORAGE FALLBACK (only when Supabase is NOT configured)
    // =====================================================================
    const users = this.getOfflineUsers();

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
    this.saveOfflineUsers(users);

    const safeUser: User = { ...newUser };
    delete safeUser.password;
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(safeUser));
    window.dispatchEvent(new CustomEvent('festronix:auth', { detail: safeUser }));

    return { success: true, user: safeUser };
  }

  // -----------------------------------------------------------------------
  // Sign Out
  // -----------------------------------------------------------------------
  static async signOut(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase sign-out warning:', err);
      }
    }
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    window.dispatchEvent(new CustomEvent('festronix:auth', { detail: null }));
  }

  // -----------------------------------------------------------------------
  // Offline user helpers (only used when Supabase is NOT configured)
  // -----------------------------------------------------------------------
  static getOfflineUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    let users: User[] = [];
    if (raw) {
      try {
        users = JSON.parse(raw);
        if (!Array.isArray(users)) users = [];
      } catch {
        users = [];
      }
    }

    // Ensure seed users exist for offline mode
    let changed = false;
    for (const seedUser of OFFLINE_SEED_USERS) {
      const exists = users.some(
        u =>
          (u.rollNumber && u.rollNumber.toLowerCase() === seedUser.rollNumber.toLowerCase()) ||
          (u.email && u.email.toLowerCase() === seedUser.email.toLowerCase())
      );
      if (!exists) {
        users.push({ ...seedUser });
        changed = true;
      }
    }

    if (changed || !raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return users;
  }

  private static saveOfflineUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // -----------------------------------------------------------------------
  // Legacy API: getUsers / saveUsers (kept for backward compatibility)
  // -----------------------------------------------------------------------
  static getUsers(): User[] {
    return this.getOfflineUsers();
  }

  static saveUsers(users: User[]): void {
    this.saveOfflineUsers(users);
  }
}

// Auto-initialize auth listener
AuthService.init();
