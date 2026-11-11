/**
 * Central Client Locale Store & Event Dispatcher
 * Manages visitor language preference in localStorage and notifies active themes.
 */
import { DEFAULT_LOCALE, isSupportedLocale, LOCALE_STORAGE_KEY } from './config';
import type { Locale } from './types';

let currentLocale: Locale = DEFAULT_LOCALE;

/**
 * Initializes and retrieves the active visitor locale.
 * Priority: localStorage -> default (en).
 */
export function getLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && isSupportedLocale(stored)) {
      currentLocale = stored;
      return stored;
    }
  } catch {
    // Ignore storage access errors
  }

  currentLocale = DEFAULT_LOCALE;
  return DEFAULT_LOCALE;
}

/**
 * Sets the active visitor locale, synchronizes document attributes, and dispatches a global 'locale:changed' event.
 */
export function setLocale(locale: Locale, persist = true): void {
  if (!isSupportedLocale(locale)) return;

  currentLocale = locale;

  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
    document.documentElement.dataset.portfolioLocale = locale;

    // Update active states on any language buttons across the DOM
    document.querySelectorAll<HTMLElement>('[data-lang]').forEach((btn) => {
      const isActive = btn.dataset.lang === locale;
      btn.dataset.active = isActive ? 'true' : 'false';
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  if (typeof window !== 'undefined') {
    if (persist) {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      } catch {
        // Ignore storage access errors
      }
    }

    window.dispatchEvent(
      new CustomEvent('locale:changed', {
        detail: { locale },
      })
    );
  }
}

/**
 * Subscribes a listener to locale change events. Returns an unsubscribe function.
 */
export function subscribeLocale(callback: (locale: Locale) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.locale && isSupportedLocale(detail.locale)) {
      callback(detail.locale);
    }
  };

  window.addEventListener('locale:changed', handler);
  return () => window.removeEventListener('locale:changed', handler);
}
