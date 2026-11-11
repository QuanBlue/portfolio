import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  
  const viewports = [
    { name: '1440', width: 1440, height: 900 },
    { name: '1920', width: 1920, height: 1080 },
    { name: '390', width: 390, height: 844 }
  ];

  fs.mkdirSync('docs/themes/screenshots', { recursive: true });

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    console.log(`Navigating to http://localhost:4321/?preview=knight at ${vp.width}x${vp.height}...`);
    await page.goto('http://localhost:4321/?preview=knight', { waitUntil: 'networkidle' });

    // Wait 2.5s for fonts, images, and initial stage animations to settle
    await page.waitForTimeout(2500);

    const diagnostics = await page.evaluate(() => {
      const kn = document.querySelector('.kn');
      const cv = document.querySelector('canvas.ff-stage, canvas.kn-cv');
      const name = document.querySelector('.kn-name');
      const fig = document.querySelector('.kn-fig-img');
      const ground = document.querySelector('.kn-hero');

      return {
        knAttributes: kn ? kn.getAttributeNames().map(a => `${a}="${kn.getAttribute(a)}"`) : [],
        canvasFound: !!cv,
        canvasClass: cv?.className,
        canvasSize: cv ? { width: cv.width, height: cv.height } : null,
        nameColor: name ? getComputedStyle(name).color : null,
        figDisplay: fig ? getComputedStyle(fig).display : null,
        heroBounds: ground?.getBoundingClientRect(),
      };
    });

    console.log(`Diagnostics for ${vp.name}:`, JSON.stringify(diagnostics, null, 2));

    const shotPath = path.resolve(`docs/themes/screenshots/local-knight-hero-${vp.name}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Captured screenshot: ${shotPath}`);

    await page.close();
  }

  await browser.close();
  console.log('Verification run complete.');
}

main().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
