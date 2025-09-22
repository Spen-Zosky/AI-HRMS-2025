'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const complianceChecklists = [
      {
        compliance_checklist_template_id: uuidv4(),
        checklist_name: 'GDPR Compliance Audit',
        category: 'data_protection',
        regulatory_framework: 'GDPR',
        compliance_type: 'annual',
        priority_level: 'high',
        estimated_completion_hours: 16,
        checklist_items: [
          {
            item_id: 'gdpr_001',
            title: 'Data Processing Inventory',
            description: 'Maintain updated inventory of all personal data processing activities',
            category: 'documentation',
            priority: 'high',
            evidence_required: ['processing_register', 'data_flow_diagrams'],
            responsible_role: 'dpo',
            frequency: 'quarterly'
          },
          {
            item_id: 'gdpr_002',
            title: 'Privacy Impact Assessments',
            description: 'Conduct PIAs for high-risk processing activities',
            category: 'assessment',
            priority: 'high',
            evidence_required: ['pia_reports', 'risk_assessments'],
            responsible_role: 'dpo',
            frequency: 'as_needed'
          },
          {
            item_id: 'gdpr_003',
            title: 'Data Subject Rights Procedures',
            description: 'Implement procedures for handling data subject requests',
            category: 'process',
            priority: 'medium',
            evidence_required: ['procedure_documents', 'response_logs'],
            responsible_role: 'hr_manager',
            frequency: 'annually'
          },
          {
            item_id: 'gdpr_004',
            title: 'Data Breach Response Plan',
            description: 'Maintain and test data breach incident response procedures',
            category: 'security',
            priority: 'high',
            evidence_required: ['response_plan', 'test_results'],
            responsible_role: 'it_security',
            frequency: 'semi_annually'
          },
          {
            item_id: 'gdpr_005',
            title: 'Staff Training Records',
            description: 'Ensure all staff receive GDPR awareness training',
            category: 'training',
            priority: 'medium',
            evidence_required: ['training_records', 'certificates'],
            responsible_role: 'hr_manager',
            frequency: 'annually'
          }
        ],
        documentation_requirements: [
          'Data processing register',
          'Privacy policies',
          'Consent records',
          'Training records',
          'Breach incident logs'
        ],
        responsible_departments: ['legal', 'hr', 'it_security', 'data_protection'],
        review_frequency: 'annual',
        next_review_due_months: 12,
        audit_trail_required: true,
        external_audit_required: false,
        certification_impact: true,
        non_compliance_penalties: {
          regulatory_fines: 'up_to_4_percent_turnover',
          operational_impact: 'high',
          reputational_risk: 'high'
        },
        completion_tracking: {
          auto_reminders: true,
          escalation_rules: true,
          progress_reporting: 'monthly'
        },
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        compliance_checklist_template_id: uuidv4(),
        checklist_name: 'SOX Financial Controls',
        category: 'financial',
        regulatory_framework: 'SOX',
        compliance_type: 'quarterly',
        priority_level: 'critical',
        estimated_completion_hours: 32,
        checklist_items: [
          {
            item_id: 'sox_001',
            title: 'Financial Reporting Controls',
            description: 'Test and document financial reporting internal controls',
            category: 'controls_testing',
            priority: 'critical',
            evidence_required: ['control_documentation', 'test_results'],
            responsible_role: 'cfo',
            frequency: 'quarterly'
          },
          {
            item_id: 'sox_002',
            title: 'Management Certification',
            description: 'Obtain management certification of financial statements',
            category: 'certification',
            priority: 'critical',
            evidence_required: ['signed_certifications', 'supporting_evidence'],
            responsible_role: 'ceo',
            frequency: 'quarterly'
          },
          {
            item_id: 'sox_003',
            title: 'Deficiency Remediation',
            description: 'Address and remediate identified control deficiencies',
            category: 'remediation',
            priority: 'high',
            evidence_required: ['remediation_plans', 'implementation_evidence'],
            responsible_role: 'internal_audit',
            frequency: 'ongoing'
          }
        ],
        documentation_requirements: [
          'Control matrices',
          'Testing procedures',
          'Deficiency reports',
          'Management certifications',
          'Audit workpapers'
        ],
        responsible_departments: ['finance', 'internal_audit', 'executive'],
        review_frequency: 'quarterly',
        next_review_due_months: 3,
        audit_trail_required: true,
        external_audit_required: true,
        certification_impact: true,
        non_compliance_penalties: {
          regulatory_fines: 'criminal_liability',
          operational_impact: 'critical',
          reputational_risk: 'critical'
        },
        completion_tracking: {
          auto_reminders: true,
          escalation_rules: true,
          progress_reporting: 'weekly'
        },
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        compliance_checklist_template_id: uuidv4(),
        checklist_name: 'Health & Safety Inspection',
        category: 'health_safety',
        regulatory_framework: 'OSHA',
        compliance_type: 'monthly',
        priority_level: 'high',
        estimated_completion_hours: 4,
        checklist_items: [
          {
            item_id: 'hs_001',
            title: 'Fire Safety Equipment',
            description: 'Inspect fire extinguishers, alarms, and emergency exits',
            category: 'safety_equipment',
            priority: 'high',
            evidence_required: ['inspection_reports', 'photos'],
            responsible_role: 'safety_officer',
            frequency: 'monthly'
          },
          {
            item_id: 'hs_002',
            title: 'First Aid Supplies',
            description: 'Check first aid kits and medical supplies',
            category: 'medical',
            priority: 'medium',
            evidence_required: ['inventory_logs', 'expiry_checks'],
            responsible_role: 'safety_officer',
            frequency: 'monthly'
          },
          {
            item_id: 'hs_003',
            title: 'Workplace Ergonomics',
            description: 'Assess workstation setup and ergonomic compliance',
            category: 'ergonomics',
            priority: 'medium',
            evidence_required: ['assessment_forms', 'photos'],
            responsible_role: 'hr_manager',
            frequency: 'quarterly'
          }
        ],
        documentation_requirements: [
          'Inspection checklists',
          'Incident reports',
          'Training records',
          'Equipment maintenance logs',
          'Emergency procedures'
        ],
        responsible_departments: ['hr', 'facilities', 'safety'],
        review_frequency: 'monthly',
        next_review_due_months: 1,
        audit_trail_required: true,
        external_audit_required: false,
        certification_impact: false,
        non_compliance_penalties: {
          regulatory_fines: 'variable_by_violation',
          operational_impact: 'medium',
          reputational_risk: 'medium'
        },
        completion_tracking: {
          auto_reminders: true,
          escalation_rules: false,
          progress_reporting: 'monthly'
        },
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('compliance_checklist_templates', complianceChecklists);

    console.log(`✅ Seeded ${complianceChecklists.length} compliance checklist templates`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('compliance_checklist_templates', null, {});
  }
};