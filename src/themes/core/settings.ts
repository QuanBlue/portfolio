import type { PortfolioData } from '../../data/portfolio';
import { DEFAULT_THEME_ID, hasTheme } from './registry';
import type { AppearanceSettings, ThemeId } from './types';

export const APPEARANCE_STORAGE_KEY = 'user-theme-variant';
export const THEME_CACHE_KEY = 'portfolio-published-theme';

/**
 * Extracts appearance settings safely from PortfolioData,
 * supporting both modern `data.appearance` and legacy `data.identity.themeVariant`.
 */
export function extractAppearance(
  data?: Partial<PortfolioData> | null,
): AppearanceSettings {
  const legacyVariant = data?.identity?.themeVariant;
  const modernTheme = data?.appearance?.activeTheme;
  const activeCandidate = modernTheme || legacyVariant;

  const validTheme: ThemeId =
    activeCandidate && hasTheme(activeCandidate)
      ? (activeCandidate as ThemeId)
      : DEFAULT_THEME_ID;

  return {
    activeTheme: validTheme,
    colorMode: 'dark',
  };
}

/**
 * Merges updated appearance settings into PortfolioData without mutating other fields.
 */
export function applyAppearance(
  data: PortfolioData,
  settings: Partial<AppearanceSettings>,
): PortfolioData {
  const next = structuredClone(data);
  if (settings.activeTheme && hasTheme(settings.activeTheme)) {
    next.identity.themeVariant = settings.activeTheme;
    if (!next.appearance) {
      next.appearance = { activeTheme: settings.activeTheme, colorMode: 'dark' };
    } else {
      next.appearance.activeTheme = settings.activeTheme;
    }
  }
  return next;
}

/**
 * Saves the active theme identifier locally for user preference or preview.
 */
export function persistLocalTheme(themeId: ThemeId): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(THEME_CACHE_KEY, themeId);
    localStorage.setItem(APPEARANCE_STORAGE_KEY, themeId);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Retrieves the locally persisted theme, checking canonical cache then legacy key.
 */
export function getLocalTheme(): ThemeId | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const val = localStorage.getItem(THEME_CACHE_KEY) || localStorage.getItem(APPEARANCE_STORAGE_KEY);
    return val && hasTheme(val) ? (val as ThemeId) : null;
  } catch {
    return null;
  }
}

/**
 * Clears the local theme preference so the site reverts to published configuration.
 */
export function clearLocalTheme(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(THEME_CACHE_KEY);
    localStorage.removeItem(APPEARANCE_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
