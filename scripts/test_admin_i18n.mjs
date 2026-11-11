import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/ThinkPad T14/.gemini/antigravity/brain/4b59acc7-35e9-4763-a991-acd9b15b54cd';

async function run() {
  console.log('Testing Admin Bilingual Editor...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:4321/admin?tab=identity', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Check bilingual switcher exists
  const hasLangToggle = await page.$('#admin-locale-toggle');
  console.log('Admin language toggle exists:', Boolean(hasLangToggle));
  if (!hasLangToggle) {
    throw new Error('Admin language toggle not found!');
  }

  // Check English field values
  const roleInputEn = await page.$eval('input[data-path="identity.role"]', (el) => el.value);
  console.log('Admin EN role value:', roleInputEn);
  if (roleInputEn !== 'DevOps Engineer') {
    throw new Error(`Expected "DevOps Engineer", got "${roleInputEn}"`);
  }

  // Switch to Vietnamese
  console.log('Switching Admin editor to Vietnamese (VI)...');
  await page.click('button[data-admin-lang="vi"]');
  await page.waitForTimeout(500);

  // Check Vietnamese field values and placeholder fallback
  const roleInputVi = await page.$eval('input[data-path="identity.role_vi"]', (el) => el.value);
  const rolePlaceholderVi = await page.$eval('input[data-path="identity.role_vi"]', (el) => el.placeholder);
  console.log('Admin VI role value:', roleInputVi, '| Placeholder:', rolePlaceholderVi);

  if (roleInputVi !== 'Kỹ sư DevOps') {
    throw new Error(`Expected "Kỹ sư DevOps", got "${roleInputVi}"`);
  }
  if (!rolePlaceholderVi.includes('DevOps Engineer')) {
    throw new Error(`Expected placeholder to contain English fallback "DevOps Engineer", got "${rolePlaceholderVi}"`);
  }

  // Check note banner
  const noteText = await page.$eval('#admin-note', (el) => el.innerText.trim());
  console.log('Admin guidance note:', noteText);

  // Save screenshot
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin-bilingual-editor.png') });
  console.log('Saved admin-bilingual-editor.png');

  await browser.close();
  console.log('🎉 ADMIN BILINGUAL EDITOR TEST PASSED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
