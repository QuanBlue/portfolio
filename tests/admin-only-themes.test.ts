import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { defaultPortfolioData } from '../src/data/portfolio';
import {
  assertAuthorizedAdminSession,
  OWNER_EMAIL,
  OWNER_GITHUB,
  publishRemote,
  publishThemeSelectionRemote,
  signOut,
  uploadImage,
} from '../src/lib/supabase';
import {
  ADMIN_PREVIEW_GRANT_KEY,
  applyAppearance,
  getAllThemes,
  getLocalTheme,
  isThemePreviewAuthorized,
  persistLocalTheme,
  resolveClientTheme,
} from '../src/themes/core';
import { COMMAND_LIST } from '../src/components/terminal/terminal-engine';

const ROOT = process.cwd();

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

const THEME_PUBLIC_SURFACES: Record<
  string,
  { header: string; footer: string; wrapper: string }
> = {
  ascii: {
    header: 'src/components/layout/Header.astro',
    footer: 'src/components/ascii/AsciiContact.astro',
    wrapper: 'src/components/themes/AsciiTheme.astro',
  },
  editorial: {
    header: 'src/components/layout/Header.astro',
    footer: 'src/components/sections/ContactSection.astro',
    wrapper: 'src/components/themes/EditorialTheme.astro',
  },
  knight: {
    header: 'src/themes/knight/components/KnightNav.astro',
    footer: 'src/themes/knight/components/KnightFooter.astro',
    wrapper: 'src/themes/knight/KnightTheme.astro',
  },
  forkfolio: {
    header: 'src/components/forkfolio/ForkfolioNav.astro',
    footer: 'src/components/forkfolio/ForkfolioFooter.astro',
    wrapper: 'src/components/themes/ForkfolioTheme.astro',
  },
};

const FORBIDDEN_PUBLIC_SWITCH_PATTERNS = [
  /id=["']theme-variant-toggle["']/,
  /id=["']ff-theme-variant-toggle["']/,
  /id=["']theme-variant-label["']/,
  /SwitchTheme/i,
  /ThemeSwitcher/i,
  /ThemeToggle/i,
  /Choose Theme/i,
  /Change Theme/i,
  /Switch theme/i,
  /Đổi giao diện/,
  /❖\s*(Forkfolio ASCII|Modern Mono|Knight|DevOps Editorial|Theme)/i,
  /data-select-theme=/,
];

describe('Admin-Only Theme Management — All Registered Themes', () => {
  it('covers every registered theme without omission and forbids public theme switchers', () => {
    const registered = getAllThemes();
    const mappedIds = Object.keys(THEME_PUBLIC_SURFACES).sort();
    const registeredIds = registered.map((t) => t.id).sort();
    expect(mappedIds).toEqual(registeredIds);

    for (const theme of registered) {
      const files = THEME_PUBLIC_SURFACES[theme.id];
      expect(files).toBeDefined();

      const headerSrc = readSrc(files.header);
      const footerSrc = readSrc(files.footer);
      const wrapperSrc = readSrc(files.wrapper);

      for (const pattern of FORBIDDEN_PUBLIC_SWITCH_PATTERNS) {
        expect(headerSrc, `${theme.id} header matched ${pattern}`).not.toMatch(pattern);
        expect(footerSrc, `${theme.id} footer matched ${pattern}`).not.toMatch(pattern);
        expect(wrapperSrc, `${theme.id} wrapper matched ${pattern}`).not.toMatch(pattern);
      }

      // Admin link remains available across desktop & (where separate) mobile nav
      expect(headerSrc, `${theme.id} missing /admin link`).toContain('href="/admin"');

      // Language switcher remains available in public header
      expect(headerSrc, `${theme.id} missing LanguageSwitcher`).toContain('<LanguageSwitcher');

      // Color mode (Light/Dark) toggle preserved cleanly on themes that support color mode
      if (theme.supportsColorMode) {
        const hasColorToggle =
          headerSrc.includes('id="theme-toggle"') || headerSrc.includes('id="ff-color-mode-toggle"');
        expect(hasColorToggle, `${theme.id} should retain Light/Dark color mode toggle`).toBe(true);
      }
    }
  });

  it('has no public theme-switching UI, cycle button handler, or keyboard shortcut in index/layout/terminal', () => {
    const indexSrc = readSrc('src/pages/index.astro');
    const baseSrc = readSrc('src/layouts/BaseLayout.astro');

    for (const pattern of FORBIDDEN_PUBLIC_SWITCH_PATTERNS) {
      expect(indexSrc).not.toMatch(pattern);
      expect(baseSrc).not.toMatch(pattern);
    }

    // No keyboard listeners in public theme index/headers that switch portfolio themes
    expect(indexSrc).not.toContain('cycleOrder');
    expect(readSrc('src/components/layout/Header.astro')).not.toContain('keydown');
    expect(readSrc('src/components/forkfolio/ForkfolioNav.astro')).not.toContain('keydown');
    expect(readSrc('src/themes/knight/components/KnightNav.astro')).not.toContain('keydown');

    // Interactive terminal does not expose a theme-switching command
    const cmdNames = Object.keys(COMMAND_LIST).map((k) => k.toLowerCase());
    expect(cmdNames).not.toContain('theme');
    expect(cmdNames).not.toContain('switch-theme');
  });

  it('keeps Admin Appearance selector and Preview actions strictly inside admin components', () => {
    const adminSrc = readSrc('src/pages/admin.astro');
    expect(adminSrc).toContain("id: 'appearance'");
    expect(adminSrc).toContain('data-select-theme=');
    expect(adminSrc).toContain('data-preview-theme=');
    expect(adminSrc).toContain('appearance.activeTheme');
    expect(adminSrc).toContain('identity.themeVariant');
  });
});

describe('Admin Authorization & Publish Protection', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      length: 0,
    } as Storage;
  });

  it('rejects unauthenticated and non-owner sessions for admin publish operations', async () => {
    const guestSession = {
      user: {
        id: 'guest-1',
        email: 'visitor@example.com',
        user_metadata: { user_name: 'random-visitor' },
      },
    } as unknown as Session;

    expect(() => assertAuthorizedAdminSession(null)).toThrow(/Unauthorized/);
    expect(() => assertAuthorizedAdminSession(guestSession)).toThrow(/Unauthorized/);

    const rootSession = {
      user: {
        id: 'root-1',
        email: 'alt@example.com',
        user_metadata: { user_name: OWNER_GITHUB },
      },
    } as unknown as Session;
    const ownerSession = {
      user: {
        id: 'owner-1',
        email: OWNER_EMAIL,
        user_metadata: {},
      },
    } as unknown as Session;

    expect(() => assertAuthorizedAdminSession(rootSession)).not.toThrow();
    expect(() => assertAuthorizedAdminSession(ownerSession)).not.toThrow();

    await expect(publishRemote(defaultPortfolioData)).rejects.toThrow(/Unauthorized/);
    await expect(publishThemeSelectionRemote(defaultPortfolioData, 'knight')).rejects.toThrow(/Unauthorized/);
    await expect(uploadImage(new Blob(['x']), 'avatar')).rejects.toThrow(/Unauthorized/);
  });

  it('applies and persists selected default theme for Admin and revokes preview access on signOut', async () => {
    const updated = applyAppearance(defaultPortfolioData, { activeTheme: 'knight' });
    expect(updated.appearance?.activeTheme).toBe('knight');
    expect(updated.identity.themeVariant).toBe('knight');

    persistLocalTheme('knight');
    expect(getLocalTheme()).toBe('knight');

    localStorage.setItem(ADMIN_PREVIEW_GRANT_KEY, 'true');
    await signOut();
    expect(localStorage.getItem(ADMIN_PREVIEW_GRANT_KEY)).toBeNull();
    // Visitor's published theme cache stays intact so site still renders published theme cleanly
    expect(getLocalTheme()).toBe('knight');
  });
});

describe('Preview URL Security Policy (Dev vs Authenticated Admin vs Public Prod)', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      length: 0,
    } as Storage;
  });

  it('authorizes preview only for development, authenticated Supabase owner, or explicit Local Admin grant', () => {
    // Development allows preview
    expect(isThemePreviewAuthorized({ isDev: true })).toBe(true);

    // Production with Supabase configured: owner allowed, unauthenticated/guest denied even if local grant key spoofed
    expect(
      isThemePreviewAuthorized({
        isDev: false,
        isSupabaseConfigured: true,
        isOwnerSession: true,
      }),
    ).toBe(true);
    expect(
      isThemePreviewAuthorized({
        isDev: false,
        isSupabaseConfigured: true,
        isOwnerSession: false,
        hasLocalAdminGrant: true,
      }),
    ).toBe(false);

    // Production without Supabase (Local Mode): only explicit Admin preview grant allowed
    expect(
      isThemePreviewAuthorized({
        isDev: false,
        isSupabaseConfigured: false,
        hasLocalAdminGrant: false,
      }),
    ).toBe(false);
    expect(
      isThemePreviewAuthorized({
        isDev: false,
        isSupabaseConfigured: false,
        hasLocalAdminGrant: true,
      }),
    ).toBe(true);
  });

  it('ignores URL ?preview= when unauthorized and serves published remote theme instead', () => {
    (globalThis as any).window = {
      location: { search: '?preview=forkfolio' },
    };
    try {
      const unauthorizedRes = resolveClientTheme({
        allowUrlParam: true,
        isPreviewAuthorized: false,
        allowLocalStorage: true,
        remoteTheme: 'knight',
      });
      expect(unauthorizedRes.theme.id).toBe('knight');
      expect(unauthorizedRes.source).toBe('remote-settings');

      const authorizedRes = resolveClientTheme({
        allowUrlParam: true,
        isPreviewAuthorized: true,
        allowLocalStorage: true,
        remoteTheme: 'knight',
      });
      expect(authorizedRes.theme.id).toBe('forkfolio');
      expect(authorizedRes.source).toBe('url-param');
      // Ephemeral preview must not overwrite published cache
      expect(getLocalTheme()).toBe('knight');
    } finally {
      delete (globalThis as any).window;
    }
  });
});
