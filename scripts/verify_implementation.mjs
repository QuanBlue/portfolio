import { chromium } from 'playwright';

async function verify() {
  console.log('--- STARTING PLAYWRIGHT VERIFICATION ---');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Visit http://localhost:4321/?preview=knight
  console.log('1. Navigating to http://localhost:4321/?preview=knight ...');
  await page.goto('http://localhost:4321/?preview=knight', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check theme wrapper visibility
  const knightWrapperVisible = await page.locator('#theme-knight-wrapper').isVisible();
  console.log('Knight wrapper visible:', knightWrapperVisible);

  // Check kn-nav admin links
  const desktopAdminLink = await page.locator('.kn-nav-admin').first();
  const desktopAdminVisible = await desktopAdminLink.isVisible();
  const adminHref = await desktopAdminLink.getAttribute('href');
  console.log('Desktop admin link visible:', desktopAdminVisible, 'href:', adminHref);

  // Check floating cursor
  const floatingCur = await page.locator('.kn-cur-floating').count();
  console.log('Floating cursor element created:', floatingCur > 0);

  // Scroll down to trigger character scrambles & section reveals
  console.log('2. Scrolling page to trigger scramble and scroll reveals...');
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 1600));
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 2400));
  await page.waitForTimeout(600);

  // Check scrambled headings with data-f
  const scrambledHeadings = await page.locator('.kn-asc[data-f]').count();
  console.log('Headings resolved with data-f attribute:', scrambledHeadings);

  // Check GitHub activity heatmap cell hover tooltip
  console.log('3. Testing heatmap cell tooltip...');
  const firstCalCell = page.locator('.kn-cal-cell').nth(10);
  if (await firstCalCell.count() > 0) {
    await firstCalCell.hover();
    await page.waitForTimeout(300);
    const tooltip = page.locator('.kn-tooltip');
    const tooltipVisible = await tooltip.isVisible();
    const tooltipText = await tooltip.textContent();
    console.log('Heatmap tooltip visible on hover:', tooltipVisible, 'Text:', tooltipText);
  }

  // Check magnetic button
  const magneticBtn = page.locator('button[data-magnetic="10"]');
  const hasMagnetic = await magneticBtn.count() > 0;
  console.log('Magnetic submit button exists:', hasMagnetic);

  // Capture updated local screenshots
  console.log('4. Capturing local screenshots for visual validation...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/themes/screenshots/local-desktop-knight-top.png' });

  await page.evaluate(() => {
    const el = document.getElementById('projects');
    if (el) el.scrollIntoView();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/themes/screenshots/local-desktop-knight-projects.png' });

  await page.evaluate(() => {
    const el = document.getElementById('activity');
    if (el) el.scrollIntoView();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/themes/screenshots/local-desktop-knight-activity.png' });

  // 5. Test Mobile Navigation & Admin icon
  console.log('5. Testing mobile viewport (390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  const mobAdminVisible = await page.locator('.kn-nav-admin-mob').isVisible();
  console.log('Mobile admin gear visible in header:', mobAdminVisible);
  await page.screenshot({ path: 'docs/themes/screenshots/local-mobile-knight-top.png' });

  // 6. Test Admin Dashboard
  console.log('6. Testing /admin navigation and Theme Switcher...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:4321/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Check "Back to Portfolio" link
  const backLinks = await page.locator('a[href="/"]').all();
  console.log('Found Back to Portfolio links:', backLinks.length);
  const backVisible = await backLinks[0]?.isVisible();
  console.log('First Back link visible:', backVisible);

  // Check Appearance tab / Theme cards
  const themeCards = await page.locator('.theme-card').count();
  console.log('Theme cards count in admin:', themeCards);

  const activeCard = await page.locator('.theme-card[data-theme-card="ascii"] .theme-card-badge').textContent();
  console.log('ASCII card badge text:', activeCard?.trim());

  const knightPreviewLink = await page.locator('.theme-card[data-theme-card="knight"] a[href*="preview=knight"]').getAttribute('href');
  console.log('Knight preview link href:', knightPreviewLink);

  await page.screenshot({ path: 'docs/themes/screenshots/local-admin-themes.png' });

  console.log('--- VERIFICATION COMPLETED SUCCESSFULLY ---');
  await browser.close();
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
