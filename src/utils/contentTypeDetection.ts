/**
 * Content type detection utilities for TransPal
 * Automatically detects whether content should be processed as markdown or plain text
 */

export type ContentType = 'text' | 'markdown';

/**
 * Detects if content contains markdown syntax that would benefit from full markdown processing
 * @param text - The text content to analyze
 * @returns 'markdown' if markdown syntax is detected, 'text' otherwise
 */
export function detectContentType(text: string): ContentType {
  if (!text || typeof text !== 'string') {
    return 'text';
  }

  // Markdown patterns to look for
  const markdownPatterns = [
    /^#{1,6}\s/m,           // Headers (# ## ### etc.)
    /^\s*[-*+]\s/m,         // Unordered lists
    /^\s*\d+\.\s/m,         // Ordered lists
    /```[\s\S]*?```/,       // Code blocks
    /`[^`\n]+`/,            // Inline code (but not just single backticks)
    /\[.*?\]\(.*?\)/,       // Links [text](url)
    /^\s*\|.*\|/m,          // Tables
    /^\s*>/m,               // Blockquotes
    /^\s*---+\s*$/m,        // Horizontal rules
    /\*\*.*?\*\*/,          // Bold text (but only if it's more complex than simple formatting)
    /__.*?__/,              // Bold text (alternative syntax)
    /\n\s*\n/,              // Multiple line breaks (paragraph separation)
  ];

  // Check for markdown indicators
  const hasMarkdownSyntax = markdownPatterns.some(pattern => pattern.test(text));

  // Additional heuristics for complex content
  if (!hasMarkdownSyntax) {
    // Check for multiple formatting elements that suggest structured content
    const boldCount = (text.match(/\*\*.*?\*\*/g) || []).length;
    const italicCount = (text.match(/\*.*?\*/g) || []).length;
    const codeCount = (text.match(/`.*?`/g) || []).length;
    const lineBreakCount = (text.match(/\n/g) || []).length;

    // If there are multiple formatting elements or many line breaks, treat as markdown
    if ((boldCount + italicCount + codeCount) >= 3 || lineBreakCount >= 5) {
      return 'markdown';
    }
  }

  return hasMarkdownSyntax ? 'markdown' : 'text';
}

/**
 * Validates that content is safe and properly formatted
 * @param content - The content to validate
 * @param type - The expected content type
 * @returns true if content is valid, false otherwise
 */
export function validateContent(content: string, type: ContentType): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }

  // Basic validation - content should not be empty after trimming
  if (content.trim().length === 0) {
    return false;
  }

  // For markdown content, do additional validation
  if (type === 'markdown') {
    // Check for potentially malicious content patterns
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,  // Event handlers like onclick=
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    if (dangerousPatterns.some(pattern => pattern.test(content))) {
      console.warn('Potentially dangerous content detected in markdown');
      return false;
    }
  }

  return true;
}

/**
 * Determines the appropriate processing method for content
 * @param content - The content to analyze
 * @returns Object with content type and processing recommendations
 */
export function analyzeContent(content: string): {
  type: ContentType;
  isValid: boolean;
  shouldUseMarkdown: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
} {
  const type = detectContentType(content);
  const isValid = validateContent(content, type);
  
  // Determine complexity based on content characteristics
  let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
  
  if (type === 'markdown') {
    const lineCount = (content.match(/\n/g) || []).length;
    const wordCount = content.split(/\s+/).length;
    
    if (lineCount > 10 || wordCount > 200) {
      complexity = 'complex';
    } else if (lineCount > 3 || wordCount > 50) {
      complexity = 'moderate';
    }
  }

  return {
    type,
    isValid,
    shouldUseMarkdown: type === 'markdown' && isValid,
    complexity
  };
}