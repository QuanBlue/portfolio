/**
 * Reusable Terminal Typing Animation Engine
 * Handles character-by-character text reveal, cursor coordination,
 * UTF-8 characters, and graceful reduced-motion support.
 */

export interface TypeOptions {
  speed?: number;       // ms per character
  delay?: number;       // initial delay in ms
  onChar?: (current: string) => void;
  onComplete?: () => void;
}

export function typeText(
  targetEl: HTMLElement,
  fullText: string,
  options: TypeOptions = {}
): () => void {
  const isReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Immediate completion if reduced motion is requested
  if (isReducedMotion) {
    targetEl.textContent = fullText;
    options.onComplete?.();
    return () => {};
  }

  const speed = options.speed ?? 32;
  const initialDelay = options.delay ?? 120;
  let timerId: number | null = null;
  let currentIndex = 0;
  let isCancelled = false;

  // Clear text to start typing
  targetEl.textContent = '';

  const parent = targetEl.closest('[data-terminal-prompt]');
  const cursor = parent?.querySelector('.ff-cursor');
  if (cursor) {
    cursor.classList.add('is-typing');
  }

  function tick() {
    if (isCancelled) return;

    if (currentIndex <= fullText.length) {
      targetEl.textContent = fullText.slice(0, currentIndex);
      options.onChar?.(targetEl.textContent);
      currentIndex++;

      if (currentIndex <= fullText.length) {
        // Natural jitter between 0.8x and 1.25x
        const jitter = speed * (0.85 + Math.random() * 0.35);
        timerId = window.setTimeout(tick, jitter);
      } else {
        if (cursor) {
          cursor.classList.remove('is-typing');
        }
        options.onComplete?.();
      }
    }
  }

  timerId = window.setTimeout(tick, initialDelay);

  // Return cancel function
  return () => {
    isCancelled = true;
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    // Guarantee full text is visible upon cancel
    targetEl.textContent = fullText;
    if (cursor) {
      cursor.classList.remove('is-typing');
    }
  };
}
