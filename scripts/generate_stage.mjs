import fs from 'fs';

const extracted = fs.readFileSync('scripts/ref_engine_extracted.js', 'utf8');

const defsStart = extracted.indexOf('function r(t,e){');
const defsEnd = extracted.indexOf(';t.s([');
const engineDefs = extracted.slice(defsStart, defsEnd);

const startIdx = extracted.indexOf('function(t){let e=!1');
const endIdx = extracted.indexOf('}(t)},[]),null') + 1;
const engineMain = extracted.slice(startIdx, endIdx);

console.log('engineDefs length:', engineDefs.length);
console.log('engineMain length:', engineMain.length);

const stageCode = `// @ts-nocheck
/**
 * Authentic ASCII Stage & WebGL Scene Renderer for Knight Theme
 * Generates genuine ASCII typography, luminance-sampled portrait, perspective ground plane, and floating particles.
 * Ported from authentic reference engine.
 */

// Helper 1: WebGL Shader Compiler
function createProgram(gl: WebGL2RenderingContext, vsSource: string, fsSource: string): WebGLProgram {
  function compile(type: number, src: string): WebGLShader {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const err = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error(err || 'Shader compile error');
    }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, vsSource);
  const fs = compile(gl.FRAGMENT_SHADER, fsSource);
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const err = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error(err || 'Program link error');
  }
  return prog;
}

// Helper 2: Scroll & RAF frame driver
function onScrollFrame(
  cb: (frame: { y: number; time: number; limit?: number }) => void,
  opts?: { always?: boolean }
): { off: () => void; setAlways: (a: boolean) => void } {
  let running = true;
  let rafId: number | null = null;
  let always = opts?.always ?? false;
  let lastY = -1;

  function onFrame(now: number) {
    if (!running) return;
    const y = window.scrollY || document.documentElement.scrollTop;
    const limit = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (always || y !== lastY) {
      lastY = y;
      cb({ y, time: now, limit });
    }
    rafId = requestAnimationFrame(onFrame);
  }

  rafId = requestAnimationFrame(onFrame);

  return {
    off() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    },
    setAlways(a: boolean) {
      always = a;
    }
  };
}

// Helper 3: Layout Watchers
function onLayout(cb: () => void) {
  window.addEventListener('resize', cb, { passive: true });
  window.addEventListener('orientationchange', cb, { passive: true });
  return () => {
    window.removeEventListener('resize', cb);
    window.removeEventListener('orientationchange', cb);
  };
}

function watchLayout(el: HTMLElement) {
  if (typeof ResizeObserver !== 'undefined' && el) {
    const ro = new ResizeObserver(() => {
      window.dispatchEvent(new Event('resize'));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }
  return () => {};
}

// Helper 4: WebGL Stage Controller
interface StageOptions {
  parent: HTMLElement;
  zIndex: number;
  animate: boolean;
  governor: boolean;
  className: string;
  context: WebGLContextAttributes;
  init: (gl: WebGL2RenderingContext, stage: any) => void;
  frame?: (gl: WebGL2RenderingContext, frameData: any) => void;
  draw?: (gl: WebGL2RenderingContext, frameData: any) => void;
  dispose?: (gl: WebGL2RenderingContext) => void;
  onFallback?: (reason: string) => void;
}

function createStage(opts: StageOptions) {
  let canvas: HTMLCanvasElement | null = document.createElement('canvas');
  canvas.className = ['ff-stage', opts.className].filter(Boolean).join(' ');
  canvas.setAttribute('aria-hidden', 'true');
  const st = canvas.style;
  st.position = 'fixed';
  st.left = '0';
  st.top = '0';
  st.width = '100%';
  st.height = '100lvh';
  st.display = 'block';
  st.pointerEvents = 'none';
  st.zIndex = String(opts.zIndex ?? -1);
  st.contain = 'strict';

  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: 'high-performance',
    ...opts.context
  }) as WebGL2RenderingContext | null;

  if (!gl) {
    opts.onFallback?.('no-webgl2');
    return {
      destroy() {
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
        canvas = null;
      }
    };
  }

  (opts.parent || document.body).prepend(canvas);

  let currentW = 0;
  let currentH = 0;
  const stage = {
    canvas,
    gl,
    invalidate() {},
    size(w: number, h: number, dpr: number) {
      if (!canvas) return;
      const targetW = Math.max(1, Math.round(w * dpr));
      const targetH = Math.max(1, Math.round(h * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        gl.viewport(0, 0, targetW, targetH);
        currentW = targetW;
        currentH = targetH;
      }
    }
  };

  try {
    opts.init(gl, stage);
  } catch (err) {
    console.warn('[KnightStage] WebGL2 init failed, falling back:', err);
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null;
    opts.onFallback?.('init-failed');
    return {
      destroy() {}
    };
  }

  // Drive animation frames
  let scrollDriver = onScrollFrame(frame => {
    if (!canvas || !gl) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    stage.size(cssW, cssH, dpr);
    opts.draw?.(gl, {
      tier: 'full',
      pixelRatio: dpr,
      cssWidth: cssW,
      cssHeight: cssH,
      scroll: { y: frame.y, layout: 0, limit: frame.limit },
      time: frame.time
    });
  }, { always: opts.animate });

  return {
    destroy() {
      scrollDriver.off();
      try {
        opts.dispose?.(gl);
      } catch (e) {}
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      canvas = null;
    }
  };
}

const l = { createStage };
const n = { onScrollFrame, onLayout, watchLayout };

// --- CORE PROCEDURAL DEFINITIONS ---
${engineDefs.replace('var o=t.i(13e3);', 'var o = { createProgram };')};

// --- KNIGHT SCENE INITIALIZER ---
export function initKnightStage(root: HTMLElement): () => void {
  const runner = ${engineMain};
  return runner(root) || (() => {});
}
`;

fs.writeFileSync('src/themes/knight/scripts/knight-stage.ts', stageCode);
console.log('Successfully written src/themes/knight/scripts/knight-stage.ts, size:', stageCode.length);
