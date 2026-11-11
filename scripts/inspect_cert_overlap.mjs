import { chromium } from 'playwright';

const executablePath = 'C:/Users/ThinkPad T14/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:4321/?preview=knight', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Scroll to certifications heading
  const scrollData = await page.evaluate(async () => {
    const cert = document.querySelector('[data-kn-root] #certifications');
    const h2 = cert.querySelector('#kn-h-certifications');
    const top = cert.getBoundingClientRect().top + window.scrollY;
    
    if (window.__knightLenis) {
      window.__knightLenis.scrollTo(top, { immediate: true });
    } else {
      window.scrollTo(0, top);
    }
    await new Promise(r => setTimeout(r, 400));

    const h2Rect = h2.getBoundingClientRect();
    return {
      scrollY: window.scrollY,
      h2Rect: {
        left: h2Rect.left,
        top: h2Rect.top,
        right: h2Rect.right,
        bottom: h2Rect.bottom,
        width: h2Rect.width,
        height: h2Rect.height
      }
    };
  });
  console.log('Scroll data:', scrollData);

  // Take screenshot of heading area
  fs.mkdirSync('tmp/scratch', { recursive: true });
  await page.screenshot({ path: 'tmp/scratch/scratch_cert_full.png' });

  // Analyze pixels in h2Rect
  const b64 = (await page.screenshot()).toString('base64');
  const pixelAnalysis = await page.evaluate(async ({ b64, h2Rect }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await new Promise(r => img.onload = r);
    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const startX = Math.round(h2Rect.left);
    const endX = Math.round(h2Rect.right);
    const startY = Math.round(h2Rect.top);
    const endY = Math.round(h2Rect.bottom);

    const idata = ctx.getImageData(startX, startY, endX - startX, endY - startY);
    const d = idata.data;
    let redCount = 0;
    const redPositions = [];

    for (let y = 0; y < idata.height; y++) {
      for (let x = 0; x < idata.width; x++) {
        const i = (y * idata.width + x) * 4;
        const r = d[i], g = d[i+1], b = d[i+2];
        if (r > 30 && r > g * 1.6 && r > b * 1.6) {
          redCount++;
          if (redPositions.length < 50) {
            redPositions.push({ x: startX + x, y: startY + y, r, g, b });
          }
        }
      }
    }

    return {
      h2Box: { startX, endX, startY, endY },
      redPixelsInsideH2: redCount,
      sampleRedPositions: redPositions.slice(0, 15)
    };
  }, { b64, h2Rect: scrollData.h2Rect });

  console.log('Pixel analysis inside H2:', JSON.stringify(pixelAnalysis, null, 2));

  await browser.close();
})();
