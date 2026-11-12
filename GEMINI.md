# ENGINEERING RULES — PORTFOLIO PROJECT

Repository: https://github.com/QuanBlue/portfolio

## 1. SCOPED CHANGES — MANDATORY

Only modify code directly related to the user's requested task.

- Do not refactor unrelated components.
- Do not redesign existing UI without explicit permission.
- Do not rewrite working implementations unnecessarily.
- Do not modify global CSS unless strictly required.
- Do not change shared utilities without checking all consumers.
- Prefer minimal, isolated changes over large rewrites.

**A fix for one component must never break another component.**

## 2. PRESERVE WORKING FEATURES

The following are protected features:

- Knight ASCII Hero, typography and portrait.
- ASCII particles and perspective ground.
- ASCII planet with 60-second rotation.
- ASCII project artwork and animations.
- Experience and Education timelines.
- Independent Certifications section.
- Skills Grouped Terminal Modules.
- Skills ASCII Signal Field.
- Smooth scrolling and header navigation.
- EN/VI localization.
- Admin theme switching.
- Shared Supabase database integration.
- Blog and Interactive Terminal.
- Existing portfolio themes.

Do not remove, replace or simplify these features unless explicitly requested.

## 3. MANDATORY REGRESSION TESTING

After EVERY code modification:

1. Run relevant unit tests.
2. Run TypeScript/build checks.
3. Verify the modified component in a real browser.
4. Verify related shared components.
5. Check browser console errors.
6. Check desktop and mobile rendering.

For UI changes, compare screenshots before and after implementation.

Do not consider successful compilation proof of visual correctness.

## 4. CHANGE IMPACT ANALYSIS

Before editing, identify:

- Files that need modification.
- Shared dependencies.
- Components affected by the change.
- Potential regression risks.

If changes affect shared styling, theme resolution, animation lifecycle or the data layer, validate every dependent theme.

## 5. NO SILENT FALLBACKS

Do not silently replace working visual effects with simplified implementations.

Examples of forbidden regressions:

- ASCII typography becoming ordinary bold text.
- ASCII portrait becoming a raster/GIF image.
- Animated planet disappearing.
- Background effects being removed.
- Database content replaced with hardcoded data.
- EN/VI switching failing.

Fallbacks for accessibility or unsupported environments are acceptable, but must not replace the intended experience under normal conditions.

## 6. DATA INTEGRITY

Supabase and the existing published content workflow remain the source of truth.

- Do not fabricate portfolio content.
- Do not automatically discover GitHub projects.
- Do not duplicate portfolio data by theme.
- Do not modify database schemas without a clear reason.
- Preserve existing content and backward compatibility.
- Never expose privileged credentials.

## 7. GIT SAFETY

Before implementation, inspect:

```bash
git status
git diff
```

Do not run destructive Git commands without explicit authorization.

Never discard unrelated uncommitted changes.

Do not automatically push, deploy or modify production settings.

## 8. DEFINITION OF DONE

A task is complete only when:

- The requested behavior works.
- Existing protected features still work.
- No unrelated visual regressions occur.
- Tests and build pass.
- Browser validation is completed where available.
- Modified files and verification results are reported.

If testing tools are unavailable, clearly state what was not verified.

**FINAL RULE: Prefer a small correct change over a large unnecessary refactor. Never sacrifice existing working functionality to implement a new feature.**



## CONSOLE DESIGN CONSISTENCY — FORKFOLIO THEME

When working on the Forkfolio Modern Mono theme:

- The entire interface must maintain a coherent terminal/console visual language.
- Never introduce generic dashboard cards, floating panels, or inconsistent typography into the console content.
- Prefer terminal-native elements: prompts, stdout, structured listings, logs, tables, separators, and inline actions.
- All console content must use the theme's shared monospaced font and typography tokens.
- The outer terminal shell must remain unified and must not contain nested fake terminal windows.
- Any new feature must adapt its presentation to the console design without changing shared business logic.
- Preserve the existing emerald/zinc palette, header chrome, scroll progress bar, and global theme isolation.
- Before completing a UI change, visually verify that the modified section still looks like part of the same terminal session.

**Design invariant: One shell, one session, one typography system, one visual language.**



## REPOSITORY HYGIENE & TEMPORARY ARTIFACTS

- Never create temporary screenshots, browser captures, logs, JSON inspection output or one-off debugging files in the repository root.
- All temporary artifacts MUST be stored under `tmp/`.
- The entire `tmp/` directory MUST be Git-ignored.
- Permanent test source code belongs in `tests/`.
- Permanent automation tools belong in `scripts/`.
- Maintained documentation belongs in `docs/`.
- Never commit generated temporary artifacts.
- Before completing a task, review `git status --short`.
- Move accidental root-level temporary files to `tmp/`.
- Do not delete or overwrite existing user files without verifying their purpose.
- Do not use destructive cleanup commands.
- Do not stage or commit unrelated files.

**RULE: Temporary artifacts belong in `tmp/`, never in the repository root.**



## BROWSER SESSION SAFETY

- Never reload, navigate or close user-owned browser tabs.
- Never control an existing personal Chrome session.
- Use isolated browser contexts for all automated tests.
- Never accept beforeunload confirmations on user-owned pages.
- Never discard unsaved Admin changes.
- Never clear user browser storage.
- Never repeatedly reload pages as a debugging technique.
- Prefer dev-server HMR and focused tests.
- Keep browser test artifacts under Git-ignored `tmp/`.
- If browser ownership cannot be reliably determined, do not interact with that tab.
- Do not modify production data during browser tests.

**RULE: User browser sessions are protected. Automation must use its own isolated browser.**

## DATA VISUALIZATION INTEGRITY

- Data visualizations must always be readable and accurate.
- Decorative effects must never overlap charts, statistics or interactive controls.
- All displayed metrics must originate from verified data sources.
- Never fabricate statistics to fill empty visualizations.
- Heatmaps and summary metrics must use the same reporting period and normalized dataset.
- External activity data must use explicitly configured integrations.
- If data is unavailable, show an honest unavailable state instead of sample data.
- Before completing a visualization change, verify both rendering correctness and data correctness.

**RULE: Visual effects may enhance data presentation, but must never compromise readability or factual accuracy.**

---

### ADMIN-ONLY THEME MANAGEMENT

- Public portfolio pages must never render theme-switching UI.
- Only authenticated, authorized administrators may manage themes.
- Theme selection, preview and publication belong in Admin → Appearance.
- Every new theme must obey this restriction by default.
- Light/Dark switching and EN/VI switching remain public features.
- All registered themes must be checked for forbidden public theme-switch controls after any header/navigation change.
- Hiding a control with CSS is not sufficient.
- Never reintroduce a public theme selector.

**INVARIANT: Public visitors consume the published theme; only authorized Admin users manage themes.**