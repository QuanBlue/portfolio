import { chromium } from 'playwright';
import fs from 'fs';

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('https://quanblue.forkfolio.dev/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const fullAnalysis = await page.evaluate(() => {
    function getStructure(el) {
      if (!el) return null;
      return {
        id: el.id,
        tag: el.tagName,
        className: el.className,
        text: el.innerText,
      };
    }

    const projects = Array.from(document.querySelectorAll('#t-s-projects .t-proj, .t-projs li')).map(li => ({
      id: li.id,
      text: li.innerText
    }));

    const moreWork = document.querySelector('#t-s-work')?.innerText;
    const skills = document.querySelector('#t-s-skills')?.innerText;
    const activity = document.querySelector('#t-s-activity')?.innerText;
    const contact = document.querySelector('#t-s-contact')?.innerText;
    const nav = document.querySelector('nav, header')?.innerText;

    return {
      nav,
      projects,
      moreWork,
      skills,
      activity,
      contact
    };
  });

  fs.mkdirSync('tmp/reports', { recursive: true });
  fs.writeFileSync('tmp/reports/ref-full-analysis.json', JSON.stringify(fullAnalysis, null, 2));
  console.log('Saved tmp/reports/ref-full-analysis.json');

  await browser.close();
}

main().catch(console.error);
