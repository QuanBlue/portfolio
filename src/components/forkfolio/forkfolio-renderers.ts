import {
  getCareerSettings,
  type Certification,
  type EducationItem,
  type ExperienceItem,
  type PortfolioData,
  type Project,
  type Skill,
} from '../../data/portfolio';
import { esc, groupSkillsByCategory, safeUrl } from '../../lib/render';
import { getKnightActivity, parseHeatmapWeeks } from '../../themes/core/data-adapter';
import { deriveRepoLabel, MONTH_MARKERS } from '../ascii/ascii-renderers';

export function deriveShortHandle(data: Partial<PortfolioData>): string {
  const raw = String(data.identity?.github?.handle || 'quan').replace(/^@/, '').trim().toLowerCase();
  return raw.split(/[^a-z0-9_-]/)[0] || 'quan';
}

export function renderForkfolioQuickProjectsHtml(projects: Project[]): string {
  const quick = (projects || []).slice(0, 3);
  if (quick.length === 0) {
    return `<div class="col-span-full p-2.5 rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] text-[11px] font-mono text-[var(--muted-fg)]">[ no published projects ]</div>`;
  }
  return quick
    .map(
      (qp, idx) => `<a
        href="#projects"
        class="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-[var(--signal)] transition group flex flex-col justify-between"
      >
        <div class="flex items-center justify-between">
          <span class="font-bold text-[var(--fg)] group-hover:text-[var(--signal)] transition-colors truncate">${esc(qp.title)}</span>
          <span class="text-[10px] text-[var(--signal)] font-semibold">0${idx + 1}</span>
        </div>
        <span class="text-[10px] text-[var(--muted-fg)] mt-1 truncate">${esc((qp.tags || [])[0] || 'Project')} · ${esc(qp.status)}</span>
      </a>`,
    )
    .join('');
}

export function renderForkfolioAboutSummaryHtml(data: PortfolioData, locale: 'en' | 'vi' = 'en'): string {
  const isVi = locale === 'vi';
  const exp0 = (data.experience || [])[0];
  const edu0 = (data.education || [])[0];
  const projCount = (data.projects || []).length;
  const skillNames = (data.skills || []).slice(0, 4).map((s) => s.name).filter(Boolean).join(', ') || '—';

  const items = [
    {
      icon: 'fa-solid fa-briefcase',
      title: isVi ? '01. Kinh nghiệm hiện tại' : '01. Current Experience',
      body: exp0 ? `${exp0.role} @ ${exp0.company} (${exp0.period})` : isVi ? 'Chưa có kinh nghiệm đăng tải' : 'No published experience',
    },
    {
      icon: 'fa-solid fa-folder-open',
      title: isVi ? '02. Dự án công khai' : '02. Published Projects',
      body: `${projCount} ${isVi ? 'dự án trong hồ sơ' : `repository record${projCount === 1 ? '' : 's'}`}`,
    },
    {
      icon: 'fa-solid fa-graduation-cap',
      title: isVi ? '03. Học vấn' : '03. Education',
      body: edu0 ? `${edu0.degree} — ${edu0.school}` : isVi ? 'Chưa có học vấn đăng tải' : 'No published education',
    },
    {
      icon: 'fa-solid fa-terminal',
      title: isVi ? '04. Ngăn xếp kỹ năng' : '04. Technical Stack',
      body: `${(data.skills || []).length} ${isVi ? 'kỹ năng' : 'skills'} · ${skillNames}`,
    },
  ];

  return items
    .map(
      (it) => `<div class="ff-panel p-4 space-y-1.5 border-[var(--border)]">
        <div class="font-mono text-xs font-bold text-[var(--fg)] flex items-center gap-2">
          <i class="${esc(it.icon)} text-[var(--signal)]"></i>
          <span>${esc(it.title)}</span>
        </div>
        <p class="text-xs text-[var(--muted-fg)]">${esc(it.body)}</p>
      </div>`,
    )
    .join('');
}

export function renderForkfolioProjectsHtml(
  projects: Project[],
  fallbackHandle: string,
  locale: 'en' | 'vi' = 'en',
  completed = false,
): string {
  const isVi = locale === 'vi';
  if (!projects || projects.length === 0) {
    return `<div class="p-8 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] font-mono text-xs text-[var(--muted-fg)]">${esc(isVi ? '[ CHƯA CÓ DỰ ÁN ĐĂNG TẢI ]' : '[ NO PUBLISHED PROJECTS ]')}</div>`;
  }

  const featured = projects.length > 4 ? projects.slice(0, 4) : projects;
  const total = String(featured.length).padStart(2, '0');
  const pctStyle = completed ? 'width: 100%;' : 'width: 0%;';
  const pctLabel = completed ? '100%' : '0%';
  const completeHidden = completed ? '' : 'hidden';

  return featured
    .map((p, idx) => {
      const abbr = p.title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'PR';
      const num = String(idx + 1).padStart(2, '0');
      const primaryTag = (p.tags || [])[0] || 'Project';
      const repoLabel = deriveRepoLabel(p.link, fallbackHandle, p.title);
      const safeTitle = p.title || 'project';
      const desc = p.description || p.shortDesc || '';
      const safeHref = safeUrl(p.link);

      return `<article class="ff-cross-box rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm hover:border-[var(--line-strong)] transition-all">
        <span class="ff-cross-tl">+</span>
        <span class="ff-cross-tr">+</span>
        <span class="ff-cross-bl">+</span>
        <span class="ff-cross-br">+</span>
        <div class="border-b border-[var(--border)] bg-[var(--muted-bg)]/50 px-4 sm:px-6 py-2.5 flex items-center justify-between font-mono text-xs select-none">
          <div class="flex items-center gap-2 truncate">
            <span class="text-[var(--signal)] font-bold">[${num}/${total}]</span>
            <span class="text-[var(--fg)] font-bold truncate">repo:${esc(safeTitle)}</span>
            <span class="text-[10px] text-[var(--muted-fg)] hidden md:inline">~/projects/${esc(safeTitle)}</span>
          </div>
          <div class="hidden sm:flex items-center gap-2.5 font-mono text-[11px] text-[var(--muted-fg)] shrink-0">
            <span class="uppercase font-semibold text-[var(--signal)]">● ${esc(p.status)}</span>
          </div>
        </div>
        <div class="p-6 sm:p-8 space-y-6">
          <div class="flex items-center gap-2 font-mono text-xs text-[var(--muted-fg)] border-b border-[var(--border)]/70 pb-3">
            <span class="text-[var(--signal)]">›</span>
            <span class="text-[var(--fg)] font-semibold">cat ${esc(safeTitle)}/README.md</span>
            <span class="text-[10px] text-[var(--faint)] ml-auto">[markdown]</span>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-8 space-y-4">
              <h3 class="font-mono text-2xl sm:text-3xl font-black uppercase tracking-tight text-[var(--fg)]">${esc(safeTitle)}</h3>
              <p class="text-sm sm:text-base text-[var(--muted-fg)] leading-relaxed font-mono">${esc(desc)}</p>
              <div class="flex flex-wrap gap-2 pt-1">
                ${(p.tags || [])
                  .map((tag) => `<span class="ff-tag"><span class="text-[var(--signal)]">#</span><span>${esc(tag)}</span></span>`)
                  .join('')}
              </div>
              <div class="p-4 rounded-xl border border-[var(--border)] bg-[var(--muted-bg)]/40 space-y-2">
                <div class="ff-term-progress space-y-2 font-mono text-xs" data-terminal-progress="true">
                  <div class="flex items-center gap-2 text-[var(--muted-fg)]">
                    <span class="text-[var(--signal)]">›</span>
                    <span class="text-[var(--fg)] font-semibold">stat -c "%n · %s" ${esc(safeTitle)}</span>
                  </div>
                  <div class="ff-term-prog-track">
                    <div class="ff-term-prog-bar" data-target-percent="100" style="${pctStyle}"></div>
                  </div>
                  <div class="flex items-center justify-between text-[11px] text-[var(--muted-fg)]">
                    <span class="ff-prog-step text-[var(--muted-fg)]">${esc((p.tags || []).slice(0, 3).join(' · ') || p.status)}</span>
                    <span class="ff-prog-pct text-[var(--signal)] font-bold">${pctLabel}</span>
                  </div>
                  <div class="ff-prog-complete ${completeHidden} pt-1 text-[11px] text-[var(--signal)] font-medium">
                    ✓ [SIMULATED SHELL] ${esc(repoLabel)}
                  </div>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-3 pt-3 border-t border-[var(--border)]">
                <a href="${esc(safeHref)}" target="_blank" rel="noopener noreferrer" class="ff-btn ff-btn-primary">
                  <span>[ ${isVi ? 'xem_repo' : 'view_repository'} ↗ ]</span>
                </a>
                <button type="button" data-project-trigger="${esc(p.id)}" class="ff-btn cursor-pointer">
                  <span>[ ${isVi ? 'chi_tiết' : 'view_details_modal'} ]</span>
                </button>
              </div>
            </div>
            <div class="lg:col-span-4 space-y-4">
              <div class="w-full aspect-video sm:aspect-square rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted-bg)]/60 flex flex-col items-center justify-center p-6 text-center group hover:border-[var(--signal)]/50 transition-colors">
                <span class="font-mono text-4xl sm:text-6xl font-black text-[var(--fg)] tracking-tight group-hover:text-[var(--signal)] transition-colors">${esc(abbr)}</span>
                <span class="font-mono text-xs text-[var(--muted-fg)] mt-2">${esc(primaryTag)} · ${esc(p.status)}</span>
                <span class="font-mono text-[11px] text-[var(--signal)] mt-1 opacity-80 truncate max-w-full px-2">${esc(repoLabel)}</span>
              </div>
              <div class="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] font-mono text-[11px] space-y-1.5 text-[var(--muted-fg)]">
                <div class="flex justify-between"><span>Source</span><strong class="text-[var(--fg)] truncate max-w-[160px]">${esc(repoLabel)}</strong></div>
                <div class="flex justify-between"><span>Primary Tag</span><strong class="text-[var(--signal)]">${esc(primaryTag)}</strong></div>
                <div class="flex justify-between"><span>Status</span><strong class="text-[var(--fg)]">${esc(p.status)}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </article>`;
    })
    .join('');
}

export function renderForkfolioMoreProjectsHtml(projects: Project[], locale: 'en' | 'vi' = 'en'): string {
  const isVi = locale === 'vi';
  const more = (projects || []).length > 4 ? projects.slice(4) : [];
  if (more.length === 0) return '';

  const rowsHtml = more
    .map(
      (p) => `<tr class="hover:bg-[var(--muted-bg)]/50 transition-colors">
        <td class="font-bold text-[var(--fg)]"><span class="text-[var(--signal)] mr-1.5">›</span>${esc(p.title)}</td>
        <td class="text-[var(--muted-fg)] font-mono text-xs max-w-xs truncate">${esc(p.shortDesc || p.description)}</td>
        <td><div class="flex flex-wrap gap-1">${(p.tags || [])
          .slice(0, 2)
          .map((t) => `<span class="text-[11px] px-1.5 py-0.5 rounded bg-[var(--muted-bg)] text-[var(--muted-fg)]">#${esc(t)}</span>`)
          .join('')}</div></td>
        <td class="text-right"><div class="inline-flex items-center gap-2">
          <a href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener noreferrer" class="text-[var(--signal)] hover:underline">[repo ↗]</a>
          <button type="button" data-project-trigger="${esc(p.id)}" class="text-[var(--muted-fg)] hover:text-[var(--fg)] cursor-pointer">[details]</button>
        </div></td>
      </tr>`,
    )
    .join('');

  const mobileHtml = more
    .map(
      (p) => `<div class="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-2 font-mono text-xs">
        <div class="flex items-center justify-between">
          <span class="font-bold text-[var(--fg)] text-sm">${esc(p.title)}</span>
          <a href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener noreferrer" class="text-[var(--signal)]">[repo ↗]</a>
        </div>
        <p class="text-[var(--muted-fg)] font-mono text-xs">${esc(p.shortDesc || p.description)}</p>
        <div class="flex flex-wrap gap-1 pt-1">
          ${(p.tags || []).map((t) => `<span class="text-[10px] px-1.5 py-0.5 rounded bg-[var(--muted-bg)] text-[var(--muted-fg)]">#${esc(t)}</span>`).join('')}
        </div>
      </div>`,
    )
    .join('');

  return `<div class="hidden md:block ff-cross-box rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <span class="ff-cross-tl">+</span><span class="ff-cross-tr">+</span><span class="ff-cross-bl">+</span><span class="ff-cross-br">+</span>
      <table class="ff-table">
        <thead><tr>
          <th class="w-1/4">${isVi ? 'Dự án' : 'Project'}</th>
          <th class="w-2/5">${isVi ? 'Mô tả' : 'Description'}</th>
          <th class="w-1/5">${isVi ? 'Công nghệ' : 'Technology'}</th>
          <th class="w-1/6 text-right">${isVi ? 'Liên kết' : 'Links'}</th>
        </tr></thead>
        <tbody class="divide-y divide-[var(--border)] font-mono text-xs">${rowsHtml}</tbody>
      </table>
    </div>
    <div class="md:hidden space-y-3">${mobileHtml}</div>`;
}

export function renderForkfolioExperienceHtml(experience: ExperienceItem[], locale: 'en' | 'vi' = 'en'): string {
  const isVi = locale === 'vi';
  if (!experience || experience.length === 0) {
    return `<div class="p-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] font-mono text-xs text-[var(--muted-fg)]">${esc(isVi ? '[ CHƯA CÓ KINH NGHIỆM ĐĂNG TẢI ]' : '[ NO PUBLISHED EXPERIENCE ]')}</div>`;
  }

  const total = String(experience.length).padStart(2, '0');
  return experience
    .map((exp, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      const currentText = isVi ? 'VỊ TRÍ HIỆN TẠI' : 'CURRENT ROLE';
      return `<div class="relative group">
        <div class="absolute -left-6 sm:-left-10 top-6 size-5 sm:size-8 flex items-center justify-center">
          <span class="size-2.5 sm:size-3 rounded-full border-2 border-[var(--signal)] bg-[var(--card)] ${exp.isCurrent ? 'ring-4 ring-emerald-500/20 animate-pulse' : ''}"></span>
        </div>
        <article class="ff-cross-box rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 hover:border-[var(--line-strong)] transition shadow-sm">
          <span class="ff-cross-tl">+</span><span class="ff-cross-tr">+</span><span class="ff-cross-bl">+</span><span class="ff-cross-br">+</span>
          <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div class="md:col-span-4 space-y-2 font-mono">
              <span class="text-xs text-[var(--muted-fg)] block">${num} / ${total}</span>
              <div class="text-sm sm:text-base font-bold text-[var(--fg)]">${esc(exp.period)}</div>
              ${
                exp.isCurrent
                  ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--signal)]/40 bg-emerald-500/10 text-[11px] font-semibold text-[var(--signal)]"><span class="size-1.5 rounded-full bg-[var(--signal)] animate-pulse"></span><span>${currentText}</span></span>`
                  : ''
              }
            </div>
            <div class="md:col-span-8 space-y-4">
              <div>
                <h3 class="font-mono text-xl sm:text-2xl font-black text-[var(--fg)] tracking-tight">${esc(exp.role)}</h3>
                <p class="font-mono text-sm font-semibold text-[var(--signal)] mt-0.5">@ ${esc(exp.company)}</p>
              </div>
              <ul class="space-y-2 text-sm text-[var(--muted-fg)] leading-relaxed font-mono">
                ${(exp.bullets || [])
                  .map(
                    (b) =>
                      `<li class="flex items-start gap-2.5"><span class="font-mono text-[var(--signal)] select-none shrink-0 mt-0.5">›</span><span>${esc(b)}</span></li>`,
                  )
                  .join('')}
              </ul>
              <div class="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
                ${(exp.tags || []).map((t) => `<span class="ff-tag"><span class="text-[var(--signal)]">#</span><span>${esc(t)}</span></span>`).join('')}
              </div>
            </div>
          </div>
        </article>
      </div>`;
    })
    .join('');
}

export function renderForkfolioEducationHtml(education: EducationItem[], locale: 'en' | 'vi' = 'en'): string {
  const isVi = locale === 'vi';
  if (!education || education.length === 0) {
    return `<div class="md:col-span-2 p-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] font-mono text-xs text-[var(--muted-fg)]">${esc(isVi ? '[ CHƯA CÓ HỌC VẤN ĐĂNG TẢI ]' : '[ NO PUBLISHED EDUCATION ]')}</div>`;
  }
  return education
    .map(
      (ed, idx) => `<article class="ff-cross-box rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-7 space-y-4 hover:border-[var(--line-strong)] transition shadow-sm">
        <span class="ff-cross-tl">+</span><span class="ff-cross-tr">+</span><span class="ff-cross-bl">+</span><span class="ff-cross-br">+</span>
        <div class="flex items-center justify-between font-mono text-xs border-b border-[var(--border)] pb-3">
          <span class="px-2.5 py-0.5 rounded bg-[var(--muted-bg)] text-[var(--signal)] font-bold">[${esc(ed.badge || `0${idx + 1}`)}]</span>
          <span class="text-[var(--muted-fg)]">${esc(ed.period)}</span>
        </div>
        <div>
          <h3 class="font-mono text-lg sm:text-xl font-bold text-[var(--fg)]">${esc(ed.degree)}</h3>
          <p class="font-mono text-xs text-[var(--signal)] font-medium mt-1">${esc(ed.school)}</p>
        </div>
        <p class="text-xs sm:text-sm text-[var(--muted-fg)] leading-relaxed font-mono">${esc(ed.description)}</p>
      </article>`,
    )
    .join('');
}

export function renderForkfolioCertificationsHtml(certs: Certification[], locale: 'en' | 'vi' = 'en'): string {
  const isVi = locale === 'vi';
  if (!certs || certs.length === 0) {
    return `<div class="md:col-span-2 p-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] font-mono text-xs text-[var(--muted-fg)]">${esc(isVi ? '[ CHƯA CÓ CHỨNG CHỈ ĐĂNG TẢI ]' : '[ NO PUBLISHED CERTIFICATIONS ]')}</div>`;
  }
  return certs
    .map(
      (c, idx) => `<article class="ff-cross-box rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-7 space-y-4 hover:border-[var(--line-strong)] transition shadow-sm">
        <span class="ff-cross-tl">+</span><span class="ff-cross-tr">+</span><span class="ff-cross-bl">+</span><span class="ff-cross-br">+</span>
        <div class="flex items-center justify-between font-mono text-xs border-b border-[var(--border)] pb-3">
          <span class="px-2.5 py-0.5 rounded bg-[var(--muted-bg)] text-[var(--signal)] font-bold">[${esc(c.badge || `CERT-${idx + 1}`)}]</span>
          <span class="text-[var(--muted-fg)] font-mono">${esc(c.issueDate || 'ISSUED')}</span>
        </div>
        <div>
          <h3 class="font-mono text-lg sm:text-xl font-bold text-[var(--fg)]">${esc(c.name)}</h3>
          <p class="font-mono text-xs text-[var(--signal)] font-medium mt-1">${esc(c.issuer)}</p>
        </div>
        ${c.description ? `<p class="text-xs sm:text-sm text-[var(--muted-fg)] leading-relaxed font-mono">${esc(c.description)}</p>` : ''}
        <div class="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          ${c.credentialId ? `<span class="text-[11px] text-[var(--muted-fg)]">ID: <span class="text-[var(--fg)] font-semibold">${esc(c.credentialId)}</span></span>` : '<span></span>'}
          ${c.credentialUrl ? `<a href="${esc(safeUrl(c.credentialUrl))}" target="_blank" rel="noopener noreferrer" class="ff-btn text-xs !py-1 !px-2.5"><span>[ verify ↗ ]</span></a>` : ''}
        </div>
      </article>`,
    )
    .join('');
}

export function renderForkfolioSkillsHtml(skills: Skill[], locale: 'en' | 'vi' = 'en'): string {
  const isVi = locale === 'vi';
  const groups = groupSkillsByCategory(skills || [], locale);
  const activeCount = (skills || []).filter((s) => s.status === 'ACTIVE').length;
  const totalCount = (skills || []).length;

  const groupsHtml =
    groups.length === 0
      ? `<div class="md:col-span-2 p-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] font-mono text-xs text-[var(--muted-fg)]">${esc(isVi ? '[ CHƯA CÓ KỸ NĂNG ĐĂNG TẢI ]' : '[ NO PUBLISHED SKILLS ]')}</div>`
      : groups
          .map((group, idx) => {
            const num = String(idx + 1).padStart(2, '0');
            return `<div class="ff-cross-box rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4 hover:border-[var(--line-strong)] transition shadow-sm">
              <span class="ff-cross-tl">+</span><span class="ff-cross-tr">+</span><span class="ff-cross-bl">+</span><span class="ff-cross-br">+</span>
              <div class="flex items-center justify-between border-b border-[var(--border)] pb-3 font-mono text-xs">
                <div class="flex items-center gap-2">
                  <span class="text-[var(--signal)] font-bold">// ${num}</span>
                  <h3 class="font-bold text-[var(--fg)] uppercase tracking-wider text-sm">${esc(group.category)}</h3>
                </div>
                <span class="text-[10px] text-[var(--muted-fg)] font-mono">${group.items.length} ${isVi ? 'MỤC' : group.items.length === 1 ? 'PACKAGE' : 'PACKAGES'}</span>
              </div>
              <div class="space-y-2 pt-1">
                ${group.items
                  .map(
                    (skill) => `<div class="flex items-center justify-between py-1.5 px-3 rounded-lg border border-[var(--border)]/60 bg-[var(--muted-bg)]/30 font-mono text-xs hover:border-[var(--signal)]/40 hover:bg-[var(--muted-bg)]/70 transition">
                      <div class="flex items-center gap-2">
                        <span class="text-[var(--signal)] font-bold select-none">✓</span>
                        <span class="font-semibold text-[var(--fg)]">${esc(skill.name)}</span>
                      </div>
                      <span class="text-[11px] text-[var(--muted-fg)] font-mono">${esc(skill.tag || skill.status)}</span>
                    </div>`,
                  )
                  .join('')}
              </div>
              <div class="pt-2 border-t border-[var(--border)] text-xs font-mono text-[var(--muted-fg)] flex items-center justify-between">
                <span class="truncate">${esc(group.items.map((s) => s.name).join(' · '))}</span>
              </div>
            </div>`;
          })
          .join('');

  const chipsHtml =
    totalCount === 0
      ? `<p class="text-xs font-mono text-[var(--muted-fg)]">${esc(isVi ? '[ Chưa có kỹ năng đăng tải ]' : '[ No published skills ]')}</p>`
      : skills
          .map(
            (s) => `<div class="ff-btn !cursor-default">
              <span class="size-1.5 rounded-full ${s.status === 'ACTIVE' ? 'bg-[var(--signal)]' : 'bg-amber-400'}"></span>
              <span class="font-semibold text-[var(--fg)]">${esc(s.name)}</span>
              <span class="text-[10px] text-[var(--muted-fg)]">${esc(s.tag)}</span>
            </div>`,
          )
          .join('');

  return `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">${groupsHtml}</div>
    <div class="ff-panel p-6 sm:p-7 space-y-4">
      <div class="flex items-center justify-between border-b border-[var(--border)] pb-3 font-mono text-xs text-[var(--muted-fg)]">
        <span class="font-bold text-[var(--fg)]">[ ACTIVE_STACK_REGISTER ]</span>
        <span class="text-[var(--signal)] font-semibold">${totalCount > 0 ? `● ${activeCount}/${totalCount} ACTIVE` : isVi ? '○ TRỐNG' : '○ EMPTY'}</span>
      </div>
      <div class="flex flex-wrap gap-2.5">${chipsHtml}</div>
    </div>`;
}

export function renderForkfolioActivityHtml(data: PortfolioData, locale: 'en' | 'vi' = 'en'): string {
  const isVi = locale === 'vi';
  const activity = getKnightActivity(data);
  const career = getCareerSettings(data);
  const githubUrl = safeUrl(data.identity?.github?.url || '#');
  const githubHandle = data.identity?.github?.handle || 'GitHub';

  const statsRow = `<div class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 font-mono">
    <div class="ff-cross-box rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <span class="ff-cross-tl">+</span><span class="ff-cross-tr">+</span><span class="ff-cross-bl">+</span><span class="ff-cross-br">+</span>
      <span class="text-[11px] text-[var(--muted-fg)] uppercase block">${isVi ? 'Dự án công khai' : 'Projects'}</span>
      <span class="text-2xl sm:text-3xl font-black text-[var(--signal)] mt-1 block">${(data.projects || []).length}</span>
      <span class="text-[10px] text-[var(--muted-fg)] mt-1 block">${isVi ? 'mục đã xuất bản' : 'published repositories'}</span>
    </div>
    <div class="ff-cross-box rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <span class="ff-cross-tl">+</span><span class="ff-cross-tr">+</span><span class="ff-cross-bl">+</span><span class="ff-cross-br">+</span>
      <span class="text-[11px] text-[var(--muted-fg)] uppercase block">${isVi ? 'Kỹ năng' : 'Skills'}</span>
      <span class="text-2xl sm:text-3xl font-black text-[var(--fg)] mt-1 block">${(data.skills || []).length}</span>
      <span class="text-[10px] text-[var(--muted-fg)] mt-1 block">${isVi ? 'mô-đun kỹ thuật' : 'configured stack modules'}</span>
    </div>
    <div class="ff-cross-box rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <span class="ff-cross-tl">+</span><span class="ff-cross-tr">+</span><span class="ff-cross-bl">+</span><span class="ff-cross-br">+</span>
      <span class="text-[11px] text-[var(--muted-fg)] uppercase block">${isVi ? 'Kinh nghiệm' : 'Experience'}</span>
      <span class="text-2xl sm:text-3xl font-black text-[var(--fg)] mt-1 block">${(data.experience || []).length}</span>
      <span class="text-[10px] text-[var(--muted-fg)] mt-1 block">${isVi ? 'cột mốc sự nghiệp' : 'timeline records'}</span>
    </div>
    <div class="ff-cross-box rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <span class="ff-cross-tl">+</span><span class="ff-cross-tr">+</span><span class="ff-cross-bl">+</span><span class="ff-cross-br">+</span>
      <span class="text-[11px] text-[var(--muted-fg)] uppercase block">${isVi ? 'Trạng thái CV' : 'Career Status'}</span>
      <span class="text-xl sm:text-2xl font-black text-[var(--signal)] mt-1 block">${career.openToWork ? 'OPEN' : 'FOCUSED'}</span>
      <span class="text-[10px] text-[var(--muted-fg)] mt-1 block">${career.openToWork ? (isVi ? 'Sẵn sàng hợp tác' : 'Open to Work') : isVi ? 'Ẩn CV công khai' : 'Public CV hidden'}</span>
    </div>
  </div>`;

  if (!activity) {
    return `${statsRow}
    <div class="ff-cross-box rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-6 sm:p-7 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
      <span class="ff-cross-tl">+</span><span class="ff-cross-tr">+</span><span class="ff-cross-bl">+</span><span class="ff-cross-br">+</span>
      <div class="space-y-1">
        <p class="font-bold text-[var(--fg)]">// ${isVi ? 'CHƯA CẤU HÌNH DỮ LIỆU GITHUB ACTIVITY' : 'NO GITHUB ACTIVITY STREAM CONFIGURED'}</p>
        <p class="text-[var(--muted-fg)]">${esc(isVi ? 'Biểu đồ đóng góp chỉ hiển thị khi được cấu hình trong Admin Activity. Không dùng số liệu giả.' : 'Contribution heatmap appears only when explicitly configured in Admin Activity; fabricated numbers are disabled.')}</p>
      </div>
      <a href="${esc(githubUrl)}" target="_blank" rel="noopener noreferrer" class="ff-btn ff-btn-primary">
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
          .map(
            (level, dIdx) =>
              `<span class="ff-heatmap-cell ${level > 0 ? `ff-heatmap-${level}` : ''}" title="Week ${wIdx + 1}, Day ${dIdx + 1} · Level ${level}"></span>`,
          )
          .join('')}
      </div>`,
    )
    .join('');

  return `${statsRow}
  <div class="ff-cross-box rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-7 space-y-5 shadow-sm">
    <span class="ff-cross-tl">+</span><span class="ff-cross-tr">+</span><span class="ff-cross-bl">+</span><span class="ff-cross-br">+</span>
    <div class="flex items-center justify-between border-b border-[var(--border)] pb-3 font-mono text-xs">
      <span class="text-[var(--fg)] font-bold">// CONFIGURED_ACTIVITY_HEATMAP</span>
      <span class="text-[var(--muted-fg)]">${esc(String(activity.totalContributions))} Contributions</span>
    </div>
    <div class="overflow-x-auto pb-2">
      <div class="min-w-[780px] space-y-2">
        <div class="relative h-4 text-[10px] text-[var(--muted-fg)] font-mono pl-8">
          ${monthsRow}
        </div>
        <div class="flex items-start gap-2">
          <div class="flex flex-col justify-between h-[86px] text-[9px] text-[var(--muted-fg)] select-none pt-0.5 w-6 shrink-0 font-mono">
            <span>Mon</span><span>Wed</span><span>Fri</span>
          </div>
          <div class="flex gap-1.5 p-2.5 rounded-xl bg-[var(--muted-bg)]/40 border border-[var(--border)] flex-grow justify-between">${weeksHtml}</div>
        </div>
        <div class="flex items-center justify-between font-mono text-[11px] text-[var(--muted-fg)] pt-2 px-1">
          <span>Longest streak: <strong class="text-[var(--fg)]">${esc(String(activity.longestStreak))}</strong> · Active days: <strong class="text-[var(--signal)]">${esc(String(activity.activeDays))}</strong></span>
          <div class="flex items-center gap-1.5">
            <span>Less</span>
            <span class="ff-heatmap-cell"></span>
            <span class="ff-heatmap-cell ff-heatmap-1"></span>
            <span class="ff-heatmap-cell ff-heatmap-2"></span>
            <span class="ff-heatmap-cell ff-heatmap-3"></span>
            <span class="ff-heatmap-cell ff-heatmap-4"></span>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
