/**
 * Test setup file
 */

// Setup global test utilities
global.console = {
  ...console,
  // Suppress console errors in tests unless explicitly needed
  error: jest.fn(),
  warn: jest.fn(),
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
  jest.restoreAllMocks();
});
