import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, LOCALE_STORAGE_KEY } from '../src/i18n/config';
import { en } from '../src/i18n/en';
import { vi } from '../src/i18n/vi';
import { getTranslations, t, resolveLocalized, localizePortfolioData } from '../src/i18n/translate';
import { defaultPortfolioData } from '../src/data/portfolio';
import {
  renderKnightExperience,
  renderKnightEducation,
  renderKnightSkills,
} from '../src/themes/core/render-knight';

describe('Global i18n Architecture', () => {
  it('has English (en) as mandatory default locale', () => {
    expect(DEFAULT_LOCALE).toBe('en');
    expect(SUPPORTED_LOCALES).toEqual(['en', 'vi']);
    expect(LOCALE_STORAGE_KEY).toBe('portfolio-locale');
  });

  it('provides matching translation structures for English and Vietnamese', () => {
    const enKeys = Object.keys(en);
    const viKeys = Object.keys(vi);
    expect(enKeys).toEqual(viKeys);

    for (const section of enKeys) {
      const enSubKeys = Object.keys((en as any)[section]);
      const viSubKeys = Object.keys((vi as any)[section]);
      expect(enSubKeys).toEqual(viSubKeys);
    }
  });

  it('translates dotted dictionary paths with fallback', () => {
    expect(t('nav.about', 'en')).toBe('about');
    expect(t('nav.about', 'vi')).toBe('giới thiệu');
    expect(t('nav.experience', 'vi')).toBe('kinh nghiệm');
    expect(t('nav.education', 'vi')).toBe('học vấn');
    expect(t('nav.skills', 'vi')).toBe('kỹ năng');
    expect(t('nav.projects', 'vi')).toBe('dự án');
    expect(t('nav.contact', 'vi')).toBe('liên hệ');
    expect(t('nav.admin', 'vi')).toBe('quản trị');

    // Missing key returns path string without throwing
    expect(t('nonexistent.path', 'en')).toBe('nonexistent.path');
  });

  describe('Database Localized Fields Resolution (resolveLocalized)', () => {
    it('returns base English value when locale is en', () => {
      const item = {
        role: 'DevOps Engineer',
        role_vi: 'Kỹ sư DevOps',
      };
      expect(resolveLocalized(item, 'role', 'en')).toBe('DevOps Engineer');
    });

    it('returns Vietnamese value when locale is vi', () => {
      const item = {
        role: 'DevOps Engineer',
        role_vi: 'Kỹ sư DevOps',
      };
      expect(resolveLocalized(item, 'role', 'vi')).toBe('Kỹ sư DevOps');
    });

    it('safely falls back to base English when Vietnamese field is empty or missing', () => {
      const itemMissing = {
        role: 'DevOps Engineer',
      };
      expect(resolveLocalized(itemMissing, 'role', 'vi')).toBe('DevOps Engineer');

      const itemEmpty = {
        role: 'DevOps Engineer',
        role_vi: '',
      };
      expect(resolveLocalized(itemEmpty, 'role', 'vi')).toBe('DevOps Engineer');

      const itemNull = {
        role: 'DevOps Engineer',
        role_vi: null,
      };
      expect(resolveLocalized(itemNull, 'role', 'vi')).toBe('DevOps Engineer');
    });

    it('correctly resolves and falls back for string arrays (e.g. bullets)', () => {
      const itemWithBoth = {
        bullets: ['English bullet 1', 'English bullet 2'],
        bullets_vi: ['Mục tiếng Việt 1', 'Mục tiếng Việt 2'],
      };
      expect(resolveLocalized(itemWithBoth, 'bullets', 'en')).toEqual(['English bullet 1', 'English bullet 2']);
      expect(resolveLocalized(itemWithBoth, 'bullets', 'vi')).toEqual(['Mục tiếng Việt 1', 'Mục tiếng Việt 2']);

      const itemWithEmptyViBullets = {
        bullets: ['English bullet 1'],
        bullets_vi: [],
      };
      expect(resolveLocalized(itemWithEmptyViBullets, 'bullets', 'vi')).toEqual(['English bullet 1']);
    });
  });

  describe('Full Portfolio Data Localization (localizePortfolioData)', () => {
    it('preserves English values in default en locale', () => {
      const localized = localizePortfolioData(defaultPortfolioData, 'en');
      expect(localized.identity.role).toBe('DevOps Engineer');
      expect(localized.identity.location).toBe('Ho Chi Minh, VN');
      expect(localized.experience[0].role).toBe('DevOps Engineer');
      expect(localized.experience[0].period).toBe('07/2025 ─ Present');
      expect(localized.education![0].degree).toBe('Bachelor Computer Network and Information Security');
    });

    it('translates all database sections to Vietnamese in vi locale', () => {
      const localized = localizePortfolioData(defaultPortfolioData, 'vi');
      expect(localized.identity.role).toBe('Kỹ sư DevOps');
      expect(localized.identity.location).toBe('TP. Hồ Chí Minh, VN');
      expect(localized.identity.bio).toContain('Nền tảng vững chắc về Linux');

      expect(localized.experience[0].role).toBe('Kỹ sư DevOps');
      expect(localized.experience[0].period).toBe('07/2025 ─ Hiện tại');
      expect(localized.experience[0].bullets[0]).toContain('Quản lý infrastructure sizing');

      expect(localized.education![0].degree).toBe('Cử nhân Mạng máy tính và An toàn thông tin');
      expect(localized.education![0].school).toBe('TRƯỜNG ĐẠI HỌC KHOA HỌC TỰ NHIÊN - ĐHQG-HCM');

      expect(localized.skills[0].category).toBe('Điện toán đám mây & Hạ tầng');
    });

    it('guarantees backward compatibility when database records have no translations', () => {
      const legacyData = {
        ...defaultPortfolioData,
        experience: [
          {
            id: 'legacy-job',
            role: 'Legacy SRE Lead',
            company: 'Old Corp',
            period: '2020 - 2022',
            isCurrent: false,
            bullets: ['Maintained K8s clusters'],
            tags: ['K8s'],
          },
        ],
      };
      const localized = localizePortfolioData(legacyData as any, 'vi');
      expect(localized.experience[0].role).toBe('Legacy SRE Lead');
      expect(localized.experience[0].bullets[0]).toBe('Maintained K8s clusters');
      expect(localized.experience[0].period).toBe('2020 - 2022');
      expect(localized.experience[0].role).not.toBeUndefined();
    });
  });

  describe('Knight Theme Bilingual Rendering', () => {
    it('renders Knight Experience with [CURRENT] in English and [HIỆN TẠI] in Vietnamese', () => {
      const enHtml = renderKnightExperience(defaultPortfolioData.experience, 'en');
      expect(enHtml).toContain('[CURRENT]');
      expect(enHtml).toContain('DevOps Engineer');

      const localizedVi = localizePortfolioData(defaultPortfolioData, 'vi');
      const viHtml = renderKnightExperience(localizedVi.experience, 'vi');
      expect(viHtml).toContain('[HIỆN TẠI]');
      expect(viHtml).toContain('Kỹ sư DevOps');
    });

    it('renders Knight empty states in the active language', () => {
      expect(renderKnightExperience([], 'en')).toContain('[ NO PUBLISHED EXPERIENCE ]');
      expect(renderKnightExperience([], 'vi')).toContain('[ CHƯA CÓ KINH NGHIỆM ĐĂNG TẢI ]');

      expect(renderKnightEducation([], [], 'en')).toContain('[ NO PUBLISHED EDUCATION ]');
      expect(renderKnightEducation([], [], 'vi')).toContain('[ CHƯA CÓ HỌC VẤN ĐĂNG TẢI ]');

      expect(renderKnightSkills([], 'en')).toContain('[ NO PUBLISHED SKILLS ]');
      expect(renderKnightSkills([], 'vi')).toContain('[ CHƯA CÓ KỸ NĂNG ĐĂNG TẢI ]');
    });

    it('renders Knight Education certifications title appropriately', () => {
      const certs = defaultPortfolioData.certifications;
      const enEdu = renderKnightEducation([], certs, 'en');
      expect(enEdu).toContain('CERTIFICATIONS');

      const viEdu = renderKnightEducation([], certs, 'vi');
      expect(viEdu).toContain('CHỨNG CHỈ NGHỀ NGHIỆP');
    });
  });
});
