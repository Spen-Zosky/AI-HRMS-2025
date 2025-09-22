'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Priority 1: Leave Types Templates
    await queryInterface.createTable('leave_types_master', {
      leave_type_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      type_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      type_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      default_days_per_year: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      carry_over_rules: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      accrual_rules: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      approval_workflow: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      documentation_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      applicable_to: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      region_specific: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable('organization_leave_types', {
      org_leave_type_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      template_leave_type_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'leave_types_master',
          key: 'leave_type_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      custom_name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      custom_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      custom_days_per_year: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      custom_carry_over_rules: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_accrual_rules: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_approval_workflow: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_documentation_required: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      department_specific: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      inheritance_type: {
        type: Sequelize.ENUM('full', 'partial', 'override'),
        defaultValue: 'full'
      },
      customization_level: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      auto_sync_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_template_sync: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Priority 1: Performance Review Templates
    await queryInterface.createTable('review_templates_master', {
      template_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      template_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      template_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      template_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      evaluation_criteria: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      rating_scale: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      question_sets: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      review_cycle_config: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      goal_setting_framework: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      competency_framework: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      feedback_structure: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable('organization_review_templates', {
      org_template_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      template_template_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'review_templates_master',
          key: 'template_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      custom_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      custom_evaluation_criteria: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_rating_scale: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_question_sets: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_review_cycle: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      inheritance_type: {
        type: Sequelize.ENUM('full', 'partial', 'override'),
        defaultValue: 'full'
      },
      customization_level: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      auto_sync_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_template_sync: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Priority 1: Benefit Package Templates
    await queryInterface.createTable('benefit_packages_master', {
      package_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      package_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      package_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      package_category: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      benefit_details: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      eligibility_criteria: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      cost_structure: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      vendor_information: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      compliance_requirements: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      enrollment_periods: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable('organization_benefit_packages', {
      org_package_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      template_package_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'benefit_packages_master',
          key: 'package_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      custom_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      custom_benefit_details: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_eligibility_criteria: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_cost_structure: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      local_vendor_info: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      enrollment_status: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      inheritance_type: {
        type: Sequelize.ENUM('full', 'partial', 'override'),
        defaultValue: 'full'
      },
      customization_level: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      auto_sync_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_template_sync: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Priority 2: Training Program Templates
    await queryInterface.createTable('training_programs_master', {
      program_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      program_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      program_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      program_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      curriculum: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      duration: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      prerequisites: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      learning_objectives: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      delivery_methods: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      assessment_criteria: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      certification_info: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      target_audience: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable('organization_training_programs', {
      org_program_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      template_program_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'training_programs_master',
          key: 'program_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      custom_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      custom_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      custom_curriculum: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_duration: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_delivery_methods: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      enrollment_tracking: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      completion_tracking: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      inheritance_type: {
        type: Sequelize.ENUM('full', 'partial', 'override'),
        defaultValue: 'full'
      },
      customization_level: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      auto_sync_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_template_sync: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Priority 2: Compliance Checklist Templates
    await queryInterface.createTable('compliance_checklists_master', {
      checklist_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      checklist_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      checklist_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      compliance_category: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      jurisdiction: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      checklist_items: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      regulatory_references: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      frequency: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      penalties: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      evidence_requirements: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      responsible_roles: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable('organization_compliance_checklists', {
      org_checklist_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      template_checklist_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'compliance_checklists_master',
          key: 'checklist_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      custom_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      custom_checklist_items: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_frequency: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      custom_responsible_roles: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      completion_status: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      last_review_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      next_review_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      inheritance_type: {
        type: Sequelize.ENUM('full', 'partial', 'override'),
        defaultValue: 'full'
      },
      customization_level: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      auto_sync_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_template_sync: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Priority 2: Onboarding Workflow Templates
    await queryInterface.createTable('onboarding_workflows_master', {
      workflow_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      workflow_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      workflow_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      employee_type: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      workflow_stages: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      task_assignments: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      document_checklist: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      training_requirements: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      equipment_checklist: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      timeline_template: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      notification_templates: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable('organization_onboarding_workflows', {
      org_workflow_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      template_workflow_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'onboarding_workflows_master',
          key: 'workflow_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      custom_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      custom_workflow_stages: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_task_assignments: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_document_checklist: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_timeline: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      department_variations: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      inheritance_type: {
        type: Sequelize.ENUM('full', 'partial', 'override'),
        defaultValue: 'full'
      },
      customization_level: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      auto_sync_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_template_sync: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Priority 2: Policy Document Templates
    await queryInterface.createTable('policy_documents_master', {
      policy_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      policy_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      policy_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      policy_category: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      policy_content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      policy_sections: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      version: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: '1.0'
      },
      effective_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      review_cycle: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      compliance_references: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      acknowledgment_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable('organization_policy_documents', {
      org_policy_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      template_policy_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'policy_documents_master',
          key: 'policy_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      custom_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      custom_content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      custom_sections: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_effective_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      acknowledgments: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      local_amendments: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      inheritance_type: {
        type: Sequelize.ENUM('full', 'partial', 'override'),
        defaultValue: 'full'
      },
      customization_level: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      auto_sync_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_template_sync: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Priority 3: Compensation Band Templates
    await queryInterface.createTable('compensation_bands_master', {
      band_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      band_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      band_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      band_level: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      min_salary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      mid_salary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      max_salary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD'
      },
      geographic_adjustments: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      progression_criteria: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      market_benchmarks: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      bonus_structure: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      equity_guidelines: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable('organization_compensation_bands', {
      org_band_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      template_band_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'compensation_bands_master',
          key: 'band_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      custom_name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      custom_min_salary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      custom_mid_salary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      custom_max_salary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      custom_currency: {
        type: Sequelize.STRING(3),
        allowNull: true
      },
      local_adjustments: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_bonus_structure: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      inheritance_type: {
        type: Sequelize.ENUM('full', 'partial', 'override'),
        defaultValue: 'full'
      },
      customization_level: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      auto_sync_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_template_sync: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Priority 3: Career Path Templates
    await queryInterface.createTable('career_paths_master', {
      path_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      path_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      path_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      career_family: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      path_stages: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      progression_requirements: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      skills_matrix: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      timeline_expectations: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      development_activities: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      success_profiles: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable('organization_career_paths', {
      org_path_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      template_path_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'career_paths_master',
          key: 'path_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      custom_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      custom_path_stages: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_progression_requirements: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_skills_matrix: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      department_specific_paths: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      inheritance_type: {
        type: Sequelize.ENUM('full', 'partial', 'override'),
        defaultValue: 'full'
      },
      customization_level: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      auto_sync_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_template_sync: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Priority 3: Reporting Structure Templates
    await queryInterface.createTable('reporting_structures_master', {
      structure_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      structure_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      structure_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      organization_type: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      hierarchy_levels: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      reporting_relationships: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      span_of_control: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      matrix_relationships: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      delegation_rules: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      escalation_paths: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable('organization_reporting_structures', {
      org_structure_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      template_structure_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'reporting_structures_master',
          key: 'structure_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      custom_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      custom_hierarchy_levels: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_reporting_relationships: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      department_overrides: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      temporary_delegations: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      inheritance_type: {
        type: Sequelize.ENUM('full', 'partial', 'override'),
        defaultValue: 'full'
      },
      customization_level: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      auto_sync_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_template_sync: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Update template_inheritance table enum to include new types
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_template_inheritance_template_type"
      ADD VALUE IF NOT EXISTS 'leave_type';
      ALTER TYPE "enum_template_inheritance_template_type"
      ADD VALUE IF NOT EXISTS 'review_template';
      ALTER TYPE "enum_template_inheritance_template_type"
      ADD VALUE IF NOT EXISTS 'benefit_package';
      ALTER TYPE "enum_template_inheritance_template_type"
      ADD VALUE IF NOT EXISTS 'training_program';
      ALTER TYPE "enum_template_inheritance_template_type"
      ADD VALUE IF NOT EXISTS 'compliance_checklist';
      ALTER TYPE "enum_template_inheritance_template_type"
      ADD VALUE IF NOT EXISTS 'onboarding_workflow';
      ALTER TYPE "enum_template_inheritance_template_type"
      ADD VALUE IF NOT EXISTS 'policy_document';
      ALTER TYPE "enum_template_inheritance_template_type"
      ADD VALUE IF NOT EXISTS 'compensation_band';
      ALTER TYPE "enum_template_inheritance_template_type"
      ADD VALUE IF NOT EXISTS 'career_path';
      ALTER TYPE "enum_template_inheritance_template_type"
      ADD VALUE IF NOT EXISTS 'reporting_structure';
    `);

    // Add indexes for all new tables
    const tables = [
      'leave_types_master',
      'organization_leave_types',
      'review_templates_master',
      'organization_review_templates',
      'benefit_packages_master',
      'organization_benefit_packages',
      'training_programs_master',
      'organization_training_programs',
      'compliance_checklists_master',
      'organization_compliance_checklists',
      'onboarding_workflows_master',
      'organization_onboarding_workflows',
      'policy_documents_master',
      'organization_policy_documents',
      'compensation_bands_master',
      'organization_compensation_bands',
      'career_paths_master',
      'organization_career_paths',
      'reporting_structures_master',
      'organization_reporting_structures'
    ];

    for (const table of tables) {
      if (table.includes('organization_')) {
        await queryInterface.addIndex(table, ['organization_id']);
        await queryInterface.addIndex(table, ['inheritance_type']);
        await queryInterface.addIndex(table, ['is_active']);
        await queryInterface.addIndex(table, ['customization_level']);
      } else {
        await queryInterface.addIndex(table, ['tenant_id']);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Drop all tables in reverse order
    await queryInterface.dropTable('organization_reporting_structures');
    await queryInterface.dropTable('reporting_structures_master');
    await queryInterface.dropTable('organization_career_paths');
    await queryInterface.dropTable('career_paths_master');
    await queryInterface.dropTable('organization_compensation_bands');
    await queryInterface.dropTable('compensation_bands_master');
    await queryInterface.dropTable('organization_policy_documents');
    await queryInterface.dropTable('policy_documents_master');
    await queryInterface.dropTable('organization_onboarding_workflows');
    await queryInterface.dropTable('onboarding_workflows_master');
    await queryInterface.dropTable('organization_compliance_checklists');
    await queryInterface.dropTable('compliance_checklists_master');
    await queryInterface.dropTable('organization_training_programs');
    await queryInterface.dropTable('training_programs_master');
    await queryInterface.dropTable('organization_benefit_packages');
    await queryInterface.dropTable('benefit_packages_master');
    await queryInterface.dropTable('organization_review_templates');
    await queryInterface.dropTable('review_templates_master');
    await queryInterface.dropTable('organization_leave_types');
    await queryInterface.dropTable('leave_types_master');
  }
};