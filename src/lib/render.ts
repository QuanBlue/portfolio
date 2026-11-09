/**
 * Pure HTML renderers shared by Astro (build time) and the browser (live edits).
 * Every user-provided string goes through `esc` / `safeUrl`.
 */
import type {
  Certification,
  ExperienceItem,
  GalleryItem,
  Identity,
  Project,
  Skill,
} from '../data/portfolio';

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Allow only http(s)/mailto links and images (data:image / relative paths). */
export function safeUrl(url: unknown): string {
  const u = String(url ?? '').trim();
  if (/^(https?:|mailto:|\/|\.\/|#)/i.test(u)) return u;
  if (/^data:image\//i.test(u)) return u;
  return '#';
}

const DOT: Record<string, string> = {
  emerald: 'bg-emerald-500 dark:bg-emerald-400',
  blue: 'bg-sky-500 dark:bg-sky-400',
  purple: 'bg-violet-500 dark:bg-violet-400',
  orange: 'bg-orange-500 dark:bg-orange-400',
  yellow: 'bg-amber-500 dark:bg-yellow-400',
};

export function initials(name: string): string {
  return (
    String(name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  );
}

export function renderAvatar(identity: Identity): string {
  if (identity.avatar) {
    return `<img src="${esc(safeUrl(identity.avatar))}" alt="${esc(identity.name)}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />`;
  }
  return `<div class="w-full h-full flex items-center justify-center bg-[var(--card-bg)] bg-gradient-to-br from-emerald-500/15 to-blue-500/10"><span class="font-display text-6xl font-bold gradient-text">${esc(initials(identity.name))}</span></div>`;
}

export function renderSkills(skills: Skill[]): string {
  return skills
    .map((s) => {
      const active = s.status === 'ACTIVE';
      return `<span class="chip hover:-translate-y-0.5" title="${esc(s.tag)} · ${esc(s.status)}">
  <span class="w-2 h-2 rounded-full animate-pulse ${
    active
      ? 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_#10b981]'
      : 'bg-amber-500 dark:bg-yellow-400 shadow-[0_0_8px_#eab308]'
  }" style="animation-delay:${esc(s.delay || '0s')}"></span>
  <span class="font-medium text-[var(--heading)]">${esc(s.name)}</span>
  <span class="font-mono text-[10px] text-[var(--muted)]">${esc(s.tag)}</span>
</span>`;
    })
    .join('');
}

export function renderCerts(certs: Certification[]): string {
  return certs
    .map(
      (c) => `<div class="card card-hover p-4 flex items-start gap-3">
  <span class="mt-0.5 w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${
    c.color === 'yellow' ? 'bg-amber-500/15 text-amber-600 dark:text-yellow-400' : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
  }">★</span>
  <div class="min-w-0">
    <p class="text-sm font-semibold text-[var(--heading)]">${esc(c.name)}</p>
    <p class="text-xs text-[var(--muted)] mt-0.5">${esc(c.issuer)}</p>
  </div>
</div>`,
    )
    .join('');
}

export function renderExperience(items: ExperienceItem[]): string {
  return items
    .map(
      (item) => `<div class="relative pl-8 pb-10 last:pb-0 group">
  <span class="absolute left-0 top-1.5 w-3 h-3 rounded-full ring-4 ring-[var(--bg-body)] ${
    item.isCurrent ? 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_14px_#10b981]' : 'bg-zinc-400 dark:bg-zinc-600'
  }">
    ${item.isCurrent ? '<span class="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>' : ''}
  </span>
  <div class="card card-hover p-5">
    <div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
      <h3 class="font-display text-lg font-semibold text-[var(--heading)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">${esc(item.role)}</h3>
      <span class="font-mono text-xs px-2.5 py-0.5 rounded-full w-max ${
        item.isCurrent
          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
          : 'text-[var(--muted)] bg-black/5 dark:bg-white/5'
      }">${esc(item.period)}</span>
    </div>
    <p class="text-sm font-medium text-[var(--text-body)] mt-1">${esc(item.company)}</p>
    <ul class="mt-3 space-y-2 text-sm text-[var(--text-body)]">
      ${item.bullets
        .map((b) => `<li class="flex items-start gap-2"><span class="text-emerald-600 dark:text-emerald-400 mt-0.5 select-none">▹</span><span>${esc(b)}</span></li>`)
        .join('')}
    </ul>
    <div class="flex flex-wrap gap-1.5 mt-4">${item.tags.map((t) => `<span class="chip font-mono">${esc(t)}</span>`).join('')}</div>
  </div>
</div>`,
    )
    .join('');
}

export function renderProjects(projects: Project[]): string {
  return projects
    .map((p) => {
      const cover = p.media?.[0];
      const count = p.media?.length ?? 0;
      const online = p.status === 'ONLINE';
      return `<button type="button" class="project-card-trigger card card-hover group relative text-left cursor-pointer flex flex-col h-full overflow-hidden" data-project-id="${esc(p.id)}">
  <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
  ${
    cover
      ? `<div class="relative aspect-video overflow-hidden bg-zinc-200 dark:bg-zinc-900 border-b border-[var(--card-border)]">
    <img src="${esc(safeUrl(cover.src))}" alt="${esc(cover.caption || p.title)}" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
    ${count > 1 ? `<span class="absolute bottom-2 right-2 chip font-mono !bg-black/60 !text-white !border-white/10">${count} media</span>` : ''}
  </div>`
      : ''
  }
  <div class="p-6 flex flex-col flex-grow relative z-10">
    <div class="flex items-center justify-between mb-4">
      <span class="relative flex w-2.5 h-2.5">
        ${online ? '<span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>' : ''}
        <span class="relative inline-flex w-2.5 h-2.5 rounded-full ${DOT[p.color] ?? DOT.emerald} shadow-[0_0_10px_#10b981]"></span>
      </span>
      <span class="font-mono text-[10px] tracking-widest px-2 py-0.5 rounded-full ${
        online
          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
          : 'text-amber-600 dark:text-yellow-400 bg-amber-500/10'
      }">${esc(p.status)}</span>
    </div>
    <h3 class="font-display text-xl font-semibold text-[var(--heading)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">${esc(p.title)}</h3>
    <p class="text-sm mt-2 text-[var(--text-body)] line-clamp-3 flex-grow">${esc(p.shortDesc)}</p>
    <div class="flex flex-wrap gap-1.5 mt-5">${p.tags
      .slice(0, 4)
      .map((t) => `<span class="chip font-mono">${esc(t)}</span>`)
      .join('')}</div>
  </div>
</button>`;
    })
    .join('');
}

export function renderGalleryGrid(items: GalleryItem[], limit?: number): string {
  const valid = items.filter((g) => Boolean(g.image && g.image.trim()));
  const shown = limit ? valid.slice(0, limit) : valid;
  return shown
    .map(
      (g, i) => `<button type="button" class="gallery-card card-hover group relative block w-full overflow-hidden rounded-2xl border border-[var(--card-border)] cursor-zoom-in bg-zinc-200 dark:bg-zinc-900" data-gallery-index="${i}" aria-label="Open ${esc(g.title)}">
  <img src="${esc(safeUrl(g.image))}" alt="${esc(g.title)}" loading="lazy" class="w-full h-auto block transition-transform duration-700 group-hover:scale-105" />
  <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  <div class="absolute inset-x-0 bottom-0 p-4 text-left translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
    <h3 class="font-display text-base font-semibold text-white">${esc(g.title)}</h3>
    <p class="text-xs text-zinc-200 mt-0.5 line-clamp-2">${esc(g.description)}</p>
  </div>
</button>`,
    )
    .join('');
}
