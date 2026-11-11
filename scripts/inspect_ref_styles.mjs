import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('https://quanblue.forkfolio.dev/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  const styles = await page.evaluate(() => {
    function pick(sel, props) {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      const out = {};
      props.forEach(p => out[p] = cs.getPropertyValue(p));
      return out;
    }

    return {
      bar: pick('.t-bar', ['position', 'top', 'height', 'background-color', 'border-bottom-width', 'border-bottom-color', 'z-index']),
      barTitle: pick('.t-bar__title', ['display', 'align-items', 'justify-content', 'height', 'font-family', 'font-size', 'color']),
      tabs: pick('.t-tabs__row', ['display', 'gap', 'font-family', 'font-size', 'color']),
      sl: pick('.t-sl', ['position', 'bottom', 'height', 'background-color', 'border-top-width', 'border-top-color', 'font-family', 'font-size', 'color', 'z-index', 'display', 'align-items', 'gap']),
    };
  });

  console.log(JSON.stringify(styles, null, 2));
  await browser.close();
}

main().catch(console.error);
