import type { Registration, Teammate } from '../types/festronix';

export interface DisplayMember {
  name: string;
  rollNumber: string;
}

export interface RegistrationDisplayGroup {
  key: string;
  registrations: Registration[];
  representative: Registration;
  isTeam: boolean;
  teamName?: string;
  teamCode?: string;
  displayId: string;
  memberCount: number;
  members: DisplayMember[];
  paymentStatus: string;
  allCheckedIn: boolean;
  anyCheckedIn: boolean;
}

function teamIdentity(registration: Registration): string | null {
  const code = String(registration.teamCode || '').trim().toUpperCase();
  if (code) return `code:${code}`;

  const name = String(registration.teamName || '').trim().toLowerCase();
  const isTeamFormat = registration.format === 'team' || registration.format === 'duo';
  if (name && (isTeamFormat || (registration.teammates?.length || 0) > 0)) {
    return `name:${registration.eventId}|${name}`;
  }
  return null;
}

function collectMembers(registrations: Registration[]): DisplayMember[] {
  const byKey = new Map<string, DisplayMember>();
  const add = (name: string, rollNumber: string) => {
    const cleanName = String(name || '').trim();
    const cleanRoll = String(rollNumber || '').trim().toUpperCase();
    if (!cleanName && !cleanRoll) return;
    const key = cleanRoll || cleanName.toLowerCase();
    if (!byKey.has(key)) byKey.set(key, { name: cleanName, rollNumber: cleanRoll });
  };

  registrations.forEach(registration => {
    add(registration.leaderName, registration.leaderRoll || registration.buyerRoll || '');
    (registration.teammates || []).forEach((teammate: Teammate) => add(teammate.name, teammate.rollNumber));
  });
  return [...byKey.values()];
}

/**
 * Collapses the per-member Firebase registration rows created for a squad into
 * one display row. Solo registrations remain unchanged. Raw registrations are
 * untouched so QR, check-in, and Razorpay accounting still operate per pass.
 */
export function groupRegistrationsForDisplay(registrations: Registration[]): RegistrationDisplayGroup[] {
  const grouped = new Map<string, Registration[]>();

  registrations.forEach(registration => {
    const identity = teamIdentity(registration);
    if (!identity) return;
    const rows = grouped.get(identity) || [];
    rows.push(registration);
    grouped.set(identity, rows);
  });

  return registrations.reduce<RegistrationDisplayGroup[]>((result, registration) => {
    const identity = teamIdentity(registration);
    if (!identity || result.some(group => group.key === identity)) return result;

    const rows = grouped.get(identity) || [registration];
    const statuses = [...new Set(rows.map(row => String(row.paymentStatus || '')))];
    const teamName = rows.find(row => row.teamName)?.teamName;
    const teamCode = rows.find(row => row.teamCode)?.teamCode;

    result.push({
      key: identity,
      registrations: rows,
      representative: rows[0],
      isTeam: rows.length > 1 || Boolean(teamName || teamCode),
      teamName,
      teamCode,
      displayId: teamCode || rows[0].id,
      memberCount: collectMembers(rows).length || rows.length,
      members: collectMembers(rows),
      paymentStatus: statuses.length === 1 ? statuses[0] : 'mixed',
      allCheckedIn: rows.every(row => row.checkedIn),
      anyCheckedIn: rows.some(row => row.checkedIn),
    });
    return result;
  }, []);
}
