#!/usr/bin/env node

/**
 * Template Data Seeder Script
 * Comprehensive script to seed all template types with sample data
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class TemplateDataSeeder {
  constructor() {
    this.seeders = [
      {
        name: 'Leave Type Templates',
        file: '20250922200000-seed-leave-type-templates.js',
        description: 'Seed leave type templates with various leave categories'
      },
      {
        name: 'Performance Review Templates',
        file: '20250922200001-seed-performance-review-templates.js',
        description: 'Seed performance review templates for different review cycles'
      },
      {
        name: 'Benefit Package Templates',
        file: '20250922200002-seed-benefit-package-templates.js',
        description: 'Seed benefit package templates for different employee tiers'
      },
      {
        name: 'Training Program Templates',
        file: '20250922200003-seed-training-program-templates.js',
        description: 'Seed training program templates for various skill categories'
      },
      {
        name: 'Compliance Checklist Templates',
        file: '20250922200004-seed-compliance-checklist-templates.js',
        description: 'Seed compliance checklist templates for regulatory frameworks'
      }
    ];

    this.templateTypes = [
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

  async seedAllTemplates() {
    console.log('🌱 Starting Template Data Seeding');
    console.log('==================================\n');

    let totalSeeded = 0;
    let successfulSeeders = 0;
    let failedSeeders = 0;

    for (const seeder of this.seeders) {
      console.log(`📄 Seeding ${seeder.name}...`);
      console.log(`   💡 ${seeder.description}`);

      try {
        const result = await this.runSeeder(seeder);
        if (result.success) {
          console.log(`   ✅ Successfully seeded ${result.count || 'unknown'} records\n`);
          successfulSeeders++;
          totalSeeded += result.count || 0;
        } else {
          console.log(`   ❌ Failed to seed: ${result.error}\n`);
          failedSeeders++;
        }
      } catch (error) {
        console.log(`   💥 Seeder crashed: ${error.message}\n`);
        failedSeeders++;
      }
    }

    this.printSummary(totalSeeded, successfulSeeders, failedSeeders);
    return { totalSeeded, successfulSeeders, failedSeeders, success: failedSeeders === 0 };
  }

  async runSeeder(seeder) {
    const seederPath = path.join(__dirname, '..', 'seeders', seeder.file);

    if (!fs.existsSync(seederPath)) {
      throw new Error(`Seeder file not found: ${seeder.file}`);
    }

    try {
      const command = `npx sequelize-cli db:seed --seed ${seeder.file}`;
      const output = execSync(command, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.join(__dirname, '..')
      });

      // Extract count from output if available
      const countMatch = output.match(/Seeded (\d+)/);
      const count = countMatch ? parseInt(countMatch[1]) : null;

      return {
        success: true,
        count,
        output
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        output: error.output ? error.output.toString() : null
      };
    }
  }

  async undoAllSeeders() {
    console.log('🗑️  Undoing Template Data Seeders');
    console.log('=================================\n');

    let successfulUndos = 0;
    let failedUndos = 0;

    // Reverse order for proper cleanup
    const reversedSeeders = [...this.seeders].reverse();

    for (const seeder of reversedSeeders) {
      console.log(`🔄 Undoing ${seeder.name}...`);

      try {
        const command = `npx sequelize-cli db:seed:undo --seed ${seeder.file}`;
        execSync(command, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: path.join(__dirname, '..')
        });

        console.log(`   ✅ Successfully undone\n`);
        successfulUndos++;
      } catch (error) {
        console.log(`   ❌ Failed to undo: ${error.message}\n`);
        failedUndos++;
      }
    }

    console.log(`📊 Undo Summary: ${successfulUndos} successful, ${failedUndos} failed`);
    return { successfulUndos, failedUndos, success: failedUndos === 0 };
  }

  async checkSeederStatus() {
    console.log('📋 Template Seeder Status Check');
    console.log('===============================\n');

    for (const seeder of this.seeders) {
      const seederPath = path.join(__dirname, '..', 'seeders', seeder.file);
      const exists = fs.existsSync(seederPath);

      console.log(`${exists ? '✅' : '❌'} ${seeder.name}`);
      console.log(`   📁 File: ${seeder.file}`);
      console.log(`   📍 Path: ${exists ? 'Found' : 'Missing'}`);

      if (exists) {
        const stats = fs.statSync(seederPath);
        console.log(`   📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`   📅 Modified: ${stats.mtime.toISOString()}`);
      }
      console.log();
    }

    console.log('🎯 Template Type Coverage:');
    this.templateTypes.forEach(type => {
      const hasSeeder = this.seeders.some(s => s.file.includes(type.replace('_', '-')));
      console.log(`  ${hasSeeder ? '✅' : '⚠️ '} ${type}`);
    });
  }

  printSummary(totalSeeded, successfulSeeders, failedSeeders) {
    console.log('\n📊 Seeding Summary');
    console.log('==================');
    console.log(`Total Records Seeded: ${totalSeeded}`);
    console.log(`Successful Seeders: ${successfulSeeders}/${this.seeders.length}`);
    console.log(`Failed Seeders: ${failedSeeders}/${this.seeders.length}`);
    console.log(`Success Rate: ${this.seeders.length > 0 ? Math.round((successfulSeeders / this.seeders.length) * 100) : 0}%\n`);

    if (failedSeeders === 0) {
      console.log('🎉 All template data seeded successfully!');
      console.log('Template inheritance system is ready with sample data.');
    } else {
      console.log('⚠️  Some seeders failed. Check the errors above.');
      console.log('You may need to resolve database connection or permission issues.');
    }

    console.log('\n📚 Available Template Types:');
    this.templateTypes.forEach(type => {
      console.log(`  • ${type}`);
    });

    console.log('\n💡 Next Steps:');
    console.log('  1. Test template import API endpoints');
    console.log('  2. Run template test suite: npm run test:templates');
    console.log('  3. Verify data in database tables');
    console.log('  4. Create organization-specific instances');
  }

  printUsage() {
    console.log('Template Data Seeder');
    console.log('Usage: node seed-template-data.js [command]');
    console.log('\nCommands:');
    console.log('  seed       Seed all template data (default)');
    console.log('  undo       Undo all template seeders');
    console.log('  status     Check seeder file status');
    console.log('  help       Show this help message');
    console.log('\nExamples:');
    console.log('  node seed-template-data.js');
    console.log('  node seed-template-data.js seed');
    console.log('  node seed-template-data.js undo');
    console.log('  node seed-template-data.js status');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'seed';

  const seeder = new TemplateDataSeeder();

  switch (command.toLowerCase()) {
    case 'seed':
      const result = await seeder.seedAllTemplates();
      process.exit(result.success ? 0 : 1);
      break;

    case 'undo':
      const undoResult = await seeder.undoAllSeeders();
      process.exit(undoResult.success ? 0 : 1);
      break;

    case 'status':
      await seeder.checkSeederStatus();
      break;

    case 'help':
    case '--help':
    case '-h':
      seeder.printUsage();
      break;

    default:
      console.log(`❌ Unknown command: ${command}`);
      seeder.printUsage();
      process.exit(1);
      break;
  }
}

// Export for programmatic use
module.exports = TemplateDataSeeder;

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Template seeder crashed:', error.message);
    process.exit(1);
  });
}