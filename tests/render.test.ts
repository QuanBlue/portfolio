import { describe, it, expect } from 'vitest';
import { esc, safeUrl, renderProjects, renderGalleryGrid, renderCvSheetHtml } from '../src/lib/render';
import { defaultPortfolioData, mergePortfolioData } from '../src/data/portfolio';

describe('render helpers', () => {
  it('escapes HTML in user content', () => {
    expect(esc('<img onerror=x>"')).toBe('&lt;img onerror=x&gt;&quot;');
    const html = renderProjects([{ ...defaultPortfolioData.projects[0], title: '<script>x</script>' }]);
    expect(html).not.toContain('<script>');
  });

  it('blocks dangerous URLs', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('#');
    expect(safeUrl('https://a.dev')).toBe('https://a.dev');
    expect(safeUrl('data:image/jpeg;base64,AAA')).toContain('data:image/jpeg');
  });

  it('renders project media cover and badge', () => {
    const html = renderProjects([
      {
        ...defaultPortfolioData.projects[0],
        media: [
          { src: 'https://a.dev/1.gif', caption: 'Demo' },
          { src: 'https://a.dev/2.jpg' },
        ],
      },
    ]);
    expect(html).toContain('https://a.dev/1.gif');
    expect(html).toContain('2 media');
  });

  it('renders gallery cards with index', () => {
    const html = renderGalleryGrid([
      { id: '1', title: 'A', description: '', image: 'data:image/png;base64,AA', tags: ['x'], details: [] },
    ]);
    expect(html).toContain('data-gallery-index="0"');
  });

  it('dynamically renders authentic CV sheet from PortfolioData', () => {
    const cvHtml = renderCvSheetHtml(defaultPortfolioData);
    expect(cvHtml).toContain(defaultPortfolioData.identity.name.toUpperCase());
    expect(cvHtml).toContain(defaultPortfolioData.identity.email);
    expect(cvHtml).toContain('ABOUT ME');
    expect(cvHtml).toContain('SKILLS');
    expect(cvHtml).toContain('PROJECT/');
    expect(cvHtml).toContain('EDUCATION');
    expect(cvHtml).toContain('Kubernetes');
    expect(cvHtml).toContain('ansible-airgap-k8s');
  });
});

describe('mergePortfolioData', () => {
  it('overrides sections and deep-merges identity', () => {
    const merged = mergePortfolioData(defaultPortfolioData, {
      identity: { name: 'New', themeVariant: 'editorial' } as any,
      gallery: [{ id: 'g', title: 't', description: '', image: '', tags: [], details: [] }],
    });
    expect(merged.identity.name).toBe('New');
    expect(merged.identity.themeVariant).toBe('editorial');
    expect(merged.identity.role).toBe(defaultPortfolioData.identity.role);
    expect(merged.gallery).toHaveLength(1);
    expect(merged.skills).toHaveLength(7);
  });
});
