import { chromium } from 'playwright';
import fs from 'fs';

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  fs.mkdirSync('tmp/visual-regression', { recursive: true });
  fs.mkdirSync('tmp/browser-captures', { recursive: true });
  fs.mkdirSync('tmp/reports', { recursive: true });

  console.log('Navigating to http://localhost:4321/?preview=forkfolio ...');
  await page.goto('http://localhost:4321/?preview=forkfolio', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'tmp/visual-regression/current-modern-mono-1440.png', fullPage: true });
  console.log('Saved tmp/visual-regression/current-modern-mono-1440.png');

  console.log('Navigating to https://quanblue.forkfolio.dev/ ...');
  try {
    await page.goto('https://quanblue.forkfolio.dev/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tmp/browser-captures/ref-forkfolio-1440.png', fullPage: true });
    console.log('Saved tmp/browser-captures/ref-forkfolio-1440.png');

    // Inspect sections & text structure on reference
    const refData = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, header, nav, section, [id]')).map(el => ({
        tag: el.tagName,
        id: el.id,
        className: el.className,
        text: (el.textContent || '').trim().slice(0, 100)
      }));
      return {
        title: document.title,
        navLinks: Array.from(document.querySelectorAll('nav a, header a')).map(a => ({
          href: a.getAttribute('href'),
          text: a.textContent?.trim()
        })),
        sections: Array.from(document.querySelectorAll('section, main > div, [data-section]')).map(s => ({
          id: s.id,
          tag: s.tagName,
          classes: s.className,
          heading: s.querySelector('h1, h2, h3')?.textContent?.trim()
        }))
      };
    });
    fs.writeFileSync('tmp/reports/ref-structure.json', JSON.stringify(refData, null, 2));
    console.log('Saved tmp/reports/ref-structure.json');
  } catch (err) {
    console.error('Error fetching reference site:', err);
  }

  await browser.close();
}

main().catch(console.error);
