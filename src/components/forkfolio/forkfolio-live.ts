import { getCareerSettings, type PortfolioData } from '../../data/portfolio';
import { safeUrl } from '../../lib/render';
import { getKnightActivity } from '../../themes/core/data-adapter';
import {
  deriveShortHandle,
  renderForkfolioAboutSummaryHtml,
  renderForkfolioActivityHtml,
  renderForkfolioCertificationsHtml,
  renderForkfolioEducationHtml,
  renderForkfolioExperienceHtml,
  renderForkfolioMoreProjectsHtml,
  renderForkfolioProjectsHtml,
  renderForkfolioQuickProjectsHtml,
  renderForkfolioSkillsHtml,
} from './forkfolio-renderers';

export function initForkfolioLiveUpdates() {
  const wrapper = document.querySelector<HTMLElement>('[data-theme-wrapper="forkfolio"]');
  if (!wrapper) return;

  // Bind [ cv.pdf ] nav button behavior cleanly without 404 on static /cv.pdf
  const navCvLink = wrapper.querySelector<HTMLAnchorElement>('[data-ff-cv-link]');
  navCvLink?.addEventListener('click', (e) => {
    const mode = navCvLink.dataset.cvMode || 'modal';
    if (mode === 'modal' && typeof (window as any).openCvModal === 'function') {
      e.preventDefault();
      (window as any).openCvModal();
    }
  });

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

    // 1. Dynamic shell handles & prompts
    const shortHandle = deriveShortHandle(detail);
    wrapper.querySelectorAll<HTMLElement>('[data-ff-shell-handle]').forEach((el) => {
      el.textContent = shortHandle;
    });
    wrapper.querySelectorAll<HTMLElement>('[data-ff-shell-prompt]').forEach((el) => {
      el.textContent = `${shortHandle}@portfolio`;
    });

    // 2. Nav CV button href/mode + more-projects tab visibility
    if (navCvLink) {
      const isCustomPdf = Boolean(career.cvUrl && career.cvUrl !== '/cv.pdf');
      navCvLink.href = isCustomPdf ? safeUrl(career.cvUrl) : '/cv';
      navCvLink.dataset.cvMode = isCustomPdf ? 'external' : 'modal';
    }
    const hasMore = projects.length > 4;
    wrapper.querySelectorAll<HTMLElement>('[data-ff-more-tab]').forEach((el) => {
      el.classList.toggle('hidden', !hasMore);
    });

    // 3. Hero quick projects & stats
    const quickProjectsEl = wrapper.querySelector<HTMLElement>('[data-ff-quick-projects]');
    if (quickProjectsEl) {
      quickProjectsEl.innerHTML = renderForkfolioQuickProjectsHtml(projects);
    }
    wrapper.querySelectorAll<HTMLElement>('[data-ff-stat="projects"]').forEach((el) => {
      el.textContent = String(projects.length);
    });
    wrapper.querySelectorAll<HTMLElement>('[data-ff-stat="skills"]').forEach((el) => {
      el.textContent = String(skills.length);
    });
    wrapper.querySelectorAll<HTMLElement>('[data-ff-handle-tag]').forEach((el) => {
      el.textContent = `@${shortHandle}`;
    });

    // 4. About section + Specs table
    const aboutHeading = wrapper.querySelector<HTMLElement>('.ff-about-heading');
    if (aboutHeading) aboutHeading.textContent = isVi ? 'GIỚI THIỆU' : 'ABOUT';

    const aboutSummary = wrapper.querySelector<HTMLElement>('[data-ff-about-summary]');
    if (aboutSummary) {
      aboutSummary.innerHTML = renderForkfolioAboutSummaryHtml(detail, locale);
    }
    const aboutMap: Record<string, string> = {
      name: i.name || '—',
      org: experience[0]?.company || '—',
      projectsSkills: `${projects.length} / ${skills.length}`,
      careerStatus: career.openToWork ? (isVi ? 'Sẵn sàng' : 'Open to Work') : isVi ? 'Không' : 'Focused',
      badge: career.openToWork ? '● OPEN TO WORK' : '● PUBLISHED',
    };
    Object.entries(aboutMap).forEach(([k, v]) => {
      wrapper.querySelectorAll<HTMLElement>(`[data-ff-about="${k}"]`).forEach((el) => {
        el.textContent = v;
      });
    });

    // 5. Projects & More Projects
    const projHeading = wrapper.querySelector<HTMLElement>('.ff-proj-heading');
    if (projHeading) projHeading.textContent = isVi ? 'DỰ ÁN NỔI BẬT' : 'PROJECTS';
    const featuredCount = projects.length > 4 ? 4 : projects.length;
    wrapper.querySelectorAll<HTMLElement>('[data-ff-projects-count]').forEach((el) => {
      el.textContent = isVi ? `${featuredCount} dự án nổi bật` : `${featuredCount} featured repositories`;
    });
    const projSec = wrapper.querySelector<HTMLElement>('[data-terminal-section="projects"]');
    const projCompleted = projSec?.getAttribute('data-terminal-state') === 'completed';
    const projList = wrapper.querySelector<HTMLElement>('[data-ff-projects-list]');
    if (projList) {
      projList.innerHTML = renderForkfolioProjectsHtml(projects, i.github?.handle || '', locale, projCompleted);
    }

    const moreSection = wrapper.querySelector<HTMLElement>('[data-terminal-section="more-projects"]');
    if (moreSection) {
      moreSection.classList.toggle('hidden', !hasMore);
      const moreHeading = moreSection.querySelector<HTMLElement>('.ff-more-heading');
      if (moreHeading) moreHeading.textContent = isVi ? 'DỰ ÁN KHÁC' : 'MORE PROJECTS';
      const moreCount = moreSection.querySelector<HTMLElement>('[data-ff-more-count]');
      if (moreCount) moreCount.textContent = `total ${Math.max(0, projects.length - 4)}`;
      const moreBody = moreSection.querySelector<HTMLElement>('[data-ff-more-projects-body]');
      if (moreBody) moreBody.innerHTML = renderForkfolioMoreProjectsHtml(projects, locale);
    }

    // 6. Experience
    const expHeading = wrapper.querySelector<HTMLElement>('.ff-exp-heading');
    if (expHeading) expHeading.textContent = isVi ? 'KINH NGHIỆM' : 'EXPERIENCE';
    const expList = wrapper.querySelector<HTMLElement>('[data-ff-experience-list]');
    if (expList) {
      expList.innerHTML = renderForkfolioExperienceHtml(experience, locale);
    }

    // 7. Education
    const eduHeading = wrapper.querySelector<HTMLElement>('.ff-edu-heading');
    if (eduHeading) eduHeading.textContent = isVi ? 'HỌC VẤN' : 'EDUCATION';
    const eduList = wrapper.querySelector<HTMLElement>('[data-ff-education-list]');
    if (eduList) {
      eduList.innerHTML = renderForkfolioEducationHtml(education, locale);
    }

    // 8. Certifications
    const certHeading = wrapper.querySelector<HTMLElement>('.ff-cert-heading');
    if (certHeading) certHeading.textContent = isVi ? 'CHỨNG CHỈ' : 'CERTIFICATIONS';
    const certList = wrapper.querySelector<HTMLElement>('[data-ff-certifications-list]');
    if (certList) {
      certList.innerHTML = renderForkfolioCertificationsHtml(certs, locale);
    }

    // 9. Skills
    const skillsHeading = wrapper.querySelector<HTMLElement>('.ff-skills-heading');
    if (skillsHeading) skillsHeading.textContent = isVi ? 'KỸ NĂNG KỸ THUẬT' : 'TECHNICAL SKILLS';
    const skillsCount = wrapper.querySelector<HTMLElement>('[data-ff-skills-count]');
    if (skillsCount) skillsCount.textContent = `${skills.length} ${isVi ? 'kỹ năng' : 'installed'}`;
    const skillsBody = wrapper.querySelector<HTMLElement>('[data-ff-skills-body]');
    if (skillsBody) {
      skillsBody.innerHTML = renderForkfolioSkillsHtml(skills, locale);
    }

    // 10. Activity
    const actHeading = wrapper.querySelector<HTMLElement>('.ff-act-heading');
    if (actHeading) actHeading.textContent = isVi ? 'HOẠT ĐỘNG & HỒ SƠ' : 'ACTIVITY & TELEMETRY';
    const actMeta = wrapper.querySelector<HTMLElement>('[data-ff-activity-meta]');
    if (actMeta) {
      const activity = getKnightActivity(detail);
      actMeta.textContent = activity ? `${activity.totalContributions} contributions` : isVi ? 'dữ liệu hồ sơ' : 'portfolio index';
    }
    const actBody = wrapper.querySelector<HTMLElement>('[data-ff-activity-body]');
    if (actBody) {
      actBody.innerHTML = renderForkfolioActivityHtml(detail, locale);
    }

    // 11. Contact
    const contactHeading = wrapper.querySelector<HTMLElement>('.ff-contact-heading');
    if (contactHeading) contactHeading.textContent = isVi ? 'KẾT NỐI NGAY.' : "LET'S TALK.";
    const contactTo = wrapper.querySelector<HTMLElement>('[data-ff-contact-to]');
    if (contactTo) contactTo.textContent = `To: ${i.name || ''}`;
    const contactSub = wrapper.querySelector<HTMLElement>('.ff-contact-sub');
    if (contactSub) {
      contactSub.textContent = isVi
        ? 'Luôn sẵn sàng trao đổi về kiến trúc hạ tầng, tự động hóa hệ thống hoặc cơ hội hợp tác mới.'
        : 'Open to discuss infrastructure engineering, automation, and new collaborations.';
    }
    const emailDisplay = wrapper.querySelector<HTMLElement>('[data-ff-email-display]');
    if (emailDisplay) emailDisplay.textContent = i.email || '';
    const mailForm = wrapper.querySelector<HTMLFormElement>('[data-ff-contact-form]');
    if (mailForm) mailForm.action = i.email ? `mailto:${i.email}` : '#';
    const formNote = wrapper.querySelector<HTMLElement>('.ff-form-note');
    if (formNote) formNote.textContent = isVi ? '// GỬI TIN NHẮN TRỰC TIẾP' : '// DISPATCH A DIRECT MESSAGE';
    const lblName = wrapper.querySelector<HTMLElement>('.ff-lbl-name');
    if (lblName) lblName.textContent = isVi ? 'Họ & Tên' : 'Name';
    const lblEmail = wrapper.querySelector<HTMLElement>('.ff-lbl-email');
    if (lblEmail) lblEmail.textContent = isVi ? 'Email liên hệ' : 'Email';
    const lblMsg = wrapper.querySelector<HTMLElement>('.ff-lbl-msg');
    if (lblMsg) lblMsg.textContent = isVi ? 'Nội dung trao đổi' : 'Message';
    const btnSend = wrapper.querySelector<HTMLElement>('.ff-btn-send');
    if (btnSend) btnSend.textContent = isVi ? '[ gửi_tin_nhắn → ]' : '[ send_message → ]';
  });
}
