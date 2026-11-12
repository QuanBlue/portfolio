# Production Data Integrity Audit & Remediation Matrix

Repository: [github.com/QuanBlue/portfolio](https://github.com/QuanBlue/portfolio)  
Production URL audited (read-only): `https://thanhquan.dev/`  
Audit Timestamp: 2026-11-11

---

## 1. Read-Only Production Audit Findings (`https://thanhquan.dev/`)

During a read-only Playwright inspection of `https://thanhquan.dev/` across `?preview=ascii`, `?preview=knight`, `?preview=editorial`, and `?preview=forkfolio`:

1. **Canonical Supabase Source (`portfolio_content`, `id=eq.main`)**:
   - Contained the uploaded portrait `https://ywjdrrmdnkdydeqprcib.supabase.co/storage/v1/object/public/portfolio/avatar/mwa5o1ui-bc6v67.jpg` (360×480), `appearance.activeTheme` / `identity.themeVariant: "knight"`, `identity.name: "Nguyễn Thanh Quân"`, `openToWork: true`, `cvUrl: "/cv.pdf"`, 1 experience (`Viettel Solutions`, `01/2024 - Present`), 2 education entries (`Master of Science - MS, Computer Science` and `Bachelor's degree, Information Technology` at `VNUHCM - University of Science`), `certifications: []`, 2 projects (`ansible-airgap-k8s`, `mern-portfolio`), and 7 skills (with empty `category` fields).
2. **Knight Avatar Meme Bug (Critical Data Integrity Defect)**:
   - `defaultPortfolioData.identity.avatar` in [src/data/portfolio.ts](../src/data/portfolio.ts) hardcoded the meme photo `mw95dpo2-xvsbsl.jpg`.
   - [src/themes/knight/sections/KnightHero.astro](../src/themes/knight/sections/KnightHero.astro) baked `[data-kn-fig].dataset.av` from build-time `portfolioData` (`mw95dpo2-xvsbsl.jpg`), and [src/themes/knight/scripts/knight-stage.ts](../src/themes/knight/scripts/knight-stage.ts) rasterized `dataset.av` before Supabase data resolved, rendering the meme ASCII portrait instead of `mwa5o1ui-bc6v67.jpg`.
   - [src/themes/core/data-adapter.ts](../src/themes/core/data-adapter.ts) also contained an external fallback to `https://avatars.githubusercontent.com/u/73626660?v=4&s=400`.
3. **Stale / Partially Reactive Sections Across Themes**:
   - On `https://thanhquan.dev/`, `KnightTheme` only bound `portfolio:data` inside `initKnightTheme()`, causing initial cold resolution (`resolving` → `knight`) and empty `certifications: []` vs build defaults (`Viettel`, `Tech Company XYZ`, `CKA`, `AWS`) to diverge.
   - `Forkfolio Modern Mono` and `Forkfolio ASCII` lacked dynamic `portfolio:data` re-renderers on Projects, Experience, Education, Certifications, Skills, Activity, and Hero prompt handles.
   - `LiveData.astro` skipped `#bind-education` updates when `d.education` was empty (`[]`), and `store.ts` in Supabase mode fell back to IndexedDB local drafts when remote data was absent.
   - `/cv` (`src/pages/cv.astro`) rendered only SSR build data and did not enforce client-side gating when runtime `careerSettings.openToWork` became `false`.
4. **Hardcoded Prose & Fabricated Metrics**:
   - `Ascii`, `Editorial`, and `Forkfolio` Hero/About sections hardcoded `@ Viettel`, `Viettel Group`, static narrative bios ignoring `identity.bio`, 4 static skill architecture boxes (`Jenkins CI/CD`, `Trivy + SBOM + Cosign`, `Keepalived (VRRP)`, etc.), fake throughput (`2,489 reqs/min`), fake SLA claims (`99.9% Zero-Downtime` / `Zero SPOF`), and fake commit heatmaps (`1,680` / `Aug 21, 2026`) even when no Activity integration was configured.
   - `admin.astro` declared `openToWork` with `type: 'boolean'` instead of `'bool'` (omitting the toggle checkbox), did not bump `avatarUpdatedAt`, and injected `defaultPortfolioData.education` / `certifications` when missing.

---

## 2. Persistence & Source Precedence Architecture

| Priority | Condition | Source Used | Runtime Location |
| :--- | :--- | :--- | :--- |
| **1 (Public Prod)** | `isSupabaseConfigured === true` & record exists | Supabase `portfolio_content` (`id='main'`) overlaid onto `defaultPortfolioData` via `mergePortfolioData` | [src/lib/supabase.ts](../src/lib/supabase.ts), [src/lib/store.ts](../src/lib/store.ts) |
| **2 (Public Prod Fallback)** | `isSupabaseConfigured === true` & no remote row | Build-time `portfolioData` (`src/data/content.json` optional + `defaultPortfolioData`); **never** pulls local IndexedDB drafts | [src/lib/store.ts](../src/lib/store.ts) |
| **1 (Local Dev Mode)** | `isSupabaseConfigured === false` & IndexedDB populated | IndexedDB (`portfolio-cms` / `kv` / `content`) saved by `/admin` overlaid via `mergePortfolioData` | [src/lib/store.ts](../src/lib/store.ts) |
| **2 (Local Build Default)** | `isSupabaseConfigured === false` & empty IndexedDB | Build-time `portfolioData` (`defaultPortfolioData`) | [src/data/portfolio.ts](../src/data/portfolio.ts) |
| **Theme Selection** | Public landing `/` | Priority: `?preview=` / `?theme=` → Supabase `appearance.activeTheme` / `identity.themeVariant` → cached `localStorage` → `'resolving'` until `LiveData` completes | [src/layouts/BaseLayout.astro](../src/layouts/BaseLayout.astro), [src/pages/index.astro](../src/pages/index.astro) |

---

## 3. Canonical Field-to-Source Matrix

| Field / Section | Owner | Admin Control ([src/pages/admin.astro](../src/pages/admin.astro)) | Persistence & Merge ([src/data/portfolio.ts](../src/data/portfolio.ts)) | Adapter / Renderer | Theme Consumers | Empty / Missing Fallback | EN / VI Support |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `identity.avatar` & `avatarUpdatedAt` | `Identity` | Image upload / Remove (`data-upload="identity.avatar"` bumps `avatarUpdatedAt`) | `resolveAvatarUrl()` (HTTP + `?v=` revision or `data:image/`, blocks unsafe schemes) | `getKnightProfile`, `renderAvatar`, `renderAsciiAvatarImgOrFallback` | Knight (`[data-kn-fig].dataset.av`), ASCII (`#ascii-avatar-media-slot`), Editorial (`#bind-avatar`), Forkfolio (`#bind-avatar-forkfolio`) | Empty `''` → Initials/monogram fallback (`initials(name)`) | Shared |
| `identity.name`, `role`, `bio`, `location`, `node` | `Identity` | Text / Textarea + bilingual toggle | `mergePortfolioData` | `localizePortfolioData`, `splitTitleIntoLines`, `buildAsciiBannerText` | `LiveData`, `KnightTheme`, `ascii-live`, `forkfolio-live`, `Editorial`, `/cv` | Build default text; company omitted when `experience` empty | Yes (`*_vi`) |
| `identity.email`, `github`, `linkedin`, `youtube` | `Identity` | Text inputs | `mergePortfolioData`, `safeUrl()` | `LiveData`, theme renderers, `getKnightProfile` | All 4 themes, `ProjectModal`, `CvModal`, `/cv` | `#` for unsafe/empty URLs | Shared |
| `careerSettings` (`openToWork`, `cvUrl`) | `CareerSettings` | PDF Upload / URL + `type: 'bool'` checkbox (`syncCareerSettings`) | Synced across `careerSettings` & `identity`; `''` preserved as hidden | `getCareerSettings()`, `renderCvSheetHtml` | `[data-career-badge]`, `[data-cv-gate]`, `ForkfolioNav`, `CvModal`, `/cv` | `openToWork: false` or empty `cvUrl` hides CV CTAs & locks `/cv` (`403`) | Yes |
| `appearance.activeTheme` | `AppearanceConfig` | Appearance cards (`[data-select-theme]`) | Synced with `identity.themeVariant`; saved to remote / IndexedDB | `resolveTheme`, `resolveClientTheme` | `BaseLayout`, `index.astro`, header theme cycle | Wait cleanly in `'resolving'` until `LiveData` resolves; safety timeout `'ascii'` | Shared |
| `projects` | `Project[]` | List editor CRUD + media upload | `pickList`: preserves `[]` | `getKnightProjects`, `getKnightMoreProjects`, `renderProjects`, `renderAsciiProjectsHtml`, `renderForkfolioProjectsHtml` | All 4 themes, `ForkfolioAdditionalProjects` (`> 4`), `ProjectModal` (delegated trigger) | `[ No published projects ]` / hides More Projects tab & section | Yes (`*_vi`) |
| `experience` | `ExperienceItem[]` | List editor CRUD | `pickList`: preserves `[]` | `renderExperience`, `renderKnightExperience`, `renderAsciiExperienceHtml`, `renderForkfolioExperienceHtml` | All 4 themes, Hero `@ company` badge, About specs, `/cv` | `[ No published experience ]` / hides Hero `@ company` | Yes (`*_vi`) |
| `education` | `EducationItem[]` | List editor CRUD | `pickList`: preserves `[]` | `renderEducation`, `renderKnightEducation`, `renderAsciiEducationHtml`, `renderForkfolioEducationHtml` | All 4 themes, `LiveData` (`#bind-education` always updated), `/cv` | `[ No published education ]` | Yes (`*_vi`) |
| `certifications` | `Certification[]` | List editor CRUD | `pickList`: preserves `[]` | `renderCerts`, `renderKnightCertifications`, `renderAsciiCertificationsHtml`, `renderForkfolioCertificationsHtml` | Editorial (`CertificationsSection`), Knight, ASCII (`#education`), Forkfolio, `/cv` | `[ No published certifications ]` | Yes (`*_vi`) |
| `skills` | `Skill[]` | List editor CRUD | `pickList`: preserves `[]` | `groupSkillsByCategory`, `renderSkills`, `renderKnightSkills`, `renderAsciiSkillGroupsHtml`, `renderForkfolioSkillsHtml` | All 4 themes + terminal `skills` command | `[ No published skills ]` / `EMPTY` status | Yes (`category_vi`) |
| `activity` | `ActivityConfig` | Admin `activity` object section (`enabled`, `username`, `fetchedAt`, `days` JSON) | `resolvePortfolioActivity()`: opt-out -> Admin `days` -> verified `@QuanBlue` snapshot if username matches -> `unavailable` | `normalizeContributionDataset`, `computeActivitySummary`, `renderKnightActivity`, `renderAsciiActivityHtml`, `renderForkfolioActivityHtml` | Knight, ASCII, Forkfolio | Honest unavailable panel with GitHub link & zero fabricated counts | Yes (`en` / `vi`, `@username` preserved) |

---

## 4. Removed Hardcoded & Fabricated Items

- **Meme & Demo Avatars Removed**:
  - Removed `mw95dpo2-xvsbsl.jpg` from [src/data/portfolio.ts](../src/data/portfolio.ts) (`defaultPortfolioData.identity.avatar = ''`).
  - Removed `https://avatars.githubusercontent.com/u/73626660?v=4&s=400` from [src/themes/core/data-adapter.ts](../src/themes/core/data-adapter.ts).
- **Hardcoded Employer / Bio / Architecture Claims Removed**:
  - Removed hardcoded `@ Viettel`, `Viettel Group`, hardcoded Vietnamese bios, `Bare-metal / Multi-zone HA`, `HAProxy/Keepalived`, `Trivy + SBOM + Cosign`, and `99.9% Zero-Downtime` / `Zero SPOF` claims from [Hero.astro](../src/components/sections/Hero.astro), [AboutSection.astro](../src/components/sections/AboutSection.astro), [AsciiHero.astro](../src/components/ascii/AsciiHero.astro), [AsciiAbout.astro](../src/components/ascii/AsciiAbout.astro), [ForkfolioHero.astro](../src/components/forkfolio/ForkfolioHero.astro), and [ForkfolioAbout.astro](../src/components/forkfolio/ForkfolioAbout.astro).
- **Hardcoded Skill Layer Boxes Replaced**:
  - Replaced hardcoded 4-layer static cards (`Jenkins CI/CD`, `Grafana`, `Keepalived (VRRP)`, etc.) and fake `ALL GREEN` badges in [SkillsSection.astro](../src/components/sections/SkillsSection.astro), [AsciiSkills.astro](../src/components/ascii/AsciiSkills.astro), and [ForkfolioSkills.astro](../src/components/forkfolio/ForkfolioSkills.astro) with dynamic `groupSkillsByCategory(skills, locale)` output.
- **Fabricated Telemetry & Command Output Removed**:
  - Replaced `2,489 reqs/min`, `48 Kernel Pods`, `145ms trace #req-a7f8b9`, `-70% Provision Time`, `100% Offline Ready`, unconfigured `1,680` / `Aug 21, 2026` heatmaps, hardcoded `github.com/QuanBlue/{title}` plates, `ok=24 changed=3`, `18 passed`, and static `ntquan@devops-engineer` `Uptime: 99.9% SLA Online` in `render.ts`, `AsciiActivity.astro`, `ForkfolioActivity.astro`, `KnightActivity.astro`, `ForkfolioProjects.astro`, `ForkfolioFooter.astro`, and `terminal-engine.ts`.
- **Canonical Links & Static Asset Fixes**:
  - Replaced `https://quanblue.netlify.app/` in `renderCvSheetHtml` with `https://thanhquan.dev/`.
  - Updated `ForkfolioNav` `[ cv.pdf ]` action to open `CvModal` when using the built-in `/cv.pdf` route (preventing 404s on static hosting where `public/cv.pdf` does not exist) and updated `/cv` (`src/pages/cv.astro`) to react dynamically to runtime `portfolio:data` and enforce 403 restriction client-side.

---

## 5. GitHub Activity Pipeline & Stacking Architecture (Updated)

### Verified Data Pipeline
- **Build/CI Sync Script**: [scripts/sync-github-activity.mjs](../scripts/sync-github-activity.mjs) (`npm run sync:activity`, wired into [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) with `--keep-existing`) resolves `identity.github`, queries the GitHub GraphQL API when `GITHUB_TOKEN` is set in CI/env or falls back to the public contribution calendar markup, filters out any dates beyond `todayUtc`, verifies the daily total matches the sum of `days`, and writes [src/data/github-activity.snapshot.json](../src/data/github-activity.snapshot.json). No credentials or tokens are ever bundled into `dist/`.
- **Snapshot Baseline (`@QuanBlue`)**: Schema v1 (`2025-11-09` → `2026-11-11`, `368` calendar days, verified sum `1,696`, busiest day `124` on `2026-08-21`).
- **Normalized Engine**: [src/lib/github-activity.ts](../src/lib/github-activity.ts) provides strict UTC calendar validation (`parseUtcIsoDate` with leap-year checks), future-date clamping, Sunday..Saturday week alignment (`null` boundary slots), month-column placement, and single-source summary derivation (`computeActivitySummary`).
- **Strict Precedence (`resolvePortfolioActivity`)**:
  1. `activity.enabled === false` -> `{ available: false, reason: 'disabled' }`.
  2. Empty `identity.github` -> `{ available: false, reason: 'no-account' }`.
  3. Admin/Supabase `activity.days` array -> validates matching `username`, normalizes & recomputes stats from `days` only (`[]` -> `'empty'`).
  4. Build snapshot (`github-activity.snapshot.json`) -> used **only** when `snapshot.username` matches `identity.github` (case-insensitive); otherwise returns `{ available: false, reason: 'account-mismatch' }` without leaking QuanBlue metrics.

### Knight Rendering & Layer Isolation
- **CSS Grid Heatmap**: [src/themes/core/render-knight.ts](../src/themes/core/render-knight.ts) renders `.kn-cal-board` (`grid-template-columns: 30px repeat(var(--weeks), var(--kn-cell))`), positioning month labels inside the same column grid (`--col`), lining up `<button class="kn-cal-cell">` cells across exact 7 weekday rows (`Sun..Sat`) and horizontal mobile scroll container `.kn-cal-scroll`.
- **Stage Occlusion & Removal of Canvas Heatmap Duplicate**: [src/themes/knight/scripts/knight-stage.ts](../src/themes/knight/scripts/knight-stage.ts) no longer rasterizes `[data-kn-cal]` (`tj`) or overwrites `.kn-cal-m` positions, and [src/themes/core/render-knight.ts](../src/themes/core/render-knight.ts) no longer attaches `data-kn-r="figs"` to `<dl class="kn-figs">` (preventing wipe masks and trailing numeric noise over stats). `.kn-act-frame` sets `data-kn-occ="strict"`, which adds padded exclusion boxes (`tStrictDocs` -> `headObs`) blocking ASCII stars (`tJ`), wind streaks, and planet (`tf`) particles from overlapping the Activity frame across all scroll offsets.
- **Interactive Tooltips**: [src/themes/knight/scripts/interactions.ts](../src/themes/knight/scripts/interactions.ts) uses delegated hover/focus/Escape handlers reading each cell's real `data-date` and `data-count` into `.kn-tooltip` (`z-index: 120`) clamped inside the viewport.
