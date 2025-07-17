import { describe, it, expect, vi } from 'vitest';
import { getAllSpeeches, searchSpeeches } from '../utils/speeches';

describe('Performance Tests', () => {
  describe('Speech Loading Performance', () => {
    it('should load all speeches within reasonable time', () => {
      const startTime = performance.now();
      const speeches = getAllSpeeches();
      const endTime = performance.now();
      
      const loadTime = endTime - startTime;
      
      // Should load within 100ms for reasonable dataset sizes
      expect(loadTime).toBeLessThan(100);
      expect(speeches).toBeDefined();
    });

    it('should handle large search queries efficiently', () => {
      const startTime = performance.now();
      
      // Test with multiple search terms
      const searchTerms = ['政府', '政策', '數位', '科技', '未來'];
      const results = searchTerms.map(term => searchSpeeches(term));
      
      const endTime = performance.now();
      const searchTime = endTime - startTime;
      
      // Multiple searches should complete within 50ms
      expect(searchTime).toBeLessThan(50);
      expect(results).toHaveLength(searchTerms.length);
    });

    it('should handle repeated searches efficiently', () => {
      const searchTerm = '政府';
      const iterations = 100;
      
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        searchSpeeches(searchTerm);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / iterations;
      
      // Average search time should be under 1ms
      expect(averageTime).toBeLessThan(1);
    });
  });

  describe('Memory Usage', () => {
    it('should not create memory leaks during repeated operations', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        getAllSpeeches();
        searchSpeeches('test');
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory growth should be reasonable (less than 10MB)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // 10MB
      }
    });
  });
});