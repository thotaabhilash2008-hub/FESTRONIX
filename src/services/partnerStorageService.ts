import { SponsorProfile, SPONSOR_PROFILES } from '../components/partners/partnerData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { isFirebaseConfigured } from '../lib/firebase';
import { FirebaseSponsorService } from './firebaseSponsorService';

const STORAGE_KEY = 'festronix_sponsors_v1';
const SPONSOR_TABLE = 'sponsor_profiles';
const PUBLIC_STORAGE_KEY = 'festronix_public_sponsors_firebase_staging_v1';

function sponsorStorageKey(): string {
  return isFirebaseConfigured ? 'festronix_sponsors_firebase_staging_private_v1' : STORAGE_KEY;
}

// Official brand assets must win over stale cached/DB logo paths.
const OFFICIAL_LOGO_PATHS: Record<string, string> = {
  vencorpia: '/vencorpia_logo.png'
};

export class PartnerStorageService {
  private static realtimeInitialized = false;

  private static withOfficialLogo(sponsor: SponsorProfile): SponsorProfile {
    const officialLogo = OFFICIAL_LOGO_PATHS[sponsor.id];
    return officialLogo ? { ...sponsor, logo: officialLogo } : sponsor;
  }

  static initRealtime(): void {
    if (isFirebaseConfigured) return;
    if (PartnerStorageService.realtimeInitialized || !isSupabaseConfigured()) return;
    PartnerStorageService.realtimeInitialized = true;
    try {
      supabase
        .channel('festronix_sponsors_live')
        .on('postgres_changes', { event: '*', schema: 'public', table: SPONSOR_TABLE }, () => {
          void PartnerStorageService.fetchSponsors().catch(error => console.warn('Sponsor realtime refresh failed:', error));
        })
        .subscribe();
    } catch (error) {
      console.warn('Sponsor realtime subscription error:', error);
    }
  }

  private static toRow(sponsor: SponsorProfile) {
    return {
      id: sponsor.id,
      company_name: sponsor.companyName,
      tagline: sponsor.tagline,
      tier: sponsor.tier,
      tier_badge_color: sponsor.tierBadgeColor,
      logo: sponsor.logo,
      website: sponsor.website,
      poc_name: sponsor.pocName,
      poc_role: sponsor.pocRole,
      poc_contact: sponsor.pocContact,
      poc_email: sponsor.pocEmail,
      sac_lead_name: sponsor.sacLeadName,
      sac_lead_contact: sponsor.sacLeadContact,
      stall_location: sponsor.stallLocation,
      stall_number: sponsor.stallNumber,
      mou_status: sponsor.mouStatus,
      invoice_status: sponsor.invoiceStatus,
      metrics: sponsor.metrics,
      deliverables: sponsor.deliverables
    };
  }

  private static fromRow(row: any): SponsorProfile {
    const fallbackProfile = SPONSOR_PROFILES.find(s => s.id === row.id);
    return PartnerStorageService.withOfficialLogo({
      id: row.id,
      companyName: row.company_name,
      tagline: row.tagline,
      tier: row.tier,
      tierBadgeColor: row.tier_badge_color,
      logo: row.logo,
      website: row.website,
      pocName: row.poc_name,
      pocRole: row.poc_role,
      pocContact: row.poc_contact,
      pocEmail: row.poc_email,
      sacLeadName: row.sac_lead_name,
      sacLeadContact: row.sac_lead_contact,
      stallLocation: row.stall_location,
      stallNumber: row.stall_number,
      mouStatus: row.mou_status,
      invoiceStatus: row.invoice_status,
      metrics: row.metrics || fallbackProfile?.metrics || SPONSOR_PROFILES[0].metrics,
      deliverables: Array.isArray(row.deliverables) && row.deliverables.length > 0 ? row.deliverables : (fallbackProfile?.deliverables || []),
      about: row.about || fallbackProfile?.about,
      headquarters: row.headquarters || fallbackProfile?.headquarters,
      awardHighlight: row.award_highlight || fallbackProfile?.awardHighlight,
      keyProjects: row.key_projects || fallbackProfile?.keyProjects
    });
  }

  static async fetchSponsors(): Promise<SponsorProfile[]> {
    if (isFirebaseConfigured) {
      const sponsors = await FirebaseSponsorService.listStaff();
      PartnerStorageService.saveSponsors(sponsors);
      return sponsors;
    }
    if (!isSupabaseConfigured()) return PartnerStorageService.getSponsors();
    const { data, error } = await (supabase as any)
      .from(SPONSOR_TABLE)
      .select('*')
      .order('company_name', { ascending: true });
    if (error) throw error;
    const databaseSponsors: SponsorProfile[] = (data || []).map((row: any) => PartnerStorageService.fromRow(row));
    const existingIds = new Set(databaseSponsors.map(sponsor => sponsor.id));
    const missingOfficialSponsors = SPONSOR_PROFILES.filter(sponsor => !existingIds.has(sponsor.id));
    const sponsors = [...databaseSponsors, ...missingOfficialSponsors]
      .map(sponsor => PartnerStorageService.withOfficialLogo(sponsor));

    if (sponsors.length > 0) {
      PartnerStorageService.saveSponsors(sponsors);
      if (missingOfficialSponsors.length > 0) {
        const { error: seedError } = await (supabase as any)
          .from(SPONSOR_TABLE)
          .upsert(missingOfficialSponsors.map(PartnerStorageService.toRow));
        if (seedError) console.warn('Official sponsor seed skipped:', seedError.message);
      }
      return sponsors;
    }

    const fallback = PartnerStorageService.getSponsors();
    return fallback;
  }

  static async fetchPublicSponsors(): Promise<SponsorProfile[]> {
    if (isFirebaseConfigured) {
      const sponsors = await FirebaseSponsorService.listPublic();
      PartnerStorageService.savePublicSponsors(sponsors);
      return sponsors;
    }
    return PartnerStorageService.fetchSponsors();
  }

  private static async persistSponsor(sponsor: SponsorProfile): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const { error } = await (supabase as any).from(SPONSOR_TABLE).upsert(PartnerStorageService.toRow(sponsor));
    if (error) throw error;
  }

  private static async deleteSponsorFromBackend(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const { error } = await (supabase as any).from(SPONSOR_TABLE).delete().eq('id', id);
    if (error) throw error;
  }
  static getSponsors(): SponsorProfile[] {
    if (typeof window === 'undefined') return isFirebaseConfigured ? [] : SPONSOR_PROFILES;
    if (isFirebaseConfigured) {
      try {
        const stored = localStorage.getItem(sponsorStorageKey());
        const parsed = stored ? JSON.parse(stored) : null;
        return Array.isArray(parsed) ? parsed as SponsorProfile[] : [];
      } catch (error) {
        console.warn('Failed to parse Firebase sponsor cache:', error);
        return [];
      }
    }
    const PURGE_FLAG = 'festronix_sponsors_demo_purged_v4';
    try {
      const stored = localStorage.getItem(sponsorStorageKey());
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter((s: any) => s && s.id !== 'cybercore');
          const isStale = localStorage.getItem(PURGE_FLAG) !== '1';
          const updated = cleaned.map((s: any) => {
            const def = SPONSOR_PROFILES.find(d => d.id === s.id);
            const normalized = PartnerStorageService.withOfficialLogo(s);
            if (def && isStale) {
              return {
                ...normalized,
                pocName: def.pocName,
                pocContact: def.pocContact,
                pocRole: def.pocRole || s.pocRole,
                about: def.about || s.about,
                headquarters: def.headquarters || s.headquarters,
                keyProjects: def.keyProjects || s.keyProjects,
                awardHighlight: def.awardHighlight || s.awardHighlight
              };
            }
            return normalized;
          });
          const existingIds = new Set(updated.map((s: any) => s?.id));
          const missingDefaults = SPONSOR_PROFILES.filter(s => !existingIds.has(s.id));
          if (missingDefaults.length > 0 || isStale) {
            const merged = [...updated, ...missingDefaults];
            localStorage.setItem(sponsorStorageKey(), JSON.stringify(merged));
            localStorage.setItem(PURGE_FLAG, '1');
            return merged;
          }
          return updated;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored sponsors:', e);
    }
    if (isFirebaseConfigured) return [];
    try {
      localStorage.setItem(PURGE_FLAG, '1');
    } catch {}
    // Initialize with defaults if empty
    PartnerStorageService.saveSponsors(SPONSOR_PROFILES);
    return SPONSOR_PROFILES;
  }

  static saveSponsors(sponsors: SponsorProfile[]): void {
    if (typeof window === 'undefined') return;
    const normalized = sponsors.map(sponsor => PartnerStorageService.withOfficialLogo(sponsor));
    try {
      localStorage.setItem(sponsorStorageKey(), JSON.stringify(normalized));
      window.dispatchEvent(new CustomEvent('festronix:sponsors-updated', { detail: normalized }));
    } catch (e) {
      console.error('Failed to save sponsors:', e);
    }
  }

  static getPublicSponsors(): SponsorProfile[] {
    if (typeof window === 'undefined') return isFirebaseConfigured ? [] : SPONSOR_PROFILES.filter(profile => profile.id !== 'connect_club');
    try {
      const stored = localStorage.getItem(isFirebaseConfigured ? PUBLIC_STORAGE_KEY : STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : null;
      if (Array.isArray(parsed)) return parsed as SponsorProfile[];
    } catch (error) {
      console.warn('Failed to parse public sponsor cache:', error);
    }
    return isFirebaseConfigured ? [] : SPONSOR_PROFILES.filter(profile => profile.id !== 'connect_club');
  }

  static savePublicSponsors(sponsors: SponsorProfile[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(isFirebaseConfigured ? PUBLIC_STORAGE_KEY : STORAGE_KEY, JSON.stringify(sponsors));
      window.dispatchEvent(new CustomEvent('festronix:sponsors-updated', { detail: sponsors }));
    } catch (error) {
      console.error('Failed to save public sponsors:', error);
    }
  }

  static async addSponsor(sponsor: SponsorProfile): Promise<SponsorProfile> {
    if (isFirebaseConfigured) {
      const created = await FirebaseSponsorService.create(sponsor);
      PartnerStorageService.saveSponsors([created, ...PartnerStorageService.getSponsors().filter(item => item.id !== created.id)]);
      return created;
    }
    const list = PartnerStorageService.getSponsors();
    const updated = [sponsor, ...list];
    PartnerStorageService.saveSponsors(updated);
    await PartnerStorageService.persistSponsor(sponsor);
    return sponsor;
  }

  static async updateSponsor(id: string, updates: Partial<SponsorProfile>): Promise<void> {
    const list = PartnerStorageService.getSponsors();
    const updated = list.map(s => {
      if (s.id === id) {
        return {
          ...s,
          ...updates,
          metrics: {
            ...s.metrics,
            ...(updates.metrics || {})
          }
        };
      }
      return s;
    });
    const saved = updated.find(s => s.id === id);
    if (!saved) throw new Error('Sponsor profile was not found.');
    if (isFirebaseConfigured) {
      const persisted = await FirebaseSponsorService.update(id, saved);
      PartnerStorageService.saveSponsors(updated.map(profile => profile.id === id ? persisted : profile));
      return;
    }
    await PartnerStorageService.persistSponsor(saved);
    PartnerStorageService.saveSponsors(updated);
  }

  static async deleteSponsor(id: string): Promise<void> {
    if (isFirebaseConfigured) {
      await FirebaseSponsorService.delete(id);
      PartnerStorageService.saveSponsors(PartnerStorageService.getSponsors().filter(sponsor => sponsor.id !== id));
      return;
    }
    const list = PartnerStorageService.getSponsors();
    const updated = list.filter(s => s.id !== id);
    await PartnerStorageService.deleteSponsorFromBackend(id);
    PartnerStorageService.saveSponsors(updated);
  }

  static async resetToDefaults(): Promise<void> {
    if (isFirebaseConfigured) {
      await FirebaseSponsorService.reset(SPONSOR_PROFILES);
      PartnerStorageService.saveSponsors(SPONSOR_PROFILES);
      return;
    }
    PartnerStorageService.saveSponsors(SPONSOR_PROFILES);
    if (isSupabaseConfigured()) {
      const { error } = await (supabase as any).from(SPONSOR_TABLE).upsert(SPONSOR_PROFILES.map(PartnerStorageService.toRow));
      if (error) throw error;
    }
  }
}
