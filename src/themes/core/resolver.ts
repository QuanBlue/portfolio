import { DEFAULT_THEME_ID, getDefaultTheme, getTheme, hasTheme } from './registry';
import { THEME_CACHE_KEY, APPEARANCE_STORAGE_KEY, persistLocalTheme } from './settings';
import type { ResolvedTheme, ThemeDefinition, ThemeId } from './types';

export const ADMIN_PREVIEW_GRANT_KEY = 'portfolio-admin-preview-grant';

export interface PreviewAuthContext {
  isDev?: boolean;
  isSupabaseConfigured?: boolean;
  isOwnerSession?: boolean;
  hasLocalAdminGrant?: boolean;
}

/**
 * Authorizes `?preview=<themeId>` strictly for:
 * - Development (`isDev === true`), OR
 * - Authenticated Admin owner session when Supabase Auth is active, OR
 * - Explicit Local Mode Admin preview grant when Supabase is unconfigured.
 * Public production visitors and non-owner guests are denied.
 */
export function isThemePreviewAuthorized(ctx: PreviewAuthContext = {}): boolean {
  if (ctx.isDev) return true;
  if (ctx.isSupabaseConfigured) {
    return Boolean(ctx.isOwnerSession);
  }
  return Boolean(ctx.hasLocalAdminGrant);
}

/**
 * Resolves a given theme ID string to a registered ThemeDefinition.
 * If the ID is unknown or falsy, safely returns the default theme with `isFallback: true`.
 */
export function resolveTheme(
  targetId?: string | null,
  fallbackId: ThemeId = DEFAULT_THEME_ID,
): ResolvedTheme {
  if (targetId && hasTheme(targetId)) {
    const theme = getTheme(targetId)!;
    return {
      theme,
      isFallback: false,
      source: 'remote-settings',
    };
  }

  const fallback = getTheme(fallbackId) ?? getDefaultTheme();
  return {
    theme: fallback,
    isFallback: Boolean(targetId && targetId !== fallback.id),
    source: 'fallback',
  };
}

/**
 * Client-side theme determination following strict priority order:
 * 1. Explicit URL search param (`preview` or `theme`) ONLY when both `allowUrlParam` and `isPreviewAuthorized` are true.
 * 2. Canonical remote/published settings (`remoteTheme`). When provided, updates cached storage.
 * 3. Valid cached copy of published theme setting (`portfolio-published-theme` / `user-theme-variant`).
 * 4. Build-time default ('ascii').
 */
export function resolveClientTheme(options?: {
  allowUrlParam?: boolean;
  isPreviewAuthorized?: boolean;
  allowLocalStorage?: boolean;
  remoteTheme?: string | null;
}): ResolvedTheme {
  const allowUrl = Boolean(options?.allowUrlParam) && Boolean(options?.isPreviewAuthorized);
  const allowStorage = options?.allowLocalStorage ?? true;

  // 1. Authorized ephemeral preview param (does not mutate published cache)
  if (typeof window !== 'undefined' && allowUrl) {
    const params = new URLSearchParams(window.location.search);
    const urlTheme = params.get('preview') || params.get('theme');
    if (urlTheme && hasTheme(urlTheme)) {
      return {
        theme: getTheme(urlTheme)!,
        isFallback: false,
        source: 'url-param',
      };
    }
  }

  // 2. Canonical published settings from remote store (takes precedence over stale local cache)
  if (options?.remoteTheme && hasTheme(options.remoteTheme)) {
    const canonicalTheme = getTheme(options.remoteTheme)!;
    if (allowStorage) {
      persistLocalTheme(canonicalTheme.id);
    }
    return {
      theme: canonicalTheme,
      isFallback: false,
      source: 'remote-settings',
    };
  }

  // 3. Valid cached copy of the published theme setting
  if (typeof window !== 'undefined' && allowStorage) {
    try {
      const cached =
        localStorage.getItem(THEME_CACHE_KEY) ||
        localStorage.getItem(APPEARANCE_STORAGE_KEY);
      if (cached && hasTheme(cached)) {
        return {
          theme: getTheme(cached)!,
          isFallback: false,
          source: 'local-storage',
        };
      }
    } catch {
      // Ignore localStorage error (private mode / sandboxed iframe)
    }
  }

  // 4. Default fallback
  return {
    theme: getDefaultTheme(),
    isFallback: false,
    source: 'build-default',
  };
}
