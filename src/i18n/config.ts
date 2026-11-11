import type { Locale } from './types';

export const DEFAULT_LOCALE: Locale = 'en';
export const SUPPORTED_LOCALES: Locale[] = ['en', 'vi'];
export const LOCALE_STORAGE_KEY = 'portfolio-locale';

export const LOCALE_LABELS: Record<Locale, { short: string; full: string; flag: string }> = {
  en: { short: 'EN', full: 'English', flag: '🇬🇧' },
  vi: { short: 'VI', full: 'Tiếng Việt', flag: '🇻🇳' },
};

export function isSupportedLocale(locale: unknown): locale is Locale {
  return typeof locale === 'string' && SUPPORTED_LOCALES.includes(locale as Locale);
}
