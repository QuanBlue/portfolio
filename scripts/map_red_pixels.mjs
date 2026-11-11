import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/ThinkPad T14/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe', headless: true });
  const page = await browser.newPage();
  const b64 = fs.readFileSync('C:/Users/ThinkPad T14/.gemini/antigravity/brain/4b59acc7-35e9-4763-a991-acd9b15b54cd/cert_overlap_at_3450.png').toString('base64');
  
  const map = await page.evaluate(async (dataUrl) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + dataUrl;
    await new Promise(r => img.onload = r);
    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const idata = ctx.getImageData(0, 0, cv.width, cv.height);
    const d = idata.data;

    let aboveH2 = 0;
    let insideH2 = 0;
    let belowH2 = 0;

    let minInsideX = 9999, maxInsideX = 0, minInsideY = 9999, maxInsideY = 0;

    for (let y = 0; y < cv.height; y++) {
      for (let x = 0; x < cv.width; x++) {
        const i = (y * cv.width + x) * 4;
        const r = d[i], g = d[i+1], b = d[i+2];

        if (r > 30 && r > g * 1.6 && r > b * 1.6) {
          if (x >= 48 && x <= 954) {
            if (y < 182) {
              aboveH2++;
            } else if (y <= 321) {
              insideH2++;
              if (x < minInsideX) minInsideX = x;
              if (x > maxInsideX) maxInsideX = x;
              if (y < minInsideY) minInsideY = y;
              if (y > maxInsideY) maxInsideY = y;
            } else {
              belowH2++;
            }
          }
        }
      }
    }

    return {
      aboveH2,
      insideH2,
      belowH2,
      insideBounds: insideH2 ? { minInsideX, maxInsideX, minInsideY, maxInsideY } : null
    };
  }, b64);

  console.log('Red pixel distribution relative to H2 [182, 321]:', map);
  await browser.close();
})();
