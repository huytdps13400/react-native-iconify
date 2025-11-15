import { parseIconData, loadIcon, loadIcons } from '../src/loader';
import { IconifyAPIError } from '../src/types';
import { fetchIconData } from '../src/fetch';
import { mockIconifyResponse } from './__mocks__/fetch';

// Mock fetch module
jest.mock('../src/fetch');
const mockFetchIconData = fetchIconData as jest.MockedFunction<typeof fetchIconData>;

describe('@react-native-iconify/api - loader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseIconData', () => {
    it('should parse valid icon data', () => {
      const raw = {
        name: 'mdi:home',
        body: '<path d="..." />',
        width: 24,
        height: 24
      };

      const result = parseIconData(raw);

      expect(result.name).toBe('mdi:home');
      expect(result.body).toBe('<path d="..." />');
      expect(result.width).toBe(24);
      expect(result.height).toBe(24);
    });

    it('should use iconName parameter when name is missing', () => {
      const raw = {
        body: '<path />',
        width: 24,
        height: 24
      };

      const result = parseIconData(raw, 'mdi:test');

      expect(result.name).toBe('mdi:test');
    });

    it('should throw on invalid data type', () => {
      expect(() => parseIconData(null)).toThrow(IconifyAPIError);
      expect(() => parseIconData('not-an-object')).toThrow('Invalid icon data type');
      expect(() => parseIconData(123)).toThrow('Invalid icon data type');
    });

    it('should throw on missing body field', () => {
      expect(() => parseIconData({ width: 24, height: 24 })).toThrow(IconifyAPIError);
      expect(() => parseIconData({ width: 24, height: 24 })).toThrow('Missing or invalid "body" field');
    });

    it('should throw on missing body without iconName', () => {
      // Test without iconName to cover else branch
      expect(() => parseIconData({ width: 24, height: 24 })).toThrow('Missing or invalid "body" field');
    });

    it('should throw on empty body field', () => {
      expect(() => parseIconData({ body: '', width: 24, height: 24 })).toThrow(IconifyAPIError);
    });

    it('should throw on missing width field', () => {
      expect(() => parseIconData({ body: '<path />', height: 24 })).toThrow(IconifyAPIError);
      expect(() => parseIconData({ body: '<path />', height: 24 })).toThrow('Missing or invalid "width" field');
    });

    it('should throw on missing width without iconName', () => {
      // Test without iconName to cover else branch
      expect(() => parseIconData({ body: '<path />', height: 24 })).toThrow('Missing or invalid "width" field');
    });

    it('should throw on invalid width (zero or negative)', () => {
      expect(() => parseIconData({ body: '<path />', width: 0, height: 24 })).toThrow(IconifyAPIError);
      expect(() => parseIconData({ body: '<path />', width: -1, height: 24 })).toThrow(IconifyAPIError);
    });

    it('should throw on missing height field', () => {
      expect(() => parseIconData({ body: '<path />', width: 24 })).toThrow(IconifyAPIError);
      expect(() => parseIconData({ body: '<path />', width: 24 })).toThrow('Missing or invalid "height" field');
    });

    it('should throw on missing height without iconName', () => {
      // Test without iconName to cover else branch
      expect(() => parseIconData({ body: '<path />', width: 24 })).toThrow('Missing or invalid "height" field');
    });

    it('should throw on invalid height (zero or negative)', () => {
      expect(() => parseIconData({ body: '<path />', width: 24, height: 0 })).toThrow(IconifyAPIError);
      expect(() => parseIconData({ body: '<path />', width: 24, height: -1 })).toThrow(IconifyAPIError);
    });

    it('should parse optional fields', () => {
      const raw = {
        name: 'mdi:test',
        body: '<path />',
        width: 24,
        height: 24,
        left: 1,
        top: 2,
        rotate: 90,
        hFlip: true,
        vFlip: false
      };

      const result = parseIconData(raw);

      expect(result.left).toBe(1);
      expect(result.top).toBe(2);
      expect(result.rotate).toBe(90);
      expect(result.hFlip).toBe(true);
      expect(result.vFlip).toBe(false);
    });

    it('should omit optional fields when not provided', () => {
      const raw = {
        body: '<path />',
        width: 24,
        height: 24
      };

      const result = parseIconData(raw);

      expect(result.left).toBeUndefined();
      expect(result.top).toBeUndefined();
      expect(result.rotate).toBeUndefined();
      expect(result.hFlip).toBeUndefined();
      expect(result.vFlip).toBeUndefined();
    });

    it('should include iconName in error message when provided', () => {
      expect(() => parseIconData({ body: '', width: 24, height: 24 }, 'mdi:test'))
        .toThrow('for mdi:test');
    });
  });

  describe('loadIcon', () => {
    it('should load single icon', async () => {
      mockFetchIconData.mockResolvedValueOnce(mockIconifyResponse);

      const result = await loadIcon('mdi:home');

      expect(result.name).toBe('mdi:home');
      expect(result.body).toBe(mockIconifyResponse.icons.home.body);
      expect(mockFetchIconData).toHaveBeenCalledWith('mdi:home');
    });

    it('should throw error for invalid icon name format', async () => {
      await expect(loadIcon('invalid')).rejects.toThrow(IconifyAPIError);
      await expect(loadIcon('invalid')).rejects.toThrow('Invalid icon name format');
    });

    it('should throw error when icon not found in response', async () => {
      mockFetchIconData.mockResolvedValue({
        prefix: 'mdi',
        icons: {}
      });

      await expect(loadIcon('mdi:nonexistent')).rejects.toThrow(IconifyAPIError);
      await expect(loadIcon('mdi:nonexistent')).rejects.toThrow('not found');
    });

    it('should merge icon data with response defaults', async () => {
      mockFetchIconData.mockResolvedValueOnce({
        prefix: 'mdi',
        icons: {
          test: {
            body: '<path />'
          }
        },
        width: 32,
        height: 32,
        rotate: 90
      });

      const result = await loadIcon('mdi:test');

      expect(result.width).toBe(32);
      expect(result.height).toBe(32);
      expect(result.rotate).toBe(90);
    });

    it('should prioritize icon-specific properties over defaults', async () => {
      mockFetchIconData.mockResolvedValueOnce({
        prefix: 'mdi',
        icons: {
          test: {
            body: '<path />',
            width: 48,
            height: 48
          }
        },
        width: 24,
        height: 24
      });

      const result = await loadIcon('mdi:test');

      expect(result.width).toBe(48);
      expect(result.height).toBe(48);
    });

    it('should wrap non-IconifyAPIError in IconifyAPIError', async () => {
      mockFetchIconData.mockRejectedValueOnce(new Error('Unknown error'));

      await expect(loadIcon('mdi:test')).rejects.toThrow(IconifyAPIError);
      await expect(loadIcon('mdi:test')).rejects.toThrow('Failed to load icon');
    });

    it('should preserve IconifyAPIError', async () => {
      const error = new IconifyAPIError('Custom error', 'NOT_FOUND');
      mockFetchIconData.mockRejectedValueOnce(error);

      await expect(loadIcon('mdi:test')).rejects.toThrow(error);
    });
  });

  describe('loadIcons', () => {
    it('should load multiple icons from same prefix', async () => {
      mockFetchIconData.mockResolvedValueOnce(mockIconifyResponse);

      const results = await loadIcons(['mdi:home', 'mdi:settings']);

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('mdi:home');
      expect(results[1].name).toBe('mdi:settings');
      expect(mockFetchIconData).toHaveBeenCalledTimes(1);
    });

    it('should load icons from multiple prefixes in parallel', async () => {
      mockFetchIconData
        .mockResolvedValueOnce(mockIconifyResponse)
        .mockResolvedValueOnce({
          prefix: 'fa',
          icons: {
            home: { body: '<path />', width: 24, height: 24 }
          }
        });

      const results = await loadIcons(['mdi:home', 'fa:home']);

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('mdi:home');
      expect(results[1].name).toBe('fa:home');
      expect(mockFetchIconData).toHaveBeenCalledTimes(2);
    });

    it('should return icons in original order', async () => {
      mockFetchIconData.mockResolvedValueOnce(mockIconifyResponse);

      const results = await loadIcons(['mdi:settings', 'mdi:home']);

      expect(results[0].name).toBe('mdi:settings');
      expect(results[1].name).toBe('mdi:home');
    });

    it('should throw error for invalid icon name format', async () => {
      await expect(loadIcons(['invalid'])).rejects.toThrow(IconifyAPIError);
      await expect(loadIcons(['mdi:home', 'invalid'])).rejects.toThrow('Invalid icon name format');
    });

    it('should throw error when prefix fetch fails', async () => {
      mockFetchIconData.mockRejectedValueOnce(new Error('Network error'));

      await expect(loadIcons(['mdi:home'])).rejects.toThrow();
    });

    it('should handle empty array', async () => {
      const results = await loadIcons([]);

      expect(results).toHaveLength(0);
      expect(mockFetchIconData).not.toHaveBeenCalled();
    });

    it('should group icons by prefix efficiently', async () => {
      mockFetchIconData
        .mockResolvedValueOnce(mockIconifyResponse)
        .mockResolvedValueOnce({
          prefix: 'fa',
          icons: {
            user: { body: '<path />', width: 24, height: 24 },
            star: { body: '<path />', width: 24, height: 24 }
          }
        });

      await loadIcons(['mdi:home', 'fa:user', 'mdi:settings', 'fa:star']);

      // Should only call fetchIconData twice (once per prefix)
      expect(mockFetchIconData).toHaveBeenCalledTimes(2);
    });

    it('should throw error when prefix fetch returns undefined', async () => {
      // Mock to simulate a missing response in map
      mockFetchIconData.mockImplementation(async (name: string) => {
        // Return undefined to trigger the missing response case
        return undefined as any;
      });

      await expect(loadIcons(['mdi:home'])).rejects.toThrow('Failed to fetch prefix');
    });
  });
});
