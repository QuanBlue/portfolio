import { chromium } from 'playwright';
import fs from 'fs';

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Navigating to https://quanblue.forkfolio.dev/ ...');
  await page.goto('https://quanblue.forkfolio.dev/', { waitUntil: 'networkidle', timeout: 30000 });
  fs.mkdirSync('tmp/browser-captures', { recursive: true });
  fs.mkdirSync('tmp/reports', { recursive: true });

  await page.waitForTimeout(1000);

  // Capture initial state
  await page.screenshot({ path: 'tmp/browser-captures/ref-terminal-startup.png' });
  console.log('Saved tmp/browser-captures/ref-terminal-startup.png');

  // Inspect the DOM for terminal commands, typing classes, progress bars, cursors
  const terminalData = await page.evaluate(() => {
    // Find all commands (.t-cmd, text with command prompts)
    const cmds = Array.from(document.querySelectorAll('.t-cmd, [class*="cmd"], [class*="prompt"], [class*="boot"]')).map(el => ({
      className: el.className,
      text: el.innerText.trim(),
      html: el.outerHTML
    }));

    // Find all panes and progress bars
    const panes = Array.from(document.querySelectorAll('.t-pane, [class*="pane"], [class*="prog"], [class*="install"]')).map(el => ({
      className: el.className,
      text: el.innerText.slice(0, 300),
      html: el.outerHTML.slice(0, 500)
    }));

    // Find any typing elements (.t-ty, etc.)
    const typingEls = Array.from(document.querySelectorAll('.t-ty, [class*="ty"], [data-tt]')).map(el => ({
      className: el.className,
      dataset: { ...el.dataset },
      style: el.getAttribute('style'),
      text: el.innerText
    }));

    // Check footer exit sequence
    const endBox = document.querySelector('.t-end, footer, [class*="end"]');

    return {
      cmds,
      panes: panes.slice(0, 10),
      typingEls: typingEls.slice(0, 15),
      endBox: endBox ? { className: endBox.className, text: endBox.innerText } : null
    };
  });

  fs.writeFileSync('tmp/reports/ref-terminal-data.json', JSON.stringify(terminalData, null, 2));
  console.log('Saved tmp/reports/ref-terminal-data.json');

  // Let's scroll down step-by-step and record what commands appear
  const sections = ['#t-s-projects', '#t-s-work', '#t-s-skills', '#t-s-activity', '#t-s-contact', '.t-end'];
  for (const s of sections) {
    await page.evaluate((sel) => {
      document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' });
    }, s);
    await page.waitForTimeout(1500);
    const snap = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return {
        selector: sel,
        text: el?.innerText?.slice(0, 600),
        commands: Array.from(el?.querySelectorAll('.t-cmd') || []).map(c => c.innerText.trim())
      };
    }, s);
    console.log(`Section ${s}:`, snap.commands);
  }

  await browser.close();
}

main().catch(console.error);
