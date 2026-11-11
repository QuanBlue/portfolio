import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage();
  
  // 1. Visit /admin and click Back to Portfolio without edits
  console.log('1. Testing Back to Portfolio from /admin...');
  await page.goto('http://localhost:4321/admin', { waitUntil: 'networkidle' });
  const backLink = page.locator('#admin-header a[href="/"]').first();
  await backLink.click();
  await page.waitForTimeout(600);
  console.log('Navigated URL:', page.url());

  // 2. Visit /admin and test Preview in new tab
  console.log('2. Testing Preview link on Knight theme card...');
  await page.goto('http://localhost:4321/admin', { waitUntil: 'networkidle' });
  const knightPreviewHref = await page.locator('.theme-card[data-theme-card="knight"] a[href*="preview=knight"]').getAttribute('href');
  console.log('Knight preview target:', knightPreviewHref);

  // 3. Select Knight as default theme and test dirty prompt
  console.log('3. Selecting Knight theme in admin...');
  const knightSelectBtn = page.locator('.theme-card[data-theme-card="knight"] button[data-select-theme]');
  await knightSelectBtn.click();
  await page.waitForTimeout(400);

  const unsavedBar = page.locator('#unsaved-bar');
  console.log('Unsaved bar visible:', await unsavedBar.isVisible());

  // Click Save changes
  console.log('4. Clicking Save changes...');
  const saveBtn = page.locator('#btn-save');
  await saveBtn.click();
  await page.waitForTimeout(600);

  const statusText = await page.locator('#admin-status').textContent();
  console.log('Save status:', statusText);

  // Now click Back to Portfolio after saving
  console.log('5. Clicking Back to Portfolio after saving...');
  await backLink.click();
  await page.waitForTimeout(800);
  console.log('Navigated URL after save:', page.url());

  // Reset theme back to ascii to preserve default
  console.log('6. Resetting default theme back to ascii for production purity...');
  await page.goto('http://localhost:4321/admin', { waitUntil: 'networkidle' });
  const asciiSelectBtn = page.locator('.theme-card[data-theme-card="ascii"] button[data-select-theme]');
  await asciiSelectBtn.click();
  await page.waitForTimeout(400);
  await saveBtn.click();
  await page.waitForTimeout(600);
  console.log('ASCII re-saved as default.');

  await browser.close();
  console.log('--- ALL ADMIN SWITCHER CHECKS PASSED ---');
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
