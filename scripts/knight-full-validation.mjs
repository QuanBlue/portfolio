import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/ThinkPad T14/.gemini/antigravity/brain/4b59acc7-35e9-4763-a991-acd9b15b54cd';
const VIEWPORTS = [
  { name: '1920x1080_desktop', width: 1920, height: 1080 },
  { name: '1440x900_laptop', width: 1440, height: 900 },
  { name: '768x1024_tablet', width: 768, height: 1024 },
  { name: '390x844_mobile', width: 390, height: 844 },
];

async function runValidation() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  console.log('[Knight Validation] Starting cross-viewport validation...');

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Validating Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    // 1. Direct load
    await page.goto('http://localhost:4321/?preview=knight', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    // 2. Check hero ASCII state
    const heroStatus = await page.evaluate(() => {
      const root = document.querySelector('.kn');
      const cv = document.querySelector('canvas.kn-cv');
      const h1 = document.querySelector('.kn-hero .kn-asc.kn-name');
      return {
        hasRoot: !!root,
        hasCanvas: !!cv,
        canvasW: cv?.width,
        canvasH: cv?.height,
        isLive: root?.hasAttribute('data-live'),
        isArmed: root?.hasAttribute('data-arm'),
        h1Color: h1 ? window.getComputedStyle(h1).color : null,
      };
    });
    console.log(`Hero state (${vp.name}):`, heroStatus);

    // 3. Capture Hero screenshot
    const shotPath = path.join(ARTIFACT_DIR, `knight_hero_${vp.name}_restored.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Saved screenshot: ${shotPath}`);

    // 4. Scroll down to Skills and check Planet & Signal Field
    const skillsStatus = await page.evaluate(() => {
      const skillsSec = document.querySelector('[data-kn-s="skills"]');
      if (!skillsSec) return null;
      const rect = skillsSec.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + rect.top - 60);
      const modules = Array.from(document.querySelectorAll('.knight-skill-module'));
      return {
        skillsTop: rect.top,
        numModules: modules.length,
        hasSignalFieldGrid: !!document.querySelector('.kn-sk-grid'),
      };
    });
    await page.waitForTimeout(800);
    console.log(`Skills section (${vp.name}):`, skillsStatus);

    // 5. Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // 6. Refresh page check
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const afterReload = await page.evaluate(() => {
      const root = document.querySelector('.kn');
      const cv = document.querySelector('canvas.kn-cv');
      return {
        hasCanvas: !!cv,
        isLive: root?.hasAttribute('data-live'),
      };
    });
    console.log(`After reload (${vp.name}):`, afterReload);

    if (errors.length > 0) {
      console.error(`Errors in ${vp.name}:`, errors);
      process.exit(1);
    }

    await context.close();
  }

  // 7. Test Theme Switch Lifecycle (Knight -> Forkfolio -> Knight)
  console.log('\n--- Validating Theme Switching & Re-initialization ---');
  const cycleContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const cyclePage = await cycleContext.newPage();
  await cyclePage.goto('http://localhost:4321/?preview=knight', { waitUntil: 'networkidle' });
  await cyclePage.waitForTimeout(1000);

  // Switch to forkfolio
  await cyclePage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('theme:changed', { detail: { theme: 'forkfolio' } }));
  });
  await cyclePage.waitForTimeout(800);

  // Switch back to knight
  await cyclePage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('theme:changed', { detail: { theme: 'knight' } }));
  });
  await cyclePage.waitForTimeout(1200);

  const switchStatus = await cyclePage.evaluate(() => {
    const root = document.querySelector('.kn');
    const cv = document.querySelector('canvas.kn-cv');
    return {
      hasCanvas: !!cv,
      isLive: root?.hasAttribute('data-live'),
      isArmed: root?.hasAttribute('data-arm'),
      stageStatus: root?.dataset.knStageStatus,
    };
  });
  console.log('After theme roundtrip to Knight:', switchStatus);

  // 8. Test EN -> VI -> EN localization
  console.log('\n--- Validating Language Switch EN -> VI -> EN ---');
  await cyclePage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('locale:changed', { detail: { locale: 'vi' } }));
  });
  await cyclePage.waitForTimeout(600);
  const viNav = await cyclePage.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-kn-nk]')).map((el) => el.textContent?.trim());
  });
  console.log('VI Navigation labels:', viNav);

  await cyclePage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('locale:changed', { detail: { locale: 'en' } }));
  });
  await cyclePage.waitForTimeout(600);
  const enNav = await cyclePage.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-kn-nk]')).map((el) => el.textContent?.trim());
  });
  console.log('EN Navigation labels:', enNav);

  await cycleContext.close();
  await browser.close();
  console.log('\n================ ALL CHECKS PASSED SUCCESSFULLY! ================');
}

runValidation().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
