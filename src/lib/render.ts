/**
 * Pure HTML renderers shared by Astro (build time) and the browser (live edits).
 * Every user-provided string goes through `esc` / `safeUrl`.
 */
import {
  resolveAvatarUrl,
  type Certification,
  type EducationItem,
  type ExperienceItem,
  type GalleryItem,
  type Identity,
  type Project,
  type Skill,
  type PortfolioData,
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
  const url = resolveAvatarUrl({ identity });
  if (url) {
    return `<img src="${esc(url)}" alt="${esc(identity.name)}" class="aspect-[4/5] w-full rounded-xl object-cover squircle transition-transform duration-500 hover:scale-[1.02]" onerror="this.style.display='none';const n=this.nextElementSibling;if(n)n.style.display='flex';" /><div style="display:none" class="aspect-[4/5] w-full rounded-xl squircle items-center justify-center bg-[var(--muted-bg)]"><span class="font-display text-5xl font-bold gradient-text">${esc(initials(identity.name))}</span></div>`;
  }
  return `<div class="aspect-[4/5] w-full rounded-xl squircle flex items-center justify-center bg-[var(--muted-bg)]"><span class="font-display text-5xl font-bold gradient-text">${esc(initials(identity.name))}</span></div>`;
}

export interface SkillGroup {
  category: string;
  items: Skill[];
}

/**
 * Groups skills by their configured `category` (or `category_vi` in Vietnamese),
 * falling back cleanly to `tag` label or "General". Shared across themes.
 */
export function groupSkillsByCategory(skills: Skill[] = [], locale: 'en' | 'vi' = 'en'): SkillGroup[] {
  const groups = new Map<string, Skill[]>();
  skills.forEach((s) => {
    let cat = (locale === 'vi' && s.category_vi ? s.category_vi : s.category || '').trim();
    if (!cat && s.tag) {
      const cleanTag = s.tag.replace(/^\[|\]$/g, '').trim();
      cat = cleanTag || (locale === 'vi' ? 'Chung' : 'General');
    }
    if (!cat) cat = locale === 'vi' ? 'Chung' : 'General';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(s);
  });
  return Array.from(groups.entries()).map(([category, items]) => ({ category, items }));
}

export function renderSkills(skills: Skill[], emptyLabel = 'No published skills configured.'): string {
  if (!skills || skills.length === 0) {
    return `<li class="text-xs font-mono text-[var(--muted-fg)]">${esc(emptyLabel)}</li>`;
  }
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

export function renderCerts(certs: Certification[], emptyLabel = 'No published certifications configured.'): string {
  if (!certs || certs.length === 0) {
    return `<p class="text-xs font-mono text-[var(--muted-fg)] col-span-full">${esc(emptyLabel)}</p>`;
  }
  return certs
    .map(
      (c) => `<div class="panel card-interactive p-4 flex items-start gap-3">
  <span class="mt-0.5 w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${
    c.color === 'yellow' ? 'bg-amber-500/15 text-amber-500' : 'bg-sky-500/15 text-sky-500'
  }">★</span>
  <div class="min-w-0 flex-1">
    <p class="text-sm font-semibold text-[var(--fg)]">${esc(c.name)}</p>
    <p class="text-xs text-[var(--muted-fg)] mt-0.5">${esc(c.issuer)}${c.issueDate ? ` · ${esc(c.issueDate)}` : ''}</p>
    ${c.credentialId ? `<p class="text-[11px] font-mono text-[var(--muted-fg)] mt-1">ID: ${esc(c.credentialId)}</p>` : ''}
    ${
      c.credentialUrl
        ? `<a href="${esc(safeUrl(c.credentialUrl))}" target="_blank" rel="noopener noreferrer" class="inline-block mt-1.5 text-xs font-mono text-[var(--signal)] hover:underline">Verify ↗</a>`
        : ''
    }
  </div>
</div>`,
    )
    .join('');
}

export function renderExperience(items: ExperienceItem[], emptyLabel = 'No published experience configured.'): string {
  if (!items || items.length === 0) {
    return `<p class="text-sm font-mono text-[var(--muted-fg)] text-center py-6">${esc(emptyLabel)}</p>`;
  }
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

export function renderEducation(items: EducationItem[] = [], emptyLabel = 'No published education configured.'): string {
  if (!items || items.length === 0) {
    return `<li class="py-6 text-sm font-mono text-[var(--muted-fg)]">${esc(emptyLabel)}</li>`;
  }
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

export function renderProjects(projects: Project[], emptyLabel = 'No published projects configured.'): string {
  if (!projects || projects.length === 0) {
    return `<p class="md:col-span-2 text-sm font-mono text-[var(--muted-fg)] py-8">${esc(emptyLabel)}</p>`;
  }
  return projects
    .map((p, idx) => {
      const cover = p.media?.[0];
      const count = p.media?.length ?? 0;
      const online = p.status === 'ONLINE';
      const num = String(idx + 1).padStart(2, '0');
      const total = String(projects.length).padStart(2, '0');
      const primaryTag = p.tags?.[0] || 'Engineering';

      if (idx === 0) {
        return `<article class="project-card-trigger reveal is-visible card-interactive md:col-span-2 panel p-6 sm:p-8 grid gap-8 lg:grid-cols-12 lg:items-center group cursor-pointer" data-project-id="${esc(p.id)}">
  ${
    cover
      ? `<div class="lg:col-span-6 relative aspect-video overflow-hidden rounded-xl bg-[var(--muted-bg)] border border-[var(--border)]">
    <img src="${esc(safeUrl(cover.src))}" alt="${esc(cover.caption || p.title)}" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
    ${count > 1 ? `<span class="absolute bottom-2 right-2 chip font-mono !bg-black/60 !text-white !border-white/10">${count} media</span>` : ''}
  </div>`
      : `<div class="lg:col-span-6 rounded-xl border border-[var(--border)] bg-[var(--muted-bg)] p-5 font-mono text-xs space-y-3 transition-shadow duration-250 group-hover:shadow-[var(--shadow-raised)]">
    <div class="flex items-center justify-between border-b border-[var(--border)] pb-2.5 text-[11px] text-[var(--muted-fg)]">
      <span>PROJECT // ${num} / ${total}</span>
      <span class="${online ? 'text-[var(--signal)]' : 'text-amber-500'}">● ${esc(p.status)}</span>
    </div>
    <div class="space-y-2 py-2">
      <div class="text-sm font-bold text-[var(--fg)] uppercase tracking-wide">${esc(p.title)}</div>
      <div class="text-xs text-[var(--muted-fg)] leading-relaxed">${esc(p.shortDesc || p.description)}</div>
    </div>
    <div class="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--border)] text-[11px]">
      ${p.tags.map((t) => `<span class="px-2 py-0.5 rounded bg-[var(--card)] border border-[var(--border)] text-[var(--fg)]">#${esc(t)}</span>`).join('')}
    </div>
  </div>`
  }
  <div class="lg:col-span-6 flex flex-col gap-3.5 text-left">
    <p class="text-label text-[var(--muted-fg)]">${esc(primaryTag)} · Featured</p>
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

/**
 * Renders the clean, authentic 2-column A4 CV paper layout dynamically from PortfolioData.
 * Shared across SSR (build time) and client-side (real-time live edits / PDF export).
 */
export function renderCvSheetHtml(d: PortfolioData): string {
  const i = d.identity;
  const fullName = String(i.name || 'Nguyen Thanh Quan').toUpperCase();
  const contactParts = [
    i.email ? esc(i.email) : '',
    i.phone ? esc(i.phone) : '',
    i.location ? esc(i.location) : '',
  ].filter(Boolean);

  const links: { label: string; url: string }[] = [];
  if (i.github?.url) links.push({ label: 'GITHUB', url: i.github.url });
  links.push({ label: 'PORTFOLIO', url: 'https://thanhquan.dev/' });
  if (i.youtube?.url) links.push({ label: 'YOUTUBE', url: i.youtube.url });
  if (i.linkedin?.url) links.push({ label: 'LINKEDIN', url: i.linkedin.url });

  const linksMarkup = links
    .map(
      (l) =>
        `<a href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener noreferrer" class="hover:text-blue-700 underline underline-offset-2">${esc(l.label)}</a>`,
    )
    .join('<span>|</span>');

  // Bio / About Me
  const bioParagraphs = String(i.bio || '')
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Skills: 2-column balanced list
  const skills = d.skills || [];
  const half = Math.ceil(skills.length / 2);
  const leftSkills = skills.slice(0, half);
  const rightSkills = skills.slice(half);

  const renderSkillList = (list: Skill[]) =>
    list
      .map(
        (s) =>
          `<li><span class="font-medium text-zinc-900">${esc(s.name)}</span> <span class="text-zinc-500 font-mono text-[11px]">${esc(s.tag)}</span></li>`,
      )
      .join('');

  // Experience
  const expItems = (d.experience || [])
    .map((exp) => {
      const bullets = (exp.bullets || []).map((b) => `<li><span>${esc(b)}</span></li>`).join('');
      const techLine = exp.tags?.length
        ? `<li><span class="font-semibold text-zinc-900">Technologies:</span> ${exp.tags.map(esc).join(', ')}</li>`
        : '';
      return `<div>
      <div class="flex items-baseline justify-between font-bold text-zinc-950">
        <span class="text-[13px] sm:text-sm">${esc(exp.role)} — ${esc(exp.company)}</span>
        <span class="font-normal text-zinc-600 text-xs">${esc(exp.period)}</span>
      </div>
      <ul class="mt-1 space-y-0.5 list-disc list-inside text-zinc-800 text-xs sm:text-[13px]">
        ${bullets}
        ${techLine}
      </ul>
    </div>`;
    })
    .join('');

  // Projects
  const projectItems = (d.projects || [])
    .map((p) => {
      const techLine = p.tags?.length
        ? `<li><span class="font-semibold text-zinc-900">Technologies:</span> ${p.tags.map(esc).join(', ')}</li>`
        : '';
      const linkLine = p.link
        ? `<li><a href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener noreferrer" class="underline text-blue-600 hover:text-blue-800 font-medium">${p.link.includes('github') ? 'Source code' : 'Demo / Link'} ↗</a></li>`
        : '';
      return `<div>
      <div class="flex items-baseline justify-between font-bold text-zinc-950">
        <span class="text-[13px] sm:text-sm uppercase">${esc(p.title)}</span>
        <span class="font-mono text-xs ${p.status === 'ONLINE' ? 'text-emerald-700' : 'text-zinc-500'}">● ${esc(p.status)}</span>
      </div>
      <ul class="mt-1 space-y-0.5 list-disc list-inside text-zinc-800 text-xs sm:text-[13px]">
        <li><span>Description: ${esc(p.description || p.shortDesc)}</span></li>
        ${techLine}
        ${linkLine}
      </ul>
    </div>`;
    })
    .join('');

  // Education
  const eduItems = (d.education || [])
    .map((ed) => {
      return `<div>
      <div class="flex items-baseline justify-between font-bold text-zinc-950">
        <span class="text-[13px] sm:text-sm uppercase">${esc(ed.school)}</span>
        <span class="font-normal text-zinc-600 text-xs">${esc(ed.period)}</span>
      </div>
      <div class="text-zinc-800 text-xs sm:text-[13px] mt-0.5 font-medium">${esc(ed.degree)}</div>
      ${ed.description ? `<p class="text-zinc-700 text-xs mt-0.5">${esc(ed.description)}</p>` : ''}
    </div>`;
    })
    .join('');

  // Certifications (optional)
  const certItems = (d.certifications || [])
    .map((c) => {
      return `<li><span class="font-semibold text-zinc-950">${esc(c.name)}</span> — <span class="text-zinc-600">${esc(c.issuer)}</span></li>`;
    })
    .join('');

  return `<!-- Header: Centered Full Name, Contacts, Links -->
<header class="text-center pb-2">
  <h1 id="cv-sheet-name" class="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-zinc-950">
    ${esc(fullName)}
  </h1>
  <p id="cv-sheet-contact" class="text-xs sm:text-[13px] text-zinc-700 mt-2 font-normal">
    ${contactParts.join(' | ')}
  </p>
  <div class="flex flex-wrap items-center justify-center gap-2 text-xs font-bold uppercase text-zinc-900 mt-1.5 tracking-wider">
    ${linksMarkup}
  </div>
</header>

<hr class="border-t-2 border-zinc-950 my-3 sm:my-4" />

<div class="space-y-4 sm:space-y-5">
  <!-- Section 1: ABOUT ME -->
  <section class="flex flex-col sm:flex-row gap-3 sm:gap-6">
    <div class="w-full sm:w-44 shrink-0 font-bold text-xs sm:text-sm uppercase tracking-wider text-zinc-950 pt-0.5">
      ABOUT ME
    </div>
    <div class="flex-1 min-w-0 text-xs sm:text-[13px] text-zinc-800 leading-relaxed space-y-2">
      ${bioParagraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
    </div>
  </section>

  <!-- Section 2: SKILLS -->
  <section class="flex flex-col sm:flex-row gap-3 sm:gap-6">
    <div class="w-full sm:w-44 shrink-0 font-bold text-xs sm:text-sm uppercase tracking-wider text-zinc-950 pt-0.5">
      SKILLS
    </div>
    <div class="flex-1 min-w-0 text-xs sm:text-[13px] text-zinc-800 leading-relaxed grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
      <ul class="space-y-1 list-disc list-inside">
        ${renderSkillList(leftSkills)}
      </ul>
      <ul class="space-y-1 list-disc list-inside">
        ${renderSkillList(rightSkills)}
      </ul>
    </div>
  </section>

  ${
    expItems
      ? `<!-- Section 3: EXPERIENCE -->
  <section class="flex flex-col sm:flex-row gap-3 sm:gap-6">
    <div class="w-full sm:w-44 shrink-0 font-bold text-xs sm:text-sm uppercase tracking-wider text-zinc-950 pt-0.5 leading-snug">
      EXPERIENCE
    </div>
    <div class="flex-1 min-w-0 text-xs sm:text-[13px] text-zinc-800 leading-relaxed space-y-3">
      ${expItems}
    </div>
  </section>`
      : ''
  }

  ${
    projectItems
      ? `<!-- Section 4: PROJECT/ OPEN-SOURCE -->
  <section class="flex flex-col sm:flex-row gap-3 sm:gap-6">
    <div class="w-full sm:w-44 shrink-0 font-bold text-xs sm:text-sm uppercase tracking-wider text-zinc-950 pt-0.5 leading-snug">
      PROJECT/<br />OPEN-SOURCE
    </div>
    <div class="flex-1 min-w-0 text-xs sm:text-[13px] text-zinc-800 leading-relaxed space-y-3">
      ${projectItems}
    </div>
  </section>`
      : ''
  }

  ${
    eduItems
      ? `<!-- Section 5: EDUCATION -->
  <section class="flex flex-col sm:flex-row gap-3 sm:gap-6 pt-1">
    <div class="w-full sm:w-44 shrink-0 font-bold text-xs sm:text-sm uppercase tracking-wider text-zinc-950 pt-0.5">
      EDUCATION
    </div>
    <div class="flex-1 min-w-0 text-xs sm:text-[13px] text-zinc-800 leading-relaxed space-y-2">
      ${eduItems}
    </div>
  </section>`
      : ''
  }

  ${
    certItems
      ? `<!-- Section 6: CERTIFICATIONS -->
  <section class="flex flex-col sm:flex-row gap-3 sm:gap-6 pt-1">
    <div class="w-full sm:w-44 shrink-0 font-bold text-xs sm:text-sm uppercase tracking-wider text-zinc-950 pt-0.5">
      CERTIFICATIONS
    </div>
    <div class="flex-1 min-w-0 text-xs sm:text-[13px] text-zinc-800 leading-relaxed">
      <ul class="space-y-1 list-disc list-inside">
        ${certItems}
      </ul>
    </div>
  </section>`
      : ''
  }
</div>`;
}
