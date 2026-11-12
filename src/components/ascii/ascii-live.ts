import { getCareerSettings, resolveAvatarUrl, type PortfolioData } from '../../data/portfolio';
import { esc } from '../../lib/render';
import { splitTitleIntoLines } from '../../themes/core/ascii-title';
import {
  renderAsciiActivityHtml,
  renderAsciiAvatarImgOrFallback,
  renderAsciiCertificationsHtml,
  renderAsciiEducationHtml,
  renderAsciiExperienceHtml,
  renderAsciiProjectsHtml,
  renderAsciiSkillChipsHtml,
  renderAsciiSkillGroupsHtml,
} from './ascii-renderers';

export const DEFAULT_SLANT_BANNER = `    _   __________  ____  _________   __   ________  _____    _   ____  __   ____  __  _____    _   __
   / | / / ____/ / / /\\ \\/ / ____/ | / /  /_  __/ / / /   |  / | / / / / /  / __ \\/ / / /   |  / | / /
  /  |/ / / __/ / / /  \\  / __/ /  |/ /    / / / /_/ / /| | /  |/ / /_/ /  / / / / / / / /| | /  |/ / 
 / /|  / /_/ / /_/ /   / / /___/ /|  /    / / / __  / ___ |/ /|  / __  /  / /_/ / /_/ / ___ |/ /|  /  
/_/ |_/\\____/\\____/   /_/_____/_/ |_/    /_/ /_/ /_/_/  |_/_/ |_/_/ /_/   \\___\\_\\____/_/  |_/_/ |_/   `;

export const DEFAULT_ANSI_BANNER = `███╗   ██╗ ██████╗ ██╗   ██╗██╗   ██╗███████╗███╗   ██╗    ████████╗██╗  ██╗ █████╗ ███╗   ██╗██╗  ██╗     ██████╗ ██╗   ██╗ █████╗ ███╗   ██╗
████╗  ██║██╔════╝ ██║   ██║╚██╗ ██╔╝██╔════╝████╗  ██║    ╚══██╔══╝██║  ██║██╔══██╗████╗  ██║██║  ██║    ██╔═══██╗██║   ██║██╔══██╗████╗  ██║
██╔██╗ ██║██║  ███╗██║   ██║ ╚████╔╝ █████╗  ██╔██╗ ██║       ██║   ███████║███████║██╔██╗ ██║███████║    ██║   ██║██║   ██║███████║██╔██╗ ██║
██║╚██╗██║██║   ██║██║   ██║  ╚██╔╝  ██╔══╝  ██║╚██╗██║       ██║   ██╔══██║██╔══██║██║╚██╗██║██╔══██║    ██║▄▄ ██║██║   ██║██╔══██║██║╚██╗██║
██║ ╚████║╚██████╔╝╚██████╔╝   ██║   ███████╗██║ ╚████║       ██║   ██║  ██║██║  ██║██║ ╚████║██║  ██║    ╚██████╔╝╚██████╔╝██║  ██║██║ ╚████║
╚═╝  ╚═══╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚═╝  ╚═══╝       ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝     ╚══▀▀═╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝`;

export function isDefaultAsciiBannerName(name: string): boolean {
  const normalized = String(name || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0110/g, 'D')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized === 'NGUYEN THANH QUAN';
}

export function buildAsciiBannerText(name: string, font: 'slant' | 'ansi'): string {
  if (isDefaultAsciiBannerName(name)) {
    return font === 'ansi' ? DEFAULT_ANSI_BANNER : DEFAULT_SLANT_BANNER;
  }
  const lines = splitTitleIntoLines(name || 'PORTFOLIO', 24);
  const maxLen = Math.max(...lines.map((l) => l.length), 10);
  const border = `+${'-'.repeat(maxLen + 4)}+`;
  return [border, ...lines.map((l) => `|  ${l.padEnd(maxLen, ' ')}  |`), border].join('\n');
}

export function initAsciiLiveUpdates() {
  const wrapper = document.querySelector<HTMLElement>('[data-theme-wrapper="ascii"]');
  if (!wrapper) return;

  window.addEventListener('portfolio:data', (e: Event) => {
    const detail = (e as CustomEvent).detail as PortfolioData & { _locale?: 'en' | 'vi' };
    if (!detail) return;
    const locale: 'en' | 'vi' = detail._locale === 'vi' ? 'vi' : 'en';
    const isVi = locale === 'vi';
    const i = detail.identity || ({} as PortfolioData['identity']);
    const projects = detail.projects || [];
    const skills = detail.skills || [];
    const experience = detail.experience || [];
    const education = detail.education || [];
    const certs = detail.certifications || [];
    const career = getCareerSettings(detail);

    // Hero prompt & stats
    const handle = String(i.github?.handle || 'quan').replace(/^@/, '').toLowerCase() || 'quan';
    const node = String(i.node || 'infra-node');
    wrapper.querySelectorAll<HTMLElement>('[data-ascii-prompt]').forEach((el) => {
      el.textContent = `${handle.split(/[^a-z0-9]/)[0] || 'quan'}@${node}:~$`;
    });
    wrapper.querySelectorAll<HTMLElement>('[data-ascii-stat="projects"]').forEach((el) => {
      el.textContent = String(projects.length);
    });
    wrapper.querySelectorAll<HTMLElement>('[data-ascii-stat="skills"]').forEach((el) => {
      el.textContent = String(skills.length);
    });
    wrapper.querySelectorAll<HTMLElement>('[data-ascii-stat="experience"]').forEach((el) => {
      el.textContent = String(experience.length);
    });
    wrapper.querySelectorAll<HTMLElement>('[data-ascii-stat="education"]').forEach((el) => {
      el.textContent = String(education.length);
    });

    // Hero Banner Title
    const bannerPre = wrapper.querySelector<HTMLElement>('#ascii-banner-pre');
    if (bannerPre) {
      const activeFont = (bannerPre.dataset.asciiFont as 'slant' | 'ansi') || 'slant';
      bannerPre.textContent = buildAsciiBannerText(i.name, activeFont);
      bannerPre.setAttribute('aria-label', i.name || 'Portfolio');
    }

    // Hero Avatar Plate + notify AsciiHero view switcher
    const avatarSlot = wrapper.querySelector<HTMLElement>('#ascii-avatar-media-slot');
    if (avatarSlot) {
      avatarSlot.innerHTML = renderAsciiAvatarImgOrFallback(detail);
    }
    const avatarUrl = resolveAvatarUrl(detail);
    window.dispatchEvent(new CustomEvent('ascii:avatar-updated', { detail: { avatarUrl, name: i.name } }));

    // About summary boxes & Specs table
    const org = experience[0]?.company || '—';
    const topSkillNames = skills.slice(0, 3).map((s) => s.name).join(', ') || '—';
    const aboutMap: Record<string, string> = {
      exp: experience[0]
        ? `${experience[0].role} @ ${experience[0].company} (${experience[0].period})`
        : isVi
        ? 'Chưa có kinh nghiệm đăng tải'
        : 'No published experience',
      projects: `${projects.length} ${isVi ? 'dự án công khai' : `published project${projects.length === 1 ? '' : 's'}`}`,
      edu: education[0]
        ? `${education[0].degree} — ${education[0].school}`
        : isVi
        ? 'Chưa có học vấn đăng tải'
        : 'No published education',
      skills: `${skills.length} ${isVi ? 'kỹ năng' : 'skills'}${topSkillNames !== '—' ? ` · ${topSkillNames}` : ''}`,
      specsName: i.name || '—',
      specsOrg: org,
      specsProjects: String(projects.length),
      specsSkills: String(skills.length),
      specsCareer: career.openToWork ? (isVi ? 'Sẵn sàng' : 'Open to Work') : isVi ? 'Không' : 'Focused',
      specsBadge: career.openToWork ? '[ OPEN_TO_WORK ]' : '[ PUBLISHED_PROFILE ]',
    };
    Object.entries(aboutMap).forEach(([key, val]) => {
      wrapper.querySelectorAll<HTMLElement>(`[data-ascii-about="${key}"]`).forEach((el) => {
        el.textContent = val;
      });
    });

    // Projects
    const projCount = wrapper.querySelector<HTMLElement>('[data-ascii-projects-count]');
    if (projCount) {
      projCount.textContent = projects.length > 0
        ? `PROJECT_COUNT: [ 01 / ${String(projects.length).padStart(2, '0')} ]`
        : 'PROJECT_COUNT: [ 00 ]';
    }
    const projList = wrapper.querySelector<HTMLElement>('[data-ascii-projects-list]');
    if (projList) {
      projList.innerHTML = renderAsciiProjectsHtml(projects, i.github?.handle || '', locale);
    }

    // Experience
    const expList = wrapper.querySelector<HTMLElement>('[data-ascii-experience-list]');
    if (expList) {
      expList.innerHTML = renderAsciiExperienceHtml(experience, locale);
    }

    // Education & Certifications
    const eduList = wrapper.querySelector<HTMLElement>('[data-ascii-education-list]');
    if (eduList) {
      eduList.innerHTML = renderAsciiEducationHtml(education, locale);
    }
    const certList = wrapper.querySelector<HTMLElement>('[data-ascii-certifications-list]');
    if (certList) {
      certList.innerHTML = renderAsciiCertificationsHtml(certs, locale);
    }

    // Skills
    const skillGroupsEl = wrapper.querySelector<HTMLElement>('[data-ascii-skill-groups]');
    if (skillGroupsEl) {
      skillGroupsEl.innerHTML = renderAsciiSkillGroupsHtml(skills, locale);
    }
    const skillChipsEl = wrapper.querySelector<HTMLElement>('[data-ascii-skill-chips]');
    if (skillChipsEl) {
      skillChipsEl.innerHTML = renderAsciiSkillChipsHtml(skills, locale);
    }
    const skillsStatus = wrapper.querySelector<HTMLElement>('[data-ascii-skills-status]');
    if (skillsStatus) {
      const activeCount = skills.filter((s) => s.status === 'ACTIVE').length;
      skillsStatus.textContent = skills.length > 0
        ? `● ${activeCount}/${skills.length} ACTIVE`
        : isVi
        ? '○ TRỐNG'
        : '○ EMPTY';
    }

    // Activity
    const activityBody = wrapper.querySelector<HTMLElement>('[data-ascii-activity-body]');
    if (activityBody) {
      activityBody.innerHTML = renderAsciiActivityHtml(detail, locale);
    }

    // Contact localized text & email span
    const emailDisplay = wrapper.querySelector<HTMLElement>('[data-ascii-email-display]');
    if (emailDisplay) {
      emailDisplay.textContent = i.email || '';
    }
    const contactSub = wrapper.querySelector<HTMLElement>('[data-ascii-contact-sub]');
    if (contactSub) {
      contactSub.textContent = isVi
        ? 'Luôn sẵn sàng trao đổi về kiến trúc hạ tầng, tự động hóa hệ thống hoặc cơ hội hợp tác mới.'
        : 'Always open to discuss infrastructure engineering, automation, and new collaborations.';
    }
    // Note: footer status badge stays clean
    const specsBadge = wrapper.querySelector<HTMLElement>('[data-ascii-about="specsBadge"]');
    if (specsBadge) {
      specsBadge.innerHTML = esc(aboutMap.specsBadge);
    }
  });
}
