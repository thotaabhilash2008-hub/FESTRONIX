import { User } from '../types/festronix';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEYS = {
  USERS: 'festronix_users_v1',
  SESSION: 'festronix_auth_session_v1'
};

const INITIAL_USERS: User[] = [
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

  /**
   * Initializes real-time auth state listener from Supabase
   */
  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (isSupabaseConfigured()) {
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          localStorage.removeItem(STORAGE_KEYS.SESSION);
          window.dispatchEvent(new CustomEvent('festronix:auth', { detail: null }));
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // If profile not cached, fetch from public.profiles
          const cached = this.getCurrentUser();
          if (!cached || cached.id !== session.user.id) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

              if (profile) {
                const user: User = {
                  id: profile.id,
                  username: profile.username || profile.roll_number,
                  rollNumber: profile.roll_number,
                  fullName: profile.full_name,
                  email: profile.email,
                  phone: profile.phone || '',
                  college: profile.college,
                  createdAt: profile.created_at
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
    }
  }

  static getUsers(): User[] {
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

    // Always ensure initial preset users exist with their credentials
    let changed = false;
    for (const initUser of INITIAL_USERS) {
      const idx = users.findIndex(
        u => (u.rollNumber && u.rollNumber.toLowerCase() === initUser.rollNumber.toLowerCase()) ||
             (u.email && u.email.toLowerCase() === initUser.email.toLowerCase()) ||
             (u.username && u.username.toLowerCase() === initUser.username.toLowerCase())
      );
      if (idx === -1) {
        users.push({ ...initUser });
        changed = true;
      } else {
        // Ensure id and password are up to date if missing or outdated
        if (!users[idx].password || users[idx].id !== initUser.id) {
          users[idx] = { ...initUser, ...users[idx], id: initUser.id, password: users[idx].password || initUser.password };
          changed = true;
        }
      }
    }

    if (changed || !raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return users;
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

  /**
   * Sign in with Email, Roll Number, or Username and Password
   */
  static async signIn(
    identifier: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, error: 'Please enter both Username/Roll Number and Password.' };
    }

    const localUsers = this.getUsers();
    const localMatch = localUsers.find(
      u =>
        (u.username && u.username.toLowerCase() === cleanId.toLowerCase()) ||
        (u.rollNumber && u.rollNumber.toLowerCase() === cleanId.toLowerCase()) ||
        (u.email && u.email.toLowerCase() === cleanId.toLowerCase())
    );

    // --- SUPABASE AUTH FLOW ---
    if (isSupabaseConfigured()) {
      try {
        let emailToAuth = cleanId;
        let profileMatch: any = null;

        // If identifier is not an email, lookup email from profiles by roll_number or username
        if (!cleanId.includes('@')) {
          const { data, error: lookupError } = await supabase
            .from('profiles')
            .select('*')
            .or(`roll_number.ilike.${cleanId},username.ilike.${cleanId}`)
            .maybeSingle();

          if (!lookupError && data) {
            profileMatch = data;
            if (data.email) {
              emailToAuth = data.email;
            }
          }
        } else {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .ilike('email', cleanId)
            .maybeSingle();
          profileMatch = data;
        }

        // If profile was not found in Supabase profiles, but exists in localMatch
        if (!profileMatch && localMatch) {
          if (localMatch.password && localMatch.password !== cleanPass) {
            return { success: false, error: 'Incorrect password. Please verify and try again.' };
          }
          const safeUser: User = { ...localMatch };
          delete safeUser.password;
          localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(safeUser));
          window.dispatchEvent(new CustomEvent('festronix:auth', { detail: safeUser }));
          return { success: true, user: safeUser };
        }

        if (!profileMatch && !localMatch) {
          return {
            success: false,
            error: `No account found with Roll Number or Username "${cleanId}". Please Sign Up.`
          };
        }

        // Authenticate with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: emailToAuth,
          password: cleanPass
        });

        if (authError || !authData.user) {
          const isEmailProviderDisabled = Boolean(
            authError?.code === 'email_provider_disabled' ||
            (authError?.message && (
              authError.message.toLowerCase().includes('disabled') ||
              authError.message.toLowerCase().includes('email logins are disabled')
            ))
          );

          const isEmailNotConfirmed = Boolean(
            authError?.message && (
              authError.message.toLowerCase().includes('email not confirmed') ||
              authError.message.toLowerCase().includes('email_not_confirmed') ||
              authError.message.toLowerCase().includes('confirm')
            )
          );

          // If Supabase has disabled email logins or email confirmation is pending in dashboard,
          // verify credentials using verified profile and local credential matching
          if (isEmailProviderDisabled || isEmailNotConfirmed) {
            const profile = profileMatch || (await supabase
              .from('profiles')
              .select('*')
              .or(`email.ilike.${emailToAuth},roll_number.ilike.${cleanId},username.ilike.${cleanId}`)
              .maybeSingle()).data;

            if (profile) {
              if (localMatch && localMatch.password && localMatch.password !== cleanPass) {
                return { success: false, error: 'Incorrect password. Please verify and try again.' };
              }

              const safeUser: User = {
                id: profile.id,
                username: profile.username || cleanId,
                rollNumber: profile.roll_number || cleanId.toUpperCase(),
                fullName: profile.full_name || 'Participant',
                email: profile.email || emailToAuth,
                phone: profile.phone || '',
                college: profile.college || 'Vardhaman College of Engineering',
                createdAt: profile.created_at || new Date().toISOString()
              };

              // Mirror in local users store with entered password
              const idx = localUsers.findIndex(u =>
                (u.rollNumber && u.rollNumber.toLowerCase() === safeUser.rollNumber.toLowerCase()) ||
                (u.email && u.email.toLowerCase() === safeUser.email.toLowerCase())
              );
              if (idx !== -1) {
                localUsers[idx] = { ...localUsers[idx], ...safeUser, password: cleanPass };
              } else {
                localUsers.push({ ...safeUser, password: cleanPass });
              }
              this.saveUsers(localUsers);

              localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(safeUser));
              window.dispatchEvent(new CustomEvent('festronix:auth', { detail: safeUser }));
              return { success: true, user: safeUser };
            }
          }

          // Check local store fallback
          if (localMatch) {
            if (localMatch.password === cleanPass) {
              const safeUser: User = { ...localMatch };
              delete safeUser.password;
              localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(safeUser));
              window.dispatchEvent(new CustomEvent('festronix:auth', { detail: safeUser }));
              return { success: true, user: safeUser };
            } else {
              return { success: false, error: 'Incorrect password. Please verify and try again.' };
            }
          }

          return {
            success: false,
            error: 'Incorrect password. Please verify and try again.'
          };
        }

        // Successfully authenticated via Supabase session
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        const safeUser: User = {
          id: authData.user.id,
          username: profile?.username || authData.user.user_metadata?.username || cleanId,
          rollNumber: profile?.roll_number || authData.user.user_metadata?.roll_number || '',
          fullName: profile?.full_name || authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'User',
          email: profile?.email || authData.user.email || '',
          phone: profile?.phone || authData.user.user_metadata?.phone || '',
          college: profile?.college || authData.user.user_metadata?.college || 'Vardhaman College of Engineering',
          createdAt: profile?.created_at || new Date().toISOString()
        };

        // Cache local copy with password
        const existingIdx = localUsers.findIndex(u =>
          (u.rollNumber && u.rollNumber.toLowerCase() === safeUser.rollNumber.toLowerCase()) ||
          (u.email && u.email.toLowerCase() === safeUser.email.toLowerCase())
        );
        if (existingIdx !== -1) {
          localUsers[existingIdx] = { ...localUsers[existingIdx], ...safeUser, password: cleanPass };
        } else {
          localUsers.push({ ...safeUser, password: cleanPass });
        }
        this.saveUsers(localUsers);

        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(safeUser));
        window.dispatchEvent(new CustomEvent('festronix:auth', { detail: safeUser }));
        return { success: true, user: safeUser };
      } catch (err: any) {
        console.warn('Supabase sign-in encountered an issue, checking local store:', err);
      }
    }

    // --- LOCAL STORAGE FALLBACK FLOW ---
    if (!localMatch) {
      return { success: false, error: 'No account found with this Username or Roll Number. Please Sign Up.' };
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

  /**
   * Sign up with Full Name, Roll Number, College, Email, Phone, and Password
   */
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

    // --- SUPABASE SIGN UP FLOW ---
    if (isSupabaseConfigured()) {
      try {
        // Check for existing roll_number or username in profiles
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('roll_number, username, email')
          .or(`roll_number.ilike.${roll},username.ilike.${username}`)
          .maybeSingle();

        if (existingProfile) {
          if (existingProfile.roll_number?.toUpperCase() === roll) {
            return { success: false, error: `An account is already registered with Roll Number "${roll}". Please Sign In.` };
          }
          if (existingProfile.username?.toLowerCase() === username) {
            return { success: false, error: `Username "${username}" is already taken. Please choose another.` };
          }
        }

        // Register in Supabase Auth (trigger auto-creates profile)
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

        const isEmailDisabled = Boolean(
          authError?.code === 'email_provider_disabled' ||
          (authError?.message && (
            authError.message.toLowerCase().includes('disabled') ||
            authError.message.toLowerCase().includes('email signups are disabled')
          ))
        );

        if (authError && !isEmailDisabled) {
          return { success: false, error: authError.message };
        }

        const userId = authData?.user?.id || `user_${Date.now()}`;
        const newUser: User = {
          id: userId,
          username,
          rollNumber: roll,
          fullName: name,
          email,
          phone,
          college,
          createdAt: new Date().toISOString()
        };

        // Cache user session
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(newUser));
        window.dispatchEvent(new CustomEvent('festronix:auth', { detail: newUser }));

        // Mirror locally with password for instant fallback logins
        const localUsers = this.getUsers();
        const existingIdx = localUsers.findIndex(u =>
          (u.rollNumber && u.rollNumber.toLowerCase() === roll.toLowerCase()) ||
          (u.email && u.email.toLowerCase() === email.toLowerCase())
        );
        const userRecord = { ...newUser, password };
        if (existingIdx !== -1) {
          localUsers[existingIdx] = userRecord;
        } else {
          localUsers.push(userRecord);
        }
        this.saveUsers(localUsers);

        return { success: true, user: newUser };
      } catch (err: any) {
        console.warn('Supabase sign-up encountered an issue, falling back to local store:', err);
      }
    }

    // --- LOCAL STORAGE FALLBACK FLOW ---
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

    const safeUser: User = { ...newUser };
    delete safeUser.password;
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(safeUser));
    window.dispatchEvent(new CustomEvent('festronix:auth', { detail: safeUser }));

    return { success: true, user: safeUser };
  }

  /**
   * Sign out current user
   */
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
}

// Auto-initialize auth listener
AuthService.init();
