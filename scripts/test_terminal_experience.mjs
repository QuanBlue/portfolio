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

  console.log('=== TEST 1: Modern Mono Terminal Startup & Sequence Validation ===');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(`[Console Error] ${msg.text()}`);
  });

  await page.goto('http://localhost:4321/?preview=forkfolio', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // 1. Check Boot Status
  const bootStatus = await page.evaluate(() => {
    const statuses = Array.from(document.querySelectorAll('.ff-hero-boot .ff-term-status')).map(el => el.textContent?.trim());
    const prompt = document.querySelector('#hero-cmd-whoami .ff-term-cmd')?.textContent?.trim();
    const cursor = document.querySelector('#hero-cmd-whoami .ff-cursor');
    return {
      statuses,
      promptText: prompt,
      hasCursor: Boolean(cursor)
    };
  });
  console.log('Boot status result:', JSON.stringify(bootStatus, null, 2));

  // 2. Scroll through sections and verify command prompts and animation states
  const sectionsToCheck = [
    { id: 'about', expectedCmd: 'cat ~/about.md' },
    { id: 'projects', expectedCmd: 'ls ~/projects' },
    { id: 'experience', expectedCmd: 'cat ~/career.log' },
    { id: 'education', expectedCmd: 'cat ~/education.md' },
    { id: 'certifications', expectedCmd: 'ls ~/certifications' },
    { id: 'skills', expectedCmd: 'brew bundle' },
    { id: 'activity', expectedCmd: 'git log --since=1.year --stat' },
    { id: 'contact', expectedCmd: 'mail quanblue' },
  ];

  for (const s of sectionsToCheck) {
    console.log(`Scrolling to #${s.id}...`);
    await page.evaluate((id) => {
      const root = document.querySelector('[data-theme-wrapper="forkfolio"]');
      const el = root?.querySelector('#' + id);
      el?.scrollIntoView({ behavior: 'smooth' });
    }, s.id);
    await page.waitForTimeout(1400);

    const check = await page.evaluate((id) => {
      const root = document.querySelector('[data-theme-wrapper="forkfolio"]');
      const sec = root?.querySelector('#' + id);
      const prompt = sec?.querySelector('[data-terminal-prompt]');
      const cmd = prompt?.querySelector('.ff-term-cmd')?.textContent?.trim();
      const state = sec?.getAttribute('data-terminal-state');
      const outputVisible = sec?.querySelector('.ff-term-output') ? window.getComputedStyle(sec.querySelector('.ff-term-output')).opacity : null;

      // Check for progress bar in projects
      const progBar = sec?.querySelector('.ff-term-prog-bar');
      const progWidth = progBar ? progBar.style.width : null;

      return {
        id,
        state,
        cmd,
        outputOpacity: outputVisible,
        progWidth
      };
    }, s.id);

    console.log(`Section #${s.id} check:`, check);
  }

  // Check footer exit sequence
  await page.evaluate(() => {
    const root = document.querySelector('[data-theme-wrapper="forkfolio"]');
    root?.querySelector('footer')?.scrollIntoView({ behavior: 'smooth' });
  });
  await page.waitForTimeout(800);
  const footerCheck = await page.evaluate(() => {
    const root = document.querySelector('[data-theme-wrapper="forkfolio"]');
    const footer = root?.querySelector('footer');
    const exitCmd = footer?.querySelector('[data-command="exit"] .ff-term-cmd')?.textContent?.trim();
    const logoutText = footer?.querySelector('.ff-term-output')?.textContent?.trim();
    return { exitCmd, logoutText };
  });
  console.log('Footer check:', footerCheck);

  await page.screenshot({ path: 'tmp/screenshots/modern-mono-terminal-full-1440.png', fullPage: true });
  console.log('Saved tmp/screenshots/modern-mono-terminal-full-1440.png');
  await page.close();

  // === TEST 2: Multi-Resolution Screen Captures ===
  console.log('\n=== TEST 2: Multi-Resolution Validation ===');
  for (const res of resolutions) {
    const resPage = await browser.newPage({ viewport: { width: res.width, height: res.height } });
    await resPage.goto('http://localhost:4321/?preview=forkfolio', { waitUntil: 'networkidle' });
    await resPage.waitForTimeout(800);
    await resPage.screenshot({ path: `tmp/screenshots/modern-mono-terminal-${res.name}.png`, fullPage: true });
    console.log(`Saved tmp/screenshots/modern-mono-terminal-${res.name}.png`);
    await resPage.close();
  }

  // === TEST 3: Reduced Motion Check ===
  console.log('\n=== TEST 3: Reduced Motion Mode ===');
  const rmContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce'
  });
  const rmPage = await rmContext.newPage();
  await rmPage.goto('http://localhost:4321/?preview=forkfolio', { waitUntil: 'networkidle' });
  await rmPage.waitForTimeout(500);

  const rmCheck = await rmPage.evaluate(() => {
    const secStates = Array.from(document.querySelectorAll('[data-terminal-section]')).map(el => ({
      id: el.id,
      state: el.getAttribute('data-terminal-state')
    }));
    return secStates;
  });
  console.log('Reduced motion section states (all should be completed immediately):', rmCheck);
  await rmContext.close();

  // === TEST 4: Regression Check on Knight ===
  console.log('\n=== TEST 4: Knight Theme Health Check ===');
  const knPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await knPage.goto('http://localhost:4321/?preview=knight', { waitUntil: 'networkidle' });
  await knPage.waitForTimeout(1500);

  const knCheck = await knPage.evaluate(() => {
    return {
      root: Boolean(document.querySelector('[data-kn-root]')),
      nav: Boolean(document.querySelector('.kn-nav')),
      stage: Boolean(document.querySelector('[data-kn-fig]')),
    };
  });
  console.log('Knight check:', knCheck);
  await knPage.close();

  await browser.close();

  console.log(`\nCompleted with ${consoleErrors.length} console errors.`);
}

main().catch(console.error);
