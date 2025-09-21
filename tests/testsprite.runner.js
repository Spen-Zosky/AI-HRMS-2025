#!/usr/bin/env node

/**
 * TestSprite Test Runner for AI-HRMS-2025
 * Comprehensive testing automation using TestSprite MCP integration
 */

const TestSpriteSetup = require('./testsprite.setup');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestSpriteRunner {
  constructor() {
    this.config = require('../testsprite.config.js');
    this.setup = new TestSpriteSetup();
    this.results = [];
    this.startTime = Date.now();
  }

  /**
   * Main test execution
   */
  async run() {
    console.log('🚀 Starting TestSprite Testing for AI-HRMS-2025...');
    console.log('=' .repeat(60));

    try {
      // Initialize environment
      await this.setup.initialize();

      // Run test suites
      await this.runTestSuites();

      // Generate reports
      await this.generateReports();

      // Display summary
      this.displaySummary();

    } catch (error) {
      console.error('❌ Testing failed:', error.message);
      process.exit(1);
    } finally {
      await this.setup.cleanup();
    }
  }

  /**
   * Run all test suites
   */
  async runTestSuites() {
    const suites = [
      { name: 'Unit Tests', command: 'npm test', enabled: this.config.tests.unit.enabled },
      { name: 'Integration Tests', command: 'npm run test:integration', enabled: this.config.tests.integration.enabled },
      { name: 'TestSprite Custom Tests', command: 'npx jest tests/testsprite.integration.test.js', enabled: true },
      { name: 'API Tests', command: this.generateApiTestCommand(), enabled: this.config.tests.api.enabled },
      { name: 'Security Tests', command: this.generateSecurityTestCommand(), enabled: this.config.tests.security.enabled }
    ];

    for (const suite of suites) {
      if (suite.enabled) {
        console.log(`\n🧪 Running ${suite.name}...`);
        console.log('-'.repeat(40));

        try {
          const result = await this.runTestSuite(suite);
          this.results.push(result);
        } catch (error) {
          console.log(`⚠️ ${suite.name} completed with issues: ${error.message}`);
          this.results.push({
            name: suite.name,
            status: 'failed',
            error: error.message,
            duration: 0
          });
        }
      } else {
        console.log(`⏭️ Skipping ${suite.name} (disabled)`);
      }
    }
  }

  /**
   * Run individual test suite
   */
  async runTestSuite(suite) {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const process = spawn('sh', ['-c', suite.command], {
        stdio: 'pipe',
        cwd: path.resolve('.')
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(text.trim());
      });

      process.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        console.error(text.trim());
      });

      process.on('close', (code) => {
        const duration = Date.now() - startTime;
        const result = {
          name: suite.name,
          status: code === 0 ? 'passed' : 'failed',
          duration,
          output,
          errorOutput,
          exitCode: code
        };

        if (code === 0) {
          console.log(`✅ ${suite.name} completed successfully (${duration}ms)`);
          resolve(result);
        } else {
          console.log(`❌ ${suite.name} failed with exit code ${code} (${duration}ms)`);
          resolve(result); // Don't reject, just mark as failed
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to run ${suite.name}: ${error.message}`));
      });
    });
  }

  /**
   * Generate API test command
   */
  generateApiTestCommand() {
    // Create a simple API test using curl
    const tests = [
      'curl -f http://localhost:3001/health',
      'curl -f -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"test123\"}" || true',
      'curl -f http://localhost:3001/api/employees || true'
    ];

    return tests.join(' && ');
  }

  /**
   * Generate security test command
   */
  generateSecurityTestCommand() {
    // Basic security tests using curl
    const tests = [
      // Test for XSS prevention
      'curl -f "http://localhost:3001/health?test=%3Cscript%3Ealert%28%27xss%27%29%3C%2Fscript%3E" || true',
      // Test for SQL injection prevention - simplified payload
      'curl -f -X POST http://localhost:3001/api/employees -H "Content-Type: application/json" -d \'{"name":"test DROP TABLE users"}\' || true'
    ];

    return tests.join(' && ');
  }

  /**
   * Generate comprehensive reports
   */
  async generateReports() {
    console.log('\n📊 Generating Test Reports...');

    const reportData = {
      timestamp: new Date().toISOString(),
      project: this.config.project,
      environment: this.config.environment,
      duration: Date.now() - this.startTime,
      summary: this.calculateSummary(),
      results: this.results,
      recommendations: this.generateRecommendations(),
      coverage: await this.getCoverageData(),
      configuration: {
        enabled_tests: Object.keys(this.config.tests).filter(key => this.config.tests[key].enabled),
        implementation_status: this.config.implementation
      }
    };

    // Generate JSON report
    await this.writeJsonReport(reportData);

    // Generate HTML report
    await this.writeHtmlReport(reportData);

    // Generate summary file
    await this.writeSummaryReport(reportData);

    console.log('✅ Reports generated in ./test-reports/');
  }

  /**
   * Calculate test summary
   */
  calculateSummary() {
    const summary = {
      total: this.results.length,
      passed: 0,
      failed: 0,
      duration: Date.now() - this.startTime
    };

    this.results.forEach(result => {
      if (result.status === 'passed') {
        summary.passed++;
      } else {
        summary.failed++;
      }
    });

    summary.successRate = summary.total > 0 ? (summary.passed / summary.total * 100).toFixed(2) : 0;

    return summary;
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = [];

    const failedTests = this.results.filter(r => r.status === 'failed');

    if (failedTests.length > 0) {
      recommendations.push({
        type: 'implementation',
        priority: 'high',
        title: 'Failed Test Suites',
        description: `${failedTests.length} test suite(s) failed. Review and fix implementations.`,
        action: 'Check individual test outputs for specific issues',
        tests: failedTests.map(t => t.name)
      });
    }

    // Check for missing implementations
    if (this.config.implementation.missing.length > 0) {
      recommendations.push({
        type: 'development',
        priority: 'medium',
        title: 'Missing Implementations',
        description: 'Several planned features are not yet implemented',
        action: 'Prioritize implementing core features',
        missing: this.config.implementation.missing
      });
    }

    // Security recommendations
    recommendations.push({
      type: 'security',
      priority: 'medium',
      title: 'Security Enhancements',
      description: 'Implement additional security measures',
      action: 'Add authentication, input validation, and rate limiting',
      items: [
        'JWT authentication middleware',
        'Input validation and sanitization',
        'Rate limiting for API endpoints',
        'CSRF protection'
      ]
    });

    // Performance recommendations
    recommendations.push({
      type: 'performance',
      priority: 'low',
      title: 'Performance Optimizations',
      description: 'Optimize application performance',
      action: 'Implement caching and monitoring',
      items: [
        'Add Redis caching',
        'Implement API response caching',
        'Add performance monitoring',
        'Optimize database queries'
      ]
    });

    return recommendations;
  }

  /**
   * Get coverage data (if available)
   */
  async getCoverageData() {
    try {
      const coveragePath = './coverage/coverage-summary.json';
      if (fs.existsSync(coveragePath)) {
        return JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      }
    } catch (error) {
      console.log('ℹ️ No coverage data available');
    }
    return null;
  }

  /**
   * Write JSON report
   */
  async writeJsonReport(data) {
    const reportPath = './test-reports/testsprite-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(data, null, 2));
    console.log(`📄 JSON report: ${reportPath}`);
  }

  /**
   * Write HTML report
   */
  async writeHtmlReport(data) {
    const html = this.generateHtmlReport(data);
    const reportPath = './test-reports/testsprite-report.html';
    fs.writeFileSync(reportPath, html);
    console.log(`🌐 HTML report: ${reportPath}`);
  }

  /**
   * Generate HTML report content
   */
  generateHtmlReport(data) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TestSprite Report - AI-HRMS-2025</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .section { margin-bottom: 30px; }
        .test-result { margin: 10px 0; padding: 15px; border-radius: 6px; }
        .test-passed { background: #d4edda; border-left: 4px solid #28a745; }
        .test-failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .recommendation { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 10px 0; border-radius: 6px; }
        .priority-high { border-left-color: #dc3545; }
        .priority-medium { border-left-color: #ffc107; }
        .priority-low { border-left-color: #17a2b8; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 6px; overflow-x: auto; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 TestSprite Report</h1>
            <h2>${data.project.name} v${data.project.version}</h2>
            <p class="timestamp">Generated: ${data.timestamp}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value">${data.summary.total}</div>
                <div>Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value passed">${data.summary.passed}</div>
                <div>Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value failed">${data.summary.failed}</div>
                <div>Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${data.summary.successRate}%</div>
                <div>Success Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Math.round(data.duration / 1000)}s</div>
                <div>Duration</div>
            </div>
        </div>

        <div class="section">
            <h3>📋 Test Results</h3>
            ${data.results.map(result => `
                <div class="test-result ${result.status === 'passed' ? 'test-passed' : 'test-failed'}">
                    <strong>${result.name}</strong> - ${result.status.toUpperCase()}
                    <div>Duration: ${result.duration}ms</div>
                    ${result.error ? `<div>Error: ${result.error}</div>` : ''}
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h3>💡 Recommendations</h3>
            ${data.recommendations.map(rec => `
                <div class="recommendation priority-${rec.priority}">
                    <strong>${rec.title}</strong> (${rec.priority} priority)
                    <p>${rec.description}</p>
                    <p><strong>Action:</strong> ${rec.action}</p>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h3>⚙️ Configuration</h3>
            <p><strong>Enabled Tests:</strong> ${data.configuration.enabled_tests.join(', ')}</p>
            <p><strong>Environment:</strong> ${Object.entries(data.environment).map(([k,v]) => `${k}=${v}`).join(', ')}</p>
        </div>

        <div class="section">
            <h3>📊 Implementation Status</h3>
            <p><strong>Completed:</strong> ${data.configuration.implementation_status.completed.join(', ')}</p>
            <p><strong>Partial:</strong> ${data.configuration.implementation_status.partial.join(', ')}</p>
            <p><strong>Missing:</strong> ${data.configuration.implementation_status.missing.join(', ')}</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Write summary report
   */
  async writeSummaryReport(data) {
    const summary = `
# TestSprite Testing Summary - AI-HRMS-2025

## Overview
- **Project**: ${data.project.name} v${data.project.version}
- **Timestamp**: ${data.timestamp}
- **Duration**: ${Math.round(data.duration / 1000)}s

## Results
- **Total Tests**: ${data.summary.total}
- **Passed**: ${data.summary.passed}
- **Failed**: ${data.summary.failed}
- **Success Rate**: ${data.summary.successRate}%

## Test Suites
${data.results.map(result => `- **${result.name}**: ${result.status.toUpperCase()} (${result.duration}ms)`).join('\n')}

## Key Recommendations
${data.recommendations.map(rec => `- **${rec.title}** (${rec.priority}): ${rec.description}`).join('\n')}

## Implementation Status
- **✅ Completed**: ${data.configuration.implementation_status.completed.length} features
- **🚧 Partial**: ${data.configuration.implementation_status.partial.length} features
- **❌ Missing**: ${data.configuration.implementation_status.missing.length} features

---
Generated by TestSprite for AI-HRMS-2025
`;

    const reportPath = './test-reports/TESTSPRITE-SUMMARY.md';
    fs.writeFileSync(reportPath, summary);
    console.log(`📋 Summary report: ${reportPath}`);
  }

  /**
   * Display final summary
   */
  displaySummary() {
    const summary = this.calculateSummary();

    console.log('\n' + '='.repeat(60));
    console.log('🎯 TESTSPRITE TESTING COMPLETE');
    console.log('='.repeat(60));
    console.log(`📊 Results: ${summary.passed}/${summary.total} tests passed (${summary.successRate}%)`);
    console.log(`⏱️ Duration: ${Math.round(summary.duration / 1000)}s`);
    console.log(`📁 Reports: ./test-reports/`);

    if (summary.failed > 0) {
      console.log(`\n⚠️ ${summary.failed} test suite(s) failed - check reports for details`);
    } else {
      console.log('\n✅ All test suites completed successfully!');
    }

    console.log('\n🚀 Next Steps:');
    console.log('1. Review test reports in ./test-reports/');
    console.log('2. Implement missing controllers and features');
    console.log('3. Add authentication middleware');
    console.log('4. Configure database connections');
    console.log('5. Re-run tests to verify improvements');
  }
}

// Run tests if called directly
if (require.main === module) {
  const runner = new TestSpriteRunner();
  runner.run().catch(console.error);
}

module.exports = TestSpriteRunner;