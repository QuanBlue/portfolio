/**
 * Monospace Character Scramble & Wave Reveal Engine
 * Matches the procedural glyph reveal observed on https://quanblue.forkfolio.dev/
 */

const GLYPH_SETS: Record<string, string> = {
  name: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:-+',
  drift: '.:-=+*#@!<>{}[]()/',
  diag: '{}=>;()[]:.,~+-*/',
  ribbon: '.:-=+*&;{}#<>~',
  sprout: '<>/{};#.*&^~',
  columns: '0123456789+-=:.',
  settle: '.:-=+*#@!<>{}[]()/',
  sweep: '{}=>;()',
  eddy: 'def:_()#',
  rise: '<>/{};#.',
  rain: 'def:_()#',
  slats: '{}=>;()',
  dust: '.:-=+',
};

export function initCharacterScramble(root: HTMLElement): () => void {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const headings = root.querySelectorAll<HTMLElement>('.kn-asc[data-kn-t], [data-kn-r][data-kn-rm]');

  if (isReducedMotion) {
    headings.forEach((el) => el.setAttribute('data-f', ''));
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const target = entry.target as HTMLElement;
        observer.unobserve(target);

        const type = target.dataset.knT || target.dataset.knRm || 'drift';
        const glyphs = target.dataset.knRg || GLYPH_SETS[type] || GLYPH_SETS.drift;
        const originalText = target.dataset.ld || target.textContent || '';
        
        scrambleText(target, originalText, glyphs);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  headings.forEach((el) => observer.observe(el));

  return () => observer.disconnect();
}

function scrambleText(element: HTMLElement, targetText: string, glyphs: string) {
  const lines = targetText.split('\n');
  const duration = Math.min(800, Math.max(400, targetText.length * 28));
  const startTime = performance.now();

  function update(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);

    // Eased progress (cubic ease-out)
    const eased = 1 - Math.pow(1 - progress, 3);
    const resolvedCharCount = Math.floor(eased * targetText.length);

    let charIndex = 0;
    const renderedLines = lines.map((line) => {
      return line
        .split('')
        .map((ch) => {
          if (ch === ' ' || ch === '\t') return ch;
          const isResolved = charIndex < resolvedCharCount;
          charIndex++;

          if (isResolved) return ch;
          const randomGlyph = glyphs[Math.floor(Math.random() * glyphs.length)];
          return randomGlyph;
        })
        .join('');
    });

    element.textContent = renderedLines.join('\n');

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = targetText;
      element.setAttribute('data-f', '');
    }
  }

  requestAnimationFrame(update);
}
