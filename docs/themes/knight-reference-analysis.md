# Knight Theme — Reference Design Analysis & Design System Specification

## 1. Executive Summary & Context

- **Theme Name**: Knight
- **Reference URL**: `https://quanblue.forkfolio.dev/`
- **Target Repository**: `https://github.com/QuanBlue/portfolio`
- **Production URL**: `https://thanhquan.dev/`
- **Core Principle**: Completely independent design system with zero visual inheritance from existing terminal neon, DevOps dashboard panels, or ASCII cyber-banners.

The Knight theme reproduces the high-fidelity, minimalist developer portfolio demonstrated on `forkfolio.dev`. It presents a brutalist yet deeply refined editorial style centered on high-contrast monospace typography (`Martian Mono` and `IBM Plex Mono`), procedural character plate covers, responsive GitHub contribution heatmaps, and clean typographic tables with dashed hairline dividers.

---

## 2. Token & Color Palette Specification

The authentic color system extracted directly from the reference stylesheet (`https://quanblue.forkfolio.dev/`):

| Token | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| `--bg` | `#0a0a0c` | Deep matte obsidian background (not pure #000, avoiding harsh OLED smear) |
| `--ink` | `#e9e6df` | Warm ivory paper foreground, primary text and headings |
| `--dim` | `#8b877e` | Subdued stone gray for metadata, labels, and indicators |
| `--mute` | `#5d5a53` | Dashed border lines, inactive states, placeholder text |
| `--soft` | `#bdb9af` | Secondary body text, bio narratives |
| `--gut` | `48px` (desktop) / `16px` (mobile) | Viewport gutter padding |
| `--cw` | `4.8px` (desktop) / `6px` (mobile) | Character width metric for monospace grid calculations |
| `--lh` | `7.6px` (desktop) / `9.5px` (mobile) | Line height metric for monospace grid calculations |

### Text Selection & Global Modifiers
```css
.kn ::selection {
  color: #0a0a0c;
  background: #e9e6df;
}
.kn a:focus-visible {
  outline: 1px dashed var(--ink);
  outline-offset: 4px;
}
```

---

## 3. Typography Architecture

Knight relies on two distinct monospace typefaces loaded via Google Fonts:

1. **Martian Mono** (`--kn-mart`):
   - Weights: 800 (Extra Bold), 600, 500
   - Letter-spacing: `-0.04em`
   - Usage: Massive responsive ASCII headings (`.kn-asc`), section titles (`About`, `Projects`, `More projects`, `Skills`, `Activity`, `Let's talk.`), and plate cover monogram badges.
   - Dynamic formula:
     $$\text{--fs} = \min(\text{--fmax}, \frac{\text{--avail}}{\text{--k}})$$
     Ensures typography scales fluidly to viewport boundaries without clipping or wrapping unintentionally.

2. **IBM Plex Mono** (`--kn-plex`):
   - Weights: 400 (Regular), 500 (Medium)
   - Line-height: `1.6`
   - Usage: Top navigation bar, bio narrative, project metadata, links, input forms, and footer.

---

## 4. Component & Section Hierarchy

### 4.1. Navigation (`KnightNav.astro` / `.kn-nav`)
- **Position**: Fixed top, `z-index: 50`.
- **Background**: Soft top-down gradient fade:
  `linear-gradient(#0a0a0c 0 62%, #0a0a0cb3 80%, #0a0a0c00 100%)`.
- **Desktop Layout**: Flex row between brand identity (`nguyen.thanh.quan`) and section links (`about / projects / skills / contact`).
- **Mobile Layout**: Hides links list; displays active section name on right (`.kn-nav-here`).

### 4.2. Hero (`KnightHero.astro` / `.kn-hero`)
- **Height**: Full viewport height (`100svh`, min `560px`).
- **Left Column** (`.kn-hero-txt`):
  - Stacked giant heading: `NGUYEN` / `THANH` / `QUAN` (`.kn-name`, `fmax: 128px`).
  - Role subtitle (`.kn-role`): `Python, Shell and HTML`.
- **Right Column** (`.kn-fig`):
  - Aspect ratio: `0.83`, height `min(84vh, 66vw)`.
  - Silhouette / avatar image masked with radial gradient `radial-gradient(closest-side, #000 70%, #0000 100%)`, contrast 1.1, brightness 0.7.

### 4.3. About (`KnightAbout.astro` / `.kn-about`)
- **Padding**: `30vh var(--gut) 16vh`.
- **Heading**: `About` (`.kn-asc`, `--kd: 3.360`).
- **Lead Text** (`.kn-lead`): `24 public repositories on GitHub, written in Python, Shell and HTML.`
- **Bio Narrative** (`.kn-more-bio`): Extended narrative from portfolio data.
- **Fact Matrix** (`.kn-facts`): Grid definition list with dotted leaders (`content: " ....."`).

### 4.4. Featured Projects (`KnightProjects.astro` / `.kn-pj`)
- **6 Featured Projects** in alternating two-column layouts:
  - Odd projects: Text on left, Plate Cover on right (`.kn-p`).
  - Even projects: Text on right, Plate Cover on left (`.kn-p.is-flip`).
- **Elements**:
  - Index label: `01 / 06` (`.kn-idx`, `letter-spacing: 0.04em`).
  - Title: Scaled monospace headline (`.kn-pn`).
  - Description: Crisp muted copy (`.kn-desc`).
  - Metadata: `[Language] · [N] stars · [ github.com/... ]` bracket links (`.kn-br`).
  - Plate Cover (`.kn-plate`): Aspect ratio `1.42`, dashed border (`#3d3b37`), bold monogram mark (e.g. `MP`, `SB`, `UD`, `CG`, `WH`, `DE`) with procedural character textures.

### 4.5. More Projects (`KnightMoreWork.astro` / `.kn-more`)
- **Heading**: `More projects`.
- **Table List** (`.kn-list`):
  - Grid rows with dashed hairline divider pseudo-element (`content: "- - - - ..."`).
  - Columns: Project Name, Star Count / Language, Repo link `[ repo ]`, and full-width description below.

### 4.6. Skills (`KnightSkills.astro` / `.kn-sk`)
- Monospace category rows: `Languages` and `Infrastructure`.
- Horizontal wrap list (`.kn-sk-l`) with opacity hover states (`rgba(233, 230, 223, calc(0.38 + 0.62 * var(--lit)))`).

### 4.7. Activity (`KnightActivity.astro` / `.kn-act`)
- **Commit Heatmap** (`.kn-cal`):
  - Full 53-week timeline covering past 365 days.
  - Month indicator markers with proportional column offsets (`Dec`, `Jan`, ..., `Nov`).
  - Contribution blocks with discrete intensity levels (0 through 9).
- **Statistics Summary** (`.kn-figs`):
  - `contributions`: `1,680`
  - `active days`: `111`
  - `longest streak`: `26 days`
  - `busiest day`: `124 on Aug 21, 2026`

### 4.8. Contact & Footer (`KnightContact.astro` / `.kn-end`)
- Eyebrow: `Write to Nguyen`.
- Headline: `Let's talk.` (`.kn-asc.kn-talk`).
- External profile links: `github · linkedin · email`.
- Monospace Form: Dashed bordered inputs (`border-dashed border-[#5d5a53]`), zero border radius, pure ivory focus ring.
- Footer: Monospace copyright notice with interactive expanding ASCII crosshair cursor (`+ [ ]`).

---

## 5. Non-Inheritance Guarantee

The Knight theme **explicitly does not inherit**:
1. ASCII banner art from `AsciiTheme.astro` (no Figlet, Slant, or Cyber typewriter banners).
2. DevOps status widgets (no APM traces, latency charts, SLA progress bars, or cluster nodes).
3. 3D Book-open timeline mechanics from `EditorialTheme.astro`.
4. Scanline overlays or CRT flickering effects.
5. Glow/neon emerald borders or gradient shadow boxes.
6. Header bar with light/dark toggle button (Knight runs its own isolated fullscreen dark aesthetic).
