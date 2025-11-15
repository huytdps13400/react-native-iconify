/**
 * Tests for IconifyIcon component
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { IconifyIcon } from '../src/IconifyIcon';
import { fetchIconData } from '@react-native-iconify/api';
import { createCache } from '@react-native-iconify/turbo-cache';

// Get mocked modules
const mockFetchIconData = fetchIconData as jest.MockedFunction<typeof fetchIconData>;
const mockCreateCache = createCache as jest.MockedFunction<typeof createCache>;

describe('@react-native-iconify/api-integration - IconifyIcon', () => {
  let mockCache: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock cache
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(() => ({
        hits: 0,
        misses: 0,
        size: 0,
        hitRate: 0
      }))
    };

    mockCreateCache.mockReturnValue(mockCache);
  });

  describe('rendering', () => {
    it('should render loading state initially', () => {
      mockCache.get.mockResolvedValue(null);
      mockFetchIconData.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { getByTestId } = render(<IconifyIcon name="mdi:home" testID="icon" />);

      expect(getByTestId('icon-loading')).toBeDefined();
    });

    it('should render icon after successful load', async () => {
      const iconData = {
        name: 'mdi:home',
        body: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
        width: 24,
        height: 24
      };

      mockCache.get.mockResolvedValue(null);
      mockFetchIconData.mockResolvedValue(iconData);

      const { getByTestId } = render(<IconifyIcon name="mdi:home" testID="icon" />);

      await waitFor(() => {
        expect(getByTestId('icon')).toBeDefined();
      });
    });

    it('should render error state on fetch failure', async () => {
      mockCache.get.mockResolvedValue(null);
      mockFetchIconData.mockRejectedValue(new Error('Network error'));

      const { getByTestId } = render(<IconifyIcon name="mdi:home" testID="icon" />);

      await waitFor(() => {
        expect(getByTestId('icon-error')).toBeDefined();
      });
    });

    it('should render custom fallback during loading', () => {
      mockCache.get.mockResolvedValue(null);
      mockFetchIconData.mockImplementation(() => new Promise(() => {}));

      const fallback = <div>Custom Loading</div>;
      const { getByText } = render(
        <IconifyIcon name="mdi:home" fallback={fallback} testID="icon" />
      );

      expect(getByText('Custom Loading')).toBeDefined();
    });

    it('should render custom fallback on error', async () => {
      mockCache.get.mockResolvedValue(null);
      mockFetchIconData.mockRejectedValue(new Error('Network error'));

      const fallback = <div>Custom Error</div>;
      const { getByText } = render(
        <IconifyIcon name="mdi:home" fallback={fallback} testID="icon" />
      );

      await waitFor(() => {
        expect(getByText('Custom Error')).toBeDefined();
      });
    });
  });

  describe('caching', () => {
    it('should check cache before fetching', async () => {
      const cachedBody = 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z';
      mockCache.get.mockResolvedValue(cachedBody);

      render(<IconifyIcon name="mdi:home" />);

      await waitFor(() => {
        expect(mockCache.get).toHaveBeenCalledWith('icon:mdi:home');
        expect(mockFetchIconData).not.toHaveBeenCalled();
      });
    });

    it('should cache icon after fetching', async () => {
      const iconData = {
        name: 'mdi:home',
        body: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
        width: 24,
        height: 24
      };

      mockCache.get.mockResolvedValue(null);
      mockFetchIconData.mockResolvedValue(iconData);

      render(<IconifyIcon name="mdi:home" />);

      await waitFor(() => {
        expect(mockCache.set).toHaveBeenCalledWith('icon:mdi:home', iconData.body);
      });
    });

    it('should use different cache keys for different icons', async () => {
      mockCache.get.mockResolvedValue(null);
      mockFetchIconData.mockResolvedValue({
        name: 'mdi:settings',
        body: 'M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5',
        width: 24,
        height: 24
      });

      const { rerender } = render(<IconifyIcon name="mdi:home" />);

      await waitFor(() => {
        expect(mockCache.get).toHaveBeenCalledWith('icon:mdi:home');
      });

      jest.clearAllMocks();

      rerender(<IconifyIcon name="mdi:settings" />);

      await waitFor(() => {
        expect(mockCache.get).toHaveBeenCalledWith('icon:mdi:settings');
      });
    });
  });

  describe('callbacks', () => {
    it('should call onLoad after successful load from API', async () => {
      const onLoad = jest.fn();
      const iconData = {
        name: 'mdi:home',
        body: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
        width: 24,
        height: 24
      };

      mockCache.get.mockResolvedValue(null);
      mockFetchIconData.mockResolvedValue(iconData);

      render(<IconifyIcon name="mdi:home" onLoad={onLoad} />);

      await waitFor(() => {
        expect(onLoad).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onLoad after successful load from cache', async () => {
      const onLoad = jest.fn();
      const cachedBody = 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z';

      mockCache.get.mockResolvedValue(cachedBody);

      render(<IconifyIcon name="mdi:home" onLoad={onLoad} />);

      await waitFor(() => {
        expect(onLoad).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onError on fetch failure', async () => {
      const onError = jest.fn();
      const error = new Error('Network error');

      mockCache.get.mockResolvedValue(null);
      mockFetchIconData.mockRejectedValue(error);

      render(<IconifyIcon name="mdi:home" onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('should not call onLoad if component unmounts before load', async () => {
      const onLoad = jest.fn();
      const iconData = {
        name: 'mdi:home',
        body: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
        width: 24,
        height: 24
      };

      mockCache.get.mockResolvedValue(null);
      mockFetchIconData.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(iconData), 100))
      );

      const { unmount } = render(<IconifyIcon name="mdi:home" onLoad={onLoad} />);

      unmount();

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(onLoad).not.toHaveBeenCalled();
    });
  });

  describe('props', () => {
    it('should apply size prop', async () => {
      const iconData = {
        name: 'mdi:home',
        body: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
        width: 24,
        height: 24
      };

      mockCache.get.mockResolvedValue(null);
      mockFetchIconData.mockResolvedValue(iconData);

      const { UNSAFE_getByType } = render(<IconifyIcon name="mdi:home" size={48} />);

      await waitFor(() => {
        const svg = UNSAFE_getByType('Svg' as any);
        expect(svg.props.width).toBe(48);
        expect(svg.props.height).toBe(48);
      });
    });

    it('should apply color prop', async () => {
      const iconData = {
        name: 'mdi:home',
        body: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
        width: 24,
        height: 24
      };

      mockCache.get.mockResolvedValue(null);
      mockFetchIconData.mockResolvedValue(iconData);

      const { UNSAFE_getByType } = render(<IconifyIcon name="mdi:home" color="red" />);

      await waitFor(() => {
        const svg = UNSAFE_getByType('Svg' as any);
        expect(svg.props.fill).toBe('red');
      });
    });

    it('should apply rotate prop', async () => {
      const iconData = {
        name: 'mdi:home',
        body: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
        width: 24,
        height: 24
      };

      mockCache.get.mockResolvedValue(null);
      mockFetchIconData.mockResolvedValue(iconData);

      const { UNSAFE_getByType } = render(<IconifyIcon name="mdi:home" rotate={90} />);

      await waitFor(() => {
        const g = UNSAFE_getByType('G' as any);
        expect(g.props.rotation).toBe(90);
      });
    });

    it('should apply horizontal flip', async () => {
      const iconData = {
        name: 'mdi:home',
        body: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
        width: 24,
        height: 24
      };

      mockCache.get.mockResolvedValue(null);
      mockFetchIconData.mockResolvedValue(iconData);

      const { UNSAFE_getByType } = render(<IconifyIcon name="mdi:home" flip="horizontal" />);

      await waitFor(() => {
        const g = UNSAFE_getByType('G' as any);
        expect(g.props.scaleX).toBe(-1);
        expect(g.props.scaleY).toBe(1);
      });
    });

    it('should apply vertical flip', async () => {
      const iconData = {
        name: 'mdi:home',
        body: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
        width: 24,
        height: 24
      };

      mockCache.get.mockResolvedValue(null);
      mockFetchIconData.mockResolvedValue(iconData);

      const { UNSAFE_getByType } = render(<IconifyIcon name="mdi:home" flip="vertical" />);

      await waitFor(() => {
        const g = UNSAFE_getByType('G' as any);
        expect(g.props.scaleX).toBe(1);
        expect(g.props.scaleY).toBe(-1);
      });
    });

    it('should apply both flip', async () => {
      const iconData = {
        name: 'mdi:home',
        body: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
        width: 24,
        height: 24
      };

      mockCache.get.mockResolvedValue(null);
      mockFetchIconData.mockResolvedValue(iconData);

      const { UNSAFE_getByType } = render(<IconifyIcon name="mdi:home" flip="both" />);

      await waitFor(() => {
        const g = UNSAFE_getByType('G' as any);
        expect(g.props.scaleX).toBe(-1);
        expect(g.props.scaleY).toBe(-1);
      });
    });
  });

  describe('icon switching', () => {
    it('should reload when icon name changes', async () => {
      const iconData1 = {
        name: 'mdi:home',
        body: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
        width: 24,
        height: 24
      };

      const iconData2 = {
        name: 'mdi:settings',
        body: 'M12 15.5A3.5 3.5 0 0 1 8.5 12',
        width: 24,
        height: 24
      };

      mockCache.get.mockResolvedValue(null);
      mockFetchIconData.mockResolvedValueOnce(iconData1).mockResolvedValueOnce(iconData2);

      const { rerender } = render(<IconifyIcon name="mdi:home" />);

      await waitFor(() => {
        expect(mockFetchIconData).toHaveBeenCalledWith('mdi:home');
      });

      jest.clearAllMocks();

      rerender(<IconifyIcon name="mdi:settings" />);

      await waitFor(() => {
        expect(mockFetchIconData).toHaveBeenCalledWith('mdi:settings');
      });
    });
  });
});
