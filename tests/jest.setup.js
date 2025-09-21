/**
 * Jest Test Setup for AI-HRMS-2025
 * Global test configuration and utilities
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://hrms_user:hrms_password@localhost:5432/ai_hrms_2025';

// Extend Jest with custom matchers
expect.extend({
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },

  toBeValidJWT(received) {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    const pass = jwtRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid JWT`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid JWT`,
        pass: false,
      };
    }
  },

  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  }
});

// Global test helpers
global.testHelpers = {
  // Create a test user object
  createTestUser: (overrides = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@test.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'employee',
    is_active: true,
    is_sysadmin: false,
    tenant_id: '123e4567-e89b-12d3-a456-426614174001',
    ...overrides
  }),

  // Create a test organization object
  createTestOrganization: (overrides = {}) => ({
    organization_id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Test Organization',
    slug: 'test-org',
    industry: 'Technology',
    size: 'small',
    subscription_plan: 'trial',
    subscription_status: 'trial',
    is_active: true,
    ...overrides
  }),

  // Create a test employee object
  createTestEmployee: (overrides = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174002',
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    position: 'Software Developer',
    start_date: '2024-01-01',
    status: 'active',
    vacation_balance: 25.00,
    sick_balance: 10.00,
    tenant_id: '123e4567-e89b-12d3-a456-426614174001',
    ...overrides
  }),

  // Create a mock JWT token
  createMockJWT: () => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE2MjMyNzk0NjAsImV4cCI6MTYyMzM2NTg2MH0.test'
};

// Suppress console logs during tests (except for errors)
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;

if (!process.env.JEST_VERBOSE) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
}

// Clean up after all tests
afterAll(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.info = originalConsoleInfo;
  console.warn = originalConsoleWarn;
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Increase timeout for database operations
jest.setTimeout(30000);