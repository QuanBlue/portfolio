import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  
  const viewports = [
    { name: '1920', width: 1920, height: 1080 },
    { name: '1440', width: 1440, height: 900 },
    { name: '768', width: 768, height: 1024 },
    { name: '390', width: 390, height: 844 },
  ];

  const results = {
    titles: {},
    nav: {},
    databaseSourcing: {},
    consoleErrors: [],
  };

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        results.consoleErrors.push(`[${vp.name}] ${msg.text()}`);
      }
    });

    console.log(`Testing viewport ${vp.name} (${vp.width}x${vp.height})...`);
    await page.goto('http://localhost:4321/?preview=knight', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // 1. Inspect Project Titles
    const projectInfo = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.kn-p'));
      return cards.map((c) => {
        const h3 = c.querySelector('h3.kn-pn');
        const desc = c.querySelector('.kn-desc');
        const idx = c.querySelector('.kn-idx');
        const meta = c.querySelector('.kn-meta');
        return {
          title: h3?.textContent?.trim(),
          dataLd: h3?.getAttribute('data-ld'),
          dataLm: h3?.getAttribute('data-lm'),
          style: h3?.getAttribute('style'),
          fontSize: h3 ? getComputedStyle(h3).fontSize : null,
          height: h3 ? getComputedStyle(h3).height : null,
          width: h3 ? getComputedStyle(h3).width : null,
          rect: h3 ? h3.getBoundingClientRect() : null,
          desc: desc?.textContent?.trim(),
          index: idx?.textContent?.trim(),
          meta: meta?.textContent?.trim(),
        };
      });
    });

    results.titles[vp.name] = projectInfo;
    const shotPath = path.resolve(`docs/themes/screenshots/local-knight-projects-${vp.name}.png`);
    
    // Scroll to projects section for screenshot
    await page.evaluate(() => {
      document.querySelector('#projects')?.scrollIntoView();
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: shotPath });

    await context.close();
  }

  // 2. Navigation tests at 1440x900
  {
    console.log('Testing header navigation and scroll offsets...');
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('http://localhost:4321/?preview=knight', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const navTargets = ['about', 'projects', 'skills', 'contact'];
    const navTests = {};

    for (const target of navTargets) {
      await page.click(`.kn-nav a[href="#${target}"]`);
      await page.waitForTimeout(600);

      const navState = await page.evaluate((t) => {
        const sec = document.getElementById(t);
        const rect = sec ? sec.getBoundingClientRect() : null;
        const link = document.querySelector(`.kn-nav a[href="#${t}"]`);
        const navHere = document.querySelector('.kn-nav-here');
        return {
          target: t,
          urlHash: location.hash,
          sectionTop: rect ? Math.round(rect.top) : null,
          isUnderHeader: rect ? rect.top < 0 : null,
          isActive: link ? link.hasAttribute('data-on') : false,
          navHereText: navHere ? navHere.textContent : null,
        };
      }, target);

      navTests[target] = navState;
    }

    // Test Admin Link
    const adminLink = await page.evaluate(() => {
      const a = document.querySelector('.kn-nav a.kn-nav-admin');
      return {
        href: a?.getAttribute('href'),
        title: a?.getAttribute('title'),
      };
    });
    navTests['admin'] = adminLink;

    results.nav = navTests;
    await context.close();
  }

  // 3. Database Sourcing & Admin Live Edit Simulation
  {
    console.log('Testing database sourcing and Admin live publish simulation...');
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('http://localhost:4321/?preview=knight', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const initialSourceCheck = await page.evaluate(() => {
      const titles = Array.from(document.querySelectorAll('.kn-p .kn-pn')).map((el) => el.textContent?.trim());
      const moreProjects = Array.from(document.querySelectorAll('.kn-more .kn-row-n')).map((el) => el.textContent?.trim());
      return {
        initialFeaturedTitles: titles,
        moreProjectsCount: moreProjects.length,
        hasGithubDiscoveries: moreProjects.includes('Vagrant Virtualbox') || titles.includes('Chat Grpc'),
      };
    });

    results.databaseSourcing.initial = initialSourceCheck;

    // Simulate Admin Save & Publish with new curated project & edited description
    const liveUpdateCheck = await page.evaluate(() => {
      const updatedData = {
        identity: {
          name: 'Nguyễn Thanh Quân',
          role: 'DevOps & Cloud Architect',
          bio: 'Curated bio updated from Admin Settings.',
          location: 'Ho Chi Minh City, Vietnam',
        },
        projects: [
          {
            id: 'p-1',
            title: 'ansible-airgap-k8s',
            shortDesc: 'Automated offline Kubernetes cluster deployment with Ansible.',
            tags: ['Ansible', 'Kubernetes'],
            link: 'https://github.com/QuanBlue/ansible-airgap-k8s',
          },
          {
            id: 'p-2',
            title: 'harbor-registry-ha',
            shortDesc: 'High-availability private container registry with replication.',
            tags: ['Docker', 'Harbor'],
            link: 'https://github.com/QuanBlue/harbor-registry',
          },
        ],
      };

      window.dispatchEvent(new CustomEvent('portfolio:data', { detail: updatedData }));

      const cards = Array.from(document.querySelectorAll('.kn-p'));
      return {
        updatedCardCount: cards.filter((c) => c.style.display !== 'none').length,
        firstTitle: cards[0]?.querySelector('.kn-pn')?.textContent?.trim(),
        firstLd: cards[0]?.querySelector('.kn-pn')?.getAttribute('data-ld'),
        firstKd: cards[0]?.querySelector('.kn-pn')?.style.getPropertyValue('--kd'),
        firstDesc: cards[0]?.querySelector('.kn-desc')?.textContent?.trim(),
        secondTitle: cards[1]?.querySelector('.kn-pn')?.textContent?.trim(),
        secondLd: cards[1]?.querySelector('.kn-pn')?.getAttribute('data-ld'),
        secondKd: cards[1]?.querySelector('.kn-pn')?.style.getPropertyValue('--kd'),
        secondDesc: cards[1]?.querySelector('.kn-desc')?.textContent?.trim(),
      };
    });

    results.databaseSourcing.liveUpdate = liveUpdateCheck;
    await context.close();
  }

  await browser.close();

  console.log('\n=== TEST RESULTS SUMMARY ===');
  console.log('1. Titles across viewports:');
  for (const [vp, list] of Object.entries(results.titles)) {
    console.log(`  [${vp}]: ${list.length} projects`);
    list.forEach((p, i) => {
      console.log(`    Project ${i + 1}: "${p.title}" | ld: "${p.dataLd?.replace(/\n/g, '\\n')}" | lm: "${p.dataLm?.replace(/\n/g, '\\n')}" | style: ${p.style} | font: ${p.fontSize}`);
    });
  }

  console.log('\n2. Navigation Tests:');
  console.log(JSON.stringify(results.nav, null, 2));

  console.log('\n3. Database Sourcing:');
  console.log(JSON.stringify(results.databaseSourcing, null, 2));

  console.log('\n4. Console Errors:', results.consoleErrors.length === 0 ? 'None (0 errors)' : results.consoleErrors);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
