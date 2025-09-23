'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT
          o.org_id,
          o.org_name,
          o.org_industry,
          o.org_employee_count_range,
          COUNT(e.id) as actual_employee_count
         FROM org_organizations o
         LEFT JOIN emp_employees e ON o.org_id = e.organization_id
         GROUP BY o.org_id, o.org_name, o.org_industry, o.org_employee_count_range
         ORDER BY o.org_name`,
        { transaction }
      );

      const hierarchyDefinitions = [];
      const hierarchyNodes = [];
      const hierarchyRelationships = [];
      const currentDate = new Date();

      const industryHierarchyPatterns = {
        'Financial Services': {
          type: 'organizational',
          levels: [
            { level: 1, name: 'C-Suite', code: 'C', description: 'Chief Executive Officers', span_of_control: 5 },
            { level: 2, name: 'Executive Vice President', code: 'EVP', description: 'Division heads', span_of_control: 6 },
            { level: 3, name: 'Senior Vice President', code: 'SVP', description: 'Senior management', span_of_control: 6 },
            { level: 4, name: 'Vice President', code: 'VP', description: 'Department leadership', span_of_control: 7 },
            { level: 5, name: 'Senior Manager', code: 'SM', description: 'Team leadership', span_of_control: 7 },
            { level: 6, name: 'Manager', code: 'M', description: 'Direct management', span_of_control: 5 },
            { level: 7, name: 'Senior Associate', code: 'SA', description: 'Experienced professionals', span_of_control: 0 },
            { level: 8, name: 'Associate', code: 'A', description: 'Individual contributors', span_of_control: 0 }
          ]
        },
        'Biotechnology': {
          type: 'functional',
          levels: [
            { level: 1, name: 'Executive Leadership', code: 'EXEC', description: 'C-suite executives', span_of_control: 6 },
            { level: 2, name: 'Vice President', code: 'VP', description: 'Functional VPs', span_of_control: 7 },
            { level: 3, name: 'Senior Director', code: 'SD', description: 'Senior management', span_of_control: 7 },
            { level: 4, name: 'Director', code: 'DIR', description: 'Department directors', span_of_control: 8 },
            { level: 5, name: 'Senior Manager', code: 'SM', description: 'Project/team managers', span_of_control: 6 },
            { level: 6, name: 'Principal Scientist', code: 'PS', description: 'Technical leadership', span_of_control: 5 },
            { level: 7, name: 'Senior Scientist', code: 'SS', description: 'Senior researchers', span_of_control: 0 },
            { level: 8, name: 'Scientist', code: 'SCI', description: 'Research scientists', span_of_control: 0 }
          ]
        },
        'Technology': {
          type: 'organizational',
          levels: [
            { level: 1, name: 'Executive', code: 'EXEC', description: 'C-level executives', span_of_control: 8 },
            { level: 2, name: 'VP/Director', code: 'VP', description: 'Senior leadership', span_of_control: 10 },
            { level: 3, name: 'Senior Manager', code: 'SM', description: 'Team leadership', span_of_control: 10 },
            { level: 4, name: 'Manager', code: 'MGR', description: 'Direct management', span_of_control: 8 },
            { level: 5, name: 'Staff IC', code: 'IC5', description: 'Staff level individual contributors', span_of_control: 0 },
            { level: 6, name: 'Senior IC', code: 'IC4', description: 'Senior individual contributors', span_of_control: 0 },
            { level: 7, name: 'Mid-level IC', code: 'IC3', description: 'Mid-level professionals', span_of_control: 0 },
            { level: 8, name: 'Junior IC', code: 'IC2', description: 'Junior professionals', span_of_control: 0 }
          ]
        },
        'Information Technology': {
          type: 'organizational',
          levels: [
            { level: 1, name: 'Executive', code: 'EXEC', description: 'C-level executives', span_of_control: 8 },
            { level: 2, name: 'VP/Director', code: 'VP', description: 'Senior leadership', span_of_control: 10 },
            { level: 3, name: 'Senior Manager', code: 'SM', description: 'Team leadership', span_of_control: 10 },
            { level: 4, name: 'Manager', code: 'MGR', description: 'Direct management', span_of_control: 8 },
            { level: 5, name: 'Staff IC', code: 'IC5', description: 'Staff level individual contributors', span_of_control: 0 },
            { level: 6, name: 'Senior IC', code: 'IC4', description: 'Senior individual contributors', span_of_control: 0 },
            { level: 7, name: 'Mid-level IC', code: 'IC3', description: 'Mid-level professionals', span_of_control: 0 },
            { level: 8, name: 'Junior IC', code: 'IC2', description: 'Junior professionals', span_of_control: 0 }
          ]
        },
        'Renewable Energy': {
          type: 'geographical',
          levels: [
            { level: 1, name: 'Executive Leadership', code: 'EXEC', description: 'C-suite', span_of_control: 7 },
            { level: 2, name: 'Senior Director', code: 'SD', description: 'Senior management', span_of_control: 9 },
            { level: 3, name: 'Director', code: 'DIR', description: 'Department directors', span_of_control: 9 },
            { level: 4, name: 'Senior Manager', code: 'SM', description: 'Project managers', span_of_control: 10 },
            { level: 5, name: 'Manager', code: 'MGR', description: 'Team managers', span_of_control: 8 },
            { level: 6, name: 'Lead Engineer', code: 'LE', description: 'Technical leads', span_of_control: 5 },
            { level: 7, name: 'Senior Professional', code: 'SP', description: 'Senior staff', span_of_control: 0 },
            { level: 8, name: 'Professional', code: 'PROF', description: 'Individual contributors', span_of_control: 0 }
          ]
        },
        'Financial Technology': {
          type: 'organizational',
          levels: [
            { level: 1, name: 'Founders', code: 'FOUND', description: 'Co-founders', span_of_control: 10 },
            { level: 2, name: 'Leadership', code: 'LEAD', description: 'Function leads', span_of_control: 12 },
            { level: 3, name: 'Senior IC', code: 'IC4', description: 'Senior individual contributors', span_of_control: 0 },
            { level: 4, name: 'Mid-level IC', code: 'IC3', description: 'Mid-level professionals', span_of_control: 0 },
            { level: 5, name: 'Junior IC', code: 'IC2', description: 'Junior professionals', span_of_control: 0 }
          ]
        },
        'Creative Services': {
          type: 'project',
          levels: [
            { level: 1, name: 'Principal', code: 'PRIN', description: 'Studio principals', span_of_control: 8 },
            { level: 2, name: 'Creative Director', code: 'CD', description: 'Creative leadership', span_of_control: 9 },
            { level: 3, name: 'Senior Manager', code: 'SM', description: 'Project managers', span_of_control: 7 },
            { level: 4, name: 'Manager', code: 'MGR', description: 'Team managers', span_of_control: 6 },
            { level: 5, name: 'Senior Designer', code: 'SD', description: 'Senior creatives', span_of_control: 0 },
            { level: 6, name: 'Designer', code: 'DES', description: 'Creative professionals', span_of_control: 0 }
          ]
        },
        'Design': {
          type: 'project',
          levels: [
            { level: 1, name: 'Principal', code: 'PRIN', description: 'Studio principals', span_of_control: 8 },
            { level: 2, name: 'Creative Director', code: 'CD', description: 'Creative leadership', span_of_control: 9 },
            { level: 3, name: 'Senior Manager', code: 'SM', description: 'Project managers', span_of_control: 7 },
            { level: 4, name: 'Manager', code: 'MGR', description: 'Team managers', span_of_control: 6 },
            { level: 5, name: 'Senior Designer', code: 'SD', description: 'Senior creatives', span_of_control: 0 },
            { level: 6, name: 'Designer', code: 'DES', description: 'Creative professionals', span_of_control: 0 }
          ]
        }
      };

      const [maxIds] = await queryInterface.sequelize.query(
        `SELECT
          COALESCE(MAX(hierarchy_id), 0) as max_hierarchy_id,
          COALESCE(MAX(node_id), 0) as max_node_id
         FROM (
           SELECT hierarchy_id FROM hir_hierarchy_definitions
           UNION ALL
           SELECT 0 as hierarchy_id
         ) h
         CROSS JOIN (
           SELECT node_id FROM hir_hierarchy_nodes
           UNION ALL
           SELECT 0 as node_id
         ) n`,
        { transaction }
      );

      const [maxRelId] = await queryInterface.sequelize.query(
        `SELECT COALESCE(MAX(relationship_id), 0) as max_relationship_id
         FROM hir_hierarchy_relationships`,
        { transaction }
      );

      let hierarchyIdCounter = (maxIds[0]?.max_hierarchy_id || 0) + 1;
      let nodeIdCounter = (maxIds[0]?.max_node_id || 0) + 1;
      let relationshipIdCounter = (maxRelId[0]?.max_relationship_id || 0) + 1;

      for (const org of organizations) {
        const pattern = industryHierarchyPatterns[org.org_industry];
        if (!pattern) continue;

        const hierarchyId = hierarchyIdCounter++;

        hierarchyDefinitions.push({
          hierarchy_id: hierarchyId,
          hierarchy_org_id: org.org_id,
          hierarchy_name: `${org.org_name} ${pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)} Hierarchy`,
          hierarchy_type: pattern.type,
          hierarchy_description: `Industry-standard ${pattern.type} hierarchy for ${org.org_industry} organization with ${org.actual_employee_count} employees`,
          hierarchy_is_active: true,
          hierarchy_created_at: currentDate,
          hierarchy_updated_at: currentDate
        });

        const orgNodeIds = {};
        let prevNodeId = null;

        pattern.levels.forEach((levelDef, index) => {
          const nodeId = nodeIdCounter++;
          const nodePath = prevNodeId ? `${prevNodeId}/${nodeId}` : `${nodeId}`;

          hierarchyNodes.push({
            node_id: nodeId,
            node_hierarchy_id: hierarchyId,
            node_parent_id: prevNodeId,
            node_name: levelDef.name,
            node_code: levelDef.code,
            node_level: levelDef.level,
            node_path: nodePath,
            node_left: index * 2 + 1,
            node_right: index * 2 + 2,
            node_metadata: JSON.stringify({
              description: levelDef.description,
              span_of_control: levelDef.span_of_control,
              is_management: levelDef.span_of_control > 0,
              industry_standard: true,
              typical_salary_range: levelDef.level <= 3 ? 'executive' : levelDef.level <= 5 ? 'senior' : 'mid-level'
            }),
            node_is_active: true,
            node_created_at: currentDate,
            node_updated_at: currentDate
          });

          if (prevNodeId) {
            hierarchyRelationships.push({
              relationship_id: relationshipIdCounter++,
              relationship_parent_node_id: prevNodeId,
              relationship_child_node_id: nodeId,
              relationship_type: 'direct',
              relationship_weight: 1.0,
              relationship_is_active: true,
              relationship_created_at: currentDate,
              relationship_updated_at: currentDate
            });
          }

          orgNodeIds[levelDef.level] = nodeId;
          prevNodeId = nodeId;
        });

        if (org.org_industry === 'Biotechnology' && pattern.type === 'matrix') {
          const vpNode = orgNodeIds[2];
          const scientistNode = orgNodeIds[6];
          if (vpNode && scientistNode) {
            hierarchyRelationships.push({
              relationship_id: relationshipIdCounter++,
              relationship_parent_node_id: vpNode,
              relationship_child_node_id: scientistNode,
              relationship_type: 'dotted',
              relationship_weight: 0.5,
              relationship_is_active: true,
              relationship_created_at: currentDate,
              relationship_updated_at: currentDate
            });
          }
        }
      }

      if (hierarchyDefinitions.length > 0) {
        await queryInterface.bulkInsert('hir_hierarchy_definitions', hierarchyDefinitions, { transaction });
        console.log(`✅ Seeded ${hierarchyDefinitions.length} hierarchy definitions`);
      }

      if (hierarchyNodes.length > 0) {
        await queryInterface.bulkInsert('hir_hierarchy_nodes', hierarchyNodes, { transaction });
        console.log(`✅ Seeded ${hierarchyNodes.length} hierarchy nodes`);
      }

      if (hierarchyRelationships.length > 0) {
        await queryInterface.bulkInsert('hir_hierarchy_relationships', hierarchyRelationships, { transaction });
        console.log(`✅ Seeded ${hierarchyRelationships.length} hierarchy relationships`);
      }

      await transaction.commit();
      console.log(`\n✅ Successfully seeded complete hierarchy system:`);
      console.log(`   - ${hierarchyDefinitions.length} hierarchy definitions across ${organizations.length} organizations`);
      console.log(`   - ${hierarchyNodes.length} hierarchy nodes (avg ${Math.round(hierarchyNodes.length / hierarchyDefinitions.length)} per org)`);
      console.log(`   - ${hierarchyRelationships.length} relationships (direct + matrix)`);

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to seed hierarchy system:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('hir_hierarchy_relationships', {
        relationship_created_at: {
          [Sequelize.Op.gte]: '2025-01-24 00:00:00'
        }
      }, { transaction });

      await queryInterface.bulkDelete('hir_hierarchy_nodes', {
        node_created_at: {
          [Sequelize.Op.gte]: '2025-01-24 00:00:00'
        }
      }, { transaction });

      await queryInterface.bulkDelete('hir_hierarchy_definitions', {
        hierarchy_created_at: {
          [Sequelize.Op.gte]: '2025-01-24 00:00:00'
        }
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};