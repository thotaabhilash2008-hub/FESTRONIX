import type { SponsorProfile, SponsorDeliverable } from '../components/partners/partnerData';
import { firebaseApp } from '../lib/firebase';
import { callFirebaseCallable } from './firebaseFunctionClient';

async function call<T>(name: string, data: Record<string, unknown> = {}): Promise<T> {
  if (!firebaseApp) throw new Error('Firebase sponsor services are not configured.');
  try {
    return await callFirebaseCallable<T>(name, data);
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    const message = error instanceof Error ? error.message : 'Firebase could not complete this sponsor operation.';
    if (code.includes('unauthenticated')) throw new Error('Your staff session has expired. Sign in again.');
    if (code.includes('permission-denied')) throw new Error('Only central administrators can manage sponsor records.');
    if (code.includes('invalid-argument') || code.includes('failed-precondition') || code.includes('already-exists') || code.includes('not-found')) {
      throw new Error(message);
    }
    throw new Error('Firebase could not complete the sponsor operation. Please retry.');
  }
}

function mapSponsor(value: Record<string, unknown>): SponsorProfile {
  const metrics = value.metrics && typeof value.metrics === 'object' ? value.metrics as Record<string, unknown> : {};
  const deliverables = Array.isArray(value.deliverables) ? value.deliverables : [];
  return {
    id: String(value.id || ''),
    companyName: String(value.companyName || ''),
    tagline: String(value.tagline || ''),
    tier: value.tier as SponsorProfile['tier'],
    tierBadgeColor: String(value.tierBadgeColor || '#38BDF8'),
    logo: String(value.logo || ''),
    website: String(value.website || ''),
    pocName: String(value.pocName || ''),
    pocRole: String(value.pocRole || ''),
    pocContact: String(value.pocContact || ''),
    pocEmail: String(value.pocEmail || ''),
    sacLeadName: String(value.sacLeadName || ''),
    sacLeadContact: String(value.sacLeadContact || ''),
    stallLocation: String(value.stallLocation || ''),
    stallNumber: String(value.stallNumber || ''),
    mouStatus: (value.mouStatus || 'Under Review') as SponsorProfile['mouStatus'],
    invoiceStatus: (value.invoiceStatus || 'Processing') as SponsorProfile['invoiceStatus'],
    deliverables: deliverables.map((entry: any): SponsorDeliverable => ({
      id: String(entry?.id || ''),
      title: String(entry?.title || ''),
      category: entry?.category as SponsorDeliverable['category'],
      status: entry?.status as SponsorDeliverable['status'],
      description: String(entry?.description || ''),
      dueDate: String(entry?.dueDate || ''),
      location: entry?.location ? String(entry.location) : undefined,
    })),
    about: typeof value.about === 'string' ? value.about : undefined,
    headquarters: typeof value.headquarters === 'string' ? value.headquarters : undefined,
    awardHighlight: typeof value.awardHighlight === 'string' ? value.awardHighlight : undefined,
    keyProjects: Array.isArray(value.keyProjects) ? value.keyProjects.filter((item): item is string => typeof item === 'string') : undefined,
    metrics: {
      stageKeynoteTime: String(metrics.stageKeynoteTime || ''),
      brandedBannersAllocated: Number(metrics.brandedBannersAllocated) || 0,
      vipLoungePasses: Number(metrics.vipLoungePasses) || 0,
      estimatedReach: String(metrics.estimatedReach || ''),
      impressionsCount: String(metrics.impressionsCount || ''),
    },
  };
}

export const FirebaseSponsorService = {
  async listPublic(): Promise<SponsorProfile[]> {
    const result = await call<{ sponsors: Array<Record<string, unknown>> }>('listPublicSponsorProfiles');
    return Array.isArray(result.sponsors) ? result.sponsors.map(mapSponsor) : [];
  },

  async listStaff(): Promise<SponsorProfile[]> {
    const result = await call<{ sponsors: Array<Record<string, unknown>> }>('manageSponsorProfile', { action: 'list' });
    return Array.isArray(result.sponsors) ? result.sponsors.map(mapSponsor) : [];
  },

  async create(sponsor: SponsorProfile): Promise<SponsorProfile> {
    const result = await call<{ sponsor: Record<string, unknown> }>('manageSponsorProfile', { action: 'create', sponsor });
    return mapSponsor(result.sponsor);
  },

  async update(id: string, sponsor: SponsorProfile): Promise<SponsorProfile> {
    const result = await call<{ sponsor: Record<string, unknown> }>('manageSponsorProfile', { action: 'update', id, sponsor });
    return mapSponsor(result.sponsor);
  },

  async delete(id: string): Promise<void> {
    await call<{ success: boolean }>('manageSponsorProfile', { action: 'delete', id });
  },

  async reset(sponsors: SponsorProfile[]): Promise<void> {
    await call<{ success: boolean }>('manageSponsorProfile', { action: 'reset', sponsors });
  },
};
