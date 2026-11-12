import {
  getCareerSettings,
  resolveAvatarUrl,
  type Certification,
  type EducationItem,
  type ExperienceItem,
  type PortfolioData,
  type Project,
  type Skill,
} from '../../data/portfolio';
import { esc, groupSkillsByCategory, initials, safeUrl } from '../../lib/render';
import { getKnightActivity, parseHeatmapWeeks } from '../../themes/core/data-adapter';

export const MONTH_MARKERS = [
  { name: 'Dec', week: 0 },
  { name: 'Jan', week: 4 },
  { name: 'Feb', week: 8 },
  { name: 'Mar', week: 13 },
  { name: 'Apr', week: 17 },
  { name: 'May', week: 21 },
  { name: 'Jun', week: 26 },
  { name: 'Jul', week: 30 },
  { name: 'Aug', week: 35 },
  { name: 'Sep', week: 39 },
  { name: 'Oct', week: 43 },
  { name: 'Nov', week: 48 },
];

export function deriveRepoLabel(link: string, fallbackHandle: string, title: string): string {
  const clean = String(link || '').trim();
  if (/^https?:\/\//i.test(clean)) {
    try {
      const u = new URL(clean);
      const path = u.pathname.replace(/^\/+|\/+$/g, '');
      return path ? `${u.hostname}/${path}` : u.hostname;
    } catch {
      return clean;
    }
  }
  const handle = String(fallbackHandle || '').replace(/^@/, '').trim();
  return handle ? `github.com/${handle}/${title}` : title;
}

export function renderAsciiAvatarImgOrFallback(data: PortfolioData): string {
  const url = resolveAvatarUrl(data);
  const name = data.identity?.name || '';
  if (!url) {
    return `<div class="w-full h-full flex flex-col items-center justify-center bg-[var(--muted-bg)] text-center p-4">
      <span class="font-mono text-5xl font-black text-[var(--signal)]">${esc(initials(name))}</span>
      <span class="mt-2 text-[10px] font-mono text-[var(--muted-fg)] uppercase">[ NO_AVATAR_IMAGE ]</span>
    </div>`;
  }
  return `<img id="ascii-hero-avatar-img" src="${esc(safeUrl(url))}" alt="${esc(name)}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" data-bind="avatar" onerror="this.style.display='none';const f=this.nextElementSibling;if(f)f.style.display='flex';" />
  <div style="display:none" class="w-full h-full flex-col items-center justify-center bg-[var(--muted-bg)] text-center p-4">
    <span class="font-mono text-5xl font-black text-[var(--signal)]">${esc(initials(name))}</span>
    <span class="mt-2 text-[10px] font-mono text-[var(--muted-fg)] uppercase">[ AVATAR_LOAD_FAILED ]</span>
  </div>`;
}

export function renderAsciiProjectsHtml(
  projects: Project[],
  fallbackHandle: string,
  locale: 'en' | 'vi' = 'en',
): string {
  if (!projects || projects.length === 0) {
    return `<div class="p-8 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] text-xs font-mono text-[var(--muted-fg)]">${esc(locale === 'vi' ? '[ Chưa có dự án đăng tải ]' : '[ No published projects ]')}</div>`;
  }

  const total = String(projects.length).padStart(2, '0');
  return projects
    .map((p, idx) => {
      const abbr = p.title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'PR';
      const num = String(idx + 1).padStart(2, '0');
      const statusLabel =
        p.status === 'ONLINE'
          ? locale === 'vi'
            ? '● ĐANG HOẠT ĐỘNG'
            : '● PRODUCTION ACTIVE'
          : esc(p.status || 'MAINTENANCE');
      const repoLabel = deriveRepoLabel(p.link, fallbackHandle, p.title);
      return `<article class="ff-cross-box rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 hover:border-[var(--line-strong)] transition shadow-sm">
        <span class="ff-cross-tl">+</span>
        <span class="ff-cross-tr">+</span>
        <span class="ff-cross-bl">+</span>
        <span class="ff-cross-br">+</span>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div class="lg:col-span-8 space-y-4">
            <div class="flex flex-wrap items-center gap-3 text-xs text-[var(--muted-fg)]">
              <span class="font-bold text-[var(--signal)]">[ ${num} / ${total} ]</span>
              <span>::</span>
              <span class="uppercase tracking-wider">${statusLabel}</span>
            </div>
            <h3 class="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[var(--fg)]">${esc(p.title)}</h3>
            <p class="text-xs sm:text-sm text-[var(--muted-fg)] leading-relaxed font-sans">${esc(p.description || p.shortDesc)}</p>
            <div class="flex flex-wrap gap-2 pt-2">
              ${(p.tags || [])
                .map(
                  (tag) =>
                    `<span class="ff-tag"><span class="text-[var(--signal)]">#</span><span>${esc(tag)}</span></span>`,
                )
                .join('')}
            </div>
            <div class="flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--border)] text-xs">
              <a href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener noreferrer" class="ff-btn ff-btn-primary">
                <span>[ view_repo ↗ ]</span>
              </a>
              <button type="button" data-project-trigger="${esc(p.id)}" class="ff-btn">
                <span>[ inspect_details ]</span>
              </button>
            </div>
          </div>
          <div class="lg:col-span-4 flex justify-center lg:justify-end">
            <div class="w-full sm:w-64 aspect-video sm:aspect-square rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--muted-bg)]/60 flex flex-col items-center justify-center p-6 text-center group">
              <div class="text-[10px] text-[var(--muted-fg)] uppercase tracking-wider mb-2">+--- NODE_TARGET ---+</div>
              <span class="text-4xl sm:text-6xl font-black text-[var(--fg)] tracking-tight group-hover:text-[var(--signal)] transition-colors">${esc(abbr)}</span>
              <span class="text-xs text-[var(--muted-fg)] mt-2">${esc((p.tags || [])[0] || 'Project')} · ${esc(p.status)}</span>
              <span class="text-[11px] text-[var(--signal)] mt-1 opacity-80 break-all max-w-full">${esc(repoLabel)}</span>
              <div class="text-[10px] text-[var(--muted-fg)] uppercase tracking-wider mt-2">+-------------------+</div>
            </div>
          </div>
        </div>
      </article>`;
    })
    .join('');
}

export function renderAsciiExperienceHtml(
  experience: ExperienceItem[],
  locale: 'en' | 'vi' = 'en',
): string {
  if (!experience || experience.length === 0) {
    return `<div class="p-8 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] text-xs font-mono text-[var(--muted-fg)]">${esc(locale === 'vi' ? '[ Chưa có kinh nghiệm đăng tải ]' : '[ No published experience ]')}</div>`;
  }

  const total = String(experience.length).padStart(2, '0');
  return experience
    .map((exp, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      const currentLabel = locale === 'vi' ? 'VỊ TRÍ HIỆN TẠI' : 'CURRENT ROLE';
      return `<article class="ff-cross-box rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 hover:border-[var(--line-strong)] transition">
        <span class="ff-cross-tl">+</span>
        <span class="ff-cross-tr">+</span>
        <span class="ff-cross-bl">+</span>
        <span class="ff-cross-br">+</span>
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div class="md:col-span-4 space-y-2">
            <span class="text-xs text-[var(--muted-fg)] block">[ ${num} / ${total} ]</span>
            <div class="text-sm sm:text-base font-bold text-[var(--fg)]">${esc(exp.period)}</div>
            ${
              exp.isCurrent
                ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--signal)]/40 bg-emerald-500/10 text-[11px] font-semibold text-[var(--signal)]"><span class="size-1.5 rounded-full bg-[var(--signal)] animate-pulse"></span>${esc(currentLabel)}</span>`
                : ''
            }
          </div>
          <div class="md:col-span-8 space-y-4">
            <div>
              <h3 class="text-xl sm:text-2xl font-black text-[var(--fg)] tracking-tight">${esc(exp.role)}</h3>
              <p class="text-sm font-semibold text-[var(--signal)] mt-0.5">&gt; @ ${esc(exp.company)}</p>
            </div>
            <ul class="space-y-2 text-xs sm:text-sm text-[var(--muted-fg)] leading-relaxed font-sans">
              ${(exp.bullets || [])
                .map(
                  (b) =>
                    `<li class="flex items-start gap-2.5"><span class="font-mono text-[var(--signal)] select-none shrink-0 mt-0.5">[*]</span><span>${esc(b)}</span></li>`,
                )
                .join('')}
            </ul>
            <div class="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
              ${(exp.tags || [])
                .map(
                  (t) =>
                    `<span class="ff-tag"><span class="text-[var(--signal)]">#</span><span>${esc(t)}</span></span>`,
                )
                .join('')}
            </div>
          </div>
        </div>
      </article>`;
    })
    .join('');
}

export function renderAsciiEducationHtml(
  education: EducationItem[],
  locale: 'en' | 'vi' = 'en',
): string {
  if (!education || education.length === 0) {
    return `<div class="md:col-span-2 p-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] text-xs font-mono text-[var(--muted-fg)]">${esc(locale === 'vi' ? '[ Chưa có học vấn đăng tải ]' : '[ No published education ]')}</div>`;
  }

  return education
    .map(
      (ed, idx) => `<article class="ff-cross-box rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-7 space-y-4 hover:border-[var(--line-strong)] transition">
        <span class="ff-cross-tl">+</span>
        <span class="ff-cross-tr">+</span>
        <span class="ff-cross-bl">+</span>
        <span class="ff-cross-br">+</span>
        <div class="flex items-center justify-between text-xs border-b border-[var(--border)] pb-3">
          <span class="px-2.5 py-0.5 rounded bg-[var(--muted-bg)] text-[var(--signal)] font-bold">[${esc(ed.badge || `DEGREE_0${idx + 1}`)}]</span>
          <span class="text-[var(--muted-fg)]">${esc(ed.period)}</span>
        </div>
        <div>
          <h3 class="text-lg sm:text-xl font-bold text-[var(--fg)]">${esc(ed.degree)}</h3>
          <p class="text-xs text-[var(--signal)] font-medium mt-1">&gt; ${esc(ed.school)}</p>
        </div>
        <p class="text-xs sm:text-sm text-[var(--muted-fg)] leading-relaxed font-sans">${esc(ed.description)}</p>
      </article>`,
    )
    .join('');
}

export function renderAsciiCertificationsHtml(
  certs: Certification[],
  locale: 'en' | 'vi' = 'en',
): string {
  if (!certs || certs.length === 0) {
    return `<p class="text-xs font-mono text-[var(--muted-fg)] col-span-full">${esc(locale === 'vi' ? '[ Chưa có chứng chỉ đăng tải ]' : '[ No published certifications ]')}</p>`;
  }
  return certs
    .map(
      (c) => `<article class="ff-cross-box rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-2">
        <span class="ff-cross-tl">+</span>
        <span class="ff-cross-tr">+</span>
        <span class="ff-cross-bl">+</span>
        <span class="ff-cross-br">+</span>
        <div class="flex items-center justify-between text-[11px] font-mono">
          <span class="text-[var(--signal)] font-bold">[ CREDENTIAL ]</span>
          ${c.issueDate ? `<span class="text-[var(--muted-fg)]">${esc(c.issueDate)}</span>` : ''}
        </div>
        <h4 class="text-sm font-bold text-[var(--fg)]">${esc(c.name)}</h4>
        <p class="text-xs text-[var(--muted-fg)]">${esc(c.issuer)}</p>
        ${c.credentialId ? `<p class="text-[11px] text-[var(--muted-fg)] font-mono">ID: ${esc(c.credentialId)}</p>` : ''}
        ${
          c.credentialUrl
            ? `<a href="${esc(safeUrl(c.credentialUrl))}" target="_blank" rel="noopener noreferrer" class="inline-block text-xs text-[var(--signal)] hover:underline">[ verify ↗ ]</a>`
            : ''
        }
      </article>`,
    )
    .join('');
}

export function renderAsciiSkillGroupsHtml(skills: Skill[], locale: 'en' | 'vi' = 'en'): string {
  const groups = groupSkillsByCategory(skills || [], locale);
  if (groups.length === 0) {
    return `<p class="col-span-full text-xs font-mono text-[var(--muted-fg)]">${esc(locale === 'vi' ? '[ Chưa có kỹ năng đăng tải ]' : '[ No published skills ]')}</p>`;
  }

  return groups
    .map(
      (group, idx) => `<div class="ff-cross-box rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4 hover:border-[var(--line-strong)] transition">
        <span class="ff-cross-tl">+</span>
        <span class="ff-cross-tr">+</span>
        <span class="ff-cross-bl">+</span>
        <span class="ff-cross-br">+</span>
        <div class="text-xs text-[var(--muted-fg)] border-b border-[var(--border)] pb-2 flex items-center justify-between">
          <span class="text-[var(--signal)] font-bold">// ${String(idx + 1).padStart(2, '0')}</span>
          <span>${locale === 'vi' ? 'NHÓM' : 'MODULE'}</span>
        </div>
        <div>
          <h3 class="text-base font-bold text-[var(--fg)] tracking-tight">${esc(group.category)}</h3>
          <p class="text-xs text-[var(--muted-fg)] mt-1 leading-relaxed font-mono">${group.items.length} ${locale === 'vi' ? 'kỹ năng công khai' : `published tool${group.items.length === 1 ? '' : 's'}`}</p>
        </div>
        <div class="space-y-2 pt-2 border-t border-[var(--border)]">
          ${group.items
            .map(
              (item) => `<div class="flex items-center justify-between text-xs gap-2">
            <span class="${item.status === 'ACTIVE' ? 'font-semibold text-[var(--fg)]' : 'text-[var(--muted-fg)]'}">${esc(item.name)}</span>
            <span class="text-[10px] text-[var(--signal)] opacity-80">${esc(item.tag || `[${item.status}]`)}</span>
          </div>`,
            )
            .join('')}
        </div>
      </div>`,
    )
    .join('');
}

export function renderAsciiSkillChipsHtml(skills: Skill[], locale: 'en' | 'vi' = 'en'): string {
  if (!skills || skills.length === 0) {
    return `<p class="text-xs font-mono text-[var(--muted-fg)]">${esc(locale === 'vi' ? '[ Chưa có kỹ năng đăng tải ]' : '[ No published skills ]')}</p>`;
  }
  return skills
    .map(
      (s) => `<div class="ff-btn !cursor-default">
        <span class="size-1.5 rounded-full ${s.status === 'ACTIVE' ? 'bg-[var(--signal)]' : 'bg-amber-400'}"></span>
        <span class="font-semibold text-[var(--fg)]">${esc(s.name)}</span>
        <span class="text-[10px] text-[var(--muted-fg)]">[${esc(s.tag)}]</span>
      </div>`,
    )
    .join('');
}

export function renderAsciiActivityHtml(data: PortfolioData, locale: 'en' | 'vi' = 'en'): string {
  const activity = getKnightActivity(data);
  const githubUrl = safeUrl(data.identity?.github?.url || '#');
  const githubHandle = data.identity?.github?.handle || 'GitHub';
  const career = getCareerSettings(data);

  const summaryCards = `<div class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
    <div class="ff-cross-box rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <span class="ff-cross-tl">+</span><span class="ff-cross-tr">+</span><span class="ff-cross-bl">+</span><span class="ff-cross-br">+</span>
      <span class="text-[11px] text-[var(--muted-fg)] uppercase block">${locale === 'vi' ? 'Dự án' : 'Published Projects'}</span>
      <span class="text-2xl sm:text-3xl font-black text-[var(--signal)] mt-1 block">${(data.projects || []).length}</span>
      <span class="text-[10px] text-[var(--muted-fg)] mt-1 block">${locale === 'vi' ? 'từ nguồn dữ liệu chính' : 'canonical portfolio items'}</span>
    </div>
    <div class="ff-cross-box rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <span class="ff-cross-tl">+</span><span class="ff-cross-tr">+</span><span class="ff-cross-bl">+</span><span class="ff-cross-br">+</span>
      <span class="text-[11px] text-[var(--muted-fg)] uppercase block">${locale === 'vi' ? 'Kỹ năng' : 'Active Skills'}</span>
      <span class="text-2xl sm:text-3xl font-black text-[var(--fg)] mt-1 block">${(data.skills || []).length}</span>
      <span class="text-[10px] text-[var(--muted-fg)] mt-1 block">${locale === 'vi' ? 'đang sử dụng' : 'configured modules'}</span>
    </div>
    <div class="ff-cross-box rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <span class="ff-cross-tl">+</span><span class="ff-cross-tr">+</span><span class="ff-cross-bl">+</span><span class="ff-cross-br">+</span>
      <span class="text-[11px] text-[var(--muted-fg)] uppercase block">${locale === 'vi' ? 'Kinh nghiệm & Học vấn' : 'Experience & Edu'}</span>
      <span class="text-2xl sm:text-3xl font-black text-[var(--fg)] mt-1 block">${(data.experience || []).length} / ${(data.education || []).length}</span>
      <span class="text-[10px] text-[var(--muted-fg)] mt-1 block">${locale === 'vi' ? 'mốc đã xuất bản' : 'published timeline records'}</span>
    </div>
    <div class="ff-cross-box rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <span class="ff-cross-tl">+</span><span class="ff-cross-tr">+</span><span class="ff-cross-bl">+</span><span class="ff-cross-br">+</span>
      <span class="text-[11px] text-[var(--muted-fg)] uppercase block">${locale === 'vi' ? 'Trạng thái CV' : 'Career Status'}</span>
      <span class="text-xl sm:text-2xl font-black text-[var(--signal)] mt-1 block">${career.openToWork ? 'OPEN' : 'FOCUSED'}</span>
      <span class="text-[10px] text-[var(--muted-fg)] mt-1 block">${career.openToWork ? (locale === 'vi' ? 'Sẵn sàng cơ hội mới' : 'Available for opportunities') : (locale === 'vi' ? 'Không hiển thị công khai CV' : 'Public CV hidden')}</span>
    </div>
  </div>`;

  if (!activity) {
    return `${summaryCards}
    <div class="ff-cross-box rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
      <span class="ff-cross-tl">+</span><span class="ff-cross-tr">+</span><span class="ff-cross-bl">+</span><span class="ff-cross-br">+</span>
      <div class="space-y-1 text-xs">
        <p class="font-bold text-[var(--fg)]">[ NO GITHUB TELEMETRY STREAM CONFIGURED ]</p>
        <p class="text-[var(--muted-fg)]">${esc(locale === 'vi' ? 'Hoạt động GitHub chưa được cấu hình trong Admin Activity; không hiển thị số liệu giả lập.' : 'GitHub commit telemetry is not configured in Admin Activity; placeholder metrics are disabled.')}</p>
      </div>
      <a href="${esc(githubUrl)}" target="_blank" rel="noopener noreferrer" class="ff-btn ff-btn-primary text-xs">
        <span>[ ${esc(githubHandle)} ↗ ]</span>
      </a>
    </div>`;
  }

  const weeks = parseHeatmapWeeks(activity.heatmapString, activity.weeks || 52);
  const monthsRow = activity.months
    .map((m) => `<span class="absolute top-0 -translate-x-1/2 first:translate-x-0" style="left: calc(2rem + ${(m.index / Math.max(1, weeks.length)) * 100}% * 0.96);">${esc(m.name)}</span>`)
    .join('');
  const weeksHtml = weeks
    .map(
      (week, wIdx) => `<div class="flex flex-col gap-1.5">
        ${week
          .map((lvl, dIdx) => {
            const cellStyle =
              lvl === 0
                ? 'bg-[var(--card)] border border-[var(--border)]/60 hover:border-[var(--signal)]'
                : lvl === 1
                ? 'bg-emerald-950 border border-emerald-800/80 hover:border-emerald-500'
                : lvl === 2
                ? 'bg-emerald-800 border border-emerald-600 hover:border-emerald-400'
                : lvl === 3
                ? 'bg-emerald-600 border border-emerald-400 hover:border-emerald-300'
                : 'bg-emerald-400 border border-emerald-200 shadow-[0_0_6px_rgba(52,211,153,0.4)]';
            return `<span class="size-2.5 rounded-[2px] transition-transform duration-100 hover:scale-150 cursor-pointer ${cellStyle}" title="Week ${wIdx + 1}, Day ${dIdx + 1} · Level ${lvl}"></span>`;
          })
          .join('')}
      </div>`,
    )
    .join('');

  return `${summaryCards}
  <div class="ff-cross-box rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 space-y-6">
    <span class="ff-cross-tl">+</span><span class="ff-cross-tr">+</span><span class="ff-cross-bl">+</span><span class="ff-cross-br">+</span>
    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4 text-xs">
      <div>
        <span class="font-bold text-[var(--fg)] tracking-wider">[ CONFIGURED_ACTIVITY_STREAM ]</span>
        <span class="text-[var(--muted-fg)] ml-2">${esc(String(activity.totalContributions))} contributions</span>
      </div>
      <div class="flex items-center gap-1.5 text-[11px] text-[var(--muted-fg)]">
        <span>Less</span>
        <span class="size-2.5 rounded-[2px] bg-[var(--muted-bg)] border border-[var(--border)]"></span>
        <span class="size-2.5 rounded-[2px] bg-emerald-950 border border-emerald-800"></span>
        <span class="size-2.5 rounded-[2px] bg-emerald-800 border border-emerald-600"></span>
        <span class="size-2.5 rounded-[2px] bg-emerald-600 border border-emerald-400"></span>
        <span class="size-2.5 rounded-[2px] bg-emerald-400 border border-emerald-300"></span>
        <span>More</span>
      </div>
    </div>
    <div class="overflow-x-auto pb-2">
      <div class="min-w-[780px] space-y-2">
        <div class="relative h-4 text-[10px] text-[var(--muted-fg)] pl-8">
          ${monthsRow}
        </div>
        <div class="flex items-start gap-2">
          <div class="flex flex-col justify-between h-[86px] text-[9px] text-[var(--muted-fg)] select-none pt-0.5 w-6 shrink-0">
            <span>Mon</span><span>Wed</span><span>Fri</span>
          </div>
          <div class="flex gap-1.5 p-2.5 rounded-xl bg-[var(--muted-bg)]/40 border border-[var(--border)] flex-grow justify-between">
            ${weeksHtml}
          </div>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[var(--border)] text-xs">
      <div class="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--muted-bg)]/40">
        <span class="text-[10px] text-[var(--muted-fg)] uppercase block tracking-wider">// CONTRIBUTIONS</span>
        <span class="text-base sm:text-lg font-black text-[var(--fg)] mt-1 block">${esc(String(activity.totalContributions))}</span>
      </div>
      <div class="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--muted-bg)]/40">
        <span class="text-[10px] text-[var(--muted-fg)] uppercase block tracking-wider">// ACTIVE DAYS</span>
        <span class="text-base sm:text-lg font-black text-[var(--signal)] mt-1 block">${esc(String(activity.activeDays))}</span>
      </div>
      <div class="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--muted-bg)]/40">
        <span class="text-[10px] text-[var(--muted-fg)] uppercase block tracking-wider">// LONGEST STREAK</span>
        <span class="text-base sm:text-lg font-black text-[var(--fg)] mt-1 block">${esc(String(activity.longestStreak))}</span>
      </div>
      <div class="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--muted-bg)]/40">
        <span class="text-[10px] text-[var(--muted-fg)] uppercase block tracking-wider">// BUSIEST DAY</span>
        <span class="text-base sm:text-lg font-black text-[var(--signal)] mt-1 block">${esc(activity.busiestDay || '—')}</span>
      </div>
    </div>
  </div>`;
}
