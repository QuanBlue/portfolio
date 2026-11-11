/**
 * Knight Theme Interactive Motion & Event Orchestrator
 * Coordinates cursor tracking, navigation spy, tooltips, and procedural hover glimmers
 */

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

  // 4. GitHub Contribution Calendar Tooltip
  let tooltip = document.querySelector<HTMLElement>('.kn-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'kn-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    document.body.appendChild(tooltip);
  }

  const cells = root.querySelectorAll<HTMLElement>('.kn-cal-cell');
  const calGrid = root.querySelector<HTMLElement>('[data-kn-cal]');
  const heatmapStr = calGrid?.dataset.knCal || '';

  cells.forEach((cell, idx) => {
    const level = heatmapStr[idx] || '0';
    cell.dataset.level = level;

    // Approximate date & contributions for tooltip
    const weeksAgo = 52 - Math.floor(idx / 7);
    const dayOfWeek = idx % 7;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const count = level === '0' ? 0 : Number(level) * 3 + (idx % 4);

    cell.addEventListener('mouseenter', () => {
      if (!tooltip) return;
      const rect = cell.getBoundingClientRect();
      const countLabel = count === 0 ? 'No contributions' : `${count} contributions`;
      tooltip.textContent = `${countLabel} · ${weeksAgo}w ago (${dayNames[dayOfWeek]})`;
      tooltip.style.left = `${rect.left + rect.width / 2}px`;
      tooltip.style.top = `${rect.top}px`;
      tooltip.classList.add('is-visible');
    });

    cell.addEventListener('mouseleave', () => {
      if (tooltip) tooltip.classList.remove('is-visible');
    });
  });

  cleanups.push(() => {
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
