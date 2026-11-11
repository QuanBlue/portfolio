import { chromium } from 'playwright';
import fs from 'fs';

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Navigating to https://quanblue.forkfolio.dev/ ...');
  await page.goto('https://quanblue.forkfolio.dev/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Extract detailed info from ref
  const detailed = await page.evaluate(() => {
    function extractSection(sel) {
      const el = document.querySelector(sel);
      if (!el) return null;
      return {
        id: el.id,
        className: el.className,
        innerHTMLSnippet: el.innerHTML.slice(0, 1500),
        innerText: el.innerText.slice(0, 800)
      };
    }

    return {
      header: extractSection('header'),
      hero: extractSection('#t-s-about, .t-hero, .hero, main > section:first-of-type'),
      projects: extractSection('#t-s-projects'),
      moreWork: extractSection('#t-s-work'),
      skills: extractSection('#t-s-skills'),
      activity: extractSection('#t-s-activity'),
      contact: extractSection('#t-s-contact'),
      footer: extractSection('footer, .t-end'),
      computedStyles: {
        bodyFont: getComputedStyle(document.body).fontFamily,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        bodyColor: getComputedStyle(document.body).color,
      }
    };
  });

  fs.mkdirSync('tmp/reports', { recursive: true });
  fs.mkdirSync('tmp/browser-captures', { recursive: true });
  fs.mkdirSync('tmp/visual-regression', { recursive: true });

  fs.writeFileSync('tmp/reports/ref-details.json', JSON.stringify(detailed, null, 2));
  console.log('Saved tmp/reports/ref-details.json');

  // Let's capture segmented screenshots of reference
  const scrollTops = [0, 800, 1600, 2400, 3200, 4000, 4800, 5600];
  for (let i = 0; i < scrollTops.length; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollTops[i]);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `tmp/browser-captures/ref-shot-${scrollTops[i]}.png` });
  }

  // Also capture current Modern Mono segmented screenshots
  console.log('Navigating to http://localhost:4321/?preview=forkfolio ...');
  await page.goto('http://localhost:4321/?preview=forkfolio', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  for (let i = 0; i < scrollTops.length; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollTops[i]);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `tmp/visual-regression/current-shot-${scrollTops[i]}.png` });
  }

  await browser.close();
}

main().catch(console.error);
