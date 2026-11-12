/**
 * Shared GitHub & Portfolio Data Adapter
 * Provides normalized, typed data structures for GitHub-oriented themes (e.g. Knight)
 * without duplicating business logic or mutating the core portfolio store.
 */
import { resolveAvatarUrl, type PortfolioData, type Project } from '../../data/portfolio';
import {
  formatUtcDate,
  resolvePortfolioActivity,
  type ActivityResolution,
  type NormalizedActivityDataset,
} from '../../lib/github-activity';
import type { Locale } from '../../i18n/types';

export interface KnightProjectItem {
  id: string;
  index: string;
  title: string;
  description: string;
  link: string;
  language: string;
  stars: number;
  mark: string;
  glyphs: string;
  pattern: number;
  isFlip: boolean;
  coverData: string;
}

export interface KnightMoreProjectItem {
  name: string;
  stars: number;
  language?: string;
  link: string;
  description: string;
  glyphs: string;
  step: string;
}

export interface KnightActivityData {
  username?: string;
  weeks: number;
  heatmapString: string;
  totalContributions: string;
  activeDays: number;
  longestStreak: string;
  busiestDay: string;
  months: { name: string; index: number; offset: number; isOld?: boolean }[];
}

export interface KnightProfileData {
  name: string;
  headline: string;
  leadBio: string;
  detailedBio: string;
  location: string;
  email: string;
  githubUrl: string;
  githubHandle: string;
  linkedinUrl: string;
  avatarUrl: string;
  repoCount: number;
}

/**
 * Authentic baseline repositories for Nguyễn Thanh Quân (@QuanBlue)
 * sourced from public GitHub activity.
 */
export const KNIGHT_FEATURED_PROJECTS: KnightProjectItem[] = [
  {
    id: 'mern-portfolio',
    index: '01 / 06',
    title: 'Mern Portfolio',
    description: 'Builds a portfolio site with MERN stack',
    link: 'https://github.com/QuanBlue/mern-portfolio',
    language: 'JavaScript',
    stars: 5,
    mark: 'MP',
    glyphs: '{}=>;()',
    pattern: 3,
    isFlip: false,
    coverData: JSON.stringify({ mark: 'MP', glyphs: '{}=>;()', lang: 'JavaScript', stars: 5, pattern: 3 }),
  },
  {
    id: 's3-bucket-crud-library',
    index: '02 / 06',
    title: 'S3 Bucket Crud Library',
    description: 'Python library for CRUD on S3-compatible buckets',
    link: 'https://github.com/QuanBlue/s3-bucket-crud-library',
    language: 'Python',
    stars: 3,
    mark: 'SB',
    glyphs: 'def:_()#',
    pattern: 4,
    isFlip: true,
    coverData: JSON.stringify({ mark: 'SB', glyphs: 'def:_()#', lang: 'Python', stars: 3, pattern: 4 }),
  },
  {
    id: 'ubuntu-dotfile',
    index: '03 / 06',
    title: 'Ubuntu Dotfile',
    description: 'Custom Linux settings for Ubuntu',
    link: 'https://github.com/QuanBlue/ubuntu-dotfile',
    language: 'CSS',
    stars: 3,
    mark: 'UD',
    glyphs: '<>/{};#.',
    pattern: 5,
    isFlip: false,
    coverData: JSON.stringify({ mark: 'UD', glyphs: '<>/{};#.', lang: 'CSS', stars: 3, pattern: 5 }),
  },
  {
    id: 'chat-grpc',
    index: '04 / 06',
    title: 'Chat Grpc',
    description: 'CLI chat app using gRPC in Python',
    link: 'https://github.com/QuanBlue/chat-grpc',
    language: 'Python',
    stars: 3,
    mark: 'CG',
    glyphs: 'def:_()#',
    pattern: 0,
    isFlip: true,
    coverData: JSON.stringify({ mark: 'CG', glyphs: 'def:_()#', lang: 'Python', stars: 3, pattern: 0 }),
  },
  {
    id: 'wiki-hub',
    index: '05 / 06',
    title: 'Wiki Hub',
    description: 'Self-hosted wiki alternative to Confluence, built with TypeScript',
    link: 'https://github.com/QuanBlue/wiki-hub',
    language: 'TypeScript',
    stars: 2,
    mark: 'WH',
    glyphs: '{}=>;()',
    pattern: 1,
    isFlip: false,
    coverData: JSON.stringify({ mark: 'WH', glyphs: '{}=>;()', lang: 'TypeScript', stars: 2, pattern: 1 }),
  },
  {
    id: 'devops-ebook',
    index: '06 / 06',
    title: 'Devops Ebook',
    description: 'Curated collection of DevOps industry eBooks',
    link: 'https://github.com/QuanBlue/devops-ebook',
    language: '',
    stars: 2,
    mark: 'DE',
    glyphs: '.:-=+',
    pattern: 2,
    isFlip: true,
    coverData: JSON.stringify({ mark: 'DE', glyphs: '.:-=+', lang: '', stars: 2, pattern: 2 }),
  },
];

export const KNIGHT_MORE_PROJECTS: KnightMoreProjectItem[] = [
  {
    name: 'Readme Template',
    stars: 2,
    link: 'https://github.com/QuanBlue/readme-template',
    description: 'Template for creating structured README files',
    glyphs: '.:-=+',
    step: '0.16',
  },
  {
    name: 'Tech Cheatsheets',
    stars: 2,
    link: 'https://github.com/QuanBlue/tech-cheatsheets',
    description: 'Collection of DevOps and programming cheat sheets',
    glyphs: '.:-=+',
    step: '0.16',
  },
  {
    name: 'Docker Practice Lab',
    stars: 2,
    language: 'HTML',
    link: 'https://github.com/QuanBlue/docker-practice-lab',
    description: 'Docker exercises to learn containerization concepts',
    glyphs: '<>/{};#.',
    step: '0.16',
  },
  {
    name: 'Ansible Web App Deployment',
    stars: 1,
    language: 'Shell',
    link: 'https://github.com/QuanBlue/ansible-web-app-deployment',
    description: 'Auto deploy web application with Ansible in multi base: EC2, VMachine, Container,..',
    glyphs: '$|>&-~',
    step: '0.10',
  },
  {
    name: 'Graphql Mongodb',
    stars: 1,
    language: 'TypeScript',
    link: 'https://github.com/QuanBlue/graphql-mongodb',
    description: 'Example using GraphQL and MongoDB',
    glyphs: '{}=>;()',
    step: '0.10',
  },
  {
    name: 'Vagrant Virtualbox',
    stars: 1,
    language: 'HTML',
    link: 'https://github.com/QuanBlue/vagrant-virtualbox',
    description: 'Automated VM setup with Vagrant and VirtualBox',
    glyphs: '<>/{};#.',
    step: '0.10',
  },
  {
    name: 'Openai Edit Image Application',
    stars: 1,
    language: 'Python',
    link: 'https://github.com/QuanBlue/openai-edit-image-application',
    description: 'Image editing app powered by OpenAI API and Streamlit',
    glyphs: 'def:_()#',
    step: '0.10',
  },
  {
    name: 'QuanBlue',
    stars: 1,
    link: 'https://github.com/QuanBlue/QuanBlue',
    description: 'My README profile',
    glyphs: '.:-=+',
    step: '0.10',
  },
  {
    name: 'Tech Guidebook',
    stars: 1,
    link: 'https://github.com/QuanBlue/tech-guidebook',
    description: 'Collection of Guidebook that instruct how to use technology',
    glyphs: '.:-=+',
    step: '0.10',
  },
  {
    name: 'Miller Rabin',
    stars: 1,
    language: 'C++',
    link: 'https://github.com/QuanBlue/miller-rabin',
    description: 'Miller-Rabin probabilistic primality test.',
    glyphs: '*&;{}#<>',
    step: '0.10',
  },
  {
    name: 'Ansible Roles',
    stars: 1,
    language: 'Jinja',
    link: 'https://github.com/QuanBlue/ansible-roles',
    description: 'Reusable Ansible roles.',
    glyphs: 'jinja.:',
    step: '0.10',
  },
  {
    name: 'K8s Auto Setup',
    stars: 1,
    language: 'Ruby',
    link: 'https://github.com/QuanBlue/k8s-auto-setup',
    description: 'Auto setup k8s cluster with 1 master and 2 workers',
    glyphs: 'do|:@end',
    step: '0.10',
  },
];

export const KNIGHT_ACTIVITY: KnightActivityData = {
  weeks: 53,
  heatmapString:
    '0030330000000030303003000000303300330000000003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000030343333003304304033643400300003000000003000300000000000000000000000000000000000000000000000000334694567669558363475400036840003054303003554440043303043033400343034444345799675779536689944----',
  totalContributions: '1,680',
  activeDays: 111,
  longestStreak: '26 days',
  busiestDay: '124 on Aug 21, 2026',
  months: [
    { name: 'Dec', index: 4, offset: -23, isOld: true },
    { name: 'Jan', index: 8, offset: -19, isOld: true },
    { name: 'Feb', index: 12, offset: -15, isOld: true },
    { name: 'Mar', index: 16, offset: -11, isOld: true },
    { name: 'Apr', index: 21, offset: -6, isOld: true },
    { name: 'May', index: 25, offset: -2, isOld: true },
    { name: 'Jun', index: 30, offset: 3 },
    { name: 'Jul', index: 34, offset: 7 },
    { name: 'Aug', index: 38, offset: 11 },
    { name: 'Sep', index: 43, offset: 16 },
    { name: 'Oct', index: 47, offset: 20 },
    { name: 'Nov', index: 51, offset: 24 },
  ],
};

export const KNIGHT_LANGUAGES = [
  'Astro',
  'C++',
  'CSS',
  'Dockerfile',
  'Go',
  'HTML',
  'JavaScript',
  'Jinja',
  'Python',
  'Ruby',
  'Shell',
  'TypeScript',
];

export function getLanguageGlyphs(lang?: string): string {
  const l = (lang || '').toLowerCase();
  if (l.includes('python')) return 'def:_()#';
  if (l.includes('java') || l.includes('type') || l.includes('react') || l.includes('node')) return '{}=>;()';
  if (l.includes('html') || l.includes('css') || l.includes('xml')) return '<>/{};#.';
  if (l.includes('bash') || l.includes('shell') || l.includes('sh') || l.includes('linux')) return '$|>&-~';
  if (l.includes('c++') || l.includes('c#') || l.includes('c') || l.includes('rust')) return '*&;{}#<>';
  if (l.includes('ansible') || l.includes('yaml') || l.includes('jinja')) return '-:[]{}#~';
  if (l.includes('docker') || l.includes('k8s') || l.includes('kube')) return '|/-_.:+';
  return '{}=>;()';
}

/**
 * Resolves verified GitHub activity resolution for the configured `identity.github` account.
 */
export function getKnightActivityResolution(
  data?: Partial<PortfolioData> | null,
  locale: Locale = 'en',
): ActivityResolution {
  return resolvePortfolioActivity(data, locale);
}

/**
 * Projects a verified NormalizedActivityDataset into the legacy KnightActivityData view
 * (also consumed cleanly by ASCII/Forkfolio summary renderers), or returns null if unavailable.
 */
export function getKnightActivity(
  data?: Partial<PortfolioData> | null,
  locale: Locale = 'en',
): KnightActivityData | null {
  const res = resolvePortfolioActivity(data, locale);
  if (!res.available) {
    return null;
  }
  return toLegacyActivityData(res, locale);
}

const LEVEL_TO_DIGIT = ['0', '2', '4', '6', '9'] as const;

export function toLegacyActivityData(
  res: NormalizedActivityDataset,
  locale: Locale = 'en',
): KnightActivityData {
  const heatmapString = res.weeks
    .map((w) => w.days.map((d) => (d ? LEVEL_TO_DIGIT[d.level ?? 0] ?? '0' : '-')).join(''))
    .join('');

  return {
    username: res.username,
    weeks: res.weeks.length,
    heatmapString,
    totalContributions: new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(
      res.summary.totalContributions,
    ),
    activeDays: res.summary.activeDays,
    longestStreak: `${res.summary.longestStreak} ${
      locale === 'vi' ? 'ngày' : res.summary.longestStreak === 1 ? 'day' : 'days'
    }`,
    busiestDay: res.summary.busiestDay
      ? `${res.summary.busiestDay.count} (${formatUtcDate(res.summary.busiestDay.date, locale)})`
      : '—',
    months: res.months.map((m) => ({
      name: m.label,
      index: m.weekIndex,
      offset: m.weekIndex - Math.max(0, res.weeks.length - 26),
      isOld: m.weekIndex < Math.max(0, res.weeks.length - 26),
    })),
  };
}

/**
 * Parses a flat heatmap string into a [weeks][7] matrix of intensity levels (0..4).
 */
export function parseHeatmapWeeks(heatmapString: string, weeks = 52): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < weeks; i++) {
    const week: number[] = [];
    for (let d = 0; d < 7; d++) {
      const val = Number(heatmapString[i * 7 + d]) || 0;
      const lvl = val === 0 ? 0 : val <= 3 ? 1 : val <= 5 ? 2 : val <= 7 ? 3 : 4;
      week.push(lvl);
    }
    result.push(week);
  }
  return result;
}

/**
 * Returns normalized profile details for Knight using live PortfolioData.
 * Uses canonical `resolveAvatarUrl` and never substitutes hardcoded sample/meme images.
 */
export function getKnightProfile(data: PortfolioData): KnightProfileData {
  const i = data.identity;
  const projectCount = data.projects?.length || 0;
  return {
    name: i.name || 'Nguyen Thanh Quan',
    headline: i.role || 'DevOps & Infrastructure Engineer',
    leadBio: i.bio || '',
    detailedBio: i.bio || '',
    location: i.location || 'Ho Chi Minh, VN',
    email: i.email || '',
    githubUrl: i.github?.url || '',
    githubHandle: i.github?.handle?.replace(/^@/, '') || '',
    linkedinUrl: i.linkedin?.url || '',
    avatarUrl: resolveAvatarUrl(data),
    repoCount: projectCount,
  };
}

/**
 * Resolves featured projects strictly from database-configured portfolioData.
 * Does NOT append un-curated GitHub repositories.
 */
export function getKnightProjects(data: PortfolioData): KnightProjectItem[] {
  if (!data?.projects || data.projects.length === 0) {
    return [];
  }

  const total = data.projects.length;
  const totalFormatted = String(Math.min(6, total)).padStart(2, '0');

  // Map up to 6 curated projects from database
  return data.projects.slice(0, 6).map((p, idx): KnightProjectItem => {
    // Preserve title verbatim as saved in database / Admin
    const title = p.title || `Project ${idx + 1}`;

    const mark =
      title
        .split(/[-_\s]+/)
        .map((w) => w[0]?.toUpperCase())
        .filter(Boolean)
        .slice(0, 2)
        .join('') || 'PR';

    const lang = p.tags?.[0] || '';
    const glyphs = getLanguageGlyphs(lang);
    const pattern = idx % 6;

    return {
      id: p.id || `p-${idx}`,
      index: `${String(idx + 1).padStart(2, '0')} / ${totalFormatted}`,
      title,
      description: p.shortDesc || p.description || '',
      link: p.link || '',
      language: lang,
      stars: 0,
      mark,
      glyphs,
      pattern,
      isFlip: idx % 2 === 1,
      coverData: JSON.stringify({ mark, glyphs, lang, stars: 0, pattern }),
    };
  });
}

/**
 * Resolves remaining curated projects (> 6) exclusively from database-configured portfolioData.
 */
export function getKnightMoreProjects(data: PortfolioData): KnightMoreProjectItem[] {
  if (!data?.projects || data.projects.length <= 6) {
    return [];
  }

  return data.projects.slice(6).map((p, idx): KnightMoreProjectItem => {
    const lang = p.tags?.[0] || '';
    return {
      name: p.title,
      stars: 0,
      language: lang,
      link: p.link || '',
      description: p.shortDesc || p.description || '',
      glyphs: getLanguageGlyphs(lang),
      step: '0.10',
    };
  });
}
