/**
 * Template Inheritance System Tests
 * Tests for all template-to-instance inheritance functionality
 */

const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const templateInheritanceService = require('../src/services/templateInheritanceService');
const { ValidationError, NotFoundError } = require('../src/utils/errors');

// Mock the Express app for testing
const express = require('express');
const templateController = require('../src/controllers/templateController');
const templateRoutes = require('../src/routes/templateRoutes');

describe('Template Inheritance System', () => {
  let app;
  let testOrganizationId;
  let testTenantId;

  beforeAll(() => {
    // Setup test Express app
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = testHelpers.createTestUser();
      next();
    });

    // Mock permission middleware
    app.use((req, res, next) => {
      next();
    });

    app.use('/api', templateRoutes);

    // Generate test IDs
    testOrganizationId = uuidv4();
    testTenantId = uuidv4();
  });

  describe('Template Type Support', () => {
    const supportedTemplateTypes = [
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

    test.each(supportedTemplateTypes)('should support %s template type', (templateType) => {
      const { validateTemplateType } = require('../src/utils/validators');
      expect(() => validateTemplateType(templateType)).not.toThrow();
    });

    test('should reject unsupported template types', () => {
      const { validateTemplateType } = require('../src/utils/validators');
      expect(() => validateTemplateType('invalid_type')).toThrow(ValidationError);
    });
  });

  describe('Template Service Methods', () => {
    describe('Template Import by Type', () => {
      const testCases = [
        {
          templateType: 'leave_type',
          templateId: uuidv4(),
          expectedInstanceId: 'org_leave_type_id'
        },
        {
          templateType: 'performance_review',
          templateId: uuidv4(),
          expectedInstanceId: 'org_performance_review_id'
        },
        {
          templateType: 'benefit_package',
          templateId: uuidv4(),
          expectedInstanceId: 'org_benefit_package_id'
        },
        {
          templateType: 'training_program',
          templateId: uuidv4(),
          expectedInstanceId: 'org_training_program_id'
        },
        {
          templateType: 'compliance_checklist',
          templateId: uuidv4(),
          expectedInstanceId: 'org_compliance_checklist_id'
        },
        {
          templateType: 'onboarding_workflow',
          templateId: uuidv4(),
          expectedInstanceId: 'org_onboarding_workflow_id'
        },
        {
          templateType: 'policy_document',
          templateId: uuidv4(),
          expectedInstanceId: 'org_policy_document_id'
        },
        {
          templateType: 'compensation_band',
          templateId: uuidv4(),
          expectedInstanceId: 'org_compensation_band_id'
        },
        {
          templateType: 'career_path',
          templateId: uuidv4(),
          expectedInstanceId: 'org_career_path_id'
        },
        {
          templateType: 'reporting_structure',
          templateId: uuidv4(),
          expectedInstanceId: 'org_reporting_structure_id'
        }
      ];

      test.each(testCases)('should handle $templateType import correctly', async ({ templateType, templateId, expectedInstanceId }) => {
        // Mock the specific import method for this template type
        const importMethodName = `import${templateType.split('_').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join('')}Template`;

        const mockInstance = {
          [expectedInstanceId]: uuidv4(),
          organization_id: testOrganizationId,
          template_id: templateId,
          inheritance_type: 'full',
          customization_level: 0,
          auto_sync_enabled: true,
          created_at: new Date(),
          updated_at: new Date()
        };

        // Mock the service method
        jest.spyOn(templateInheritanceService, importMethodName).mockResolvedValue(mockInstance);

        const result = await templateInheritanceService.importTemplate(
          testOrganizationId,
          templateId,
          {
            templateType,
            customizations: { test: 'value' },
            autoSync: true
          }
        );

        expect(result).toBeDefined();
        expect(templateInheritanceService[importMethodName]).toHaveBeenCalledWith(
          testOrganizationId,
          templateId,
          { test: 'value' },
          true
        );
      });
    });

    describe('Instance ID Resolution', () => {
      test('should correctly resolve instance IDs for all template types', () => {
        const testInstances = {
          skill: { org_skill_id: 'skill-123' },
          job_role: { org_role_id: 'role-123' },
          leave_type: { org_leave_type_id: 'leave-123' },
          performance_review: { org_performance_review_id: 'perf-123' },
          benefit_package: { org_benefit_package_id: 'benefit-123' },
          training_program: { org_training_program_id: 'training-123' },
          compliance_checklist: { org_compliance_checklist_id: 'compliance-123' },
          onboarding_workflow: { org_onboarding_workflow_id: 'onboarding-123' },
          policy_document: { org_policy_document_id: 'policy-123' },
          compensation_band: { org_compensation_band_id: 'compensation-123' },
          career_path: { org_career_path_id: 'career-123' },
          reporting_structure: { org_reporting_structure_id: 'reporting-123' }
        };

        Object.entries(testInstances).forEach(([templateType, instance]) => {
          const id = templateInheritanceService.getInstanceId(instance, templateType);
          expect(id).toBe(Object.values(instance)[0]);
        });
      });
    });

    describe('Template ID Resolution', () => {
      test('should correctly resolve template IDs for all template types', () => {
        const testInstances = {
          skill: { skill_id: 'skill-template-123' },
          job_role: { job_role_id: 'role-template-123' },
          leave_type: { leave_type_id: 'leave-template-123' },
          performance_review: { performance_review_template_id: 'perf-template-123' },
          benefit_package: { benefit_package_template_id: 'benefit-template-123' },
          training_program: { training_program_template_id: 'training-template-123' },
          compliance_checklist: { compliance_checklist_template_id: 'compliance-template-123' },
          onboarding_workflow: { onboarding_workflow_template_id: 'onboarding-template-123' },
          policy_document: { policy_document_template_id: 'policy-template-123' },
          compensation_band: { compensation_band_template_id: 'compensation-template-123' },
          career_path: { career_path_template_id: 'career-template-123' },
          reporting_structure: { reporting_structure_template_id: 'reporting-template-123' }
        };

        Object.entries(testInstances).forEach(([templateType, instance]) => {
          const id = templateInheritanceService.getTemplateIdFromInstance(instance, templateType);
          expect(id).toBe(Object.values(instance)[0]);
        });
      });
    });
  });

  describe('API Endpoints', () => {
    describe('Template Listing', () => {
      test('GET /api/templates/:templateType should return templates', async () => {
        const templateType = 'leave_type';

        // Mock the service method
        jest.spyOn(templateInheritanceService, 'listTemplates').mockResolvedValue({
          rows: [
            {
              leave_type_id: uuidv4(),
              name: 'Annual Leave',
              category: 'time_off',
              is_active: true
            }
          ],
          count: 1
        });

        const response = await request(app)
          .get(`/api/templates/${templateType}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.templates).toHaveLength(1);
        expect(response.body.data.pagination).toBeDefined();
      });

      test('GET /api/templates/:templateType with invalid type should return 400', async () => {
        const response = await request(app)
          .get('/api/templates/invalid_type')
          .expect(400);

        expect(response.body.success).toBeFalsy();
      });
    });

    describe('Template Import', () => {
      test('POST /api/organizations/:organizationId/templates/import should import template', async () => {
        const templateId = uuidv4();
        const templateType = 'performance_review';

        const mockInstance = {
          org_performance_review_id: uuidv4(),
          organization_id: testOrganizationId,
          template_id: templateId,
          inheritance_type: 'full',
          customization_level: 0
        };

        jest.spyOn(templateInheritanceService, 'importTemplate').mockResolvedValue(mockInstance);

        const response = await request(app)
          .post(`/api/organizations/${testOrganizationId}/templates/import`)
          .send({
            templateId,
            templateType,
            customizations: { rating_scale: '1-5' },
            autoSync: true
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('imported successfully');
        expect(response.body.data.instance).toBeDefined();
      });

      test('POST /api/organizations/:organizationId/templates/bulk-import should import multiple templates', async () => {
        const templateIds = [uuidv4(), uuidv4()];
        const templateType = 'training_program';

        const mockResult = {
          summary: {
            total: 2,
            successful: 2,
            failed: 0
          },
          successful: templateIds.map(id => ({
            template_id: id,
            instance_id: uuidv4()
          })),
          failed: []
        };

        jest.spyOn(templateInheritanceService, 'bulkImportTemplates').mockResolvedValue(mockResult);

        const response = await request(app)
          .post(`/api/organizations/${testOrganizationId}/templates/bulk-import`)
          .send({
            templateIds,
            templateType,
            defaultCustomizations: { duration_hours: 40 },
            autoSync: true
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('2/2 successful');
        expect(response.body.data.summary.successful).toBe(2);
      });
    });

    describe('Instance Management', () => {
      test('GET /api/organizations/:organizationId/instances/:templateType should list instances', async () => {
        const templateType = 'benefit_package';

        const mockInstances = [
          {
            org_benefit_package_id: uuidv4(),
            organization_id: testOrganizationId,
            package_name: 'Standard Benefits',
            inheritance_type: 'partial',
            customization_level: 25
          }
        ];

        jest.spyOn(templateInheritanceService, 'getOrganizationInstances').mockResolvedValue(mockInstances);

        const response = await request(app)
          .get(`/api/organizations/${testOrganizationId}/instances/${templateType}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.instances).toHaveLength(1);
        expect(response.body.data.templateType).toBe(templateType);
      });

      test('PUT /api/organizations/:organizationId/instances/:templateType/:instanceId/customize should customize instance', async () => {
        const templateType = 'compliance_checklist';
        const instanceId = uuidv4();

        const mockUpdatedInstance = {
          org_compliance_checklist_id: instanceId,
          organization_id: testOrganizationId,
          customization_level: 50,
          custom_fields: { priority: 'high' }
        };

        jest.spyOn(templateInheritanceService, 'getInstance').mockResolvedValue({
          org_compliance_checklist_id: instanceId,
          organization_id: testOrganizationId
        });

        jest.spyOn(templateInheritanceService, 'customizeInstance').mockResolvedValue(mockUpdatedInstance);

        const response = await request(app)
          .put(`/api/organizations/${testOrganizationId}/instances/${templateType}/${instanceId}/customize`)
          .send({
            customizations: { priority: 'high', due_frequency: 'quarterly' }
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('customized successfully');
        expect(response.body.data.instance.customization_level).toBe(50);
      });
    });

    describe('Template Search and Compare', () => {
      test('POST /api/templates/search should search templates', async () => {
        const mockResults = {
          templates: [
            {
              type: 'onboarding_workflow',
              id: uuidv4(),
              name: 'New Hire Workflow',
              category: 'hr_process'
            }
          ],
          total: 1
        };

        jest.spyOn(templateInheritanceService, 'searchTemplates').mockResolvedValue(mockResults);

        const response = await request(app)
          .post('/api/templates/search')
          .send({
            templateTypes: ['onboarding_workflow'],
            searchTerm: 'new hire',
            categories: ['hr_process'],
            page: 1,
            limit: 20
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.results).toHaveLength(1);
        expect(response.body.data.pagination).toBeDefined();
      });

      test('POST /api/templates/compare should compare templates', async () => {
        const sourceId = uuidv4();
        const targetId = uuidv4();
        const templateType = 'career_path';

        const mockComparison = {
          sourceId,
          targetId,
          differences: ['progression_levels', 'skill_requirements'],
          similarity_score: 0.75
        };

        jest.spyOn(templateInheritanceService, 'compareTemplates').mockResolvedValue(mockComparison);

        const response = await request(app)
          .post('/api/templates/compare')
          .send({
            sourceId,
            targetId,
            sourceType: templateType,
            targetType: 'template',
            comparisonFields: ['progression_levels', 'skill_requirements']
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.comparison.similarity_score).toBe(0.75);
      });
    });

    describe('Export and Statistics', () => {
      test('GET /api/organizations/:organizationId/instances/:templateType/export should export instances', async () => {
        const templateType = 'policy_document';

        const mockInstances = [
          {
            org_policy_document_id: uuidv4(),
            organization_id: testOrganizationId,
            document_title: 'Remote Work Policy',
            inheritance_type: 'override'
          }
        ];

        jest.spyOn(templateInheritanceService, 'getOrganizationInstances').mockResolvedValue(mockInstances);

        const response = await request(app)
          .get(`/api/organizations/${testOrganizationId}/instances/${templateType}/export`)
          .query({ format: 'json', includeTemplate: 'true' })
          .expect(200);

        expect(response.body.organization_id).toBe(testOrganizationId);
        expect(response.body.template_type).toBe(templateType);
        expect(response.body.instances).toHaveLength(1);
        expect(response.body.exported_at).toBeDefined();
      });

      test('GET /api/organizations/:organizationId/templates/stats should return customization statistics', async () => {
        const mockStats = {
          total: 10,
          full_inheritance: 6,
          partial_inheritance: 3,
          override: 1,
          avg_customization_level: 25.5
        };

        jest.spyOn(templateInheritanceService, 'getCustomizationStats').mockResolvedValue(mockStats);

        const response = await request(app)
          .get(`/api/organizations/${testOrganizationId}/templates/stats`)
          .query({ templateType: 'compensation_band' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.customization_stats.compensation_band).toBeDefined();
        expect(response.body.data.customization_stats.compensation_band.total).toBe(10);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid UUID parameters', async () => {
      const response = await request(app)
        .get('/api/templates/skill/invalid-uuid')
        .expect(400);

      expect(response.body.success).toBeFalsy();
    });

    test('should handle organization not found', async () => {
      const nonExistentOrgId = uuidv4();
      const templateId = uuidv4();

      jest.spyOn(templateInheritanceService, 'importTemplate').mockRejectedValue(
        new NotFoundError('Organization not found')
      );

      const response = await request(app)
        .post(`/api/organizations/${nonExistentOrgId}/templates/import`)
        .send({
          templateId,
          templateType: 'skill',
          customizations: {}
        })
        .expect(404);

      expect(response.body.success).toBeFalsy();
    });

    test('should handle template not found', async () => {
      const nonExistentTemplateId = uuidv4();

      jest.spyOn(templateInheritanceService, 'getTemplate').mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/templates/skill/${nonExistentTemplateId}`)
        .expect(404);

      expect(response.body.success).toBeFalsy();
    });
  });

  describe('Validation', () => {
    test('should validate required fields for template import', async () => {
      const response = await request(app)
        .post(`/api/organizations/${testOrganizationId}/templates/import`)
        .send({
          // Missing templateId and templateType
          customizations: {}
        })
        .expect(400);

      expect(response.body.success).toBeFalsy();
    });

    test('should validate customizations object format', async () => {
      const response = await request(app)
        .put(`/api/organizations/${testOrganizationId}/instances/skill/${uuidv4()}/customize`)
        .send({
          customizations: 'invalid-format' // Should be object
        })
        .expect(400);

      expect(response.body.success).toBeFalsy();
    });

    test('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/templates/skill')
        .query({ page: -1, limit: 1000 }) // Invalid pagination
        .expect(400);

      expect(response.body.success).toBeFalsy();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});