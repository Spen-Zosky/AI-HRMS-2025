const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const { SkillsMaster, SkillsRelationship, SkillsSynonyms, IndustrySkills } = require('../../models');
const { v4: uuidv4 } = require('uuid');

/**
 * Skills Taxonomy Importer - Import skills from multiple authoritative sources
 * Sources: WEF Future of Jobs 2023, O*NET, ESCO Classifications
 */
class SkillsTaxonomyImporter {
    constructor() {
        this.importedSkills = new Map();
        this.skillHierarchy = new Map();
        this.importStats = {
            wef: { imported: 0, skipped: 0, errors: 0 },
            onet: { imported: 0, skipped: 0, errors: 0 },
            esco: { imported: 0, skipped: 0, errors: 0 },
            total: { skills: 0, relationships: 0, synonyms: 0 }
        };
    }

    /**
     * Main import method - imports from all sources
     */
    async importAllTaxonomies() {
        try {
            logger.info('Starting comprehensive skills taxonomy import');

            // 1. Import WEF Future of Jobs 2023 skills
            await this.importWEFSkills();

            // 2. Import O*NET occupation skills
            await this.importONETSkills();

            // 3. Import ESCO classifications
            await this.importESCOSkills();

            // 4. Create skill relationships and hierarchies
            await this.buildSkillRelationships();

            // 5. Generate synonyms and variations
            await this.generateSkillSynonyms();

            // 6. Create industry mappings
            await this.createIndustryMappings();

            logger.info('Skills taxonomy import completed successfully', this.importStats);
            return this.importStats;

        } catch (error) {
            logger.error('Error importing skills taxonomy:', error);
            throw error;
        }
    }

    /**
     * Import WEF Future of Jobs 2023 skills data
     */
    async importWEFSkills() {
        logger.info('Importing WEF Future of Jobs 2023 skills');

        // WEF Future of Jobs 2023 Top Skills by Category
        const wefSkills = {
            'Core Skills for 2023': [
                // Top 10 skills that are growing in importance
                'Analytical thinking and innovation',
                'Active learning and learning strategies',
                'Complex problem-solving',
                'Critical thinking and analysis',
                'Creativity, originality and initiative',
                'Leadership and social influence',
                'Technology use, monitoring and control',
                'Technology design and programming',
                'Resilience, stress tolerance and flexibility',
                'Reasoning, problem-solving and ideation'
            ],
            'Emerging Skills 2023': [
                // Skills experiencing the fastest growth
                'AI and machine learning',
                'Sustainability',
                'Big data analytics',
                'Networks and cybersecurity',
                'Software and applications development',
                'Data analysis and visualization',
                'Digital marketing and strategy',
                'Internet of things',
                'Cloud computing',
                'Blockchain',
                'Digital transformation',
                'Robotic process automation',
                'Systems analysis',
                'User experience design',
                'Service orientation',
                'Social media',
                'Mobile app development',
                'E-commerce',
                'Computer graphics and multimedia',
                'Augmented reality'
            ],
            'Human Skills': [
                // Skills that remain uniquely human
                'Emotional intelligence',
                'Teaching and mentoring',
                'Service orientation and customer service',
                'Social perceptiveness',
                'Negotiation and persuasion',
                'Empathy and active listening',
                'Dependability and attention to detail',
                'Ethics and integrity',
                'Collaboration and teamwork',
                'Cultural awareness and sensitivity',
                'Adaptability and flexibility',
                'Time management and organization',
                'Public speaking and presentation',
                'Conflict resolution',
                'Decision making',
                'Interpersonal communication'
            ],
            'Technical Skills': [
                // Technical skills in high demand
                'Programming and software development',
                'Data science and analytics',
                'DevOps and system administration',
                'Product management',
                'Quality assurance and testing',
                'Database design and management',
                'Network administration',
                'Information security',
                'Technical writing',
                'Systems integration',
                'API development',
                'Mobile development',
                'Web development',
                'Machine learning engineering',
                'Data engineering',
                'Cloud architecture',
                'Microservices architecture',
                'Containerization'
            ],
            'Business Skills': [
                // Business and management skills
                'Strategic thinking and planning',
                'Project management',
                'Business analysis',
                'Financial analysis and planning',
                'Marketing and brand management',
                'Sales and business development',
                'Supply chain management',
                'Risk management',
                'Change management',
                'Process improvement',
                'Stakeholder management',
                'Budget management',
                'Performance management',
                'Vendor management',
                'Compliance and governance'
            ],
            'Digital Literacy': [
                // Essential digital skills
                'Digital communication tools',
                'Spreadsheet and database software',
                'Presentation software',
                'Content management systems',
                'Digital collaboration platforms',
                'Basic coding and scripting',
                'Digital security awareness',
                'Data privacy and protection',
                'Digital workflow automation',
                'Online research and evaluation',
                'Digital content creation',
                'Social media management',
                'Digital project management tools',
                'Customer relationship management',
                'Enterprise resource planning'
            ],
            'Green Skills': [
                // Sustainability and environmental skills
                'Environmental compliance',
                'Sustainable development',
                'Renewable energy systems',
                'Carbon footprint analysis',
                'Waste management and recycling',
                'Environmental impact assessment',
                'Green building and construction',
                'Sustainable supply chain',
                'Energy efficiency',
                'Climate change adaptation',
                'Circular economy principles',
                'Environmental reporting',
                'Green finance',
                'Sustainable agriculture',
                'Water management'
            ]
        };

        for (const [category, skills] of Object.entries(wefSkills)) {
            for (const skillName of skills) {
                try {
                    await this.importSkill({
                        name: skillName,
                        category: 'WEF',
                        subcategory: category,
                        source: 'WEF Future of Jobs 2023',
                        description: `${skillName} - identified as a key skill in WEF Future of Jobs 2023`,
                        demand_level: this.getSkillDemandLevel(category),
                        is_emerging: category === 'Emerging Skills 2023',
                        growth_rate: this.getGrowthRate(category),
                        automation_risk: this.getAutomationRisk(category)
                    });

                    this.importStats.wef.imported++;
                } catch (error) {
                    logger.warn(`Failed to import WEF skill: ${skillName}`, error);
                    this.importStats.wef.errors++;
                }
            }
        }

        logger.info(`WEF import completed: ${this.importStats.wef.imported} skills imported`);
    }

    /**
     * Import O*NET occupation skills data
     */
    async importONETSkills() {
        logger.info('Importing O*NET occupation skills');

        // O*NET Skills by occupation category (simplified for demo - in production, use O*NET API)
        const onetSkills = {
            'Computer and Mathematical': [
                'Computer programming',
                'Software development',
                'Database administration',
                'Network systems analysis',
                'Information systems analysis',
                'Cybersecurity analysis',
                'Data analysis',
                'Statistical analysis',
                'Mathematical modeling',
                'Algorithm design'
            ],
            'Architecture and Engineering': [
                'Engineering design',
                'Technical drawing',
                'CAD software',
                'Project engineering',
                'Systems engineering',
                'Quality control',
                'Manufacturing processes',
                'Product development',
                'Testing and evaluation',
                'Technical documentation'
            ],
            'Life, Physical, and Social Science': [
                'Research methodology',
                'Laboratory techniques',
                'Data collection',
                'Scientific writing',
                'Hypothesis testing',
                'Experimental design',
                'Statistical software',
                'Literature review',
                'Grant writing',
                'Scientific presentation'
            ],
            'Management': [
                'Team leadership',
                'Strategic planning',
                'Budget planning',
                'Performance evaluation',
                'Policy development',
                'Organizational development',
                'Human resources management',
                'Operations management',
                'Risk assessment',
                'Decision analysis'
            ],
            'Business and Financial Operations': [
                'Financial analysis',
                'Market research',
                'Cost analysis',
                'Investment analysis',
                'Business intelligence',
                'Forecasting',
                'Accounting principles',
                'Tax preparation',
                'Audit procedures',
                'Compliance monitoring'
            ],
            'Sales and Marketing': [
                'Customer relationship management',
                'Market analysis',
                'Brand development',
                'Digital marketing',
                'Content marketing',
                'Sales strategy',
                'Lead generation',
                'Customer acquisition',
                'Price optimization',
                'Campaign management'
            ],
            'Healthcare': [
                'Patient care',
                'Medical terminology',
                'Clinical assessment',
                'Treatment planning',
                'Medical documentation',
                'Infection control',
                'Patient education',
                'Emergency response',
                'Medical devices',
                'Health informatics'
            ],
            'Education and Training': [
                'Curriculum development',
                'Instructional design',
                'Learning assessment',
                'Educational technology',
                'Classroom management',
                'Student counseling',
                'Learning disabilities support',
                'Online learning platforms',
                'Training delivery',
                'Performance coaching'
            ]
        };

        for (const [occupation, skills] of Object.entries(onetSkills)) {
            for (const skillName of skills) {
                try {
                    await this.importSkill({
                        name: skillName,
                        category: 'O*NET',
                        subcategory: occupation,
                        source: 'O*NET Database',
                        description: `${skillName} - occupational skill from O*NET database`,
                        demand_level: 'medium',
                        is_emerging: false,
                        growth_rate: 0.1,
                        automation_risk: this.getONETAutomationRisk(skillName)
                    });

                    this.importStats.onet.imported++;
                } catch (error) {
                    logger.warn(`Failed to import O*NET skill: ${skillName}`, error);
                    this.importStats.onet.errors++;
                }
            }
        }

        logger.info(`O*NET import completed: ${this.importStats.onet.imported} skills imported`);
    }

    /**
     * Import ESCO (European Skills/Competences/Qualifications) classifications
     */
    async importESCOSkills() {
        logger.info('Importing ESCO classifications');

        // ESCO Skills Framework (simplified for demo)
        const escoSkills = {
            'Transversal Skills': [
                'Problem solving',
                'Decision making',
                'Communication',
                'Teamwork',
                'Leadership',
                'Time management',
                'Adaptability',
                'Learning ability',
                'Initiative',
                'Reliability',
                'Stress management',
                'Multitasking',
                'Planning and organizing',
                'Attention to detail',
                'Customer focus'
            ],
            'Digital Skills': [
                'Digital content creation',
                'Digital communication',
                'Information processing',
                'Problem solving through digital technologies',
                'Digital security and safety',
                'Digital device usage',
                'Software usage',
                'Data management',
                'Online collaboration',
                'Digital learning',
                'Programming concepts',
                'Digital marketing',
                'E-commerce platforms',
                'Digital analytics',
                'Cybersecurity awareness'
            ],
            'Language Skills': [
                'Written communication',
                'Oral communication',
                'Language interpretation',
                'Translation',
                'Technical writing',
                'Business writing',
                'Academic writing',
                'Content writing',
                'Copywriting',
                'Proofreading',
                'Multilingual communication',
                'Cross-cultural communication',
                'Public speaking',
                'Presentation skills',
                'Documentation'
            ],
            'Mathematical Skills': [
                'Basic mathematics',
                'Statistics',
                'Data analysis',
                'Financial calculations',
                'Geometry',
                'Algebra',
                'Probability',
                'Mathematical modeling',
                'Quantitative analysis',
                'Measurement',
                'Estimation',
                'Mathematical reasoning',
                'Statistical software',
                'Spreadsheet analysis',
                'Financial modeling'
            ],
            'Science Skills': [
                'Scientific method',
                'Research skills',
                'Laboratory skills',
                'Data collection',
                'Hypothesis testing',
                'Experimental design',
                'Scientific writing',
                'Peer review',
                'Scientific presentation',
                'Evidence evaluation',
                'Literature analysis',
                'Scientific computing',
                'Research ethics',
                'Quality assurance',
                'Scientific instrumentation'
            ]
        };

        for (const [category, skills] of Object.entries(escoSkills)) {
            for (const skillName of skills) {
                try {
                    await this.importSkill({
                        name: skillName,
                        category: 'ESCO',
                        subcategory: category,
                        source: 'ESCO Classification',
                        description: `${skillName} - skill from ESCO European classification`,
                        demand_level: 'medium',
                        is_emerging: false,
                        growth_rate: 0.05,
                        automation_risk: this.getESCOAutomationRisk(category, skillName)
                    });

                    this.importStats.esco.imported++;
                } catch (error) {
                    logger.warn(`Failed to import ESCO skill: ${skillName}`, error);
                    this.importStats.esco.errors++;
                }
            }
        }

        logger.info(`ESCO import completed: ${this.importStats.esco.imported} skills imported`);
    }

    /**
     * Import individual skill into database
     */
    async importSkill(skillData) {
        const skillName = skillData.name.toLowerCase();

        // Check if skill already exists
        if (this.importedSkills.has(skillName)) {
            this.importStats[skillData.source === 'WEF Future of Jobs 2023' ? 'wef' :
                              skillData.source === 'O*NET Database' ? 'onet' : 'esco'].skipped++;
            return null;
        }

        const skillId = uuidv4();
        const skill = await SkillsMaster.create({
            skill_id: skillId,
            skill_name: skillData.name,
            skill_code: this.generateSkillCode(skillData.name),
            skill_description: skillData.description,
            skill_type: this.determineSkillType(skillData.name, skillData.category),
            proficiency_levels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
            source_taxonomy: skillData.source,
            skill_level: this.determineSkillLevel(skillData.category, skillData.subcategory),
            is_emerging: skillData.is_emerging,
            growth_rate: skillData.growth_rate,
            automation_risk: skillData.automation_risk,
            market_demand: skillData.demand_level,
            version: 1
        });

        this.importedSkills.set(skillName, skill);
        this.importStats.total.skills++;

        return skill;
    }

    /**
     * Build relationships between skills
     */
    async buildSkillRelationships() {
        logger.info('Building skill relationships and hierarchies');

        const relationships = [
            // Programming relationships
            { source: 'Programming and software development', target: 'Computer programming', type: 'prerequisite' },
            { source: 'Software development', target: 'Programming and software development', type: 'builds_on' },
            { source: 'API development', target: 'Programming and software development', type: 'builds_on' },
            { source: 'Mobile development', target: 'Programming and software development', type: 'builds_on' },
            { source: 'Web development', target: 'Programming and software development', type: 'builds_on' },

            // Data and AI relationships
            { source: 'AI and machine learning', target: 'Data analysis and visualization', type: 'prerequisite' },
            { source: 'Machine learning engineering', target: 'AI and machine learning', type: 'builds_on' },
            { source: 'Big data analytics', target: 'Data analysis and visualization', type: 'builds_on' },
            { source: 'Data science and analytics', target: 'Statistical analysis', type: 'prerequisite' },

            // Leadership relationships
            { source: 'Leadership and social influence', target: 'Team leadership', type: 'complementary' },
            { source: 'Team leadership', target: 'Emotional intelligence', type: 'prerequisite' },
            { source: 'Project management', target: 'Team leadership', type: 'complementary' },

            // Communication relationships
            { source: 'Public speaking and presentation', target: 'Communication', type: 'builds_on' },
            { source: 'Technical writing', target: 'Written communication', type: 'builds_on' },
            { source: 'Business writing', target: 'Written communication', type: 'builds_on' },

            // Technical infrastructure relationships
            { source: 'Cloud computing', target: 'Networks and cybersecurity', type: 'complementary' },
            { source: 'Cloud architecture', target: 'Cloud computing', type: 'builds_on' },
            { source: 'DevOps and system administration', target: 'Cloud computing', type: 'complementary' },
            { source: 'Containerization', target: 'Cloud computing', type: 'builds_on' },

            // Business relationships
            { source: 'Strategic thinking and planning', target: 'Business analysis', type: 'prerequisite' },
            { source: 'Financial analysis and planning', target: 'Financial analysis', type: 'builds_on' },
            { source: 'Marketing and brand management', target: 'Digital marketing and strategy', type: 'complementary' },

            // Research relationships
            { source: 'Research methodology', target: 'Scientific method', type: 'builds_on' },
            { source: 'Data collection', target: 'Research methodology', type: 'builds_on' },
            { source: 'Statistical analysis', target: 'Statistics', type: 'builds_on' }
        ];

        for (const rel of relationships) {
            try {
                const sourceSkill = this.findSkillByName(rel.source);
                const targetSkill = this.findSkillByName(rel.target);

                if (sourceSkill && targetSkill) {
                    await SkillsRelationship.create({
                        relationship_id: uuidv4(),
                        source_skill_id: sourceSkill.skill_id,
                        target_skill_id: targetSkill.skill_id,
                        relationship_type: rel.type,
                        strength: 0.8,
                        context: 'Automated taxonomy import'
                    });

                    this.importStats.total.relationships++;
                }
            } catch (error) {
                logger.warn(`Failed to create relationship: ${rel.source} -> ${rel.target}`, error);
            }
        }

        logger.info(`Created ${this.importStats.total.relationships} skill relationships`);
    }

    /**
     * Generate synonyms for skills
     */
    async generateSkillSynonyms() {
        logger.info('Generating skill synonyms and variations');

        const synonymMap = {
            'Programming and software development': ['Software engineering', 'Coding', 'Software development'],
            'AI and machine learning': ['Artificial intelligence', 'ML', 'Machine learning', 'AI/ML'],
            'Leadership and social influence': ['Leadership', 'Team leadership', 'Management'],
            'Communication': ['Interpersonal communication', 'Verbal communication', 'Communication skills'],
            'Project management': ['PM', 'Project coordination', 'Project delivery'],
            'Data analysis and visualization': ['Data analytics', 'Data viz', 'Business intelligence'],
            'Cloud computing': ['Cloud services', 'Cloud platforms', 'Cloud infrastructure'],
            'Digital marketing and strategy': ['Digital marketing', 'Online marketing', 'Internet marketing'],
            'Customer relationship management': ['CRM', 'Customer management', 'Client relations'],
            'Quality assurance and testing': ['QA', 'Software testing', 'Quality control'],
            'User experience design': ['UX design', 'UX/UI design', 'User-centered design'],
            'Financial analysis': ['Financial modeling', 'Financial planning', 'Budget analysis']
        };

        for (const [skillName, synonyms] of Object.entries(synonymMap)) {
            const skill = this.findSkillByName(skillName);
            if (skill) {
                for (const synonym of synonyms) {
                    try {
                        await SkillsSynonyms.create({
                            synonym_id: uuidv4(),
                            skill_id: skill.skill_id,
                            synonym_text: synonym,
                            language_code: 'en',
                            confidence_score: 0.9
                        });

                        this.importStats.total.synonyms++;
                    } catch (error) {
                        logger.warn(`Failed to create synonym: ${synonym} for ${skillName}`, error);
                    }
                }
            }
        }

        logger.info(`Created ${this.importStats.total.synonyms} skill synonyms`);
    }

    /**
     * Create industry mappings for skills
     */
    async createIndustryMappings() {
        logger.info('Creating industry-skill mappings');

        const industryMappings = {
            'Technology': [
                'Programming and software development', 'AI and machine learning', 'Cloud computing',
                'Data analysis and visualization', 'Networks and cybersecurity', 'DevOps and system administration',
                'Big data analytics', 'Software development', 'API development', 'Mobile development'
            ],
            'Healthcare': [
                'Patient care', 'Medical terminology', 'Clinical assessment', 'Treatment planning',
                'Medical documentation', 'Health informatics', 'Patient education', 'Emergency response'
            ],
            'Finance': [
                'Financial analysis', 'Risk management', 'Investment analysis', 'Accounting principles',
                'Financial modeling', 'Audit procedures', 'Compliance monitoring', 'Tax preparation'
            ],
            'Marketing': [
                'Digital marketing and strategy', 'Brand development', 'Customer relationship management',
                'Market research', 'Content marketing', 'Social media', 'Campaign management'
            ],
            'Manufacturing': [
                'Quality control', 'Manufacturing processes', 'Supply chain management',
                'Process improvement', 'Systems engineering', 'Product development'
            ]
        };

        for (const [industry, skills] of Object.entries(industryMappings)) {
            for (const skillName of skills) {
                const skill = this.findSkillByName(skillName);
                if (skill) {
                    try {
                        await IndustrySkills.create({
                            mapping_id: uuidv4(),
                            industry_name: industry,
                            skill_id: skill.skill_id,
                            importance_level: 'high',
                            frequency_score: 0.8,
                            trend_direction: 'growing'
                        });
                    } catch (error) {
                        logger.warn(`Failed to create industry mapping: ${industry} -> ${skillName}`, error);
                    }
                }
            }
        }

        logger.info('Industry-skill mappings created');
    }

    /**
     * Helper methods
     */
    findSkillByName(name) {
        return this.importedSkills.get(name.toLowerCase());
    }

    generateSkillCode(name) {
        return name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20).toUpperCase();
    }

    determineSkillType(name, category) {
        const nameLower = name.toLowerCase();

        // Technical skills patterns
        if (nameLower.includes('ai') || nameLower.includes('artificial intelligence') ||
            nameLower.includes('programming') || nameLower.includes('data') ||
            nameLower.includes('machine learning') || nameLower.includes('cloud') ||
            nameLower.includes('software') || nameLower.includes('python') ||
            nameLower.includes('javascript') || nameLower.includes('database') ||
            nameLower.includes('cybersecurity') || nameLower.includes('blockchain') ||
            nameLower.includes('analytics') || nameLower.includes('algorithm') ||
            nameLower.includes('coding') || nameLower.includes('technical') ||
            nameLower.includes('systems') || nameLower.includes('technology') ||
            nameLower.includes('digital') || nameLower.includes('automation')) {
            return 'technical';
        }

        // Leadership skills patterns
        if (nameLower.includes('leadership') || nameLower.includes('managing') ||
            nameLower.includes('supervision') || nameLower.includes('directing') ||
            nameLower.includes('strategic') || nameLower.includes('vision') ||
            nameLower.includes('coaching') || nameLower.includes('mentoring') ||
            nameLower.includes('team building') || nameLower.includes('decision making')) {
            return 'leadership';
        }

        // Soft skills patterns
        if (nameLower.includes('communication') || nameLower.includes('emotional') ||
            nameLower.includes('empathy') || nameLower.includes('collaboration') ||
            nameLower.includes('creativity') || nameLower.includes('adaptability') ||
            nameLower.includes('critical thinking') || nameLower.includes('problem solving') ||
            nameLower.includes('teamwork') || nameLower.includes('interpersonal') ||
            nameLower.includes('negotiation') || nameLower.includes('presentation') ||
            nameLower.includes('listening') || nameLower.includes('resilience') ||
            nameLower.includes('time management') || nameLower.includes('flexibility')) {
            return 'soft';
        }

        // Business skills patterns
        if (nameLower.includes('management') || nameLower.includes('business') ||
            nameLower.includes('financial') || nameLower.includes('marketing') ||
            nameLower.includes('sales') || nameLower.includes('operations') ||
            nameLower.includes('planning') || nameLower.includes('budgeting') ||
            nameLower.includes('project') || nameLower.includes('process') ||
            nameLower.includes('quality') || nameLower.includes('customer') ||
            nameLower.includes('vendor') || nameLower.includes('supply chain') ||
            nameLower.includes('risk management') || nameLower.includes('compliance')) {
            return 'business';
        }

        // Default fallback - classify as soft skill if nothing else matches
        return 'soft';
    }

    determineSkillLevel(category, subcategory) {
        // Return integer values: 0=Beginner, 1=Intermediate, 2=Advanced, 3=Expert
        if (subcategory?.includes('Core') || subcategory?.includes('Transversal')) {
            return 1; // Intermediate level for core skills
        }
        if (subcategory?.includes('Emerging') || subcategory?.includes('AI')) {
            return 2; // Advanced level for emerging skills
        }
        return 1; // Default to intermediate level
    }

    getSkillDemandLevel(category) {
        const demandMap = {
            'Core Skills for 2023': 'very_high',
            'Emerging Skills 2023': 'high',
            'Human Skills': 'high',
            'Technical Skills': 'very_high',
            'Business Skills': 'medium',
            'Digital Literacy': 'high',
            'Green Skills': 'medium'
        };
        return demandMap[category] || 'medium';
    }

    getGrowthRate(category) {
        const growthMap = {
            'Core Skills for 2023': 0.25,
            'Emerging Skills 2023': 0.40,
            'Human Skills': 0.15,
            'Technical Skills': 0.30,
            'Business Skills': 0.10,
            'Digital Literacy': 0.20,
            'Green Skills': 0.35
        };
        return growthMap[category] || 0.10;
    }

    getAutomationRisk(category) {
        const riskMap = {
            'Core Skills for 2023': 'low',
            'Emerging Skills 2023': 'low',
            'Human Skills': 'very_low',
            'Technical Skills': 'low',
            'Business Skills': 'medium',
            'Digital Literacy': 'medium',
            'Green Skills': 'low'
        };
        return riskMap[category] || 'medium';
    }

    getONETAutomationRisk(skillName) {
        const lowRisk = ['leadership', 'communication', 'creativity', 'critical thinking'];
        const highRisk = ['data entry', 'routine', 'repetitive', 'calculation'];

        const lowerName = skillName.toLowerCase();
        if (lowRisk.some(term => lowerName.includes(term))) return 'low';
        if (highRisk.some(term => lowerName.includes(term))) return 'high';
        return 'medium';
    }

    getESCOAutomationRisk(category, skillName) {
        if (category === 'Transversal Skills') return 'very_low';
        if (category === 'Digital Skills') return 'low';
        if (category === 'Language Skills') return 'low';
        if (category === 'Mathematical Skills') return 'medium';
        return 'medium';
    }
}

// Export singleton instance
const skillsTaxonomyImporter = new SkillsTaxonomyImporter();

module.exports = {
    importAllTaxonomies: skillsTaxonomyImporter.importAllTaxonomies.bind(skillsTaxonomyImporter),
    SkillsTaxonomyImporter
};