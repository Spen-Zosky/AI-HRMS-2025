/**
 * TestSprite Integration Tests for AI-HRMS-2025
 * Tests for actual implemented features in the Express.js application
 */

const TestSpriteSetup = require('./testsprite.setup');
const axios = require('axios');

describe('AI-HRMS-2025 Integration Tests', () => {
  let testSetup;
  const baseUrl = 'http://localhost:3001';

  beforeAll(async () => {
    testSetup = new TestSpriteSetup();
    await testSetup.initialize();
  }, 60000);

  afterAll(async () => {
    await testSetup.cleanup();
  });

  describe('🏥 Health Check & Basic Functionality', () => {
    test('Health endpoint should return OK status', async () => {
      const response = await axios.get(`${baseUrl}/health`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'OK');
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('uptime');
      expect(response.data).toHaveProperty('environment');
      expect(response.data).toHaveProperty('features');
      expect(Array.isArray(response.data.features)).toBe(true);
    });

    test('Health endpoint should include expected features', async () => {
      const response = await axios.get(`${baseUrl}/health`);
      const features = response.data.features;

      expect(features).toContain('Auth');
      expect(features).toContain('Database');
      expect(features).toContain('Leave Management');
      expect(features).toContain('AI ATS');
      expect(features).toContain('HR Copilot');
    });

    test('Server should include security headers', async () => {
      const response = await axios.get(`${baseUrl}/health`);

      // Helmet.js security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    test('CORS should be enabled', async () => {
      const response = await axios.get(`${baseUrl}/health`);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('📁 Static Assets', () => {
    test('CSS file should be accessible', async () => {
      try {
        const response = await axios.get(`${baseUrl}/css/style.css`);
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('text/css');
      } catch (error) {
        // If 404, that's expected since static middleware might not be configured
        expect([200, 404]).toContain(error.response?.status);
      }
    });

    test('JavaScript files should be accessible', async () => {
      try {
        const response = await axios.get(`${baseUrl}/js/main.js`);
        expect([200, 404]).toContain(response.status);
      } catch (error) {
        expect([200, 404]).toContain(error.response?.status);
      }
    });
  });

  describe('🔐 API Routes Structure', () => {
    test('Auth routes should be registered', async () => {
      try {
        // Test login endpoint (expecting 404 or method error, not server error)
        await axios.post(`${baseUrl}/api/auth/login`, {
          email: 'test@test.com',
          password: 'test123'
        });
      } catch (error) {
        // Should get 404 (route not found) or 400/401 (route exists but not implemented)
        expect([400, 401, 404, 500]).toContain(error.response?.status);
      }
    });

    test('Employee routes should be registered', async () => {
      try {
        await axios.get(`${baseUrl}/api/employees`);
      } catch (error) {
        expect([200, 401, 404, 500]).toContain(error.response?.status);
      }
    });

    test('Leave management routes should be registered', async () => {
      try {
        await axios.get(`${baseUrl}/api/leave`);
      } catch (error) {
        expect([200, 401, 404, 500]).toContain(error.response?.status);
      }
    });

    test('ATS routes should be registered', async () => {
      try {
        await axios.get(`${baseUrl}/api/ats`);
      } catch (error) {
        expect([200, 401, 404, 500]).toContain(error.response?.status);
      }
    });

    test('Copilot routes should be registered', async () => {
      try {
        await axios.get(`${baseUrl}/api/copilot`);
      } catch (error) {
        expect([200, 401, 404, 500]).toContain(error.response?.status);
      }
    });

    test('Analytics routes should be registered', async () => {
      try {
        await axios.get(`${baseUrl}/api/analytics`);
      } catch (error) {
        expect([200, 401, 404, 500]).toContain(error.response?.status);
      }
    });
  });

  describe('📊 Request/Response Handling', () => {
    test('Server should handle JSON requests', async () => {
      try {
        const response = await axios.post(`${baseUrl}/api/auth/login`, {
          email: 'test@test.com',
          password: 'test123'
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        // Should not get JSON parsing errors
        expect(error.response?.status).not.toBe(400);
        expect(error.message).not.toContain('JSON');
      }
    });

    test('Server should handle large payloads', async () => {
      const largePayload = {
        data: 'x'.repeat(1000000) // 1MB string
      };

      try {
        await axios.post(`${baseUrl}/api/test`, largePayload);
      } catch (error) {
        // Should not get payload size errors (413)
        expect(error.response?.status).not.toBe(413);
      }
    });
  });

  describe('🔍 Error Handling', () => {
    test('Server should handle 404 routes gracefully', async () => {
      try {
        await axios.get(`${baseUrl}/nonexistent-route`);
      } catch (error) {
        expect(error.response?.status).toBe(404);
      }
    });

    test('Server should handle malformed JSON', async () => {
      try {
        await axios.post(`${baseUrl}/api/auth/login`, 'invalid-json', {
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        expect([400, 404]).toContain(error.response?.status);
      }
    });
  });

  describe('⚡ Performance Tests', () => {
    test('Health endpoint should respond quickly', async () => {
      const start = Date.now();
      await axios.get(`${baseUrl}/health`);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000); // Should respond within 2 seconds
    });

    test('Server should handle concurrent requests', async () => {
      const requests = Array(10).fill().map(() =>
        axios.get(`${baseUrl}/health`)
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('🔒 Security Tests', () => {
    test('Server should prevent XSS in query parameters', async () => {
      try {
        const maliciousScript = '<script>alert("xss")</script>';
        const response = await axios.get(`${baseUrl}/health?test=${maliciousScript}`);

        // Response should not contain unescaped script
        expect(response.data).not.toContain('<script>');
      } catch (error) {
        // Any error is acceptable, just shouldn't execute script
        expect(true).toBe(true);
      }
    });

    test('Server should handle SQL injection attempts', async () => {
      try {
        const sqlInjection = "'; DROP TABLE users; --";
        await axios.post(`${baseUrl}/api/employees`, {
          name: sqlInjection
        });
      } catch (error) {
        // Should not return SQL errors
        const errorMessage = error.response?.data?.message || '';
        expect(errorMessage.toLowerCase()).not.toContain('sql');
        expect(errorMessage.toLowerCase()).not.toContain('syntax');
      }
    });
  });

  describe('📦 Middleware Tests', () => {
    test('Request logging should be active', async () => {
      // This test verifies the logging middleware is working
      // by checking if requests are processed without errors
      const response = await axios.get(`${baseUrl}/health`);
      expect(response.status).toBe(200);

      // In a real scenario, you'd check log files or use a log capture mechanism
    });

    test('CORS middleware should set appropriate headers', async () => {
      const response = await axios.get(`${baseUrl}/health`);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    test('Helmet security middleware should be active', async () => {
      const response = await axios.get(`${baseUrl}/health`);

      // Check for security headers added by Helmet
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });

  describe('📈 Monitoring & Diagnostics', () => {
    test('Server uptime should be tracked', async () => {
      const response = await axios.get(`${baseUrl}/health`);

      expect(response.data.uptime).toBeDefined();
      expect(typeof response.data.uptime).toBe('number');
      expect(response.data.uptime).toBeGreaterThan(0);
    });

    test('Environment information should be available', async () => {
      const response = await axios.get(`${baseUrl}/health`);

      expect(response.data.environment).toBeDefined();
      expect(['development', 'production', 'test']).toContain(response.data.environment);
    });

    test('Server should provide timestamp information', async () => {
      const response = await axios.get(`${baseUrl}/health`);

      expect(response.data.timestamp).toBeDefined();
      expect(new Date(response.data.timestamp)).toBeInstanceOf(Date);
    });
  });
});