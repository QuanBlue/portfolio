/**
 * Knight Theme Content Renderers & Layout Generators
 * Formats database-driven Experience, Education, and Skills into authentic ASCII trees and monospace layouts.
 * Shared between build-time SSR (Astro) and runtime live-updates (browser CustomEvent).
 */
import type { Certification, EducationItem, ExperienceItem, Skill } from '../../data/portfolio';
import { esc } from '../../lib/render';

export interface KnightSkillGroup {
  category: string;
  items: Skill[];
}

/**
 * Groups skills by their configured category.
 * If category is not set, extracts tag without brackets, or falls back to 'GENERAL'.
 * Preserves custom ordering as configured in Admin / Database.
 */
export function groupKnightSkills(skills: Skill[] = [], locale: 'en' | 'vi' = 'en'): KnightSkillGroup[] {
  const groups = new Map<string, { category: string; items: Skill[] }>();

  skills.forEach((s) => {
    let cat = (locale === 'vi' && s.category_vi ? s.category_vi : s.category || '').trim();
    if (!cat && s.tag) {
      const cleanTag = s.tag.replace(/^\[|\]$/g, '').trim();
      cat = cleanTag ? cleanTag : (locale === 'vi' ? 'Khác' : 'General');
    }
    if (!cat) cat = locale === 'vi' ? 'Khác' : 'General';
    const key = cat.toUpperCase();

    if (!groups.has(key)) {
      groups.set(key, { category: key, items: [] });
    }
    groups.get(key)!.items.push(s);
  });

  return Array.from(groups.values()).map((g) => ({
    category: g.category,
    items: g.items,
  }));
}

/**
 * Renders the Experience section as an authentic minimal vertical career timeline.
 * Example structure:
 * 2024 ─ PRESENT [CURRENT]
 * │
 * ├── DEVOPS ENGINEER
 * │   Company Name
 * │
 * │   • Quản lý infrastructure sizing...
 * │
 * │   Kubernetes · Docker · Terraform
 */
export function renderKnightExperience(items: ExperienceItem[] = [], locale: 'en' | 'vi' = 'en'): string {
  if (!items || items.length === 0) {
    const emptyMsg = locale === 'vi' ? '[ CHƯA CÓ KINH NGHIỆM ĐĂNG TẢI ]' : '[ NO PUBLISHED EXPERIENCE ]';
    return `<div class="kn-empty"><p class="kn-empty-txt">${emptyMsg}</p></div>`;
  }

  const badgeText = locale === 'vi' ? '[HIỆN TẠI]' : '[CURRENT]';

  return (
    `<div class="kn-tl-tree">` +
    items
      .map((exp, idx) => {
        const isLast = idx === items.length - 1;
        const period = esc((locale === 'vi' && exp.period_vi ? exp.period_vi : exp.period) || '');
        const currentBadge = exp.isCurrent ? `<span class="kn-tl-badge kn-exp-badge">${badgeText}</span>` : '';
        const role = esc((locale === 'vi' && exp.role_vi ? exp.role_vi : exp.role) || '');
        const company = esc(exp.company || '');
        const bullets = (locale === 'vi' && exp.bullets_vi && exp.bullets_vi.length > 0 ? exp.bullets_vi : exp.bullets) || [];
        const bulletsHtml =
          bullets.length > 0
            ? `<ul class="kn-tl-bullets kn-exp-bullets">${bullets.map((b) => `<li>• ${esc(b)}</li>`).join('')}</ul>`
            : '';
        const tagsHtml =
          exp.tags && exp.tags.length > 0
            ? `<div class="kn-tl-tags kn-exp-tags">${exp.tags.map((t) => esc(t)).join(' · ')}</div>`
            : '';

        return `
          <article class="kn-tl-item kn-exp-item" data-last="${isLast ? 'true' : 'false'}" data-kn-exp-item="${esc(exp.id)}">
            <div class="kn-tl-head kn-exp-head">
              <span class="kn-tl-date kn-exp-period">${period}</span>
              ${currentBadge}
            </div>
            <div class="kn-tl-body kn-exp-body">
              <div class="kn-tl-gutter" aria-hidden="true">
                <span class="sr-only">${isLast ? '└──' : '├──'}</span>
              </div>
              <div class="kn-tl-content kn-exp-content">
                <div class="kn-tl-title-wrap kn-exp-role-wrap">
                  <h3 class="kn-tl-title kn-exp-role">${role}</h3>
                  <div class="kn-tl-subtitle kn-exp-company">${company}</div>
                </div>
                <div class="kn-tl-details kn-exp-details">
                  ${bulletsHtml}
                  ${tagsHtml}
                </div>
              </div>
            </div>
          </article>
        `;
      })
      .join('') +
    `</div>`
  );
}

/**
 * Renders the Education section in aligned ASCII tree format.
 */
export function renderKnightEducation(
  education: EducationItem[] = [],
  certs: Certification[] = [],
  locale: 'en' | 'vi' = 'en',
): string {
  const hasEdu = education && education.length > 0;
  const hasCerts = certs && certs.length > 0;

  if (!hasEdu && !hasCerts) {
    const emptyMsg = locale === 'vi' ? '[ CHƯA CÓ HỌC VẤN ĐĂNG TẢI ]' : '[ NO PUBLISHED EDUCATION ]';
    return `<div class="kn-empty"><p class="kn-empty-txt">${emptyMsg}</p></div>`;
  }

  let html = `<div class="kn-tl-tree">`;

  if (hasEdu) {
    html += education
      .map((edu, idx) => {
        const isLast = idx === education.length - 1 && !hasCerts;
        const badge = edu.badge ? `<span class="kn-tl-badge kn-exp-badge">[${esc(edu.badge.toUpperCase())}]</span>` : '';
        const period = esc((locale === 'vi' && edu.period_vi ? edu.period_vi : edu.period) || '');
        const degree = esc((locale === 'vi' && edu.degree_vi ? edu.degree_vi : edu.degree) || '');
        const school = esc((locale === 'vi' && edu.school_vi ? edu.school_vi : edu.school) || '');
        const desc = (locale === 'vi' && edu.description_vi ? edu.description_vi : edu.description) || '';
        const descHtml = desc ? `<p class="kn-tl-desc kn-edu-desc">${esc(desc)}</p>` : '';

        return `
          <article class="kn-tl-item kn-exp-item kn-edu-item" data-last="${isLast ? 'true' : 'false'}" data-kn-edu-item="${esc(edu.id)}">
            <div class="kn-tl-head kn-exp-head">
              <span class="kn-tl-date kn-exp-period">${period}</span>
              ${badge}
            </div>
            <div class="kn-tl-body kn-exp-body">
              <div class="kn-tl-gutter" aria-hidden="true">
                <span class="sr-only">${isLast ? '└──' : '├──'}</span>
              </div>
              <div class="kn-tl-content kn-exp-content">
                <div class="kn-tl-title-wrap kn-exp-role-wrap">
                  <h3 class="kn-tl-title kn-exp-role">${school}</h3>
                  <div class="kn-tl-subtitle kn-exp-company">${degree}</div>
                </div>
                <div class="kn-tl-details kn-exp-details">
                  ${descHtml}
                </div>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  }

  if (hasCerts) {
    const certsTitle = locale === 'vi' ? 'CHỨNG CHỈ NGHỀ NGHIỆP' : 'CERTIFICATIONS';
    const certsHeader = `
      <div class="kn-edu-certs-head">
        <span class="kn-exp-period">${certsTitle}</span>
      </div>
    `;
    html += certsHeader;
    html += certs
      .map((c, idx) => {
        const isLast = idx === certs.length - 1;
        const name = esc((locale === 'vi' && c.name_vi ? c.name_vi : c.name) || '');
        const issuer = esc(c.issuer || '');

        return `
          <article class="kn-tl-item kn-exp-item kn-cert-item" data-last="${isLast ? 'true' : 'false'}" data-kn-cert-item="${esc(c.id)}">
            <div class="kn-tl-body kn-exp-body">
              <div class="kn-tl-gutter" aria-hidden="true">
                <span class="sr-only">${isLast ? '└──' : '├──'}</span>
              </div>
              <div class="kn-tl-content kn-exp-content">
                <div class="kn-tl-title-wrap kn-exp-role-wrap">
                  <h3 class="kn-tl-title kn-exp-role">${name}</h3>
                  <div class="kn-tl-subtitle kn-exp-company">${issuer}</div>
                </div>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  }

  html += `</div>`;
  return html;
}

/**
 * Renders the Certifications section as an independent ASCII timeline/tree.
 */
export function renderKnightCertifications(certs: Certification[] = [], locale: 'en' | 'vi' = 'en'): string {
  if (!certs || certs.length === 0) {
    const emptyMsg = locale === 'vi' ? '[ CHƯA CÓ CHỨNG CHỈ ĐĂNG TẢI ]' : '[ NO PUBLISHED CERTIFICATIONS ]';
    return `<div class="kn-empty"><p class="kn-empty-txt">${emptyMsg}</p></div>`;
  }

  const verifyLabel = locale === 'vi' ? '[XÁC THỰC ↗]' : '[VERIFY ↗]';
  const idLabel = locale === 'vi' ? 'Mã chứng chỉ:' : 'Credential ID:';

  return (
    `<div class="kn-tl-tree">` +
    certs
      .map((c, idx) => {
        const isLast = idx === certs.length - 1;
        const name = esc((locale === 'vi' && c.name_vi ? c.name_vi : c.name) || '');
        const issuer = esc((locale === 'vi' && c.issuer_vi ? c.issuer_vi : c.issuer) || '');
        const date = esc(c.issueDate || '');
        const badge = c.badge ? `<span class="kn-tl-badge kn-exp-badge">[${esc(c.badge.toUpperCase())}]</span>` : '';
        const verifyLink = c.credentialUrl
          ? `<a href="${esc(c.credentialUrl)}" target="_blank" rel="noopener noreferrer" class="kn-cert-verify">${verifyLabel}</a>`
          : '';
        const credId = c.credentialId ? `<span class="kn-cert-id">${idLabel} ${esc(c.credentialId)}</span>` : '';
        const desc = (locale === 'vi' && c.description_vi ? c.description_vi : c.description) || '';
        const descHtml = desc ? `<p class="kn-tl-desc kn-edu-desc">${esc(desc)}</p>` : '';

        const metaRow = [credId, verifyLink].filter(Boolean).join(' · ');
        const metaHtml = metaRow ? `<div class="kn-cert-meta">${metaRow}</div>` : '';

        return `
          <article class="kn-tl-item kn-cert-item" data-last="${isLast ? 'true' : 'false'}" data-kn-cert-item="${esc(c.id)}">
            ${date || badge ? `
            <div class="kn-tl-head kn-exp-head">
              ${date ? `<span class="kn-tl-date kn-exp-period">${date}</span>` : ''}
              ${badge}
            </div>` : ''}
            <div class="kn-tl-body kn-exp-body">
              <div class="kn-tl-gutter" aria-hidden="true">
                <span class="sr-only">${isLast ? '└──' : '├──'}</span>
              </div>
              <div class="kn-tl-content kn-exp-content">
                <div class="kn-tl-title-wrap kn-exp-role-wrap">
                  <h3 class="kn-tl-title kn-exp-role">${name}</h3>
                  <div class="kn-tl-subtitle kn-exp-company">${issuer}</div>
                </div>
                <div class="kn-tl-details kn-exp-details">
                  ${descHtml}
                  ${metaHtml}
                </div>
              </div>
            </div>
          </article>
        `;
      })
      .join('') +
    `</div>`
  );
}

/**
 * Renders technical skills as Grouped Terminal Modules.
 * Each module represents one skill category with an authentic ASCII terminal header and clean monospaced skill list.
 */
export function renderKnightSkills(skills: Skill[] = [], locale: 'en' | 'vi' = 'en'): string {
  if (!skills || skills.length === 0) {
    const emptyMsg = locale === 'vi' ? '[ CHƯA CÓ KỸ NĂNG ĐĂNG TẢI ]' : '[ NO PUBLISHED SKILLS ]';
    return `<div class="kn-empty"><p class="kn-empty-txt">${emptyMsg}</p></div>`;
  }

  const groups = groupKnightSkills(skills, locale);

  const modulesHtml = groups
    .map((g) => {
      const catDisplay = esc(g.category);
      const countFormatted = String(g.items.length).padStart(2, '0');
      const itemsHtml = g.items
        .map(
          (sk) => `
            <li class="kn-mod-item knight-skill-module__item" data-kn-sk="true">
              <span class="kn-mod-bullet" aria-hidden="true">·</span>
              <span class="kn-mod-name">${esc(sk.name)}</span>
            </li>
          `
        )
        .join('');

      return `
        <section class="kn-mod knight-skill-module" data-kn-occ="box" tabindex="0" aria-label="${catDisplay}">
          <header class="kn-mod-hdr">
            <div class="kn-mod-tag">
              <span class="kn-mod-prefix" aria-hidden="true">┌─</span>
              <h3 class="kn-mod-title knight-skill-module__title">[ ${catDisplay} ]</h3>
            </div>
            <span class="kn-mod-meta" aria-hidden="true">[${countFormatted}] ┐</span>
          </header>
          <div class="kn-mod-body">
            <ul class="kn-mod-list knight-skill-module__list">
              ${itemsHtml}
            </ul>
          </div>
          <footer class="kn-mod-ftr" aria-hidden="true">
            <span class="kn-mod-corner-bl">└</span>
            <span class="kn-mod-corner-rule"></span>
            <span class="kn-mod-corner-br">┘</span>
          </footer>
        </section>
      `;
    })
    .join('');

  return `<div class="kn-sk-grid knight-skill-modules">${modulesHtml}</div>`;
}
