/**
 * Knight Theme Inertial Smooth Scrolling Controller
 * Powered by Lenis 1.3.x with single-RAF loop integration and native touch support.
 */
import Lenis from 'lenis';

export interface KnightScrollController {
  lenis: Lenis | null;
  scrollTo: (target: HTMLElement | string, options?: { offset?: number; immediate?: boolean }) => void;
  destroy: () => void;
}

export function initKnightScroll(root: HTMLElement): KnightScrollController {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isLite = /[?&]lite(=|&|$)/.test(location.search) || document.documentElement.classList.contains('ff-lite');

  // For reduced motion or lite mode, use native instant scrolling without Lenis
  if (isReducedMotion || isLite) {
    return {
      lenis: null,
      scrollTo: (target: HTMLElement | string, options?: { offset?: number; immediate?: boolean }) => {
        const el = typeof target === 'string' ? root.querySelector<HTMLElement>(target) : target;
        if (el) {
          const nav = root.querySelector<HTMLElement>('.kn-nav');
          const navHeight = nav ? nav.getBoundingClientRect().height : 80;
          const offset = options?.offset ?? (target === '#top' ? 0 : -navHeight);
          const top = el.getBoundingClientRect().top + window.scrollY + offset;
          window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
        }
      },
      destroy: () => {
        document.documentElement.classList.remove('lenis', 'lenis-smooth');
      },
    };
  }

  // Create single Lenis instance matching reference configuration
  const lenis = new Lenis({
    smoothWheel: true,
    syncTouch: false, // Keep native touch scrolling on mobile devices
    syncTouchLerp: 0.075,
    touchInertiaExponent: 1.7,
    duration: 1.2,
    lerp: 0.1,
    autoRaf: false, // Ticked synchronously in the Knight stage RAF loop
    anchors: false,
    autoResize: true,
    overscroll: true,
    wheelMultiplier: 1,
    touchMultiplier: 1,
  });

  // Add Lenis classes to document root
  document.documentElement.classList.add('lenis', 'lenis-smooth');

  // Expose to window so onScrollFrame can tick Lenis.raf(now)
  (window as any).__knightLenis = lenis;

  return {
    lenis,
    scrollTo: (target: HTMLElement | string, options?: { offset?: number; immediate?: boolean }) => {
      const el = typeof target === 'string' ? root.querySelector<HTMLElement>(target) : target;
      if (!el && typeof target === 'string' && target !== '#top') return;

      const nav = root.querySelector<HTMLElement>('.kn-nav');
      const navHeight = nav ? nav.getBoundingClientRect().height : 80;
      const targetOffset = options?.offset ?? (target === '#top' ? 0 : -navHeight);

      if (options?.immediate || isReducedMotion) {
        if (target === '#top' || !el) {
          window.scrollTo({ top: 0, behavior: 'auto' });
        } else {
          lenis.scrollTo(el, { offset: targetOffset, immediate: true });
        }
      } else {
        if (target === '#top' || !el) {
          lenis.scrollTo(0, {
            duration: 1.2,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          });
        } else {
          lenis.scrollTo(el, {
            offset: targetOffset,
            duration: 1.2,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          });
        }
      }
    },
    destroy: () => {
      try {
        lenis.destroy();
      } catch (e) {}
      delete (window as any).__knightLenis;
      document.documentElement.classList.remove('lenis', 'lenis-smooth');
    },
  };
}
