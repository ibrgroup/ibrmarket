import { describe, it, expect } from 'vitest';
import { escapeHTML } from '../escape-html';

describe('escapeHTML', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHTML('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
  });

  it('should escape ampersand', () => {
    expect(escapeHTML('A & B')).toBe('A &amp; B');
  });

  it('should escape less than and greater than', () => {
    expect(escapeHTML('<div>content</div>')).toBe('&lt;div&gt;content&lt;/div&gt;');
  });

  it('should escape quotes', () => {
    expect(escapeHTML('He said "hello"')).toBe('He said &quot;hello&quot;');
    expect(escapeHTML("It's working")).toBe('It&#39;s working');
  });

  it('should not escape normal text', () => {
    expect(escapeHTML('Hello World')).toBe('Hello World');
  });

  it('should handle empty string', () => {
    expect(escapeHTML('')).toBe('');
  });
});
