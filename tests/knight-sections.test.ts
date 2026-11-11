import { describe, it, expect } from 'vitest';
import { portfolioData, type ExperienceItem, type EducationItem, type Skill, type Certification } from '../src/data/portfolio';
import {
  groupKnightSkills,
  renderKnightExperience,
  renderKnightEducation,
  renderKnightCertifications,
  renderKnightSkills,
} from '../src/themes/core/render-knight';

describe('Knight Database-Driven Sections', () => {
  describe('1. Experience Section', () => {
    it('renders authentic database entries without fabricating data', () => {
      const html = renderKnightExperience(portfolioData.experience);
      expect(html).toContain('Viettel');
      expect(html).toContain('DevOps Engineer');
      expect(html).toContain('Tech Company XYZ');
      expect(html).toContain('Junior System Admin');
      expect(html).toContain('[CURRENT]');
      expect(html).toContain('Kubernetes · Service Mesh · Multi-zone');
      expect(html).toContain('├──');
      expect(html).toContain('└──');
    });

    it('renders clean empty state when experience array is empty', () => {
      const html = renderKnightExperience([]);
      expect(html).toContain('[ NO PUBLISHED EXPERIENCE ]');
      expect(html).not.toContain('Viettel');
    });

    it('preserves custom display order', () => {
      const customExp: ExperienceItem[] = [
        {
          id: 'custom-1',
          role: 'Lead Architect',
          company: 'Acme Corp',
          period: '2026 - Present',
          isCurrent: true,
          bullets: ['Custom bullet 1'],
          tags: ['AWS', 'K8s'],
        },
        {
          id: 'custom-2',
          role: 'Junior DevOps',
          company: 'Startup Beta',
          period: '2023 - 2024',
          isCurrent: false,
          bullets: ['Custom bullet 2'],
          tags: ['Docker'],
        },
      ];
      const html = renderKnightExperience(customExp);
      const posLead = html.indexOf('Lead Architect');
      const posJunior = html.indexOf('Junior DevOps');
      expect(posLead).toBeLessThan(posJunior);
      expect(html).toContain('Acme Corp');
      expect(html).toContain('Startup Beta');
    });
  });

  describe('2. Education & Certifications Section', () => {
    it('renders published education and certifications records', () => {
      const html = renderKnightEducation(portfolioData.education, portfolioData.certifications);
      expect(html).toContain('UNIVERSITY OF SCIENCE - VNUHCM');
      expect(html).toContain('Bachelor Computer Network and Information Security');
      expect(html).toContain('[BACHELOR]');
      expect(html).toContain('GPA: 3.64 / 4.00');
      expect(html).toContain('CERTIFICATIONS');
      expect(html).toContain('CKA: Certified K8s Admin');
      expect(html).toContain('AWS Solutions Architect');
    });

    it('renders clean empty state when both education and certifications are empty', () => {
      const html = renderKnightEducation([], []);
      expect(html).toContain('[ NO PUBLISHED EDUCATION ]');
    });

    it('handles education without certifications gracefully', () => {
      const html = renderKnightEducation(portfolioData.education, []);
      expect(html).toContain('UNIVERSITY OF SCIENCE - VNUHCM');
      expect(html).not.toContain('CERTIFICATIONS');
    });
  });

  describe('3. Independent Certifications Section', () => {
    it('renders published certifications records with links and credentials', () => {
      const html = renderKnightCertifications(portfolioData.certifications);
      expect(html).toContain('CKA: Certified K8s Admin');
      expect(html).toContain('Cloud Native Computing Foundation');
      expect(html).toContain('[VERIFY ↗]');
      expect(html).toContain('https://www.cncf.io/certification/cka/');
      expect(html).toContain('LF-cka-2024-9182');
      expect(html).toContain('AWS Solutions Architect');
      expect(html).toContain('Amazon Web Services');
      expect(html).toContain('data-last="true"');
      expect(html).toContain('kn-tl-gutter');
    });

    it('renders clean empty state when certifications array is empty', () => {
      const html = renderKnightCertifications([]);
      expect(html).toContain('[ NO PUBLISHED CERTIFICATIONS ]');
    });

    it('supports Vietnamese localization for certifications', () => {
      const html = renderKnightCertifications(portfolioData.certifications, 'vi');
      expect(html).toContain('CKA: Quản trị viên Kubernetes Chuyên nghiệp');
      expect(html).toContain('[XÁC THỰC ↗]');
      expect(html).toContain('Mã chứng chỉ:');
    });
  });

  describe('4. Skills Section', () => {
    it('groups skills by configured category', () => {
      const groups = groupKnightSkills(portfolioData.skills);
      expect(groups.length).toBeGreaterThanOrEqual(3);

      const catNames = groups.map((g) => g.category);
      expect(catNames).toContain('CLOUD & INFRASTRUCTURE');
      expect(catNames).toContain('CI/CD & AUTOMATION');
      expect(catNames).toContain('LINUX & NETWORKING');

      const cloudGroup = groups.find((g) => g.category === 'CLOUD & INFRASTRUCTURE');
      const cloudSkillNames = cloudGroup?.items.map((s) => s.name);
      expect(cloudSkillNames).toContain('Kubernetes');
      expect(cloudSkillNames).toContain('Docker');
    });

    it('renders all skills with data-kn-sk for procedural lighting sweeps', () => {
      const html = renderKnightSkills(portfolioData.skills);
      expect(html).toContain('[ CLOUD &amp; INFRASTRUCTURE ]');
      expect(html).toContain('[ CI/CD &amp; AUTOMATION ]');
      expect(html).toContain('data-kn-sk="true"');
      expect(html).toContain('Kubernetes');
      expect(html).toContain('Ansible');
      expect(html).toContain('Prometheus');
      // Verify hardcoded languages are NOT present
      expect(html).not.toContain('Dockerfile');
      expect(html).not.toContain('Ruby');
    });

    it('renders clean empty state when skills array is empty', () => {
      const html = renderKnightSkills([]);
      expect(html).toContain('[ NO PUBLISHED SKILLS ]');
    });

    it('falls back to tag or GENERAL when category is not configured', () => {
      const rawSkills: Skill[] = [
        { id: 'sk-1', name: 'Terraform', tag: '[iac-tool]', status: 'ACTIVE' },
        { id: 'sk-2', name: 'Bash', tag: '', status: 'ACTIVE' },
      ];
      const groups = groupKnightSkills(rawSkills);
      expect(groups[0].category).toBe('IAC-TOOL');
      expect(groups[1].category).toBe('GENERAL');
    });
  });
});
