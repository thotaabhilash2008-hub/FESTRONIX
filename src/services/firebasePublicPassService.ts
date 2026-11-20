import { firebaseApp } from '../lib/firebase';
import { callFirebaseHttp } from './firebaseFunctionClient';
import type { Registration } from '../types/festronix';

export async function lookupFirebasePublicPasses(query: string): Promise<Registration[]> {
  if (!firebaseApp?.options.projectId) throw new Error('Firebase pass lookup is not configured.');
  const payload = await callFirebaseHttp<{
    success?: boolean;
    error?: string;
    registrations?: Registration[];
  }>('lookupPublicPasses', { query });
  if (!payload.success) {
    throw new Error(payload.error || 'Unable to look up passes right now.');
  }
  return Array.isArray(payload.registrations) ? payload.registrations : [];
}
