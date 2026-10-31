import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.118.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const GLOBAL_ADMIN_ROLES = new Set(['super_admin', 'dean_sac', 'connect_club', 'vencorpia']);
const VALID_ADMIN_ROLES = new Set([
  ...GLOBAL_ADMIN_ROLES,
  'dept_chief_coordinator',
  'dept_coordinator',
  'event_coordinator',
  'faculty_coord',
  'student_coord',
  'finance_reviewer',
  'volunteer_checkin',
  'checkin_staff'
]);

type AdminRow = {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  designation: string | null;
  department_code: string | null;
  access_boundary: string | null;
  active: boolean;
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function requiredString(value: unknown, field: string, max = 200): string {
  if (typeof value !== 'string') throw new Error(`${field} is required.`);
  const clean = value.trim();
  if (!clean || clean.length > max) throw new Error(`${field} is required and must be under ${max} characters.`);
  return clean;
}

function normalizeRolePayload(raw: Record<string, unknown>) {
  const username = requiredString(raw.username, 'Username', 64).toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username)) throw new Error('Username must be 3–64 characters using letters, numbers, dots, underscores, or hyphens.');

  const email = requiredString(raw.email, 'Email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');

  const role = requiredString(raw.role, 'Role', 64);
  if (!VALID_ADMIN_ROLES.has(role)) throw new Error('The selected admin role is not supported.');

  const fullName = requiredString(raw.fullName, 'Full name');
  const designation = requiredString(raw.designation, 'Designation');
  const departmentCode = typeof raw.departmentCode === 'string' ? raw.departmentCode.trim().toUpperCase() : '';
  const departmentScoped = ['dept_chief_coordinator', 'dept_coordinator', 'event_coordinator', 'faculty_coord', 'student_coord'].includes(role);
  if (departmentScoped && !departmentCode) throw new Error('A department is required for this role.');

  const assignedEvents = Array.isArray(raw.assignedEvents)
    ? [...new Set(raw.assignedEvents.filter((item): item is string => typeof item === 'string' && item.length > 0))]
    : [];
  if (role !== 'event_coordinator' && role !== 'faculty_coord' && role !== 'student_coord' && assignedEvents.length > 0) {
    throw new Error('Event assignments are only valid for event coordinator roles.');
  }

  const password = typeof raw.password === 'string' && raw.password.trim() ? raw.password : undefined;
  if (password && password.length < 12) throw new Error('Initial passwords must be at least 12 characters.');

  return {
    username,
    email,
    role,
    fullName,
    designation,
    departmentCode: departmentScoped ? departmentCode : null,
    phone: typeof raw.phone === 'string' ? raw.phone.trim().slice(0, 40) : '',
    accessBoundary: typeof raw.accessBoundary === 'string' ? raw.accessBoundary.trim().slice(0, 240) : '',
    assignedEvents,
    password
  };
}

function toAdminUser(row: AdminRow, assignedEvents: string[] = []) {
  return {
    id: row.user_id,
    username: row.username,
    fullName: row.full_name,
    designation: row.designation || '',
    role: row.role,
    departmentCode: row.department_code || undefined,
    email: row.email,
    phone: row.phone || undefined,
    accessBoundary: row.access_boundary || undefined,
    assignedEvents
  };
}

async function getAssignments(db: SupabaseClient, userIds: string[]): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (userIds.length === 0) return result;

  const { data, error } = await db
    .from('admin_event_assignments')
    .select('admin_user_id,event_id')
    .in('admin_user_id', userIds);
  if (error) throw error;

  for (const item of data || []) {
    const values = result.get(item.admin_user_id) || [];
    values.push(item.event_id);
    result.set(item.admin_user_id, values);
  }
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return response({ error: 'Method not allowed.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY');
  if (!supabaseUrl || !serviceRoleKey) return response({ error: 'Admin service is not configured.' }, 500);

  const authorization = req.headers.get('Authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return response({ error: 'Sign in to continue.' }, 401);

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: userData, error: authError } = await db.auth.getUser(token);
  const caller = userData.user;
  if (authError || !caller) return response({ error: 'Your session is invalid or expired. Sign in again.' }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return response({ error: 'The request body must be valid JSON.' }, 400);
  }

  const action = typeof body.action === 'string' ? body.action : '';
  const { data: callerRoles, error: roleError } = await db
    .from('admin_roles')
    .select('role,active')
    .eq('user_id', caller.id);
  if (roleError) return response({ error: 'Unable to verify your admin role.' }, 500);

  const activeRoles = (callerRoles || []).filter(row => row.active).map(row => row.role as string);
  const isGlobalAdmin = activeRoles.some(role => GLOBAL_ADMIN_ROLES.has(role));

  if (action === 'me') {
    const { data, error } = await db.from('admin_roles').select('*').eq('user_id', caller.id).eq('active', true).limit(1).maybeSingle();
    if (error) return response({ error: 'Unable to load your admin profile.' }, 500);
    if (!data) return response({ error: 'No active admin role is assigned to this account.' }, 403);
    const assignments = await getAssignments(db, [caller.id]);
    return response(toAdminUser(data as AdminRow, assignments.get(caller.id) || []));
  }

  if (!isGlobalAdmin) return response({ error: 'Only super admins can manage admin accounts.' }, 403);

  try {
    if (action === 'list') {
      const { data, error } = await db.from('admin_roles').select('*').eq('active', true).order('created_at', { ascending: true });
      if (error) throw error;
      const rows = (data || []) as AdminRow[];
      const assignments = await getAssignments(db, rows.map(row => row.user_id));
      return response(rows.map(row => toAdminUser(row, assignments.get(row.user_id) || [])));
    }

    if (action === 'create') {
      const admin = normalizeRolePayload((body.admin || {}) as Record<string, unknown>);
      const { data: duplicateName, error: duplicateNameError } = await db.from('admin_roles').select('user_id').eq('username', admin.username).eq('active', true).maybeSingle();
      if (duplicateNameError) throw duplicateNameError;
      const { data: duplicateEmail, error: duplicateEmailError } = await db.from('admin_roles').select('user_id').eq('email', admin.email).eq('active', true).maybeSingle();
      if (duplicateEmailError) throw duplicateEmailError;
      if (duplicateName || duplicateEmail) throw new Error('That username or email is already assigned to an admin account.');

      if (admin.departmentCode) {
        const { data: department, error } = await db.from('departments').select('code').eq('code', admin.departmentCode).maybeSingle();
        if (error) throw error;
        if (!department) throw new Error('Select an existing department.');
      }

      if (admin.assignedEvents.length > 0) {
        const { data: events, error } = await db.from('events').select('id,department_code').in('id', admin.assignedEvents);
        if (error) throw error;
        if ((events || []).length !== admin.assignedEvents.length) throw new Error('One or more selected events no longer exist. Refresh and try again.');
        if (admin.departmentCode && (events || []).some(event => event.department_code !== admin.departmentCode)) {
          throw new Error('Event coordinators can only be assigned to events in their department.');
        }
      }

      const userMetadata = {
        full_name: admin.fullName,
        username: admin.username,
        roll_number: `ADMIN_${admin.username.toUpperCase()}`,
        phone: admin.phone,
        college: 'Vardhaman College of Engineering'
      };
      let createdUser: { id: string } | null = null;
      if (admin.password) {
        const { data, error } = await db.auth.admin.createUser({
          email: admin.email,
          password: admin.password,
          email_confirm: true,
          user_metadata: userMetadata
        });
        if (error) throw error;
        createdUser = data.user;
      } else {
        const { data, error } = await db.auth.admin.inviteUserByEmail(admin.email, { data: userMetadata });
        if (error) throw error;
        createdUser = data.user;
      }
      if (!createdUser) throw new Error('The authentication provider did not return the new account.');

      try {
        const { error: profileError } = await db.from('profiles').upsert({
          id: createdUser.id,
          full_name: admin.fullName,
          email: admin.email,
          phone: admin.phone,
          college: 'Vardhaman College of Engineering',
          roll_number: `ADMIN_${admin.username.toUpperCase()}`,
          username: admin.username
        }, { onConflict: 'id' });
        if (profileError) throw profileError;

        const { error: roleInsertError } = await db.from('admin_roles').insert({
          user_id: createdUser.id,
          username: admin.username,
          full_name: admin.fullName,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          department_code: admin.departmentCode,
          designation: admin.designation,
          access_boundary: admin.accessBoundary,
          active: true,
          granted_by: caller.id
        });
        if (roleInsertError) throw roleInsertError;

        if (admin.assignedEvents.length > 0) {
          const { error: assignmentError } = await db.from('admin_event_assignments').insert(
            admin.assignedEvents.map(eventId => ({ admin_user_id: createdUser!.id, event_id: eventId, granted_by: caller.id }))
          );
          if (assignmentError) throw assignmentError;
        }
      } catch (error) {
        await db.auth.admin.deleteUser(createdUser.id);
        throw error;
      }

      return response({ ...toAdminUser({
        id: createdUser.id,
        user_id: createdUser.id,
        username: admin.username,
        full_name: admin.fullName,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        designation: admin.designation,
        department_code: admin.departmentCode,
        access_boundary: admin.accessBoundary,
        active: true
      }, admin.assignedEvents), inviteSent: !admin.password });
    }

    if (action === 'update') {
      const id = requiredString(body.id, 'Admin id', 64);
      const { data: existing, error: existingError } = await db.from('admin_roles').select('*').eq('user_id', id).eq('active', true).maybeSingle();
      if (existingError) throw existingError;
      if (!existing) throw new Error('The admin account no longer exists or has already been disabled.');
      const incoming = (body.updates || {}) as Record<string, unknown>;
      const currentAssignments = await getAssignments(db, [id]);
      const nextRole = incoming.role ?? existing.role;
      const assignmentRoles = new Set(['event_coordinator', 'faculty_coord', 'student_coord']);
      const updates = normalizeRolePayload({
        username: incoming.username ?? (existing.username || `admin_${id.slice(0, 8)}`),
        email: incoming.email ?? existing.email,
        role: incoming.role ?? existing.role,
        fullName: incoming.fullName ?? (existing.full_name || existing.email?.split('@')[0] || `Admin ${id.slice(0, 8)}`),
        designation: incoming.designation ?? existing.designation ?? 'Administrator',
        departmentCode: incoming.departmentCode ?? existing.department_code ?? '',
        phone: incoming.phone ?? existing.phone ?? '',
        accessBoundary: incoming.accessBoundary ?? existing.access_boundary ?? '',
        assignedEvents: incoming.assignedEvents ?? (assignmentRoles.has(String(nextRole)) ? currentAssignments.get(id) ?? [] : []),
        password: incoming.password
      });

      const existingIsGlobal = GLOBAL_ADMIN_ROLES.has(existing.role);
      const updateIsGlobal = GLOBAL_ADMIN_ROLES.has(updates.role);
      if (existingIsGlobal && !updateIsGlobal) {
        const { count, error } = await db.from('admin_roles').select('id', { count: 'exact', head: true }).eq('active', true).in('role', [...GLOBAL_ADMIN_ROLES]);
        if (error) throw error;
        if ((count || 0) <= 1) throw new Error('The last active super admin cannot be demoted. Create another super admin first.');
      }

      const { data: duplicateName, error: duplicateNameError } = await db.from('admin_roles').select('user_id').eq('username', updates.username).eq('active', true).neq('user_id', id).maybeSingle();
      if (duplicateNameError) throw duplicateNameError;
      const { data: duplicateEmail, error: duplicateEmailError } = await db.from('admin_roles').select('user_id').eq('email', updates.email).eq('active', true).neq('user_id', id).maybeSingle();
      if (duplicateEmailError) throw duplicateEmailError;
      if (duplicateName || duplicateEmail) throw new Error('That username or email is already assigned to another admin account.');

      if (updates.departmentCode) {
        const { data: department, error } = await db.from('departments').select('code').eq('code', updates.departmentCode).maybeSingle();
        if (error) throw error;
        if (!department) throw new Error('Select an existing department.');
      }
      if (updates.assignedEvents.length > 0) {
        const { data: events, error } = await db.from('events').select('id,department_code').in('id', updates.assignedEvents);
        if (error) throw error;
        if ((events || []).length !== updates.assignedEvents.length) throw new Error('One or more selected events no longer exist.');
        if (updates.departmentCode && (events || []).some(event => event.department_code !== updates.departmentCode)) {
          throw new Error('Event coordinators can only be assigned to events in their department.');
        }
      }

      const authUpdates: Record<string, unknown> = { user_metadata: { full_name: updates.fullName, username: updates.username, phone: updates.phone } };
      if (updates.email) {
        authUpdates.email = updates.email;
        authUpdates.email_confirm = true;
      }
      if (updates.password) authUpdates.password = updates.password;
      if (updates.email || updates.password || authUpdates.user_metadata) {
        const { error } = await db.auth.admin.updateUserById(id, authUpdates as any);
        if (error) throw error;
      }

      const { error: profileError } = await db.from('profiles').update({
        full_name: updates.fullName,
        email: updates.email,
        phone: updates.phone,
        roll_number: `ADMIN_${updates.username.toUpperCase()}`,
        username: updates.username
      }).eq('id', id);
      if (profileError) throw profileError;

      const { error: roleUpdateError } = await db.from('admin_roles').update({
        username: updates.username,
        full_name: updates.fullName,
        email: updates.email,
        phone: updates.phone,
        role: updates.role,
        department_code: updates.departmentCode,
        designation: updates.designation,
        access_boundary: updates.accessBoundary
      }).eq('id', existing.id);
      if (roleUpdateError) throw roleUpdateError;

      const { error: clearError } = await db.from('admin_event_assignments').delete().eq('admin_user_id', id);
      if (clearError) throw clearError;
      if (updates.assignedEvents.length > 0) {
        const { error } = await db.from('admin_event_assignments').insert(
          updates.assignedEvents.map(eventId => ({ admin_user_id: id, event_id: eventId, granted_by: caller.id }))
        );
        if (error) throw error;
      }
      return response({ success: true });
    }

    if (action === 'delete') {
      const id = requiredString(body.id, 'Admin id', 64);
      if (id === caller.id) throw new Error('You cannot disable your own active account.');
      const { data: target, error } = await db.from('admin_roles').select('id,role').eq('user_id', id).eq('active', true).maybeSingle();
      if (error) throw error;
      if (!target) throw new Error('The admin account no longer exists or has already been disabled.');

      if (GLOBAL_ADMIN_ROLES.has(target.role)) {
        const { count, error: countError } = await db.from('admin_roles').select('id', { count: 'exact', head: true }).eq('active', true).in('role', [...GLOBAL_ADMIN_ROLES]);
        if (countError) throw countError;
        if ((count || 0) <= 1) throw new Error('The last active super admin cannot be disabled. Create another super admin first.');
      }

      const { error: authUpdateError } = await db.auth.admin.updateUserById(id, { ban_duration: '876000h' });
      if (authUpdateError) throw authUpdateError;
      const { error: roleError } = await db.from('admin_roles').update({ active: false }).eq('id', target.id);
      if (roleError) {
        await db.auth.admin.updateUserById(id, { ban_duration: 'none' });
        throw roleError;
      }
      const { error: assignmentError } = await db.from('admin_event_assignments').delete().eq('admin_user_id', id);
      if (assignmentError) throw assignmentError;
      return response({ success: true });
    }

    return response({ error: 'Unsupported admin action.' }, 400);
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : 'The admin request failed.' }, 400);
  }
});
