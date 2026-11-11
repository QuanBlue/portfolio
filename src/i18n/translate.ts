/**
 * Localization Resolution & Translation Engine
 * Handles dictionary lookups and resolves database-driven multilingual content.
 */
import type { PortfolioData } from '../data/portfolio';
import { DEFAULT_LOCALE } from './config';
import { en } from './en';
import type { Locale, Translations } from './types';
import { vi } from './vi';

const DICTIONARIES: Record<Locale, Translations> = { en, vi };

/**
 * Returns the complete translations dictionary for the specified locale.
 */
export function getTranslations(locale: Locale = DEFAULT_LOCALE): Translations {
  return DICTIONARIES[locale] || DICTIONARIES[DEFAULT_LOCALE];
}

/**
 * Resolves a dotted translation path (e.g. 'nav.about') for the given locale.
 */
export function t(path: string, locale: Locale = DEFAULT_LOCALE): string {
  const dict = getTranslations(locale);
  const parts = path.split('.');
  let current: any = dict;

  for (const p of parts) {
    if (current && typeof current === 'object' && p in current) {
      current = current[p];
    } else {
      // Fallback to English dictionary
      let fallback: any = DICTIONARIES[DEFAULT_LOCALE];
      for (const fp of parts) {
        if (fallback && typeof fallback === 'object' && fp in fallback) {
          fallback = fallback[fp];
        } else {
          return path;
        }
      }
      return typeof fallback === 'string' ? fallback : path;
    }
  }

  return typeof current === 'string' ? current : path;
}

/**
 * Resolves a database-stored localized field on an object.
 * Checks for a locale-specific field (e.g. `role_vi`), or `{ en, vi }` object,
 * and safely falls back to English/base value without ever returning null or [object Object].
 */
export function resolveLocalized<T extends Record<string, any>>(
  item: T | null | undefined,
  field: string,
  locale: Locale = DEFAULT_LOCALE
): any {
  if (!item) return '';

  const raw = item[field];

  // Case 1: Value is an object with localized keys { en, vi }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw[locale] || raw[DEFAULT_LOCALE] || '';
  }

  // Case 2: Suffix property (e.g. field_vi)
  if (locale === 'vi') {
    const viKey = `${field}_vi`;
    const viVal = item[viKey];
    if (viVal !== undefined && viVal !== null && viVal !== '') {
      if (Array.isArray(viVal) && viVal.length > 0) return viVal;
      if (!Array.isArray(viVal)) return viVal;
    }
  }

  // Case 3: Fallback to base/English field
  return raw ?? '';
}

/**
 * Returns a cloned PortfolioData structure with all translatable fields
 * resolved to the target locale (with automatic fallback to English).
 */
export function localizePortfolioData(data: PortfolioData, locale: Locale = DEFAULT_LOCALE): PortfolioData {
  if (!data) return data;
  if (locale === DEFAULT_LOCALE) return data; // Default English requires no transformation

  const clone: PortfolioData = structuredClone(data);

  // 1. Identity
  if (clone.identity) {
    clone.identity.role = resolveLocalized(data.identity, 'role', locale) || data.identity.role;
    clone.identity.bio = resolveLocalized(data.identity, 'bio', locale) || data.identity.bio;
    if (data.identity.location) {
      clone.identity.location = resolveLocalized(data.identity, 'location', locale) || data.identity.location;
    }
  }

  // 2. Projects
  if (Array.isArray(clone.projects)) {
    clone.projects = data.projects.map((p) => ({
      ...p,
      title: resolveLocalized(p, 'title', locale) || p.title,
      shortDesc: resolveLocalized(p, 'shortDesc', locale) || p.shortDesc,
      description: resolveLocalized(p, 'description', locale) || p.description,
    }));
  }

  // 3. Experience
  if (Array.isArray(clone.experience)) {
    clone.experience = data.experience.map((exp) => ({
      ...exp,
      role: resolveLocalized(exp, 'role', locale) || exp.role,
      period: resolveLocalized(exp, 'period', locale) || exp.period,
      bullets: resolveLocalized(exp, 'bullets', locale) || exp.bullets,
    }));
  }

  // 4. Education
  if (Array.isArray(clone.education)) {
    clone.education = data.education.map((edu) => ({
      ...edu,
      degree: resolveLocalized(edu, 'degree', locale) || edu.degree,
      school: resolveLocalized(edu, 'school', locale) || edu.school,
      description: resolveLocalized(edu, 'description', locale) || edu.description,
      period: resolveLocalized(edu, 'period', locale) || edu.period,
    }));
  }

  // 5. Skills
  if (Array.isArray(clone.skills)) {
    clone.skills = data.skills.map((s) => ({
      ...s,
      category: resolveLocalized(s, 'category', locale) || s.category,
    }));
  }

  // 6. Certifications
  if (Array.isArray(clone.certifications)) {
    clone.certifications = data.certifications.map((c) => ({
      ...c,
      name: resolveLocalized(c, 'name', locale) || c.name,
    }));
  }

  // 7. Gallery
  if (Array.isArray(clone.gallery)) {
    clone.gallery = data.gallery.map((g) => ({
      ...g,
      title: resolveLocalized(g, 'title', locale) || g.title,
      description: resolveLocalized(g, 'description', locale) || g.description,
    }));
  }

  return clone;
}
