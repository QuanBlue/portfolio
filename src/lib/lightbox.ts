/**
 * Network-style lightbox: the photo sits in the centre, its metadata orbits around it
 * as connected nodes. Falls back to a stacked layout on small screens.
 */
import type { GalleryItem } from '../data/portfolio';
import { esc, safeUrl } from './render';

interface NodeSpec {
  label: string;
  html: string;
  wide?: boolean;
}

function buildNodes(item: GalleryItem): NodeSpec[] {
  const nodes: NodeSpec[] = [{ label: 'title', html: `<span class="text-sm font-bold text-white">${esc(item.title)}</span>` }];
  if (item.date) nodes.push({ label: 'date', html: esc(item.date) });
  if (item.location) nodes.push({ label: 'location', html: esc(item.location) });
  for (const d of item.details ?? []) {
    if (d.label || d.value) nodes.push({ label: d.label || 'info', html: esc(d.value) });
  }
  if (item.tags?.length) {
    nodes.push({
      label: 'tags',
      html: `<div class="flex flex-wrap gap-1">${item.tags
        .map((t) => `<span class="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">${esc(t)}</span>`)
        .join('')}</div>`,
    });
  }
  if (item.description) nodes.push({ label: 'description', html: esc(item.description), wide: true });
  return nodes;
}

function nodeCard(n: NodeSpec, style: string, index: number): string {
  return `<div class="lb-node ${style}" style="animation-delay:${0.08 * index + 0.15}s">
  <div class="text-[9px] uppercase tracking-widest text-emerald-400/80 mb-1">${esc(n.label)}</div>
  <div class="text-zinc-200 break-words ${n.wide ? 'max-h-32 overflow-y-auto custom-scrollbar' : ''}">${n.html}</div>
</div>`;
}

function renderDesktop(item: GalleryItem, zoomed: boolean): string {
  const nodes = buildNodes(item);
  const n = nodes.length;
  const cx = 50;
  const cy = 50;
  let lines = '';
  let cards = '';
  nodes.forEach((node, i) => {
    const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
    // Alternate radii when crowded so nodes don't overlap.
    const k = n > 8 && i % 2 === 1 ? 0.78 : 1;
    const x = cx + 39 * k * Math.cos(angle);
    const y = cy + 37 * k * Math.sin(angle);
    lines += `<line class="lb-line" x1="${cx}" y1="${cy}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" style="animation-delay:${0.08 * i}s" />`;
    cards += nodeCard(
      node,
      'absolute -translate-x-1/2 -translate-y-1/2 w-max max-w-[210px] rounded-lg border border-emerald-500/40 bg-zinc-900/90 p-2.5 font-mono text-xs shadow-lg shadow-emerald-500/10',
      i,
    ).replace('style="', `style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;`);
  });
  return `<div class="relative w-full h-full ${zoomed ? 'lb-zoomed' : ''}">
  <svg class="lb-lines absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
  <div class="lb-nodes">${cards}</div>
  <button type="button" data-lb-zoom class="lb-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-zoom-in" aria-label="Toggle zoom">
    <img src="${esc(safeUrl(item.image))}" alt="${esc(item.title)}" class="block rounded-xl border-2 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.35)] object-contain bg-black/40" />
  </button>
</div>`;
}

function renderMobile(item: GalleryItem): string {
  const nodes = buildNodes(item);
  return `<div class="w-full h-full overflow-y-auto p-4 space-y-3">
  <img src="${esc(safeUrl(item.image))}" alt="${esc(item.title)}" class="w-full rounded-xl border-2 border-emerald-500 object-contain bg-black/40 max-h-[55vh]" />
  ${nodes
    .map((n, i) => nodeCard(n, 'rounded-lg border border-emerald-500/40 bg-zinc-900/90 p-2.5 font-mono text-xs', i))
    .join('')}
</div>`;
}

export function openLightbox(items: GalleryItem[], startIndex: number): void {
  if (!items.length) return;
  let index = startIndex;
  let zoomed = false;
  const mql = window.matchMedia('(min-width: 768px)');

  const root = document.createElement('div');
  root.className = 'fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm text-zinc-100 opacity-0 transition-opacity duration-200';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.innerHTML = `
    <div class="lb-grid absolute inset-0 pointer-events-none"></div>
    <div id="lb-stage" class="absolute inset-0"></div>
    <button type="button" data-lb-close aria-label="Close" class="absolute top-3 right-4 z-10 text-3xl leading-none text-zinc-300 hover:text-red-400 cursor-pointer">&times;</button>
    <button type="button" data-lb-prev aria-label="Previous" class="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-4xl text-zinc-400 hover:text-emerald-400 cursor-pointer">&#8249;</button>
    <button type="button" data-lb-next aria-label="Next" class="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-4xl text-zinc-400 hover:text-emerald-400 cursor-pointer">&#8250;</button>
    <div id="lb-counter" class="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 font-mono text-[11px] text-zinc-500"></div>`;
  document.body.appendChild(root);
  document.body.style.overflow = 'hidden';

  const stage = root.querySelector<HTMLElement>('#lb-stage')!;
  const counter = root.querySelector<HTMLElement>('#lb-counter')!;

  const sizeCenter = () => {
    const img = stage.querySelector<HTMLImageElement>('.lb-center img');
    if (!img) return;
    const vw = stage.clientWidth;
    const vh = stage.clientHeight;
    img.style.maxWidth = zoomed ? `${vw * 0.9}px` : `${vw * 0.3}px`;
    img.style.maxHeight = zoomed ? `${vh * 0.88}px` : `${vh * 0.42}px`;
  };

  const render = () => {
    const item = items[index];
    stage.innerHTML = mql.matches ? renderDesktop(item, zoomed) : renderMobile(item);
    counter.textContent = `${index + 1} / ${items.length}${mql.matches ? '  ·  click image to zoom' : ''}`;
    sizeCenter();
    stage.querySelector('[data-lb-zoom]')?.addEventListener('click', () => {
      zoomed = !zoomed;
      render();
    });
  };

  const go = (delta: number) => {
    index = (index + delta + items.length) % items.length;
    zoomed = false;
    render();
  };

  const close = () => {
    root.classList.add('opacity-0');
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', sizeCenter);
    mql.removeEventListener('change', render);
    document.body.style.overflow = '';
    setTimeout(() => root.remove(), 200);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') (zoomed ? ((zoomed = false), render()) : close());
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
  };

  root.querySelector('[data-lb-close]')!.addEventListener('click', close);
  root.querySelector('[data-lb-prev]')!.addEventListener('click', () => go(-1));
  root.querySelector('[data-lb-next]')!.addEventListener('click', () => go(1));
  stage.addEventListener('click', (e) => {
    if (e.target === stage || (e.target as HTMLElement).closest('.lb-lines')) close();
  });
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', sizeCenter);
  mql.addEventListener('change', render);

  render();
  requestAnimationFrame(() => root.classList.remove('opacity-0'));
}
