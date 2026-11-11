/**
 * Magnetic Element Proximity Engine
 * Reproduces the magnetic pull interaction observed on buttons in https://quanblue.forkfolio.dev/
 */

export function initMagneticElements(root: HTMLElement): () => void {
  const isTouch = window.matchMedia('(hover: none)').matches;
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isTouch || isReducedMotion) return () => {};

  const elements = root.querySelectorAll<HTMLElement>('[data-magnetic]');
  const cleanups: (() => void)[] = [];

  elements.forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 10;
    let rafId: number | null = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isHovered = false;

    function render() {
      // Linear interpolation (lerp) for smooth magnetic pull
      currentX += (targetX - currentX) * 0.22;
      currentY += (targetY - currentY) * 0.22;

      el.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;

      if (isHovered || Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
        rafId = requestAnimationFrame(render);
      } else {
        el.style.transform = 'translate3d(0, 0, 0)';
        rafId = null;
      }
    }

    function onMouseMove(e: MouseEvent) {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;

      targetX = (distX / (rect.width / 2)) * strength;
      targetY = (distY / (rect.height / 2)) * strength;

      if (!rafId) {
        isHovered = true;
        rafId = requestAnimationFrame(render);
      }
    }

    function onMouseLeave() {
      isHovered = false;
      targetX = 0;
      targetY = 0;
      if (!rafId) {
        rafId = requestAnimationFrame(render);
      }
    }

    el.addEventListener('mousemove', onMouseMove, { passive: true });
    el.addEventListener('mouseleave', onMouseLeave, { passive: true });

    cleanups.push(() => {
      if (rafId) cancelAnimationFrame(rafId);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.style.transform = '';
    });
  });

  return () => {
    cleanups.forEach((c) => c());
  };
}
