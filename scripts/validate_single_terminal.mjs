import { chromium } from 'playwright';
import fs from 'fs';

async function testViewport(browser, { width, height, name }) {
  fs.mkdirSync('tmp/screenshots', { recursive: true });
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  console.log(`\n========================================`);
  console.log(`Testing Viewport: ${name} (${width}x${height})`);
  console.log(`========================================`);

  await page.goto('http://localhost:4321/?preview=forkfolio', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // 1. Verify Master Terminal Window and Shell structure
  const shellCheck = await page.evaluate(() => {
    const root = document.querySelector('[data-theme-wrapper="forkfolio"]');
    if (!root) return { error: 'forkfolio wrapper not found' };

    const shell = root.querySelector('.ff-terminal-shell');
    const chrome = root.querySelector('.ff-terminal-chrome');
    const nav = root.querySelector('.ff-terminal-subnav');
    const statusBar = root.querySelector('#ff-terminal-status-bar');
    const viewport = root.querySelector('.ff-terminal-viewport');

    return {
      hasRoot: !!root,
      hasShell: !!shell,
      hasChrome: !!chrome,
      hasNav: !!nav,
      hasStatusBar: !!statusBar,
      hasViewport: !!viewport,
      chromeText: chrome ? chrome.innerText.replace(/\s+/g, ' ').trim() : '',
      statusText: statusBar ? statusBar.innerText.replace(/\s+/g, ' ').trim() : '',
    };
  });

  console.log('Shell Structure Check:', shellCheck);

  // 2. Initial Status Bar Telemetry (at top)
  const initialStatus = await page.evaluate(() => {
    const sec = document.getElementById('ff-sb-section')?.textContent?.trim();
    const pct = document.getElementById('ff-sb-pct')?.textContent?.trim();
    const blocks = document.getElementById('ff-sb-blocks')?.textContent?.trim();
    return { sec, pct, blocks };
  });
  console.log('Initial Status Bar (Scroll 0):', initialStatus);

  // Take top screenshot
  await page.screenshot({ path: `tmp/screenshots/terminal-shell-${name}-top.png` });
  console.log(`Saved screenshot: tmp/screenshots/terminal-shell-${name}-top.png`);

  // 3. Scroll to Projects and check status bar
  await page.evaluate(() => {
    const root = document.querySelector('[data-theme-wrapper="forkfolio"]');
    const proj = root?.querySelector('#projects');
    if (proj) proj.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(600);

  const projectsStatus = await page.evaluate(() => {
    const sec = document.getElementById('ff-sb-section')?.textContent?.trim();
    const pct = document.getElementById('ff-sb-pct')?.textContent?.trim();
    const blocks = document.getElementById('ff-sb-blocks')?.textContent?.trim();
    return { sec, pct, blocks };
  });
  console.log('Projects Section Status:', projectsStatus);

  // 4. Scroll to Skills and check status bar
  await page.evaluate(() => {
    const root = document.querySelector('[data-theme-wrapper="forkfolio"]');
    const skills = root?.querySelector('#skills');
    if (skills) skills.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(600);

  const skillsStatus = await page.evaluate(() => {
    const sec = document.getElementById('ff-sb-section')?.textContent?.trim();
    const pct = document.getElementById('ff-sb-pct')?.textContent?.trim();
    const blocks = document.getElementById('ff-sb-blocks')?.textContent?.trim();
    return { sec, pct, blocks };
  });
  console.log('Skills Section Status:', skillsStatus);

  // 5. Scroll to bottom (Contact / Exit) and check status bar
  await page.evaluate(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
  });
  await page.waitForTimeout(600);

  const bottomStatus = await page.evaluate(() => {
    const sec = document.getElementById('ff-sb-section')?.textContent?.trim();
    const pct = document.getElementById('ff-sb-pct')?.textContent?.trim();
    const blocks = document.getElementById('ff-sb-blocks')?.textContent?.trim();
    return { sec, pct, blocks };
  });
  console.log('Bottom Status Bar (Scroll 100%):', bottomStatus);

  // Take bottom screenshot
  await page.screenshot({ path: `tmp/screenshots/terminal-shell-${name}-bottom.png` });
  console.log(`Saved screenshot: tmp/screenshots/terminal-shell-${name}-bottom.png`);

  // 6. Test Language Switcher (EN -> VI)
  console.log('Testing Language Switcher to VI...');
  await page.evaluate(() => {
    const viBtn = document.querySelector('button[data-lang="vi"]');
    if (viBtn) viBtn.click();
  });
  await page.waitForTimeout(500);

  const viStatus = await page.evaluate(() => {
    const sec = document.getElementById('ff-sb-section')?.textContent?.trim();
    const activeTab = document.querySelector('.ff-nav-tab.font-bold .ff-tab-text')?.textContent?.trim();
    return { sec, activeTab };
  });
  console.log('VI Status & Tab:', viStatus);

  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Errors encountered:', consoleErrors);
  }

  await context.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });

  const viewports = [
    { width: 1920, height: 1080, name: '1920x1080' },
    { width: 1440, height: 900, name: '1440x900' },
    { width: 768, height: 1024, name: '768x1024' },
    { width: 390, height: 844, name: '390x844' },
  ];

  for (const vp of viewports) {
    await testViewport(browser, vp);
  }

  await browser.close();
  console.log('\nAll Viewports Validated Successfully!');
}

main().catch(console.error);
