// Jest setup for E2E tests
// This file is run after the test framework has been installed in the test environment

// Global test configuration
jest.setTimeout(30000); // 30 seconds timeout for each test

// Add custom matchers or global test utilities here if needed

// Global error handling for unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Global setup for selenium tests
global.testConfig = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:3002',
  timeout: 30000,
  // Add more configuration as needed
};
