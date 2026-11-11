import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAllThemes,
  getTheme,
  hasTheme,
  getDefaultTheme,
  DEFAULT_THEME_ID,
  registerTheme,
} from '../src/themes/core/registry';
import { resolveTheme, resolveClientTheme } from '../src/themes/core/resolver';
import {
  extractAppearance,
  applyAppearance,
  persistLocalTheme,
  getLocalTheme,
  clearLocalTheme,
} from '../src/themes/core/settings';
import {
  getKnightProfile,
  getKnightProjects,
  getKnightMoreProjects,
  KNIGHT_FEATURED_PROJECTS,
  KNIGHT_MORE_PROJECTS,
  KNIGHT_ACTIVITY,
  KNIGHT_LANGUAGES,
} from '../src/themes/core/data-adapter';
import { formatKnightAsciiTitle, splitTitleIntoLines } from '../src/themes/core/ascii-title';
import { defaultPortfolioData, mergePortfolioData, portfolioData } from '../src/data/portfolio';
import type { PortfolioData } from '../src/data/portfolio';

describe('1. Theme Registry', () => {
  it('ensures every registered theme identifier is unique', () => {
    const themes = getAllThemes();
    const ids = themes.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('verifies Knight theme is properly registered with required metadata', () => {
    expect(hasTheme('knight')).toBe(true);
    const knight = getTheme('knight');
    expect(knight).toBeDefined();
    expect(knight?.id).toBe('knight');
    expect(knight?.name).toBe('Knight');
    expect(knight?.description).toContain('Martian Mono');
    expect(knight?.defaultColorMode).toBe('dark');
  });

  it('verifies all existing themes remain registered without deletion', () => {
    expect(hasTheme('ascii')).toBe(true);
    expect(hasTheme('editorial')).toBe(true);
    expect(hasTheme('forkfolio')).toBe(true);

    const ascii = getTheme('ascii');
    expect(ascii?.name).toBe('Forkfolio ASCII');
    expect(ascii?.isDefault).toBe(true);

    const editorial = getTheme('editorial');
    expect(editorial?.name).toBe('DevOps Editorial');

    const forkfolio = getTheme('forkfolio');
    expect(forkfolio?.name).toBe('Forkfolio Modern Mono');
  });

  it('returns false for unknown theme identifiers', () => {
    expect(hasTheme('unknown-theme')).toBe(false);
    expect(hasTheme('')).toBe(false);
    expect(hasTheme(null)).toBe(false);
    expect(hasTheme(undefined)).toBe(false);
  });

  it('supports dynamically registering a new theme', () => {
    registerTheme({
      id: 'cyber' as any,
      name: 'Cyberpunk',
      description: 'Futuristic neon terminal.',
      defaultColorMode: 'dark',
    });
    expect(hasTheme('cyber')).toBe(true);
    expect(getTheme('cyber')?.name).toBe('Cyberpunk');
  });
});

describe('2. Theme Resolver', () => {
  it('resolves valid theme identifiers accurately', () => {
    const resKnight = resolveTheme('knight');
    expect(resKnight.theme.id).toBe('knight');
    expect(resKnight.isFallback).toBe(false);

    const resAscii = resolveTheme('ascii');
    expect(resAscii.theme.id).toBe('ascii');
    expect(resAscii.isFallback).toBe(false);
  });

  it('safely resolves unknown themes to default fallback', () => {
    const resInvalid = resolveTheme('non-existent-theme-xyz');
    expect(resInvalid.theme.id).toBe(DEFAULT_THEME_ID);
    expect(resInvalid.isFallback).toBe(true);
    expect(resInvalid.source).toBe('fallback');

    const resNull = resolveTheme(null);
    expect(resNull.theme.id).toBe(DEFAULT_THEME_ID);
    expect(resNull.isFallback).toBe(false);
  });

  it('respects custom fallbackId when provided', () => {
    const resWithCustomFallback = resolveTheme('missing-theme', 'editorial');
    expect(resWithCustomFallback.theme.id).toBe('editorial');
    expect(resWithCustomFallback.isFallback).toBe(true);
  });

  it('resolves client themes following priority', () => {
    const resDefault = resolveClientTheme({ allowUrlParam: false, allowLocalStorage: false });
    expect(resDefault.theme.id).toBe(DEFAULT_THEME_ID);

    const resRemote = resolveClientTheme({
      allowUrlParam: false,
      allowLocalStorage: false,
      remoteTheme: 'knight',
    });
    expect(resRemote.theme.id).toBe('knight');
  });
});

describe('3. Theme Settings & Persistence', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, val: string) => store.set(key, String(val)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      length: 0,
    } as Storage;
  });

  it('extracts appearance settings from portfolio data safely', () => {
    const settings = extractAppearance({
      identity: { ...defaultPortfolioData.identity, themeVariant: 'knight' },
    });
    expect(settings.activeTheme).toBe('knight');
  });

  it('falls back to default theme when appearance settings are invalid or empty', () => {
    const emptySettings = extractAppearance(null);
    expect(emptySettings.activeTheme).toBe(DEFAULT_THEME_ID);

    const corruptedSettings = extractAppearance({
      identity: { ...defaultPortfolioData.identity, themeVariant: 'corrupted-variant' as any },
    });
    expect(corruptedSettings.activeTheme).toBe(DEFAULT_THEME_ID);
  });

  it('applies appearance settings without mutating other portfolio fields', () => {
    const original = structuredClone(portfolioData);
    const updated = applyAppearance(original, { activeTheme: 'knight' });

    expect(updated.identity.themeVariant).toBe('knight');
    // Ensure all other portfolio fields remain identical
    expect(updated.identity.name).toBe(original.identity.name);
    expect(updated.identity.email).toBe(original.identity.email);
    expect(updated.projects).toEqual(original.projects);
    expect(updated.skills).toEqual(original.skills);
    expect(updated.experience).toEqual(original.experience);
  });

  it('manages local theme preference safely', () => {
    persistLocalTheme('knight');
    expect(getLocalTheme()).toBe('knight');

    clearLocalTheme();
    expect(getLocalTheme()).toBeNull();
  });
});

describe('4. Shared Portfolio Data & Data Adapter', () => {
  it('normalizes knight profile data directly from central portfolio store', () => {
    const profile = getKnightProfile(portfolioData);
    expect(profile.name).toBe(portfolioData.identity.name);
    expect(profile.email).toBe(portfolioData.identity.email);
    expect(profile.location).toBe(portfolioData.identity.location);
    expect(profile.githubHandle.toLowerCase()).toBe(
      portfolioData.identity.github.handle.replace(/^@/, '').toLowerCase(),
    );
    expect(profile.repoCount).toBe(portfolioData.projects.length);
  });

  it('maps projects strictly from curated database without appending GitHub repositories', () => {
    const knightProjects = getKnightProjects(portfolioData);
    expect(knightProjects).toHaveLength(portfolioData.projects.length);

    const first = knightProjects[0];
    const totalFormatted = String(Math.min(6, portfolioData.projects.length)).padStart(2, '0');
    expect(first.index).toBe(`01 / ${totalFormatted}`);
    expect(first.title).toBe(portfolioData.projects[0].title);
    expect(first.link).toBe(portfolioData.projects[0].link);
    expect(first.coverData).toBeDefined();

    // Verify alternating flip layout
    if (knightProjects.length > 1) {
      expect(knightProjects[0].isFlip).toBe(false);
      expect(knightProjects[1].isFlip).toBe(true);
    }
  });

  it('formats project titles responsively with exact monospace cell ratios', () => {
    const shortTitle = formatKnightAsciiTitle('Wiki Hub');
    expect(shortTitle.desktopLines).toEqual(['WIKI HUB']);
    expect(shortTitle.ld).toBe(1);
    expect(shortTitle.kd).toBe('5.340');

    const longTitle = formatKnightAsciiTitle('ansible-airgap-k8s');
    expect(longTitle.desktopLines.length).toBeGreaterThanOrEqual(2);
    expect(longTitle.mobileLines.length).toBeGreaterThanOrEqual(2);
    expect(Number(longTitle.kd)).toBeGreaterThan(0);
    expect(Number(longTitle.km)).toBeGreaterThan(0);

    const viTitle = formatKnightAsciiTitle('Hạ tầng K8S');
    expect(viTitle.desktopLines).toBeDefined();
    expect(viTitle.ld).toBeGreaterThanOrEqual(1);
  });

  it('returns empty array when database contains no projects without falling back to GitHub', () => {
    const emptyData = { ...portfolioData, projects: [] };
    const projects = getKnightProjects(emptyData);
    expect(projects).toEqual([]);
    const more = getKnightMoreProjects(emptyData);
    expect(more).toEqual([]);
  });

  it('provides authentic GitHub activity and more-projects lists', () => {
    expect(KNIGHT_MORE_PROJECTS.length).toBeGreaterThanOrEqual(10);
    expect(KNIGHT_ACTIVITY.weeks).toBe(53);
    expect(KNIGHT_ACTIVITY.heatmapString.length).toBe(53 * 7);
    expect(KNIGHT_ACTIVITY.totalContributions).toBe('1,680');
    expect(KNIGHT_ACTIVITY.activeDays).toBe(111);
    expect(KNIGHT_LANGUAGES.length).toBe(12);
  });

  it('ensures merging draft edits updates profile data across all themes', () => {
    const draft: Partial<PortfolioData> = {
      identity: {
        ...defaultPortfolioData.identity,
        name: 'Nguyen Thanh Quan (Senior)',
        bio: 'Updated live bio description.',
      },
    };
    const merged = mergePortfolioData(defaultPortfolioData, draft);
    const profile = getKnightProfile(merged);

    expect(profile.name).toBe('Nguyen Thanh Quan (Senior)');
    expect(profile.detailedBio).toBe('Updated live bio description.');
  });
});

describe('5. Production Protection & Regression', () => {
  it('verifies production default theme remains ascii', () => {
    expect(DEFAULT_THEME_ID).toBe('ascii');
    expect(getDefaultTheme().id).toBe('ascii');
    expect(defaultPortfolioData.identity.themeVariant).toBe('ascii');
    expect(defaultPortfolioData.appearance?.activeTheme).toBe('ascii');
  });

  it('verifies theme switching preserves all contact URLs and handles', () => {
    const profile = getKnightProfile(defaultPortfolioData);
    expect(profile.githubUrl).toBe('https://github.com/QuanBlue');
    expect(profile.linkedinUrl).toBe('https://linkedin.com/in/quanblue');
    expect(profile.email).toBe('quannguyenthanh558@gmail.com');
  });

  it('preserves appearance config across mergePortfolioData', () => {
    const customAppearance: Partial<PortfolioData> = {
      appearance: { activeTheme: 'knight', colorMode: 'dark' },
    };
    const merged = mergePortfolioData(defaultPortfolioData, customAppearance);
    expect(merged.appearance?.activeTheme).toBe('knight');
  });

  it('verifies preview parameters produce valid theme resolutions without persisting', () => {
    const resolvedKnightPreview = resolveTheme('knight');
    expect(resolvedKnightPreview.theme.id).toBe('knight');
    // Ensure default remains ascii
    expect(getDefaultTheme().id).toBe('ascii');
  });
});
