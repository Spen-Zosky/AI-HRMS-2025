'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {

      // 1. pay_salary_components - Core salary structure (must be first)
      await queryInterface.createTable('pay_salary_components', {
        pay_component_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        pay_component_tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_tenants',
            key: 'tnt_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_component_organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'org_organizations',
            key: 'org_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_component_employee_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'emp_employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_component_type: {
          type: Sequelize.ENUM('basic_salary', 'allowance', 'commission', 'bonus', 'overtime_pay', 'deduction', 'reimbursement'),
          allowNull: false
        },
        pay_component_name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'e.g., Housing Allowance, Transport Allowance, HRA'
        },
        pay_component_amount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false
        },
        pay_component_currency: {
          type: Sequelize.STRING(3),
          allowNull: false,
          defaultValue: 'USD'
        },
        pay_component_is_taxable: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        pay_component_is_recurring: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        pay_component_effective_from: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        pay_component_effective_until: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        pay_component_calculation_formula: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Formula for calculating dynamic components'
        },
        pay_component_config_json: {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: 'Flexible config for component-specific rules'
        },
        pay_component_is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        pay_component_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        pay_component_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        pay_component_created_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'sys_users',
            key: 'usr_id'
          }
        },
        pay_component_deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 2. pay_payroll_runs - Payroll cycle execution
      await queryInterface.createTable('pay_payroll_runs', {
        pay_run_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        pay_run_tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_tenants',
            key: 'tnt_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_run_organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'org_organizations',
            key: 'org_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_run_name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'e.g., January 2025 Payroll, Mid-Month Advance'
        },
        pay_run_period_start: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        pay_run_period_end: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        pay_run_payment_date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        pay_run_frequency: {
          type: Sequelize.ENUM('monthly', 'bi_weekly', 'weekly', 'quarterly', 'annual'),
          allowNull: false,
          defaultValue: 'monthly'
        },
        pay_run_status: {
          type: Sequelize.ENUM('draft', 'in_progress', 'calculated', 'approved', 'processed', 'completed', 'cancelled'),
          allowNull: false,
          defaultValue: 'draft'
        },
        pay_run_total_gross: {
          type: Sequelize.DECIMAL(18, 2),
          allowNull: true,
          comment: 'Total gross salary for all employees'
        },
        pay_run_total_deductions: {
          type: Sequelize.DECIMAL(18, 2),
          allowNull: true
        },
        pay_run_total_net: {
          type: Sequelize.DECIMAL(18, 2),
          allowNull: true,
          comment: 'Total net salary to be paid'
        },
        pay_run_total_tax: {
          type: Sequelize.DECIMAL(18, 2),
          allowNull: true
        },
        pay_run_employee_count: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        pay_run_currency: {
          type: Sequelize.STRING(3),
          allowNull: false,
          defaultValue: 'USD'
        },
        pay_run_processed_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        pay_run_approved_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'sys_users',
            key: 'usr_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        pay_run_approved_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        pay_run_notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        pay_run_config_json: {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: 'Processing config, exchange rates, special rules'
        },
        pay_run_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        pay_run_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        pay_run_created_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'sys_users',
            key: 'usr_id'
          }
        },
        pay_run_deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 3. pay_tax_calculations
      await queryInterface.createTable('pay_tax_calculations', {
        pay_tax_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        pay_tax_tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_tenants',
            key: 'tnt_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_tax_organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'org_organizations',
            key: 'org_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_tax_employee_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'emp_employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_tax_payroll_run_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'pay_payroll_runs',
            key: 'pay_run_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_tax_type: {
          type: Sequelize.ENUM('income_tax', 'social_security', 'medicare', 'state_tax', 'local_tax', 'pension', 'other'),
          allowNull: false
        },
        pay_tax_name: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        pay_tax_taxable_amount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false
        },
        pay_tax_rate_percentage: {
          type: Sequelize.DECIMAL(5, 4),
          allowNull: true,
          comment: 'Tax rate as decimal (e.g., 0.2500 for 25%)'
        },
        pay_tax_amount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false
        },
        pay_tax_employer_contribution: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true,
          defaultValue: 0.00
        },
        pay_tax_year: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        pay_tax_month: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        pay_tax_calculation_method: {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'e.g., progressive_slab, flat_rate, threshold_based'
        },
        pay_tax_config_json: {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: 'Tax slabs, exemptions, deductions details'
        },
        pay_tax_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        pay_tax_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        pay_tax_deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 4. pay_deductions
      await queryInterface.createTable('pay_deductions', {
        pay_deduction_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        pay_deduction_tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_tenants',
            key: 'tnt_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_deduction_organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'org_organizations',
            key: 'org_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_deduction_employee_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'emp_employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_deduction_payroll_run_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'pay_payroll_runs',
            key: 'pay_run_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        pay_deduction_type: {
          type: Sequelize.ENUM('loan_repayment', 'advance_salary', 'disciplinary', 'insurance', 'retirement_fund', 'union_dues', 'garnishment', 'other'),
          allowNull: false
        },
        pay_deduction_name: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        pay_deduction_amount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false
        },
        pay_deduction_is_recurring: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        pay_deduction_installment_number: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Current installment number for loan repayments'
        },
        pay_deduction_total_installments: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        pay_deduction_remaining_balance: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true
        },
        pay_deduction_start_date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        pay_deduction_end_date: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        pay_deduction_notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        pay_deduction_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        pay_deduction_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        pay_deduction_created_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'sys_users',
            key: 'usr_id'
          }
        },
        pay_deduction_deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 5. pay_bonuses
      await queryInterface.createTable('pay_bonuses', {
        pay_bonus_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        pay_bonus_tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_tenants',
            key: 'tnt_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_bonus_organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'org_organizations',
            key: 'org_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_bonus_employee_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'emp_employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_bonus_payroll_run_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'pay_payroll_runs',
            key: 'pay_run_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        pay_bonus_type: {
          type: Sequelize.ENUM('performance', 'annual', 'signing', 'retention', 'referral', 'project_completion', 'festive', 'discretionary', 'other'),
          allowNull: false
        },
        pay_bonus_name: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        pay_bonus_amount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false
        },
        pay_bonus_currency: {
          type: Sequelize.STRING(3),
          allowNull: false,
          defaultValue: 'USD'
        },
        pay_bonus_is_taxable: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        pay_bonus_payment_date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        pay_bonus_status: {
          type: Sequelize.ENUM('pending', 'approved', 'paid', 'cancelled'),
          allowNull: false,
          defaultValue: 'pending'
        },
        pay_bonus_approved_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'sys_users',
            key: 'usr_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        pay_bonus_approved_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        pay_bonus_notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        pay_bonus_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        pay_bonus_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        pay_bonus_created_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'sys_users',
            key: 'usr_id'
          }
        },
        pay_bonus_deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 6. pay_reimbursements
      await queryInterface.createTable('pay_reimbursements', {
        pay_reimb_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        pay_reimb_tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_tenants',
            key: 'tnt_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_reimb_organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'org_organizations',
            key: 'org_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_reimb_employee_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'emp_employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_reimb_payroll_run_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'pay_payroll_runs',
            key: 'pay_run_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        pay_reimb_category: {
          type: Sequelize.ENUM('travel', 'accommodation', 'meals', 'fuel', 'mobile', 'internet', 'office_supplies', 'medical', 'education', 'relocation', 'other'),
          allowNull: false
        },
        pay_reimb_description: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        pay_reimb_amount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false
        },
        pay_reimb_currency: {
          type: Sequelize.STRING(3),
          allowNull: false,
          defaultValue: 'USD'
        },
        pay_reimb_expense_date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        pay_reimb_receipt_url: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'URL to uploaded receipt/proof'
        },
        pay_reimb_status: {
          type: Sequelize.ENUM('submitted', 'pending_review', 'approved', 'rejected', 'paid'),
          allowNull: false,
          defaultValue: 'submitted'
        },
        pay_reimb_reviewed_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'sys_users',
            key: 'usr_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        pay_reimb_reviewed_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        pay_reimb_review_notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        pay_reimb_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        pay_reimb_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        pay_reimb_created_by: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_users',
            key: 'usr_id'
          }
        },
        pay_reimb_deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 7. pay_bank_details
      await queryInterface.createTable('pay_bank_details', {
        pay_bank_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        pay_bank_tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_tenants',
            key: 'tnt_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_bank_organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'org_organizations',
            key: 'org_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_bank_employee_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'emp_employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_bank_account_holder_name: {
          type: Sequelize.STRING(200),
          allowNull: false
        },
        pay_bank_account_number: {
          type: Sequelize.STRING(50),
          allowNull: false
        },
        pay_bank_name: {
          type: Sequelize.STRING(200),
          allowNull: false
        },
        pay_bank_branch_name: {
          type: Sequelize.STRING(200),
          allowNull: true
        },
        pay_bank_ifsc_code: {
          type: Sequelize.STRING(20),
          allowNull: true,
          comment: 'For Indian banks'
        },
        pay_bank_swift_code: {
          type: Sequelize.STRING(20),
          allowNull: true,
          comment: 'For international transfers'
        },
        pay_bank_routing_number: {
          type: Sequelize.STRING(20),
          allowNull: true,
          comment: 'For US banks'
        },
        pay_bank_iban: {
          type: Sequelize.STRING(50),
          allowNull: true,
          comment: 'International Bank Account Number'
        },
        pay_bank_account_type: {
          type: Sequelize.ENUM('savings', 'current', 'checking'),
          allowNull: false,
          defaultValue: 'savings'
        },
        pay_bank_is_primary: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        pay_bank_is_verified: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        pay_bank_verified_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        pay_bank_is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        pay_bank_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        pay_bank_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        pay_bank_created_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'sys_users',
            key: 'usr_id'
          }
        },
        pay_bank_deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 8. pay_payslips
      await queryInterface.createTable('pay_payslips', {
        pay_slip_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        pay_slip_tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_tenants',
            key: 'tnt_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_slip_organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'org_organizations',
            key: 'org_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_slip_employee_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'emp_employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_slip_payroll_run_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'pay_payroll_runs',
            key: 'pay_run_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_slip_number: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        pay_slip_year: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        pay_slip_month: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        pay_slip_period_start: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        pay_slip_period_end: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        pay_slip_payment_date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        pay_slip_gross_salary: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false
        },
        pay_slip_total_deductions: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        pay_slip_total_tax: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        pay_slip_net_salary: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false
        },
        pay_slip_currency: {
          type: Sequelize.STRING(3),
          allowNull: false,
          defaultValue: 'USD'
        },
        pay_slip_earnings_breakdown: {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: 'Detailed earnings components'
        },
        pay_slip_deductions_breakdown: {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: 'Detailed deductions components'
        },
        pay_slip_pdf_url: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Generated PDF payslip URL'
        },
        pay_slip_is_finalized: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        pay_slip_finalized_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        pay_slip_sent_to_employee: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        pay_slip_sent_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        pay_slip_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        pay_slip_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        pay_slip_deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 9. pay_year_end_reports
      await queryInterface.createTable('pay_year_end_reports', {
        pay_year_end_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        pay_year_end_tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_tenants',
            key: 'tnt_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_year_end_organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'org_organizations',
            key: 'org_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_year_end_employee_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'emp_employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_year_end_year: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        pay_year_end_report_type: {
          type: Sequelize.ENUM('w2', '1099', 'form16', 't4', 'p60', 'annual_summary', 'tax_statement', 'other'),
          allowNull: false,
          comment: 'Tax form type based on country'
        },
        pay_year_end_total_gross_income: {
          type: Sequelize.DECIMAL(18, 2),
          allowNull: false
        },
        pay_year_end_total_tax_deducted: {
          type: Sequelize.DECIMAL(18, 2),
          allowNull: false
        },
        pay_year_end_total_net_income: {
          type: Sequelize.DECIMAL(18, 2),
          allowNull: false
        },
        pay_year_end_tax_breakdown: {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: 'Income tax, social security, etc. breakdown'
        },
        pay_year_end_earnings_breakdown: {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: 'Monthly/quarterly earnings summary'
        },
        pay_year_end_deductions_summary: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        pay_year_end_pdf_url: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        pay_year_end_is_finalized: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        pay_year_end_finalized_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        pay_year_end_sent_to_employee: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        pay_year_end_sent_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        pay_year_end_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        pay_year_end_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        pay_year_end_created_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'sys_users',
            key: 'usr_id'
          }
        },
        pay_year_end_deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 10. pay_audit_trail
      await queryInterface.createTable('pay_audit_trail', {
        pay_audit_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        pay_audit_tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_tenants',
            key: 'tnt_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_audit_organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'org_organizations',
            key: 'org_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_audit_table_name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Table that was modified (pay_payroll_runs, pay_payslips, etc.)'
        },
        pay_audit_record_id: {
          type: Sequelize.UUID,
          allowNull: false,
          comment: 'ID of the modified record'
        },
        pay_audit_action: {
          type: Sequelize.ENUM('create', 'update', 'delete', 'approve', 'reject', 'finalize', 'process'),
          allowNull: false
        },
        pay_audit_changes_json: {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: 'Old and new values for audit trail'
        },
        pay_audit_performed_by: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_users',
            key: 'usr_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pay_audit_ip_address: {
          type: Sequelize.INET,
          allowNull: true
        },
        pay_audit_user_agent: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        pay_audit_notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        pay_audit_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // Create indexes for performance
      await queryInterface.addIndex('pay_salary_components', ['pay_component_tenant_id', 'pay_component_organization_id', 'pay_component_employee_id'], {
        name: 'idx_pay_components_tenant_org_emp',
        transaction
      });

      await queryInterface.addIndex('pay_payroll_runs', ['pay_run_tenant_id', 'pay_run_organization_id', 'pay_run_status'], {
        name: 'idx_pay_runs_tenant_org_status',
        transaction
      });

      await queryInterface.addIndex('pay_payroll_runs', ['pay_run_period_start', 'pay_run_period_end'], {
        name: 'idx_pay_runs_period',
        transaction
      });

      await queryInterface.addIndex('pay_tax_calculations', ['pay_tax_employee_id', 'pay_tax_year', 'pay_tax_month'], {
        name: 'idx_pay_tax_emp_year_month',
        transaction
      });

      await queryInterface.addIndex('pay_deductions', ['pay_deduction_employee_id', 'pay_deduction_payroll_run_id'], {
        name: 'idx_pay_deductions_emp_run',
        transaction
      });

      await queryInterface.addIndex('pay_bonuses', ['pay_bonus_employee_id', 'pay_bonus_status'], {
        name: 'idx_pay_bonuses_emp_status',
        transaction
      });

      await queryInterface.addIndex('pay_reimbursements', ['pay_reimb_employee_id', 'pay_reimb_status'], {
        name: 'idx_pay_reimb_emp_status',
        transaction
      });

      await queryInterface.addIndex('pay_bank_details', ['pay_bank_employee_id', 'pay_bank_is_primary'], {
        name: 'idx_pay_bank_emp_primary',
        transaction
      });

      await queryInterface.addIndex('pay_payslips', ['pay_slip_employee_id', 'pay_slip_year', 'pay_slip_month'], {
        name: 'idx_pay_slips_emp_year_month',
        transaction
      });

      await queryInterface.addIndex('pay_payslips', ['pay_slip_number'], {
        name: 'idx_pay_slips_number',
        unique: true,
        transaction
      });

      await queryInterface.addIndex('pay_year_end_reports', ['pay_year_end_employee_id', 'pay_year_end_year'], {
        name: 'idx_pay_year_end_emp_year',
        transaction
      });

      await queryInterface.addIndex('pay_audit_trail', ['pay_audit_table_name', 'pay_audit_record_id'], {
        name: 'idx_pay_audit_table_record',
        transaction
      });

      await queryInterface.addIndex('pay_audit_trail', ['pay_audit_performed_by', 'pay_audit_created_at'], {
        name: 'idx_pay_audit_user_time',
        transaction
      });

      console.log('✅ Payroll module (10 tables) created successfully with multi-tenant isolation and comprehensive audit trail');
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('pay_audit_trail', { transaction });
      await queryInterface.dropTable('pay_year_end_reports', { transaction });
      await queryInterface.dropTable('pay_payslips', { transaction });
      await queryInterface.dropTable('pay_bank_details', { transaction });
      await queryInterface.dropTable('pay_reimbursements', { transaction });
      await queryInterface.dropTable('pay_bonuses', { transaction });
      await queryInterface.dropTable('pay_deductions', { transaction });
      await queryInterface.dropTable('pay_tax_calculations', { transaction });
      await queryInterface.dropTable('pay_payroll_runs', { transaction });
      await queryInterface.dropTable('pay_salary_components', { transaction });

      console.log('✅ Payroll module tables dropped');
    });
  }
};