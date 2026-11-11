import { chromium } from 'playwright';

const executablePath = 'C:/Users/ThinkPad T14/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:4321/?preview=knight', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const results = [];

  for (let y = 3300; y <= 4000; y += 50) {
    await page.evaluate(yPos => {
      if (window.__knightLenis) {
        window.__knightLenis.scrollTo(yPos, { immediate: true });
      } else {
        window.scrollTo(0, yPos);
      }
    }, y);
    await page.waitForTimeout(100);

    const data = await page.evaluate(async (currentY) => {
      const cert = document.querySelector('[data-kn-root] #certifications');
      const h2 = cert.querySelector('#kn-h-certifications');
      const h2Rect = h2.getBoundingClientRect();

      // Check if h2 is on screen
      if (h2Rect.bottom < 0 || h2Rect.top > window.innerHeight) {
        return { y: currentY, offscreen: true };
      }

      return {
        y: currentY,
        h2Top: Math.round(h2Rect.top),
        h2Bottom: Math.round(h2Rect.bottom),
        h2Left: Math.round(h2Rect.left),
        h2Right: Math.round(h2Rect.right)
      };
    }, y);

    if (data.offscreen) continue;

    const b64 = (await page.screenshot()).toString('base64');
    const redCount = await page.evaluate(async ({ b64, data }) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await new Promise(r => img.onload = r);
      const cv = document.createElement('canvas');
      cv.width = img.width; cv.height = img.height;
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const startX = Math.max(0, data.h2Left);
      const endX = Math.min(cv.width, data.h2Right);
      const startY = Math.max(0, data.h2Top);
      const endY = Math.min(cv.height, data.h2Bottom);

      const idata = ctx.getImageData(startX, startY, endX - startX, endY - startY);
      const d = idata.data;
      let count = 0;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i+1], b = d[i+2];
        if (r > 30 && r > g * 1.6 && r > b * 1.6) {
          count++;
        }
      }
      return count;
    }, { b64, data });

    results.push({ y, ...data, redCount });
    console.log(`Scroll y=${y}: h2Top=${data.h2Top}, h2Bottom=${data.h2Bottom}, redInsideH2=${redCount}`);
  }

  await browser.close();
})();
