/**
 * Shared Verified GitHub Contribution Activity Engine
 * Normalizes daily contribution datasets, enforces strict UTC calendar dates,
 * computes summary metrics strictly from the normalized daily dataset,
 * verifies configured GitHub account ownership, and formats localized labels cleanly.
 */
import type { Locale } from '../i18n/types';
import snapshotRaw from '../data/github-activity.snapshot.json';

export interface ContributionDay {
  date: string; // YYYY-MM-DD (UTC calendar date)
  contributionCount: number;
  level?: 0 | 1 | 2 | 3 | 4;
}

export interface ActivitySummary {
  totalContributions: number;
  activeDays: number;
  longestStreak: number;
  busiestDay: {
    date: string;
    count: number;
  } | null;
}

export interface ActivityWeekSlot {
  startDate: string;
  days: Array<ContributionDay | null>; // Fixed 7 slots: index 0 = Sun .. index 6 = Sat
}

export interface ActivityMonthLabel {
  label: string;
  monthKey: string;
  weekIndex: number;
}

export type ActivitySourceType =
  | 'github-graphql'
  | 'github-public-calendar'
  | 'admin-configured'
  | 'snapshot';

export interface NormalizedActivityDataset {
  available: true;
  username: string;
  githubUrl: string;
  source: ActivitySourceType;
  isLive: boolean;
  fetchedAt: string;
  periodStart: string;
  periodEnd: string;
  days: ContributionDay[];
  weeks: ActivityWeekSlot[];
  months: ActivityMonthLabel[];
  summary: ActivitySummary;
}

export interface UnavailableActivityState {
  available: false;
  reason: 'disabled' | 'no-account' | 'account-mismatch' | 'empty' | 'unavailable';
  username: string;
  githubUrl: string;
  fetchedAt?: string;
}

export type ActivityResolution = NormalizedActivityDataset | UnavailableActivityState;

export interface RawActivitySnapshot {
  schemaVersion?: number;
  username: string;
  source: string;
  fetchedAt: string;
  periodStart?: string;
  periodEnd?: string;
  days: ContributionDay[];
}

const ONE_DAY_MS = 86_400_000;

/** Parses strict YYYY-MM-DD as UTC midnight timestamp (ms). Returns null for invalid calendar dates (e.g. Feb 30). */
export function parseUtcIsoDate(dateStr: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || '').trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mon = Number(m[2]);
  const d = Number(m[3]);
  const ms = Date.UTC(y, mon - 1, d);
  const dt = new Date(ms);
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mon - 1 || dt.getUTCDate() !== d) {
    return null;
  }
  return ms;
}

export function toUtcIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function getTodayUtcIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function extractGithubUsername(github?: { handle?: string; url?: string } | null): string {
  const url = String(github?.url || '').trim();
  const urlMatch = url.match(/github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)/i);
  if (urlMatch?.[1]) return urlMatch[1];

  const handle = String(github?.handle || '').trim().replace(/^@/, '').trim();
  if (/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(handle)) {
    return handle;
  }
  return '';
}

export function deriveContributionLevel(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (!Number.isFinite(count) || count <= 0) return 0;
  if (maxCount <= 1) return 4;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

/**
 * Calculates total contributions, active days, consecutive UTC calendar longest streak,
 * and deterministic busiest day strictly from the provided normalized daily dataset.
 */
export function computeActivitySummary(days: ContributionDay[]): ActivitySummary {
  let totalContributions = 0;
  let activeDays = 0;
  let longestStreak = 0;
  let currentStreak = 0;
  let prevActiveMs: number | null = null;
  let busiestDay: { date: string; count: number } | null = null;

  for (const d of days) {
    const count = Math.max(0, Math.floor(Number(d.contributionCount) || 0));
    const ms = parseUtcIsoDate(d.date);
    if (ms === null) continue;

    totalContributions += count;

    if (count > 0) {
      activeDays += 1;
      if (prevActiveMs !== null && ms - prevActiveMs === ONE_DAY_MS) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
      prevActiveMs = ms;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      if (!busiestDay || count > busiestDay.count || (count === busiestDay.count && d.date > busiestDay.date)) {
        busiestDay = { date: d.date, count };
      }
    } else {
      currentStreak = 0;
      prevActiveMs = null;
    }
  }

  return {
    totalContributions,
    activeDays,
    longestStreak,
    busiestDay,
  };
}

export function formatUtcDate(dateStr: string, locale: Locale = 'en'): string {
  const ms = parseUtcIsoDate(dateStr);
  if (ms === null) return dateStr;
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(ms));
}

export function formatIsoTimestampDate(isoTimestamp: string, locale: Locale = 'en'): string {
  const dt = new Date(isoTimestamp);
  if (Number.isNaN(dt.getTime())) return isoTimestamp;
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dt);
}

export function formatMonthShort(monthKey: string, locale: Locale = 'en'): string {
  const ms = parseUtcIsoDate(`${monthKey}-01`);
  if (ms === null) return monthKey;
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    timeZone: 'UTC',
    month: 'short',
  }).format(new Date(ms));
}

/**
 * Normalizes raw daily records into sorted contiguous calendar days (clamped to `todayUtc`,
 * aligned into Sunday..Saturday week columns with null slots for partial boundary weeks,
 * exact month-start column positions, and summary derived solely from those days).
 */
export function normalizeContributionDataset(params: {
  username: string;
  githubUrl: string;
  source: ActivitySourceType;
  isLive: boolean;
  fetchedAt: string;
  rawDays: ContributionDay[];
  locale?: Locale;
  todayUtc?: string;
}): NormalizedActivityDataset | null {
  const locale = params.locale === 'vi' ? 'vi' : 'en';
  const cutoff = params.todayUtc && parseUtcIsoDate(params.todayUtc) !== null ? params.todayUtc : getTodayUtcIso();

  // Deduplicate & validate dates; drop future dates strictly (> cutoff)
  const dayMap = new Map<string, { count: number; level?: 0 | 1 | 2 | 3 | 4 }>();
  for (const item of params.rawDays || []) {
    if (!item || typeof item.date !== 'string') continue;
    const ms = parseUtcIsoDate(item.date);
    if (ms === null) continue;
    if (item.date > cutoff) continue;
    const count = Math.max(0, Math.floor(Number(item.contributionCount) || 0));
    const lvl =
      item.level !== undefined && [0, 1, 2, 3, 4].includes(Number(item.level))
        ? (Number(item.level) as 0 | 1 | 2 | 3 | 4)
        : undefined;
    dayMap.set(item.date, { count, level: lvl });
  }

  if (dayMap.size === 0) return null;

  const sortedKeys = Array.from(dayMap.keys()).sort();
  const periodStart = sortedKeys[0];
  const periodEnd = sortedKeys[sortedKeys.length - 1];
  const startMs = parseUtcIsoDate(periodStart)!;
  const endMs = parseUtcIsoDate(periodEnd)!;

  let maxPositiveCount = 0;
  for (const entry of dayMap.values()) {
    if (entry.count > maxPositiveCount) maxPositiveCount = entry.count;
  }

  // Build dense calendar day series from periodStart to periodEnd
  const days: ContributionDay[] = [];
  for (let ms = startMs; ms <= endMs; ms += ONE_DAY_MS) {
    const iso = toUtcIsoDate(ms);
    const existing = dayMap.get(iso);
    const count = existing ? existing.count : 0;
    const level =
      count === 0
        ? 0
        : existing?.level && existing.level > 0
          ? existing.level
          : deriveContributionLevel(count, maxPositiveCount);
    days.push({ date: iso, contributionCount: count, level });
  }

  const summary = computeActivitySummary(days);

  // Align into exact Sunday (0) .. Saturday (6) calendar week columns
  const firstDow = new Date(startMs).getUTCDay(); // 0=Sun..6=Sat
  const weeks: ActivityWeekSlot[] = [];
  let currentWeekDays: Array<ContributionDay | null> = new Array(firstDow).fill(null);
  let weekStartIso = toUtcIsoDate(startMs - firstDow * ONE_DAY_MS);

  for (const day of days) {
    currentWeekDays.push(day);
    if (currentWeekDays.length === 7) {
      weeks.push({ startDate: weekStartIso, days: currentWeekDays });
      const nextWeekStartMs = parseUtcIsoDate(weekStartIso)! + 7 * ONE_DAY_MS;
      weekStartIso = toUtcIsoDate(nextWeekStartMs);
      currentWeekDays = [];
    }
  }
  if (currentWeekDays.length > 0) {
    while (currentWeekDays.length < 7) {
      currentWeekDays.push(null);
    }
    weeks.push({ startDate: weekStartIso, days: currentWeekDays });
  }

  // Place month labels strictly aligned to week columns containing the 1st of a month
  // (or opening partial month if >= 3 days appear and next label is >= 2 columns away).
  const months: ActivityMonthLabel[] = [];
  const seenMonths = new Set<string>();
  let lastPlacedWeek = -99;

  for (let wIdx = 0; wIdx < weeks.length; wIdx++) {
    const nonNull = weeks[wIdx].days.filter((d): d is ContributionDay => Boolean(d));
    if (nonNull.length === 0) continue;

    // Prefer the day that is the 1st of the month in this week
    const firstOfMonth = nonNull.find((d) => d.date.endsWith('-01'));
    const candidateDay = firstOfMonth || (wIdx === 0 ? nonNull[0] : undefined);
    if (!candidateDay) continue;

    const monthKey = candidateDay.date.slice(0, 7);
    if (seenMonths.has(monthKey)) continue;

    // Avoid crowding the opening partial month if month 1 transitions immediately on week 1 or 2
    if (wIdx === 0 && !firstOfMonth) {
      const daysInOpenMonth = nonNull.filter((d) => d.date.slice(0, 7) === monthKey).length;
      if (daysInOpenMonth < 4) continue;
    }

    if (wIdx - lastPlacedWeek < 2) continue;

    seenMonths.add(monthKey);
    lastPlacedWeek = wIdx;
    months.push({
      monthKey,
      weekIndex: wIdx,
      label: formatMonthShort(monthKey, locale),
    });
  }

  return {
    available: true,
    username: params.username,
    githubUrl: params.githubUrl,
    source: params.source,
    isLive: params.isLive,
    fetchedAt: params.fetchedAt,
    periodStart,
    periodEnd,
    days,
    weeks,
    months,
    summary,
  };
}

/**
 * Resolves verified GitHub contribution activity strictly for the configured `identity.github` account.
 * Precedence:
 *   1. Explicit opt-out (`activity.enabled === false`) -> unavailable
 *   2. Explicit Admin/Supabase `activity.days` matching the configured GitHub username -> normalized dataset
 *   3. Documented build-time verified snapshot (`github-activity.snapshot.json`) IF & ONLY IF username matches configured GitHub account
 *   4. Otherwise -> honest unavailable state (zero fabricated/fallback stats)
 */
export function resolvePortfolioActivity(
  data?: {
    identity?: { github?: { handle?: string; url?: string } };
    activity?: {
      enabled?: boolean;
      username?: string;
      source?: ActivitySourceType;
      fetchedAt?: string;
      days?: ContributionDay[];
    };
  } | null,
  locale: Locale = 'en',
  snapshotOverride?: RawActivitySnapshot | null,
  todayUtc?: string,
): ActivityResolution {
  const github = data?.identity?.github;
  const configuredUser = extractGithubUsername(github);
  const githubUrl = String(github?.url || '').trim() || (configuredUser ? `https://github.com/${configuredUser}` : '');

  if (!configuredUser) {
    return { available: false, reason: 'no-account', username: '', githubUrl };
  }

  const cfg = data?.activity;

  if (cfg && cfg.enabled === false) {
    return { available: false, reason: 'disabled', username: configuredUser, githubUrl };
  }

  // 1. Admin / Supabase configured normalized daily dataset
  if (cfg && Array.isArray(cfg.days)) {
    const cfgUser = String(cfg.username || '').replace(/^@/, '').trim();
    if (cfgUser && cfgUser.toLowerCase() !== configuredUser.toLowerCase()) {
      return { available: false, reason: 'account-mismatch', username: configuredUser, githubUrl };
    }
    if (cfg.days.length === 0) {
      return { available: false, reason: 'empty', username: configuredUser, githubUrl, fetchedAt: cfg.fetchedAt };
    }
    const normalized = normalizeContributionDataset({
      username: configuredUser,
      githubUrl,
      source: cfg.source || 'admin-configured',
      isLive: false,
      fetchedAt: cfg.fetchedAt || '',
      rawDays: cfg.days,
      locale,
      todayUtc,
    });
    if (!normalized) {
      return { available: false, reason: 'empty', username: configuredUser, githubUrl, fetchedAt: cfg.fetchedAt };
    }
    return normalized;
  }

  // 2. Documented verified build snapshot for the exact configured account
  const snap = snapshotOverride === undefined ? (snapshotRaw as RawActivitySnapshot) : snapshotOverride;
  if (snap && Array.isArray(snap.days) && snap.days.length > 0 && snap.username) {
    if (snap.username.toLowerCase() !== configuredUser.toLowerCase()) {
      return { available: false, reason: 'account-mismatch', username: configuredUser, githubUrl };
    }
    const normalized = normalizeContributionDataset({
      username: configuredUser,
      githubUrl,
      source: (snap.source as ActivitySourceType) || 'snapshot',
      isLive: false,
      fetchedAt: snap.fetchedAt || '',
      rawDays: snap.days,
      locale,
      todayUtc,
    });
    if (!normalized) {
      return { available: false, reason: 'empty', username: configuredUser, githubUrl, fetchedAt: snap.fetchedAt };
    }
    return normalized;
  }

  return { available: false, reason: 'unavailable', username: configuredUser, githubUrl };
}
