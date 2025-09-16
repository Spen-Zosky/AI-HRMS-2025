// Jest setup file for AI-HRMS-2025 tests

// Load environment variables
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods in tests (can be overridden per test)
global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: process.env.DEBUG_TESTS ? console.log : jest.fn(),
  debug: process.env.DEBUG_TESTS ? console.debug : jest.fn(),
  info: process.env.DEBUG_TESTS ? console.info : jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Global test setup
beforeAll(async () => {
  // Global setup can go here
  console.info('Starting test suite...');
});

afterAll(async () => {
  // Global cleanup can go here
  console.info('Test suite completed.');
});

// Default timeout for tests
jest.setTimeout(30000);