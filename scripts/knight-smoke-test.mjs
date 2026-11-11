import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/ThinkPad T14/.gemini/antigravity/brain/4b59acc7-35e9-4763-a991-acd9b15b54cd';
const BASE_URL = process.env.TEST_URL || 'http://localhost:4321/?preview=knight';

async function runKnightSmokeTest() {
  console.log(`[Knight Smoke Test] Launching Chromium to test ${BASE_URL}...`);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const testResults = await page.evaluate(() => {
    const root = document.querySelector('.kn[data-kn-root="true"]');
    const hero = document.querySelector('.kn-hero[data-hero="true"]');
    const h1 = document.querySelector('.kn-hero .kn-asc.kn-name');
    const fig = document.querySelector('.kn-fig[data-kn-fig="true"]');
    const img = document.querySelector('.kn-fig-img');
    const canvas = document.querySelector('canvas.kn-cv');

    const h1Style = h1 ? window.getComputedStyle(h1) : null;
    const imgStyle = img ? window.getComputedStyle(img) : null;

    return {
      rootMounted: !!root,
      heroMounted: !!hero,
      h1Mounted: !!h1,
      h1Text: h1?.textContent?.trim() || '',
      h1AsciiDataLd: h1?.getAttribute('data-ld') || '',
      h1AsciiDataLm: h1?.getAttribute('data-lm') || '',
      h1Color: h1Style?.color || '',
      figMounted: !!fig,
      avatarUrl: fig?.getAttribute('data-av') || '',
      imgHiddenWhenLive: imgStyle?.display === 'none',
      canvasMounted: !!canvas,
      canvasWidth: canvas?.width || 0,
      canvasHeight: canvas?.height || 0,
      dataLivePresent: root?.hasAttribute('data-live') || false,
      dataArmPresent: root?.hasAttribute('data-arm') || false,
      stageStatus: root?.dataset.knStageStatus || 'none',
    };
  });

  console.log('\n================ SMOKE TEST RESULTS ================');
  console.log('1. Root & Hero Mount:', testResults.rootMounted && testResults.heroMounted ? 'PASS' : 'FAIL');
  console.log('2. Canvas ASCII Engine Active:', testResults.canvasMounted && testResults.canvasWidth > 0 ? 'PASS' : 'FAIL');
  console.log('3. Data-Live State:', testResults.dataLivePresent ? 'PASS' : 'FAIL');
  console.log('4. Data-Arm State:', testResults.dataArmPresent ? 'PASS' : 'FAIL');
  console.log('5. Fallback Heading Masked (color=transparent):', testResults.h1Color.includes('0, 0, 0, 0') ? 'PASS' : 'FAIL');
  console.log('6. Fallback Raster Img Hidden (display=none):', testResults.imgHiddenWhenLive ? 'PASS' : 'FAIL');
  console.log('7. ASCII Title Dataset Present:', testResults.h1AsciiDataLd.includes('NGUYEN') ? 'PASS' : 'FAIL');
  console.log('8. Stage Status Attribute:', testResults.stageStatus === 'initialized' ? 'PASS' : 'FAIL');
  console.log('9. Console Errors (0 expected):', consoleErrors.length === 0 ? 'PASS' : `FAIL (${consoleErrors.length} errors)`);
  console.log('10. Page Uncaught Exceptions (0 expected):', pageErrors.length === 0 ? 'PASS' : `FAIL (${pageErrors.length} exceptions)`);
  console.log('=====================================================\n');

  // Capture baseline screenshot
  const screenshotPath = path.join(ARTIFACT_DIR, 'knight_hero_baseline_desktop.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved Knight Hero Desktop Baseline: ${screenshotPath}`);

  await browser.close();

  const allPassed =
    testResults.rootMounted &&
    testResults.heroMounted &&
    testResults.canvasMounted &&
    testResults.dataLivePresent &&
    testResults.dataArmPresent &&
    testResults.h1Color.includes('0, 0, 0, 0') &&
    testResults.imgHiddenWhenLive &&
    testResults.stageStatus === 'initialized' &&
    consoleErrors.length === 0 &&
    pageErrors.length === 0;

  if (!allPassed) {
    console.error('Smoke test failed!');
    if (consoleErrors.length) console.error('Console errors:', consoleErrors);
    if (pageErrors.length) console.error('Page errors:', pageErrors);
    process.exit(1);
  }

  console.log('ALL SMOKE TEST CRITERIA PASSED SUCCESSFULLY!');
}

runKnightSmokeTest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
