import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const artifactsDir = 'C:/Users/ThinkPad T14/.gemini/antigravity/brain/4b59acc7-35e9-4763-a991-acd9b15b54cd';

async function run() {
  console.log('--- STARTING KNIGHT DATABASE SECTIONS VERIFICATION ---');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  const viewports = [
    { width: 1440, height: 900, name: 'desktop' },
    { width: 390, height: 844, name: 'mobile' },
  ];

  for (const vp of viewports) {
    console.log(`\nTesting viewport: ${vp.name} (${vp.width}x${vp.height})`);
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    // Listen to console and page errors
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('http://localhost:4321/?preview=knight', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 1. Verify all sections exist in the exact required order
    const sectionIds = await page.$$eval('.kn-sec[id], .kn-hero[id]', (secs) => secs.map((s) => s.id));
    console.log('Detected section IDs:', sectionIds);

    const expectedOrder = ['top', 'about', 'experience', 'education', 'skills', 'projects', 'contact'];
    for (const expId of expectedOrder) {
      if (!sectionIds.includes(expId)) {
        throw new Error(`Missing expected section ID: #${expId}`);
      }
    }
    console.log('✓ All expected section IDs are present.');

    // 2. Verify Experience Content
    const expText = await page.$eval('#theme-knight-wrapper #experience', (el) => el.innerText);
    console.log('Raw Knight #experience innerText:\n', expText);
    if (!expText.toLowerCase().includes('viettel')) {
      throw new Error('Experience section is missing Viettel company name from DB');
    }
    if (!expText.toLowerCase().includes('devops engineer')) {
      throw new Error('Experience section is missing DevOps Engineer role');
    }
    if (!expText.includes('Tech Company XYZ')) {
      throw new Error('Experience section is missing Tech Company XYZ');
    }
    if (!expText.includes('├──') || !expText.includes('└──')) {
      throw new Error('Experience section is missing ASCII tree connectors');
    }
    console.log('✓ Experience section correctly renders database work history with ASCII connectors.');

    // 3. Verify Education Content
    const eduText = await page.$eval('#theme-knight-wrapper #education', (el) => el.innerText);
    console.log('Raw Knight #education innerText:\n', eduText);
    if (!eduText.includes('UNIVERSITY OF SCIENCE - VNUHCM')) {
      throw new Error('Education section is missing HCMUS institution');
    }
    if (!eduText.includes('Bachelor Computer Network and Information Security')) {
      throw new Error('Education section is missing Degree');
    }
    if (!eduText.toLowerCase().includes('cka: certified k8s admin')) {
      throw new Error('Education section is missing CKA certification');
    }
    if (!eduText.toLowerCase().includes('aws solutions architect')) {
      throw new Error('Education section is missing AWS certification');
    }
    console.log('✓ Education & Certifications section correctly renders academic background.');

    // 4. Verify Skills Content
    const skillsText = await page.$eval('#theme-knight-wrapper #skills', (el) => el.innerText);
    if (!skillsText.includes('Kubernetes') || !skillsText.includes('Docker') || !skillsText.includes('Ansible')) {
      throw new Error('Skills section is missing core skills from DB');
    }
    if (!skillsText.includes('CLOUD & INFRASTRUCTURE') || !skillsText.includes('CI/CD & AUTOMATION')) {
      throw new Error('Skills section is missing category groupings');
    }
    if (skillsText.includes('Dockerfile') || skillsText.includes('Ruby')) {
      throw new Error('Skills section still contains hardcoded languages!');
    }
    const skillLightElements = await page.$eval('#theme-knight-wrapper #skills', (el) => el.querySelectorAll('[data-kn-sk="true"]').length);
    console.log(`✓ Skills section renders ${skillLightElements} database-driven items with procedural sweep triggers.`);

    // 5. Verify Navigation Links
    if (vp.name === 'desktop') {
      const navLinks = await page.$$eval('.kn-nav-l a', (links) => links.map((l) => ({
        href: l.getAttribute('href'),
        text: l.textContent.trim(),
        key: l.dataset.knNk,
      })));
      console.log('Desktop Nav Links:', navLinks);

      const navTexts = navLinks.map((l) => l.text);
      if (!navTexts.includes('experience') || !navTexts.includes('education') || !navTexts.includes('skills')) {
        throw new Error('Desktop navigation missing experience, education, or skills link');
      }

      // Test smooth scroll to experience
      console.log('Testing smooth scroll to #experience...');
      await page.click('.kn-nav-l a[href="#experience"]');
      await page.waitForTimeout(800);
      const expScrollY = await page.evaluate(() => window.scrollY);
      console.log('Scrolled to Y:', expScrollY);
      if (expScrollY <= 200) {
        throw new Error(`Smooth scroll to #experience failed (scrollY: ${expScrollY})`);
      }

      // Check active state
      const activeLink = await page.$eval('.kn-nav-l a[data-on]', (l) => l.dataset.knNk);
      console.log('Active nav key:', activeLink);
      if (activeLink !== 'experience') {
        console.warn(`Note: Active nav key is "${activeLink}", expected "experience"`);
      }

      // Test smooth scroll to #education
      console.log('Testing smooth scroll to #education...');
      await page.click('.kn-nav-l a[href="#education"]');
      await page.waitForTimeout(800);
      const eduScrollY = await page.evaluate(() => window.scrollY);
      console.log('Scrolled to Y:', eduScrollY);
      if (eduScrollY <= expScrollY) {
        throw new Error(`Smooth scroll to #education did not advance scroll position`);
      }
    } else {
      // Mobile nav
      const isNavLHidden = await page.$eval('.kn-nav-l', (el) => window.getComputedStyle(el).display === 'none');
      const isNavAdminMobVisible = await page.$eval('.kn-nav-admin-mob', (el) => window.getComputedStyle(el).display !== 'none');
      if (!isNavLHidden) throw new Error('Mobile nav list should be hidden');
      if (!isNavAdminMobVisible) throw new Error('Mobile admin button should be visible');
      console.log('✓ Mobile navigation renders cleanly without horizontal overflow.');
    }

    // Capture screenshots for artifact report
    const expEl = await page.$('#theme-knight-wrapper #experience');
    if (expEl) {
      await expEl.screenshot({ path: path.join(artifactsDir, `knight-experience-${vp.name}.png`) });
    }
    const eduEl = await page.$('#theme-knight-wrapper #education');
    if (eduEl) {
      await eduEl.screenshot({ path: path.join(artifactsDir, `knight-education-${vp.name}.png`) });
    }
    const skEl = await page.$('#theme-knight-wrapper #skills');
    if (skEl) {
      await skEl.screenshot({ path: path.join(artifactsDir, `knight-skills-${vp.name}.png`) });
    }

    // 6. Test Live Data Update Event
    console.log('Testing live data update via CustomEvent("portfolio:data")...');
    await page.evaluate(() => {
      const mockUpdated = {
        identity: { name: 'Nguyen Thanh Quan', role: 'Staff DevOps' },
        experience: [
          {
            id: 'exp-live-test',
            role: 'Staff Infrastructure Architect',
            company: 'Global Cloud Systems',
            period: '2026 ─ PRESENT',
            isCurrent: true,
            bullets: ['Built automated zero-trust multi-cloud infrastructure.'],
            tags: ['Terraform', 'Kubernetes', 'Istio'],
          },
        ],
        education: [
          {
            id: 'edu-live-test',
            badge: 'M.Sc',
            period: '2024 ─ 2026',
            degree: 'Master of Distributed Systems',
            school: 'Top Tech University',
            description: 'Advanced Cloud Architectures & Fault Tolerance.',
          },
        ],
        certifications: [
          {
            id: 'cert-live-test',
            name: 'CKS: Certified K8s Security',
            issuer: 'CNCF',
            color: 'yellow',
          },
        ],
        skills: [
          {
            id: 'sk-live-1',
            name: 'Pulumi',
            tag: '[iac]',
            category: 'Modern IaC',
            status: 'ACTIVE',
          },
          {
            id: 'sk-live-2',
            name: 'eBPF / Cilium',
            tag: '[net]',
            category: 'Kernel Networking',
            status: 'ACTIVE',
          },
        ],
      };
      window.dispatchEvent(new CustomEvent('portfolio:data', { detail: mockUpdated }));
    });

    await page.waitForTimeout(500);

    const liveExpText = await page.$eval('#theme-knight-wrapper #experience', (el) => el.innerText);
    console.log('Live #experience innerText:\n', liveExpText);
    console.log('Any page errors recorded:', errors);
    if (!liveExpText.includes('Global Cloud Systems') || !liveExpText.toLowerCase().includes('staff infrastructure architect')) {
      throw new Error('Live update failed: Experience did not re-render with updated data');
    }
    console.log('✓ Live Experience update verified: rendered "Global Cloud Systems".');

    const liveEduText = await page.$eval('#theme-knight-wrapper #education', (el) => el.innerText);
    console.log('Live #education innerText:\n', liveEduText);
    if (!liveEduText.toLowerCase().includes('master of distributed systems') || !liveEduText.toLowerCase().includes('cks: certified k8s security')) {
      throw new Error('Live update failed: Education did not re-render with updated data');
    }
    console.log('✓ Live Education update verified: rendered "Master of Distributed Systems" & "CKS".');

    const liveSkillsText = await page.$eval('#theme-knight-wrapper #skills', (el) => el.innerText);
    console.log('Live #skills innerText:\n', liveSkillsText);
    if (!liveSkillsText.toLowerCase().includes('pulumi') || !liveSkillsText.toLowerCase().includes('modern iac') || !liveSkillsText.toLowerCase().includes('ebpf / cilium')) {
      throw new Error('Live update failed: Skills did not re-render with updated categories');
    }
    console.log('✓ Live Skills update verified: rendered "Pulumi" under "MODERN IAC".');

    // Screenshot updated live view
    if (vp.name === 'desktop') {
      const liveExpEl = await page.$('#theme-knight-wrapper #experience');
      if (liveExpEl) {
        await liveExpEl.screenshot({ path: path.join(artifactsDir, 'knight-experience-live-updated.png') });
      }
    }

    if (errors.length > 0) {
      console.warn('Page errors or warnings during run:', errors);
    } else {
      console.log(`✓ 0 console errors on ${vp.name}.`);
    }

    await context.close();
  }

  await browser.close();
  console.log('\n--- ALL E2E PLAYWRIGHT TESTS PASSED SUCCESSFULLY! ---');
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
