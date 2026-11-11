import { describe, it, expect } from 'vitest';
import { portfolioData, getCareerSettings } from '../src/data/portfolio';

describe('Portfolio Central Data Model', () => {
  it('contains authentic identity matching the mockup', () => {
    expect(portfolioData.identity.name).toBe('Nguyễn Thanh Quân');
    expect(portfolioData.identity.role).toBe('DevOps Engineer');
    expect(portfolioData.identity.location).toBe('Ho Chi Minh, VN');
    expect(portfolioData.identity.email).toBe('quannguyenthanh558@gmail.com');
    expect(portfolioData.identity.github.handle).toBe('@QuanBlue');
    expect(portfolioData.identity.linkedin.handle).toBe('in/quanblue');
  });

  it('contains 7 skills matching the active modules in the mockup', () => {
    expect(portfolioData.skills).toHaveLength(7);
    const skillNames = portfolioData.skills.map((s) => s.name);
    expect(skillNames).toEqual([
      'Kubernetes',
      'Docker',
      'Ansible',
      'Prometheus',
      'Linux/Ubuntu',
      'HAProxy',
      'Istio',
    ]);
  });

  it('contains both certifications from the mockup', () => {
    expect(portfolioData.certifications).toHaveLength(2);
    expect(portfolioData.certifications[0].name).toContain('CKA');
    expect(portfolioData.certifications[1].name).toContain('AWS Solutions Architect');
  });

  it('contains authentic experience history', () => {
    expect(portfolioData.experience).toHaveLength(2);
    expect(portfolioData.experience[0].company).toBe('Viettel');
    expect(portfolioData.experience[0].role).toBe('DevOps Engineer');
    expect(portfolioData.experience[1].company).toBe('Tech Company XYZ');
  });

  it('contains featured projects with valid repository links', () => {
    expect(portfolioData.projects).toHaveLength(2);
    expect(portfolioData.projects[0].title).toBe('ansible-airgap-k8s');
    expect(portfolioData.projects[1].title).toBe('mern-portfolio');
    portfolioData.projects.forEach((p) => {
      expect(p.link).toMatch(/^https:\/\/github\.com\//);
      expect(p.tags.length).toBeGreaterThan(0);
    });
  });

  it('contains valid APM telemetry spans', () => {
    expect(portfolioData.telemetry.spans).toHaveLength(4);
    expect(portfolioData.telemetry.uptimeSLA).toBe('99.9%');
  });

  it('supports themeVariant configuration (ascii | knight | forkfolio | editorial)', () => {
    expect(['ascii', 'knight', 'forkfolio', 'editorial']).toContain(portfolioData.identity.themeVariant);
  });

  describe('CareerSettings & CV Eligibility Matrix', () => {
    it('resolves defaults from portfolioData', () => {
      const career = getCareerSettings(portfolioData);
      expect(career.openToWork).toBe(true);
      expect(career.cvUrl).toBe('/cv.pdf');
    });

    it('Matrix 1: openToWork=false, no CV -> openToWork is false and cvUrl is undefined', () => {
      const career = getCareerSettings({
        careerSettings: { openToWork: false },
        identity: { openToWork: false } as any,
      });
      expect(career.openToWork).toBe(false);
      expect(career.cvUrl).toBeUndefined();
    });

    it('Matrix 2: openToWork=false, has CV -> openToWork is false', () => {
      const career = getCareerSettings({
        careerSettings: { openToWork: false, cvUrl: '/my-cv.pdf' },
      });
      expect(career.openToWork).toBe(false);
      expect(career.cvUrl).toBe('/my-cv.pdf');
    });

    it('Matrix 3: openToWork=true, no CV -> cvUrl is undefined', () => {
      const career = getCareerSettings({
        careerSettings: { openToWork: true, cvUrl: '   ' },
      });
      expect(career.openToWork).toBe(true);
      expect(career.cvUrl).toBeUndefined();
    });

    it('Matrix 4: openToWork=true, has CV -> openToWork is true and cvUrl is valid', () => {
      const career = getCareerSettings({
        careerSettings: { openToWork: true, cvUrl: 'https://storage.example.com/cv.pdf' },
      });
      expect(career.openToWork).toBe(true);
      expect(career.cvUrl).toBe('https://storage.example.com/cv.pdf');
    });
  });
});
