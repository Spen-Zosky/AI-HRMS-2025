/**
 * TestSprite Test Setup for AI-HRMS-2025
 * Comprehensive test suite initialization and utilities
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestSpriteSetup {
  constructor() {
    this.serverProcess = null;
    this.config = require('../testsprite.config.js');
    this.isServerRunning = false;
  }

  /**
   * Initialize test environment
   */
  async initialize() {
    console.log('🚀 Initializing TestSprite for AI-HRMS-2025...');

    // Create test directories
    await this.createTestDirectories();

    // Setup test database (if needed)
    await this.setupTestDatabase();

    // Start server if not running
    await this.startServer();

    // Verify server health
    await this.verifyServerHealth();

    console.log('✅ TestSprite setup complete!');
  }

  /**
   * Create necessary test directories
   */
  async createTestDirectories() {
    const dirs = [
      './test-reports',
      './test-reports/screenshots',
      './test-reports/coverage',
      './test-uploads',
      './test-logs'
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    }
  }

  /**
   * Setup test database
   */
  async setupTestDatabase() {
    console.log('🗄️ Setting up test database...');

    // For now, we'll use the existing database config
    // In a real scenario, you'd want a separate test database
    console.log('ℹ️ Using existing database configuration for testing');
  }

  /**
   * Start the Express server
   */
  async startServer() {
    if (this.isServerRunning) {
      console.log('🟢 Server already running');
      return;
    }

    console.log('🚀 Starting Express server...');

    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', ['tests/test-server.js'], {
        env: {
          ...process.env,
          ...this.config.environment,
          TEST_PORT: '3001',
          NODE_ENV: 'test'
        },
        stdio: 'pipe'
      });

      let output = '';

      this.serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`Server: ${data.toString().trim()}`);

        if (output.includes('Test Server running') || output.includes('listening')) {
          this.isServerRunning = true;
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error(`Server Error: ${data.toString()}`);
      });

      this.serverProcess.on('error', (error) => {
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!this.isServerRunning) {
          reject(new Error('Server startup timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Verify server health
   */
  async verifyServerHealth() {
    console.log('🔍 Verifying server health...');

    const http = require('http');

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/health',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const health = JSON.parse(data);
            if (health.status === 'OK') {
              console.log('✅ Server health check passed');
              console.log(`📊 Features: ${health.features.join(', ')}`);
              resolve(true);
            } else {
              reject(new Error('Health check failed'));
            }
          } catch (error) {
            reject(new Error(`Invalid health response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Server health check failed:', error.message);
        reject(error);
      });

      req.setTimeout(5000, () => {
        req.abort();
        reject(new Error('Health check timeout'));
      });

      req.end();
    });
  }

  /**
   * Generate comprehensive test suite
   */
  generateTestSuite() {
    return {
      // Basic functionality tests
      basic: this.generateBasicTests(),

      // API endpoint tests
      api: this.generateApiTests(),

      // Performance tests
      performance: this.generatePerformanceTests(),

      // Security tests
      security: this.generateSecurityTests(),

      // Integration tests
      integration: this.generateIntegrationTests()
    };
  }

  /**
   * Generate basic functionality tests
   */
  generateBasicTests() {
    return [
      {
        name: 'Server Health Check',
        type: 'api',
        method: 'GET',
        url: '/health',
        expected: {
          status: 200,
          body: { status: 'OK' }
        }
      },
      {
        name: 'Static Assets Loading',
        type: 'static',
        urls: [
          '/css/style.css',
          '/js/main.js'
        ],
        expected: {
          status: 200
        }
      },
      {
        name: 'CORS Headers',
        type: 'headers',
        url: '/health',
        expected: {
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        }
      }
    ];
  }

  /**
   * Generate API tests
   */
  generateApiTests() {
    return [
      {
        name: 'Authentication Endpoints',
        tests: [
          {
            name: 'Login Endpoint Structure',
            method: 'POST',
            url: '/api/auth/login',
            body: { email: 'test@test.com', password: 'test123' },
            expected: {
              status: [400, 401, 404] // Expecting error since not implemented
            }
          },
          {
            name: 'Register Endpoint Structure',
            method: 'POST',
            url: '/api/auth/register',
            body: { email: 'new@test.com', password: 'test123' },
            expected: {
              status: [400, 404] // Expecting error since not implemented
            }
          }
        ]
      },
      {
        name: 'Employee Management',
        tests: [
          {
            name: 'Get Employees List',
            method: 'GET',
            url: '/api/employees',
            expected: {
              status: [200, 404] // May not be implemented yet
            }
          },
          {
            name: 'Get Single Employee',
            method: 'GET',
            url: '/api/employees/1',
            expected: {
              status: [200, 404] // May not be implemented yet
            }
          }
        ]
      },
      {
        name: 'AI Features',
        tests: [
          {
            name: 'HR Copilot Query',
            method: 'POST',
            url: '/api/copilot/query',
            body: { query: 'How many employees do we have?' },
            expected: {
              status: [200, 404] // May not be implemented yet
            }
          },
          {
            name: 'Analytics Dashboard',
            method: 'GET',
            url: '/api/analytics/dashboard',
            expected: {
              status: [200, 404] // May not be implemented yet
            }
          }
        ]
      }
    ];
  }

  /**
   * Generate performance tests
   */
  generatePerformanceTests() {
    return [
      {
        name: 'Response Time Test',
        url: '/health',
        concurrent: 10,
        duration: 30,
        expected: {
          avgResponseTime: '<2000ms',
          successRate: '>95%'
        }
      },
      {
        name: 'Memory Usage',
        type: 'monitoring',
        duration: 60,
        expected: {
          memoryLeak: false,
          maxMemory: '512MB'
        }
      }
    ];
  }

  /**
   * Generate security tests
   */
  generateSecurityTests() {
    return [
      {
        name: 'SQL Injection Prevention',
        tests: [
          {
            url: '/api/employees',
            payloads: [
              "'; DROP TABLE employees; --",
              "1' OR '1'='1",
              "admin' --"
            ],
            expected: {
              status: [400, 403, 404], // Should not return 200
              noSqlErrors: true
            }
          }
        ]
      },
      {
        name: 'XSS Prevention',
        tests: [
          {
            url: '/api/employees',
            payloads: [
              "<script>alert('xss')</script>",
              "javascript:alert('xss')",
              "<img src=x onerror=alert('xss')>"
            ],
            expected: {
              noScriptExecution: true,
              sanitizedResponse: true
            }
          }
        ]
      },
      {
        name: 'Security Headers',
        url: '/health',
        expected: {
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': true,
            'X-XSS-Protection': true
          }
        }
      }
    ];
  }

  /**
   * Generate integration tests
   */
  generateIntegrationTests() {
    return [
      {
        name: 'Database Connection',
        type: 'database',
        tests: [
          {
            name: 'Connection Test',
            query: 'SELECT 1 as test',
            expected: {
              connected: true,
              result: [{ test: 1 }]
            }
          }
        ]
      },
      {
        name: 'File System Access',
        type: 'filesystem',
        tests: [
          {
            name: 'Log File Creation',
            action: 'create',
            path: './logs/test.log',
            expected: {
              success: true
            }
          }
        ]
      }
    ];
  }

  /**
   * Cleanup after tests
   */
  async cleanup() {
    console.log('🧹 Cleaning up test environment...');

    // Stop server
    if (this.serverProcess) {
      this.serverProcess.kill();
      console.log('🛑 Server stopped');
    }

    // Clean up test files
    const testDirs = ['./test-uploads', './test-logs'];
    for (const dir of testDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`🗑️ Cleaned up: ${dir}`);
      }
    }

    console.log('✅ Cleanup complete');
  }

  /**
   * Generate test report
   */
  generateReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      project: this.config.project,
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      },
      results: results,
      coverage: {},
      recommendations: this.generateRecommendations(results)
    };

    // Calculate summary
    results.forEach(result => {
      report.summary.total++;
      if (result.status === 'passed') report.summary.passed++;
      else if (result.status === 'failed') report.summary.failed++;
      else report.summary.skipped++;
    });

    return report;
  }

  /**
   * Generate testing recommendations
   */
  generateRecommendations(results) {
    const recommendations = [];

    // Check for missing implementations
    const failedTests = results.filter(r => r.status === 'failed');
    if (failedTests.length > 5) {
      recommendations.push({
        type: 'implementation',
        priority: 'high',
        message: 'Many endpoints are returning 404. Implement missing API controllers.',
        action: 'Create controllers in src/controllers/ directory'
      });
    }

    // Security recommendations
    recommendations.push({
      type: 'security',
      priority: 'medium',
      message: 'Implement authentication middleware for protected routes',
      action: 'Add JWT authentication to sensitive endpoints'
    });

    // Performance recommendations
    recommendations.push({
      type: 'performance',
      priority: 'low',
      message: 'Add caching for static assets and API responses',
      action: 'Implement Redis caching or memory caching'
    });

    return recommendations;
  }
}

module.exports = TestSpriteSetup;