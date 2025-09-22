const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://hrms_user:hrms_password@127.0.0.1:5432/ai_hrms_2025', {
  logging: console.log,
  dialectOptions: {
    ssl: false
  }
});

/**
 * Populate Skills Taxonomy with comprehensive skills data
 * This script creates a foundational skills taxonomy for the service tables
 */
async function populateSkillsTaxonomy() {
  const transaction = await sequelize.transaction();

  try {
    console.log('🚀 Populating Skills Taxonomy...\n');

    // Step 1: Technical Skills
    console.log('💻 Adding Technical Skills...');

    const technicalSkills = [
      // Programming Languages
      { name: 'JavaScript', category: 'technical', subcategory: 'programming', proficiency_levels: 5 },
      { name: 'Python', category: 'technical', subcategory: 'programming', proficiency_levels: 5 },
      { name: 'Java', category: 'technical', subcategory: 'programming', proficiency_levels: 5 },
      { name: 'TypeScript', category: 'technical', subcategory: 'programming', proficiency_levels: 5 },
      { name: 'C#', category: 'technical', subcategory: 'programming', proficiency_levels: 5 },
      { name: 'Go', category: 'technical', subcategory: 'programming', proficiency_levels: 5 },
      { name: 'Rust', category: 'technical', subcategory: 'programming', proficiency_levels: 5 },
      { name: 'SQL', category: 'technical', subcategory: 'database', proficiency_levels: 5 },

      // Frameworks & Libraries
      { name: 'React', category: 'technical', subcategory: 'frontend', proficiency_levels: 5 },
      { name: 'Vue.js', category: 'technical', subcategory: 'frontend', proficiency_levels: 5 },
      { name: 'Angular', category: 'technical', subcategory: 'frontend', proficiency_levels: 5 },
      { name: 'Node.js', category: 'technical', subcategory: 'backend', proficiency_levels: 5 },
      { name: 'Express.js', category: 'technical', subcategory: 'backend', proficiency_levels: 5 },
      { name: 'Django', category: 'technical', subcategory: 'backend', proficiency_levels: 5 },
      { name: 'Spring Boot', category: 'technical', subcategory: 'backend', proficiency_levels: 5 },

      // Cloud & DevOps
      { name: 'AWS', category: 'technical', subcategory: 'cloud', proficiency_levels: 5 },
      { name: 'Azure', category: 'technical', subcategory: 'cloud', proficiency_levels: 5 },
      { name: 'Google Cloud Platform', category: 'technical', subcategory: 'cloud', proficiency_levels: 5 },
      { name: 'Docker', category: 'technical', subcategory: 'devops', proficiency_levels: 5 },
      { name: 'Kubernetes', category: 'technical', subcategory: 'devops', proficiency_levels: 5 },
      { name: 'Jenkins', category: 'technical', subcategory: 'devops', proficiency_levels: 5 },
      { name: 'Terraform', category: 'technical', subcategory: 'devops', proficiency_levels: 5 },

      // Data & AI
      { name: 'Machine Learning', category: 'technical', subcategory: 'ai', proficiency_levels: 5 },
      { name: 'Deep Learning', category: 'technical', subcategory: 'ai', proficiency_levels: 5 },
      { name: 'TensorFlow', category: 'technical', subcategory: 'ai', proficiency_levels: 5 },
      { name: 'PyTorch', category: 'technical', subcategory: 'ai', proficiency_levels: 5 },
      { name: 'Data Analysis', category: 'technical', subcategory: 'data', proficiency_levels: 5 },
      { name: 'PostgreSQL', category: 'technical', subcategory: 'database', proficiency_levels: 5 },
      { name: 'MongoDB', category: 'technical', subcategory: 'database', proficiency_levels: 5 },
      { name: 'Redis', category: 'technical', subcategory: 'database', proficiency_levels: 5 }
    ];

    // Step 2: Soft Skills
    console.log('🤝 Adding Soft Skills...');

    const softSkills = [
      { name: 'Communication', category: 'soft', subcategory: 'interpersonal', proficiency_levels: 5 },
      { name: 'Teamwork', category: 'soft', subcategory: 'interpersonal', proficiency_levels: 5 },
      { name: 'Problem Solving', category: 'soft', subcategory: 'cognitive', proficiency_levels: 5 },
      { name: 'Critical Thinking', category: 'soft', subcategory: 'cognitive', proficiency_levels: 5 },
      { name: 'Adaptability', category: 'soft', subcategory: 'personal', proficiency_levels: 5 },
      { name: 'Time Management', category: 'soft', subcategory: 'organizational', proficiency_levels: 5 },
      { name: 'Attention to Detail', category: 'soft', subcategory: 'personal', proficiency_levels: 5 },
      { name: 'Creative Thinking', category: 'soft', subcategory: 'cognitive', proficiency_levels: 5 },
      { name: 'Emotional Intelligence', category: 'soft', subcategory: 'interpersonal', proficiency_levels: 5 },
      { name: 'Conflict Resolution', category: 'soft', subcategory: 'interpersonal', proficiency_levels: 5 },
      { name: 'Public Speaking', category: 'soft', subcategory: 'communication', proficiency_levels: 5 },
      { name: 'Active Listening', category: 'soft', subcategory: 'communication', proficiency_levels: 5 },
      { name: 'Negotiation', category: 'soft', subcategory: 'interpersonal', proficiency_levels: 5 },
      { name: 'Decision Making', category: 'soft', subcategory: 'cognitive', proficiency_levels: 5 }
    ];

    // Step 3: Leadership Skills
    console.log('👔 Adding Leadership Skills...');

    const leadershipSkills = [
      { name: 'Team Leadership', category: 'leadership', subcategory: 'management', proficiency_levels: 5 },
      { name: 'Strategic Planning', category: 'leadership', subcategory: 'strategy', proficiency_levels: 5 },
      { name: 'Project Management', category: 'leadership', subcategory: 'management', proficiency_levels: 5 },
      { name: 'People Management', category: 'leadership', subcategory: 'management', proficiency_levels: 5 },
      { name: 'Change Management', category: 'leadership', subcategory: 'strategy', proficiency_levels: 5 },
      { name: 'Performance Management', category: 'leadership', subcategory: 'management', proficiency_levels: 5 },
      { name: 'Coaching & Mentoring', category: 'leadership', subcategory: 'development', proficiency_levels: 5 },
      { name: 'Vision Setting', category: 'leadership', subcategory: 'strategy', proficiency_levels: 5 },
      { name: 'Stakeholder Management', category: 'leadership', subcategory: 'management', proficiency_levels: 5 },
      { name: 'Budget Management', category: 'leadership', subcategory: 'management', proficiency_levels: 5 }
    ];

    // Step 4: Domain Knowledge Skills
    console.log('📚 Adding Domain Knowledge Skills...');

    const domainSkills = [
      { name: 'Financial Analysis', category: 'domain', subcategory: 'finance', proficiency_levels: 5 },
      { name: 'Marketing Strategy', category: 'domain', subcategory: 'marketing', proficiency_levels: 5 },
      { name: 'Sales Methodology', category: 'domain', subcategory: 'sales', proficiency_levels: 5 },
      { name: 'Human Resources', category: 'domain', subcategory: 'hr', proficiency_levels: 5 },
      { name: 'Legal Compliance', category: 'domain', subcategory: 'legal', proficiency_levels: 5 },
      { name: 'Supply Chain Management', category: 'domain', subcategory: 'operations', proficiency_levels: 5 },
      { name: 'Quality Assurance', category: 'domain', subcategory: 'operations', proficiency_levels: 5 },
      { name: 'Business Intelligence', category: 'domain', subcategory: 'analytics', proficiency_levels: 5 },
      { name: 'Customer Success', category: 'domain', subcategory: 'customer', proficiency_levels: 5 },
      { name: 'Product Management', category: 'domain', subcategory: 'product', proficiency_levels: 5 }
    ];

    // Step 5: Language Skills
    console.log('🌍 Adding Language Skills...');

    const languageSkills = [
      { name: 'English', category: 'language', subcategory: 'spoken', proficiency_levels: 6 }, // A1, A2, B1, B2, C1, C2
      { name: 'Italian', category: 'language', subcategory: 'spoken', proficiency_levels: 6 },
      { name: 'Spanish', category: 'language', subcategory: 'spoken', proficiency_levels: 6 },
      { name: 'French', category: 'language', subcategory: 'spoken', proficiency_levels: 6 },
      { name: 'German', category: 'language', subcategory: 'spoken', proficiency_levels: 6 },
      { name: 'Portuguese', category: 'language', subcategory: 'spoken', proficiency_levels: 6 },
      { name: 'Mandarin Chinese', category: 'language', subcategory: 'spoken', proficiency_levels: 6 },
      { name: 'Japanese', category: 'language', subcategory: 'spoken', proficiency_levels: 6 }
    ];

    // Combine all skills
    const allSkills = [
      ...technicalSkills,
      ...softSkills,
      ...leadershipSkills,
      ...domainSkills,
      ...languageSkills
    ];

    console.log(`📊 Preparing to insert ${allSkills.length} skills into taxonomy...`);

    // Step 6: Bulk insert skills
    const skillInserts = [];
    const categoryMap = {
      'technical': 'technical',
      'soft': 'soft',
      'leadership': 'leadership',
      'domain': 'domain',
      'language': 'language'
    };

    for (const skill of allSkills) {
      const skillId = uuidv4();
      skillInserts.push({
        skill_id: skillId,
        skill_name: skill.name,
        category_id: categoryMap[skill.category],
        subcategory: skill.subcategory,
        description: `${skill.name} - ${skill.category} skill in ${skill.subcategory}`,
        proficiency_levels: skill.proficiency_levels,
        is_active: true,
        source_id: 'internal',
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Insert skills in batches
    const batchSize = 50;
    let totalInserted = 0;

    for (let i = 0; i < skillInserts.length; i += batchSize) {
      const batch = skillInserts.slice(i, i + batchSize);

      await sequelize.query(`
        INSERT INTO skills_master (skill_id, skill_name, category_id, subcategory, description, proficiency_levels, is_active, source_id, created_at, updated_at)
        VALUES ${batch.map((_, index) =>
          `($${index * 10 + 1}, $${index * 10 + 2}, $${index * 10 + 3}, $${index * 10 + 4}, $${index * 10 + 5}, $${index * 10 + 6}, $${index * 10 + 7}, $${index * 10 + 8}, $${index * 10 + 9}, $${index * 10 + 10})`
        ).join(', ')}
      `, {
        bind: batch.flatMap(skill => [
          skill.skill_id, skill.skill_name, skill.category_id, skill.subcategory,
          skill.description, skill.proficiency_levels, skill.is_active, skill.source_id,
          skill.created_at, skill.updated_at
        ]),
        transaction
      });

      totalInserted += batch.length;
      console.log(`   ✓ Inserted ${totalInserted}/${skillInserts.length} skills`);
    }

    // Step 7: Create skill relationships (similar skills, prerequisites, etc.)
    console.log('🔗 Creating skill relationships...');

    const relationships = [
      // Programming language relationships
      { parent: 'JavaScript', child: 'TypeScript', type: 'prerequisite' },
      { parent: 'JavaScript', child: 'React', type: 'prerequisite' },
      { parent: 'JavaScript', child: 'Vue.js', type: 'prerequisite' },
      { parent: 'JavaScript', child: 'Node.js', type: 'prerequisite' },
      { parent: 'Python', child: 'Django', type: 'prerequisite' },
      { parent: 'Python', child: 'Machine Learning', type: 'prerequisite' },
      { parent: 'Python', child: 'Data Analysis', type: 'prerequisite' },

      // Similar skills
      { parent: 'React', child: 'Vue.js', type: 'similar' },
      { parent: 'AWS', child: 'Azure', type: 'similar' },
      { parent: 'Docker', child: 'Kubernetes', type: 'complementary' },
      { parent: 'Machine Learning', child: 'Deep Learning', type: 'prerequisite' },

      // Soft skill relationships
      { parent: 'Communication', child: 'Public Speaking', type: 'complementary' },
      { parent: 'Communication', child: 'Active Listening', type: 'complementary' },
      { parent: 'Team Leadership', child: 'People Management', type: 'complementary' },
      { parent: 'Problem Solving', child: 'Critical Thinking', type: 'complementary' }
    ];

    for (const rel of relationships) {
      // Find skill IDs by name
      const [parentResult] = await sequelize.query(`
        SELECT skill_id FROM skills_master WHERE skill_name = $1 LIMIT 1
      `, { bind: [rel.parent], transaction });

      const [childResult] = await sequelize.query(`
        SELECT skill_id FROM skills_master WHERE skill_name = $1 LIMIT 1
      `, { bind: [rel.child], transaction });

      if (parentResult.length > 0 && childResult.length > 0) {
        await sequelize.query(`
          INSERT INTO skills_relationships (relationship_id, parent_skill_id, child_skill_id, relationship_type, strength, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (parent_skill_id, child_skill_id, relationship_type) DO NOTHING
        `, {
          bind: [
            uuidv4(),
            parentResult[0].skill_id,
            childResult[0].skill_id,
            rel.type,
            0.8, // Default relationship strength
            true,
            new Date(),
            new Date()
          ],
          transaction
        });
      }
    }

    // Step 8: Create skill synonyms
    console.log('📝 Creating skill synonyms...');

    const synonyms = [
      { skill: 'JavaScript', synonym: 'JS' },
      { skill: 'TypeScript', synonym: 'TS' },
      { skill: 'Machine Learning', synonym: 'ML' },
      { skill: 'Artificial Intelligence', synonym: 'AI' },
      { skill: 'User Interface', synonym: 'UI' },
      { skill: 'User Experience', synonym: 'UX' },
      { skill: 'Application Programming Interface', synonym: 'API' },
      { skill: 'Continuous Integration', synonym: 'CI' },
      { skill: 'Continuous Deployment', synonym: 'CD' },
      { skill: 'Search Engine Optimization', synonym: 'SEO' }
    ];

    for (const syn of synonyms) {
      const [skillResult] = await sequelize.query(`
        SELECT skill_id FROM skills_master WHERE skill_name = $1 LIMIT 1
      `, { bind: [syn.skill], transaction });

      if (skillResult.length > 0) {
        await sequelize.query(`
          INSERT INTO skills_synonyms (synonym_id, skill_id, synonym_text, language_code, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (skill_id, synonym_text, language_code) DO NOTHING
        `, {
          bind: [
            uuidv4(),
            skillResult[0].skill_id,
            syn.synonym,
            'en',
            true,
            new Date(),
            new Date()
          ],
          transaction
        });
      }
    }

    // Step 9: Update system configuration
    await sequelize.query(`
      UPDATE system_configuration
      SET config_value = '1.0.0', updated_at = NOW()
      WHERE config_key = 'skills_taxonomy_version'
    `, { transaction });

    await transaction.commit();

    console.log('\n✨ Skills Taxonomy populated successfully!');
    console.log('📈 Summary:');
    console.log(`   - Total skills added: ${totalInserted}`);
    console.log(`   - Technical skills: ${technicalSkills.length}`);
    console.log(`   - Soft skills: ${softSkills.length}`);
    console.log(`   - Leadership skills: ${leadershipSkills.length}`);
    console.log(`   - Domain skills: ${domainSkills.length}`);
    console.log(`   - Language skills: ${languageSkills.length}`);
    console.log(`   - Skill relationships: ${relationships.length}`);
    console.log(`   - Skill synonyms: ${synonyms.length}`);

    return {
      skills_added: totalInserted,
      relationships_created: relationships.length,
      synonyms_created: synonyms.length,
      version: '1.0.0'
    };

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error during skills taxonomy population:', error);
    throw error;
  }
}

// Run the population script
if (require.main === module) {
  populateSkillsTaxonomy()
    .then((result) => {
      console.log('\n🏁 Skills taxonomy population completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Skills taxonomy population failed:', error);
      process.exit(1);
    });
}

module.exports = { populateSkillsTaxonomy };