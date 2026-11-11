import { typeText } from './terminal-typing';

/**
 * Section Terminal Sequence Orchestrator
 * Coordinates section entrance prompts, typing sequences, progress bars,
 * and output reveals with zero layout shifting.
 */

export interface SequenceConfig {
  root?: HTMLElement;
  scrollRoot?: HTMLElement | null;
  threshold?: number;
  rootMargin?: string;
}

export function initTerminalSequences(config: SequenceConfig = {}) {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = config.root || document.querySelector('[data-theme-wrapper="forkfolio"]');
  if (!root) return;

  const sections = root.querySelectorAll<HTMLElement>('[data-terminal-section]');

  if (isReducedMotion) {
    sections.forEach((sec) => {
      sec.setAttribute('data-terminal-state', 'completed');
      const progBars = sec.querySelectorAll<HTMLElement>('.ff-term-prog-bar');
      progBars.forEach((bar) => {
        bar.style.width = '100%';
      });
      const pcts = sec.querySelectorAll<HTMLElement>('.ff-prog-pct');
      pcts.forEach((pct) => {
        pct.textContent = '100%';
      });
      const completes = sec.querySelectorAll<HTMLElement>('.ff-prog-complete');
      completes.forEach((c) => c.classList.remove('hidden'));
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const sec = entry.target as HTMLElement;
        const currentState = sec.getAttribute('data-terminal-state');

        // Execute only once per session
        if (currentState === 'completed' || currentState === 'running') {
          observer.unobserve(sec);
          return;
        }

        sec.setAttribute('data-terminal-state', 'running');
        observer.unobserve(sec);

        // Run prompt typing
        const promptEl = sec.querySelector<HTMLElement>('[data-terminal-prompt]');
        const typeTarget = promptEl?.querySelector<HTMLElement>('.ff-type-text');
        const fullCommand = promptEl?.getAttribute('data-command') || typeTarget?.getAttribute('data-text') || '';
        const speed = Number(promptEl?.getAttribute('data-type-speed')) || 32;
        const delay = Number(promptEl?.getAttribute('data-type-delay')) || 100;

        if (typeTarget && fullCommand) {
          typeText(typeTarget, fullCommand, {
            speed,
            delay,
            onComplete: () => {
              // Trigger progress bar if present
              animateProgressBar(sec, () => {
                sec.setAttribute('data-terminal-state', 'completed');
              });
            },
          });
        } else {
          sec.setAttribute('data-terminal-state', 'completed');
        }
      });
    },
    {
      root: config.scrollRoot || null,
      threshold: config.threshold ?? 0.12,
      rootMargin: config.rootMargin ?? '0px 0px -50px 0px',
    }
  );

  sections.forEach((sec) => {
    // If not already completed, set to idle and observe
    if (sec.getAttribute('data-terminal-state') !== 'completed') {
      sec.setAttribute('data-terminal-state', 'idle');
      observer.observe(sec);
    }
  });

  return () => {
    observer.disconnect();
  };
}

function animateProgressBar(container: HTMLElement, onDone: () => void) {
  const progContainer = container.querySelector<HTMLElement>('[data-terminal-progress]');
  if (!progContainer) {
    onDone();
    return;
  }

  const bar = progContainer.querySelector<HTMLElement>('.ff-term-prog-bar');
  const pct = progContainer.querySelector<HTMLElement>('.ff-prog-pct');
  const step = progContainer.querySelector<HTMLElement>('.ff-prog-step');
  const complete = progContainer.querySelector<HTMLElement>('.ff-prog-complete');

  if (!bar) {
    onDone();
    return;
  }

  const targetPct = Number(bar.getAttribute('data-target-percent')) || 100;
  let current = 0;
  const duration = 650; // ms
  const start = performance.now();

  function stepProgress(now: number) {
    const elapsed = now - start;
    const progress = Math.min(1, elapsed / duration);
    // Easing out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    current = Math.round(eased * targetPct);

    bar!.style.width = `${current}%`;
    if (pct) pct.textContent = `${current}%`;

    if (progress < 1) {
      requestAnimationFrame(stepProgress);
    } else {
      if (complete) complete.classList.remove('hidden');
      if (step) step.textContent = 'Installation & build verification complete';
      onDone();
    }
  }

  requestAnimationFrame(stepProgress);
}
