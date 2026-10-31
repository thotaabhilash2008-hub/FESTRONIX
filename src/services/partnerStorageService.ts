import { SponsorProfile, SPONSOR_PROFILES } from '../components/partners/partnerData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const STORAGE_KEY = 'festronix_sponsors_v1';
const SPONSOR_TABLE = 'sponsor_profiles';

export class PartnerStorageService {
  private static realtimeInitialized = false;

  static initRealtime(): void {
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
    return {
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
      metrics: row.metrics || SPONSOR_PROFILES[0].metrics,
      deliverables: Array.isArray(row.deliverables) ? row.deliverables : []
    };
  }

  static async fetchSponsors(): Promise<SponsorProfile[]> {
    if (!isSupabaseConfigured()) return PartnerStorageService.getSponsors();
    const { data, error } = await (supabase as any)
      .from(SPONSOR_TABLE)
      .select('*')
      .order('company_name', { ascending: true });
    if (error) throw error;
    const databaseSponsors: SponsorProfile[] = (data || []).map((row: any) => PartnerStorageService.fromRow(row));
    const existingIds = new Set(databaseSponsors.map(sponsor => sponsor.id));
    const missingOfficialSponsors = SPONSOR_PROFILES.filter(sponsor => !existingIds.has(sponsor.id));
    const sponsors = [...databaseSponsors, ...missingOfficialSponsors];

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
    if (typeof window === 'undefined') return SPONSOR_PROFILES;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored sponsors:', e);
    }
    // Initialize with defaults if empty
    PartnerStorageService.saveSponsors(SPONSOR_PROFILES);
    return SPONSOR_PROFILES;
  }

  static saveSponsors(sponsors: SponsorProfile[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sponsors));
      window.dispatchEvent(new CustomEvent('festronix:sponsors-updated', { detail: sponsors }));
    } catch (e) {
      console.error('Failed to save sponsors:', e);
    }
  }

  static addSponsor(sponsor: SponsorProfile): void {
    const list = PartnerStorageService.getSponsors();
    const updated = [sponsor, ...list];
    PartnerStorageService.saveSponsors(updated);
    void PartnerStorageService.persistSponsor(sponsor).catch(error => console.error('Failed to persist sponsor:', error));
  }

  static updateSponsor(id: string, updates: Partial<SponsorProfile>): void {
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
    PartnerStorageService.saveSponsors(updated);
    const saved = updated.find(s => s.id === id);
    if (saved) void PartnerStorageService.persistSponsor(saved).catch(error => console.error('Failed to persist sponsor:', error));
  }

  static deleteSponsor(id: string): void {
    const list = PartnerStorageService.getSponsors();
    const updated = list.filter(s => s.id !== id);
    PartnerStorageService.saveSponsors(updated);
    void PartnerStorageService.deleteSponsorFromBackend(id).catch(error => console.error('Failed to delete sponsor:', error));
  }

  static resetToDefaults(): void {
    PartnerStorageService.saveSponsors(SPONSOR_PROFILES);
    if (isSupabaseConfigured()) {
      void (supabase as any).from(SPONSOR_TABLE).upsert(SPONSOR_PROFILES.map(PartnerStorageService.toRow))
        .then(({ error }: { error: any }) => { if (error) console.error('Failed to reset sponsors:', error); });
    }
  }
}
