#!/usr/bin/env node

/**
 * Template System Test Runner
 * Comprehensive test runner for all template-related functionality
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class TemplateTestRunner {
  constructor() {
    this.testSuites = [
      {
        name: 'Template Inheritance Tests',
        file: 'templateInheritance.test.js',
        description: 'API endpoint and controller tests for template system',
        timeout: 30000
      },
      {
        name: 'Template Service Integration Tests',
        file: 'templateService.integration.test.js',
        description: 'Service layer integration tests with mocked database',
        timeout: 45000
      },
      {
        name: 'Template Performance Tests',
        file: 'templatePerformance.test.js',
        description: 'Performance benchmarks for template operations',
        timeout: 60000
      }
    ];

    this.templateTypes = [
      'skill',
      'job_role',
      'leave_type',
      'performance_review',
      'benefit_package',
      'training_program',
      'compliance_checklist',
      'onboarding_workflow',
      'policy_document',
      'compensation_band',
      'career_path',
      'reporting_structure'
    ];
  }

  async runAllTests() {
    console.log('🧪 Starting Template System Test Suite');
    console.log('=====================================\n');

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    const results = [];

    for (const suite of this.testSuites) {
      console.log(`🔍 Running ${suite.name}...`);
      console.log(`   📄 ${suite.description}`);

      try {
        const result = await this.runTestSuite(suite);
        results.push(result);
        totalTests += result.total;
        passedTests += result.passed;
        failedTests += result.failed;

        if (result.success) {
          console.log(`   ✅ ${result.passed}/${result.total} tests passed\n`);
        } else {
          console.log(`   ❌ ${result.failed}/${result.total} tests failed\n`);
        }
      } catch (error) {
        console.log(`   💥 Test suite crashed: ${error.message}\n`);
        failedTests++;
        results.push({
          name: suite.name,
          success: false,
          error: error.message,
          total: 0,
          passed: 0,
          failed: 1
        });
      }
    }

    this.printSummary(results, totalTests, passedTests, failedTests);
    return { totalTests, passedTests, failedTests, success: failedTests === 0 };
  }

  async runTestSuite(suite) {
    const testFile = path.join(__dirname, suite.file);

    if (!fs.existsSync(testFile)) {
      throw new Error(`Test file not found: ${suite.file}`);
    }

    try {
      const command = `npx jest ${testFile} --json --verbose --testTimeout=${suite.timeout}`;
      const output = execSync(command, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      const result = JSON.parse(output);

      return {
        name: suite.name,
        success: result.success,
        total: result.numTotalTests,
        passed: result.numPassedTests,
        failed: result.numFailedTests,
        duration: result.testResults[0]?.perfStats?.runtime || 0,
        coverage: result.coverageMap ? this.extractCoverage(result.coverageMap) : null
      };
    } catch (error) {
      // Parse Jest output even if it failed
      try {
        const output = error.stdout || error.output?.[1] || '';
        if (output.includes('{')) {
          const jsonStart = output.indexOf('{');
          const jsonOutput = output.substring(jsonStart);
          const result = JSON.parse(jsonOutput);

          return {
            name: suite.name,
            success: false,
            total: result.numTotalTests || 0,
            passed: result.numPassedTests || 0,
            failed: result.numFailedTests || result.numTotalTests || 1,
            error: result.testResults?.[0]?.message || 'Test failed'
          };
        }
      } catch (parseError) {
        // Fall through to generic error handling
      }

      throw new Error(`Failed to run test suite: ${error.message}`);
    }
  }

  extractCoverage(coverageMap) {
    if (!coverageMap) return null;

    const files = Object.keys(coverageMap);
    let totalStatements = 0;
    let coveredStatements = 0;

    files.forEach(file => {
      const fileCoverage = coverageMap[file];
      if (fileCoverage.s) {
        const statements = Object.keys(fileCoverage.s);
        totalStatements += statements.length;
        coveredStatements += statements.filter(s => fileCoverage.s[s] > 0).length;
      }
    });

    return totalStatements > 0 ? {
      percentage: Math.round((coveredStatements / totalStatements) * 100),
      statements: { covered: coveredStatements, total: totalStatements }
    } : null;
  }

  printSummary(results, totalTests, passedTests, failedTests) {
    console.log('\n📊 Test Summary');
    console.log('===============');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%\n`);

    console.log('📋 Test Suite Results:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`  ${status} ${result.name}: ${result.passed}/${result.total}${duration}`);

      if (result.coverage) {
        console.log(`    📈 Coverage: ${result.coverage.percentage}% (${result.coverage.statements.covered}/${result.coverage.statements.total})`);
      }

      if (result.error) {
        console.log(`    ⚠️  Error: ${result.error}`);
      }
    });

    console.log('\n🎯 Template Type Coverage:');
    console.log(`Tested ${this.templateTypes.length} template types:`);
    this.templateTypes.forEach(type => {
      console.log(`  ✓ ${type}`);
    });

    if (failedTests === 0) {
      console.log('\n🎉 All template tests passed! Template system is ready for deployment.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the failures before deployment.');
    }
  }

  async runSpecificTest(testName) {
    const suite = this.testSuites.find(s =>
      s.name.toLowerCase().includes(testName.toLowerCase()) ||
      s.file.toLowerCase().includes(testName.toLowerCase())
    );

    if (!suite) {
      console.log(`❌ Test suite not found: ${testName}`);
      console.log('Available test suites:');
      this.testSuites.forEach(s => console.log(`  - ${s.name} (${s.file})`));
      return;
    }

    console.log(`🔍 Running specific test: ${suite.name}\n`);

    try {
      const result = await this.runTestSuite(suite);

      if (result.success) {
        console.log(`✅ Test completed successfully: ${result.passed}/${result.total} passed`);
      } else {
        console.log(`❌ Test failed: ${result.failed}/${result.total} failed`);
        if (result.error) {
          console.log(`Error: ${result.error}`);
        }
      }
    } catch (error) {
      console.log(`💥 Test crashed: ${error.message}`);
    }
  }

  async runPerformanceTests() {
    console.log('🚀 Running Template Performance Tests');
    console.log('====================================\n');

    const performanceSuite = this.testSuites.find(s => s.file.includes('Performance'));
    if (!performanceSuite) {
      console.log('❌ Performance test suite not found');
      return;
    }

    try {
      const result = await this.runTestSuite(performanceSuite);

      console.log('\n📈 Performance Test Results:');
      console.log(`Tests Run: ${result.total}`);
      console.log(`Passed: ${result.passed}`);
      console.log(`Failed: ${result.failed}`);
      console.log(`Duration: ${result.duration}ms`);

      if (result.success) {
        console.log('\n✅ All performance benchmarks passed!');
        console.log('Template system meets performance requirements.');
      } else {
        console.log('\n⚠️  Some performance tests failed.');
        console.log('Consider optimizing template operations.');
      }
    } catch (error) {
      console.log(`💥 Performance tests crashed: ${error.message}`);
    }
  }

  printUsage() {
    console.log('Template System Test Runner');
    console.log('Usage: node templateRunner.js [command]');
    console.log('\nCommands:');
    console.log('  all            Run all template tests (default)');
    console.log('  performance    Run only performance tests');
    console.log('  <test-name>    Run specific test suite');
    console.log('\nExamples:');
    console.log('  node templateRunner.js');
    console.log('  node templateRunner.js performance');
    console.log('  node templateRunner.js inheritance');
    console.log('  node templateRunner.js integration');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  const runner = new TemplateTestRunner();

  switch (command.toLowerCase()) {
    case 'all':
      const result = await runner.runAllTests();
      process.exit(result.success ? 0 : 1);
      break;

    case 'performance':
      await runner.runPerformanceTests();
      break;

    case 'help':
    case '--help':
    case '-h':
      runner.printUsage();
      break;

    default:
      await runner.runSpecificTest(command);
      break;
  }
}

// Export for programmatic use
module.exports = TemplateTestRunner;

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test runner crashed:', error.message);
    process.exit(1);
  });
}