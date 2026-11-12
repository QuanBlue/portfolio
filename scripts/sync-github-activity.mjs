/**
 * Build-time GitHub Contribution Calendar Synchronization Script
 * Retrieves verified daily contribution data strictly for the configured `identity.github` account.
 * Supports authenticated GitHub GraphQL (when GITHUB_TOKEN env var is available in CI/server)
 * and GitHub's public contribution calendar HTML endpoint without ever exposing tokens to client bundles.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_FILE = path.join(ROOT, 'src', 'data', 'github-activity.snapshot.json');

const args = process.argv.slice(2);
const argUsername = args.find((a) => a.startsWith('--username='))?.split('=')[1];
const keepExisting = args.includes('--keep-existing');

export function extractConfiguredGithubUsername() {
  if (argUsername) return argUsername.replace(/^@/, '').trim();

  const contentPath = path.join(ROOT, 'src', 'data', 'content.json');
  if (fs.existsSync(contentPath)) {
    try {
      const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
      const url = String(content?.identity?.github?.url || '');
      const urlMatch = url.match(/github\.com\/([A-Za-z0-9-]+)/i);
      if (urlMatch?.[1]) return urlMatch[1];
      const handle = String(content?.identity?.github?.handle || '').replace(/^@/, '').trim();
      if (handle) return handle;
    } catch {}
  }

  const portfolioPath = path.join(ROOT, 'src', 'data', 'portfolio.ts');
  const src = fs.readFileSync(portfolioPath, 'utf8');
  const block = src.match(/github:\s*\{\s*handle:\s*'([^']+)'\s*,\s*url:\s*'([^']+)'/);
  if (block?.[2]) {
    const urlMatch = block[2].match(/github\.com\/([A-Za-z0-9-]+)/i);
    if (urlMatch?.[1]) return urlMatch[1];
  }
  if (block?.[1]) {
    return block[1].replace(/^@/, '').trim();
  }
  throw new Error('Could not determine configured identity.github username from portfolio config.');
}

function mapGraphqlLevel(level) {
  switch (level) {
    case 'FOURTH_QUARTILE':
      return 4;
    case 'THIRD_QUARTILE':
      return 3;
    case 'SECOND_QUARTILE':
      return 2;
    case 'FIRST_QUARTILE':
      return 1;
    default:
      return 0;
  }
}

async function fetchViaGraphQL(username, token) {
  const query = `query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'portfolio-activity-sync',
    },
    body: JSON.stringify({ query, variables: { login: username } }),
  });
  if (!res.ok) {
    throw new Error(`GitHub GraphQL responded with HTTP ${res.status}`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`GitHub GraphQL error: ${json.errors[0].message}`);
  }
  const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal || !Array.isArray(cal.weeks)) {
    throw new Error(`No contributionCalendar returned for user "${username}"`);
  }
  const days = [];
  for (const w of cal.weeks) {
    for (const d of w.contributionDays || []) {
      days.push({
        date: String(d.date),
        contributionCount: Number(d.contributionCount) || 0,
        level: mapGraphqlLevel(d.contributionLevel),
      });
    }
  }
  return {
    source: 'github-graphql',
    declaredTotal: Number(cal.totalContributions) || 0,
    days,
  };
}

async function fetchViaPublicCalendar(username) {
  const url = `https://github.com/users/${encodeURIComponent(username)}/contributions`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'portfolio-activity-sync',
      Accept: 'text/html',
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub contributions calendar HTTP ${res.status}`);
  }
  const html = await res.text();
  const h2 = html.match(/([\d,]+)\s+contributions?\s+in\s+the\s+last\s+year/i);
  const declaredTotal = h2 ? Number(h2[1].replace(/,/g, '')) : null;

  const byId = new Map();
  const tdRegex = /<td\b([^>]*)>/gi;
  for (const m of html.matchAll(tdRegex)) {
    const attrs = m[1];
    const idM = attrs.match(/id="(contribution-day-component-[^"]+)"/);
    const dateM = attrs.match(/data-date="(\d{4}-\d{2}-\d{2})"/);
    const levelM = attrs.match(/data-level="([0-4])"/);
    if (idM && dateM) {
      byId.set(idM[1], {
        date: dateM[1],
        contributionCount: 0,
        level: levelM ? Number(levelM[1]) : 0,
      });
    }
  }

  const tipRegex = /<tool-tip\b[^>]*\bfor="(contribution-day-component-[^"]+)"[^>]*>([^<]+)<\/tool-tip>/gi;
  let tooltipMatches = 0;
  for (const m of html.matchAll(tipRegex)) {
    const entry = byId.get(m[1]);
    if (!entry) continue;
    tooltipMatches++;
    const countM = m[2].trim().match(/^([\d,]+)\s+contribution/i);
    entry.contributionCount = countM ? Number(countM[1].replace(/,/g, '')) : 0;
  }

  if (byId.size < 300 || tooltipMatches === 0) {
    throw new Error(`Unexpected public GitHub calendar markup for "${username}" (cells=${byId.size}, tips=${tooltipMatches})`);
  }

  return {
    source: 'github-public-calendar',
    declaredTotal,
    days: Array.from(byId.values()),
  };
}

async function main() {
  const username = extractConfiguredGithubUsername();
  if (!username) {
    throw new Error('Configured GitHub username is empty.');
  }

  const token = process.env.GITHUB_TOKEN?.trim();
  let retrieved;
  if (token) {
    try {
      retrieved = await fetchViaGraphQL(username, token);
    } catch (err) {
      console.warn(`[sync-github-activity] GraphQL failed (${err.message}); falling back to public calendar...`);
      retrieved = await fetchViaPublicCalendar(username);
    }
  } else {
    retrieved = await fetchViaPublicCalendar(username);
  }

  const todayUtc = new Date().toISOString().slice(0, 10);
  const days = retrieved.days
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date) && d.date <= todayUtc)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (days.length === 0) {
    throw new Error(`Zero valid calendar days returned for "${username}"`);
  }

  const calculatedTotal = days.reduce((s, d) => s + (Number(d.contributionCount) || 0), 0);
  if (typeof retrieved.declaredTotal === 'number' && retrieved.declaredTotal !== calculatedTotal) {
    console.warn(
      `[sync-github-activity] Note: GitHub header total (${retrieved.declaredTotal}) differs from daily sum up to ${todayUtc} (${calculatedTotal}) — summary uses normalized daily sum.`,
    );
  }

  const payload = {
    schemaVersion: 1,
    username,
    source: retrieved.source,
    fetchedAt: new Date().toISOString(),
    periodStart: days[0].date,
    periodEnd: days[days.length - 1].date,
    days,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(
    `[sync-github-activity] Saved ${days.length} verified days (${payload.periodStart} -> ${payload.periodEnd}, total=${calculatedTotal}) for @${username} via ${payload.source}.`,
  );
}

main().catch((err) => {
  console.error('[sync-github-activity] Sync error:', err.message);
  if (keepExisting && fs.existsSync(OUT_FILE)) {
    console.warn('[sync-github-activity] --keep-existing active: keeping previous snapshot cleanly.');
    process.exit(0);
  }
  process.exit(1);
});
