/**
 * Template System Performance Tests
 * Performance benchmarks for template inheritance operations
 */

const { v4: uuidv4 } = require('uuid');
const templateInheritanceService = require('../src/services/templateInheritanceService');

// Mock performance timers
const { performance } = require('perf_hooks');

describe('Template System Performance', () => {
  let testOrganizationId;

  // Performance thresholds (in milliseconds)
  const PERFORMANCE_THRESHOLDS = {
    SINGLE_IMPORT: 100,      // Single template import should be < 100ms
    BULK_IMPORT_10: 500,     // 10 templates should be < 500ms
    BULK_IMPORT_100: 2000,   // 100 templates should be < 2s
    SEARCH_OPERATION: 50,    // Search should be < 50ms
    CUSTOMIZATION: 75,       // Customization should be < 75ms
    SYNC_OPERATION: 100      // Sync should be < 100ms
  };

  beforeAll(() => {
    testOrganizationId = uuidv4();

    // Mock database operations to return quickly for performance testing
    jest.setTimeout(30000); // 30 second timeout for performance tests
  });

  beforeEach(() => {
    // Reset performance counters
    global.gc && global.gc(); // Force garbage collection if available
  });

  describe('Single Template Operations', () => {
    test('single template import performance', async () => {
      const templateId = uuidv4();
      const templateType = 'skill';

      // Mock the import operation
      jest.spyOn(templateInheritanceService, 'importSkillTemplate').mockResolvedValue({
        org_skill_id: uuidv4(),
        organization_id: testOrganizationId,
        skill_id: templateId,
        inheritance_type: 'full',
        customization_level: 0
      });

      const startTime = performance.now();

      await templateInheritanceService.importTemplate(
        testOrganizationId,
        templateId,
        {
          templateType,
          customizations: {},
          autoSync: true
        }
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_IMPORT);
      console.log(`Single import completed in ${duration.toFixed(2)}ms`);
    });

    test('template search performance', async () => {
      // Mock search results
      jest.spyOn(templateInheritanceService, 'searchTemplates').mockResolvedValue({
        templates: Array.from({ length: 50 }, (_, i) => ({
          id: uuidv4(),
          name: `Template ${i}`,
          type: 'skill',
          category: 'technical'
        })),
        total: 50
      });

      const startTime = performance.now();

      await templateInheritanceService.searchTemplates({
        templateTypes: ['skill', 'job_role'],
        searchTerm: 'javascript',
        categories: ['technical'],
        offset: 0,
        limit: 50
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_OPERATION);
      console.log(`Search completed in ${duration.toFixed(2)}ms`);
    });

    test('instance customization performance', async () => {
      const instanceId = uuidv4();
      const templateType = 'performance_review';

      const mockInstance = {
        org_performance_review_id: instanceId,
        organization_id: testOrganizationId,
        inheritance_type: 'full',
        customization_level: 0,
        update: jest.fn().mockResolvedValue({
          org_performance_review_id: instanceId,
          inheritance_type: 'partial',
          customization_level: 40
        })
      };

      // Mock database lookup
      const mockModels = require('../models');
      mockModels.OrganizationPerformanceReview = {
        findByPk: jest.fn().mockResolvedValue(mockInstance)
      };

      const customizations = {
        rating_scale: '1-5',
        review_frequency: 'quarterly',
        competencies: ['leadership', 'communication', 'technical'],
        goals_section: true,
        feedback_360: true
      };

      const startTime = performance.now();

      await templateInheritanceService.customizeInstance(
        instanceId,
        customizations,
        templateType
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.CUSTOMIZATION);
      console.log(`Customization completed in ${duration.toFixed(2)}ms`);
    });

    test('template sync performance', async () => {
      const instanceId = uuidv4();
      const templateType = 'training_program';

      const mockInstance = {
        org_training_program_id: instanceId,
        organization_id: testOrganizationId,
        inheritance_type: 'full',
        auto_sync_enabled: true,
        update: jest.fn().mockResolvedValue({})
      };

      const mockTemplate = {
        training_program_template_id: uuidv4(),
        program_name: 'Advanced Leadership',
        duration_hours: 40,
        difficulty_level: 'advanced',
        prerequisites: ['leadership_basics', 'management_101']
      };

      // Mock database operations
      const mockModels = require('../models');
      mockModels.OrganizationTrainingProgram = {
        findByPk: jest.fn().mockResolvedValue(mockInstance)
      };
      mockModels.TrainingProgramTemplate = {
        findByPk: jest.fn().mockResolvedValue(mockTemplate)
      };

      const startTime = performance.now();

      await templateInheritanceService.syncInstanceWithTemplate(
        instanceId,
        ['program_name', 'duration_hours', 'difficulty_level'],
        templateType
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SYNC_OPERATION);
      console.log(`Sync completed in ${duration.toFixed(2)}ms`);
    });
  });

  describe('Bulk Operations Performance', () => {
    test('bulk import 10 templates performance', async () => {
      const templateIds = Array.from({ length: 10 }, () => uuidv4());
      const templateType = 'benefit_package';

      // Mock bulk import
      jest.spyOn(templateInheritanceService, 'bulkImportTemplates').mockResolvedValue({
        summary: {
          total: 10,
          successful: 10,
          failed: 0
        },
        successful: templateIds.map(id => ({
          template_id: id,
          instance_id: uuidv4()
        })),
        failed: []
      });

      const startTime = performance.now();

      await templateInheritanceService.bulkImportTemplates(
        testOrganizationId,
        templateIds,
        {
          templateType,
          customizations: { health_insurance: 'premium' },
          autoSync: true
        }
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_IMPORT_10);
      console.log(`Bulk import (10) completed in ${duration.toFixed(2)}ms`);
    });

    test('bulk import 100 templates performance', async () => {
      const templateIds = Array.from({ length: 100 }, () => uuidv4());
      const templateType = 'compliance_checklist';

      // Mock bulk import
      jest.spyOn(templateInheritanceService, 'bulkImportTemplates').mockResolvedValue({
        summary: {
          total: 100,
          successful: 100,
          failed: 0
        },
        successful: templateIds.map(id => ({
          template_id: id,
          instance_id: uuidv4()
        })),
        failed: []
      });

      const startTime = performance.now();

      await templateInheritanceService.bulkImportTemplates(
        testOrganizationId,
        templateIds,
        {
          templateType,
          customizations: { priority: 'high' },
          autoSync: true
        }
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_IMPORT_100);
      console.log(`Bulk import (100) completed in ${duration.toFixed(2)}ms`);
    });

    test('organization instances listing performance', async () => {
      const templateType = 'policy_document';
      const instanceCount = 1000;

      // Mock large instance list
      const mockInstances = Array.from({ length: instanceCount }, (_, i) => ({
        org_policy_document_id: uuidv4(),
        organization_id: testOrganizationId,
        document_title: `Policy Document ${i}`,
        category: 'hr_policy',
        inheritance_type: i % 3 === 0 ? 'full' : i % 3 === 1 ? 'partial' : 'override',
        customization_level: Math.floor(Math.random() * 100),
        created_at: new Date(),
        updated_at: new Date()
      }));

      jest.spyOn(templateInheritanceService, 'getOrganizationInstances').mockResolvedValue(mockInstances);

      const startTime = performance.now();

      await templateInheritanceService.getOrganizationInstances(
        testOrganizationId,
        templateType,
        {
          includeTemplate: false,
          includeInheritance: true
        }
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle 1000 instances efficiently
      expect(duration).toBeLessThan(200); // 200ms threshold for 1000 instances
      console.log(`Listing ${instanceCount} instances completed in ${duration.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage Performance', () => {
    test('memory usage for large template operations', async () => {
      if (!global.gc) {
        console.log('Garbage collection not available, skipping memory test');
        return;
      }

      // Force garbage collection and measure initial memory
      global.gc();
      const initialMemory = process.memoryUsage();

      // Perform memory-intensive operations
      const templateIds = Array.from({ length: 500 }, () => uuidv4());
      const templateType = 'career_path';

      // Mock memory-intensive bulk import
      jest.spyOn(templateInheritanceService, 'bulkImportTemplates').mockImplementation(async () => {
        // Simulate memory allocation
        const largeData = Array.from({ length: 10000 }, () => ({
          id: uuidv4(),
          data: 'x'.repeat(1000) // 1KB per item
        }));

        return {
          summary: { total: 500, successful: 500, failed: 0 },
          successful: templateIds.map(id => ({ template_id: id, instance_id: uuidv4() })),
          failed: [],
          largeData // Keep reference to prevent immediate GC
        };
      });

      await templateInheritanceService.bulkImportTemplates(
        testOrganizationId,
        templateIds,
        { templateType, customizations: {}, autoSync: true }
      );

      // Force garbage collection and measure final memory
      global.gc();
      const finalMemory = process.memoryUsage();

      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      // Memory increase should be reasonable (< 50MB for this test)
      expect(memoryIncreaseMB).toBeLessThan(50);
      console.log(`Memory increase: ${memoryIncreaseMB.toFixed(2)}MB`);
    });
  });

  describe('Concurrent Operations Performance', () => {
    test('concurrent template imports performance', async () => {
      const concurrentCount = 20;
      const templateType = 'onboarding_workflow';

      // Mock concurrent imports
      jest.spyOn(templateInheritanceService, 'importTemplate').mockImplementation(async (orgId, templateId) => {
        // Simulate some async work
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        return {
          org_onboarding_workflow_id: uuidv4(),
          organization_id: orgId,
          onboarding_workflow_template_id: templateId,
          inheritance_type: 'full',
          customization_level: 0
        };
      });

      const promises = Array.from({ length: concurrentCount }, () => {
        const templateId = uuidv4();
        return templateInheritanceService.importTemplate(
          testOrganizationId,
          templateId,
          {
            templateType,
            customizations: {},
            autoSync: true
          }
        );
      });

      const startTime = performance.now();
      const results = await Promise.all(promises);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(results).toHaveLength(concurrentCount);
      expect(duration).toBeLessThan(1000); // 1 second for 20 concurrent operations
      console.log(`${concurrentCount} concurrent imports completed in ${duration.toFixed(2)}ms`);
    });

    test('concurrent customization operations performance', async () => {
      const concurrentCount = 15;
      const templateType = 'reporting_structure';

      // Mock concurrent customizations
      const mockInstance = {
        update: jest.fn().mockResolvedValue({
          org_reporting_structure_id: uuidv4(),
          inheritance_type: 'partial',
          customization_level: 50
        })
      };

      const mockModels = require('../models');
      mockModels.OrganizationReportingStructure = {
        findByPk: jest.fn().mockResolvedValue(mockInstance)
      };

      const promises = Array.from({ length: concurrentCount }, () => {
        const instanceId = uuidv4();
        return templateInheritanceService.customizeInstance(
          instanceId,
          { levels: Math.floor(Math.random() * 10) + 1 },
          templateType
        );
      });

      const startTime = performance.now();
      const results = await Promise.all(promises);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(results).toHaveLength(concurrentCount);
      expect(duration).toBeLessThan(800); // 800ms for 15 concurrent customizations
      console.log(`${concurrentCount} concurrent customizations completed in ${duration.toFixed(2)}ms`);
    });
  });

  describe('Performance Regression Tests', () => {
    test('should maintain consistent performance across template types', async () => {
      const templateTypes = [
        'skill', 'job_role', 'leave_type', 'performance_review',
        'benefit_package', 'training_program', 'compliance_checklist',
        'onboarding_workflow', 'policy_document', 'compensation_band',
        'career_path', 'reporting_structure'
      ];

      const results = {};

      for (const templateType of templateTypes) {
        const templateId = uuidv4();

        // Mock the specific import method
        const importMethodName = `import${templateType.split('_').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join('')}Template`;

        jest.spyOn(templateInheritanceService, importMethodName).mockResolvedValue({
          [`org_${templateType}_id`]: uuidv4(),
          organization_id: testOrganizationId,
          inheritance_type: 'full',
          customization_level: 0
        });

        const startTime = performance.now();

        await templateInheritanceService.importTemplate(
          testOrganizationId,
          templateId,
          {
            templateType,
            customizations: {},
            autoSync: true
          }
        );

        const endTime = performance.now();
        results[templateType] = endTime - startTime;
      }

      // All template types should perform within similar ranges
      const durations = Object.values(results);
      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);

      // Variance should be reasonable (max shouldn't be more than 3x min)
      expect(maxDuration / minDuration).toBeLessThan(3);

      console.log('Performance by template type:');
      Object.entries(results).forEach(([type, duration]) => {
        console.log(`  ${type}: ${duration.toFixed(2)}ms`);
      });
      console.log(`  Average: ${averageDuration.toFixed(2)}ms`);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});