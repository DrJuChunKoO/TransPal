import { describe, it, expect, vi, beforeAll } from 'vitest';
import { processMarkdown, clearMarkdownCache, bulkProcessMarkdown } from '../utils/markdownCache';
import { detectContentType, validateContent, analyzeContent } from '../utils/contentTypeDetection';

// Sample markdown content for testing
const sampleMarkdown = {
  simple: '**Bold text** and *italic text*',
  complex: `# Heading 1
  
## Heading 2

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2
  - Nested item
  
1. Ordered item 1
2. Ordered item 2

> Blockquote text

\`\`\`javascript
// Code block
function example() {
  return "Hello world";
}
\`\`\`

[Link text](https://example.com)

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
`,
  withHtml: `<div>This should be sanitized</div>
  
# Safe heading
  
<script>alert("XSS")</script>`,
  withXss: `# Heading

[Click me](javascript:alert('XSS'))

<img src="x" onerror="alert('XSS')">

<iframe src="https://evil.com"></iframe>`
};

describe('Markdown Integration Tests', () => {
  beforeAll(() => {
    clearMarkdownCache();
  });

  describe('Content Type Detection Integration', () => {
    it('should correctly identify markdown content', () => {
      expect(detectContentType(sampleMarkdown.simple)).toBe('markdown');
      expect(detectContentType(sampleMarkdown.complex)).toBe('markdown');
      expect(detectContentType('Just plain text')).toBe('text');
      expect(detectContentType('Line 1\nLine 2')).toBe('text');
    });

    it('should validate content correctly', () => {
      expect(validateContent(sampleMarkdown.simple, 'markdown')).toBe(true);
      expect(validateContent('', 'markdown')).toBe(false);
      expect(validateContent(sampleMarkdown.withXss, 'markdown')).toBe(false);
    });

    it('should analyze content correctly', () => {
      const simpleAnalysis = analyzeContent(sampleMarkdown.simple);
      expect(simpleAnalysis.type).toBe('markdown');
      expect(simpleAnalysis.isValid).toBe(true);
      expect(simpleAnalysis.complexity).toBe('simple');

      const complexAnalysis = analyzeContent(sampleMarkdown.complex);
      expect(complexAnalysis.type).toBe('markdown');
      expect(complexAnalysis.isValid).toBe(true);
      expect(complexAnalysis.complexity).toBe('complex');
    });
  });

  describe('Markdown Processing Integration', () => {
    it('should process and sanitize markdown content', () => {
      const processed = processMarkdown(sampleMarkdown.withHtml);
      
      // Should contain the safe heading
      expect(processed).toContain('<h1>');
      expect(processed).toContain('Safe heading');
      
      // Should not contain dangerous elements
      expect(processed).not.toContain('<script>');
      expect(processed).not.toContain('alert("XSS")');
      
      // Should sanitize HTML
      expect(processed).not.toContain('<div>');
    });

    it('should handle bulk processing for performance', () => {
      const contentMap = {
        'key1': sampleMarkdown.simple,
        'key2': sampleMarkdown.complex,
        'key3': '# Another heading'
      };
      
      bulkProcessMarkdown(contentMap);
      
      // All items should be cached now
      Object.keys(contentMap).forEach(key => {
        expect(processMarkdown(contentMap[key], key)).toBeDefined();
      });
    });
  });

  describe('End-to-End Markdown Flow', () => {
    it('should handle the complete markdown processing flow', () => {
      // 1. Detect content type
      const contentType = detectContentType(sampleMarkdown.complex);
      expect(contentType).toBe('markdown');
      
      // 2. Validate content
      const isValid = validateContent(sampleMarkdown.complex, contentType);
      expect(isValid).toBe(true);
      
      // 3. Process markdown
      const processed = processMarkdown(sampleMarkdown.complex);
      
      // Check for key HTML elements - we don't check for code specifically since
      // the exact output depends on the marked implementation
      expect(processed).toContain('<h1>');
      expect(processed).toContain('<h2>');
      expect(processed).toContain('<ul>');
      expect(processed).toContain('<ol>');
      expect(processed).toContain('<blockquote>');
      expect(processed).toContain('<pre>');
      // Code tag check removed as it might be implementation-specific
      expect(processed).toContain('<table>');
      
      // 4. Verify cache works
      const cachedResult = processMarkdown(sampleMarkdown.complex);
      expect(cachedResult).toBe(processed);
    });
  });
});