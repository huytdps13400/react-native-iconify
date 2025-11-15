import { fetchIconData, getCacheKey } from '../src/fetch';
import { IconifyAPIError } from '../src/types';
import { createMockFetch, mockIconifyResponse, mockSuccessResponse, mockErrorResponse } from './__mocks__/fetch';

describe('@react-native-iconify/api - fetch', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = createMockFetch();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getCacheKey', () => {
    it('should generate consistent cache key', () => {
      const key1 = getCacheKey('mdi:home');
      const key2 = getCacheKey('mdi:home');

      expect(key1).toBe(key2);
      expect(key1).toBe('icon:mdi:home:1');
    });

    it('should generate different keys for different icons', () => {
      const key1 = getCacheKey('mdi:home');
      const key2 = getCacheKey('mdi:settings');

      expect(key1).not.toBe(key2);
    });
  });

  describe('fetchIconData', () => {
    it('should fetch icon from primary host', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessResponse(mockIconifyResponse));

      const result = await fetchIconData('mdi:home');

      expect(result).toEqual(mockIconifyResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.iconify.design/mdi.json',
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should fallback to secondary host on primary failure', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockRejectedValueOnce(new Error('Primary failed again'))
        .mockRejectedValueOnce(new Error('Primary failed third time'))
        .mockResolvedValueOnce(mockSuccessResponse(mockIconifyResponse));

      const result = await fetchIconData('mdi:home');

      expect(result).toEqual(mockIconifyResponse);
      expect(mockFetch).toHaveBeenCalledTimes(4); // 3 retries on first host, then second host
    });

    it('should throw error for invalid icon name format', async () => {
      await expect(fetchIconData('invalid-name')).rejects.toThrow(IconifyAPIError);
      await expect(fetchIconData('invalid-name')).rejects.toThrow('Invalid icon name format');
    });

    it('should handle 404 not found error', async () => {
      mockFetch.mockResolvedValue(mockErrorResponse(404, 'Not Found'));

      await expect(fetchIconData('unknown:icon')).rejects.toThrow(IconifyAPIError);
      await expect(fetchIconData('unknown:icon')).rejects.toThrow('Icon prefix not found');
    });

    it('should handle HTTP error status', async () => {
      jest.useFakeTimers();
      mockFetch.mockResolvedValue(mockErrorResponse(500, 'Internal Server Error'));

      const promise = fetchIconData('mdi:home');
      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow(IconifyAPIError);
      jest.useRealTimers();
    }, 30000);

    it('should handle invalid JSON response', async () => {
      jest.useFakeTimers();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => { throw new SyntaxError('Invalid JSON'); }
      });

      const promise = fetchIconData('mdi:home');
      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow(IconifyAPIError);
      jest.useRealTimers();
    }, 30000);

    it('should throw error when all hosts fail', async () => {
      jest.useFakeTimers();
      mockFetch.mockRejectedValue(new Error('Network error'));

      const promise = fetchIconData('mdi:home');
      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow(IconifyAPIError);
      jest.useRealTimers();
    }, 30000);

    it('should respect custom timeout', async () => {
      jest.useFakeTimers();

      mockFetch.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockSuccessResponse(mockIconifyResponse)), 10000))
      );

      const promise = fetchIconData('mdi:home', { timeout: 100 });

      jest.advanceTimersByTime(200);

      await expect(promise).rejects.toThrow();

      jest.useRealTimers();
    }, 30000);

    it('should respect custom hosts', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessResponse(mockIconifyResponse));

      await fetchIconData('mdi:home', {
        hosts: ['https://custom.api.com']
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.api.com/mdi.json',
        expect.any(Object)
      );
    });

    it('should respect abort signal', async () => {
      jest.useFakeTimers();
      const controller = new AbortController();

      mockFetch.mockImplementation(() => {
        controller.abort();
        return Promise.reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
      });

      const promise = fetchIconData('mdi:home', { signal: controller.signal });
      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow();
      jest.useRealTimers();
    }, 30000);

    it('should retry with exponential backoff', async () => {
      jest.useFakeTimers();

      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve(mockSuccessResponse(mockIconifyResponse));
      });

      const promise = fetchIconData('mdi:home', { maxRetries: 3 });

      // Advance timers for exponential backoff delays
      await jest.runAllTimersAsync();

      const result = await promise;
      expect(result).toEqual(mockIconifyResponse);
      expect(callCount).toBe(3);

      jest.useRealTimers();
    });

    it('should not retry on NOT_FOUND error', async () => {
      mockFetch.mockResolvedValue(mockErrorResponse(404, 'Not Found'));

      await expect(fetchIconData('unknown:icon')).rejects.toThrow('Icon prefix not found');

      // Should only try once (no retries on NOT_FOUND)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should respect maxRetries option', async () => {
      jest.useFakeTimers();
      mockFetch.mockRejectedValue(new Error('Network error'));

      const promise = fetchIconData('mdi:home', { maxRetries: 1 });
      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow();

      // Each host should only retry once
      expect(mockFetch).toHaveBeenCalledTimes(3); // 3 hosts × 1 retry
      jest.useRealTimers();
    }, 30000);

    it('should handle non-Error exceptions', async () => {
      jest.useFakeTimers();
      mockFetch.mockRejectedValue('String error'); // Not an Error instance

      const promise = fetchIconData('mdi:home');
      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Unknown error');
      jest.useRealTimers();
    }, 30000);
  });
});
