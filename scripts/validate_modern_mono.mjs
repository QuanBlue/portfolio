import { chromium } from 'playwright';
import fs from 'fs';

const resolutions = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '390x844', width: 390, height: 844 },
];

async function main() {
  fs.mkdirSync('tmp/screenshots', { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const consoleErrors = [];

  for (const res of resolutions) {
    console.log(`\nTesting Modern Mono at ${res.name} ...`);
    const page = await browser.newPage({ viewport: { width: res.width, height: res.height } });
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[${res.name}] console.error: ${msg.text()}`);
      }
    });

    await page.goto('http://localhost:4321/?preview=forkfolio', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Capture full-page screenshot
    await page.screenshot({ path: `tmp/screenshots/modern-mono-${res.name}.png`, fullPage: true });
    console.log(`Saved tmp/screenshots/modern-mono-${res.name}.png`);

    // Verify sections exist in DOM
    const sectionsStatus = await page.evaluate(() => {
      const root = document.querySelector('[data-theme-wrapper="forkfolio"]');
      if (!root) return { foundRoot: false };

      const ids = ['top', 'about', 'projects', 'experience', 'education', 'certifications', 'skills', 'activity', 'contact'];
      const results = {};
      for (const id of ids) {
        const el = root.querySelector('#' + id);
        results[id] = {
          exists: Boolean(el),
          visible: el ? el.getBoundingClientRect().height > 0 : false,
          heading: el?.querySelector('h1, h2, h3')?.textContent?.trim()
        };
      }

      // Check header nav
      const header = document.querySelector('#forkfolio-header');
      const siteHeader = document.querySelector('#site-header');

      return {
        foundRoot: true,
        headerExists: Boolean(header),
        siteHeaderHidden: siteHeader ? window.getComputedStyle(siteHeader).display === 'none' : true,
        sections: results
      };
    });

    console.log(`Sections check at ${res.name}:`, JSON.stringify(sectionsStatus, null, 2));

    await page.close();
  }

  // Test Interactive Behaviors (Language Switch, Theme Toggle, Navigation)
  console.log('\nTesting Interactive Behaviors on Modern Mono (1440x900) ...');
  const testPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await testPage.goto('http://localhost:4321/?preview=forkfolio', { waitUntil: 'networkidle' });
  await testPage.waitForTimeout(500);

  // 1. Check EN default text
  const aboutHeadingEn = await testPage.evaluate(() => {
    return document.querySelector('.ff-about-heading')?.textContent?.trim();
  });
  console.log('Default (EN) About Heading:', aboutHeadingEn);

  // 2. Click Language Switcher to switch to VI
  console.log('Switching to Vietnamese (VI)...');
  const viBtn = testPage.locator('#forkfolio-header button:has-text("VI"), #forkfolio-header a:has-text("VI"), [data-lang-btn="vi"]');
  if (await viBtn.count() > 0) {
    await viBtn.first().click();
    await testPage.waitForTimeout(500);
    const aboutHeadingVi = await testPage.evaluate(() => {
      return document.querySelector('.ff-about-heading')?.textContent?.trim();
    });
    console.log('Switched to VI About Heading:', aboutHeadingVi);
    await testPage.screenshot({ path: 'tmp/screenshots/modern-mono-vi-1440.png', fullPage: false });
  }

  // 3. Switch back to EN
  const enBtn = testPage.locator('#forkfolio-header button:has-text("EN"), #forkfolio-header a:has-text("EN"), [data-lang-btn="en"]');
  if (await enBtn.count() > 0) {
    await enBtn.first().click();
    await testPage.waitForTimeout(500);
  }

  // 4. Test Light Mode Toggle
  console.log('Toggling Light Mode...');
  const lightBtn = testPage.locator('#ff-color-mode-toggle');
  if (await lightBtn.count() > 0) {
    await lightBtn.click();
    await testPage.waitForTimeout(500);
    const isDark = await testPage.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log('Is dark class present after toggle:', isDark);
    await testPage.screenshot({ path: 'tmp/screenshots/modern-mono-light-1440.png', fullPage: true });

    // Toggle back to dark
    await lightBtn.click();
    await testPage.waitForTimeout(300);
  }

  // 5. Test Navigation Smooth Scroll
  console.log('Testing click on #projects nav link...');
  await testPage.click('#forkfolio-header a[href="#projects"]');
  await testPage.waitForTimeout(1000);
  const scrollY = await testPage.evaluate(() => window.scrollY);
  console.log('Scroll position after clicking #projects:', scrollY);

  await testPage.close();

  // Test Regression: Check Knight Theme still works!
  console.log('\nChecking Knight theme for regressions at http://localhost:4321/?preview=knight ...');
  const knightPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await knightPage.goto('http://localhost:4321/?preview=knight', { waitUntil: 'networkidle' });
  await knightPage.waitForTimeout(2000);

  const knightCheck = await knightPage.evaluate(() => {
    const root = document.querySelector('[data-kn-root]');
    const heroAsc = root?.querySelector('#kn-h-name');
    const certsAsc = root?.querySelector('#kn-h-certifications');
    const stage = document.querySelector('canvas, [data-kn-fig]');
    return {
      foundKnightRoot: Boolean(root),
      heroAsciiPresent: Boolean(heroAsc),
      certsAsciiPresent: Boolean(certsAsc),
      stagePresent: Boolean(stage)
    };
  });
  console.log('Knight theme health check:', JSON.stringify(knightCheck, null, 2));
  fs.mkdirSync('tmp/visual-regression', { recursive: true });
  await knightPage.screenshot({ path: 'tmp/visual-regression/knight-regression-1440.png' });
  await knightPage.close();

  // Test Regression: Check ASCII theme still works!
  console.log('\nChecking ASCII theme at http://localhost:4321/?preview=ascii ...');
  const asciiPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await asciiPage.goto('http://localhost:4321/?preview=ascii', { waitUntil: 'networkidle' });
  await asciiPage.waitForTimeout(1000);
  const asciiCheck = await asciiPage.evaluate(() => {
    const root = document.querySelector('[data-theme-wrapper="ascii"]');
    return {
      foundAsciiRoot: Boolean(root),
      visible: root ? window.getComputedStyle(root).display !== 'none' : false
    };
  });
  console.log('ASCII theme health check:', JSON.stringify(asciiCheck, null, 2));
  await asciiPage.close();

  await browser.close();

  console.log('\nTotal console errors during tests:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Errors:', consoleErrors);
  }
}

main().catch(console.error);
