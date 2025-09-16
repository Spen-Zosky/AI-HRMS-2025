'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if there are existing organizations
    const [results] = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM organizations'
    );
    const orgCount = parseInt(results[0].count);

    console.log(`Found ${orgCount} existing organizations`);

    // First add tenant_id column as nullable
    await queryInterface.addColumn('organizations', 'tenant_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'tenants',
        key: 'tenant_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'Reference to the tenant that owns this organization'
    });

    // If there are existing organizations, assign them to DemoTenant
    if (orgCount > 0) {
      // Get DemoTenant ID
      const [tenantResults] = await queryInterface.sequelize.query(
        `SELECT tenant_id FROM tenants WHERE tenant_slug = 'demotenant' LIMIT 1`
      );

      if (tenantResults.length > 0) {
        const demoTenantId = tenantResults[0].tenant_id;
        console.log(`Assigning existing organizations to DemoTenant: ${demoTenantId}`);

        // Update all existing organizations to belong to DemoTenant
        await queryInterface.sequelize.query(
          `UPDATE organizations SET tenant_id = '${demoTenantId}' WHERE tenant_id IS NULL`
        );

        console.log(`✅ Assigned ${orgCount} existing organizations to DemoTenant`);
      } else {
        throw new Error('DemoTenant not found! Please run Phase B1 first.');
      }
    }

    // Now make tenant_id NOT NULL
    await queryInterface.changeColumn('organizations', 'tenant_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'tenant_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'Reference to the tenant that owns this organization'
    });

    // Add index for tenant_id for performance
    await queryInterface.addIndex('organizations', ['tenant_id'], {
      name: 'organizations_tenant_id_idx'
    });

    // Add composite index for tenant-slug uniqueness
    await queryInterface.addIndex('organizations', ['tenant_id', 'slug'], {
      unique: true,
      name: 'organizations_tenant_slug_unique',
      comment: 'Ensure unique slug per tenant'
    });

    // Remove the global slug unique constraint since slugs should be unique per tenant
    await queryInterface.removeIndex('organizations', ['slug']);
  },

  async down (queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('organizations', 'organizations_tenant_slug_unique');
    await queryInterface.removeIndex('organizations', 'organizations_tenant_id_idx');

    // Restore the global slug unique constraint
    await queryInterface.addIndex('organizations', ['slug'], {
      unique: true,
      name: 'organizations_slug_idx'
    });

    // Remove the tenant_id column
    await queryInterface.removeColumn('organizations', 'tenant_id');
  }
};
