// @ts-nocheck
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
    const lenis = (window as any).__knightLenis;
    if (lenis && !lenis.isStopped) {
      lenis.raf(now);
    }
    const y = (lenis && typeof lenis.scroll === 'number')
      ? lenis.scroll
      : (window.scrollY || document.documentElement.scrollTop);
    const limit = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (always || y !== lastY) {
      lastY = y;
      cb({ y, time: now / 1000, limit });
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
function r(t,e){let a=Math.imul(0x27d4eb2d^t,0x165667b1)^Math.imul((0|e)+0x9e3779b9,0x85ebca6b);return(((a=Math.imul((a=Math.imul(a^a>>>15,0x2c1b3c6d))^a>>>12,0x297a2d39))^a>>>15)>>>0)/0x100000000}var o = { createProgram };let i=[1,.75,.6],h={cw:4.8,lh:7.6,fs:8},s={cw:6,lh:9.5,fs:10},d=(t,e)=>Math.max(1,Math.round(t*e))/e,u=new Map;function f(t,e){let a=e>.25?Math.round(1e3*e)/1e3:1,l=`${t?"p":"d"}${a}`,n=u.get(l);if(n)return n;let r=t?s:h,o=(e,n,o)=>({cw:d(r.cw*e,a),lh:d(r.lh*e,a),fs:r.fs*e,phone:t,ratio:a,fine:null,micro:null,level:n,base:{cw:r.cw*e,lh:r.lh*e},key:`${l}${o}`}),i={cw:d(r.cw,a),lh:d(r.lh,a),fs:r.fs,phone:t,ratio:a,fine:null,micro:null,level:0,base:r,key:l};return t&&(i.fine=o(.75,1,"f"),i.micro=o(.6,2,"m")),u.set(l,i),i}let c=(t,e=1/0)=>t.micro&&e/(t.fine?.lh??t.lh)<7.5?t.micro:t.fine??t,p=[10,10,12],m=t=>{let e=t.charCodeAt(0)-33;return e>=0&&e<94?e:-1},y=[];for(let t=0;t<24;t++){let e=t/23;y.push([Math.round(64+169*e),Math.round(62+168*e),Math.round(57+166*e)])}for(let t=0;t<12;t++){let e=t/11;y.push([Math.round(105+95*e),Math.round(8+18*e),Math.round(14+16*e)])}for(let t=0;t<6;t++){let e=t/5;y.push([Math.round(146+32*e),Math.round(118+54*e),Math.round(116+49*e)])}for(let t=0;t<6;t++){let e=t/5;y.push([Math.round(78+72*e),Math.round(10+10*e),Math.round(14+12*e)])}for(let t=0;t<12;t++){let e=t/11,a=Math.min(1,2*e),l=Math.max(0,2*e-1);y.push([Math.round(150+40*a+46*l),Math.round(160+30*a+42*l),Math.round(130+84*l)])}let x=t=>t<=0?0:t>=1?23:Math.round(23*t),g=t=>24+(t<=0?0:t>=1?11:Math.round(11*t)),M=t=>36+(t<=0?0:t>=1?5:Math.round(5*t)),w=t=>42+(t<=0?0:t>=1?5:Math.round(5*t)),v=t=>48+(t<=0?0:t>=1?11:Math.round(11*t));class k{n=0;data=new Float32Array(131072);spriteOK=!1;spr=[];reset(){this.n=0,this.spr.length=0}sprite(t,e,a){this.spr.push(a);let l=this.n;this.push(t,e,127,this.spr.length-1,1),this.n===l&&this.spr.pop()}push(t,e,a,l,n,r=0){if(a<0||n<=.01)return;let o=4*this.n;if(o+4>this.data.length){if(this.data.length>=1048576)return;let t=new Float32Array(2*this.data.length);t.set(this.data),this.data=t,o=4*this.n}let i=this.data;i[o]=t,i[o+1]=e,i[o+2]=a+128*l,i[o+3]=(n>1?1:n)+2*r,this.n++}}function b(t,e,a,l){let n=Math.round(e.cw*a),r=Math.round(e.lh*a),o=n+2,i=r+2,h=Math.ceil(5.875),s=document.createElement("canvas");s.width=o*(l?94:16),s.height=i*(l?y.length:h);let d=s.getContext("2d");d.textBaseline="middle",d.textAlign="center",d.font=`500 ${e.fs*a}px ${t}`;let u=(t,e)=>{d.fillStyle=t;for(let t=0;t<94;t++){let a=String.fromCharCode(33+t),l=null===e?t%16*o:t*o,n=null===e?Math.floor(t/16)*i:e*i;d.save(),d.beginPath(),d.rect(l,n,o,i),d.clip(),d.fillText(a,l+o/2,n+1+.52*r),d.restore()}},f=new Float32Array(376);{let t=l?document.createElement("canvas"):s;l&&(t.width=16*o,t.height=i*h);let e=t.getContext("2d",{willReadFrequently:!0});if(l){e.textBaseline="middle",e.textAlign="center",e.font=d.font,e.fillStyle="#fff";for(let t=0;t<94;t++){let a=t%16*o,l=Math.floor(t/16)*i;e.save(),e.beginPath(),e.rect(a,l,o,i),e.clip(),e.fillText(String.fromCharCode(33+t),a+o/2,l+1+.52*r),e.restore()}}else u("#fff",null);let a=e.getImageData(0,0,16*o,i*h).data,n=16*o;for(let t=0;t<94;t++){let e=t%16*o,l=Math.floor(t/16)*i,r=o,h=i,s=-1,d=-1;for(let t=0;t<i;t++)for(let i=0;i<o;i++)a[((l+t)*n+e+i)*4+3]>2&&(i<r&&(r=i),t<h&&(h=t),i>s&&(s=i),t>d&&(d=t));s<0||f.set([r,h,s-r+1,d-h+1],4*t)}}return l&&y.forEach(([t,e,a],l)=>u(`rgb(${t},${e},${a})`,l)),{canvas:s,cellW:o,cellH:i,padX:1,padY:1,rows:h,ink:f}}let A=`#version 300 es
layout(location = 0) in vec4 aCell;
uniform vec2 uBuf;
uniform float uDpr;
uniform vec2 uCell;
uniform vec2 uPad;
uniform vec3 uPal[${y.length}];
uniform vec4 uInk[94];
out vec4 vInk;
out vec3 vCol;
out float vA;
out float vS;
void main() {
  float g = mod(aCell.z, 128.0);
  float c = floor(aCell.z / 128.0 + 0.001);
  float fine = floor(aCell.w * 0.5);
  float k = fine > 1.5 ? 0.60 : fine > 0.5 ? 0.75 : 1.0;
  vec4 ink = uInk[int(g)];
  float S = max(ink.z, ink.w);
  vec2 corner = floor(aCell.xy * uDpr + 0.5) + (ink.xy - uPad) * k;
  vec2 p = corner + 0.5 * S * k;
  vec2 clip = p / uBuf * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = S * k;
  vInk = vec4(vec2(mod(g, 16.0), floor(g / 16.0 + 0.001)) * uCell + ink.xy, ink.zw);
  vCol = uPal[int(c)];
  vA = aCell.w - 2.0 * fine;
  vS = S;
}`,S=`#version 300 es
precision highp float;
in vec4 vInk;
in vec3 vCol;
in float vA;
in float vS;
uniform vec2 uAtlas;
uniform sampler2D uTex;
out vec4 outColor;
void main() {
  vec2 q = gl_PointCoord * vS;
  if (q.x > vInk.z || q.y > vInk.w) discard;
  float a = texture(uTex, (vInk.xy + q) / uAtlas).a * vA;
  outColor = vec4(vCol * a, a);
}`,E=" .:-=+*x#%@",R="#@&8#$@%#&",$="x*+=%",P="=-:+",F=".:'`",C=t=>m(E[Math.min(E.length-1,1+Math.floor((t<0?0:t>1?1:t)*(E.length-1)))]);function T(t,e,a,l){let n=t.length,o={fc:e,fr:a,n,x:new Int16Array(n),y:new Int16Array(n),g:new Int16Array(n),v:new Float32Array(n),m:new Float32Array(n),h1:new Float32Array(n),h2:new Float32Array(n),h3:new Float32Array(n),area:l??[0,0,e,a],sil:new Uint8Array(Math.max(1,e*a))};return t.forEach((t,l)=>{o.x[l]=t.x,o.y[l]=t.y,o.g[l]=t.g,o.v[l]=t.v,o.m[l]=t.m,o.h1[l]=r(7*t.x+3,13*t.y+1),o.h2[l]=r(5*t.y+11,3*t.x+17),o.h3[l]=r(11*t.x+31*t.y,97);for(let l=-1;l<=1;l++)for(let n=-1;n<=1;n++){let r=t.x+n,i=t.y+l;r>=0&&i>=0&&r<e&&i<a&&(o.sil[i*e+r]=1)}}),o}let I=(t,e)=>(.2126*t[e]+.7152*t[e+1]+.0722*t[e+2])/255,_=t=>t<0?0:t>1?1:t,B=(t,e)=>t.length?t[Math.min(t.length-1,Math.max(0,Math.floor(e*t.length)))]:0;function U(t,e,a,l,n,r){let o=document.createElement("canvas");o.width=n,o.height=r;let i=o.getContext("2d",{willReadFrequently:!0});return i.imageSmoothingEnabled=!0,i.imageSmoothingQuality="high",i.drawImage(t,l[0],l[1],l[2],l[3],0,0,n,r),i.getImageData(0,0,n,r).data}function N(t,e,a,l,n={}){let o=.66*e,i=Math.max(1,...t.map(t=>[...t].length)),h=(n.ox??0)+i*o+.06*e,s=(n.oy??0)+t.length*e*.96+.06*e,d=n.fc??Math.ceil(h/l.cw),u=n.fr??Math.ceil(s/l.lh),f=2*d,c=2*u,p=document.createElement("canvas");p.width=Math.max(1,Math.ceil(d*l.cw*3)),p.height=Math.max(1,Math.ceil(u*l.lh*3));let y=p.getContext("2d");y.scale(3,3),y.font=`800 ${e}px ${a}`,y.textBaseline="alphabetic",y.fillStyle="#fff",t.forEach((t,a)=>{[...t].forEach((t,l)=>y.fillText(t,(n.ox??0)+l*o,(n.oy??0)+.88*e+a*e*.96))});let x=document.createElement("canvas");x.width=f,x.height=c;let g=x.getContext("2d",{willReadFrequently:!0});g.imageSmoothingEnabled=!0,g.imageSmoothingQuality="high",g.drawImage(p,0,0,f,c);let M=g.getImageData(0,0,f,c).data,w=(t,e)=>M[(e*f+t)*4+3]/255,v=n.v0??.62,k=n.v1??.38,b=e/l.lh<6.5,A=b?1.45:1,S=b?.2:.1,E=[];for(let t=0;t<u;t++)for(let e=0;e<d;e++){let a,l=Math.min(1,w(2*e,2*t)*A),n=Math.min(1,w(2*e+1,2*t)*A),o=Math.min(1,w(2*e,2*t+1)*A),i=Math.min(1,w(2*e+1,2*t+1)*A),h=(l+n+o+i)/4;if(h<S)continue;let s=r(13*e+1,7*t+5);a=h>.8?R[s*R.length|0]:b&&(o+i)/2>.6&&(l+n)/2<.2?s<.5?"_":".":b&&(l+n)/2>.6&&(o+i)/2<.2?s<.5?"^":"'":h>.52?$[s*$.length|0]:h>.28?P[s*P.length|0]:F[s*F.length|0],E.push({x:e,y:t,g:m(a),v:v+k*h,m:1})}return T(E,d,u)}function q(t,e,a,l,n){let o=[],i=[...t.glyphs].filter(t=>t.trim()),h=(t,e)=>m(i[(Math.floor(r(5*t+2,9*e+4)*i.length)+t)%i.length]??"."),s=(t.pattern%6+6)%6,d=new Uint8Array(e*a),u=new Uint8Array(e*a),f=[...t.mark].slice(0,2).join("")||"?",c=[...f].length,p=a-3,y=p*n.lh*(1===c?.86:.8)/.73,x=e*n.cw*(1===c?.7:.9)/(.66*c+.06),g=Math.max(4*n.lh,Math.min(y,x)),M=Math.ceil((.66*c*g+.06*g)/n.cw),w=Math.ceil(1.02*g/n.lh),v=.13*g/n.lh,k=.75*g/n.lh,[b,A]=[[.1,.5],[.5,.35],[.9,.7],[.18,.15],[.55,.85],[.86,.25]][s],S=Math.round((e-M)*b),E=Math.round(1+Math.max(0,p-k)*A-v),R=N([f],g,l,n,{fc:M,fr:w,v0:.7,v1:.3}),$=s%2?-2:2,P=s%3==1?-1:1;for(let t=0;t<R.n;t++){let l=R.x[t]+S,n=R.y[t]+E;if(l<0||n<0||l>=e||n>=a-2)continue;let i=(R.v[t]-.7)/.3,u=r(7*l+3,11*n+s),f=i>.8;o.push({x:l,y:n,g:f?h(l,n):R.g[t],v:f?.72+.26*u:.6+.3*i,m:1}),d[n*e+l]=1}for(let t=0;t<R.n;t++){let l=R.x[t]+S+$,n=R.y[t]+E+P;if(!(l<0)&&!(n<0)&&!(l>=e)&&!(n>=a-2)){for(let t=-1;t<=1;t++)for(let r=-1;r<=1;r++){let o=l+r,i=n+t;o>=0&&i>=0&&o<e&&i<a&&(u[i*e+o]=1)}!d[n*e+l]&&(d[n*e+l]=1,.55>r(3*l+1,5*n+7)&&o.push({x:l,y:n,g:m(r(l,n)>.5?".":":"),v:.2,m:1}))}}let F=e*(s%2?.28:.72),C=a*(s%3?.35:.6);for(let t=0;t<a-2;t++)for(let a=0;a<e;a++){if(d[t*e+a]||u[t*e+a])continue;let l=r(17*a+s,23*t+7),i=0;if(0===s)i=.8*(Math.sin(.16*a+.55*t+2*Math.sin(.05*a))>.72);else if(1===s){let e=Math.hypot((a-F)*n.cw,(t-C)*n.lh)/14;i=e%4<.9?.75*(1-Math.min(1,e/40))+.25:0}else if(2===s)i=.7*!!(r(3*a,Math.floor((t+40*r(a,1))/7))>.72&&r(a,t)>.25);else if(3===s)i=a%8==0||t%4==0?a%8==0&&t%4==0?1:.35:0;else if(4===s){let e=Math.sin(.05*a+1.5*Math.sin(.11*t))+Math.cos(.09*t-.02*a);i=.8*(.07>Math.abs(3*e%1+ +(e<0)-.5))}else i=.7*(l<.06+a/e*.22*(a/e));if(!i)continue;let f=3===s?m(a%8==0&&t%4==0?"+":a%8==0?":":"-"):h(a,t);o.push({x:a,y:t,g:f,v:.1+.18*i*(.6+.4*l),m:1})}let I=a-1,_=t.lang.toLowerCase();[..._].forEach((t,a)=>{a+1<e&&o.push({x:a+1,y:I,g:m(t),v:.62,m:1})});let B=Math.max(8,Math.min(28,Math.floor(.28*e))),U=t.stars>0?Math.max(1,Math.round(B*Math.log10(t.stars+1)/4)):0,q=t.stars>0?`${t.stars>=1e3?`${(t.stars/1e3).toFixed(1).replace(/\.0$/,"")}k`:t.stars} *`:"0 *",L=e-B-q.length-4;if(L>_.length+3){o.push({x:L,y:I,g:m("["),v:.5,m:1});for(let t=0;t<B;t++)o.push({x:L+1+t,y:I,g:m(t<U?"#":"."),v:t<U?.85:.3,m:1});o.push({x:L+B+1,y:I,g:m("]"),v:.5,m:1}),[...q].forEach((t,e)=>o.push({x:L+B+3+e,y:I,g:m(t),v:.7,m:1}))}return T(o,e,a)}let L={name:{out:{du:.55,dh:.45,span:.55,dx:150,dxv:180,dy:-30,dyv:-70,arc:22}},figure:{in:{du:1,dh:.4,span:.55,dx:170,dxv:170,dy:30,dyv:60,arc:26},out:{dh:1,dv:.35,span:.6,dx:160,dxv:240,dy:-20,dyv:-150,arc:34}},drift:{in:{dri:1,dh:.35,span:.5,dx:30,dxv:150,dy:-110,dyv:220},out:{dv:1,dh:.2,span:.5,dx:150,dxv:110,dy:-40,dyv:-50}},diag:{in:{du:.6,dv:.6,dh:.15,span:.42,dx:210,dxv:70,dy:0,dyv:10},out:{dh:1,span:.55,dx:110,dxv:230,dy:-50,dyv:100}},sweep:{in:{du:1,dh:.12,span:.45,dx:170,dxv:150,dy:-10,dyv:-40,arc:22},out:{du:1,dh:.12,span:.45,dx:170,dxv:150,dy:-20,dyv:-50,arc:18}},eddy:{in:{dr:1,dh:.3,span:.55,dx:120,dxv:60,swirl:2.2},out:{dri:1,dh:.25,span:.55,dx:140,dxv:100,dy:-40,dyv:-40,swirl:-1.8}},rise:{in:{div:1,dh:.2,span:.42,dx:90,dxv:100,dy:150,dyv:80,arc:12},out:{du:.5,dh:.5,span:.5,dx:170,dxv:90,dy:130,dyv:70,arc:30}},rain:{in:{dv:1,du:.3,dh:.15,span:.45,dx:120,dxv:60,dy:-170,dyv:-60},out:{dv:1,span:.36,dx:300,dxv:14,dy:0,dyv:0}},slats:{in:{div:1,dh:.2,span:.42,dx:90,dxv:100,dy:150,dyv:80,arc:12},out:{du:.5,dh:.5,span:.5,dx:170,dxv:90,dy:130,dyv:70,arc:30}},dust:{in:{dh:1,span:.6,dx:50,dxv:40,dy:0,dyv:30,dust:600},out:{dh:1,span:.7,dx:90,dxv:60,dy:-20,dyv:40,dust:420}},ribbon:{in:{du:1,span:.5,dx:220,dxv:50,squash:1},out:{du:1,span:.5,dx:220,dxv:50,squash:1,dy:-10}},low:{in:{div:.5,du:.5,span:.5,dx:170,dxv:90,dy:60,dyv:30,arc:-30},out:{dh:.6,du:.4,span:.5,dx:150,dxv:60,dy:50,dyv:40,floor:.6}},sprout:{in:{du:1,dh:.12,span:.34,dx:4,dxv:10,dy:170,dyv:70},out:{div:1,du:.3,span:.4,dx:220,dxv:60,dy:12}},unroll:{in:{div:1,dh:.15,span:.55,dx:40,dxv:30,shear:300},out:{du:1,span:.5,dx:180,dxv:60,dy:-36,dyv:-20,swirl:.7}},columns:{in:{du:1,span:.35,dx:16,dxv:18,dy:-160,dyv:-60},out:{du:1,span:.4,dx:100,dxv:60,dy:120,dyv:60}},decode:{in:{du:1,dh:.25,span:.3,dx:0,still:!0},out:{dh:1,span:.6,dx:70,dxv:110,dy:0,dyv:20}},ripple:{in:{du:1,div:.45,span:.3,dx:0,dy:26,dyv:12},out:{du:1,span:.4,dx:90,dxv:60,dy:-30,dyv:-30}},settle:{in:{div:.6,du:.4,dh:.2,span:.55,dx:220,dxv:120,dy:-100,dyv:-40,arc:-36}}},D=[..."x*+=%#-:"].map(m),O=[..."-~'.`"].map(m),W=m("-"),H=m("~"),z=t=>t*t*(3-2*t),Y=t=>t<0?0:t>1?1:t,X=t=>D[(t%D.length+D.length)%D.length],G=t=>t<0?0:t>1?1:t,V=t=>{let e=G(t);return e*e*(3-2*e)},j=[...E].map(m),K=t=>j[Math.min(j.length-1,1+Math.floor(G(t)*(j.length-1)))],J=m("."),Q=m("+"),Z=m("-"),tt=m("~");function te(t,e,a,l,n=2){let o=Math.ceil(t/a.cw)+2,i=[],h=[],s=[],d=[];for(let t=-1;t<o;t++)for(let a=0;a<e;a+=n)r(3*t+7,5*a+1)>l||(i.push(t),h.push(a),s.push(2+Math.floor(4*r(11*a+3,2*t+9))),d.push(6.283*r(t,17*a+4)));return{x:Int16Array.from(i),r:Uint8Array.from(h),len:Uint8Array.from(s),ph:Float32Array.from(d),n:i.length,rows:e}}let ta=m("\\"),tl=m("/"),tn=m("|"),tr=m("'"),to=m(",");function ti(t,e,a,l,n,r,o){if(o.grow<=.01||o.alpha<=.01||a>n+40||l<0)return;let{cw:i,lh:h}=r,s=Math.max(6,Math.min(e.rows,Math.ceil((l-a)/h))),d=o.still?0:o.t,u=o.dim??[];for(let l=0;l<e.n;l++){let r=e.r[l];if(r>=s)continue;let f=a+r*h;if(f>n+2*h||f<-(20*h))continue;let c=r/s,p=e.x[l]*i,m=void 0===o.front?o.grow:o.grow*V((1.4*o.front-p/2e3*.4)*1.2),y=Math.round(e.len[l]*o.tall*m*(1-.6*o.flat));if(y<1)if(!(m>.15))continue;else y=1;let x=null===o.gust?0:Math.exp(-(((p-o.gust)/130)**2)),g=(.85*Math.sin(.03*p+1.15*d+.4*e.ph[l]+.05*r)+.35)*(1-o.flat)+2.4*o.flat+1.5*x,M=1;for(let t=0;t<u.length;t++){let e=u[t];if(p>e.x&&p<e.x+e.w&&f>e.y-4*h&&f<e.y+e.h+h){M=.28;break}}let w=(.2+.5*c)*(1+1.2*x)*o.alpha*M,k=v(.5*c+.5*Math.min(1,x));for(let e=0;e<y;e++){let a=f-e*h;if(a<-h||a>n)continue;let l=p+Math.round(g*e*.6)*i,r=e===y-1?o.flat>.5?to:tr:g>.45?tl:g<-.2?ta:tn,s=w*(1-e/(y+1)*.5);t.push(l,a,r,k,s>.95?.95:s)}}}let th=m("~"),ts=m("-"),td=m("."),tu=m(":");function tf(t,e,a,l,n,r,o,i,h,s,d,u,headObs:any[]=[]){
  if(h<=.01)return;
  let f=e.R;
  if(a+1.5*f<0||a-1.5*f>n||l+1.5*f<0||l-1.5*f>r)return;
  let c=s.filter(t=>t.x<a+1.5*f&&t.x+t.w>a-1.5*f&&t.y<l+1.5*f&&t.y+t.h>l-1.5*f),p=d.filter(t=>t.s>.01&&t.x<a+1.5*f&&t.x+t.shape.fc*u.cw>a-1.5*f&&t.y<l+1.5*f&&t.y+t.shape.fr*u.lh>l-1.5*f),m=.5*Math.round(a/.5),y=.5*Math.round(l/.5);
  if(c.length){
    let tot=0,unc=0;
    for(let idx=0;idx<e.n;idx+=2){
      if(e.r[idx]>=1)continue;
      let ptX=m+(e.i[idx]+.5)*u.cw,ptY=y+(e.j[idx]+.5)*u.lh;
      if(ptX<0||ptX>n||ptY<0||ptY>r)continue;
      tot++;
      let covered=!1;
      for(let k=0;k<c.length&&!covered;k++){let obs=c[k];covered=obs.s>.5&&ptX>obs.x&&ptX<obs.x+obs.w&&ptY>obs.y&&ptY<obs.y+obs.h}
      !covered&&unc++;
    }
    if(tot>0){
      h*=Math.max(0.4,V(G((unc/tot)/0.6)));
    }
  }
  let x=.12*o,vAngle=.35*o;
  for(let ptIdx=0;ptIdx<e.n;ptIdx++){
    let ptL=m+e.i[ptIdx]*u.cw,ptS=y+e.j[ptIdx]*u.lh;
    if(ptL<-u.cw||ptL>n||ptS<-u.lh||ptS>r)continue;
    let dU=e.u[ptIdx],fW=e.w[ptIdx],kR=e.r[ptIdx],bH=e.h[ptIdx];

    // Heading occlusion: strict protection inside core box + smooth organic feathering
    let headFactor=1.0;
    if(headObs&&headObs.length){
      let ptMidX=ptL+u.cw/2,ptMidY=ptS+u.lh/2;
      for(let k=0;k<headObs.length;k++){
        const ho=headObs[k];
        if(ptMidX>=ho.x&&ptMidX<=ho.x+ho.w&&ptMidY>=ho.y&&ptMidY<=ho.y+ho.h){
          headFactor=0;
          break;
        }
        const fZone=ho.f??28;
        if(ptMidX>=ho.x-fZone&&ptMidX<=ho.x+ho.w+fZone&&ptMidY>=ho.y-fZone&&ptMidY<=ho.y+ho.h+fZone){
          const dx=Math.max(0,Math.max(ho.x-ptMidX,ptMidX-(ho.x+ho.w)));
          const dy=Math.max(0,Math.max(ho.y-ptMidY,ptMidY-(ho.y+ho.h)));
          const dist=Math.hypot(dx,dy);
          if(dist<fZone){
            const norm=dist/fZone;
            const factor=norm*norm*(3-2*norm);
            if(factor<headFactor)headFactor=factor;
          }
        }
      }
    }
    if(headFactor<=.001)continue;
    if(headFactor<1.0&&bH>headFactor)continue;

    // Content obstacles & silhouettes
    if(c.length||p.length){
      let ptMidX=ptL+u.cw/2,ptMidY=ptS+u.lh/2;
      let occluded=!1;
      for(let obsIdx=0;obsIdx<c.length;obsIdx++){
        let obs=c[obsIdx];
        if(ptMidX>obs.x&&ptMidX<obs.x+obs.w&&ptMidY>obs.y&&ptMidY<obs.y+obs.h){
          let fe=obs.fe??0;
          let edgeDist=fe>0?Math.min(ptMidX-obs.x,obs.x+obs.w-ptMidX,ptMidY-obs.y,obs.y+obs.h-ptMidY):0;
          if(bH<obs.s*(edgeDist>=fe?1:.2+(edgeDist/fe)*.8)){
            occluded=!0;
            break;
          }
        }
      }
      if(!occluded){
        for(let silIdx=0;silIdx<p.length;silIdx++){
          let sil=p[silIdx];
          let col=Math.floor((ptMidX-sil.x)/u.cw);
          let row=Math.floor((ptMidY-sil.y)/u.lh);
          if(col>=0&&row>=0&&col<sil.shape.fc&&row<sil.shape.fr&&sil.shape.sil[row*sil.shape.fc+col]&&bH<sil.s){
            occluded=!0;
            break;
          }
        }
      }
      if(occluded)continue;
    }

    let curH=h*headFactor;
    let A=G((Math.sin(2.3*dU-i+.8*Math.sin(3.1*fW+.1*o))+.5*Math.sin(4.7*dU+1.3*fW-1.4*i)+.35*Math.sin(6*fW+.7*dU)-.55)/.6)*G(1.25-.9*Math.abs(fW));
    if(kR<1){
      if(A>.2&&e.h2[ptIdx]<.8*A){t.push(ptL,ptS,A>.6?th:ts,M(.3+.7*A),(.24+.36*A)*curH);continue}
      let nVal=G(Math.pow(1-kR*kR,.35)*(.45+.55*(.5+.5*(e.base[ptIdx]+.35*Math.sin(7.1*dU-5.3*fW+x)+.2*Math.sin(13*dU+11*fW-vAngle)))));
      t.push(ptL,ptS,K(nVal),g(.55+.45*nVal),(.55+.4*nVal)*(1-.55*A)*curH);
    }else{
      let nVal=(1-(kR-1)/.5)**2*(.65+.35*Math.sin(.8*o+3*dU+4*fW));
      if(A>.35&&e.h2[ptIdx]<.5){t.push(ptL,ptS,th,M(.1),(.06+.16*A*nVal)*curH);continue}
      bH<.36*nVal&&t.push(ptL,ptS,e.h2[ptIdx]>.5?td:tu,w(.3+.7*nVal),(.12+.3*nVal)*curH);
    }
  }
}let tc={dx:0,dy:0,a:1,g:0,e:0,trail:0};function tp(t,e,a,l,n,r,o,i){let{cw:h,lh:s}=n,d=e.fc*h/2,u=e.fr*s/2,f=e.fr*s-u,c=!!r.mv&&(r.leaving?r.p>0:r.p<1);if(!c&&void 0===r.lock){if(l+e.fr*s<-s||l>i+s)return;if(t.spriteOK&&r.alpha>=.999&&!r.clip)return void t.sprite(a,l,{shape:e,v0:r.v0,v1:r.v1,fine:r.fine??0,grid:n})}for(let n=0;n<e.n;n++){let p=e.x[n],m=e.y[n],y=a+p*h,g=l+m*s,M=r.alpha*(.55+.45*e.m[n]),w=e.g[n];if(void 0!==r.lock){let t=1-m/e.fr-1.25*r.lock+.18*e.h1[n];if(t>.12)continue;t>-.03&&(w=X((97*e.h2[n]+23*r.t|0)+p),M*=.6)}if(c&&r.mv){if(!function(t,e,a,l,n,r,o,i,h,s,d,u,f,c){let p=Math.min(1,1.41*Math.hypot(l-.5,n-.5)),m=0,y=0,x=(t,e)=>{t&&(m+=Math.abs(t),y+=Math.abs(t)*e)};x(t.du,l),x(t.dv,n),x(t.diu,1-l),x(t.div,1-n),x(t.dh,i),x(t.dr,1-p),x(t.dri,p),t.alt&&x(t.alt,+((1&d)==+(t.alt>0))),m>0&&(y/=m);let g=t.span,M=Y((a-(y*=1-g))/g),w=e?z(M):1-z(M);if(c.e=w,t.still)c.dx=0,c.dy=0;else{let a=(t.dx+(t.dxv??0)*r+(t.rowdx??0)*(d%3)+(t.shear??0)*(1-n))*w,l=((t.dy??0)+(t.dyv??0)*o)*w;if(t.arc&&(l+=t.arc*Math.sin(Math.PI*w)*(.4+o)),t.squash&&(l+=-s*t.squash*z(w)),t.floor&&(l+=(u-s)*t.floor*z(w)),t.dust){let e=t.dust*Math.pow(r,8)*w*w;a+=e,l+=e*(o-.5)*.5}if(a*=e?1:-1,t.swirl){let e=w*t.swirl*(.7+.6*i),n=Math.cos(e),r=Math.sin(e);a+=h*n-s*r-h,l+=h*r+s*n-s}c.dx=a,c.dy=l}c.a=e?1-z(Y((w-.42)/.58)):z(Y((1-w)/.42)),w<=.001?c.g=f:w<.34?c.g=D[(97*o+Math.floor(26*w)|0)%D.length]:c.g=O[(53*r+Math.floor(9*w)|0)%O.length],c.trail=!t.still&&w>.1&&w<.88&&o>.5?.3*c.a*Math.sin(Math.PI*w):0}(r.mv,r.leaving,r.p,p/e.fc,m/e.fr,e.h1[n],e.h2[n],e.h3[n],p*h-d,m*s-u,m,f,w,tc),tc.a<=.01)continue;y+=tc.dx,g+=tc.dy,M*=tc.a,w=tc.g,tc.trail>.02&&t.push(y-(6+16*tc.e),g,tc.e>.5?H:W,x(.75),tc.trail*r.alpha,r.fine)}else if(r.breathe&&!r.still&&e.h3[n]>.993&&Math.sin(1.7*r.t+60*e.h1[n])>.55){let t=j.indexOf(w);t>0&&(w=j[Math.min(j.length-1,Math.max(1,t+(e.h2[n]>.5?1:-1)))])}y<-h||y>o||g<-s||g>i||r.clip&&(g<r.clip[0]||g>r.clip[1])||t.push(y,g,w,x(r.v0+r.v1*e.v[n]),M,r.fine)}}let tm=(t,e)=>[...t.querySelectorAll(e)],ty=t=>t<0?0:t>1?1:t,tx=(t,e,a)=>ty((t-e)/(a-e)),tg=t=>{let e=ty(t);return e*e*(3-2*e)},tM={bio:{a:104,shape:"stairs",lag:.2,trail:"scr",gs:".:'",soft:9,n:7},bio2:{a:97,shape:"gather",lag:.14,trail:"dust",gs:":.'",soft:12,n:6},facts:{a:112,shape:"alt",lag:.3,trail:"rule",gs:".",soft:6,n:6},figs:{a:93,shape:"one",trail:"dec",gs:"0123456789",soft:5,n:8},mail:{a:90,shape:"one",trail:"dec",gs:"@.:",soft:7,n:9},links:{a:99,shape:"one",trail:"rule",gs:"/",soft:10,n:5}},tw={sweep:{idx:{a:96,trail:"scr",n:4},desc:{a:100,shape:"one",trail:"scr",soft:9,n:7},meta:{a:92,trail:"rule",gs:"-",n:5}},eddy:{idx:{a:118,trail:"dec",n:5},desc:{a:112,shape:"gather",lag:.2,trail:"dec",soft:7,n:9},meta:{a:104,trail:"dust",n:5}},rise:{idx:{a:84,trail:"rule",gs:".",n:3},desc:{a:86,shape:"gather",lag:.32,trail:"dust",soft:12,n:6},meta:{a:80,trail:"dec",n:8}},rain:{idx:{a:104,trail:"dust",n:4},desc:{a:108,shape:"stairs",lag:.3,trail:"rule",gs:"~",soft:6,n:6},meta:{a:115,trail:"scr",n:6}},slats:{idx:{a:90,trail:"rule",gs:"=",n:3},desc:{a:94,shape:"alt",lag:.42,trail:"scr",soft:5,n:8},meta:{a:98,trail:"rule",gs:"=",n:4}},dust:{idx:{a:110,trail:"dec",n:4},desc:{a:122,shape:"one",trail:"dust",soft:16,n:8},meta:{a:88,trail:"dec",n:6}}},tv=["one","stairs","gather"],tk=["scr","dec","rule","dust"],tb=["-","=","~",".","_"],tA=(t,e)=>{let a=[...t||e].map(m).filter(t=>t>=0);return a.length?a:[m(".")]},tS=(t,e)=>({a:t.a,shape:t.shape??"one",lag:t.lag??.2,trail:t.trail,g:tA(t.gs??("rule"===t.trail?"-":e),".:"),soft:t.soft??8,n:t.n??6});

function renderSignalField(
  stage: k,
  skTop: number,
  skHeight: number,
  skDocY: number,
  winW: number,
  winH: number,
  grid: { cw: number; lh: number },
  obstacles: Array<{ x: number; y: number; w: number; h: number }>,
  time: number,
  isReduced: boolean
) {
  let { cw, lh } = grid;
  const gDash = Z, gDot = J, gPlus = Q, gTilde = tt, gEq = m("="), gColon = m(":");
  let visTop = Math.max(0, skTop);
  let visBottom = Math.min(winH, skTop + skHeight);
  if (visBottom <= visTop) return;

  let startRow = Math.floor(visTop / lh);
  let endRow = Math.ceil(visBottom / lh);
  let totalCols = Math.ceil(winW / cw);

  for (let row = startRow; row <= endRow; row++) {
    let screenY = row * lh;
    let absDocRow = Math.floor((skDocY + (screenY - skTop)) / lh);
    let rowHash = r(absDocRow * 19 + 101, 37);

    // Only ~28% of rows have signal traces (sparse and restrained)
    if (rowHash > 0.28) continue;

    let numTraces = rowHash < 0.10 ? 2 : 1;
    for (let c = 0; c < numTraces; c++) {
      let seed = r(absDocRow * 31 + c * 59, 13);
      let startCol = Math.floor(seed * (totalCols - 14));
      let traceLen = 2 + Math.floor(r(absDocRow * 43 + c * 7, 19) * 4);
      let traceType = Math.floor(r(absDocRow * 53 + c * 11, 23) * 4);

      let baseAlpha = 0.07 + 0.07 * r(absDocRow * 7 + c * 13, 29);
      let pulse = isReduced ? 1 : (0.90 + 0.10 * Math.sin(0.0006 * time + absDocRow * 0.25 + c));
      let finalAlpha = Math.min(0.18, baseAlpha * pulse);
      let colorIndex = x(0.32 + 0.10 * r(absDocRow * 19 + c * 3, 41));

      for (let i = 0; i < traceLen; i++) {
        let col = startCol + i;
        if (col < 0 || col >= totalCols) continue;
        let ptX = col * cw;
        let ptY = screenY;

        let occluded = false;
        for (let oIdx = 0; oIdx < obstacles.length; oIdx++) {
          let obs = obstacles[oIdx];
          if (ptX >= obs.x && ptX <= obs.x + obs.w && ptY >= obs.y && ptY <= obs.y + obs.h) {
            occluded = true;
            break;
          }
        }
        if (occluded) continue;

        let glyph = gDash;
        if (traceType === 1) {
          glyph = i % 2 === 0 ? gDot : gEq;
        } else if (traceType === 2) {
          glyph = i === 0 || i === traceLen - 1 ? gPlus : gDash;
        } else if (traceType === 3) {
          glyph = i === 1 ? gColon : gTilde;
        }

        stage.push(ptX, ptY, glyph, colorIndex, finalAlpha);
      }
    }
  }
}

// --- KNIGHT SCENE INITIALIZER ---
export function initKnightStage(
  root: HTMLElement,
  options?: {
    onReady?: () => void;
    onError?: (err: unknown) => void;
  }
): () => void {
  try {
    const runner = function(t){let e=!1,a=[],h=/[?&]lite(=|&|$)/.test(location.search)||document.documentElement.classList.contains("ff-lite"),s=window.matchMedia("(prefers-reduced-motion: reduce)"),d=s.matches||h,u=getComputedStyle(t),g=u.getPropertyValue("--kn-plex").trim()||"'IBM Plex Mono', monospace",M=u.getPropertyValue("--kn-mart").trim()||"'Martian Mono', monospace",w=Math.min(2,window.devicePixelRatio||1),v=f(window.innerWidth<=760,w),E=new k,R=null,$=null,P=null,F=null,D=!1,O=(()=>{try{return JSON.parse(t.dataset.labels??"{}")}catch{return{}}})(),W=null,H=!1;{let t=document.querySelector(".ff-intro.ffl--knight");if(t&&!d){let e=t.getAnimations().find(t=>t instanceof CSSAnimation&&t.animationName.endsWith("-out"));W=e&&null!==e.startTime?Number(e.startTime):performance.now(),H=!0}}let z=t.querySelector("[data-kn-stage]"),Y=z?.closest("section")??null,tSkills=t.querySelector("[data-kn-s='skills']"),tSkillsDoc={x:0,y:0,w:0,h:0},G=t.querySelector("[data-kn-fig]"),V=t.querySelector("[data-kn-fig-end]"),j=t.querySelector("[data-kn-s='hero']"),K=t.querySelector("[data-kn-s='contact']"),ta=tm(t,"[data-kn-s]"),tl=tm(t,"[data-kn-nk]"),tn=t.querySelector("[data-kn-here]"),tr=t.querySelector("[data-kn-cal]"),to=t.querySelector("[data-kn-tl]"),th={x:0,y:0,w:0,h:0},ts=tm(t,"[data-kn-pic]").map((t,e)=>{let a={mark:"?",glyphs:".:",lang:"",stars:0,pattern:e%6};try{a=JSON.parse(t.dataset.cover??"{}")}catch{}return{el:t,doc:th,inStage:!1,move:t.dataset.knPic||"sweep",src:t.dataset.src??"",cover:a,img:null,status:t.dataset.src?"wait":"none",key:"",shape:null,idx:e}}),td=tm(t,"[data-kn-t]").map(t=>{let e=t.dataset.knT??"diag",a=t.closest("[data-kn-p]"),l=a?ts.find(t=>a.contains(t.el))??null:null;return{el:t,doc:th,inStage:!1,pair:L[e]??L.diag,kind:e,lines:[],fs:0,key:"",shape:null,plate:l,tg:null}}),tu=new Map,tc=tm(t,"[data-kn-r]").map(e=>{let a,l=e.dataset.knR??"bio",n=e.dataset.knRg??"";if("row"===l||"tl"===l){let o=e.closest("ol,ul")??t,i=`${l}:${tm(t,"ol,ul").indexOf(o)}`;a=function(t,e,a,l,n){let o=0;for(let t=0;t<e.length;t++)o=31*o+e.charCodeAt(t)|0;let i=r(o,7*t+1),h=r(o+5,13*t+3),s=tv[(t+Math.floor(3*i))%3];n&&s===n.shape&&(s=tv[(tv.indexOf(s)+1+ +(h>.5))%3]);let d=tk[(Math.floor(4*h)+t)%4];n&&d===n.trail&&(d=tk[(tk.indexOf(d)+1+ +(i>.5))%4]);let u=Math.max(0,Math.min(1,l));return{a:Math.round(80+(.37+.6180339*t+.15*i)%1*42),shape:s,lag:.14+.18*h,trail:d,g:tA("rule"===d?tb[(t+Math.floor(5*h))%tb.length]:a,".:"),soft:Math.round(4+12*u),n:4+Math.round(5*u)}}(Number(e.dataset.knRi)||0,e.textContent?.slice(0,40)??"",n,Number(e.dataset.knRs)||0,tu.get(i)??null),tu.set(i,a)}else a="idx"===l||"desc"===l||"meta"===l?tS((tw[e.dataset.knRm??""]??tw.sweep)[l],n):tS(tM[l]??tM.bio,n);return{el:e,doc:th,inStage:!1,kind:l,lines:[],bands:[],rc:a,last:"",on:!1,shaped:""}}),tE=tm(t,"[data-kn-sk]").map(t=>({el:t,doc:th,inStage:!0,last:-1,rowIx:0})),tR=tm(t,"[data-kn-node]").map(t=>({el:t,doc:th,inStage:!1,date:th,body:th})),t$=tm(t,"[data-kn-tag]").map((t,e)=>({el:t,doc:th,inStage:!1,i:e})),tP=tm(t,"[data-kn-occ]"),tF=[],tC=window.innerWidth,tT=window.innerHeight,tI=1,t_=th,tB=th,tU=th,tN=th,tq=th,tL=th,tD=th,tO=th,tW=[],tH=null,tz="",tY=null,tX=G?.dataset.av?"wait":"none",tG=null,tV="",tj=null,tK="",tJ=null,tQ="",tZ=null,t1=null,t0="",t2=!1,t5=null,t3="",t4=!1,t6=-1,t8=-1,t7=(t,e)=>{let a=t.getBoundingClientRect();return{x:a.left,y:a.top+e,w:a.width,h:a.height}},t9=t=>{let e=t.getBoundingClientRect(),a=z.getBoundingClientRect();return{x:e.left,y:e.top-a.top,w:e.width,h:e.height}},et=(t,e)=>(t.inStage=!!z&&z.contains(t.el),t.doc=t.inStage?t9(t.el):t7(t.el,e),t),ee=(t,e,a)=>{let l=a?z.getBoundingClientRect().top:0,n=[],r=document.createTreeWalker(t,NodeFilter.SHOW_TEXT),o=document.createRange();for(let t=r.nextNode();t;t=r.nextNode())if(t.nodeValue&&t.nodeValue.trim())for(let r of(o.selectNodeContents(t),o.getClientRects())){if(r.width<2||r.height<2)continue;let t=a?r.top-l:r.top+e,o=n.find(e=>Math.min(e.y+e.h,t+r.height)-Math.max(e.y,t)>.5*Math.min(e.h,r.height));if(o){let e=Math.max(o.x+o.w,r.right),a=Math.max(o.y+o.h,t+r.height);o.x=Math.min(o.x,r.left),o.y=Math.min(o.y,t),o.w=e-o.x,o.h=a-o.y}else n.push({x:r.left,y:t,w:r.width,h:r.height})}return n.sort((t,e)=>t.y-e.y),n.slice(0,40)},ea=(t,e)=>{if(e.length<2)return[{x:t.x,y:t.y,w:t.w,h:t.h}];let a=[];for(let l=0;l<e.length;l++){let n=0===l?t.y:(e[l-1].y+e[l-1].h+e[l].y)/2,r=l===e.length-1?t.y+t.h:(e[l].y+e[l].h+e[l+1].y)/2;a.push({x:t.x,y:n,w:t.w,h:Math.max(1,r-n)})}return a},el=()=>{if(e)return;let a=window.scrollY;tC=window.innerWidth,tT=window.innerHeight,tI=Math.max(1,document.documentElement.scrollHeight-tT);let l=f(tC<=760,w);l!==v&&(v=l,R?.setGrid(v)),t.style.setProperty("--cw",`${v.cw}px`),t.style.setProperty("--lh",`${v.lh}px`);let n=v.phone;if(function(e){let a=K?.querySelector(".kn-end-box"),l=K?.querySelector(".kn-talk"),n=t.querySelector(".kn-nav-n"),r=a?.firstElementChild;if(!K||!a||!l||!n||!r)return;let o=K.style;o.removeProperty("--kn-g"),o.removeProperty("--kn-fs"),o.removeProperty("--kn-ta");let i=[...a.children];for(let t of i)t.style.removeProperty("margin-top");let h=K.querySelector(".kn-foot"),s=h?Math.ceil(h.getBoundingClientRect().height+44):64;o.setProperty("--kn-pb0",`${s}px`);let d=n.getBoundingClientRect().bottom+(e?30:40),u=()=>d-(r.getBoundingClientRect().top+window.scrollY-(document.documentElement.scrollHeight-window.innerHeight)),f=u();if(f<=0)return;let c=(t,e)=>t&&parseFloat(getComputedStyle(t).getPropertyValue(e))||0,p=c(l,"margin-top")+Math.max(c(l,"margin-bottom"),c(a.querySelector(".kn-links"),"margin-top"))+c(a.querySelector(".kn-form"),"margin-top")+c(a.querySelector(".kn-form-k"),"margin-bottom")+Math.max(0,c(K,"padding-bottom")-s),m=a.querySelector("textarea"),y=m?m.getBoundingClientRect().height:0,x=parseFloat(getComputedStyle(l).fontSize)||60,g=1,M=y,w=x,v=[t=>g=Math.max(.55,g-t/Math.max(1,p)),t=>M=m?Math.max(76,M-t):M,t=>w=Math.max(e?58:76,w-t/1.98),t=>g=Math.max(.2,g-t/Math.max(1,p)),t=>w=Math.max(e?46:54,w-t/1.98)];for(let t=0,e=0;t<v.length&&e<16&&f>1;e++){let e=`${g}/${M}/${w}`;if(v[t](f),`${g}/${M}/${w}`===e){t++;continue}o.setProperty("--kn-g",g.toFixed(3)),M<y-.5&&o.setProperty("--kn-ta",`${M.toFixed(1)}px`),w<x-.05&&o.setProperty("--kn-fs",`${w.toFixed(2)}px`),f=u()}let k=()=>document.documentElement.scrollHeight-window.innerHeight;for(let t=0;t<i.length-1&&f>1;t++){let e=i[t].getBoundingClientRect(),a=e.top+window.scrollY-k(),l=e.bottom+window.scrollY-k();if(l<=0)continue;if(a>=d)break;let n=Math.max(c(i[t],"margin-bottom"),c(i[t+1],"margin-top"));i[t+1].style.marginTop=`${(n+l+4).toFixed(1)}px`}}(n),tI=Math.max(1,document.documentElement.scrollHeight-tT),z&&Y){tB=t7(Y,a);let t=z.getBoundingClientRect();t_={x:t.left,y:0,w:t.width,h:t.height}}tSkillsDoc=tSkills?t7(tSkills,a):th;for(let t of(tU=j?t7(j,a):th,tN=K?t7(K,a):th,tq=G?t7(G,a):th,tL=V&&n?t7(V,a):th,tW.length=0,ta))tW.push({k:t.dataset.knS??"",top:t7(t,a).y});for(let t of td){et(t,a);let e=parseFloat(getComputedStyle(t.el).fontSize)||60,l=(n?t.el.dataset.lm:t.el.dataset.ld)?.split("\n")??[t.el.textContent??""],r=`${l.join("|")}@${e.toFixed(2)}/${v.key}`;r!==t.key&&(t.key=r,t.lines=l,t.fs=e,t.tg=c(v,e),t.shape=N(l,e,M,t.tg))}for(let t of ts)et(t,a),er(t);for(let t of tc)et(t,a),t.lines=ee(t.el,a,t.inStage),t.bands=ea(t.doc,t.lines),t.shaped="";let o=[];for(let t of tE){et(t,a);let e=o.findIndex(e=>8>Math.abs(e-t.doc.y));e<0&&(o.push(t.doc.y),e=o.length-1),t.rowIx=e}for(let t of tR){et(t,a);let e=t.el.querySelector(".kn-tl-d"),l=t.el.querySelector(".kn-tl-b");if(e){let l=document.createRange();l.selectNodeContents(e);let n=l.getBoundingClientRect();t.date={x:n.left,y:n.top+a,w:n.width,h:n.height}}else t.date=t.doc;t.body=l?t7(l,a):t.doc}for(let t of(tO=to?t7(to,a):th,t$))et(t,a);let i=[];for(let t of tP){let e=!!z&&z.contains(t);if("box"===t.dataset.knOcc){i.push({el:t,doc:e?t9(t):t7(t,a),inStage:e,box:!0});continue}let l=ee(t,a,e);if(!l.length)continue;let n=1/0,r=1/0,o=-1/0,h=-1/0;for(let t of l)n=Math.min(n,t.x),r=Math.min(r,t.y),o=Math.max(o,t.x+t.w),h=Math.max(h,t.y+t.h);i.push({el:t,doc:{x:n,y:r,w:o-n,h:h-r},inStage:e,box:!1})}let h=n?60:84;for(let t=!0;t;){t=!1;for(let e=0;e<i.length&&!t;e++)for(let a=e+1;a<i.length&&!t;a++){let l=i[e],n=i[a];if(l.box||n.box||l.inStage!==n.inStage)continue;let r=Math.max(l.doc.y,n.doc.y)-Math.min(l.doc.y+l.doc.h,n.doc.y+n.doc.h),o=Math.min(l.doc.x+l.doc.w,n.doc.x+n.doc.w)-Math.max(l.doc.x,n.doc.x);if(r<h&&o>-32){let e=Math.min(l.doc.x,n.doc.x),r=Math.min(l.doc.y,n.doc.y);l.doc={x:e,y:r,w:Math.max(l.doc.x+l.doc.w,n.doc.x+n.doc.w)-e,h:Math.max(l.doc.y+l.doc.h,n.doc.y+n.doc.h)-r},i.splice(a,1),t=!0}}}if(tF=i,eo(),tr){tD=t7(tr,a);let t=`${tD.w}/${v.key}`;if(t!==tK){tK=t;let e=function(t,e,a,l){let n=Math.max(1,Math.floor(a/l.cw)),o=Math.max(1,Math.min(e,53)),i=n>=3*o,h=i?o:Math.max(1,Math.min(o,n)),s=i?Math.floor(n/h):1,d=i?s-1:1,u=[],f=e-h;for(let e=0;e<h;e++)for(let a=0;a<7;a++){let l=t[(f+e)*7+a];if(!l||"-"===l)continue;let n=Number(l)/9;for(let t=0;t<2;t++)for(let l=0;l<d;l++){let o=e*s+l,i=2*a+t;if(n<=0){0===l&&1===t&&u.push({x:o,y:i,g:m("."),v:.22,m:1});continue}let h=_(n+(r(3*o+1,7*i+2)-.5)*.12);u.push({x:o,y:i,g:C(h),v:.32+.68*n,m:1})}}return{shape:T(u,h*s,14),show:h,start:f,pw:s*l.cw}}(tr.dataset.knCal??"",Number(tr.dataset.weeks)||53,tD.w,v);tj=e.shape;let a=-1e9;for(let t of tm(tr.parentElement??tr,".kn-cal-m [data-i]")){let l=(Number(t.dataset.i)-e.start)*e.pw,r=l>=0&&l-a>=(n?36:44)&&l<e.show*e.pw-16;t.style.left=`${l.toFixed(1)}px`,t.style.display=r?"block":"none",r&&(a=l)}}}let s=`${tC}x${tT}/${Math.round(tI/200)}/${v.key}`;s!==tQ&&(tQ=s,tJ=function(t,e,a,l){let n=e+.06*a+40,o=Math.ceil(t/l.cw),i=Math.min(4e3,Math.round(o*Math.ceil(n/l.lh)*.0019)),h={x:new Float32Array(i),y:new Float32Array(i),h:new Float32Array(i),big:new Uint8Array(i),n:i};for(let t=0;t<i;t++)h.x[t]=Math.floor(r(7*t+1,3)*o)*l.cw,h.y[t]=r(13*t+5,11)*n,h.h[t]=r(3*t+2,29),h.big[t]=+(r(t,41)>.82);return h}(tC,tT,tI,v)),en();let d=n?Math.min(.16*tC,70):.19*Math.min(tC,tT),u=`${d.toFixed(1)}/${v.key}`;u!==t3&&(t3=u,t5=function(t,e){let a=Math.ceil(1.5*t/e.cw),l=Math.ceil(1.5*t/e.lh),n=[],o=[],i=[],h=[],s=[],d=[],u=[],f=[];for(let c=-l;c<=l;c++)for(let l=-a;l<=a;l++){let a=l*e.cw/t,p=c*e.lh/t,m=Math.hypot(a,p);m>1.5||(n.push(l),o.push(c),i.push(a),h.push(p),s.push(m),d.push(Math.sin(3.2*a+2.1*p+1.3)*Math.sin(2.7*p-1.4*a)),u.push(r(3*l+101,7*c+13)),f.push(r(5*c+7,11*l+3)))}return{R:t,n:n.length,i:Int16Array.from(n),j:Int16Array.from(o),u:Float32Array.from(i),w:Float32Array.from(h),r:Float32Array.from(s),base:Float32Array.from(d),h:Float32Array.from(u),h2:Float32Array.from(f)}}(d,v))};function en(){let t=`${tC}/${v.key}/${+!!t2}`;if(t===t0)return;t0=t;let e=t2?.8:1;tZ=te(tC,Math.ceil(.3*tT/v.lh),v,.55*e,2),t1=null}function er(t){let e=Math.max(8,Math.floor(t.doc.w/v.cw)),a=Math.max(4,Math.floor(t.doc.h/v.lh)),l=!(t4||ts.some(t=>"fail"===t.status)||!ts.every(t=>"ok"===t.status||"wait"===t.status))&&"ok"===t.status&&!!t.img,n=`${l?"p":"c"}${e}x${a}/${v.key}`;if(n!==t.key){if(!l&&"wait"===t.status&&!t4){t.shape=null,t.key="";return}t.key=n;try{t.shape=l&&t.img?function(t,e,a,l){let n=(t.naturalWidth||t.width)??1,o=(t.naturalHeight||t.height)??1,i=e*l.cw/(a*l.lh),h=n/o,s=[0,0,n,o],d=e,u=a;h>1.7*i?(s=[0,0,o*i*1.25,o],u=Math.round(.8*a*1),d=e,u=Math.min(a,Math.round(e*l.cw/(1.25*i)/l.lh))):h<i/1.8?(s=[0,0,n,n/(i/1.3)],d=Math.min(e,Math.round(a*l.lh*(i/1.3)/l.cw)),u=a):h>i?(d=e,u=Math.max(4,Math.round(e*l.cw/h/l.lh))):(u=a,d=Math.max(4,Math.round(a*l.lh*h/l.cw)));let f=Math.floor((e-d)/2),c=Math.floor((a-u)/2),p=U(t,n,o,s,d,u),m=d*u,y=new Float32Array(m),x=[],g=0,M=0,w=0;for(let t=0;t<m;t++)p[4*t+3]/255<.5?g++:(M+=I(p,4*t),w++);let v=g>.15*m&&w>0&&M/w<.45?1:.05;for(let t=0;t<m;t++){y[t]=I(p,4*t)*(p[4*t+3]/255)+(1-p[4*t+3]/255)*v;let e=t%d,a=t/d|0;(e<2||a<2||e>=d-2||a>=u-2)&&x.push(y[t])}x.sort((t,e)=>t-e);let k=Array.from(y).sort((t,e)=>t-e),b=new Float32Array(48);for(let t=0;t<m;t++)b[Math.min(47,Math.floor(48*y[t]))]++;let A=0;for(let t=1;t<48;t++)b[t]>b[A]&&(A=t);let S=(A+.5)/48,E=b[A]>.18*m?S:B(x,.5),R=E>.55||E>.4&&B(k,.5)>.6,$=Array.from(y,t=>R?1-t:t).sort((t,e)=>t-e),P=Math.max(B($,.05),b[A]>.18*m?(R?1-E:E)+.05:0),F=Math.max(P+.1,B($,.985)),N=[];for(let t=0;t<m;t++){let e=t%d,a=t/d|0,l=_(((R?1-y[t]:y[t])-P)/Math.max(.08,F-P));l<.1&&r(3*e+1,5*a+2)>.1||N.push({x:e+f,y:a+c,g:C(l),v:.18+.82*l,m:1})}return T(N,e,a,[f,c,d,u])}(t.img,e,a,v):q(t.cover,e,a,M,v)}catch{for(let t of(t4=!0,ts))t.key="",t.shape=q(t.cover,Math.max(8,Math.floor(t.doc.w/v.cw)),Math.max(4,Math.floor(t.doc.h/v.lh)),M,v)}}}function eo(){let t=G?.dataset.ini??"?",e=e=>{let a=Math.max(10,Math.floor(e.w/v.cw)),l=Math.max(10,Math.floor(e.h/v.lh));if("wait"===tX)return null;if("ok"===tX&&tY)try{return function(t,e,a,l){let n,o=t.naturalWidth||400,i=t.naturalHeight||400,h=e*l.cw/(a*l.lh);if(o/i>h){let t=i*h;n=[(o-t)/2,0,t,i]}else{let t=o/h;n=[0,Math.max(0,(i-t)*.3),o,t]}let s=U(t,o,i,n,e,a),d=e*a,u=new Float32Array(d);for(let t=0;t<d;t++)u[t]=I(s,4*t);let f=Math.max(10,Math.round(e*l.cw/l.base.cw)),c=Math.max(10,Math.round(a*l.lh/l.base.lh)),p=f===e&&c===a,m=function(t,e,a){let l=e*a,n=new Uint8Array(l),r=new Int32Array(l),o=0,i=0,h=(e,a)=>Math.abs(t[4*e]-t[4*a])+Math.abs(t[4*e+1]-t[4*a+1])+Math.abs(t[4*e+2]-t[4*a+2]);for(let t=0;t<e;t++)for(let a of[0,1]){let l=a*e+t;n[l]||(n[l]=1,r[i++]=l)}for(let t=0;t<a;t++)for(let a of[0,1,e-2,e-1]){let l=t*e+a;n[l]||(n[l]=1,r[i++]=l)}for(;o<i;){let t=r[o++],l=t%e,s=t/e|0;for(let o of[l>0?t-1:-1,l<e-1?t+1:-1,s>0?t-e:-1,s<a-1?t+e:-1])o<0||n[o]||15>h(t,o)&&(n[o]=1,r[i++]=o)}let s=0;for(let t=0;t<l;t++)s+=n[t];let d=s<.9*l&&s>.04*l,u=[[],[],[]];for(let a=0;a<l;a++){let l=a%e,n=a/e|0;if(l<2||n<2||l>=e-2)for(let e=0;e<3;e++)u[e].push(t[4*a+e])}let f=u.map(t=>t.sort((t,e)=>t-e)[t.length>>1]??0),c=new Float32Array(l);for(let r=0;r<l;r++){let l=r%e,o=r/e|0,i=d?1:_((Math.hypot(t[4*r]-f[0],t[4*r+1]-f[1],t[4*r+2]-f[2])/150-.16)/.3);if(d)if(n[r])i=0;else{let t=0;for(let r=-1;r<=1;r++)for(let i=-1;i<=1;i++){let h=l+i,s=o+r;h>=0&&s>=0&&h<e&&s<a&&n[s*e+h]&&t++}i=1-t/12}c[r]=i}return c}(p?s:U(t,o,i,n,f,c),f,c),y=new Float32Array(d),x=[];for(let t=0;t<d;t++){let l=t%e,n=t/e|0,r=p?m[t]:m[Math.min(c-1,Math.floor((n+.5)*c/a))*f+Math.min(f-1,Math.floor((l+.5)*f/e))],o=(n-.46*a)/(.56*a);r*=1-_((Math.hypot((l-e/2)/(e/2),o<0?o:.55*o)-.82)/.22),y[t]=r,r>.5&&x.push(u[t])}x.sort((t,e)=>t-e);let g=B(x,.04),M=B(x,.97),w=[];for(let t=0;t<d;t++){let a=y[t],l=t%e,n=t/e|0;if(a<.06||r(l+9,n+3)>1.3*a)continue;let o=_((u[t]-g)/Math.max(.06,M-g));w.push({x:l,y:n,g:C(o),v:o,m:a})}return T(w,e,a)}(tY,a,l,v)}catch{tX="fail"}return function(t,e,a,l,n){let r=t.slice(0,2)||"?",o=[...r].length,i=Math.min(e*n.cw*.9/(.66*o+.06),a*n.lh*.78/.86),h=Math.ceil((.66*o*i+.06*i)/n.cw),s=Math.ceil(.98*i/n.lh),d=N([r],i,l,n,{fc:h,fr:s,v0:.4,v1:.6}),u=Math.floor((e-h)/2),f=Math.max(0,a-s-Math.round(.08*a)),c=[];for(let t=0;t<d.n;t++){let a=d.x[t]+u,l=d.y[t]+f,n=.75+.25*(1-a/e);c.push({x:a,y:l,g:d.g[t],v:d.v[t]*n,m:1})}return T(c,e,a)}(t,a,l,M,v)},a=`${tX}${Math.floor(tq.w/v.cw)}x${Math.floor(tq.h/v.lh)}/${v.key}`;if(a!==tz&&tq.w>0){tz=a;let t=!!tH;tH=e(tq),!t&&tH&&t8>0&&(t6=performance.now())}if(tL.w>0){let t=`${tX}${Math.floor(tL.w/v.cw)}x${Math.floor(tL.h/v.lh)}/${v.key}`;t!==tV&&(tV=t,tG=e(tL))}else tG=null,tV=""}let ei=[],eh=[],es=[],ed=(t,e,a)=>({x:t.doc.x,y:t.inStage?a+t.doc.y:t.doc.y-e,w:t.doc.w,h:t.doc.h}),planetRotation=0,activeElapsedSec=0,lastPlanetTime:number|null=null;const ROTATION_PERIOD_SECONDS=60,TWO_PI=Math.PI*2,PLANET_ANGULAR_SPEED=TWO_PI/ROTATION_PERIOD_SECONDS;let eu=(e,a)=>{E.reset();let l=e.y,n=v.phone,o=d?0:a,i=performance.now();if(lastPlanetTime===null)lastPlanetTime=i;let rawDeltaSec=(i-lastPlanetTime)/1000;lastPlanetTime=i;if(!d){let isHidden=typeof document!=='undefined'&&document.hidden;if(!isHidden){let delta=Math.min(Math.max(0,rawDeltaSec),0.05);activeElapsedSec+=delta;planetRotation=(activeElapsedSec*PLANET_ANGULAR_SPEED)%TWO_PI;}}else{planetRotation=0;}t8<0&&(t8=i,W=null!==W&&H?Math.max(W,i-120):i-900,d||(t.style.setProperty("--kn-veil-t",`${Math.max(.4,1.6-(i-W)/1e3).toFixed(2)}s`),t.setAttribute("data-veil","")));let h=d||null===W?99:(i-W)/1e3,s=h>=1.65,u=s?1:tg(h/.6),f=Math.min(s?1:tx(h,.15,1.15),t6>0?tx((i-t6)/1e3,0,.9):1),p=s?1:tg(tx(h,.3,1.25)),y=s?1:tx(h,.7,1.45),g=s?1:tx(h,0,.8),M=(t=>{if(!z)return 0;let e=tB.y-t,a=e+tB.h-t_.h;return e>0?e:a<0?a:0})(l);for(let t of(ei.length=0,eh.length=0,es.length=0,tF)){let e=ed(t,l,M);if(e.y+e.h<-20||e.y>tT+20||e.w<1)continue;let a=t.box?{x:e.x-16,y:e.y-14,w:e.w+32,h:e.h+28,s:1,fe:14}:{x:e.x-18,y:e.y-14,w:e.w+36,h:e.h+28,s:1,fe:12};ei.push(a),eh.push(a)}let w=d?0:ty(l/(1.02*tT)),k=tq.x,b=d?tq.y-l:tq.y,A=tN.y+tN.h-l,S=d?1:tg(tx(1.95*tT-A,0,.85*tT)),R=n?tL.x:k,$=n?tL.y-l:d?tN.y+tN.h-(tU.y+tU.h-tq.y)-l:tq.y,P=n?tG:tH,F=n?d?1:tg(tx(tT-(tL.y-l),0,.55*tT)):S;tH&&(d?b+tH.fr*v.lh>0:w<1)&&es.push({shape:tH,x:k,y:b,s:(1-tg(2.2*w))*f}),P&&F>0&&es.push({shape:P,x:R,y:$,s:tg(tx(F,.45,1))});let headObs=[];for(let t of td){let e=ed(t,l,M);if(e.y+e.h<-40||e.y>tT+40)continue;let shapeW=t.shape&&t.shape.fc>0?t.shape.fc*(t.tg?.cw??v.cw):0;let effW=Math.max(e.w,shapeW);if(effW<1)continue;headObs.push({x:e.x-16,y:e.y-12,w:effW+32,h:e.h+24,f:32})}for(let t of ts){if(!t.shape)continue;let e=ed(t,l,M);if(e.y+e.h<0||e.y>tT)continue;let[a,n,r,o]=t.shape.area,i=d?1:1-tg(tx(ef(e).out,.3,.8));i<.02||ei.push({x:e.x+a*v.cw-22,y:e.y+n*v.lh-22,w:r*v.cw+44,h:o*v.lh+44,s:i,fe:16})}(function(t,e){for(let a=!0;a;){a=!1;for(let l=0;l<t.length&&!a;l++)for(let n=l+1;n<t.length&&!a;n++){let r=t[l],o=t[n];if(r.s<1||o.s<1)continue;let i=Math.max(r.x,o.x)-Math.min(r.x+r.w,o.x+o.w),h=Math.max(r.y,o.y)-Math.min(r.y+r.h,o.y+o.h);if((i<0&&h<e)||(h<0&&i<16)){let e=Math.min(r.x,o.x),i=Math.min(r.y,o.y);t[l]={x:e,y:i,w:Math.max(r.x+r.w,o.x+o.w)-e,h:Math.max(r.y+r.h,o.y+o.h)-i,s:1,fe:Math.max(r.fe??0,o.fe??0)},t.splice(n,1),a=!0}}}}(ei,n?64:104));tJ&&function(t,e,a,l,n,r,o){let i=.06*a;for(let a=0;a<e.n;a++){let h=e.y[a]-i;if(h<-10||h>l)continue;let s=e.h[a],d=r?.8:.55+.45*Math.sin(n*(.9+1.1*s)+40*s);t.push(e.x[a],h,e.big[a]?Q:J,x(.55+.4*s),(.18+.55*s)*d*o)}}(E,tJ,l,tT,o,d,g);if(tSkillsDoc.h>0){let skTop=tSkillsDoc.y-l,skH=tSkillsDoc.h;if(skTop+skH>-40&&skTop<tT+40)renderSignalField(E,skTop,skH,tSkillsDoc.y,tC,tT,v,ei,o,d)}if(t5&&d){let t=tq.w>0,e=n?tC-14-t5.R:.68*tC,a=n?64+t5.R:.22*tT;tf(E,t5,e,a-l,tC,tT,0,0,1,ei,es,v,headObs);tN.h>0&&tf(E,t5,e,n?tL.w>0?tL.y+64+t5.R-tq.y-l:a-l+tN.y:$+(a-tq.y),tC,tT,0,0,1,ei,es,v,headObs)}else if(t5){let a=n&&tN.h>0?Math.max(tT,Math.min(tI,tN.y)):tI,r=ty(l/a),i=Math.sin(Math.PI*r),t,e;if(n){let a=tL.w>0?Math.max(0,Math.min(.3*tT,tL.y-tN.y-tq.y)):0;t=tC-14-t5.R,e=64+t5.R+a*tg(tx(l,a-1.6*tT,a)),l>a&&(e-=l-a)}else t=tC*.72-t5.R*.3,e=.22*tT;tf(E,t5,t-(n?.35*tC:.12*tC)*i,e-(n?0:.04*tT)*i+(1-p)*46,tC,tT,o,planetRotation+3*r,p,ei,es,v,headObs)}d||function(t,e,a,l,n,o,i,h,s){if(h<=.01)return;let d=a+600;for(let u=0;u<i;u++){let i=6+Math.floor(20*r(u,3)),f=.35+.5*r(u,5),c=s?0:n,p=(r(u,11)*d+e*f+46*c*f)%d;p=(p<0?p+d:p)-300;let m=Math.round(((r(u,7)*(l+200)-100-.12*e+16*Math.sin(.004*p+u))%l+l)%l/o.lh)*o.lh,y=(.1+.12*r(u,9))*h;for(let e=0;e<i;e++){let l=p+e*o.cw;if(l<-o.cw||l>a)continue;let n=y*Math.sin(Math.PI*(e+.5)/i),r=Math.round(.6*Math.sin(.01*l+u))*o.lh;t.push(Math.round(l/o.cw)*o.cw,m+r,e%5==2?tt:Z,x(.85),n)}}}(E,l,tC,tT,o,v,(n?12:26)>>!!t2,s?1:tx(h,.2,1.2),d);let C=n?.8*tT:.745*tT;if(tZ&&(w<1||d)){let t=d?tU.y+C-l:C;ti(E,tZ,t,t+.3*tT,tT,v,{grow:u*(1-tg((w-.3)/.7)),tall:1,flat:.9*tg(1.5*w),gust:null,t:o,still:d,alpha:1-tg((w-.55)/.45),dim:eh,front:s?void 0:h/.6})}for(let t of(tH&&(d?b+tH.fr*v.lh>0:w<1)&&tp(E,tH,k,b,v,{mv:L.figure.out??null,leaving:!0,p:w,lock:f<1?f:void 0,t:h,still:d,alpha:1,breathe:!0,v0:.14,v1:.86},tC,tT),td)){let e;if(!t.shape)continue;let a=ed(t,l,M);if(a.y>tT+300||a.y+a.h<-300)continue;let r=null,o=!1,i=1;if(!d)if("name"===t.kind){let l=tx(.16*tT-a.y,0,.45*tT);l>0&&(r=t.pair.out??null,o=!0,i=l),s||(e=y)}else if(t.plate){let e=ef(ed(t.plate,l,M));e.out>0?(r=t.pair.out??null,o=!0,i=e.out):e.in<1&&(r=t.pair.in??null,i=e.in)}else if("settle"===t.kind){let e=n?tx(tT-a.y,0,.5*tT):S;e<1&&(r=t.pair.in??null,i=e)}else{let e=tx(tT-a.y,0,.45*tT),l=tx(.28*tT-(a.y+a.h),0,.42*tT);l>0&&t.pair.out?(r=t.pair.out,o=!0,i=l):e<1&&t.pair.in&&(r=t.pair.in,i=e)}let u=t.tg??c(v);tp(E,t.shape,a.x,a.y,u,{mv:r,leaving:o,p:i,lock:e,t:h,still:d,alpha:1,v0:0,v1:1,fine:u.level},tC,tT)}for(let t of ts){if(!t.shape)continue;let e=ed(t,l,M);if(e.y>tT+300||e.y+e.h<-300)continue;let a=ef(e),n=L[t.move]??L.sweep,r=null,i=!1,h=1;!d&&(a.out>0?(r=n.out??null,i=!0,h=a.out):a.in<1&&(r=n.in??null,h=a.in)),tp(E,t.shape,e.x,e.y,v,{mv:r,leaving:i,p:h,t:o,still:d,alpha:1,v0:.05,v1:.95},tC,tT);let[s,u,f,c]=t.shape.area,p=d?.55:.55*tg(tx(a.in,.55,1))*(1-tg(2.2*a.out));!function(t,e,a,l,n,r,o,i){if(o<=.01)return;let{cw:h,lh:s}=r,d=Math.max(2,Math.round(Math.min(l/h/6,12)*i)),u=Math.max(1,Math.round(Math.min(n/s/6,6)*i)),f=e+l,c=a+n,p=x(.8);for(let l=1;l<=d;l++){let n=o*(1-l/(d+2));t.push(e+l*h,a,Z,p,n),t.push(f-l*h,a,Z,p,n),t.push(e+l*h,c,Z,p,n),t.push(f-l*h,c,Z,p,n)}let y=m("|");for(let l=1;l<=u;l++){let n=o*(1-l/(u+2));t.push(e,a+l*s,y,p,n),t.push(f,a+l*s,y,p,n),t.push(e,c-l*s,y,p,n),t.push(f,c-l*s,y,p,n)}t.push(e,a,Q,p,o),t.push(f,a,Q,p,o),t.push(e,c,Q,p,o),t.push(f,c,Q,p,o)}(E,e.x+(s-2)*v.cw,e.y+(u-1.5)*v.lh,(f+3)*v.cw,(c+2.5)*v.lh,v,p,d?1:tg(tx(a.in,.6,1)))}if(tR.length&&to&&function(t){let{cw:e,lh:a}=v,l=v.phone,n=tR[0],r=e=>(l?e.doc.y+12:e.body.y+13)-t,o=d?1/0:.62*tT,i=r(n),h=r(tR[tR.length-1]);if(i>tT+40||h<-40)return;let s=Math.round((l?tO.x+12:n.body.x-5*e)/e)*e,u=Math.min(h,o);for(let t=i+a;t<u;t+=a)t<-a||t>tT||E.push(s,t,ex,x(.55),.7);if(!d&&u<h&&u>i)for(let e=0;e<3;e++)E.push(s,u+e*a,X((.05*t|0)+3*e),x(.85),.8-.25*e);for(let t of tR){let n=r(t);if(n<-(2*a)||n>tT+a)continue;let i=d?1:tg(tx(o-n,0,.16*tT)),h=l?s:Math.round((t.date.x+t.date.w+3*e)/e)*e,u=l?0:Math.max(0,Math.round((s-h)/e)-1),f=.5*Math.round(n/.5)-.15*a;for(let t=0;t<u;t++){let a=ty((i-t/Math.max(1,u)*.55)/.45);if(a<=.01)continue;let l=(1-tg(a))*(60+37*t%7*40/7);E.push(h+t*e-l,f,a<.8?X(t+(9*a|0)):ep,x(.6),.85*tg(a))}if(i>.05&&(E.push(s,f,i<.9?X((11*i|0)+t.doc.y):em,x(1),i),!l))for(let t=1;t<=4;t++){let a=ty((i-.55-.08*t)/.3);a>.01&&E.push(s+t*e,f,ep,x(.6),.8*a)}}}(l),tj&&tr){let t={x:tD.x,y:tD.y-l,w:tD.w,h:tD.h};if(t.y<tT+200&&t.y+t.h>-200){let e=tx(tT-t.y,.04*tT,.5*tT),a=tx(.2*tT-(t.y+t.h),0,.45*tT),l=L.ripple;tp(E,tj,t.x,t.y,v,{mv:d?null:a>0?l.out??null:e<1?l.in??null:null,leaving:a>0,p:a>0?a:e,t:o,still:d,alpha:1,v0:0,v1:1},tC,tT)}}for(let t of t$){let e=ed(t,l,M);if(e.y>tT+20||e.y+e.h<-20)continue;let a=d?1:tg(tx(tT-e.y,.04*tT,.42*tT));!function(t,e,a){let{cw:l,lh:n}=v;if(e<=.001)return;let r=Math.round(t.x/l)*l,o=Math.round(t.y/n)*n,i=Math.max(4,Math.round(t.w/l)),h=Math.max(3,Math.round(t.h/n)),s=[];for(let t=0;t<=i;t++)s.push([t,0,0===t||t===i?em:ep]);for(let t=1;t<=h;t++)s.push([i,t,t===h?em:ey]);for(let t=i-1;t>=0;t--)s.push([t,h,0===t?em:ep]);for(let t=h-1;t>=1;t--)s.push([0,t,ey]);let u=s.length,f=[0,i+1,i+h+1,2*i+h+1][a%4],c=a%2?-1:1,p=Math.round(u*e);for(let t=0;t<p;t++){let[a,i,h]=s[((f+c*t)%u+u)%u],m=p-t,y=!d&&e<1&&m<=2?X(t+(40*e|0)):h;E.push(r+a*l,o+i*n,y,x(m<=2&&e<1?1:.62),.85)}}(e,a,t.i)}if(K&&tZ){let t=A-tT*(n?.2:.255);t<tT+20&&ti(E,tZ,t,t+.3*tT,tT,v,{grow:d?1:tg(tx(1.45*tT-A,0,.45*tT)),tall:1,flat:0,gust:null,t:o,still:d,alpha:1,dim:eh}),P&&F>0&&tp(E,P,R,$,v,{mv:F<1?L.figure.in??null:null,leaving:!1,p:F,t:o,still:d,alpha:1,breathe:!0,v0:.14,v1:.86},tC,tT)}for(let t of tc)!function(t,e,a){let l=ed(t,e,a),n=t.rc,o=1;d||(o=tx(1.04*tT-l.y,0,.47*tT));let i=o<1&&D,h="one"===n.shape?1:t.bands.length,s=h<2?0:"alt"===n.shape?1:h-1,u=s>0?Math.min("alt"===n.shape?1.4*n.lag:n.lag,.5/s):0,f=n.soft/100,c=-.2+(1.45+f+u*s)*tg(o);if(i!==t.on&&(t.on=i,i?t.el.setAttribute("data-f",""):(t.el.removeAttribute("data-f"),t.el.style.removeProperty("--kf"),eM(t.el,"","",""),t.shaped="",t.last="")),!i)return;let p=`${h}/${t.doc.h.toFixed(0)}`;if(p!==t.shaped){t.shaped=p;let e=t=>`linear-gradient(${n.a}deg, #000 calc(var(--kf) - ${((f+u*t)*100).toFixed(1)}%), rgba(0,0,0,0.35) calc(var(--kf) - ${((.35*f+u*t)*100).toFixed(1)}%), transparent calc(var(--kf) - ${(u*t*100).toFixed(1)}%))`;if(h<2)eM(t.el,e(0),"","");else{let a=t.doc.y;eM(t.el,t.bands.map((t,a)=>e(eg(n.shape,a,h))).join(", "),t.bands.map(t=>`100% ${t.h.toFixed(1)}px`).join(", "),t.bands.map(t=>`0 ${(t.y-a).toFixed(1)}px`).join(", "))}}let m=`${(100*c).toFixed(1)}%`;if(m!==t.last&&(t.last=m,t.el.style.setProperty("--kf",m)),l.y>tT||l.y+l.h<0)return;let{cw:y,lh:g}=v,M=n.a*Math.PI/180,w=Math.sin(M),k=-Math.cos(M),b=60*o|0,A=n.g,S=A.length,R=n.n;for(let l=0;l<t.lines.length;l++){let i=t.lines[l],s=(t.inStage?a+i.y:i.y-e)+.5*i.h;if(s<-10||s>tT+10)continue;let d=h<2?t.doc:t.bands[Math.min(l,t.bands.length-1)],p=t.inStage?a+d.y:d.y-e,m=c-u*(h<2?0:eg(n.shape,l,h))-.4*f,M=Math.abs(d.w*w)+Math.abs(d.h*k),v=d.x+d.w/2+((m-.5)*M-(s-(p+d.h/2))*k)/w,$=i.x-y,P=i.x+i.w+y;if(v<$-4*y||v>P+3*y)continue;let F=Math.round((s-g/2)/g)*g,C=t=>Math.round(t/y)*y;if("scr"===n.trail)for(let t=0;t<R;t++){let e=v-t*y*1.4;e<$||e>P||E.push(C(e),F,A[(b+3*t+5*l)%S],x(.95),.75*(1-t/R))}else if("dec"===n.trail)for(let t=0;t<R+2;t++){let e=v+(t+.3)*y*1.3;if(e>P)break;e<$||.32>r(7*t+13*l,b+t)||E.push(C(e),F,A[(3*b+5*t+l)%S],x(.85),.72*(1-t/(R+2)))}else if("rule"===n.trail){let t=Math.round((s+.5*i.h-.3*g)/g)*g,e=4*R;for(let a=1;a<e;a++){let l=v-a*y;if(l<$)break;l>P||E.push(C(l),t,A[0],x(.75),.62*(1-a/e))}v>=$&&v<=P&&E.push(C(v),t,X(b+3*l),x(1),.85)}else for(let t=0;t<R;t++){let e=v+y+t*y*2.3;if(e>P+3*y)break;if(e<$)continue;let a=Math.round(Math.sin(1.9*t+2.3*l+5*o)*t*.35);E.push(C(e),F+a*g,A[(b+7*t+l)%S],x(.8),.6*(1-t/R))}}}(t,l,M);var T=l;let I="hero";for(let t of tW)t.top-T<=.42*tT&&(I=t.k);if(I!==ew){for(let t of(ew=I,tl))t.dataset.knNk===I?t.setAttribute("data-on",""):t.removeAttribute("data-on");tn&&(tn.textContent=O[I]??"")}},ef=t=>{let e=t.y+t.h/2,a=tT-40,l=.6*tT;return{in:ty((a-e+t.h/2)/Math.max(60,a-l+t.h/2)),out:ty((.3*tT-e)/(.62*tT))}},ec=m("="),ep=m("-"),em=m("+"),ey=m("|"),ex=m(":"),eg=(t,e,a)=>"stairs"===t?e:"gather"===t?a-1-e:"alt"===t?e%2:0,eM=(t,e,a,l)=>{let n=t.style;n.setProperty("-webkit-mask-image",e),n.setProperty("mask-image",e),n.setProperty("-webkit-mask-size",a),n.setProperty("mask-size",a),n.setProperty("-webkit-mask-position",l),n.setProperty("mask-position",l),n.setProperty("-webkit-mask-repeat",a?"no-repeat":""),n.setProperty("mask-repeat",a?"no-repeat":"")},ew="",ev=()=>{if(!D){D=!0;t.setAttribute("data-arm","");t.setAttribute("data-live","");try{options?.onReady?.()}catch(err){console.warn("[KnightStage] onReady error:",err)}}},ek=()=>{var a;let l,r,o,h,s,u,f,c;if(e||F)return;$?.destroy(),$=null;let m=document.createElement("canvas");m.className="kn-cv",m.setAttribute("aria-hidden","true"),m.style.cssText="position:fixed;left:0;top:0;width:100%;height:100%;z-index:-1;pointer-events:none;",t.insertBefore(m,t.firstChild),F=m,a=v,l=m.getContext("2d",{alpha:!1}),r=`rgb(${p.join(",")})`,o=a,h=0,s=null,u=1,f=new WeakMap,c=t=>{if(!s)return null;let e=`${t.v0}/${t.v1}/${t.fine}/${t.grid.key}/${h}`,a=f.get(t.shape);a||(a=new Map,f.set(t.shape,a));let l=a.get(e);if(l)return l;let{canvas:n,cellW:r,cellH:o,padX:d,padY:u}=s,c=i[t.fine]??1,p=document.createElement("canvas");p.width=Math.ceil(t.shape.fc*t.grid.cw*h+2*r),p.height=Math.ceil(t.shape.fr*t.grid.lh*h+2*o);let m=p.getContext("2d"),y=t.shape;for(let e=0;e<y.n;e++){let a=t.v0+t.v1*y.v[e],l=a<=0?0:a>=1?23:Math.round(23*a);m.globalAlpha=.55+.45*y.m[e],m.drawImage(n,y.g[e]*r,l*o,r,o,Math.floor(y.x[e]*t.grid.cw*h+.5)+r-d*c,Math.floor(y.y[e]*t.grid.lh*h+.5)+o-u*c,r*c,o*c)}return a.set(e,p),p},R={sprites:!0,size(t,e,a){u=t;let l=Math.max(1,Math.round(t*a)),n=Math.max(1,Math.round(e*a));(m.width!==l||m.height!==n)&&(m.width=l,m.height=n),a!==h&&(s=b(g,o,h=a,!0),f=new WeakMap)},setGrid(t){t!==o&&(o=t,h&&(s=b(g,o,h,!0)),f=new WeakMap)},draw(t){if(l.setTransform(1,0,0,1,0,0),l.globalAlpha=1,l.fillStyle=r,l.fillRect(0,0,m.width,m.height),!s)return;let{canvas:e,cellW:a,cellH:n,padX:o,padY:d,ink:f}=s,p=t.data,y=h||m.width/u,x=-1;for(let r=0,h=0;r<t.n;r++,h+=4){let r=p[h+2],u=Math.floor(r/128),m=r-128*u;if(127===m){let e=c(t.spr[u]);e&&(1!==x&&(l.globalAlpha=1,x=1),l.drawImage(e,Math.floor(p[h]*y+.5)-s.cellW,Math.floor(p[h+1]*y+.5)-s.cellH));continue}let g=p[h+3],M=Math.floor(.5*g),w=Math.round((g-2*M)*32)/32;w!==x&&(l.globalAlpha=w,x=w);let v=4*m,k=f[v+2];if(!k)continue;let b=f[v],A=f[v+1],S=f[v+3];if(M){let t=i[M]??1;l.drawImage(e,m*a+b,u*n+A,k,S,Math.floor(p[h]*y+.5)+(b-o)*t,Math.floor(p[h+1]*y+.5)+(A-d)*t,k*t,S*t)}else l.drawImage(e,m*a+b,u*n+A,k,S,Math.floor(p[h]*y+.5)+b-o,Math.floor(p[h+1]*y+.5)+A-d,k,S)}l.globalAlpha=1},dispose(){s=null}},E.spriteOK=!0,!d!==t2&&(t2=!d,en()),P=(0,n.onScrollFrame)(t=>{if(!R)return;let e=Math.min(2,window.devicePixelRatio||1);e!==w&&eA(e),R.size(tC,tT,e),eu(t,t.time),R.draw(E),ev()},{always:!d})},eb=()=>{$=(0,l.createStage)({parent:t,zIndex:-1,animate:!d,governor:!1,className:"kn-cv",context:{alpha:!1,premultipliedAlpha:!1},init(t){R=function(t,e,a){let l=t.getParameter(t.ALIASED_POINT_SIZE_RANGE);if(!l||l[1]<48)throw Error("knight: points too small");let n=(0,o.createProgram)(t,A,S),r=t.getUniformLocation(n,"uBuf"),i=t.getUniformLocation(n,"uDpr"),h=t.getUniformLocation(n,"uCell"),s=t.getUniformLocation(n,"uPad"),d=t.getUniformLocation(n,"uAtlas"),u=t.getUniformLocation(n,"uPal[0]"),f=t.getUniformLocation(n,"uInk[0]"),c=t.getUniformLocation(n,"uTex"),m=t.createVertexArray();t.bindVertexArray(m);let x=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,x);let g=32768;t.bufferData(t.ARRAY_BUFFER,16*g,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,4,t.FLOAT,!1,16,0),t.bindVertexArray(null);let M=t.createTexture(),w=new Float32Array(y.flatMap(([t,e,a])=>[t/255,e/255,a/255])),v=a,k=0,E=null,R=()=>{E=b(e,v,k,!1),t.bindTexture(t.TEXTURE_2D,M),t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!0),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,!1),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,E.canvas),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE)};return{size(t,e,a){a!==k&&(k=a,R())},setGrid(t){t!==v&&(v=t,k&&R())},draw(e){t.viewport(0,0,t.drawingBufferWidth,t.drawingBufferHeight),t.clearColor(p[0]/255,p[1]/255,p[2]/255,1),t.clear(t.COLOR_BUFFER_BIT),E&&e.n&&(t.useProgram(n),t.bindVertexArray(m),t.bindBuffer(t.ARRAY_BUFFER,x),e.n>g&&(g=Math.max(e.n,2*g),t.bufferData(t.ARRAY_BUFFER,16*g,t.DYNAMIC_DRAW)),t.bufferSubData(t.ARRAY_BUFFER,0,e.data,0,4*e.n),t.uniform2f(r,t.drawingBufferWidth,t.drawingBufferHeight),t.uniform1f(i,k),t.uniform2f(h,E.cellW,E.cellH),t.uniform2f(s,E.padX,E.padY),t.uniform2f(d,E.canvas.width,E.canvas.height),t.uniform3fv(u,w),t.uniform4fv(f,E.ink),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,M),t.uniform1i(c,0),t.enable(t.BLEND),t.blendFunc(t.ONE,t.ONE_MINUS_SRC_ALPHA),t.drawArrays(t.POINTS,0,e.n),t.bindVertexArray(null))},dispose(){t.deleteProgram(n),t.deleteBuffer(x),t.deleteTexture(M),t.deleteVertexArray(m)}}}(t,g,v),E.spriteOK=!1},draw(t,e){R&&("lite"===e.tier!==t2&&(t2="lite"===e.tier,en()),e.pixelRatio!==w&&eA(e.pixelRatio),R.size(e.cssWidth,e.cssHeight,e.pixelRatio),eu(e.scroll,e.time),R.draw(E),ev())},dispose(){R?.dispose(),R=null},onFallback(){e||(R=null,ek())}})};function eA(t){w=t,f(v.phone,w)!==v&&el()}let eS=()=>{if(e)return;let t=s.matches||h;t!==d&&(d=t,eE(),d?ek():eb())};function eE(){P?.off(),P=null,F?.remove(),F=null,$?.destroy(),$=null,R=null}for(let e of(s.addEventListener("change",eS),a.push(()=>s.removeEventListener("change",eS)),a.push((0,n.onLayout)(el)),[t,...td.map(t=>t.el),...ts.map(t=>t.el)]))a.push((0,n.watchLayout)(e));let avatarDone=!1,avatarResolver:(()=>void)|null=null,avatarPromise=new Promise<void>(res=>{avatarResolver=res});const resolveAvatar=()=>{if(!avatarDone){avatarDone=!0;avatarResolver?.();}};(()=>{let t=G?.dataset.av;if(!t){tX="none";resolveAvatar();return}let a=new Image;a.crossOrigin="anonymous";a.referrerPolicy="no-referrer";a.onload=()=>{e||(tY=a,tX="ok",tz=tV="",eo());resolveAvatar();};a.onerror=()=>{e||(tX="fail",tz=tV="",eo());resolveAvatar();};setTimeout(resolveAvatar,1200);a.src=t})();for(let t of ts){if(!t.src)continue;let a=new Image;a.crossOrigin="anonymous",a.referrerPolicy="no-referrer",a.decoding="async",a.onload=()=>{if(!e&&(t.img=a,t.status="ok",ts.every(t=>"wait"!==t.status)))for(let t of ts)t.key="",er(t)},a.onerror=()=>{if(!e)for(let e of(t.status="fail",t4=!0,ts))e.key="",er(e)},a.src=t.src}const fontPromise=Promise.all([document.fonts.load(`500 ${v.fs}px ${g}`),document.fonts.load(`800 60px ${M}`)]).catch(()=>void 0);return Promise.race([Promise.all([fontPromise,avatarPromise]),new Promise(t=>setTimeout(t,1500))]).then(()=>{if(!e){for(let t of td)t.key="";for(let t of ts)t.key="";tz=tV=tK="",el(),d?ek():eb()}}).catch(err=>{try{options?.onError?.(err)}catch{}}),()=>{for(let l of(e=!0,a.forEach(t=>t()),eE(),t.removeAttribute("data-live"),t.removeAttribute("data-veil"),tc))l.el.removeAttribute("data-f")}};
    return runner(root) || (() => {});
  } catch (err) {
    console.error('[Knight Stage] Fatal error during ASCII stage setup:', err);
    try { options?.onError?.(err); } catch {}
    return () => {};
  }
}
