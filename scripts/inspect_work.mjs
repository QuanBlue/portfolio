import { chromium } from 'playwright';
import fs from 'fs';

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('https://quanblue.forkfolio.dev/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Scroll to #t-s-work
  await page.evaluate(() => {
    document.querySelector('#t-s-work')?.scrollIntoView();
  });
  await page.waitForTimeout(2000);

  const workData = await page.evaluate(() => {
    const el = document.querySelector('#t-s-work');
    return {
      text: el?.innerText,
      tableHtml: el?.querySelector('table, ul, ol, .t-pane')?.innerHTML?.slice(0, 2000)
    };
  });

  console.log('Work text:', workData.text?.slice(0, 500));
  fs.mkdirSync('tmp/reports', { recursive: true });
  fs.writeFileSync('tmp/reports/ref-work.json', JSON.stringify(workData, null, 2));
  console.log('Saved tmp/reports/ref-work.json');

  await browser.close();
}

main().catch(console.error);
