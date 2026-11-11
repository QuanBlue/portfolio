import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('https://quanblue.forkfolio.dev/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  const winStyles = await page.evaluate(() => {
    const win = document.querySelector('.t-win');
    if (!win) return null;
    return {
      cssText: win.style.cssText,
      computed: {
        position: window.getComputedStyle(win).position,
        inset: window.getComputedStyle(win).inset,
        border: window.getComputedStyle(win).border,
        boxShadow: window.getComputedStyle(win).boxShadow,
      },
      children: Array.from(win.children).map(c => ({
        className: c.className,
        style: c.style.cssText,
        computed: {
          border: window.getComputedStyle(c).border,
          position: window.getComputedStyle(c).position,
          inset: `${window.getComputedStyle(c).top} ${window.getComputedStyle(c).right} ${window.getComputedStyle(c).bottom} ${window.getComputedStyle(c).left}`
        }
      }))
    };
  });

  console.log(JSON.stringify(winStyles, null, 2));
  await browser.close();
}

main().catch(console.error);
