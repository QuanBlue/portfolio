import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('https://quanblue.forkfolio.dev/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  const data = await page.evaluate(() => {
    // Top elements
    const bodyChildren = Array.from(document.body.children).map(el => ({
      tag: el.tagName,
      id: el.id,
      className: el.className,
      rect: el.getBoundingClientRect(),
    }));

    // Find any sticky or fixed header/footer/status bar
    const allFixed = Array.from(document.querySelectorAll('*')).filter(el => {
      const s = window.getComputedStyle(el);
      return s.position === 'fixed' || s.position === 'sticky';
    }).map(el => ({
      tag: el.tagName,
      id: el.id,
      className: el.className,
      position: window.getComputedStyle(el).position,
      top: window.getComputedStyle(el).top,
      bottom: window.getComputedStyle(el).bottom,
      text: el.innerText ? el.innerText.substring(0, 100) : '',
    }));

    // Check header / chrome specifically
    const chrome = document.querySelector('.t-chrome, .t-header, header');
    const status = document.querySelector('.t-status, .t-foot, footer, [class*=\"status\"]');

    return {
      bodyChildren,
      allFixed,
      chrome: chrome ? { html: chrome.outerHTML.substring(0, 500) } : null,
      status: status ? { html: status.outerHTML.substring(0, 500) } : null,
    };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
}

main().catch(console.error);
