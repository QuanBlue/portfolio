/**
 * Knight Theme Interactive Motion & Event Orchestrator
 * Coordinates cursor tracking, navigation spy, tooltips, and procedural hover glimmers
 */

import { formatUtcDate } from '../../../lib/github-activity';
import { getTranslations } from '../../../i18n/translate';
import { initCharacterScramble } from './character-scramble';
import { initMagneticElements } from './magnetic';

export function setupKnightInteractions(root: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];

  // 1. Initialize character scramble and magnetic elements
  cleanups.push(initCharacterScramble(root));
  cleanups.push(initMagneticElements(root));

  // 2. Interactive Monospace Crosshair Cursor
  const isTouch = window.matchMedia('(hover: none)').matches;
  if (!isTouch) {
    let cursor = document.querySelector<HTMLElement>('.kn-cur-floating');
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.className = 'kn-cur-floating';
      cursor.setAttribute('aria-hidden', 'true');
      document.body.appendChild(cursor);
    }

    let mouseX = -100;
    let mouseY = -100;
    let curX = -100;
    let curY = -100;
    let curRaf: number | null = null;

    function renderCursor() {
      curX += (mouseX - curX) * 0.35;
      curY += (mouseY - curY) * 0.35;
      if (cursor) {
        cursor.style.transform = `translate3d(${curX.toFixed(1)}px, ${curY.toFixed(1)}px, 0) translate(-50%, -50%)`;
      }
      if (Math.abs(mouseX - curX) > 0.1 || Math.abs(mouseY - curY) > 0.1) {
        curRaf = requestAnimationFrame(renderCursor);
      } else {
        curRaf = null;
      }
    }

    function onPointerMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!curRaf) {
        curRaf = requestAnimationFrame(renderCursor);
      }

      const target = e.target as HTMLElement | null;
      const isHit = Boolean(
        target?.closest('a, button, input, textarea, .kn-row, .kn-p, .kn-cal-cell, .kn-sk-i, [data-interactive]')
      );
      if (cursor) {
        cursor.setAttribute('data-hit', isHit ? '1' : '0');
      }
    }

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    cleanups.push(() => {
      window.removeEventListener('mousemove', onPointerMove);
      if (curRaf) cancelAnimationFrame(curRaf);
      if (cursor && cursor.parentNode) cursor.parentNode.removeChild(cursor);
    });
  }

  // 3. Smooth Scroll Navigation for Anchor Links
  const anchorLinks = root.querySelectorAll<HTMLAnchorElement>('.kn-nav a[href^="#"]');
  anchorLinks.forEach((link) => {
    function onClick(e: MouseEvent) {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = root.querySelector<HTMLElement>(href) || document.querySelector<HTMLElement>(href);
      if (target) {
        e.preventDefault();
        const nav = root.querySelector<HTMLElement>('.kn-nav');
        const navHeight = nav ? nav.getBoundingClientRect().height : 80;
        const targetTop = target.getBoundingClientRect().top + window.scrollY - (href === '#top' ? 0 : navHeight);

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const lenis = (window as any).__knightLenis;
        if (lenis && !prefersReducedMotion) {
          lenis.scrollTo(target, {
            offset: href === '#top' ? 0 : -navHeight,
            duration: 1.2,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          });
        } else {
          window.scrollTo({
            top: Math.max(0, targetTop),
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
          });
        }

        if (history.pushState) {
          history.pushState(null, '', href);
        } else {
          location.hash = href;
        }

        // Immediately update active status
        const targetId = href.replace('#', '');
        navLinks.forEach((l) => {
          const lTarget = l.getAttribute('href')?.replace('#', '');
          if (lTarget === targetId) {
            l.setAttribute('data-on', '');
          } else {
            l.removeAttribute('data-on');
          }
        });
        if (navHere) navHere.textContent = targetId === 'top' ? '' : targetId;
      }
    }

    link.addEventListener('click', onClick);
    cleanups.push(() => link.removeEventListener('click', onClick));
  });

  // 4. Navigation Spy & Active Section Tracker
  const navLinks = root.querySelectorAll<HTMLAnchorElement>('.kn-nav-l a[href^="#"]');
  const navHere = root.querySelector<HTMLElement>('.kn-nav-here');
  const sections = root.querySelectorAll<HTMLElement>('.kn-sec[id], .kn-hero[id]');

  function updateNav() {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const vh = window.innerHeight;
    let currentId = 'top';

    sections.forEach((sec) => {
      const top = sec.offsetTop - vh * 0.38;
      if (scrollY >= top) {
        currentId = sec.id || currentId;
      }
    });

    navLinks.forEach((link) => {
      const target = link.getAttribute('href')?.replace('#', '');
      const isActive = target === currentId;
      if (isActive) {
        link.setAttribute('data-on', '');
        if (navHere) navHere.textContent = target === 'top' ? '' : target;
      } else {
        link.removeAttribute('data-on');
      }
    });
  }

  let navTicking = false;
  function onNavScroll() {
    if (!navTicking) {
      navTicking = true;
      requestAnimationFrame(() => {
        updateNav();
        navTicking = false;
      });
    }
  }

  window.addEventListener('scroll', onNavScroll, { passive: true });
  updateNav();
  cleanups.push(() => window.removeEventListener('scroll', onNavScroll));

  // 4. GitHub Contribution Calendar Tooltip (Delegated + Keyboard Accessible + Viewport-Clamped)
  let tooltip = document.querySelector<HTMLElement>('.kn-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'kn-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    document.body.appendChild(tooltip);
  }

  function showCellTooltip(cell: HTMLElement) {
    if (!tooltip) return;
    const dateStr = cell.dataset.date;
    if (!dateStr) return;
    const rawCount = Number(cell.dataset.count || '0');
    const count = Number.isFinite(rawCount) ? rawCount : 0;
    const loc = document.documentElement.lang === 'vi' ? 'vi' : 'en';
    const actDict = getTranslations(loc).activity!;
    const numFmt = new Intl.NumberFormat(loc === 'vi' ? 'vi-VN' : 'en-US');
    const countLabel =
      count === 0
        ? actDict.noContributions
        : `${numFmt.format(count)} ${count === 1 ? actDict.contributionSingular : actDict.contributionPlural}`;
    tooltip.textContent = `${countLabel} · ${formatUtcDate(dateStr, loc)}`;

    const rect = cell.getBoundingClientRect();
    const showBelow = rect.top < 48;
    tooltip.classList.toggle('is-below', showBelow);

    tooltip.classList.add('is-visible');
    const tipWidth = tooltip.offsetWidth || 160;
    const half = tipWidth / 2;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const targetX = rect.left + rect.width / 2;
    const clampedX = Math.max(half + 12, Math.min(vw - half - 12, targetX));

    tooltip.style.left = `${clampedX.toFixed(1)}px`;
    tooltip.style.top = `${(showBelow ? rect.bottom : rect.top).toFixed(1)}px`;
  }

  function hideCellTooltip() {
    if (tooltip) tooltip.classList.remove('is-visible');
  }

  function onRootPointerOver(e: MouseEvent) {
    const cell = (e.target as HTMLElement | null)?.closest<HTMLElement>('.kn-cal-cell');
    if (cell) showCellTooltip(cell);
  }

  function onRootPointerOut(e: MouseEvent) {
    const cell = (e.target as HTMLElement | null)?.closest<HTMLElement>('.kn-cal-cell');
    if (cell) hideCellTooltip();
  }

  function onRootFocusIn(e: FocusEvent) {
    const cell = (e.target as HTMLElement | null)?.closest<HTMLElement>('.kn-cal-cell');
    if (cell) showCellTooltip(cell);
  }

  function onRootFocusOut(e: FocusEvent) {
    const cell = (e.target as HTMLElement | null)?.closest<HTMLElement>('.kn-cal-cell');
    if (cell) hideCellTooltip();
  }

  function onTooltipEscape(e: KeyboardEvent) {
    if (e.key === 'Escape') hideCellTooltip();
  }

  root.addEventListener('mouseover', onRootPointerOver);
  root.addEventListener('mouseout', onRootPointerOut);
  root.addEventListener('focusin', onRootFocusIn);
  root.addEventListener('focusout', onRootFocusOut);
  document.addEventListener('keydown', onTooltipEscape);

  cleanups.push(() => {
    root.removeEventListener('mouseover', onRootPointerOver);
    root.removeEventListener('mouseout', onRootPointerOut);
    root.removeEventListener('focusin', onRootFocusIn);
    root.removeEventListener('focusout', onRootFocusOut);
    document.removeEventListener('keydown', onTooltipEscape);
    if (tooltip && tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
  });

  // 5. Plate Cover Procedural Monogram Glimmer on Mousemove
  const plates = root.querySelectorAll<HTMLElement>('.kn-plate');
  plates.forEach((plate) => {
    const cv = plate.querySelector<HTMLElement>('.kn-plate-cv');
    if (!cv) return;

    function onPlateMove(e: MouseEvent) {
      const rect = plate.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      cv.style.transform = `perspective(600px) rotateY(${(relX * 6).toFixed(1)}deg) rotateX(${(-relY * 6).toFixed(1)}deg)`;
    }

    function onPlateLeave() {
      cv.style.transform = '';
    }

    plate.addEventListener('mousemove', onPlateMove, { passive: true });
    plate.addEventListener('mouseleave', onPlateLeave, { passive: true });
    cleanups.push(() => {
      plate.removeEventListener('mousemove', onPlateMove);
      plate.removeEventListener('mouseleave', onPlateLeave);
    });
  });

  return () => {
    cleanups.forEach((c) => c());
  };
}
