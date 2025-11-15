/**
 * Jest setup for @react-native-iconify/api-integration tests
 */

// Mock react-native modules
jest.mock('react-native', () => ({
  View: 'View',
  ActivityIndicator: 'ActivityIndicator',
  StyleSheet: {
    create: (styles: any) => styles
  }
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Path: 'Path',
  G: 'G'
}));

// Mock @react-native-iconify/api
jest.mock('@react-native-iconify/api', () => ({
  fetchIconData: jest.fn()
}));

// Mock @react-native-iconify/turbo-cache
jest.mock('@react-native-iconify/turbo-cache', () => ({
  createCache: jest.fn(() => ({
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
  }))
}));
