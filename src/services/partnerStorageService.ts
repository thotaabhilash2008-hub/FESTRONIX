import { SponsorProfile, SPONSOR_PROFILES } from '../components/partners/partnerData';

const STORAGE_KEY = 'festronix_sponsors_v1';

export class PartnerStorageService {
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
  }

  static deleteSponsor(id: string): void {
    const list = PartnerStorageService.getSponsors();
    const updated = list.filter(s => s.id !== id);
    PartnerStorageService.saveSponsors(updated);
  }

  static resetToDefaults(): void {
    PartnerStorageService.saveSponsors(SPONSOR_PROFILES);
  }
}
