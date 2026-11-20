import type { Team } from '../types/festronix';
import { firebaseApp } from '../lib/firebase';
import { callFirebaseCallable } from './firebaseFunctionClient';

async function call<T>(name: string, data: Record<string, unknown>): Promise<T> {
  try {
    if (!firebaseApp) throw new Error('Firebase team services are not configured.');
    return await callFirebaseCallable<T>(name, data);
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    const message = error instanceof Error ? error.message : 'The Firebase team operation failed.';
    if (code.includes('resource-exhausted') || code.includes('failed-precondition') || code.includes('invalid-argument') ||
        code.includes('already-exists') || code.includes('not-found') || code.includes('permission-denied')) {
      throw new Error(message);
    }
    throw new Error('Firebase could not complete this team operation. Please retry.');
  }
}

export const FirebaseTeamService = {
  async find(teamCode: string, eventId?: string): Promise<{ team: Team | null; error?: string }> {
    const result = await call<{ success: boolean; team?: Team; error?: string }>('findPublicTeam', { teamCode, eventId });
    return result.success && result.team ? { team: result.team } : { team: null, error: result.error || 'Team not found.' };
  },

  async dashboard(teamCode: string, eventId?: string): Promise<Team | null> {
    const result = await call<{ success: boolean; team?: Team; error?: string }>('findPublicTeam', { teamCode, eventId });
    return result.success ? result.team || null : null;
  },

  async listStaffTeams(eventIds?: string[]): Promise<Array<Record<string, unknown>>> {
    const result = await call<{ teams: Array<Record<string, unknown>> }>('listStaffTeams', eventIds ? { eventIds } : {});
    return Array.isArray(result.teams) ? result.teams : [];
  },
};
