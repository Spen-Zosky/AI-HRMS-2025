'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // WEF Future of Jobs 2023 Top Skills Categories
    const skillCategories = {
      cognitive: {
        name: 'Cognitive Skills',
        type: 'soft',
        skills: [
          { name: 'Analytical thinking', description: 'Ability to analyze information and solve complex problems systematically' },
          { name: 'Creative thinking', description: 'Ability to think outside the box and generate innovative solutions' },
          { name: 'Critical thinking and analysis', description: 'Ability to objectively evaluate information and make reasoned judgments' },
          { name: 'Complex problem-solving', description: 'Ability to solve novel, ill-defined problems in complex, real-world settings' },
          { name: 'Reasoning and ideation', description: 'Ability to reason logically and generate creative ideas' },
          { name: 'Systems thinking', description: 'Ability to understand complex systems and their interconnections' },
        ]
      },
      management: {
        name: 'Management Skills',
        type: 'leadership',
        skills: [
          { name: 'Leadership and social influence', description: 'Ability to lead teams and influence others positively' },
          { name: 'Resource management and operations', description: 'Ability to efficiently manage resources and operations' },
          { name: 'Talent management', description: 'Ability to attract, develop, and retain talented individuals' },
          { name: 'Decision-making', description: 'Ability to make timely and effective decisions' },
          { name: 'Project management', description: 'Ability to plan, execute, and complete projects successfully' },
          { name: 'Change management', description: 'Ability to manage organizational change effectively' },
        ]
      },
      selfManagement: {
        name: 'Self-Management',
        type: 'soft',
        skills: [
          { name: 'Resilience, flexibility and agility', description: 'Ability to adapt and bounce back from challenges' },
          { name: 'Motivation and self-awareness', description: 'Understanding of personal strengths and maintaining motivation' },
          { name: 'Curiosity and lifelong learning', description: 'Continuous desire to learn and grow' },
          { name: 'Dependability and attention to detail', description: 'Reliability and focus on quality' },
          { name: 'Empathy and active listening', description: 'Understanding others and listening effectively' },
          { name: 'Quality control', description: 'Ensuring standards are met consistently' },
        ]
      },
      technology: {
        name: 'Technology Skills',
        type: 'technical',
        skills: [
          { name: 'AI and big data', description: 'Understanding and working with artificial intelligence and large datasets' },
          { name: 'Programming', description: 'Ability to write and understand computer code' },
          { name: 'Networks and cybersecurity', description: 'Understanding of network infrastructure and security practices' },
          { name: 'Cloud computing', description: 'Knowledge of cloud platforms and services' },
          { name: 'Data analysis and visualization', description: 'Ability to analyze and present data effectively' },
          { name: 'Digital literacy', description: 'Proficiency with digital tools and platforms' },
        ]
      },
      workingWithOthers: {
        name: 'Working with Others',
        type: 'soft',
        skills: [
          { name: 'Teamwork and collaboration', description: 'Ability to work effectively in teams' },
          { name: 'Communication', description: 'Clear and effective verbal and written communication' },
          { name: 'Customer orientation', description: 'Focus on understanding and meeting customer needs' },
          { name: 'Service orientation and customer service', description: 'Commitment to helping others and providing excellent service' },
          { name: 'Negotiation', description: 'Ability to reach mutually beneficial agreements' },
          { name: 'Conflict resolution', description: 'Ability to resolve disagreements constructively' },
        ]
      }
    };

    // Programming Languages and Frameworks
    const technicalSkills = [
      // Programming Languages
      { name: 'JavaScript', type: 'technical', description: 'High-level programming language for web development' },
      { name: 'Python', type: 'technical', description: 'Versatile programming language for data science and web development' },
      { name: 'Java', type: 'technical', description: 'Object-oriented programming language for enterprise applications' },
      { name: 'TypeScript', type: 'technical', description: 'Typed superset of JavaScript' },
      { name: 'C#', type: 'technical', description: 'Microsoft programming language for .NET framework', code: 'csharp' },
      { name: 'Go', type: 'technical', description: 'Google programming language for system programming' },
      { name: 'Rust', type: 'technical', description: 'Systems programming language focused on safety' },
      { name: 'Swift', type: 'technical', description: 'Apple programming language for iOS development' },
      { name: 'Kotlin', type: 'technical', description: 'Modern programming language for Android development' },
      { name: 'Ruby', type: 'technical', description: 'Dynamic programming language for web development' },
      { name: 'PHP', type: 'technical', description: 'Server-side scripting language' },
      { name: 'C++', type: 'technical', description: 'Low-level programming language for system programming', code: 'cplusplus' },
      { name: 'SQL', type: 'technical', description: 'Language for managing relational databases' },
      { name: 'R', type: 'technical', description: 'Programming language for statistical computing' },
      { name: 'Scala', type: 'technical', description: 'Functional programming language for JVM' },

      // Web Frameworks
      { name: 'React', type: 'technical', description: 'JavaScript library for building user interfaces' },
      { name: 'Angular', type: 'technical', description: 'TypeScript framework for web applications' },
      { name: 'Vue.js', type: 'technical', description: 'Progressive JavaScript framework' },
      { name: 'Node.js', type: 'technical', description: 'JavaScript runtime for server-side development' },
      { name: 'Express.js', type: 'technical', description: 'Web framework for Node.js' },
      { name: 'Django', type: 'technical', description: 'Python web framework' },
      { name: 'Flask', type: 'technical', description: 'Lightweight Python web framework' },
      { name: 'Spring Boot', type: 'technical', description: 'Java framework for microservices' },
      { name: 'Laravel', type: 'technical', description: 'PHP web framework' },
      { name: 'Ruby on Rails', type: 'technical', description: 'Ruby web framework' },
      { name: 'ASP.NET', type: 'technical', description: 'Microsoft web framework' },
      { name: 'Next.js', type: 'technical', description: 'React framework for production' },
      { name: 'Nuxt.js', type: 'technical', description: 'Vue.js framework for server-side rendering' },

      // Databases
      { name: 'PostgreSQL', type: 'technical', description: 'Advanced open-source relational database' },
      { name: 'MySQL', type: 'technical', description: 'Popular open-source relational database' },
      { name: 'MongoDB', type: 'technical', description: 'NoSQL document database' },
      { name: 'Redis', type: 'technical', description: 'In-memory data structure store' },
      { name: 'Elasticsearch', type: 'technical', description: 'Search and analytics engine' },
      { name: 'Oracle Database', type: 'technical', description: 'Enterprise relational database' },
      { name: 'SQL Server', type: 'technical', description: 'Microsoft relational database' },
      { name: 'Cassandra', type: 'technical', description: 'Distributed NoSQL database' },
      { name: 'DynamoDB', type: 'technical', description: 'AWS NoSQL database service' },

      // Cloud & DevOps
      { name: 'AWS', type: 'technical', description: 'Amazon Web Services cloud platform' },
      { name: 'Azure', type: 'technical', description: 'Microsoft cloud computing platform' },
      { name: 'Google Cloud Platform', type: 'technical', description: 'Google cloud services' },
      { name: 'Docker', type: 'technical', description: 'Container platform for applications' },
      { name: 'Kubernetes', type: 'technical', description: 'Container orchestration platform' },
      { name: 'Jenkins', type: 'technical', description: 'Automation server for CI/CD' },
      { name: 'GitLab CI/CD', type: 'technical', description: 'GitLab continuous integration and delivery' },
      { name: 'GitHub Actions', type: 'technical', description: 'GitHub automation and CI/CD' },
      { name: 'Terraform', type: 'technical', description: 'Infrastructure as code tool' },
      { name: 'Ansible', type: 'technical', description: 'Automation and configuration management' },

      // AI/ML
      { name: 'Machine Learning', type: 'technical', description: 'Building systems that learn from data' },
      { name: 'Deep Learning', type: 'technical', description: 'Neural network-based machine learning' },
      { name: 'Natural Language Processing', type: 'technical', description: 'Processing and analyzing human language' },
      { name: 'Computer Vision', type: 'technical', description: 'Enabling computers to interpret visual information' },
      { name: 'TensorFlow', type: 'technical', description: 'Open-source machine learning framework' },
      { name: 'PyTorch', type: 'technical', description: 'Machine learning library for Python' },
      { name: 'Scikit-learn', type: 'technical', description: 'Machine learning library for Python' },
      { name: 'Pandas', type: 'technical', description: 'Data manipulation library for Python' },
      { name: 'NumPy', type: 'technical', description: 'Numerical computing library for Python' },
    ];

    // Business Skills
    const businessSkills = [
      { name: 'Strategic Planning', type: 'business', description: 'Developing long-term organizational strategies' },
      { name: 'Business Analysis', type: 'business', description: 'Analyzing business needs and solutions' },
      { name: 'Financial Management', type: 'business', description: 'Managing financial resources effectively' },
      { name: 'Marketing Strategy', type: 'business', description: 'Developing and implementing marketing plans' },
      { name: 'Sales Management', type: 'business', description: 'Leading and optimizing sales processes' },
      { name: 'Product Management', type: 'business', description: 'Managing product lifecycle and strategy' },
      { name: 'Business Development', type: 'business', description: 'Identifying and developing growth opportunities' },
      { name: 'Risk Management', type: 'business', description: 'Identifying and mitigating business risks' },
      { name: 'Supply Chain Management', type: 'business', description: 'Managing supply chain operations' },
      { name: 'Quality Assurance', type: 'business', description: 'Ensuring product and service quality' },
      { name: 'Customer Success', type: 'business', description: 'Ensuring customer satisfaction and retention' },
      { name: 'Data-Driven Decision Making', type: 'business', description: 'Using data to inform business decisions' },
      { name: 'Digital Marketing', type: 'business', description: 'Marketing through digital channels' },
      { name: 'Content Strategy', type: 'business', description: 'Planning and managing content creation' },
      { name: 'Brand Management', type: 'business', description: 'Building and maintaining brand value' },
    ];

    // Digital Skills
    const digitalSkills = [
      { name: 'Digital Transformation', type: 'digital', description: 'Leading organizational digital change' },
      { name: 'Cybersecurity Awareness', type: 'digital', description: 'Understanding digital security threats and practices' },
      { name: 'Data Privacy', type: 'digital', description: 'Managing and protecting personal data' },
      { name: 'Social Media Management', type: 'digital', description: 'Managing organizational social media presence' },
      { name: 'E-commerce', type: 'digital', description: 'Understanding online commerce platforms and strategies' },
      { name: 'Digital Analytics', type: 'digital', description: 'Analyzing digital metrics and user behavior' },
      { name: 'SEO/SEM', type: 'digital', description: 'Search engine optimization and marketing' },
      { name: 'UX/UI Design', type: 'digital', description: 'Designing user experiences and interfaces' },
      { name: 'Mobile Development', type: 'digital', description: 'Developing applications for mobile devices' },
      { name: 'Blockchain', type: 'digital', description: 'Understanding distributed ledger technology' },
      { name: 'Internet of Things (IoT)', type: 'digital', description: 'Working with connected devices and sensors' },
      { name: 'Augmented Reality (AR)', type: 'digital', description: 'Creating AR experiences and applications' },
      { name: 'Virtual Reality (VR)', type: 'digital', description: 'Developing VR environments and applications' },
      { name: 'Robotic Process Automation', type: 'digital', description: 'Automating repetitive business processes' },
      { name: 'Low-Code/No-Code Development', type: 'digital', description: 'Building applications without traditional coding' },
    ];

    // Prepare all skills for insertion
    const allSkills = [];

    // Add WEF categorized skills
    for (const [categoryKey, category] of Object.entries(skillCategories)) {
      for (const skill of category.skills) {
        allSkills.push({
          skill_id: uuidv4(),
          skill_name: skill.name,
          skill_code: skill.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
          skill_description: skill.description,
          skill_type: category.type,
          source_taxonomy: 'WEF',
          skill_level: 1,
          is_emerging: true,
          market_demand: 'high',
          created_at: now,
          updated_at: now
        });
      }
    }

    // Add technical skills
    for (const skill of technicalSkills) {
      allSkills.push({
        skill_id: uuidv4(),
        skill_name: skill.name,
        skill_code: skill.code || skill.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').replace(/\./g, ''),
        skill_description: skill.description,
        skill_type: skill.type,
        source_taxonomy: 'Custom',
        skill_level: 1,
        is_emerging: ['React', 'Python', 'AWS', 'Kubernetes', 'Machine Learning'].includes(skill.name),
        market_demand: ['React', 'Python', 'AWS', 'Kubernetes', 'Machine Learning'].includes(skill.name) ? 'very_high' : 'medium',
        created_at: now,
        updated_at: now
      });
    }

    // Add business skills
    for (const skill of businessSkills) {
      allSkills.push({
        skill_id: uuidv4(),
        skill_name: skill.name,
        skill_code: skill.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
        skill_description: skill.description,
        skill_type: skill.type,
        source_taxonomy: 'Custom',
        skill_level: 1,
        is_emerging: ['Product Management', 'Data-Driven Decision Making'].includes(skill.name),
        market_demand: ['Product Management', 'Data-Driven Decision Making'].includes(skill.name) ? 'high' : 'medium',
        created_at: now,
        updated_at: now
      });
    }

    // Add digital skills
    for (const skill of digitalSkills) {
      allSkills.push({
        skill_id: uuidv4(),
        skill_name: skill.name,
        skill_code: skill.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
        skill_description: skill.description,
        skill_type: skill.type,
        source_taxonomy: 'Custom',
        skill_level: 1,
        is_emerging: ['Digital Transformation', 'Cybersecurity Awareness', 'UX/UI Design'].includes(skill.name),
        market_demand: ['Digital Transformation', 'Cybersecurity Awareness', 'UX/UI Design'].includes(skill.name) ? 'very_high' : 'medium',
        created_at: now,
        updated_at: now
      });
    }

    // Insert skills in batches
    const batchSize = 100;
    for (let i = 0; i < allSkills.length; i += batchSize) {
      const batch = allSkills.slice(i, i + batchSize);
      await queryInterface.bulkInsert('skills_master', batch, {});
    }

    console.log(`✅ Inserted ${allSkills.length} skills into the database`);

    // Create some skill relationships
    const relationships = [];
    const skillMap = {};

    // Create a map for easy lookup
    allSkills.forEach(skill => {
      skillMap[skill.skill_name] = skill.skill_id;
    });

    // Define some relationships
    const relationshipDefs = [
      // Programming prerequisites
      { from: 'JavaScript', to: 'React', type: 'prerequisite' },
      { from: 'JavaScript', to: 'Node.js', type: 'prerequisite' },
      { from: 'JavaScript', to: 'TypeScript', type: 'prerequisite' },
      { from: 'Python', to: 'Django', type: 'prerequisite' },
      { from: 'Python', to: 'Machine Learning', type: 'prerequisite' },
      { from: 'Java', to: 'Spring Boot', type: 'prerequisite' },

      // Complementary skills
      { from: 'React', to: 'Next.js', type: 'complementary' },
      { from: 'Vue.js', to: 'Nuxt.js', type: 'complementary' },
      { from: 'Docker', to: 'Kubernetes', type: 'complementary' },
      { from: 'AWS', to: 'Terraform', type: 'complementary' },

      // Advancement paths
      { from: 'Project management', to: 'Strategic Planning', type: 'builds_on' },
      { from: 'Business Analysis', to: 'Product Management', type: 'builds_on' },
    ];

    for (const rel of relationshipDefs) {
      if (skillMap[rel.from] && skillMap[rel.to]) {
        relationships.push({
          relationship_id: uuidv4(),
          source_skill_id: skillMap[rel.from],
          target_skill_id: skillMap[rel.to],
          relationship_type: rel.type,
          strength: 1.0,
          created_at: now
        });
      }
    }

    if (relationships.length > 0) {
      await queryInterface.bulkInsert('skills_relationships', relationships, {});
      console.log(`✅ Created ${relationships.length} skill relationships`);
    }

    // Add skill synonyms
    const synonyms = [
      { skill: 'JavaScript', synonyms: ['JS', 'ECMAScript', 'ES6', 'ES2015'] },
      { skill: 'Python', synonyms: ['Python3', 'Python 3', 'Py'] },
      { skill: 'Machine Learning', synonyms: ['ML', 'Machine-Learning', 'MachineLearning'] },
      { skill: 'Artificial Intelligence', synonyms: ['AI', 'A.I.', 'Artificial-Intelligence'] },
      { skill: 'User Experience', synonyms: ['UX', 'User-Experience', 'UserExperience'] },
      { skill: 'User Interface', synonyms: ['UI', 'User-Interface', 'UserInterface'] },
      { skill: 'DevOps', synonyms: ['Dev-Ops', 'Development Operations'] },
      { skill: 'CI/CD', synonyms: ['CICD', 'Continuous Integration', 'Continuous Delivery'] },
    ];

    const synonymEntries = [];
    for (const item of synonyms) {
      if (skillMap[item.skill]) {
        for (const syn of item.synonyms) {
          synonymEntries.push({
            synonym_id: uuidv4(),
            skill_id: skillMap[item.skill],
            synonym_text: syn,
            language_code: 'en',
            confidence_score: 1.0
          });
        }
      }
    }

    if (synonymEntries.length > 0) {
      await queryInterface.bulkInsert('skills_synonyms', synonymEntries, {});
      console.log(`✅ Created ${synonymEntries.length} skill synonyms`);
    }

    return true;
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('skills_synonyms', null, {});
    await queryInterface.bulkDelete('skills_relationships', null, {});
    await queryInterface.bulkDelete('skills_master', null, {});
  }
};