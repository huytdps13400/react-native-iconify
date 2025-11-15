import { fetchIconData } from '../src/fetch';
import { loadIcon, loadIcons } from '../src/loader';
import { IconifyAPIError } from '../src/types';
import { createMockFetch, mockIconifyResponse, mockSuccessResponse } from './__mocks__/fetch';

describe('@react-native-iconify/api - integration', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = createMockFetch();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Full flow: fetch → parse → load', () => {
    it('should complete full flow for single icon', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessResponse(mockIconifyResponse));

      const result = await loadIcon('mdi:home');

      expect(result).toBeDefined();
      expect(result.name).toBe('mdi:home');
      expect(result.body).toBe(mockIconifyResponse.icons.home.body);
      expect(result.width).toBe(24);
      expect(result.height).toBe(24);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should complete full flow for multiple icons', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessResponse(mockIconifyResponse));

      const results = await loadIcons(['mdi:home', 'mdi:settings']);

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('mdi:home');
      expect(results[1].name).toBe('mdi:settings');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Single request for same prefix
    });

    it('should handle multiple prefixes in parallel', async () => {
      mockFetch
        .mockResolvedValueOnce(mockSuccessResponse(mockIconifyResponse))
        .mockResolvedValueOnce(mockSuccessResponse({
          prefix: 'fa',
          icons: {
            user: { body: '<path />', width: 24, height: 24 }
          }
        }));

      const results = await loadIcons(['mdi:home', 'fa:user']);

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('mdi:home');
      expect(results[1].name).toBe('fa:user');
      expect(mockFetch).toHaveBeenCalledTimes(2); // One per prefix
    });
  });

  describe('Error handling scenarios', () => {
    it('should handle offline scenario', async () => {
      jest.useFakeTimers();
      mockFetch.mockRejectedValue(new Error('Network error'));

      const promise = loadIcon('mdi:home');
      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow(IconifyAPIError);
      jest.useRealTimers();
    }, 30000);

    it('should recover from temporary API error', async () => {
      jest.useFakeTimers();

      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve(mockSuccessResponse(mockIconifyResponse));
      });

      const promise = loadIcon('mdi:home');
      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result).toBeDefined();
      expect(result.name).toBe('mdi:home');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should handle invalid icon name', async () => {
      await expect(loadIcon('invalid')).rejects.toThrow(IconifyAPIError);
      await expect(loadIcon('invalid')).rejects.toThrow('Invalid icon name format');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle icon not found in response', async () => {
      mockFetch.mockResolvedValue(mockSuccessResponse({
        prefix: 'mdi',
        icons: {}
      }));

      await expect(loadIcon('mdi:nonexistent')).rejects.toThrow(IconifyAPIError);
      await expect(loadIcon('mdi:nonexistent')).rejects.toThrow('not found');
    });

    it('should handle malformed response data', async () => {
      mockFetch.mockResolvedValue(mockSuccessResponse({
        prefix: 'mdi',
        icons: {
          broken: { body: '<path />' } // Missing width/height
        }
      }));

      await expect(loadIcon('mdi:broken')).rejects.toThrow(IconifyAPIError);
      await expect(loadIcon('mdi:broken')).rejects.toThrow('Missing or invalid');
    });
  });

  describe('Redundancy & Failover', () => {
    it('should failover to backup host when primary fails', async () => {
      jest.useFakeTimers();

      mockFetch
        .mockRejectedValueOnce(new Error('Primary host down'))
        .mockRejectedValueOnce(new Error('Retry 1'))
        .mockRejectedValueOnce(new Error('Retry 2'))
        .mockResolvedValueOnce(mockSuccessResponse(mockIconifyResponse));

      const promise = loadIcon('mdi:home');
      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result).toBeDefined();
      expect(result.name).toBe('mdi:home');
      expect(mockFetch).toHaveBeenCalledTimes(4);

      jest.useRealTimers();
    });

    it('should use all hosts before giving up', async () => {
      jest.useFakeTimers();

      mockFetch.mockRejectedValue(new Error('All hosts down'));

      const promise = loadIcon('mdi:home');
      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow('All API hosts unreachable');

      // 3 hosts × 3 retries = 9 attempts
      expect(mockFetch).toHaveBeenCalledTimes(9);

      jest.useRealTimers();
    });

    it('should respect custom hosts configuration', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessResponse(mockIconifyResponse));

      const result = await fetchIconData('mdi:home', {
        hosts: ['https://custom.api.com']
      });

      expect(result).toBeDefined();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.api.com/mdi.json',
        expect.any(Object)
      );
    });
  });

  describe('Performance & Efficiency', () => {
    it('should batch icons from same prefix efficiently', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessResponse(mockIconifyResponse));

      await loadIcons(['mdi:home', 'mdi:settings']);

      // Should only make 1 request for both icons
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle large batch of icons', async () => {
      const icons = Array.from({ length: 100 }, (_, i) => `mdi:icon${i}`);

      mockFetch.mockResolvedValueOnce(mockSuccessResponse({
        prefix: 'mdi',
        icons: Object.fromEntries(
          icons.map((name, i) => [
            `icon${i}`,
            { body: '<path />', width: 24, height: 24 }
          ])
        )
      }));

      const results = await loadIcons(icons);

      expect(results).toHaveLength(100);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Single request
    });
  });

  describe('Cache key consistency', () => {
    it('should generate consistent cache keys for same icon', async () => {
      const { getCacheKey } = await import('../src/fetch');

      const key1 = getCacheKey('mdi:home');
      const key2 = getCacheKey('mdi:home');

      expect(key1).toBe(key2);
    });

    it('should generate unique cache keys for different icons', async () => {
      const { getCacheKey } = await import('../src/fetch');

      const keys = ['mdi:home', 'mdi:settings', 'fa:user'].map(getCacheKey);

      expect(new Set(keys).size).toBe(3); // All unique
    });
  });

  describe('Edge cases', () => {
    it('should handle empty icon list', async () => {
      const results = await loadIcons([]);

      expect(results).toHaveLength(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle icon with all optional properties', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessResponse({
        prefix: 'mdi',
        icons: {
          full: {
            body: '<path />',
            width: 32,
            height: 32,
            left: 1,
            top: 2,
            rotate: 90,
            hFlip: true,
            vFlip: false
          }
        }
      }));

      const result = await loadIcon('mdi:full');

      expect(result.left).toBe(1);
      expect(result.top).toBe(2);
      expect(result.rotate).toBe(90);
      expect(result.hFlip).toBe(true);
      expect(result.vFlip).toBe(false);
    });

    it('should handle icon with minimal properties', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessResponse({
        prefix: 'mdi',
        icons: {
          minimal: {
            body: '<path />',
            width: 24,
            height: 24
          }
        }
      }));

      const result = await loadIcon('mdi:minimal');

      expect(result.body).toBe('<path />');
      expect(result.width).toBe(24);
      expect(result.height).toBe(24);
      expect(result.left).toBeUndefined();
      expect(result.top).toBeUndefined();
    });
  });
});
