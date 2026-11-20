export type FirestoreEvent = Record<string, unknown> & { id?: unknown };
export type StaffRole = {
  role?: unknown;
  department_code?: unknown;
  cluster_code?: unknown;
  active?: unknown;
};

const GLOBAL_ROLES = new Set(['super_admin', 'dean_sac', 'connect_club', 'vencorpia']);
const DEPARTMENT_ROLES = new Set(['dept_chief_coordinator', 'dept_coordinator']);
const EVENT_ROLES = new Set(['event_coordinator', 'faculty_coord', 'student_coord']);
const ASSIGNED_OPERATIONS_ROLES = new Set(['volunteer_checkin', 'checkin_staff']);

function cleanCode(value: unknown): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function cleanString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function finiteNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function canReadStaffEvent(
  role: StaffRole,
  eventId: string,
  event: FirestoreEvent,
  assignedEventIds: ReadonlySet<string>,
): boolean {
  if (role.active !== true || event.is_deleted === true || Boolean(event.deleted_at)) return false;

  const roleName = typeof role.role === 'string' ? role.role : '';
  if (GLOBAL_ROLES.has(roleName) || roleName === 'finance_reviewer') return true;

  if (ASSIGNED_OPERATIONS_ROLES.has(roleName)) return assignedEventIds.has(eventId);

  const departmentCode = cleanCode(event.department_code);
  const roleDepartment = cleanCode(role.department_code);
  if (!departmentCode || roleDepartment !== departmentCode) return false;

  const roleCluster = cleanCode(role.cluster_code);
  const eventCluster = cleanCode(event.cluster_code);
  if (roleCluster && roleCluster !== eventCluster) return false;

  if (DEPARTMENT_ROLES.has(roleName)) return true;
  return EVENT_ROLES.has(roleName) && assignedEventIds.has(eventId);
}

/** Maps a private Firestore event document to the frontend event contract. */
export function toStaffEvent(eventId: string, event: FirestoreEvent) {
  const prizes = event.prizes && typeof event.prizes === 'object' && !Array.isArray(event.prizes)
    ? event.prizes as Record<string, unknown>
    : {};
  const faqs = Array.isArray(event.faqs)
    ? event.faqs.filter((item): item is { question: string; answer: string } =>
      Boolean(item) && typeof item === 'object' &&
      typeof (item as Record<string, unknown>).question === 'string' &&
      typeof (item as Record<string, unknown>).answer === 'string')
    : [];

  return {
    id: eventId,
    slug: cleanString(event.slug),
    title: cleanString(event.title),
    tagline: cleanString(event.tagline) || undefined,
    departmentId: cleanString(event.department_id),
    departmentCode: cleanString(event.department_code),
    clusterCode: cleanString(event.cluster_code) || undefined,
    category: cleanString(event.category),
    format: cleanString(event.format),
    minTeamSize: finiteNumber(event.min_team_size, 1),
    maxTeamSize: finiteNumber(event.max_team_size, 1),
    fee: finiteNumber(event.fee),
    capacity: finiteNumber(event.capacity),
    registeredCount: finiteNumber(event.registered_count),
    deadline: cleanString(event.deadline),
    date: cleanString(event.date_display),
    time: cleanString(event.time_display),
    venue: cleanString(event.venue),
    description: cleanString(event.description),
    rules: Array.isArray(event.rules) ? event.rules.filter((value): value is string => typeof value === 'string') : [],
    prizes: {
      first: cleanString(prizes.first, 'Trophy'),
      ...(typeof prizes.second === 'string' ? { second: prizes.second } : {}),
      ...(typeof prizes.third === 'string' ? { third: prizes.third } : {}),
      ...(typeof prizes.special === 'string' ? { special: prizes.special } : {}),
    },
    eligibility: cleanString(event.eligibility) || undefined,
    coordinatorName: cleanString(event.coordinator_name),
    coordinatorPhone: cleanString(event.coordinator_phone),
    coordinatorEmail: cleanString(event.coordinator_email),
    status: cleanString(event.status),
    bannerGradient: cleanString(event.banner_gradient) || undefined,
    paymentInstructions: cleanString(event.payment_instructions) || undefined,
    whatsappGroupLink: cleanString(event.whatsapp_group_link) || undefined,
    faqs,
    approvalStatus: cleanString(event.approval_status),
  };
}
