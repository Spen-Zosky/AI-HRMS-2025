'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {

      // 1. att_attendance_policies - Must be created first (referenced by other tables)
      await queryInterface.createTable('att_attendance_policies', {
        att_policy_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        att_policy_tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_tenants',
            key: 'tnt_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_policy_organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'org_organizations',
            key: 'org_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_policy_name: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        att_policy_description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        att_policy_work_hours_per_day: {
          type: Sequelize.DECIMAL(4, 2),
          allowNull: false,
          defaultValue: 8.00,
          comment: 'Standard work hours per day'
        },
        att_policy_work_days_per_week: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 5,
          comment: 'Standard work days per week'
        },
        att_policy_grace_period_minutes: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 15,
          comment: 'Grace period for late arrivals (minutes)'
        },
        att_policy_overtime_threshold_minutes: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 480,
          comment: 'Minutes after which overtime applies (8hrs = 480min)'
        },
        att_policy_require_geolocation: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        att_policy_allow_mobile_clock: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        att_policy_auto_clock_out_hours: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Auto clock-out after X hours if employee forgets'
        },
        att_policy_config_json: {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: 'Flexible configuration for policy-specific rules'
        },
        att_policy_is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        att_policy_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        att_policy_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        att_policy_created_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'sys_users',
            key: 'usr_id'
          }
        },
        att_policy_deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 2. att_shift_schedules
      await queryInterface.createTable('att_shift_schedules', {
        att_shift_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        att_shift_tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_tenants',
            key: 'tnt_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_shift_organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'org_organizations',
            key: 'org_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_shift_employee_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'emp_employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_shift_name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'e.g., Morning Shift, Night Shift, Rotating'
        },
        att_shift_start_time: {
          type: Sequelize.TIME,
          allowNull: false
        },
        att_shift_end_time: {
          type: Sequelize.TIME,
          allowNull: false
        },
        att_shift_days_of_week: {
          type: Sequelize.ARRAY(Sequelize.INTEGER),
          allowNull: false,
          defaultValue: [1, 2, 3, 4, 5],
          comment: '0=Sunday, 1=Monday, ..., 6=Saturday'
        },
        att_shift_effective_from: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        att_shift_effective_until: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        att_shift_policy_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'att_attendance_policies',
            key: 'att_policy_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        att_shift_is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        att_shift_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        att_shift_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        att_shift_created_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'sys_users',
            key: 'usr_id'
          }
        },
        att_shift_deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 3. att_clock_locations
      await queryInterface.createTable('att_clock_locations', {
        att_location_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        att_location_tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_tenants',
            key: 'tnt_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_location_organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'org_organizations',
            key: 'org_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_location_name: {
          type: Sequelize.STRING(200),
          allowNull: false,
          comment: 'e.g., Main Office, Remote, Site A'
        },
        att_location_address: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        att_location_latitude: {
          type: Sequelize.DECIMAL(10, 8),
          allowNull: true
        },
        att_location_longitude: {
          type: Sequelize.DECIMAL(11, 8),
          allowNull: true
        },
        att_location_radius_meters: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 100,
          comment: 'Geofence radius for clock validation'
        },
        att_location_allow_remote_clock: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        att_location_is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        att_location_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        att_location_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        att_location_created_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'sys_users',
            key: 'usr_id'
          }
        },
        att_location_deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 4. att_attendance_records
      await queryInterface.createTable('att_attendance_records', {
        att_record_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        att_record_tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_tenants',
            key: 'tnt_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_record_organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'org_organizations',
            key: 'org_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_record_employee_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'emp_employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_record_date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        att_record_clock_in: {
          type: Sequelize.DATE,
          allowNull: true
        },
        att_record_clock_out: {
          type: Sequelize.DATE,
          allowNull: true
        },
        att_record_shift_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'att_shift_schedules',
            key: 'att_shift_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        att_record_location_id_in: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'att_clock_locations',
            key: 'att_location_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        att_record_location_id_out: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'att_clock_locations',
            key: 'att_location_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        att_record_total_hours: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          comment: 'Calculated total hours worked'
        },
        att_record_overtime_hours: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: 0.00
        },
        att_record_status: {
          type: Sequelize.ENUM('present', 'absent', 'late', 'half_day', 'on_leave', 'holiday'),
          allowNull: false,
          defaultValue: 'present'
        },
        att_record_is_late: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        att_record_late_minutes: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        att_record_notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        att_record_geo_location_in: {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: 'GPS coordinates for clock-in'
        },
        att_record_geo_location_out: {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: 'GPS coordinates for clock-out'
        },
        att_record_device_info: {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: 'Device used for clocking (mobile, web, biometric)'
        },
        att_record_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        att_record_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        att_record_deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 5. att_time_entries (manual adjustments/corrections)
      await queryInterface.createTable('att_time_entries', {
        att_entry_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        att_entry_tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_tenants',
            key: 'tnt_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_entry_organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'org_organizations',
            key: 'org_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_entry_employee_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'emp_employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_entry_attendance_record_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'att_attendance_records',
            key: 'att_record_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_entry_date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        att_entry_type: {
          type: Sequelize.ENUM('manual_clock_in', 'manual_clock_out', 'correction', 'adjustment', 'overtime_manual'),
          allowNull: false
        },
        att_entry_time: {
          type: Sequelize.DATE,
          allowNull: false
        },
        att_entry_hours: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true
        },
        att_entry_reason: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        att_entry_approved_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'sys_users',
            key: 'usr_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        att_entry_status: {
          type: Sequelize.ENUM('pending', 'approved', 'rejected'),
          allowNull: false,
          defaultValue: 'pending'
        },
        att_entry_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        att_entry_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        att_entry_created_by: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_users',
            key: 'usr_id'
          }
        },
        att_entry_deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 6. att_overtime_requests
      await queryInterface.createTable('att_overtime_requests', {
        att_ot_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        att_ot_tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_tenants',
            key: 'tnt_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_ot_organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'org_organizations',
            key: 'org_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_ot_employee_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'emp_employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_ot_date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        att_ot_start_time: {
          type: Sequelize.TIME,
          allowNull: false
        },
        att_ot_end_time: {
          type: Sequelize.TIME,
          allowNull: false
        },
        att_ot_hours_requested: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false
        },
        att_ot_reason: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        att_ot_status: {
          type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled'),
          allowNull: false,
          defaultValue: 'pending'
        },
        att_ot_approved_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'sys_users',
            key: 'usr_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        att_ot_approved_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        att_ot_approval_notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        att_ot_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        att_ot_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        att_ot_created_by: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_users',
            key: 'usr_id'
          }
        },
        att_ot_deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 7. att_absence_tracking
      await queryInterface.createTable('att_absence_tracking', {
        att_absence_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        att_absence_tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_tenants',
            key: 'tnt_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_absence_organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'org_organizations',
            key: 'org_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_absence_employee_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'emp_employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_absence_date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        att_absence_type: {
          type: Sequelize.ENUM('sick', 'vacation', 'personal', 'unpaid', 'bereavement', 'maternity', 'paternity', 'other'),
          allowNull: false
        },
        att_absence_is_full_day: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        att_absence_hours: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          comment: 'Hours for partial day absence'
        },
        att_absence_reason: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        att_absence_leave_request_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'lve_leave_requests',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        att_absence_status: {
          type: Sequelize.ENUM('pending', 'approved', 'rejected'),
          allowNull: false,
          defaultValue: 'approved',
          comment: 'Auto-approved if linked to approved leave request'
        },
        att_absence_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        att_absence_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        att_absence_deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 8. att_break_logs
      await queryInterface.createTable('att_break_logs', {
        att_break_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        att_break_tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sys_tenants',
            key: 'tnt_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_break_organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'org_organizations',
            key: 'org_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_break_attendance_record_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'att_attendance_records',
            key: 'att_record_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_break_employee_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'emp_employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        att_break_type: {
          type: Sequelize.ENUM('lunch', 'coffee', 'rest', 'prayer', 'personal', 'other'),
          allowNull: false,
          defaultValue: 'rest'
        },
        att_break_start_time: {
          type: Sequelize.DATE,
          allowNull: false
        },
        att_break_end_time: {
          type: Sequelize.DATE,
          allowNull: true
        },
        att_break_duration_minutes: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Calculated break duration'
        },
        att_break_is_paid: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        att_break_notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        att_break_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        att_break_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        att_break_deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // Create indexes for performance
      await queryInterface.addIndex('att_attendance_policies', ['att_policy_tenant_id', 'att_policy_organization_id'], {
        name: 'idx_att_policies_tenant_org',
        transaction
      });

      await queryInterface.addIndex('att_shift_schedules', ['att_shift_tenant_id', 'att_shift_organization_id', 'att_shift_employee_id'], {
        name: 'idx_att_shifts_tenant_org_emp',
        transaction
      });

      await queryInterface.addIndex('att_attendance_records', ['att_record_tenant_id', 'att_record_organization_id', 'att_record_employee_id', 'att_record_date'], {
        name: 'idx_att_records_tenant_org_emp_date',
        transaction
      });

      await queryInterface.addIndex('att_attendance_records', ['att_record_date'], {
        name: 'idx_att_records_date',
        transaction
      });

      await queryInterface.addIndex('att_time_entries', ['att_entry_employee_id', 'att_entry_date'], {
        name: 'idx_att_entries_emp_date',
        transaction
      });

      await queryInterface.addIndex('att_overtime_requests', ['att_ot_employee_id', 'att_ot_status'], {
        name: 'idx_att_ot_emp_status',
        transaction
      });

      await queryInterface.addIndex('att_absence_tracking', ['att_absence_employee_id', 'att_absence_date'], {
        name: 'idx_att_absence_emp_date',
        transaction
      });

      await queryInterface.addIndex('att_break_logs', ['att_break_attendance_record_id'], {
        name: 'idx_att_breaks_record',
        transaction
      });

      console.log('✅ Attendance module (8 tables) created successfully with multi-tenant isolation');
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('att_break_logs', { transaction });
      await queryInterface.dropTable('att_absence_tracking', { transaction });
      await queryInterface.dropTable('att_overtime_requests', { transaction });
      await queryInterface.dropTable('att_time_entries', { transaction });
      await queryInterface.dropTable('att_attendance_records', { transaction });
      await queryInterface.dropTable('att_clock_locations', { transaction });
      await queryInterface.dropTable('att_shift_schedules', { transaction });
      await queryInterface.dropTable('att_attendance_policies', { transaction });

      console.log('✅ Attendance module tables dropped');
    });
  }
};