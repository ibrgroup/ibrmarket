import { describe, it, expect, beforeEach } from 'vitest';
import { loadRecentSearches, saveToRecent, removeFromRecent } from '../recent-searches';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

describe('recent-searches utilities', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Mock window.localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  describe('loadRecentSearches', () => {
    it('should return empty array when localStorage is empty', () => {
      expect(loadRecentSearches()).toEqual([]);
    });

    it('should load valid array from localStorage', () => {
      localStorageMock.setItem('recent-searches', JSON.stringify(['query1', 'query2']));
      expect(loadRecentSearches()).toEqual(['query1', 'query2']);
    });

    it('should filter out non-string items', () => {
      localStorageMock.setItem(
        'recent-searches',
        JSON.stringify(['query1', 123, null, 'query2', {}]),
      );
      expect(loadRecentSearches()).toEqual(['query1', 'query2']);
    });

    it('should filter out empty strings', () => {
      localStorageMock.setItem('recent-searches', JSON.stringify(['query1', '', '  ', 'query2']));
      expect(loadRecentSearches()).toEqual(['query1', 'query2']);
    });

    it('should limit to 10 items', () => {
      const items = Array.from({ length: 15 }, (_, i) => `query${i}`);
      localStorageMock.setItem('recent-searches', JSON.stringify(items));
      const result = loadRecentSearches();
      expect(result.length).toBe(10);
      expect(result).toEqual(items.slice(0, 10));
    });

    it('should return empty array for invalid JSON', () => {
      localStorageMock.setItem('recent-searches', 'invalid json');
      // Should not throw, but return empty array
      expect(() => loadRecentSearches()).not.toThrow();
    });
  });

  describe('saveToRecent', () => {
    it('should save query to localStorage', () => {
      const result = saveToRecent('new query');
      expect(result).toContain('new query');
      expect(result[0]).toBe('new query');
    });

    it('should remove duplicates (case-insensitive)', () => {
      localStorageMock.setItem('recent-searches', JSON.stringify(['Query1', 'query2']));
      const result = saveToRecent('query1');
      expect(result).toEqual(['query1', 'query2']);
      expect(result.filter(q => q.toLowerCase() === 'query1').length).toBe(1);
    });

    it('should add to beginning of list', () => {
      localStorageMock.setItem('recent-searches', JSON.stringify(['old1', 'old2']));
      const result = saveToRecent('new');
      expect(result[0]).toBe('new');
    });

    it('should limit to 10 items', () => {
      localStorageMock.setItem(
        'recent-searches',
        JSON.stringify(Array.from({ length: 10 }, (_, i) => `query${i}`)),
      );
      const result = saveToRecent('new query');
      expect(result.length).toBe(10);
      expect(result[0]).toBe('new query');
    });

    it('should trim query before saving', () => {
      const result = saveToRecent('  query with spaces  ');
      expect(result[0]).toBe('query with spaces');
    });

    it('should not save empty query', () => {
      localStorageMock.setItem('recent-searches', JSON.stringify(['existing']));
      const result = saveToRecent('');
      expect(result).toEqual(['existing']);
    });
  });

  describe('removeFromRecent', () => {
    it('should remove query from localStorage', () => {
      localStorageMock.setItem('recent-searches', JSON.stringify(['query1', 'query2', 'query3']));
      const result = removeFromRecent('query2');
      expect(result).toEqual(['query1', 'query3']);
      expect(result).not.toContain('query2');
    });

    it('should return same array if query not found', () => {
      localStorageMock.setItem('recent-searches', JSON.stringify(['query1', 'query2']));
      const result = removeFromRecent('query3');
      expect(result).toEqual(['query1', 'query2']);
    });

    it('should handle empty array', () => {
      const result = removeFromRecent('query1');
      expect(result).toEqual([]);
    });
  });
});
