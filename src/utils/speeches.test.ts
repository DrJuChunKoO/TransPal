import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAllSpeeches, getSpeechByFilename, searchSpeeches, getMessageById } from './speeches';

// Mock the generated speeches data
vi.mock('./generated/index.js', () => ({
  speeches: [
    {
      filename: '2024-02-22-audrey-first-visit',
      title: 'Audrey First Visit',
      date: '2024-02-22',
      messages: [
        { id: '1', speaker: 'Audrey Tang', content: 'Hello everyone' },
        { id: '2', speaker: 'Interviewer', content: 'Welcome to our show' }
      ]
    },
    {
      filename: '2024-03-01-press-conf',
      title: 'Press Conference',
      date: '2024-03-01',
      messages: [
        { id: '1', speaker: 'Minister', content: 'Today we announce new policies' }
      ]
    }
  ]
}));

describe('speeches utilities', () => {
  describe('getAllSpeeches', () => {
    it('should return all speeches', () => {
      const speeches = getAllSpeeches();
      expect(speeches).toHaveLength(2);
      expect(speeches[0].filename).toBe('2024-02-22-audrey-first-visit');
    });

    it('should return speeches sorted by date descending', () => {
      const speeches = getAllSpeeches();
      expect(speeches[0].date >= speeches[1].date).toBe(true);
    });
  });

  describe('getSpeechByFilename', () => {
    it('should return speech when filename exists', () => {
      const speech = getSpeechByFilename('2024-02-22-audrey-first-visit');
      expect(speech).toBeDefined();
      expect(speech?.title).toBe('Audrey First Visit');
    });

    it('should return undefined when filename does not exist', () => {
      const speech = getSpeechByFilename('non-existent-speech');
      expect(speech).toBeUndefined();
    });
  });

  describe('searchSpeeches', () => {
    it('should return speeches matching title search', () => {
      const results = searchSpeeches('Audrey');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Audrey First Visit');
    });

    it('should return speeches matching content search', () => {
      const results = searchSpeeches('policies');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Press Conference');
    });

    it('should return empty array when no matches found', () => {
      const results = searchSpeeches('nonexistent');
      expect(results).toHaveLength(0);
    });

    it('should be case insensitive', () => {
      const results = searchSpeeches('AUDREY');
      expect(results).toHaveLength(1);
    });
  });

  describe('getMessageById', () => {
    it('should return message when found', () => {
      const speech = getSpeechByFilename('2024-02-22-audrey-first-visit');
      const message = getMessageById(speech!, '1');
      expect(message).toBeDefined();
      expect(message?.speaker).toBe('Audrey Tang');
    });

    it('should return undefined when message not found', () => {
      const speech = getSpeechByFilename('2024-02-22-audrey-first-visit');
      const message = getMessageById(speech!, 'nonexistent');
      expect(message).toBeUndefined();
    });
  });
});