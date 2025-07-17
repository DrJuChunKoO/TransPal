import { describe, it, expect, vi } from 'vitest';
import { getAllSpeeches, getSpeechByFilename, searchSpeeches } from '../utils/speeches';

describe('Integration Tests', () => {
  describe('Speech Data Integration', () => {
    it('should load and process speech data correctly', () => {
      const speeches = getAllSpeeches();
      
      // Verify basic structure
      expect(Array.isArray(speeches)).toBe(true);
      
      if (speeches.length > 0) {
        const firstSpeech = speeches[0];
        expect(firstSpeech).toHaveProperty('filename');
        expect(firstSpeech).toHaveProperty('title');
        expect(firstSpeech).toHaveProperty('date');
        expect(firstSpeech).toHaveProperty('messages');
        expect(Array.isArray(firstSpeech.messages)).toBe(true);
      }
    });

    it('should maintain data consistency between search and direct access', () => {
      const allSpeeches = getAllSpeeches();
      
      if (allSpeeches.length > 0) {
        const firstSpeech = allSpeeches[0];
        const directAccess = getSpeechByFilename(firstSpeech.filename);
        
        expect(directAccess).toBeDefined();
        expect(directAccess?.filename).toBe(firstSpeech.filename);
        expect(directAccess?.title).toBe(firstSpeech.title);
      }
    });

    it('should handle search functionality across all data', () => {
      const allSpeeches = getAllSpeeches();
      
      if (allSpeeches.length > 0) {
        // Test search with a common word that should exist
        const searchResults = searchSpeeches('the');
        expect(Array.isArray(searchResults)).toBe(true);
        
        // All search results should be valid speeches
        searchResults.forEach(result => {
          expect(result).toHaveProperty('filename');
          expect(result).toHaveProperty('title');
          expect(result).toHaveProperty('messages');
        });
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle missing speech files gracefully', () => {
      const nonExistentSpeech = getSpeechByFilename('non-existent-file');
      expect(nonExistentSpeech).toBeUndefined();
    });

    it('should handle empty search queries', () => {
      const emptyResults = searchSpeeches('');
      expect(Array.isArray(emptyResults)).toBe(true);
    });

    it('should handle special characters in search', () => {
      const specialCharResults = searchSpeeches('!@#$%^&*()');
      expect(Array.isArray(specialCharResults)).toBe(true);
    });
  });
});