import { chromium } from 'playwright';
import fs from 'fs';

async function main() {
  fs.mkdirSync('tmp/screenshots', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const viewports = [
    { width: 1440, height: 900, name: 'desktop-1440' },
    { width: 390, height: 844, name: 'mobile-390' },
  ];

  let allPassed = true;

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`Testing Targeted Fixes on ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.goto('http://localhost:4321/?preview=forkfolio', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(600);

    // 1. Verify 3 Surface Layers
    const layers = await page.evaluate(() => {
      const header = document.getElementById('forkfolio-header');
      const viewport = document.getElementById('ff-terminal-viewport');
      const status = document.getElementById('ff-terminal-status-bar');

      const hStyle = header ? window.getComputedStyle(header) : null;
      const vStyle = viewport ? window.getComputedStyle(viewport) : null;
      const sStyle = status ? window.getComputedStyle(status) : null;

      return {
        header: {
          bg: hStyle?.backgroundColor,
          borderBottomWidth: hStyle?.borderBottomWidth,
          boxShadow: hStyle?.boxShadow,
          zIndex: hStyle?.zIndex,
        },
        viewport: {
          bg: vStyle?.backgroundColor,
          backdropFilter: vStyle?.backdropFilter || vStyle?.webkitBackdropFilter,
          hasBackgroundImage: (vStyle?.backgroundImage || '').includes('radial-gradient'),
        },
        status: {
          bg: sStyle?.backgroundColor,
          borderTopWidth: sStyle?.borderTopWidth,
          boxShadow: sStyle?.boxShadow,
          zIndex: sStyle?.zIndex,
        },
      };
    });

    console.log('Layer A (Top Header):', layers.header);
    console.log('Layer B (Content Viewport):', layers.viewport);
    console.log('Layer C (Bottom Status Rail):', layers.status);

    // 2. Initial state (Scroll = 0)
    const initialStatus = await page.evaluate(() => {
      const activeTab = document.querySelector('.ff-nav-tab.is-active')?.getAttribute('data-section');
      const sbMode = document.getElementById('ff-sb-section')?.textContent?.trim();
      const pct = document.getElementById('ff-sb-pct')?.textContent?.trim();
      const totalCells = document.querySelectorAll('.ff-seg-cell').length;
      const filledCells = document.querySelectorAll('.ff-seg-cell.is-filled').length;
      const leadingCells = document.querySelectorAll('.ff-seg-cell.is-leading').length;

      return { activeTab, sbMode, pct, totalCells, filledCells, leadingCells };
    });

    console.log('Initial State (Scroll 0):', initialStatus);

    if (initialStatus.activeTab !== 'top') {
      console.error(`FAIL: Initial active tab expected 'top', got '${initialStatus.activeTab}'`);
      allPassed = false;
    }

    // 3. Scroll to Projects
    await page.evaluate(() => {
      const root = document.querySelector('[data-theme-wrapper="forkfolio"]');
      const viewport = document.getElementById('ff-terminal-viewport');
      const proj = root?.querySelector('#projects');
      if (viewport && proj) {
        const top = proj.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop;
        viewport.scrollTo({ top: top + 10, behavior: 'instant' });
      }
    });
    await page.waitForTimeout(400);

    const projectsState = await page.evaluate(() => {
      const activeTab = document.querySelector('.ff-nav-tab.is-active')?.getAttribute('data-section');
      const sbMode = document.getElementById('ff-sb-section')?.textContent?.trim();
      const pct = document.getElementById('ff-sb-pct')?.textContent?.trim();
      const filledCells = document.querySelectorAll('.ff-seg-cell.is-filled').length;
      const leadingCells = document.querySelectorAll('.ff-seg-cell.is-leading').length;

      return { activeTab, sbMode, pct, filledCells, leadingCells };
    });

    console.log('Projects Section State:', projectsState);
    if (projectsState.activeTab !== 'projects') {
      console.error(`FAIL: Projects active tab expected 'projects', got '${projectsState.activeTab}'`);
      allPassed = false;
    }

    // 4. Scroll to Skills
    await page.evaluate(() => {
      const root = document.querySelector('[data-theme-wrapper="forkfolio"]');
      const viewport = document.getElementById('ff-terminal-viewport');
      const skills = root?.querySelector('#skills');
      if (viewport && skills) {
        const top = skills.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop;
        viewport.scrollTo({ top: top + 10, behavior: 'instant' });
      }
    });
    await page.waitForTimeout(400);

    const skillsState = await page.evaluate(() => {
      const activeTab = document.querySelector('.ff-nav-tab.is-active')?.getAttribute('data-section');
      const sbMode = document.getElementById('ff-sb-section')?.textContent?.trim();
      const pct = document.getElementById('ff-sb-pct')?.textContent?.trim();
      const filledCells = document.querySelectorAll('.ff-seg-cell.is-filled').length;

      return { activeTab, sbMode, pct, filledCells };
    });

    console.log('Skills Section State:', skillsState);
    if (skillsState.activeTab !== 'skills') {
      console.error(`FAIL: Skills active tab expected 'skills', got '${skillsState.activeTab}'`);
      allPassed = false;
    }

    // 5. Scroll to Bottom (Contact)
    await page.evaluate(() => {
      const viewport = document.getElementById('ff-terminal-viewport');
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'instant' });
      }
    });
    await page.waitForTimeout(400);

    const bottomState = await page.evaluate(() => {
      const activeTab = document.querySelector('.ff-nav-tab.is-active')?.getAttribute('data-section');
      const sbMode = document.getElementById('ff-sb-section')?.textContent?.trim();
      const pct = document.getElementById('ff-sb-pct')?.textContent?.trim();
      const totalCells = document.querySelectorAll('.ff-seg-cell').length;
      const filledCells = document.querySelectorAll('.ff-seg-cell.is-filled').length;

      return { activeTab, sbMode, pct, totalCells, filledCells };
    });

    console.log('Bottom State (100%):', bottomState);
    if (bottomState.activeTab !== 'contact') {
      console.error(`FAIL: Bottom active tab expected 'contact', got '${bottomState.activeTab}'`);
      allPassed = false;
    }
    if (bottomState.pct !== '100%') {
      console.error(`FAIL: Bottom pct expected '100%', got '${bottomState.pct}'`);
      allPassed = false;
    }

    // 6. Test Click Navigation to Experience
    if (vp.width >= 1024) {
      await page.click('a.ff-nav-tab[data-section="experience"]');
      await page.waitForTimeout(600);

      const clickState = await page.evaluate(() => {
        const activeTab = document.querySelector('.ff-nav-tab.is-active')?.getAttribute('data-section');
        const sbMode = document.getElementById('ff-sb-section')?.textContent?.trim();
        const pct = document.getElementById('ff-sb-pct')?.textContent?.trim();
        return { activeTab, sbMode, pct };
      });

      console.log('Click Nav to Experience State:', clickState);
      if (clickState.activeTab !== 'experience') {
        console.error(`FAIL: Click nav expected 'experience', got '${clickState.activeTab}'`);
        allPassed = false;
      }
    }

    // Capture screenshots for artifacts
    await page.screenshot({ path: `tmp/screenshots/targeted-fix-${vp.name}.png` });

    // 7. Light Mode Verification
    if (vp.width >= 1024) {
      console.log('\n--- Testing Light Mode ---');
      await page.click('#ff-color-mode-toggle');
      await page.waitForTimeout(400);

      const lightLayers = await page.evaluate(() => {
        const header = document.getElementById('forkfolio-header');
        const viewport = document.getElementById('ff-terminal-viewport');
        const status = document.getElementById('ff-terminal-status-bar');

        const hStyle = header ? window.getComputedStyle(header) : null;
        const vStyle = viewport ? window.getComputedStyle(viewport) : null;
        const sStyle = status ? window.getComputedStyle(status) : null;

        return {
          headerBg: hStyle?.backgroundColor,
          headerBorderBottom: hStyle?.borderBottomWidth,
          viewportBg: vStyle?.backgroundColor,
          viewportBackdrop: vStyle?.backdropFilter || vStyle?.webkitBackdropFilter,
          statusBg: sStyle?.backgroundColor,
          statusBorderTop: sStyle?.borderTopWidth,
          isDark: document.documentElement.classList.contains('dark'),
        };
      });

      console.log('Light Mode Surface Layers:', lightLayers);
      if (lightLayers.isDark) {
        console.error('FAIL: Expected light mode, html still has .dark class');
        allPassed = false;
      }
      await page.screenshot({ path: `tmp/screenshots/targeted-fix-light-${vp.name}.png` });
      // Switch back to dark
      await page.click('#ff-color-mode-toggle');
      await page.waitForTimeout(300);
    }

    if (consoleErrors.length > 0) {
      console.error('Console errors:', consoleErrors);
      allPassed = false;
    }

    await context.close();
  }

  await browser.close();

  if (!allPassed) {
    console.error('\nTARGETED FIX VERIFICATION FAILED!');
    process.exit(1);
  } else {
    console.log('\nALL TARGETED FIX VERIFICATIONS PASSED SUCCESSFULLY!');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
