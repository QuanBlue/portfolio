import { chromium } from 'playwright';

const executablePath = 'C:/Users/ThinkPad T14/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // Inject logger before scripts run
  await page.addInitScript(() => {
    (window as any).__planetBoxesAt3450 = [];
  });

  await page.goto('http://localhost:4321/?preview=knight', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Scroll to 3450
  await page.evaluate(() => {
    if (window.__knightLenis) {
      window.__knightLenis.scrollTo(3450, { immediate: true });
    } else {
      window.scrollTo(0, 3450);
    }
  });
  await page.waitForTimeout(400);

  const debug = await page.evaluate(() => {
    const cert = document.querySelector('[data-kn-root] #certifications');
    const h2 = cert.querySelector('#kn-h-certifications');
    const rect = h2.getBoundingClientRect();
    return {
      h2Rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
    };
  });
  console.log('H2 rect:', debug);

  await browser.close();
})();
