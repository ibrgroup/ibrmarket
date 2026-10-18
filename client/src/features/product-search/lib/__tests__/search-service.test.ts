import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SearchService } from '../search-service';

// Mock fetch
global.fetch = vi.fn();

describe('SearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchSuggestions', () => {
    it('should return empty arrays for empty query', async () => {
      const result = await SearchService.fetchSuggestions('');
      expect(result).toEqual({
        suggestions: [],
        popular: [],
      });
    });

    it('should fetch suggestions successfully', async () => {
      const mockResponse = {
        data: {
          suggestions: [
            { id: '1', title: 'Product 1', category: 'Category 1' },
            { id: '2', title: 'Product 2', category: 'Category 2' },
          ],
          popular: ['popular1', 'popular2'],
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await SearchService.fetchSuggestions('test query');
      expect(result.suggestions).toHaveLength(2);
      expect(result.popular).toHaveLength(2);
    });

    it('should handle response with suggestions array directly', async () => {
      const mockResponse = {
        suggestions: [{ id: '1', title: 'Product 1', category: 'Category 1' }],
        popular: ['popular1'],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await SearchService.fetchSuggestions('test');
      expect(result.suggestions).toHaveLength(1);
      expect(result.popular).toHaveLength(1);
    });

    it('should limit suggestions to specified limit', async () => {
      const mockResponse = {
        data: {
          suggestions: Array.from({ length: 10 }, (_, i) => ({
            id: String(i),
            title: `Product ${i}`,
            category: 'Category',
          })),
          popular: [],
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await SearchService.fetchSuggestions('test', 5);
      expect(result.suggestions).toHaveLength(5);
    });

    it('should limit popular to 10 items', async () => {
      const mockResponse = {
        data: {
          suggestions: [],
          popular: Array.from({ length: 15 }, (_, i) => `popular${i}`),
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await SearchService.fetchSuggestions('test');
      expect(result.popular).toHaveLength(10);
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await SearchService.fetchSuggestions('test');
      expect(result).toEqual({
        suggestions: [],
        popular: [],
      });
    });

    it('should handle non-ok response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await SearchService.fetchSuggestions('test');
      expect(result).toEqual({
        suggestions: [],
        popular: [],
      });
    });

    it('should validate query length', async () => {
      const longQuery = 'a'.repeat(201);
      await expect(SearchService.fetchSuggestions(longQuery)).rejects.toThrow('Query is too long');
    });

    it('should validate limit range', async () => {
      await expect(SearchService.fetchSuggestions('test', 0)).rejects.toThrow(
        'Limit must be between 1 and 50',
      );
      await expect(SearchService.fetchSuggestions('test', 51)).rejects.toThrow(
        'Limit must be between 1 and 50',
      );
    });

    it('should encode query in URL', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { suggestions: [], popular: [] } }),
      });

      await SearchService.fetchSuggestions('test query with spaces');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=test%20query%20with%20spaces'),
      );
    });
  });
});
