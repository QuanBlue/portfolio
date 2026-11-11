import { chromium } from 'playwright';
import fs from 'fs';

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Navigating to https://quanblue.forkfolio.dev/ ...');
  await page.goto('https://quanblue.forkfolio.dev/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Inspect CSS rules related to t-boot, t-cmd, t-ps, t-ty, t-prog, blink
  const cssDetails = await page.evaluate(() => {
    const rules = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const r of Array.from(sheet.cssRules || [])) {
          if (r.selectorText && (
            r.selectorText.includes('.t-') ||
            r.selectorText.includes('cmd') ||
            r.selectorText.includes('prompt') ||
            r.selectorText.includes('boot') ||
            r.selectorText.includes('cursor') ||
            r.selectorText.includes('blink')
          )) {
            rules.push({ selector: r.selectorText, cssText: r.cssText });
          }
        }
      } catch (e) {}
    }
    return rules;
  });

  fs.mkdirSync('tmp/reports', { recursive: true });
  fs.writeFileSync('tmp/reports/ref-terminal-css.json', JSON.stringify(cssDetails, null, 2));
  console.log(`Saved ${cssDetails.length} CSS rules to tmp/reports/ref-terminal-css.json`);

  await browser.close();
}

main().catch(console.error);
