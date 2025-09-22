'use strict';

const db = require('../../models');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');
const { v4: uuidv4 } = require('uuid');

/**
 * Template Inheritance Service
 * Manages the template-to-instance pattern where Service Tables provide
 * reference templates that Core Tables inherit and customize
 */
class TemplateInheritanceService {
  constructor() {
    this.models = db;
  }

  /**
   * Import a template as a customizable instance for an organization
   */
  async importTemplate(organizationId, templateId, options = {}) {
    const {
      customizations = {},
      autoSync = true,
      templateType = 'skill'
    } = options;

    const transaction = await db.sequelize.transaction();

    try {
      // Validate organization exists
      const organization = await db.Organization.findByPk(organizationId);
      if (!organization) {
        throw new NotFoundError('Organization not found');
      }

      // Get template based on type
      const template = await this.getTemplate(templateId, templateType);
      if (!template) {
        throw new NotFoundError(`Template ${templateId} not found`);
      }

      // Check if template already imported
      const existingInstance = await this.findExistingInstance(
        organizationId,
        templateId,
        templateType
      );

      if (existingInstance) {
        throw new ConflictError('Template already imported for this organization');
      }

      // Create instance based on template type
      let instance;
      switch (templateType) {
        case 'skill':
          instance = await this.importSkillTemplate(
            organizationId,
            template,
            customizations,
            autoSync,
            transaction
          );
          break;
        case 'job_role':
          instance = await this.importJobRoleTemplate(
            organizationId,
            template,
            customizations,
            autoSync,
            transaction
          );
          break;
        case 'leave_type':
          instance = await this.importLeaveTypeTemplate(
            organizationId,
            template,
            customizations,
            autoSync,
            transaction
          );
          break;
        case 'performance_review':
          instance = await this.importPerformanceReviewTemplate(
            organizationId,
            template,
            customizations,
            autoSync,
            transaction
          );
          break;
        case 'benefit_package':
          instance = await this.importBenefitPackageTemplate(
            organizationId,
            template,
            customizations,
            autoSync,
            transaction
          );
          break;
        case 'training_program':
          instance = await this.importTrainingProgramTemplate(
            organizationId,
            template,
            customizations,
            autoSync,
            transaction
          );
          break;
        case 'compliance_checklist':
          instance = await this.importComplianceChecklistTemplate(
            organizationId,
            template,
            customizations,
            autoSync,
            transaction
          );
          break;
        case 'onboarding_workflow':
          instance = await this.importOnboardingWorkflowTemplate(
            organizationId,
            template,
            customizations,
            autoSync,
            transaction
          );
          break;
        case 'policy_document':
          instance = await this.importPolicyDocumentTemplate(
            organizationId,
            template,
            customizations,
            autoSync,
            transaction
          );
          break;
        case 'compensation_band':
          instance = await this.importCompensationBandTemplate(
            organizationId,
            template,
            customizations,
            autoSync,
            transaction
          );
          break;
        case 'career_path':
          instance = await this.importCareerPathTemplate(
            organizationId,
            template,
            customizations,
            autoSync,
            transaction
          );
          break;
        case 'reporting_structure':
          instance = await this.importReportingStructureTemplate(
            organizationId,
            template,
            customizations,
            autoSync,
            transaction
          );
          break;
        default:
          throw new ValidationError(`Unsupported template type: ${templateType}`);
      }

      // Create inheritance tracking record
      const instanceId = this.getInstanceId(instance, templateType);
      await this.createInheritanceRecord({
        template_id: templateId,
        instance_id: instanceId,
        organization_id: organizationId,
        template_type: templateType,
        inheritance_type: Object.keys(customizations).length > 0 ? 'partial' : 'full',
        customization_level: this.calculateCustomizationLevel(template, customizations),
        auto_sync_enabled: autoSync,
        custom_fields: customizations
      }, transaction);

      await transaction.commit();

      // Return instance with inheritance metadata
      return {
        ...instance.toJSON(),
        inheritance: {
          template_id: templateId,
          template_type: templateType,
          inheritance_type: Object.keys(customizations).length > 0 ? 'partial' : 'full',
          customization_level: this.calculateCustomizationLevel(template, customizations),
          auto_sync_enabled: autoSync
        }
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Import skill template as organization skill
   */
  async importSkillTemplate(organizationId, template, customizations, autoSync, transaction) {
    const orgSkillId = uuidv4();

    const skillData = {
      org_skill_id: orgSkillId,
      organization_id: organizationId,
      template_skill_id: template.skill_id,

      // Use customizations or fall back to template
      custom_name: customizations.name || template.skill_name,
      custom_description: customizations.description || template.skill_description,
      custom_category: customizations.category || template.skill_type,
      custom_proficiency_levels: customizations.proficiencyLevels || template.proficiency_levels,

      // Organization-specific settings
      department_specific: customizations.departmentSpecific || false,
      required_for_roles: customizations.requiredForRoles || {},
      certification_required: customizations.certificationRequired || false,

      // Inheritance settings
      inheritance_type: Object.keys(customizations).length > 0 ? 'partial' : 'full',
      customization_level: this.calculateCustomizationLevel(template, customizations),
      auto_sync_enabled: autoSync,
      last_template_sync: new Date(),

      is_active: true
    };

    return await db.OrganizationSkill.create(skillData, { transaction });
  }

  /**
   * Import job role template as organization job role
   */
  async importJobRoleTemplate(organizationId, template, customizations, autoSync, transaction) {
    const orgRoleId = uuidv4();

    const roleData = {
      org_role_id: orgRoleId,
      organization_id: organizationId,
      template_role_id: template.template_role_id,

      // Use customizations or fall back to template
      custom_title: customizations.title || template.role_title,
      custom_description: customizations.description || template.description,
      custom_responsibilities: customizations.responsibilities || template.responsibilities,
      custom_requirements: customizations.requirements || template.requirements,

      // Organization-specific data
      department_id: customizations.departmentId || null,
      salary_range: customizations.salaryRange || {},
      reporting_structure: customizations.reportingStructure || {},
      custom_skills: customizations.skills || template.skills_framework,

      // Inheritance settings
      inheritance_type: Object.keys(customizations).length > 0 ? 'partial' : 'full',
      customization_level: this.calculateCustomizationLevel(template, customizations),
      auto_sync_enabled: autoSync,
      template_version: template.template_version,

      is_active: true
    };

    return await db.OrganizationJobRole.create(roleData, { transaction });
  }

  /**
   * Import leave type template as organization leave type
   */
  async importLeaveTypeTemplate(organizationId, template, customizations, autoSync, transaction) {
    const orgLeaveTypeId = uuidv4();

    const leaveTypeData = {
      org_leave_type_id: orgLeaveTypeId,
      organization_id: organizationId,
      template_leave_type_id: template.leave_type_id,

      // Use customizations or fall back to template
      custom_name: customizations.name || template.type_name,
      custom_description: customizations.description || template.description,
      custom_max_days_per_year: customizations.maxDaysPerYear || template.max_days_per_year,
      custom_carry_over_rules: customizations.carryOverRules || template.carry_over_rules,
      custom_approval_workflow: customizations.approvalWorkflow || template.approval_workflow,

      // Organization-specific settings
      department_restrictions: customizations.departmentRestrictions || {},
      requires_documentation: customizations.requiresDocumentation || false,
      auto_approval_threshold: customizations.autoApprovalThreshold || null,

      // Inheritance settings
      inheritance_type: Object.keys(customizations).length > 0 ? 'partial' : 'full',
      customization_level: this.calculateCustomizationLevel(template, customizations),
      auto_sync_enabled: autoSync,
      last_template_sync: new Date(),

      is_active: true
    };

    return await db.OrganizationLeaveType.create(leaveTypeData, { transaction });
  }

  /**
   * Import performance review template as organization performance review
   */
  async importPerformanceReviewTemplate(organizationId, template, customizations, autoSync, transaction) {
    const orgPerformanceReviewId = uuidv4();

    const reviewData = {
      org_performance_review_id: orgPerformanceReviewId,
      organization_id: organizationId,
      template_performance_review_id: template.performance_review_id,

      // Use customizations or fall back to template
      custom_name: customizations.name || template.review_name,
      custom_description: customizations.description || template.description,
      custom_evaluation_criteria: customizations.evaluationCriteria || template.evaluation_criteria,
      custom_rating_scale: customizations.ratingScale || template.rating_scale,
      custom_frequency: customizations.frequency || template.frequency,

      // Organization-specific settings
      department_specific_criteria: customizations.departmentSpecificCriteria || {},
      requires_manager_approval: customizations.requiresManagerApproval || true,
      peer_review_enabled: customizations.peerReviewEnabled || false,

      // Inheritance settings
      inheritance_type: Object.keys(customizations).length > 0 ? 'partial' : 'full',
      customization_level: this.calculateCustomizationLevel(template, customizations),
      auto_sync_enabled: autoSync,
      last_template_sync: new Date(),

      is_active: true
    };

    return await db.OrganizationPerformanceReview.create(reviewData, { transaction });
  }

  /**
   * Import benefit package template as organization benefit package
   */
  async importBenefitPackageTemplate(organizationId, template, customizations, autoSync, transaction) {
    const orgBenefitPackageId = uuidv4();

    const benefitData = {
      org_benefit_package_id: orgBenefitPackageId,
      organization_id: organizationId,
      template_benefit_package_id: template.benefit_package_id,

      // Use customizations or fall back to template
      custom_name: customizations.name || template.package_name,
      custom_description: customizations.description || template.description,
      custom_benefits_included: customizations.benefitsIncluded || template.benefits_included,
      custom_eligibility_criteria: customizations.eligibilityCriteria || template.eligibility_criteria,
      custom_enrollment_process: customizations.enrollmentProcess || template.enrollment_process,

      // Organization-specific settings
      cost_sharing_model: customizations.costSharingModel || {},
      vendor_information: customizations.vendorInformation || {},
      effective_date: customizations.effectiveDate || null,

      // Inheritance settings
      inheritance_type: Object.keys(customizations).length > 0 ? 'partial' : 'full',
      customization_level: this.calculateCustomizationLevel(template, customizations),
      auto_sync_enabled: autoSync,
      last_template_sync: new Date(),

      is_active: true
    };

    return await db.OrganizationBenefitPackage.create(benefitData, { transaction });
  }

  /**
   * Import training program template as organization training program
   */
  async importTrainingProgramTemplate(organizationId, template, customizations, autoSync, transaction) {
    const orgTrainingProgramId = uuidv4();

    const trainingData = {
      org_training_program_id: orgTrainingProgramId,
      organization_id: organizationId,
      template_training_program_id: template.training_program_id,

      // Use customizations or fall back to template
      custom_name: customizations.name || template.program_name,
      custom_description: customizations.description || template.description,
      custom_curriculum: customizations.curriculum || template.curriculum,
      custom_duration: customizations.duration || template.duration,
      custom_delivery_method: customizations.deliveryMethod || template.delivery_method,

      // Organization-specific settings
      target_roles: customizations.targetRoles || [],
      mandatory_for_roles: customizations.mandatoryForRoles || [],
      certification_awarded: customizations.certificationAwarded || false,

      // Inheritance settings
      inheritance_type: Object.keys(customizations).length > 0 ? 'partial' : 'full',
      customization_level: this.calculateCustomizationLevel(template, customizations),
      auto_sync_enabled: autoSync,
      last_template_sync: new Date(),

      is_active: true
    };

    return await db.OrganizationTrainingProgram.create(trainingData, { transaction });
  }

  /**
   * Import compliance checklist template as organization compliance checklist
   */
  async importComplianceChecklistTemplate(organizationId, template, customizations, autoSync, transaction) {
    const orgComplianceChecklistId = uuidv4();

    const complianceData = {
      org_compliance_checklist_id: orgComplianceChecklistId,
      organization_id: organizationId,
      template_compliance_checklist_id: template.compliance_checklist_id,

      // Use customizations or fall back to template
      custom_name: customizations.name || template.checklist_name,
      custom_description: customizations.description || template.description,
      custom_checklist_items: customizations.checklistItems || template.checklist_items,
      custom_compliance_frequency: customizations.complianceFrequency || template.compliance_frequency,
      custom_regulatory_framework: customizations.regulatoryFramework || template.regulatory_framework,

      // Organization-specific settings
      department_specific_items: customizations.departmentSpecificItems || {},
      responsible_roles: customizations.responsibleRoles || [],
      escalation_procedures: customizations.escalationProcedures || {},

      // Inheritance settings
      inheritance_type: Object.keys(customizations).length > 0 ? 'partial' : 'full',
      customization_level: this.calculateCustomizationLevel(template, customizations),
      auto_sync_enabled: autoSync,
      last_template_sync: new Date(),

      is_active: true
    };

    return await db.OrganizationComplianceChecklist.create(complianceData, { transaction });
  }

  /**
   * Import onboarding workflow template as organization onboarding workflow
   */
  async importOnboardingWorkflowTemplate(organizationId, template, customizations, autoSync, transaction) {
    const orgOnboardingWorkflowId = uuidv4();

    const onboardingData = {
      org_onboarding_workflow_id: orgOnboardingWorkflowId,
      organization_id: organizationId,
      template_onboarding_workflow_id: template.onboarding_workflow_id,

      // Use customizations or fall back to template
      custom_name: customizations.name || template.workflow_name,
      custom_description: customizations.description || template.description,
      custom_workflow_steps: customizations.workflowSteps || template.workflow_steps,
      custom_timeline: customizations.timeline || template.timeline,
      custom_required_documents: customizations.requiredDocuments || template.required_documents,

      // Organization-specific settings
      department_specific_steps: customizations.departmentSpecificSteps || {},
      role_specific_training: customizations.roleSpecificTraining || {},
      buddy_system_enabled: customizations.buddySystemEnabled || false,

      // Inheritance settings
      inheritance_type: Object.keys(customizations).length > 0 ? 'partial' : 'full',
      customization_level: this.calculateCustomizationLevel(template, customizations),
      auto_sync_enabled: autoSync,
      last_template_sync: new Date(),

      is_active: true
    };

    return await db.OrganizationOnboardingWorkflow.create(onboardingData, { transaction });
  }

  /**
   * Import policy document template as organization policy document
   */
  async importPolicyDocumentTemplate(organizationId, template, customizations, autoSync, transaction) {
    const orgPolicyDocumentId = uuidv4();

    const policyData = {
      org_policy_document_id: orgPolicyDocumentId,
      organization_id: organizationId,
      template_policy_document_id: template.policy_document_id,

      // Use customizations or fall back to template
      custom_title: customizations.title || template.document_title,
      custom_content: customizations.content || template.content,
      custom_policy_category: customizations.policyCategory || template.policy_category,
      custom_version: customizations.version || template.version,
      custom_approval_process: customizations.approvalProcess || template.approval_process,

      // Organization-specific settings
      effective_date: customizations.effectiveDate || null,
      review_frequency: customizations.reviewFrequency || 'annual',
      requires_acknowledgment: customizations.requiresAcknowledgment || true,

      // Inheritance settings
      inheritance_type: Object.keys(customizations).length > 0 ? 'partial' : 'full',
      customization_level: this.calculateCustomizationLevel(template, customizations),
      auto_sync_enabled: autoSync,
      last_template_sync: new Date(),

      is_active: true
    };

    return await db.OrganizationPolicyDocument.create(policyData, { transaction });
  }

  /**
   * Import compensation band template as organization compensation band
   */
  async importCompensationBandTemplate(organizationId, template, customizations, autoSync, transaction) {
    const orgCompensationBandId = uuidv4();

    const compensationData = {
      org_compensation_band_id: orgCompensationBandId,
      organization_id: organizationId,
      template_compensation_band_id: template.compensation_band_id,

      // Use customizations or fall back to template
      custom_band_name: customizations.bandName || template.band_name,
      custom_description: customizations.description || template.description,
      custom_salary_range: customizations.salaryRange || template.salary_range,
      custom_grade_levels: customizations.gradeLevels || template.grade_levels,
      custom_progression_criteria: customizations.progressionCriteria || template.progression_criteria,

      // Organization-specific settings
      location_adjustments: customizations.locationAdjustments || {},
      performance_multipliers: customizations.performanceMultipliers || {},
      equity_components: customizations.equityComponents || {},

      // Inheritance settings
      inheritance_type: Object.keys(customizations).length > 0 ? 'partial' : 'full',
      customization_level: this.calculateCustomizationLevel(template, customizations),
      auto_sync_enabled: autoSync,
      last_template_sync: new Date(),

      is_active: true
    };

    return await db.OrganizationCompensationBand.create(compensationData, { transaction });
  }

  /**
   * Import career path template as organization career path
   */
  async importCareerPathTemplate(organizationId, template, customizations, autoSync, transaction) {
    const orgCareerPathId = uuidv4();

    const careerPathData = {
      org_career_path_id: orgCareerPathId,
      organization_id: organizationId,
      template_career_path_id: template.career_path_id,

      // Use customizations or fall back to template
      custom_path_name: customizations.pathName || template.path_name,
      custom_description: customizations.description || template.description,
      custom_career_levels: customizations.careerLevels || template.career_levels,
      custom_progression_requirements: customizations.progressionRequirements || template.progression_requirements,
      custom_skill_development_tracks: customizations.skillDevelopmentTracks || template.skill_development_tracks,

      // Organization-specific settings
      department_specific_paths: customizations.departmentSpecificPaths || {},
      mentor_assignment_rules: customizations.mentorAssignmentRules || {},
      performance_milestones: customizations.performanceMilestones || {},

      // Inheritance settings
      inheritance_type: Object.keys(customizations).length > 0 ? 'partial' : 'full',
      customization_level: this.calculateCustomizationLevel(template, customizations),
      auto_sync_enabled: autoSync,
      last_template_sync: new Date(),

      is_active: true
    };

    return await db.OrganizationCareerPath.create(careerPathData, { transaction });
  }

  /**
   * Import reporting structure template as organization reporting structure
   */
  async importReportingStructureTemplate(organizationId, template, customizations, autoSync, transaction) {
    const orgReportingStructureId = uuidv4();

    const reportingData = {
      org_reporting_structure_id: orgReportingStructureId,
      organization_id: organizationId,
      template_reporting_structure_id: template.reporting_structure_id,

      // Use customizations or fall back to template
      custom_structure_name: customizations.structureName || template.structure_name,
      custom_description: customizations.description || template.description,
      custom_hierarchy_levels: customizations.hierarchyLevels || template.hierarchy_levels,
      custom_reporting_relationships: customizations.reportingRelationships || template.reporting_relationships,
      custom_approval_chains: customizations.approvalChains || template.approval_chains,

      // Organization-specific settings
      department_overrides: customizations.departmentOverrides || {},
      matrix_relationships: customizations.matrixRelationships || {},
      span_of_control_limits: customizations.spanOfControlLimits || {},

      // Inheritance settings
      inheritance_type: Object.keys(customizations).length > 0 ? 'partial' : 'full',
      customization_level: this.calculateCustomizationLevel(template, customizations),
      auto_sync_enabled: autoSync,
      last_template_sync: new Date(),

      is_active: true
    };

    return await db.OrganizationReportingStructure.create(reportingData, { transaction });
  }

  /**
   * Customize an existing instance
   */
  async customizeInstance(instanceId, customizations, templateType = 'skill') {
    const transaction = await db.sequelize.transaction();

    try {
      // Get existing instance
      const instance = await this.getInstance(instanceId, templateType);
      if (!instance) {
        throw new NotFoundError('Instance not found');
      }

      // Get original template for comparison
      const templateId = this.getTemplateIdFromInstance(instance, templateType);
      const template = await this.getTemplate(templateId, templateType);
      if (!template) {
        throw new NotFoundError('Template not found');
      }

      // Apply customizations
      const updatedData = this.mergeCustomizations(instance, customizations, templateType);
      updatedData.customization_level = this.calculateCustomizationLevel(template, customizations);
      updatedData.inheritance_type = updatedData.customization_level > 0 ? 'partial' : 'full';

      // Update instance
      const updated = await this.updateInstance(instanceId, updatedData, templateType, transaction);

      // Update inheritance tracking
      await this.updateInheritanceRecord(instanceId, {
        customization_level: updatedData.customization_level,
        inheritance_type: updatedData.inheritance_type,
        custom_fields: customizations
      }, transaction);

      await transaction.commit();

      return updated;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Sync instance with latest template version
   */
  async syncInstanceWithTemplate(instanceId, syncFields = [], templateType = 'skill') {
    const transaction = await db.sequelize.transaction();

    try {
      // Get instance and template
      const instance = await this.getInstance(instanceId, templateType);
      const templateId = this.getTemplateIdFromInstance(instance, templateType);
      const template = await this.getTemplate(templateId, templateType);
      if (!template) {
        throw new NotFoundError('Template not found');
      }

      // Detect conflicts between custom changes and template updates
      const conflicts = await this.detectSyncConflicts(instance, template, syncFields);

      if (conflicts.length > 0) {
        return {
          success: false,
          conflicts: conflicts,
          message: 'Sync conflicts detected. Please resolve manually.'
        };
      }

      // Apply template updates to specified fields
      const syncData = this.selectFieldsForSync(template, syncFields, templateType);
      syncData.last_template_sync = new Date();

      // Update instance
      const synced = await this.updateInstance(instanceId, syncData, templateType, transaction);

      // Update inheritance tracking
      await this.updateInheritanceRecord(instanceId, {
        last_template_sync: new Date()
      }, transaction);

      await transaction.commit();

      return {
        success: true,
        synced_fields: syncFields,
        instance: synced
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get template by ID and type
   */
  async getTemplate(templateId, templateType) {
    switch (templateType) {
      case 'skill':
        return await db.SkillsMaster.findByPk(templateId);
      case 'job_role':
        return await db.JobRole.findByPk(templateId);
      case 'leave_type':
        return await db.LeaveTypesMaster.findByPk(templateId);
      case 'performance_review':
        return await db.PerformanceReviewsMaster.findByPk(templateId);
      case 'benefit_package':
        return await db.BenefitPackagesMaster.findByPk(templateId);
      case 'training_program':
        return await db.TrainingProgramsMaster.findByPk(templateId);
      case 'compliance_checklist':
        return await db.ComplianceChecklistsMaster.findByPk(templateId);
      case 'onboarding_workflow':
        return await db.OnboardingWorkflowsMaster.findByPk(templateId);
      case 'policy_document':
        return await db.PolicyDocumentsMaster.findByPk(templateId);
      case 'compensation_band':
        return await db.CompensationBandsMaster.findByPk(templateId);
      case 'career_path':
        return await db.CareerPathsMaster.findByPk(templateId);
      case 'reporting_structure':
        return await db.ReportingStructuresMaster.findByPk(templateId);
      default:
        throw new ValidationError(`Unsupported template type: ${templateType}`);
    }
  }

  /**
   * Get instance by ID and type
   */
  async getInstance(instanceId, templateType) {
    switch (templateType) {
      case 'skill':
        return await db.OrganizationSkill.findByPk(instanceId);
      case 'job_role':
        return await db.OrganizationJobRole.findByPk(instanceId);
      case 'leave_type':
        return await db.OrganizationLeaveType.findByPk(instanceId);
      case 'performance_review':
        return await db.OrganizationPerformanceReview.findByPk(instanceId);
      case 'benefit_package':
        return await db.OrganizationBenefitPackage.findByPk(instanceId);
      case 'training_program':
        return await db.OrganizationTrainingProgram.findByPk(instanceId);
      case 'compliance_checklist':
        return await db.OrganizationComplianceChecklist.findByPk(instanceId);
      case 'onboarding_workflow':
        return await db.OrganizationOnboardingWorkflow.findByPk(instanceId);
      case 'policy_document':
        return await db.OrganizationPolicyDocument.findByPk(instanceId);
      case 'compensation_band':
        return await db.OrganizationCompensationBand.findByPk(instanceId);
      case 'career_path':
        return await db.OrganizationCareerPath.findByPk(instanceId);
      case 'reporting_structure':
        return await db.OrganizationReportingStructure.findByPk(instanceId);
      default:
        throw new ValidationError(`Unsupported template type: ${templateType}`);
    }
  }

  /**
   * Get instance primary key by template type
   */
  getInstanceId(instance, templateType) {
    switch (templateType) {
      case 'skill':
        return instance.org_skill_id;
      case 'job_role':
        return instance.org_role_id;
      case 'leave_type':
        return instance.org_leave_type_id;
      case 'performance_review':
        return instance.org_performance_review_id;
      case 'benefit_package':
        return instance.org_benefit_package_id;
      case 'training_program':
        return instance.org_training_program_id;
      case 'compliance_checklist':
        return instance.org_compliance_checklist_id;
      case 'onboarding_workflow':
        return instance.org_onboarding_workflow_id;
      case 'policy_document':
        return instance.org_policy_document_id;
      case 'compensation_band':
        return instance.org_compensation_band_id;
      case 'career_path':
        return instance.org_career_path_id;
      case 'reporting_structure':
        return instance.org_reporting_structure_id;
      default:
        throw new ValidationError(`Unsupported template type: ${templateType}`);
    }
  }

  /**
   * Get template ID from instance by template type
   */
  getTemplateIdFromInstance(instance, templateType) {
    switch (templateType) {
      case 'skill':
        return instance.template_skill_id;
      case 'job_role':
        return instance.template_role_id;
      case 'leave_type':
        return instance.template_leave_type_id;
      case 'performance_review':
        return instance.template_performance_review_id;
      case 'benefit_package':
        return instance.template_benefit_package_id;
      case 'training_program':
        return instance.template_training_program_id;
      case 'compliance_checklist':
        return instance.template_compliance_checklist_id;
      case 'onboarding_workflow':
        return instance.template_onboarding_workflow_id;
      case 'policy_document':
        return instance.template_policy_document_id;
      case 'compensation_band':
        return instance.template_compensation_band_id;
      case 'career_path':
        return instance.template_career_path_id;
      case 'reporting_structure':
        return instance.template_reporting_structure_id;
      default:
        throw new ValidationError(`Unsupported template type: ${templateType}`);
    }
  }

  /**
   * Update instance with new data
   */
  async updateInstance(instanceId, updateData, templateType, transaction) {
    switch (templateType) {
      case 'skill':
        await db.OrganizationSkill.update(updateData, {
          where: { org_skill_id: instanceId },
          transaction
        });
        return await db.OrganizationSkill.findByPk(instanceId, { transaction });
      case 'job_role':
        await db.OrganizationJobRole.update(updateData, {
          where: { org_role_id: instanceId },
          transaction
        });
        return await db.OrganizationJobRole.findByPk(instanceId, { transaction });
      case 'leave_type':
        await db.OrganizationLeaveType.update(updateData, {
          where: { org_leave_type_id: instanceId },
          transaction
        });
        return await db.OrganizationLeaveType.findByPk(instanceId, { transaction });
      case 'performance_review':
        await db.OrganizationPerformanceReview.update(updateData, {
          where: { org_performance_review_id: instanceId },
          transaction
        });
        return await db.OrganizationPerformanceReview.findByPk(instanceId, { transaction });
      case 'benefit_package':
        await db.OrganizationBenefitPackage.update(updateData, {
          where: { org_benefit_package_id: instanceId },
          transaction
        });
        return await db.OrganizationBenefitPackage.findByPk(instanceId, { transaction });
      case 'training_program':
        await db.OrganizationTrainingProgram.update(updateData, {
          where: { org_training_program_id: instanceId },
          transaction
        });
        return await db.OrganizationTrainingProgram.findByPk(instanceId, { transaction });
      case 'compliance_checklist':
        await db.OrganizationComplianceChecklist.update(updateData, {
          where: { org_compliance_checklist_id: instanceId },
          transaction
        });
        return await db.OrganizationComplianceChecklist.findByPk(instanceId, { transaction });
      case 'onboarding_workflow':
        await db.OrganizationOnboardingWorkflow.update(updateData, {
          where: { org_onboarding_workflow_id: instanceId },
          transaction
        });
        return await db.OrganizationOnboardingWorkflow.findByPk(instanceId, { transaction });
      case 'policy_document':
        await db.OrganizationPolicyDocument.update(updateData, {
          where: { org_policy_document_id: instanceId },
          transaction
        });
        return await db.OrganizationPolicyDocument.findByPk(instanceId, { transaction });
      case 'compensation_band':
        await db.OrganizationCompensationBand.update(updateData, {
          where: { org_compensation_band_id: instanceId },
          transaction
        });
        return await db.OrganizationCompensationBand.findByPk(instanceId, { transaction });
      case 'career_path':
        await db.OrganizationCareerPath.update(updateData, {
          where: { org_career_path_id: instanceId },
          transaction
        });
        return await db.OrganizationCareerPath.findByPk(instanceId, { transaction });
      case 'reporting_structure':
        await db.OrganizationReportingStructure.update(updateData, {
          where: { org_reporting_structure_id: instanceId },
          transaction
        });
        return await db.OrganizationReportingStructure.findByPk(instanceId, { transaction });
      default:
        throw new ValidationError(`Unsupported template type: ${templateType}`);
    }
  }

  /**
   * Check if template is already imported for organization
   */
  async findExistingInstance(organizationId, templateId, templateType) {
    switch (templateType) {
      case 'skill':
        return await db.OrganizationSkill.findOne({
          where: {
            organization_id: organizationId,
            template_skill_id: templateId
          }
        });
      case 'job_role':
        return await db.OrganizationJobRole.findOne({
          where: {
            organization_id: organizationId,
            template_role_id: templateId
          }
        });
      case 'leave_type':
        return await db.OrganizationLeaveType.findOne({
          where: {
            organization_id: organizationId,
            template_leave_type_id: templateId
          }
        });
      case 'performance_review':
        return await db.OrganizationPerformanceReview.findOne({
          where: {
            organization_id: organizationId,
            template_performance_review_id: templateId
          }
        });
      case 'benefit_package':
        return await db.OrganizationBenefitPackage.findOne({
          where: {
            organization_id: organizationId,
            template_benefit_package_id: templateId
          }
        });
      case 'training_program':
        return await db.OrganizationTrainingProgram.findOne({
          where: {
            organization_id: organizationId,
            template_training_program_id: templateId
          }
        });
      case 'compliance_checklist':
        return await db.OrganizationComplianceChecklist.findOne({
          where: {
            organization_id: organizationId,
            template_compliance_checklist_id: templateId
          }
        });
      case 'onboarding_workflow':
        return await db.OrganizationOnboardingWorkflow.findOne({
          where: {
            organization_id: organizationId,
            template_onboarding_workflow_id: templateId
          }
        });
      case 'policy_document':
        return await db.OrganizationPolicyDocument.findOne({
          where: {
            organization_id: organizationId,
            template_policy_document_id: templateId
          }
        });
      case 'compensation_band':
        return await db.OrganizationCompensationBand.findOne({
          where: {
            organization_id: organizationId,
            template_compensation_band_id: templateId
          }
        });
      case 'career_path':
        return await db.OrganizationCareerPath.findOne({
          where: {
            organization_id: organizationId,
            template_career_path_id: templateId
          }
        });
      case 'reporting_structure':
        return await db.OrganizationReportingStructure.findOne({
          where: {
            organization_id: organizationId,
            template_reporting_structure_id: templateId
          }
        });
      default:
        return null;
    }
  }

  /**
   * Calculate customization level (0-100%)
   */
  calculateCustomizationLevel(template, customizations) {
    if (!template) return 0;

    const templateFields = Object.keys(template.toJSON ? template.toJSON() : template);
    const customizedFields = Object.keys(customizations);

    if (customizedFields.length === 0) return 0;

    const customizationRatio = customizedFields.length / templateFields.length;
    return Math.min(Math.round(customizationRatio * 100), 100);
  }

  /**
   * Merge customizations with existing instance data
   */
  mergeCustomizations(instance, customizations, templateType) {
    const mergedData = {};

    switch (templateType) {
      case 'skill':
        if (customizations.name) mergedData.custom_name = customizations.name;
        if (customizations.description) mergedData.custom_description = customizations.description;
        if (customizations.category) mergedData.custom_category = customizations.category;
        if (customizations.proficiencyLevels) mergedData.custom_proficiency_levels = customizations.proficiencyLevels;
        if (customizations.departmentSpecific !== undefined) mergedData.department_specific = customizations.departmentSpecific;
        if (customizations.certificationRequired !== undefined) mergedData.certification_required = customizations.certificationRequired;
        break;
      case 'job_role':
        if (customizations.title) mergedData.custom_title = customizations.title;
        if (customizations.description) mergedData.custom_description = customizations.description;
        if (customizations.responsibilities) mergedData.custom_responsibilities = customizations.responsibilities;
        if (customizations.requirements) mergedData.custom_requirements = customizations.requirements;
        if (customizations.salaryRange) mergedData.salary_range = customizations.salaryRange;
        if (customizations.skills) mergedData.custom_skills = customizations.skills;
        break;
    }

    return mergedData;
  }

  /**
   * Select specific fields from template for sync
   */
  selectFieldsForSync(template, fields, templateType) {
    const syncData = {};

    if (fields.length === 0) {
      // If no specific fields, sync all non-customized fields
      return this.getDefaultSyncFields(template, templateType);
    }

    // Sync only specified fields
    switch (templateType) {
      case 'skill':
        if (fields.includes('name')) syncData.custom_name = template.skill_name;
        if (fields.includes('description')) syncData.custom_description = template.skill_description;
        if (fields.includes('category')) syncData.custom_category = template.skill_type;
        if (fields.includes('proficiencyLevels')) syncData.custom_proficiency_levels = template.proficiency_levels;
        break;
      case 'job_role':
        if (fields.includes('title')) syncData.custom_title = template.role_title;
        if (fields.includes('description')) syncData.custom_description = template.description;
        if (fields.includes('responsibilities')) syncData.custom_responsibilities = template.responsibilities;
        if (fields.includes('requirements')) syncData.custom_requirements = template.requirements;
        break;
    }

    return syncData;
  }

  /**
   * Detect conflicts between instance customizations and template updates
   */
  async detectSyncConflicts(instance, template, syncFields) {
    const conflicts = [];

    // Implementation would compare instance customizations with template changes
    // and identify fields where both have been modified since last sync

    return conflicts; // Simplified for now
  }

  /**
   * Create inheritance tracking record
   */
  async createInheritanceRecord(data, transaction) {
    return await db.TemplateInheritance.create({
      inheritance_id: uuidv4(),
      ...data,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });
  }

  /**
   * Update inheritance tracking record
   */
  async updateInheritanceRecord(instanceId, updateData, transaction) {
    return await db.TemplateInheritance.update({
      ...updateData,
      updated_at: new Date()
    }, {
      where: { instance_id: instanceId },
      transaction
    });
  }

  /**
   * Get organization's customized instances with inheritance info
   */
  async getOrganizationInstances(organizationId, templateType, options = {}) {
    const { includeTemplate = false, includeInheritance = true } = options;

    let instances;
    switch (templateType) {
      case 'skill':
        instances = await db.OrganizationSkill.findAll({
          where: { organization_id: organizationId },
          include: includeTemplate ? [{
            model: db.SkillsMaster,
            as: 'template'
          }] : []
        });
        break;
      case 'job_role':
        instances = await db.OrganizationJobRole.findAll({
          where: { organization_id: organizationId },
          include: includeTemplate ? [{
            model: db.JobRole,
            as: 'template'
          }] : []
        });
        break;
      default:
        throw new ValidationError(`Unsupported template type: ${templateType}`);
    }

    if (includeInheritance) {
      // Use proper Sequelize association instead of manual lookup
      const inheritanceIncludes = [{
        model: db.TemplateInheritance,
        as: 'inheritance'
      }];

      // Re-fetch with inheritance included using associations
      switch (templateType) {
        case 'skill':
          return await db.OrganizationSkill.findAll({
            where: { organization_id: organizationId },
            include: [
              ...(includeTemplate ? [{ model: db.SkillsMaster, as: 'template' }] : []),
              ...inheritanceIncludes
            ],
            order: [['custom_name', 'ASC']]
          });
        case 'job_role':
          return await db.OrganizationJobRole.findAll({
            where: { organization_id: organizationId },
            include: [
              ...(includeTemplate ? [{ model: db.JobRole, as: 'template' }] : []),
              ...inheritanceIncludes
            ],
            order: [['custom_title', 'ASC']]
          });
      }
    }

    return instances;
  }

  /**
   * Bulk import templates for organization onboarding
   */
  async bulkImportTemplates(organizationId, templateIds, options = {}) {
    const results = [];
    const errors = [];

    for (const templateId of templateIds) {
      try {
        const instance = await this.importTemplate(organizationId, templateId, options);
        results.push(instance);
      } catch (error) {
        errors.push({ templateId, error: error.message });
      }
    }

    return {
      successful: results,
      failed: errors,
      summary: {
        total: templateIds.length,
        successful: results.length,
        failed: errors.length
      }
    };
  }

  /**
   * List available templates by type with pagination and filtering
   */
  async listTemplates(templateType, options = {}) {
    const { offset = 0, limit = 20, search, category, active = true } = options;

    let whereClause = {};
    if (active) {
      whereClause.is_active = true;
    }

    if (search) {
      // Add search logic based on template type
      const searchField = this.getTemplateSearchField(templateType);
      whereClause[searchField] = {
        [db.Sequelize.Op.iLike]: `%${search}%`
      };
    }

    if (category) {
      const categoryField = this.getTemplateCategoryField(templateType);
      if (categoryField) {
        whereClause[categoryField] = category;
      }
    }

    const templateModel = this.getTemplateModel(templateType);
    return await templateModel.findAndCountAll({
      where: whereClause,
      offset,
      limit,
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * Get template model by type
   */
  getTemplateModel(templateType) {
    switch (templateType) {
      case 'skill':
        return db.SkillsMaster;
      case 'job_role':
        return db.JobRole;
      case 'leave_type':
        return db.LeaveTypesMaster;
      case 'performance_review':
        return db.PerformanceReviewsMaster;
      case 'benefit_package':
        return db.BenefitPackagesMaster;
      case 'training_program':
        return db.TrainingProgramsMaster;
      case 'compliance_checklist':
        return db.ComplianceChecklistsMaster;
      case 'onboarding_workflow':
        return db.OnboardingWorkflowsMaster;
      case 'policy_document':
        return db.PolicyDocumentsMaster;
      case 'compensation_band':
        return db.CompensationBandsMaster;
      case 'career_path':
        return db.CareerPathsMaster;
      case 'reporting_structure':
        return db.ReportingStructuresMaster;
      default:
        throw new ValidationError(`Unsupported template type: ${templateType}`);
    }
  }

  /**
   * Get template search field by type
   */
  getTemplateSearchField(templateType) {
    switch (templateType) {
      case 'skill':
        return 'skill_name';
      case 'job_role':
        return 'role_title';
      case 'leave_type':
        return 'type_name';
      case 'performance_review':
        return 'review_name';
      case 'benefit_package':
        return 'package_name';
      case 'training_program':
        return 'program_name';
      case 'compliance_checklist':
        return 'checklist_name';
      case 'onboarding_workflow':
        return 'workflow_name';
      case 'policy_document':
        return 'document_title';
      case 'compensation_band':
        return 'band_name';
      case 'career_path':
        return 'path_name';
      case 'reporting_structure':
        return 'structure_name';
      default:
        return 'name';
    }
  }

  /**
   * Get template category field by type
   */
  getTemplateCategoryField(templateType) {
    switch (templateType) {
      case 'skill':
        return 'skill_type';
      case 'policy_document':
        return 'policy_category';
      case 'training_program':
        return 'program_category';
      default:
        return null;
    }
  }

  /**
   * Get customization statistics for organization
   */
  async getCustomizationStats(organizationId, templateType) {
    const instanceModel = this.getInstanceModel(templateType);
    const instances = await instanceModel.findAll({
      where: {
        organization_id: organizationId,
        is_active: true
      },
      attributes: ['inheritance_type', 'customization_level']
    });

    const stats = {
      total: instances.length,
      full: 0,
      partial: 0,
      override: 0,
      avg_customization_level: 0
    };

    let totalCustomization = 0;

    instances.forEach(instance => {
      stats[instance.inheritance_type]++;
      totalCustomization += instance.customization_level || 0;
    });

    stats.avg_customization_level = instances.length > 0
      ? Math.round(totalCustomization / instances.length)
      : 0;

    return stats;
  }

  /**
   * Get instance model by type
   */
  getInstanceModel(templateType) {
    switch (templateType) {
      case 'skill':
        return db.OrganizationSkill;
      case 'job_role':
        return db.OrganizationJobRole;
      case 'leave_type':
        return db.OrganizationLeaveType;
      case 'performance_review':
        return db.OrganizationPerformanceReview;
      case 'benefit_package':
        return db.OrganizationBenefitPackage;
      case 'training_program':
        return db.OrganizationTrainingProgram;
      case 'compliance_checklist':
        return db.OrganizationComplianceChecklist;
      case 'onboarding_workflow':
        return db.OrganizationOnboardingWorkflow;
      case 'policy_document':
        return db.OrganizationPolicyDocument;
      case 'compensation_band':
        return db.OrganizationCompensationBand;
      case 'career_path':
        return db.OrganizationCareerPath;
      case 'reporting_structure':
        return db.OrganizationReportingStructure;
      default:
        throw new ValidationError(`Unsupported template type: ${templateType}`);
    }
  }

  /**
   * Search templates across multiple types
   */
  async searchTemplates(options = {}) {
    const { templateTypes = [], searchTerm, categories = [], tags = [], offset = 0, limit = 20 } = options;

    const allTemplates = [];
    let totalCount = 0;

    // If no specific types requested, search all
    const typesToSearch = templateTypes.length > 0 ? templateTypes : [
      'skill', 'job_role', 'leave_type', 'performance_review', 'benefit_package',
      'training_program', 'compliance_checklist', 'onboarding_workflow',
      'policy_document', 'compensation_band', 'career_path', 'reporting_structure'
    ];

    for (const templateType of typesToSearch) {
      try {
        const templates = await this.listTemplates(templateType, {
          search: searchTerm,
          offset: 0,
          limit: 100 // Get more for aggregation
        });

        templates.rows.forEach(template => {
          allTemplates.push({
            ...template.toJSON(),
            template_type: templateType
          });
        });

        totalCount += templates.count;
      } catch (error) {
        // Skip if template type doesn't exist
        continue;
      }
    }

    // Sort and paginate results
    allTemplates.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const paginatedTemplates = allTemplates.slice(offset, offset + limit);

    return {
      templates: paginatedTemplates,
      total: totalCount
    };
  }

  /**
   * Compare templates or instances
   */
  async compareTemplates(options = {}) {
    const { sourceId, targetId, sourceType, targetType = 'template', comparisonFields = [] } = options;

    const source = targetType === 'template'
      ? await this.getTemplate(sourceId, sourceType)
      : await this.getInstance(sourceId, sourceType);

    const target = targetType === 'template'
      ? await this.getTemplate(targetId, sourceType)
      : await this.getInstance(targetId, sourceType);

    if (!source || !target) {
      throw new NotFoundError('One or both items for comparison not found');
    }

    const differences = {};
    const fieldsToCompare = comparisonFields.length > 0
      ? comparisonFields
      : Object.keys(source.toJSON ? source.toJSON() : source);

    fieldsToCompare.forEach(field => {
      const sourceValue = source[field];
      const targetValue = target[field];

      if (JSON.stringify(sourceValue) !== JSON.stringify(targetValue)) {
        differences[field] = {
          source: sourceValue,
          target: targetValue
        };
      }
    });

    return {
      source: { id: sourceId, type: sourceType },
      target: { id: targetId, type: sourceType },
      differences,
      identical: Object.keys(differences).length === 0
    };
  }

  /**
   * Preview template import without actually importing
   */
  async previewTemplateImport(organizationId, templateId, templateType, customizations = {}) {
    // Get template
    const template = await this.getTemplate(templateId, templateType);
    if (!template) {
      throw new NotFoundError(`Template ${templateId} not found`);
    }

    // Check if already imported
    const existingInstance = await this.findExistingInstance(
      organizationId,
      templateId,
      templateType
    );

    const preview = {
      template: template.toJSON ? template.toJSON() : template,
      template_type: templateType,
      organization_id: organizationId,
      already_imported: !!existingInstance,
      customizations_provided: Object.keys(customizations),
      inheritance_type: Object.keys(customizations).length > 0 ? 'partial' : 'full',
      customization_level: this.calculateCustomizationLevel(template, customizations),
      estimated_instance: this.buildPreviewInstance(template, customizations, templateType)
    };

    if (existingInstance) {
      preview.existing_instance = {
        id: this.getInstanceId(existingInstance, templateType),
        inheritance_type: existingInstance.inheritance_type,
        customization_level: existingInstance.customization_level,
        last_sync: existingInstance.last_template_sync
      };
    }

    return preview;
  }

  /**
   * Build preview instance for template import
   */
  buildPreviewInstance(template, customizations, templateType) {
    // This is a simplified preview - actual import may differ
    const preview = {};

    switch (templateType) {
      case 'skill':
        preview.custom_name = customizations.name || template.skill_name;
        preview.custom_description = customizations.description || template.skill_description;
        preview.custom_category = customizations.category || template.skill_type;
        break;
      case 'job_role':
        preview.custom_title = customizations.title || template.role_title;
        preview.custom_description = customizations.description || template.description;
        break;
      case 'leave_type':
        preview.custom_name = customizations.name || template.type_name;
        preview.custom_description = customizations.description || template.description;
        break;
      // Add other template types as needed
    }

    return preview;
  }

  /**
   * Convert data to CSV format
   */
  async convertToCSV(data) {
    const instances = data.instances;
    if (!instances || instances.length === 0) {
      return 'No data to export';
    }

    // Get headers from first instance
    const headers = Object.keys(instances[0].toJSON ? instances[0].toJSON() : instances[0]);
    const csvRows = [headers.join(',')];

    // Add data rows
    instances.forEach(instance => {
      const instanceData = instance.toJSON ? instance.toJSON() : instance;
      const values = headers.map(header => {
        const value = instanceData[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
        return value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }
}

module.exports = new TemplateInheritanceService();