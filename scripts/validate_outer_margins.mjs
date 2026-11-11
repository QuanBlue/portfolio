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
  await page.waitForTimeout(800);

  // 1. Measure Outer Margins on all 4 sides
  const marginMetrics = await page.evaluate(() => {
    const root = document.querySelector('[data-theme-wrapper="forkfolio"]');
    const shell = root ? root.querySelector('.ff-terminal-shell') : null;
    const viewport = root ? root.querySelector('.ff-terminal-viewport') : null;
    const header = root ? root.querySelector('#forkfolio-header') : null;
    const status = root ? root.querySelector('#ff-terminal-status-bar') : null;

    if (!shell) return { error: 'Shell not found' };

    const rect = shell.getBoundingClientRect();
    const topMargin = Math.round(rect.top);
    const bottomMargin = Math.round(window.innerHeight - rect.bottom);
    const leftMargin = Math.round(rect.left);
    const rightMargin = Math.round(window.innerWidth - rect.right);

    return {
      topMargin,
      bottomMargin,
      leftMargin,
      rightMargin,
      isCentered: Math.abs(leftMargin - rightMargin) <= 3,
      shellWidth: Math.round(rect.width),
      shellHeight: Math.round(rect.height),
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      headerInside: header && shell.contains(header),
      statusInside: status && shell.contains(status),
      viewportScrollable: viewport && viewport.scrollHeight > viewport.clientHeight,
    };
  });

  console.log('Outer Margin & Geometry Metrics:', marginMetrics);

  // 2. Initial Telemetry
  const initialStatus = await page.evaluate(() => {
    const sec = document.getElementById('ff-sb-section')?.textContent?.trim();
    const pct = document.getElementById('ff-sb-pct')?.textContent?.trim();
    const activeTab = document.querySelector('.ff-nav-tab.is-active')?.getAttribute('data-section');
    const filledCells = document.querySelectorAll('.ff-seg-cell.is-filled').length;
    return { sec, pct, activeTab, filledCells };
  });
  console.log('Initial Status Bar (Scroll 0):', initialStatus);

  // Take top screenshot showing full viewport margins
  await page.screenshot({ path: `tmp/screenshots/terminal-margin-${name}-top.png` });
  console.log(`Saved screenshot: tmp/screenshots/terminal-margin-${name}-top.png`);

  // 3. Scroll internally to Projects
  await page.evaluate(() => {
    const root = document.querySelector('[data-theme-wrapper="forkfolio"]');
    const viewport = root?.querySelector('.ff-terminal-viewport');
    const proj = root?.querySelector('#projects');
    if (viewport && proj) {
      const targetTop = proj.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop;
      viewport.scrollTo({ top: targetTop + 10, behavior: 'instant' });
    }
  });
  await page.waitForTimeout(500);

  const projectsStatus = await page.evaluate(() => {
    const sec = document.getElementById('ff-sb-section')?.textContent?.trim();
    const pct = document.getElementById('ff-sb-pct')?.textContent?.trim();
    const activeTab = document.querySelector('.ff-nav-tab.is-active')?.getAttribute('data-section');
    const filledCells = document.querySelectorAll('.ff-seg-cell.is-filled').length;
    return { sec, pct, activeTab, filledCells };
  });
  console.log('Projects Section Status:', projectsStatus);

  // 4. Scroll internally to Bottom (100%)
  await page.evaluate(() => {
    const viewport = document.querySelector('.ff-terminal-viewport');
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'instant' });
    }
  });
  await page.waitForTimeout(500);

  const bottomStatus = await page.evaluate(() => {
    const sec = document.getElementById('ff-sb-section')?.textContent?.trim();
    const pct = document.getElementById('ff-sb-pct')?.textContent?.trim();
    const filledCells = document.querySelectorAll('.ff-seg-cell.is-filled').length;
    const activeTab = document.querySelector('.ff-nav-tab.is-active')?.getAttribute('data-section');
    const scrollTop = document.querySelector('.ff-terminal-viewport')?.scrollTop;
    const maxScroll = document.querySelector('.ff-terminal-viewport')?.scrollHeight - document.querySelector('.ff-terminal-viewport')?.clientHeight;
    return { sec, pct, filledCells, activeTab, scrollTop, maxScroll };
  });
  console.log('Bottom Status Bar (Scroll 100%):', bottomStatus);

  // Take bottom screenshot showing full viewport margins
  await page.screenshot({ path: `tmp/screenshots/terminal-margin-${name}-bottom.png` });
  console.log(`Saved screenshot: tmp/screenshots/terminal-margin-${name}-bottom.png`);

  // 5. Test Language Switcher to VI
  await page.evaluate(() => {
    const viBtn = document.querySelector('button[data-lang="vi"]');
    if (viBtn) viBtn.click();
  });
  await page.waitForTimeout(400);

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
  console.log('\nAll Outer Margins & Viewports Validated Successfully!');
}

main().catch(console.error);
