/**
 * Pure HTML renderers shared by Astro (build time) and the browser (live edits).
 * Every user-provided string goes through `esc` / `safeUrl`.
 */
import type {
  Certification,
  EducationItem,
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

export function renderNameWords(name: string): string {
  const words = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words
    .map((w, i) => `<span class="word"><span style="--w: ${i}">${esc(w)}</span></span>`)
    .join(' ');
}

export function renderAvatar(identity: Identity): string {
  if (identity.avatar) {
    return `<img src="${esc(safeUrl(identity.avatar))}" alt="${esc(identity.name)}" class="aspect-[4/5] w-full rounded-xl object-cover squircle transition-transform duration-500 hover:scale-[1.02]" />`;
  }
  return `<div class="aspect-[4/5] w-full rounded-xl squircle flex items-center justify-center bg-[var(--muted-bg)]"><span class="font-display text-5xl font-bold gradient-text">${esc(initials(identity.name))}</span></div>`;
}

export function renderSkills(skills: Skill[]): string {
  return skills
    .map((s) => {
      const active = s.status === 'ACTIVE';
      return `<li class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs font-mono text-[var(--fg)] hover:border-[var(--line-strong)] transition" title="${esc(s.tag)} · ${esc(s.status)}">
  <span class="size-1.5 rounded-full ${active ? 'bg-[var(--signal)]' : 'bg-amber-400'}"></span>
  <span class="font-semibold">${esc(s.name)}</span>
  <span class="text-[10px] text-[var(--muted-fg)]">${esc(s.tag)}</span>
</li>`;
    })
    .join('');
}

export function renderCerts(certs: Certification[]): string {
  return certs
    .map(
      (c) => `<div class="panel card-interactive p-4 flex items-start gap-3">
  <span class="mt-0.5 w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${
    c.color === 'yellow' ? 'bg-amber-500/15 text-amber-500' : 'bg-sky-500/15 text-sky-500'
  }">★</span>
  <div class="min-w-0">
    <p class="text-sm font-semibold text-[var(--fg)]">${esc(c.name)}</p>
    <p class="text-xs text-[var(--muted-fg)] mt-0.5">${esc(c.issuer)}</p>
  </div>
</div>`,
    )
    .join('');
}

export function renderExperience(items: ExperienceItem[]): string {
  return items
    .map((item, idx) => {
      const isLeft = idx % 2 === 0;
      const num = String(idx + 1).padStart(2, '0');
      const cardMarkup = `<div class="book-page ${isLeft ? 'book-page-left' : 'book-page-right'} panel card-interactive p-6 relative">
  <div class="flex items-center justify-between mb-3">
    <span class="devops-tag">${esc(item.company)}</span>
    <span class="timeline-number">${num}</span>
  </div>
  <h3 class="text-lg font-bold text-[var(--fg)]">${esc(item.role)}</h3>
  <p class="text-xs font-mono ${item.isCurrent ? 'text-[var(--signal)]' : 'text-[var(--muted-fg)]'} mt-0.5 md:hidden">${esc(item.period)}</p>
  <ul class="text-sm text-[var(--muted-fg)] space-y-2 mt-3 leading-relaxed">
    ${item.bullets.map((b) => `<li>• ${esc(b)}</li>`).join('')}
  </ul>
  <div class="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-[var(--border)] font-mono text-[11px] text-[var(--faint)]">
    ${item.tags.map((t, ti) => `${ti > 0 ? '<span>·</span>' : ''}<span>#${esc(t.replace(/\s+/g, ''))}</span>`).join('')}
  </div>
</div>`;

      const dateMarkup = `<span class="book-date ${
        isLeft ? 'book-date-right text-[var(--signal)]' : 'book-date-left text-[var(--muted-fg)]'
      } font-mono text-base font-bold tracking-wider">${esc(item.period)}</span>`;

      if (isLeft) {
        return `<div class="timeline-book-row relative grid grid-cols-1 md:grid-cols-2 gap-6 items-center" data-side="left">
  <div class="md:pr-10 pl-10 md:pl-0">${cardMarkup}</div>
  <div class="hidden md:flex items-center pl-10">${dateMarkup}</div>
  <span class="timeline-dot-node w-3.5 h-3.5 rounded-full ${
    item.isCurrent ? 'bg-[var(--signal)]' : 'bg-[var(--line-strong)]'
  } ring-4 ring-[var(--bg)] absolute left-[16px] md:left-1/2 -translate-x-1/2"></span>
</div>`;
      }

      return `<div class="timeline-book-row relative grid grid-cols-1 md:grid-cols-2 gap-6 items-center" data-side="right">
  <div class="hidden md:flex justify-end pr-10">${dateMarkup}</div>
  <div class="md:pl-10 pl-10">${cardMarkup}</div>
  <span class="timeline-dot-node w-3.5 h-3.5 rounded-full ${
    item.isCurrent ? 'bg-[var(--signal)]' : 'bg-[var(--line-strong)]'
  } ring-4 ring-[var(--bg)] absolute left-[16px] md:left-1/2 -translate-x-1/2"></span>
</div>`;
    })
    .join('');
}

export function renderEducation(items: EducationItem[] = []): string {
  return items
    .map(
      (edu, idx) => `<li class="reveal is-visible grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 border-t border-[var(--border)] py-6" style="--d: ${(idx * 0.08).toFixed(2)}s">
  <span class="grid size-12 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--card)] row-span-5 font-mono text-xs font-bold ${
    idx === 0 ? 'text-[var(--primary)]' : 'text-[var(--signal)]'
  } squircle">
    ${esc(edu.badge || 'EDU')}
  </span>
  <p class="font-mono text-xs text-[var(--signal)]">${esc(edu.period)}</p>
  <p class="text-h3 text-[var(--fg)]">${esc(edu.degree)}</p>
  <p class="text-sm font-medium text-[var(--fg)]">${esc(edu.school)}</p>
  <p class="text-sm text-[var(--muted-fg)] mt-1">${esc(edu.description)}</p>
</li>`,
    )
    .join('');
}

export function renderProjects(projects: Project[]): string {
  return projects
    .map((p, idx) => {
      const cover = p.media?.[0];
      const count = p.media?.length ?? 0;
      const online = p.status === 'ONLINE';
      const isFeatured = idx === 0 && !cover;

      if (isFeatured) {
        return `<article class="project-card-trigger reveal is-visible card-interactive md:col-span-2 panel p-6 sm:p-8 grid gap-8 lg:grid-cols-12 lg:items-center group cursor-pointer" data-project-id="${esc(p.id)}">
  <div class="lg:col-span-7 rounded-xl border border-[var(--border)] bg-[var(--muted-bg)] p-5 font-mono text-xs space-y-3 transition-shadow duration-250 group-hover:shadow-[var(--shadow-raised)]">
    <div class="flex items-center justify-between border-b border-[var(--border)] pb-2.5 text-[11px] text-[var(--muted-fg)]">
      <span>PLAYBOOK: site-airgap-ha.yml</span>
      <span class="text-[var(--signal)]">● 0 FAILED · IDEMPOTENT</span>
    </div>
    <div class="space-y-1.5 text-[11px] leading-relaxed">
      <div class="playbook-line text-[var(--muted-fg)]" style="--line: 0">$ ansible-playbook -i inventory/prod.ini site-airgap-ha.yml</div>
      <div class="playbook-line text-[var(--signal)]" style="--line: 1">✔ [preflight] Disable swap, load br_netfilter &amp; ip_vs kernel modules</div>
      <div class="playbook-line text-[var(--signal)]" style="--line: 2">✔ [registry] Bootstrap offline Harbor Registry + Cosign verification</div>
      <div class="playbook-line text-[var(--signal)]" style="--line: 3">✔ [haproxy] Configure Keepalived VIP + HAProxy L4 API Server LB</div>
      <div class="playbook-line text-[var(--signal)]" style="--line: 4">✔ [k8s-master] Init stacked etcd multi-master control-plane</div>
      <div class="playbook-line text-[var(--signal)]" style="--line: 5">✔ [calico] Deploy Calico CNI &amp; Prometheus node-exporter</div>
    </div>
    <div class="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border)] text-center">
      <div class="rounded bg-[var(--card)] p-2 border border-[var(--border)]">
        <div class="font-bold text-[var(--fg)]">-70%</div>
        <div class="text-[10px] text-[var(--muted-fg)]">Provision Time</div>
      </div>
      <div class="rounded bg-[var(--card)] p-2 border border-[var(--border)]">
        <div class="font-bold text-[var(--signal)]">100%</div>
        <div class="text-[10px] text-[var(--muted-fg)]">Offline Ready</div>
      </div>
      <div class="rounded bg-[var(--card)] p-2 border border-[var(--border)]">
        <div class="font-bold text-[var(--fg)]">HA 3-Master</div>
        <div class="text-[10px] text-[var(--muted-fg)]">Zero SPOF</div>
      </div>
    </div>
  </div>
  <div class="lg:col-span-5 flex flex-col gap-3.5 text-left">
    <p class="text-label text-[var(--muted-fg)]">Infrastructure Automation · Featured</p>
    <h3 class="text-h3 text-[var(--fg)]">${esc(p.title)}</h3>
    <p class="text-sm text-[var(--muted-fg)] leading-relaxed">${esc(p.description || p.shortDesc)}</p>
    <ul class="flex flex-wrap gap-y-1 text-xs font-mono text-[var(--muted-fg)] pt-1">
      ${p.tags.map((t) => `<li class="sep">${esc(t)}</li>`).join('')}
    </ul>
    <div class="pt-2 flex items-center gap-5 text-sm font-medium">
      <a href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" class="inline-flex items-center gap-1.5 text-[var(--fg)] hover:text-[var(--primary)] underline-offset-4 hover:underline">
        <i class="fa-brands fa-github"></i>
        <span>Source code</span>
      </a>
    </div>
  </div>
</article>`;
      }

      return `<article class="project-card-trigger reveal is-visible card-interactive panel p-6 flex flex-col justify-between gap-4 text-left cursor-pointer" data-project-id="${esc(p.id)}">
  ${
    cover
      ? `<div class="relative aspect-video overflow-hidden rounded-xl bg-[var(--muted-bg)] border border-[var(--border)] mb-2">
    <img src="${esc(safeUrl(cover.src))}" alt="${esc(cover.caption || p.title)}" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
    ${count > 1 ? `<span class="absolute bottom-2 right-2 chip font-mono !bg-black/60 !text-white !border-white/10">${count} media</span>` : ''}
  </div>`
      : ''
  }
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <p class="text-label text-[var(--muted-fg)]">Engineering Project</p>
      <span class="font-mono text-xs ${online ? 'text-[var(--signal)]' : 'text-amber-500'}">● ${esc(p.status)}</span>
    </div>
    <h3 class="text-h3 text-[var(--fg)]">${esc(p.title)}</h3>
    <p class="text-sm text-[var(--muted-fg)] leading-relaxed">${esc(p.shortDesc)}</p>
  </div>
  <div class="space-y-3 pt-3 border-t border-[var(--border)]">
    <ul class="flex flex-wrap gap-y-1 text-xs font-mono text-[var(--muted-fg)]">
      ${p.tags.map((t) => `<li class="sep">${esc(t)}</li>`).join('')}
    </ul>
    <div class="flex items-center gap-4 text-sm font-medium">
      <a href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" class="inline-flex items-center gap-1.5 text-[var(--fg)] hover:text-[var(--primary)] hover:underline">
        <i class="fa-brands fa-github text-xs"></i>
        <span>Source code</span>
      </a>
    </div>
  </div>
</article>`;
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
