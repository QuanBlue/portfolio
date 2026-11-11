import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/ThinkPad T14/.gemini/antigravity/brain/4b59acc7-35e9-4763-a991-acd9b15b54cd';

async function run() {
  console.log('Launching browser with system Chrome...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  // Test 1: First-time visitor default English check
  console.log('--- TEST 1: First-time visitor default (en) ---');
  await page.goto('http://localhost:4321/?preview=knight', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  console.log('HTML lang attribute:', htmlLang);
  if (htmlLang !== 'en') {
    throw new Error(`Expected html.lang to be "en", but got "${htmlLang}"`);
  }

  const enBtnActive = await page.$eval('.kn-lang-btn[data-lang="en"]', (el) => el.dataset.active);
  const viBtnActive = await page.$eval('.kn-lang-btn[data-lang="vi"]', (el) => el.dataset.active);
  console.log('EN button active:', enBtnActive, '| VI button active:', viBtnActive);
  if (enBtnActive !== 'true' || viBtnActive !== 'false') {
    throw new Error(`Expected EN button active=true and VI active=false, but got EN=${enBtnActive}, VI=${viBtnActive}`);
  }

  // Check Knight nav items
  const knightNavText = await page.$eval('.kn-nav-l', (el) => el.innerText.replace(/\s+/g, ' ').trim());
  console.log('Knight desktop nav text:', knightNavText);
  if (!knightNavText.includes('about') || !knightNavText.includes('EN') || !knightNavText.includes('VI') || !knightNavText.includes('admin ⚙')) {
    throw new Error(`Unexpected Knight nav content: ${knightNavText}`);
  }

  // Check English content on page
  const roleText = await page.$eval('#theme-knight-wrapper .kn-role', (el) => el.innerText.trim());
  console.log('Knight role text in EN:', roleText);
  if (!roleText.includes('DevOps')) {
    throw new Error(`Expected role to contain DevOps, got ${roleText}`);
  }

  // Take screenshot of English Knight desktop
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'knight-i18n-en-desktop.png') });
  console.log('Saved knight-i18n-en-desktop.png');

  // Test 2: In-place switch to Vietnamese (VI)
  console.log('--- TEST 2: In-place switch to Vietnamese (VI) ---');
  // Mark window to verify no page reload occurred
  await page.evaluate(() => { (window).__test_no_reload = 999; });

  // Click VI
  await page.click('.kn-nav-l .kn-lang-btn[data-lang="vi"]');
  await page.waitForTimeout(800);

  // Check window marker still exists
  const noReload = await page.evaluate(() => (window).__test_no_reload);
  console.log('No reload marker preserved:', noReload === 999);
  if (noReload !== 999) {
    throw new Error('Page reloaded unexpectedly when switching language!');
  }

  const htmlLangVi = await page.evaluate(() => document.documentElement.lang);
  const storedLocale = await page.evaluate(() => localStorage.getItem('portfolio-locale'));
  console.log('HTML lang after VI switch:', htmlLangVi, '| Stored locale:', storedLocale);
  if (htmlLangVi !== 'vi' || storedLocale !== 'vi') {
    throw new Error(`Expected vi locale, got html.lang=${htmlLangVi}, localStorage=${storedLocale}`);
  }

  const viBtnActiveNow = await page.$eval('.kn-lang-btn[data-lang="vi"]', (el) => el.dataset.active);
  console.log('VI button active now:', viBtnActiveNow);
  if (viBtnActiveNow !== 'true') {
    throw new Error('VI button was not marked active');
  }

  // Check Knight nav translated to Vietnamese
  const knightNavVi = await page.$eval('.kn-nav-l', (el) => el.innerText.replace(/\s+/g, ' ').trim());
  console.log('Knight desktop nav text in VI:', knightNavVi);
  if (!knightNavVi.includes('giới thiệu') || !knightNavVi.includes('kinh nghiệm') || !knightNavVi.includes('học vấn')) {
    throw new Error(`Expected Vietnamese nav links in Knight, got: ${knightNavVi}`);
  }

  // Check Knight role translated
  const roleTextVi = await page.$eval('#theme-knight-wrapper .kn-role', (el) => el.innerText.trim());
  console.log('Knight role text in VI:', roleTextVi);
  if (!roleTextVi.includes('Kỹ sư DevOps')) {
    throw new Error(`Expected role to contain "Kỹ sư DevOps", got ${roleTextVi}`);
  }

  // Check Knight experience badge
  const expBadge = await page.$eval('#theme-knight-wrapper .kn-exp-badge', (el) => el.innerText.trim());
  console.log('Knight experience current badge in VI:', expBadge);
  if (expBadge !== '[HIỆN TẠI]') {
    throw new Error(`Expected "[HIỆN TẠI]", got "${expBadge}"`);
  }

  // Check Knight contact form translated
  const contactHeading = await page.$eval('#theme-knight-wrapper .kn-end-box .kn-k', (el) => el.innerText.trim());
  const submitBtnText = await page.$eval('#theme-knight-wrapper #knight-contact-form button[type="submit"]', (el) => el.innerText.trim());
  console.log('Contact prompt in VI:', contactHeading, '| Submit button:', submitBtnText);
  if (!contactHeading.includes('Quân') || submitBtnText.toLowerCase() !== 'gửi tin nhắn') {
    throw new Error(`Contact strings not properly translated: heading="${contactHeading}", button="${submitBtnText}"`);
  }

  // Take screenshot of Vietnamese Knight desktop
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'knight-i18n-vi-desktop.png') });
  console.log('Saved knight-i18n-vi-desktop.png');

  // Test 3: Persistence on page reload
  console.log('--- TEST 3: Persistence on page reload ---');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const reloadedLang = await page.evaluate(() => document.documentElement.lang);
  console.log('HTML lang after reload:', reloadedLang);
  if (reloadedLang !== 'vi') {
    throw new Error(`Expected html.lang="vi" after reload, got "${reloadedLang}"`);
  }

  // Test 4: Switching to ASCII theme and checking Vietnamese header & content
  console.log('--- TEST 4: Theme switching preserves locale (ASCII theme) ---');
  await page.goto('http://localhost:4321/?preview=ascii', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const asciiLang = await page.evaluate(() => document.documentElement.lang);
  const asciiNavAbout = await page.$eval('#nav-list .nav-link[data-section="about"]', (el) => el.innerText.trim());
  const asciiAdmin = await page.$eval('#hdr-admin-label', (el) => el.innerText.trim());
  console.log('ASCII theme lang:', asciiLang, '| Nav About:', asciiNavAbout, '| Admin label:', asciiAdmin);

  if (asciiNavAbout !== 'Giới thiệu' || asciiAdmin !== 'Quản trị') {
    throw new Error(`Expected Header in ASCII to be Vietnamese, got About="${asciiNavAbout}", Admin="${asciiAdmin}"`);
  }

  // Take screenshot of ASCII in Vietnamese
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ascii-i18n-vi-desktop.png') });
  console.log('Saved ascii-i18n-vi-desktop.png');

  // Test 5: Switch back to English
  console.log('--- TEST 5: Switch back to English (EN) ---');
  await page.click('#site-header .lang-btn[data-lang="en"]');
  await page.waitForTimeout(500);

  const backEnLang = await page.evaluate(() => document.documentElement.lang);
  const backEnNavAbout = await page.$eval('#nav-list .nav-link[data-section="about"]', (el) => el.innerText.trim());
  console.log('Back to EN lang:', backEnLang, '| Nav About:', backEnNavAbout);
  if (backEnLang !== 'en' || backEnNavAbout !== 'About') {
    throw new Error(`Expected English Header after click, got lang="${backEnLang}", About="${backEnNavAbout}"`);
  }

  // Test 6: Mobile viewport check in Knight theme
  console.log('--- TEST 6: Mobile viewport in Knight theme ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:4321/?preview=knight', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const mobLangSwitchVisible = await page.$eval('.kn-lang-switch-mob', (el) => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
  console.log('Mobile language switcher visible in Knight:', mobLangSwitchVisible);
  if (!mobLangSwitchVisible) {
    throw new Error('Mobile language switcher (.kn-lang-switch-mob) is not visible on mobile screen!');
  }

  // Click VI on mobile
  await page.click('.kn-lang-switch-mob .kn-lang-btn[data-lang="vi"]');
  await page.waitForTimeout(500);

  const mobLangAfterClick = await page.evaluate(() => document.documentElement.lang);
  console.log('HTML lang after mobile VI switch:', mobLangAfterClick);
  if (mobLangAfterClick !== 'vi') {
    throw new Error(`Expected "vi" after clicking on mobile, got "${mobLangAfterClick}"`);
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'knight-i18n-vi-mobile.png') });
  console.log('Saved knight-i18n-vi-mobile.png');

  await browser.close();
  console.log('🎉 ALL PLAYWRIGHT E2E i18n TESTS PASSED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
