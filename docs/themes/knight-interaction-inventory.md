# Knight Theme — Reference Interaction Inventory

## 1. Overview & Methodology

This inventory documents all observed animations, interactive triggers, visual transformations, and motion timings inspected directly on the live reference website:
- **Reference Target**: `https://quanblue.forkfolio.dev/`
- **Inspection Tooling**: Playwright v1.65.0 with real Chromium / Microsoft Edge engine
- **Viewports Analyzed**: Desktop (1440 × 900), Tablet (768 × 1024), Mobile (390 × 844)

---

## 2. Comprehensive Interaction Inventory

| Component / Element | Trigger | Visual Transformation / Effect | Measured / Approx. Duration | Easing | Delay | Affected Elements | Mobile Behavior (≤ 760px) | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Initial Load & Veil** | Page Load (`DOMContentLoaded`) | Intro reveal sequence; opacity transitions from 0 to 1 for content; canvas background initializes; `data-arm`, `data-veil`, `data-live` attributes set on root container | 1.6s | `linear` | Staggered 0s – 1.2s | `.kn-veil`, `.kn-nav`, `.kn-hero-txt` | Identical fade-in with touch viewport | **Verified** |
| **Monospace Scalable Headings** | Viewport Enter (Scroll) | Monospace character scramble / wave effect; characters cycle through glyphs set (`{}=>;()`, `.:-=+`, etc.) before resolving to target text (`NGUYEN THANH QUAN`, `ABOUT`, `PROJECTS`, `SKILLS`, `ACTIVITY`, `LET'S TALK.`) | 450ms – 750ms | `cubic-bezier(0.16, 1, 0.3, 1)` | 0ms – 100ms | `.kn-asc[data-kn-t]` | Scaled font size (`--fmax: 92px`), touch scroll triggered | **Verified** |
| **Top Navigation Bar** | Scroll position | Fixed header with gradient blur backdrop; active section link highlights to `#e9e6df` (`data-on="true"`) while inactive links remain `#8b877e` | 250ms | `ease` | 0ms | `.kn-nav-l a`, `.kn-nav-here` | Navigation links collapse; `.kn-nav-here` displays active section name on right | **Verified** |
| **Navigation Bracket Links** | Hover / Focus | Bracket characters `[` and `]` shift from `--dim` (`#8b877e`) to `--ink` (`#e9e6df`); inner text brightens to `#ffffff` | 200ms | `ease-out` | 0ms | `.kn-br` | Active tap feedback on touch | **Verified** |
| **Project Cards** | Hover / Cursor Move | Alternating cards (`kn-p` & `kn-p.is-flip`); plate cover monogram gently shifts/scales (`scale(1.03)`); border shifts from `#3d3b37` to `#8b877e`; background glyph pattern subtle glimmer | 300ms | `cubic-bezier(0.2, 0, 0, 1)` | 0ms | `.kn-p`, `.kn-plate`, `.kn-plate-cv` | Single column stacked layout, touch tap to view project | **Verified** |
| **More Projects Table** | Hover / Focus | Dashed hairline divider (`- - - -`) illuminates; repository link `[ repo ]` illuminates | 200ms | `ease-out` | 0ms | `.kn-row`, `.kn-row-a` | Full width row, accessible tap target | **Verified** |
| **Skills Stage** | Viewport Scroll & Hover | Monospace skill tags illuminate on hover from 38% opacity to 100% white (`#ffffff`) | 200ms | `ease` | 0ms | `.kn-sk-i` | Wrapped grid, accessible tap targets | **Verified** |
| **GitHub Activity Calendar** | Hover on Cells | Contribution cells scale subtly on hover (`transform: scale(1.3)`); tooltip displays contribution count and date; discrete intensity levels (0 through 9) | 150ms | `ease-out` | 0ms | `.kn-cal-cell`, `.kn-cal-g` | Horizontal scrollable calendar on narrow viewports | **Verified** |
| **Contact Form Inputs** | Focus / Blur | Dashed outline transitions to active ivory border (`#e9e6df`); placeholder dims | 200ms | `ease` | 0ms | `.kn-form input`, `.kn-form textarea` | Full width inputs, standard virtual keyboard support | **Verified** |
| **Magnetic Submit Button** | Hover / Pointer proximity | Button smoothly pulls toward cursor coordinates within bounding proximity (`data-magnetic="10"`); inverts colors on hover (black text on ivory background) | Realtime RAF (~250ms settle) | Spring / Expo ease | 0ms | `.kn-form button[type="submit"]` | Magnetic pull disabled on touch devices; standard tap state active | **Verified** |
| **Interactive Crosshair Cursor** | Pointer Move & Hover | Follows mouse coordinates; on hover over links, buttons, inputs, and cards, expands from `+` to `+ [ ]` (`data-hit="1"`) | 200ms | `ease-out` | 0ms | `.kn-cur` | Hidden on touch devices (`@media (hover: none)`) | **Verified** |

---

## 3. Motion & Accessibility Constraints

1. **`prefers-reduced-motion: reduce`**:
   - All character scrambles and magnetic translations are disabled or simplified to instant state switches.
   - Keyframe opacity transitions run without stagger delay.
2. **Performance Constraints**:
   - Animations use hardware-accelerated CSS `transform` and `opacity`.
   - Layout-thrashing properties (`top`, `left`, `width`, `height`) are strictly avoided during scroll/hover transitions.
   - Event listeners are throttled via `requestAnimationFrame` and passive event bindings.
