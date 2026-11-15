import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.118.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const GLOBAL_ROLES = new Set(['super_admin', 'dean_sac', 'connect_club', 'vencorpia']);
const DEPARTMENT_ROLES = new Set(['dept_chief_coordinator', 'dept_coordinator']);
const EVENT_ROLES = new Set(['event_coordinator', 'faculty_coord', 'student_coord']);
const OPERATIONS_ROLES = new Set(['finance_reviewer', 'volunteer_checkin', 'checkin_staff']);

type AdminRoleRow = {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  designation: string | null;
  department_code: string | null;
  cluster_code: string | null;
  access_boundary: string | null;
  active: boolean;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function canonicalRole(role: string): string {
  return role === 'dept_chief_coordinator' ? 'dept_coordinator' : role;
}

function cleanIdentifier(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Enter your username or email and password.');
  const valueTrimmed = value.trim().toLowerCase();
  if (!valueTrimmed || valueTrimmed.length > 254) throw new Error('Enter your username or email and password.');
  return valueTrimmed;
}

function cleanDepartment(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  return value.trim().toUpperCase();
}

function cleanCluster(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const cluster = value.trim().toUpperCase();
  return ['CSE-1', 'CSE-2', 'CSE-3'].includes(cluster) ? cluster : undefined;
}

function roleMatchesPortal(row: AdminRoleRow, portal: string, departmentCode?: string, clusterCode?: string): boolean {
  const role = row.role;
  const sameDepartment = !departmentCode || row.department_code?.toUpperCase() === departmentCode;
  const sameCluster = !clusterCode || row.cluster_code?.toUpperCase() === clusterCode;
  const scopedToRequestedDepartment = sameDepartment && sameCluster;
  if (portal === 'auto') return true;
  if (portal === 'department') return scopedToRequestedDepartment && DEPARTMENT_ROLES.has(role);
  if (portal === 'event') return scopedToRequestedDepartment && EVENT_ROLES.has(role);
  if (portal === 'central') return GLOBAL_ROLES.has(role) || OPERATIONS_ROLES.has(role);
  return false;
}

function toUser(row: AdminRoleRow, assignedEvents: string[]) {
  return {
    id: row.user_id,
    username: row.username,
    fullName: row.full_name,
    designation: row.designation || 'Administrator',
    role: canonicalRole(row.role),
    departmentCode: row.department_code || undefined,
    clusterCode: row.cluster_code || undefined,
    email: row.email,
    phone: row.phone || undefined,
    accessBoundary: row.access_boundary || undefined,
    assignedEvents
  };
}

async function assignedEvents(db: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await db
    .from('admin_event_assignments')
    .select('event_id')
    .eq('admin_user_id', userId);
  if (error) throw error;
  return (data || []).map(item => item.event_id).filter((id): id is string => typeof id === 'string');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'The request body must be valid JSON.' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || serviceRoleKey;
  if (!supabaseUrl || !serviceRoleKey || !anonKey) return json({ error: 'Admin authentication is not configured.' }, 500);

  try {
    const identifier = cleanIdentifier(body.identifier);
    const password = typeof body.password === 'string' ? body.password : '';
    if (!password) throw new Error('Enter your username or email and password.');

    const portal = typeof body.portal === 'string' ? body.portal : 'central';
    if (!['auto', 'central', 'department', 'event'].includes(portal)) return json({ error: 'The requested portal is not supported.' }, 400);
    const departmentCode = cleanDepartment(body.departmentCode);
    const clusterCode = cleanCluster(body.clusterCode);
    const eventId = typeof body.eventId === 'string' && body.eventId.trim() ? body.eventId.trim() : undefined;

    const db = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const roleQuery = db.from('admin_roles').select('*').eq('active', true).limit(1);
    const { data: roleRow, error: roleError } = identifier.includes('@')
      ? await roleQuery.eq('email', identifier).maybeSingle()
      : await roleQuery.eq('username', identifier).maybeSingle();
    if (roleError) throw roleError;
    if (!roleRow) return json({ error: 'Invalid login credentials.' }, 401);

    const auth = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: authData, error: authError } = await auth.auth.signInWithPassword({
      email: roleRow.email,
      password
    });
    if (authError || !authData.user || !authData.session) return json({ error: 'Invalid login credentials.' }, 401);

    // RLS authorizes the authenticated Supabase UUID, while older staff rows
    // were sometimes created before that UUID was stored in admin_roles. Link
    // only the role selected by the verified credentials, and only when this
    // Auth account does not already own another active role. This repairs a
    // stale identity without granting cross-department or cross-cluster access.
    const { data: currentIdentityRoles, error: identityRolesError } = await db
      .from('admin_roles')
      .select('id')
      .eq('user_id', authData.user.id)
      .eq('active', true);
    if (identityRolesError) throw identityRolesError;

    if (!currentIdentityRoles || currentIdentityRoles.length === 0) {
      const { error: linkError } = await db
        .from('admin_roles')
        .update({
          user_id: authData.user.id,
          email: (authData.user.email || roleRow.email).trim().toLowerCase()
        })
        .eq('id', roleRow.id)
        .eq('active', true);
      if (linkError) {
        console.error('Could not reconcile admin role to Auth user:', linkError.message);
        return json({ error: 'This staff account is not linked to its Supabase Auth identity. Ask an administrator to reconcile the role.' }, 409);
      }
    }

    const { data: allRoles, error: allRolesError } = await db
      .from('admin_roles')
      .select('*')
      .eq('user_id', authData.user.id)
      .eq('active', true);
    if (allRolesError) throw allRolesError;

    const matchingRoles = ((allRoles || []) as AdminRoleRow[]).filter(row => roleMatchesPortal(row, portal, departmentCode, clusterCode));
    if (matchingRoles.length === 0) {
      return json({ error: 'This account is not authorized for the selected portal or department.' }, 403);
    }

    const selected = matchingRoles[0];
    const events = await assignedEvents(db, authData.user.id);
    if (portal === 'event' && eventId && !events.includes(eventId)) {
      return json({ error: 'This coordinator is not assigned to the selected event.' }, 403);
    }

    return json({
      user: toUser(selected, events),
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token
      }
    });
  } catch (error) {
    console.error('Admin authentication error:', error instanceof Error ? error.message : 'unknown error');
    return json({ error: error instanceof Error ? error.message : 'Unable to authenticate this account.' }, 400);
  }
});
