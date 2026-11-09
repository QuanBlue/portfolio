import { describe, it, expect } from 'vitest';
import { calculateReadingTime } from '../src/utils/reading-time';

describe('calculateReadingTime', () => {
  it('calculates minimum 1 min for empty or short text', () => {
    expect(calculateReadingTime('')).toBe('1 min read');
    expect(calculateReadingTime('Hello world')).toBe('1 min read');
  });

  it('calculates reading time based on 200 words per minute', () => {
    const words = Array(450).fill('word').join(' ');
    expect(calculateReadingTime(words)).toBe('3 min read');
  });

  it('strips markdown formatting and html tags before calculating', () => {
    const markdown = `# Title
**Bold text** with [links](https://example.com) and \`code snippets\`.
<div><p>HTML paragraph</p></div>`;
    expect(calculateReadingTime(markdown)).toBe('1 min read');
  });
});
