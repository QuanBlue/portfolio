import { chromium } from 'playwright';

const executablePath = 'C:/Users/ThinkPad T14/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:4321/?preview=knight', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const debugInfo = await page.evaluate(async () => {
    // Scroll to 3450
    if (window.__knightLenis) {
      window.__knightLenis.scrollTo(3450, { immediate: true });
    } else {
      window.scrollTo(0, 3450);
    }
    await new Promise(r => setTimeout(r, 400));

    const cert = document.querySelector('[data-kn-root] #certifications');
    const h2 = cert.querySelector('#kn-h-certifications');
    const h2Rect = h2.getBoundingClientRect();

    return {
      h2Rect: { left: h2Rect.left, top: h2Rect.top, width: h2Rect.width, height: h2Rect.height },
      lastDebug: window.__knightPlanetLast
    };
  });

  console.log('Debug at 3450:', JSON.stringify(debugInfo, null, 2));
  await browser.close();
})();
