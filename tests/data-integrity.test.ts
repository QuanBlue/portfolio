import { describe, expect, it } from 'vitest';
import {
  defaultPortfolioData,
  getCareerSettings,
  mergePortfolioData,
  resolveAvatarUrl,
} from '../src/data/portfolio';
import { localizePortfolioData } from '../src/i18n/translate';
import { groupSkillsByCategory, renderAvatar, renderCvSheetHtml } from '../src/lib/render';
import { getKnightActivity, getKnightProfile, parseHeatmapWeeks } from '../src/themes/core/data-adapter';
import {
  deriveRepoLabel,
  renderAsciiActivityHtml,
  renderAsciiAvatarImgOrFallback,
  renderAsciiCertificationsHtml,
  renderAsciiEducationHtml,
  renderAsciiExperienceHtml,
  renderAsciiProjectsHtml,
} from '../src/components/ascii/ascii-renderers';
import {
  renderForkfolioActivityHtml,
  renderForkfolioCertificationsHtml,
  renderForkfolioEducationHtml,
  renderForkfolioExperienceHtml,
  renderForkfolioProjectsHtml,
} from '../src/components/forkfolio/forkfolio-renderers';

describe('Data Integrity — Avatar & Persistence', () => {
  it('defaultPortfolioData never embeds meme or hardcoded personal photo URLs', () => {
    expect(defaultPortfolioData.identity.avatar).toBe('');
    expect(resolveAvatarUrl(defaultPortfolioData)).toBe('');
  });

  it('resolveAvatarUrl appends cache-busting revision to HTTP URLs and blocks unsafe schemes', () => {
    const clean = resolveAvatarUrl({
      identity: {
        ...defaultPortfolioData.identity,
        avatar: 'https://example.com/avatar.jpg',
        avatarUpdatedAt: 1700000000,
      },
    });
    expect(clean).toBe('https://example.com/avatar.jpg?v=1700000000');

    const existingQuery = resolveAvatarUrl({
      identity: {
        ...defaultPortfolioData.identity,
        avatar: 'https://example.com/avatar.jpg?token=abc',
        avatarUpdatedAt: 42,
      },
    });
    expect(existingQuery).toBe('https://example.com/avatar.jpg?token=abc&v=42');

    const dataUri = resolveAvatarUrl({
      identity: {
        ...defaultPortfolioData.identity,
        avatar: 'data:image/png;base64,iVBORw0KGgo=',
        avatarUpdatedAt: 99,
      },
    });
    expect(dataUri).toBe('data:image/png;base64,iVBORw0KGgo=');

    const blocked = resolveAvatarUrl({
      identity: {
        ...defaultPortfolioData.identity,
        avatar: 'javascript:alert(1)',
      },
    });
    expect(blocked).toBe('');
  });

  it('mergePortfolioData preserves intentional empty arrays, empty cvUrl, and openToWork=false', () => {
    const merged = mergePortfolioData(defaultPortfolioData, {
      identity: {
        ...defaultPortfolioData.identity,
        avatar: 'https://cdn.example.com/real-user.jpg',
        bio: 'Updated canonical bio.',
      },
      projects: [],
      experience: [],
      education: [],
      certifications: [],
      skills: [],
      gallery: [],
      careerSettings: {
        openToWork: false,
        cvUrl: '',
      },
    });

    expect(merged.projects).toEqual([]);
    expect(merged.experience).toEqual([]);
    expect(merged.education).toEqual([]);
    expect(merged.certifications).toEqual([]);
    expect(merged.skills).toEqual([]);
    expect(merged.gallery).toEqual([]);
    expect(merged.careerSettings?.openToWork).toBe(false);
    expect(merged.careerSettings?.cvUrl).toBe('');
    expect(merged.identity.openToWork).toBe(false);
    expect(merged.identity.cvUrl).toBe('');

    const career = getCareerSettings(merged);
    expect(career.openToWork).toBe(false);
    expect(career.cvUrl).toBeUndefined();
  });

  it('localizePortfolioData preserves intentionally emptied lists in EN and VI', () => {
    const emptyOverride = mergePortfolioData(defaultPortfolioData, {
      projects: [],
      experience: [],
      education: [],
      certifications: [],
      skills: [],
    });
    const localizedVi = localizePortfolioData(emptyOverride, 'vi');
    expect(localizedVi.projects).toEqual([]);
    expect(localizedVi.experience).toEqual([]);
    expect(localizedVi.education).toEqual([]);
    expect(localizedVi.certifications).toEqual([]);
    expect(localizedVi.skills).toEqual([]);
  });
});

describe('Data Integrity — Theme Adapters & Renderers', () => {
  it('getKnightProfile never falls back to external demo avatar', () => {
    const profile = getKnightProfile(defaultPortfolioData);
    expect(profile.avatarUrl).toBe('');

    const withAvatar = getKnightProfile({
      ...defaultPortfolioData,
      identity: {
        ...defaultPortfolioData.identity,
        avatar: 'https://cdn.example.com/portrait.jpg',
        avatarUpdatedAt: '123',
      },
    });
    expect(withAvatar.avatarUrl).toBe('https://cdn.example.com/portrait.jpg?v=123');
  });

  it('getKnightActivity uses verified daily records or matching snapshot and rejects unverified accounts', () => {
    const snapActivity = getKnightActivity(defaultPortfolioData);
    expect(snapActivity).not.toBeNull();
    expect(snapActivity?.username).toBe('QuanBlue');

    expect(
      getKnightActivity({
        ...defaultPortfolioData,
        activity: { enabled: false },
      }),
    ).toBeNull();

    expect(
      getKnightActivity({
        ...defaultPortfolioData,
        identity: {
          ...defaultPortfolioData.identity,
          github: { handle: '@other-user', url: 'https://github.com/other-user' },
        },
      }),
    ).toBeNull();

    expect(
      getKnightActivity({
        ...defaultPortfolioData,
        activity: { enabled: true, username: 'QuanBlue', days: [] },
      }),
    ).toBeNull();

    const enabledPayload = {
      ...defaultPortfolioData,
      activity: {
        enabled: true,
        username: 'QuanBlue',
        fetchedAt: '2026-01-17T12:00:00Z',
        days: [
          { date: '2026-01-04', contributionCount: 5 },
          { date: '2026-01-05', contributionCount: 3 },
          { date: '2026-01-06', contributionCount: 8 },
          { date: '2026-01-07', contributionCount: 10 },
          { date: '2026-01-08', contributionCount: 14 },
          { date: '2026-01-09', contributionCount: 0 },
          { date: '2026-01-10', contributionCount: 2 },
          { date: '2026-01-17', contributionCount: 0 },
        ],
      },
    };
    const active = getKnightActivity(enabledPayload);
    expect(active).not.toBeNull();
    expect(active?.totalContributions).toBe('42');
    expect(active?.activeDays).toBe(6);
    expect(active?.longestStreak).toContain('5');
    expect(active?.busiestDay).toContain('14');
    expect(parseHeatmapWeeks(active!.heatmapString, active!.weeks).length).toBe(2);

    const asciiEnabledHtml = renderAsciiActivityHtml(enabledPayload, 'en');
    expect(asciiEnabledHtml).toContain('CONFIGURED_ACTIVITY_STREAM');
    expect(asciiEnabledHtml).toContain('42 contributions');

    const ffEnabledHtml = renderForkfolioActivityHtml(enabledPayload, 'en');
    expect(ffEnabledHtml).toContain('CONFIGURED_ACTIVITY_HEATMAP');
    expect(ffEnabledHtml).toContain('42 Contributions');
  });

  it('renderAvatar & renderAsciiAvatarImgOrFallback handle missing avatar with monogram', () => {
    const html = renderAvatar(defaultPortfolioData.identity);
    expect(html).not.toContain('<img');
    expect(html).toContain('TQ');

    const asciiHtml = renderAsciiAvatarImgOrFallback(defaultPortfolioData);
    expect(asciiHtml).toContain('NO_AVATAR_IMAGE');
  });

  it('groupSkillsByCategory groups skills respecting locale', () => {
    const groupsEn = groupSkillsByCategory(
      [
        { id: '1', name: 'Docker', tag: '[CTR]', status: 'ACTIVE', category: 'Containers', category_vi: 'Container' },
        { id: '2', name: 'Helm', tag: '[K8S]', status: 'ACTIVE', category: 'Containers', category_vi: 'Container' },
        { id: '3', name: 'Go', tag: '[DEV]', status: 'ACTIVE' },
      ],
      'en',
    );
    expect(groupsEn).toHaveLength(2);
    expect(groupsEn[0].category).toBe('Containers');
    expect(groupsEn[0].items).toHaveLength(2);

    const groupsVi = groupSkillsByCategory(
      [{ id: '1', name: 'Docker', tag: '[CTR]', status: 'ACTIVE', category: 'Containers', category_vi: 'Container hóa' }],
      'vi',
    );
    expect(groupsVi[0].category).toBe('Container hóa');
  });

  it('ASCII & Forkfolio renderers render clean empty states and avoid fabricated claims', () => {
    expect(renderAsciiProjectsHtml([], 'user')).toContain('[ No published projects ]');
    expect(renderAsciiExperienceHtml([])).toContain('[ No published experience ]');
    expect(renderAsciiEducationHtml([])).toContain('[ No published education ]');
    expect(renderAsciiCertificationsHtml([])).toContain('[ No published certifications ]');

    expect(renderForkfolioProjectsHtml([], 'user')).toContain('[ NO PUBLISHED PROJECTS ]');
    expect(renderForkfolioExperienceHtml([])).toContain('[ NO PUBLISHED EXPERIENCE ]');
    expect(renderForkfolioEducationHtml([])).toContain('[ NO PUBLISHED EDUCATION ]');
    expect(renderForkfolioCertificationsHtml([])).toContain('[ NO PUBLISHED CERTIFICATIONS ]');

    const disabledData = { ...defaultPortfolioData, activity: { enabled: false } };
    const asciiAct = renderAsciiActivityHtml(disabledData, 'en');
    expect(asciiAct).toContain('NO GITHUB TELEMETRY STREAM CONFIGURED');
    expect(asciiAct).not.toContain('2,489');

    const mismatchData = {
      ...defaultPortfolioData,
      identity: {
        ...defaultPortfolioData.identity,
        github: { handle: '@other-user', url: 'https://github.com/other-user' },
      },
    };
    const ffAct = renderForkfolioActivityHtml(mismatchData, 'en');
    expect(ffAct).toContain('NO GITHUB ACTIVITY STREAM CONFIGURED');
    expect(ffAct).not.toContain('2,489');
    expect(ffAct).not.toContain('1,696');
  });

  it('deriveRepoLabel derives host/path from external links without hardcoding QuanBlue', () => {
    expect(deriveRepoLabel('https://github.com/custom-org/infra-tool', 'other', 'infra')).toBe(
      'github.com/custom-org/infra-tool',
    );
    expect(deriveRepoLabel('#', '@alice', 'demo-repo')).toBe('github.com/alice/demo-repo');
  });

  it('renderCvSheetHtml uses canonical domain and dynamic portfolio data', () => {
    const cv = renderCvSheetHtml({
      ...defaultPortfolioData,
      identity: { ...defaultPortfolioData.identity, name: 'Test Candidate' },
    });
    expect(cv).toContain('TEST CANDIDATE');
    expect(cv).toContain('https://thanhquan.dev/');
    expect(cv).not.toContain('quanblue.netlify.app');
  });
});
