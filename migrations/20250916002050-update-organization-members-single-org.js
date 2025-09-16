'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if the constraint exists before trying to remove it
    try {
      await queryInterface.removeConstraint('organization_members', 'unique_organization_user_membership');
      console.log('Removed existing unique constraint');
    } catch (error) {
      console.log('Constraint unique_organization_user_membership does not exist, skipping');
    }

    // The organization_members table is already suitable for single-org constraints
    // Just add a comment to clarify the role purpose
    await queryInterface.sequelize.query(`
      COMMENT ON COLUMN organization_members.role IS 'Role within the organization (single-org context)';
    `);

    // Add department field to organization_members
    await queryInterface.addColumn('organization_members', 'department', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Department within the organization'
    });

    // Add position field
    await queryInterface.addColumn('organization_members', 'position', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Job position/title within the organization'
    });

    // Re-add the unique constraint but renamed for clarity
    await queryInterface.addConstraint('organization_members', {
      fields: ['user_id'],
      type: 'unique',
      name: 'organization_members_single_org_per_user',
      comment: 'Enforce single organization per user'
    });

    // Add composite unique constraint for email within organization
    // This will be enforced at application level through the user-organization relationship
    await queryInterface.addIndex('organization_members', ['organization_id', 'user_id'], {
      unique: true,
      name: 'organization_members_org_user_unique'
    });

    // Add index for department
    await queryInterface.addIndex('organization_members', ['department'], {
      name: 'organization_members_department_idx',
      where: {
        department: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    // Add index for position
    await queryInterface.addIndex('organization_members', ['position'], {
      name: 'organization_members_position_idx',
      where: {
        position: {
          [Sequelize.Op.ne]: null
        }
      }
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove indexes first
    try {
      await queryInterface.removeIndex('organization_members', 'organization_members_position_idx');
    } catch (e) { console.log('Index organization_members_position_idx does not exist'); }

    try {
      await queryInterface.removeIndex('organization_members', 'organization_members_department_idx');
    } catch (e) { console.log('Index organization_members_department_idx does not exist'); }

    try {
      await queryInterface.removeIndex('organization_members', 'organization_members_org_user_unique');
    } catch (e) { console.log('Index organization_members_org_user_unique does not exist'); }

    // Remove the single-org constraint
    try {
      await queryInterface.removeConstraint('organization_members', 'organization_members_single_org_per_user');
    } catch (e) { console.log('Constraint organization_members_single_org_per_user does not exist'); }

    // Remove new columns
    try {
      await queryInterface.removeColumn('organization_members', 'position');
    } catch (e) { console.log('Column position does not exist'); }

    try {
      await queryInterface.removeColumn('organization_members', 'department');
    } catch (e) { console.log('Column department does not exist'); }
  }
};
