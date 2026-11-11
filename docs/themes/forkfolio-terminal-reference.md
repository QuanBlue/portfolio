# Live Reference Inspection: Forkfolio Terminal Experience

- **Target Reference**: https://quanblue.forkfolio.dev/
- **Local Application Target**: `❖ Forkfolio Modern Mono` (`http://localhost:4321/?preview=forkfolio`)
- **Inspection Date**: 2026-11-11
- **Inspection Tool**: Playwright Headless Chromium Engine, DOM & CSS Inspector

---

## 1. Summary of Observed Terminal Interactions

The updated `quanblue.forkfolio.dev` reference presents a cohesive, continuous developer terminal session that unfolds as the user scrolls. Rather than static text or arbitrary terminal decorations, content sections are structured as prompt commands followed by structured terminal output.

---

## 2. Interaction Breakdown

### 2.1 Initial Page Loading & Terminal Session Startup
- **Visual Trigger**: Page initialization / DOMContentLoaded.
- **Observed Elements**:
  - `[ OK ] Loaded profile quanblue`
  - `[ OK ] Started session quanblue@portfolio`
- **Timing**:
  - Line 1 stagger delay: ~120 ms.
  - Line 2 stagger delay: ~270 ms.
  - Duration: instantaneous render per line (~10 ms reveal).
- **Easing**: Linear step reveal.
- **Replay Behavior**: Does not replay when scrolling back to top or switching locales.
- **Reduced Motion**: Rendered immediately with zero delay.

### 2.2 Hero Animation & Command Typing (`whoami`)
- **Trigger**: Immediately follows session initialization.
- **Command Sequence**:
  - Prompt: `quan@portfolio:~$ whoami`
  - Typing speed: ~30–40 ms per character.
  - Cursor behavior: Emerald block cursor (`0.6em × 1.1em`), solid while typing, blinks at ~750 ms cycle (`step-end`) on pause/completion.
  - Output Delay: ~180 ms after typing completes.
  - Output Reveal: Name (`Nguyễn Thanh Quân`), title (`DevOps Engineer`), summary, and metadata tags reveal with subtle vertical slide/fade (~200 ms).
  - Secondary command: `ls -t ~/projects | head -3` reveals quick links to primary projects.
- **Mobile Behavior**: Single-column view, command wraps neatly without clipping, cursor stays inline.

### 2.3 Section Reveal & Navigation Commands
Each section transition in the reference is introduced by a contextual shell command:
- **About**: `cat ~/about.md` or `whoami --spec`
- **Projects**: `ls ~/projects`
- **More Work / Repositories**: `ls -la ~/src`
- **Skills**: `brew bundle`
- **Activity**: `git log --since=1.year --stat`
- **Contact**: `mail quanblue` followed by `cat ~/.links`
- **Footer**: `exit` ➔ `logout` ➔ `[Process completed]`

- **Scroll Trigger**: IntersectionObserver when section enters ~20% of viewport.
- **Execution Mode**: Triggered once per section. Text and output remain locked and visible once animated; they do not disappear or re-type on backward scrolling.

### 2.4 Project Command Sequences & Installation Simulations
- **Observed Commands**:
  - Project Title Command: e.g. `cat Project/README.md`
  - Installation Simulation:
    - JavaScript / Node: `npm install -g github:QuanBlue/mern-portfolio`
    - Python: `pip install git+https://github.com/QuanBlue/s3-bucket-crud-library`
    - DevOps / Ansible: `ansible-playbook -i inventory deploy.yml`
  - Terminal Progress Indicator:
    - Segmented progress: `[############------] 72%`
    - Status message: `reify:mern-portfolio added 1 package` / `PLAY RECAP: ok=12 changed=4`
- **Timing**:
  - Command types at 28–35 ms/char.
  - Progress bar animates over 450–700 ms (`cubic-bezier(0.2, 0.8, 0.2, 1)`).
  - Completion line appears 120 ms after progress bar fills.

### 2.5 Skills Presentation (`brew bundle`)
- **Trigger**: Scroll into view.
- **Command**: `brew bundle`
- **Output**:
  - Header: `[3] ~/skills — 12 installed`
  - Categories output like package receipts:
    - `[ CLOUD & INFRASTRUCTURE ]`
    - `✓ Kubernetes`
    - `✓ Docker`
    - `✓ Istio`
- **Timing**: Staggered line reveal (~50 ms per category block).

### 2.6 Activity Presentation (`git log --since=1.year --stat`)
- **Trigger**: Scroll into view.
- **Command**: `git log --since=1.year --stat`
- **Output**:
  - Heatmap matrix (52 weeks) and commit statistics (`1,680 contributions in the last year`, `111 active days`, `longest streak: 26 days`).

### 2.7 Contact & Footer Sequence (`mail` & `exit`)
- **Contact**:
  - Command: `mail quanblue`
  - Form rendered as interactive message composer.
  - Secondary command: `cat ~/.links` reveals GitHub, LinkedIn, and direct contact avenues.
- **Footer**:
  - Command: `exit`
  - Output sequence:
    1. `logout`
    2. `Saving session...`
    3. `...saving history: 12 commands`
    4. `...completed.`
    5. `[Process completed]`

---

## 3. Adaptation Strategy for Modern Mono

1. **Color Preservation**: All terminal prompts, syntax tokens, and progress bars strictly use Modern Mono's emerald accent (`#10B981` / `var(--signal)`), zinc background (`#09090B` / `var(--bg)`), zinc borders (`#27272A` / `var(--border)`), and zinc muted text (`#A1A1AA` / `var(--muted-fg)`).
2. **Accessible & Responsive Architecture**:
   - Semantic HTML elements (`<section>`, `<article>`, `<nav>`, `<h1>`–`<h3>`, `<ul>`, `<table>`).
   - Terminal commands are presentation wrappers; all textual data is indexable and accessible.
   - Reduced-motion mode (`prefers-reduced-motion: reduce`) displays all commands and outputs immediately with no delays.
3. **Reusable Modular Engine**:
   - Centralized `terminal-typing.ts` and `terminal-sequence.ts` to coordinate typing, cursor, and progress animations across all sections.
   - Zero duplicated timers or conflicting requestAnimationFrame loops.
