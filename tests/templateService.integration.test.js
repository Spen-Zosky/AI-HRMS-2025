/**
 * Template Inheritance Service Integration Tests
 * Integration tests for the template inheritance service layer
 */

const { v4: uuidv4 } = require('uuid');
const templateInheritanceService = require('../src/services/templateInheritanceService');
const { ValidationError, NotFoundError, ConflictError } = require('../src/utils/errors');

// Mock database models
const mockModels = {
  SkillsTemplate: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn()
  },
  JobRoleTemplate: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn()
  },
  LeaveTypeTemplate: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn()
  },
  PerformanceReviewTemplate: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn()
  },
  BenefitPackageTemplate: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn()
  },
  TrainingProgramTemplate: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn()
  },
  ComplianceChecklistTemplate: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn()
  },
  OnboardingWorkflowTemplate: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn()
  },
  PolicyDocumentTemplate: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn()
  },
  CompensationBandTemplate: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn()
  },
  CareerPathTemplate: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn()
  },
  ReportingStructureTemplate: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn()
  },
  OrganizationSkill: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  },
  OrganizationJobRole: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  },
  OrganizationLeaveType: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  },
  OrganizationPerformanceReview: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  },
  OrganizationBenefitPackage: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  },
  OrganizationTrainingProgram: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  },
  OrganizationComplianceChecklist: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  },
  OrganizationOnboardingWorkflow: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  },
  OrganizationPolicyDocument: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  },
  OrganizationCompensationBand: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  },
  OrganizationCareerPath: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  },
  OrganizationReportingStructure: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  }
};

// Mock the database module
jest.mock('../models', () => mockModels);

describe('Template Inheritance Service Integration', () => {
  let testOrganizationId;
  let testTemplateIds;

  beforeEach(() => {
    testOrganizationId = uuidv4();
    testTemplateIds = {
      skill: uuidv4(),
      job_role: uuidv4(),
      leave_type: uuidv4(),
      performance_review: uuidv4(),
      benefit_package: uuidv4(),
      training_program: uuidv4(),
      compliance_checklist: uuidv4(),
      onboarding_workflow: uuidv4(),
      policy_document: uuidv4(),
      compensation_band: uuidv4(),
      career_path: uuidv4(),
      reporting_structure: uuidv4()
    };

    // Reset all mocks
    Object.values(mockModels).forEach(model => {
      Object.values(model).forEach(method => {
        method.mockReset();
      });
    });
  });

  describe('Template Listing', () => {
    test('should list leave type templates with pagination', async () => {
      const mockTemplates = {
        rows: [
          {
            leave_type_id: testTemplateIds.leave_type,
            name: 'Annual Leave',
            category: 'time_off',
            default_days: 25,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          }
        ],
        count: 1
      };

      mockModels.LeaveTypeTemplate.findAndCountAll = jest.fn().mockResolvedValue(mockTemplates);

      const result = await templateInheritanceService.listTemplates('leave_type', {
        offset: 0,
        limit: 20,
        search: null,
        category: null,
        active: true
      });

      expect(result).toEqual(mockTemplates);
      expect(mockModels.LeaveTypeTemplate.findAndCountAll).toHaveBeenCalledWith({
        offset: 0,
        limit: 20,
        where: { is_active: true },
        order: [['name', 'ASC']]
      });
    });

    test('should list performance review templates with search', async () => {
      const mockTemplates = {
        rows: [
          {
            performance_review_template_id: testTemplateIds.performance_review,
            review_name: 'Annual Performance Review',
            review_cycle: 'annual',
            rating_scale: '1-5',
            is_active: true
          }
        ],
        count: 1
      };

      mockModels.PerformanceReviewTemplate.findAndCountAll = jest.fn().mockResolvedValue(mockTemplates);

      const result = await templateInheritanceService.listTemplates('performance_review', {
        offset: 0,
        limit: 20,
        search: 'annual',
        category: null,
        active: true
      });

      expect(result).toEqual(mockTemplates);
      expect(mockModels.PerformanceReviewTemplate.findAndCountAll).toHaveBeenCalledWith({
        offset: 0,
        limit: 20,
        where: {
          is_active: true,
          review_name: { [expect.any(Symbol)]: '%annual%' }
        },
        order: [['review_name', 'ASC']]
      });
    });
  });

  describe('Template Import Operations', () => {
    test('should import benefit package template successfully', async () => {
      const templateId = testTemplateIds.benefit_package;
      const customizations = {
        health_insurance: 'premium',
        dental_coverage: true,
        vision_coverage: true
      };

      const mockTemplate = {
        benefit_package_template_id: templateId,
        package_name: 'Standard Benefits',
        health_insurance: 'basic',
        dental_coverage: false,
        vision_coverage: false,
        retirement_401k: true,
        is_active: true
      };

      const mockInstance = {
        org_benefit_package_id: uuidv4(),
        organization_id: testOrganizationId,
        benefit_package_template_id: templateId,
        package_name: 'Standard Benefits',
        health_insurance: 'premium', // Customized
        dental_coverage: true, // Customized
        vision_coverage: true, // Customized
        retirement_401k: true, // Inherited
        inheritance_type: 'partial',
        customization_level: 60,
        auto_sync_enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockModels.BenefitPackageTemplate.findByPk.mockResolvedValue(mockTemplate);
      mockModels.OrganizationBenefitPackage.findOne.mockResolvedValue(null); // No existing instance
      mockModels.OrganizationBenefitPackage.create.mockResolvedValue(mockInstance);

      const result = await templateInheritanceService.importTemplate(
        testOrganizationId,
        templateId,
        {
          templateType: 'benefit_package',
          customizations,
          autoSync: true
        }
      );

      expect(result).toEqual(mockInstance);
      expect(mockModels.BenefitPackageTemplate.findByPk).toHaveBeenCalledWith(templateId);
      expect(mockModels.OrganizationBenefitPackage.create).toHaveBeenCalledWith({
        organization_id: testOrganizationId,
        benefit_package_template_id: templateId,
        package_name: 'Standard Benefits',
        health_insurance: 'premium',
        dental_coverage: true,
        vision_coverage: true,
        retirement_401k: true,
        inheritance_type: 'partial',
        customization_level: 60,
        auto_sync_enabled: true,
        last_template_sync: expect.any(Date),
        custom_fields: customizations
      });
    });

    test('should import training program template with full inheritance', async () => {
      const templateId = testTemplateIds.training_program;

      const mockTemplate = {
        training_program_template_id: templateId,
        program_name: 'Leadership Development',
        duration_hours: 40,
        difficulty_level: 'intermediate',
        prerequisites: ['management_basics'],
        is_active: true
      };

      const mockInstance = {
        org_training_program_id: uuidv4(),
        organization_id: testOrganizationId,
        training_program_template_id: templateId,
        program_name: 'Leadership Development',
        duration_hours: 40,
        difficulty_level: 'intermediate',
        prerequisites: ['management_basics'],
        inheritance_type: 'full',
        customization_level: 0,
        auto_sync_enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockModels.TrainingProgramTemplate.findByPk.mockResolvedValue(mockTemplate);
      mockModels.OrganizationTrainingProgram.findOne.mockResolvedValue(null);
      mockModels.OrganizationTrainingProgram.create.mockResolvedValue(mockInstance);

      const result = await templateInheritanceService.importTemplate(
        testOrganizationId,
        templateId,
        {
          templateType: 'training_program',
          customizations: {}, // No customizations = full inheritance
          autoSync: true
        }
      );

      expect(result).toEqual(mockInstance);
      expect(result.inheritance_type).toBe('full');
      expect(result.customization_level).toBe(0);
    });

    test('should handle template not found error', async () => {
      const templateId = uuidv4();

      mockModels.ComplianceChecklistTemplate.findByPk.mockResolvedValue(null);

      await expect(
        templateInheritanceService.importTemplate(
          testOrganizationId,
          templateId,
          {
            templateType: 'compliance_checklist',
            customizations: {},
            autoSync: true
          }
        )
      ).rejects.toThrow(NotFoundError);
    });

    test('should handle existing instance conflict', async () => {
      const templateId = testTemplateIds.onboarding_workflow;

      const mockTemplate = {
        onboarding_workflow_template_id: templateId,
        workflow_name: 'New Hire Onboarding',
        steps: ['documentation', 'orientation', 'training'],
        is_active: true
      };

      const existingInstance = {
        org_onboarding_workflow_id: uuidv4(),
        organization_id: testOrganizationId,
        onboarding_workflow_template_id: templateId
      };

      mockModels.OnboardingWorkflowTemplate.findByPk.mockResolvedValue(mockTemplate);
      mockModels.OrganizationOnboardingWorkflow.findOne.mockResolvedValue(existingInstance);

      await expect(
        templateInheritanceService.importTemplate(
          testOrganizationId,
          templateId,
          {
            templateType: 'onboarding_workflow',
            customizations: {},
            autoSync: true
          }
        )
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('Bulk Import Operations', () => {
    test('should bulk import multiple policy document templates', async () => {
      const templateIds = [uuidv4(), uuidv4()];
      const templateType = 'policy_document';

      const mockTemplates = templateIds.map((id, index) => ({
        policy_document_template_id: id,
        document_title: `Policy Document ${index + 1}`,
        category: 'hr_policy',
        content: `Content for policy ${index + 1}`,
        is_active: true
      }));

      const mockInstances = templateIds.map((id, index) => ({
        org_policy_document_id: uuidv4(),
        organization_id: testOrganizationId,
        policy_document_template_id: id,
        document_title: `Policy Document ${index + 1}`,
        category: 'hr_policy',
        content: `Content for policy ${index + 1}`,
        inheritance_type: 'full',
        customization_level: 0,
        auto_sync_enabled: true
      }));

      // Mock template lookups
      mockTemplates.forEach((template, index) => {
        mockModels.PolicyDocumentTemplate.findByPk
          .mockResolvedValueOnce(template);
      });

      // Mock no existing instances
      mockModels.OrganizationPolicyDocument.findOne.mockResolvedValue(null);

      // Mock instance creation
      mockInstances.forEach((instance, index) => {
        mockModels.OrganizationPolicyDocument.create
          .mockResolvedValueOnce(instance);
      });

      const result = await templateInheritanceService.bulkImportTemplates(
        testOrganizationId,
        templateIds,
        {
          templateType,
          customizations: {},
          autoSync: true
        }
      );

      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(0);
      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    test('should handle partial failure in bulk import', async () => {
      const templateIds = [uuidv4(), uuidv4()];
      const templateType = 'compensation_band';

      // First template exists, second doesn't
      mockModels.CompensationBandTemplate.findByPk
        .mockResolvedValueOnce({
          compensation_band_template_id: templateIds[0],
          band_name: 'Senior Developer',
          min_salary: 80000,
          max_salary: 120000,
          is_active: true
        })
        .mockResolvedValueOnce(null); // Second template not found

      mockModels.OrganizationCompensationBand.findOne.mockResolvedValue(null);
      mockModels.OrganizationCompensationBand.create.mockResolvedValue({
        org_compensation_band_id: uuidv4(),
        organization_id: testOrganizationId,
        compensation_band_template_id: templateIds[0],
        band_name: 'Senior Developer',
        min_salary: 80000,
        max_salary: 120000,
        inheritance_type: 'full',
        customization_level: 0
      });

      const result = await templateInheritanceService.bulkImportTemplates(
        testOrganizationId,
        templateIds,
        {
          templateType,
          customizations: {},
          autoSync: true
        }
      );

      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toContain('not found');
    });
  });

  describe('Instance Customization', () => {
    test('should customize career path instance', async () => {
      const instanceId = uuidv4();
      const templateType = 'career_path';
      const customizations = {
        progression_levels: 5,
        promotion_criteria: 'performance_based',
        review_frequency: 'annual'
      };

      const mockInstance = {
        org_career_path_id: instanceId,
        organization_id: testOrganizationId,
        career_path_template_id: testTemplateIds.career_path,
        path_name: 'Software Engineering Track',
        progression_levels: 4, // Original
        promotion_criteria: 'time_based', // Original
        review_frequency: 'biannual', // Original
        inheritance_type: 'full',
        customization_level: 0,
        update: jest.fn()
      };

      const updatedInstance = {
        ...mockInstance,
        progression_levels: 5, // Updated
        promotion_criteria: 'performance_based', // Updated
        review_frequency: 'annual', // Updated
        inheritance_type: 'partial',
        customization_level: 60,
        custom_fields: customizations
      };

      mockModels.OrganizationCareerPath.findByPk.mockResolvedValue(mockInstance);
      mockInstance.update.mockResolvedValue(updatedInstance);

      const result = await templateInheritanceService.customizeInstance(
        instanceId,
        customizations,
        templateType
      );

      expect(result).toEqual(updatedInstance);
      expect(mockInstance.update).toHaveBeenCalledWith({
        progression_levels: 5,
        promotion_criteria: 'performance_based',
        review_frequency: 'annual',
        inheritance_type: 'partial',
        customization_level: 60,
        custom_fields: customizations,
        last_template_sync: expect.any(Date)
      });
    });

    test('should handle instance not found for customization', async () => {
      const instanceId = uuidv4();

      mockModels.OrganizationReportingStructure.findByPk.mockResolvedValue(null);

      await expect(
        templateInheritanceService.customizeInstance(
          instanceId,
          { levels: 5 },
          'reporting_structure'
        )
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Instance Synchronization', () => {
    test('should sync instance with template updates', async () => {
      const instanceId = uuidv4();
      const templateType = 'leave_type';

      const mockInstance = {
        org_leave_type_id: instanceId,
        organization_id: testOrganizationId,
        leave_type_id: testTemplateIds.leave_type,
        name: 'Annual Leave',
        default_days: 20, // Outdated
        max_carry_over: 5, // Outdated
        inheritance_type: 'full',
        auto_sync_enabled: true,
        update: jest.fn()
      };

      const mockTemplate = {
        leave_type_id: testTemplateIds.leave_type,
        name: 'Annual Leave',
        default_days: 25, // Updated
        max_carry_over: 10, // Updated
        is_active: true,
        updated_at: new Date() // Recent update
      };

      const syncedInstance = {
        ...mockInstance,
        default_days: 25, // Synced
        max_carry_over: 10, // Synced
        last_template_sync: new Date()
      };

      mockModels.OrganizationLeaveType.findByPk.mockResolvedValue(mockInstance);
      mockModels.LeaveTypeTemplate.findByPk.mockResolvedValue(mockTemplate);
      mockInstance.update.mockResolvedValue(syncedInstance);

      const result = await templateInheritanceService.syncInstanceWithTemplate(
        instanceId,
        ['default_days', 'max_carry_over'],
        templateType
      );

      expect(result.success).toBe(true);
      expect(result.updatedFields).toEqual(['default_days', 'max_carry_over']);
      expect(mockInstance.update).toHaveBeenCalledWith({
        default_days: 25,
        max_carry_over: 10,
        last_template_sync: expect.any(Date)
      });
    });

    test('should detect sync conflicts for customized fields', async () => {
      const instanceId = uuidv4();
      const templateType = 'performance_review';

      const mockInstance = {
        org_performance_review_id: instanceId,
        organization_id: testOrganizationId,
        performance_review_template_id: testTemplateIds.performance_review,
        review_name: 'Annual Review',
        rating_scale: '1-10', // Customized
        review_frequency: 'annual',
        inheritance_type: 'partial',
        customization_level: 25,
        custom_fields: { rating_scale: '1-10' },
        auto_sync_enabled: true,
        update: jest.fn()
      };

      const mockTemplate = {
        performance_review_template_id: testTemplateIds.performance_review,
        review_name: 'Annual Review',
        rating_scale: '1-5', // Template value differs from customization
        review_frequency: 'biannual', // Template updated
        is_active: true,
        updated_at: new Date()
      };

      mockModels.OrganizationPerformanceReview.findByPk.mockResolvedValue(mockInstance);
      mockModels.PerformanceReviewTemplate.findByPk.mockResolvedValue(mockTemplate);

      const result = await templateInheritanceService.syncInstanceWithTemplate(
        instanceId,
        ['rating_scale', 'review_frequency'],
        templateType
      );

      expect(result.success).toBe(false);
      expect(result.conflicts).toContain('rating_scale');
      expect(result.updatedFields).toContain('review_frequency');
      expect(result.conflictFields).toContain('rating_scale');
    });
  });

  describe('Organization Statistics', () => {
    test('should calculate customization statistics', async () => {
      const mockInstances = [
        { inheritance_type: 'full', customization_level: 0 },
        { inheritance_type: 'full', customization_level: 0 },
        { inheritance_type: 'partial', customization_level: 30 },
        { inheritance_type: 'partial', customization_level: 50 },
        { inheritance_type: 'override', customization_level: 100 }
      ];

      mockModels.OrganizationTrainingProgram.findAll.mockResolvedValue(mockInstances);

      const result = await templateInheritanceService.getCustomizationStats(
        testOrganizationId,
        'training_program'
      );

      expect(result.total).toBe(5);
      expect(result.full_inheritance).toBe(2);
      expect(result.partial_inheritance).toBe(2);
      expect(result.override).toBe(1);
      expect(result.avg_customization_level).toBe(36); // (0+0+30+50+100)/5
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});