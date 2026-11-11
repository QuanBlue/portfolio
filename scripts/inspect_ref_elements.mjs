import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('https://quanblue.forkfolio.dev/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  const res = await page.evaluate(() => {
    const win = document.querySelector('.t-win');
    const bar = document.querySelector('.t-bar');
    const sl = document.querySelector('.t-sl');

    return {
      win: win ? { html: win.outerHTML, css: window.getComputedStyle(win).cssText } : null,
      bar: bar ? { html: bar.outerHTML } : null,
      sl: sl ? { html: sl.outerHTML } : null,
    };
  });

  console.log('--- WIN ---');
  console.log(res.win?.html);
  console.log('--- BAR ---');
  console.log(res.bar?.html);
  console.log('--- SL ---');
  console.log(res.sl?.html);

  await browser.close();
}

main().catch(console.error);
