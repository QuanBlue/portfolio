import { chromium } from 'playwright';
import path from 'node:path';

const ARTIFACTS_DIR = 'C:\\Users\\ThinkPad T14\\.gemini\\antigravity\\brain\\4b59acc7-35e9-4763-a991-acd9b15b54cd';

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const viewports = [
    { name: '1920x1080_desktop', width: 1920, height: 1080 },
    { name: '1440x900_laptop', width: 1440, height: 900 },
    { name: '768x1024_tablet', width: 768, height: 1024 },
    { name: '390x844_mobile', width: 390, height: 844 },
  ];

  console.log('[Verify] Starting verification across viewports...');

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('http://localhost:4321/?preview=knight', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Scroll to #certifications
    const certEl = await page.$('#certifications');
    if (!certEl) {
      console.error(`[Verify] #certifications not found on ${vp.name}`);
      continue;
    }

    // Scroll element into view with heading near top/middle
    await certEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);

    // Get measurements of heading
    const headInfo = await page.evaluate(() => {
      const h2 = document.querySelector('#kn-h-certifications');
      const cs = window.getComputedStyle(h2);
      const rect = h2.getBoundingClientRect();
      const kd = cs.getPropertyValue('--kd').trim();
      const km = cs.getPropertyValue('--km').trim();
      const fs = cs.fontSize;
      return {
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        kd,
        km,
        fs,
        text: h2.textContent?.trim(),
        ld: h2.dataset.ld,
      };
    });

    console.log(`[Verify ${vp.name}] Heading info:`, JSON.stringify(headInfo));

    const shotPath = path.join(ARTIFACTS_DIR, `cert_heading_${vp.name}_verified.png`);
    await page.screenshot({ path: shotPath });
    console.log(`[Verify ${vp.name}] Saved screenshot: ${shotPath}`);

    if (errors.length) {
      console.warn(`[Verify ${vp.name}] Errors:`, errors);
    }

    await page.close();
  }

  // Also test Vietnamese mode
  console.log('[Verify] Testing Vietnamese mode...');
  const viPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await viPage.goto('http://localhost:4321/?preview=knight', { waitUntil: 'networkidle' });
  await viPage.waitForTimeout(1000);

  // Switch to VI via locale event or button
  await viPage.evaluate(() => {
    localStorage.setItem('portfolio_locale', 'vi');
    window.dispatchEvent(new CustomEvent('locale:changed', { detail: { locale: 'vi' } }));
  });
  await viPage.waitForTimeout(1000);

  const viCertEl = await viPage.$('#certifications');
  if (viCertEl) {
    await viCertEl.scrollIntoViewIfNeeded();
    await viPage.waitForTimeout(1200);

    const viHeadInfo = await viPage.evaluate(() => {
      const h2 = document.querySelector('#kn-h-certifications');
      const cs = window.getComputedStyle(h2);
      const rect = h2.getBoundingClientRect();
      return {
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        kd: cs.getPropertyValue('--kd').trim(),
        km: cs.getPropertyValue('--km').trim(),
        fs: cs.fontSize,
        ld: h2.dataset.ld,
        text: h2.textContent?.trim(),
      };
    });
    console.log('[Verify VI] Heading info:', JSON.stringify(viHeadInfo));

    const viShotPath = path.join(ARTIFACTS_DIR, 'cert_heading_vi_mode_verified.png');
    await viPage.screenshot({ path: viShotPath });
    console.log(`[Verify VI] Saved screenshot: ${viShotPath}`);
  }

  await viPage.close();
  await browser.close();
  console.log('[Verify] Done!');
}

main().catch(err => {
  console.error('[Verify] Fatal error:', err);
  process.exit(1);
});
