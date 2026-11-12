import { describe, expect, it } from 'vitest';
import snapshot from '../src/data/github-activity.snapshot.json';
import { defaultPortfolioData } from '../src/data/portfolio';
import {
  computeActivitySummary,
  extractGithubUsername,
  normalizeContributionDataset,
  parseUtcIsoDate,
  resolvePortfolioActivity,
} from '../src/lib/github-activity';
import { renderKnightActivity } from '../src/themes/core/render-knight';

describe('GitHub Activity — Calendar, Normalization & Summary Integrity', () => {
  it('validates UTC ISO calendar dates including leap years cleanly', () => {
    expect(parseUtcIsoDate('2024-02-29')).not.toBeNull();
    expect(parseUtcIsoDate('2025-02-29')).toBeNull();
    expect(parseUtcIsoDate('2026-02-30')).toBeNull();
    expect(parseUtcIsoDate('2026-13-01')).toBeNull();
    expect(parseUtcIsoDate('2026/01/01')).toBeNull();
    expect(parseUtcIsoDate('not-a-date')).toBeNull();
  });

  it('extracts canonical GitHub usernames from handles and URLs without fabrication', () => {
    expect(extractGithubUsername({ handle: '@QuanBlue', url: 'https://github.com/QuanBlue' })).toBe('QuanBlue');
    expect(extractGithubUsername({ url: 'https://github.com/octocat/' })).toBe('octocat');
    expect(extractGithubUsername({ handle: '  @dev-ops-1  ' })).toBe('dev-ops-1');
    expect(extractGithubUsername({ handle: '@invalid_user' })).toBe('');
    expect(extractGithubUsername({ handle: '', url: '' })).toBe('');
    expect(extractGithubUsername(undefined)).toBe('');
  });

  it('computes summary stats from a single daily dataset across leap/month/year boundaries', () => {
    const summary = computeActivitySummary([
      { date: '2024-02-28', contributionCount: 2 },
      { date: '2024-02-29', contributionCount: 5 },
      { date: '2024-03-01', contributionCount: 5 },
      { date: '2024-03-02', contributionCount: 0 },
      { date: '2025-12-31', contributionCount: 3 },
      { date: '2026-01-01', contributionCount: 4 },
      { date: '2026-01-02', contributionCount: 5 },
    ]);

    expect(summary.totalContributions).toBe(24);
    expect(summary.activeDays).toBe(6);
    expect(summary.longestStreak).toBe(3);
    // Tie of 5 between 2024-02-29, 2024-03-01, and 2026-01-02 -> latest date wins deterministically
    expect(summary.busiestDay).toEqual({ date: '2026-01-02', count: 5 });

    const allZero = computeActivitySummary([
      { date: '2026-01-01', contributionCount: 0 },
      { date: '2026-01-02', contributionCount: 0 },
    ]);
    expect(allZero).toEqual({
      totalContributions: 0,
      activeDays: 0,
      longestStreak: 0,
      busiestDay: null,
    });
  });

  it('filters future dates, deduplicates entries, fills gaps, and aligns partial weeks/months', () => {
    // 2026-01-07 is Wednesday (dow 3); 2026-02-04 is Wednesday (dow 3)
    const normalized = normalizeContributionDataset({
      username: 'QuanBlue',
      githubUrl: 'https://github.com/QuanBlue',
      source: 'admin-configured',
      isLive: false,
      fetchedAt: '2026-02-04T12:00:00Z',
      todayUtc: '2026-02-04',
      locale: 'en',
      rawDays: [
        { date: '2026-01-07', contributionCount: 2 },
        { date: '2026-01-07', contributionCount: 4 }, // duplicate: later entry overrides
        { date: '2026-01-10', contributionCount: 6 },
        { date: '2026-02-01', contributionCount: 8 },
        { date: '2026-02-04', contributionCount: 3 },
        { date: '2026-02-05', contributionCount: 999 }, // strictly future vs todayUtc -> excluded
        { date: '2025-02-29', contributionCount: 77 }, // invalid non-leap date -> excluded
      ],
    });

    expect(normalized).not.toBeNull();
    expect(normalized!.periodStart).toBe('2026-01-07');
    expect(normalized!.periodEnd).toBe('2026-02-04');
    // Dense calendar span: Jan 7..Jan 31 (25 days) + Feb 1..Feb 4 (4 days) = 29 days
    expect(normalized!.days).toHaveLength(29);
    expect(normalized!.summary.totalContributions).toBe(21);
    expect(normalized!.summary.activeDays).toBe(4);
    expect(normalized!.summary.busiestDay).toEqual({ date: '2026-02-01', count: 8 });
    expect(normalized!.days.some((d) => d.date === '2026-02-05')).toBe(false);

    // Opening partial week Sun..Tue = null, Wed..Sat filled
    const firstWeek = normalized!.weeks[0].days;
    expect(firstWeek.slice(0, 3)).toEqual([null, null, null]);
    expect(firstWeek[3]?.date).toBe('2026-01-07');
    expect(firstWeek[3]?.contributionCount).toBe(4);

    // Closing partial week Thu..Sat = null
    const lastWeek = normalized!.weeks[normalized!.weeks.length - 1].days;
    expect(lastWeek[3]?.date).toBe('2026-02-04');
    expect(lastWeek.slice(4)).toEqual([null, null, null]);

    // Chronological month headers aligned within grid columns
    expect(normalized!.months.length).toBeGreaterThanOrEqual(2);
    expect(normalized!.months[0].monthKey).toBe('2026-01');
    expect(normalized!.months[0].weekIndex).toBe(0);
    const febLabel = normalized!.months.find((m) => m.monthKey === '2026-02');
    expect(febLabel).toBeDefined();
    expect(febLabel!.weekIndex).toBeGreaterThan(0);
    expect(febLabel!.weekIndex).toBeLessThan(normalized!.weeks.length);
  });

  it('enforces verified snapshot integrity and account-matching precedence', () => {
    const resolvedDefault = resolvePortfolioActivity(defaultPortfolioData, 'en', undefined, snapshot.periodEnd);
    expect(resolvedDefault.available).toBe(true);
    if (resolvedDefault.available) {
      expect(resolvedDefault.username).toBe('QuanBlue');
      expect(resolvedDefault.days).toHaveLength(368);
      expect(resolvedDefault.summary.totalContributions).toBe(1696);
      expect(resolvedDefault.summary.busiestDay).toEqual({ date: '2026-08-21', count: 124 });
      expect(resolvedDefault.months.length).toBeGreaterThanOrEqual(11);
      expect(resolvedDefault.days.every((d) => d.date <= resolvedDefault.periodEnd)).toBe(true);
    }

    // Case-insensitive handle match
    const caseMatch = resolvePortfolioActivity(
      {
        identity: { github: { handle: '@quanblue', url: 'https://github.com/quanblue' } },
      },
      'en',
      undefined,
      snapshot.periodEnd,
    );
    expect(caseMatch.available).toBe(true);

    // Account mismatch never leaks QuanBlue stats
    const mismatch = resolvePortfolioActivity(
      {
        identity: { github: { handle: '@someone-else', url: 'https://github.com/someone-else' } },
      },
      'en',
      undefined,
      snapshot.periodEnd,
    );
    expect(mismatch).toEqual({
      available: false,
      reason: 'account-mismatch',
      username: 'someone-else',
      githubUrl: 'https://github.com/someone-else',
    });

    // Explicit opt-out overrides snapshot
    const disabled = resolvePortfolioActivity(
      {
        ...defaultPortfolioData,
        activity: { enabled: false },
      },
      'en',
    );
    expect(disabled.available).toBe(false);
    if (!disabled.available) expect(disabled.reason).toBe('disabled');

    // Empty days returns empty unavailable state
    const emptyDays = resolvePortfolioActivity(
      {
        ...defaultPortfolioData,
        activity: { enabled: true, username: 'QuanBlue', days: [] },
      },
      'en',
    );
    expect(emptyDays.available).toBe(false);
    if (!emptyDays.available) expect(emptyDays.reason).toBe('empty');
  });

  it('renders strict occlusion frame, aligned grid cells, localized labels, and keeps @username untranslated', () => {
    const resolvedEn = resolvePortfolioActivity(defaultPortfolioData, 'en', undefined, snapshot.periodEnd);
    const htmlEn = renderKnightActivity(resolvedEn, 'en');

    expect(htmlEn).toContain('data-kn-occ="strict"');
    expect(htmlEn).not.toContain('data-kn-r="figs"');
    expect(htmlEn).toContain('kn-cal-board');
    expect(htmlEn).toContain('@QuanBlue');
    expect(htmlEn).toContain('1,696');
    expect(htmlEn).toContain('124');
    expect(htmlEn).toContain('data-date="2026-08-21" data-count="124"');
    expect(htmlEn).toContain('kn-cal-spacer');
    expect(htmlEn).toContain('contributions');

    const resolvedVi = resolvePortfolioActivity(defaultPortfolioData, 'vi', undefined, snapshot.periodEnd);
    const htmlVi = renderKnightActivity(resolvedVi, 'vi');
    expect(htmlVi).toContain('@QuanBlue');
    expect(htmlVi).toContain('đóng góp');
    expect(htmlVi).toContain('ngày cao điểm');

    const mismatch = resolvePortfolioActivity(
      {
        identity: { github: { handle: '@other-user', url: 'https://github.com/other-user' } },
      },
      'vi',
    );
    const htmlMismatch = renderKnightActivity(mismatch, 'vi');
    expect(htmlMismatch).toContain('data-kn-occ="strict"');
    expect(htmlMismatch).toContain('@other-user');
    expect(htmlMismatch).toContain('Dữ liệu snapshot không khớp với tài khoản GitHub đã cấu hình.');
    expect(htmlMismatch).not.toContain('1,696');
  });
});
