const { SkillsMaster, SkillsRelationship, Employee } = require('../../models');
const SkillsInferenceEngine = require('./skillsInferenceEngine');
const logger = require('../utils/logger');

/**
 * Advanced Skills Gap Analysis Engine
 * Analyzes team skill capabilities and identifies gaps for strategic planning
 */
class SkillsGapAnalysis {
    constructor() {
        this.inferenceEngine = new SkillsInferenceEngine();
        this.initialized = false;
        this.skillsHierarchy = new Map();
        this.industryBenchmarks = new Map();
    }

    /**
     * Initialize the gap analysis engine
     */
    async initialize() {
        if (this.initialized) return;

        logger.info('Initializing Skills Gap Analysis Engine');

        // Initialize the inference engine
        await this.inferenceEngine.initialize();

        // Build skills hierarchy for gap analysis
        await this.buildSkillsHierarchy();

        // Load industry benchmarks
        await this.loadIndustryBenchmarks();

        this.initialized = true;
        logger.info('Skills Gap Analysis Engine initialized');
    }

    /**
     * Build skills hierarchy and relationships
     */
    async buildSkillsHierarchy() {
        const relationships = await SkillsRelationship.findAll({
            include: [
                { model: SkillsMaster, as: 'sourceSkill' },
                { model: SkillsMaster, as: 'targetSkill' }
            ]
        });

        for (const rel of relationships) {
            const sourceId = rel.source_skill_id;
            if (!this.skillsHierarchy.has(sourceId)) {
                this.skillsHierarchy.set(sourceId, {
                    prerequisites: [],
                    dependents: [],
                    complementary: [],
                    similar: []
                });
            }

            const hierarchy = this.skillsHierarchy.get(sourceId);
            hierarchy[rel.relationship_type].push({
                skillId: rel.target_skill_id,
                strength: rel.strength,
                context: rel.context
            });
        }
    }

    /**
     * Load industry benchmarks for skill requirements
     */
    async loadIndustryBenchmarks() {
        // Define industry skill requirements (in production, this would come from external APIs or databases)
        const benchmarks = {
            'Technology': {
                'Core Skills': [
                    { name: 'Software development', level: 3, importance: 'critical', coverage: 0.8 },
                    { name: 'Data analysis', level: 2, importance: 'high', coverage: 0.6 },
                    { name: 'Cloud computing', level: 2, importance: 'high', coverage: 0.5 },
                    { name: 'Cybersecurity', level: 2, importance: 'high', coverage: 0.4 },
                    { name: 'AI and machine learning', level: 2, importance: 'medium', coverage: 0.3 }
                ],
                'Leadership Skills': [
                    { name: 'Team leadership', level: 2, importance: 'high', coverage: 0.3 },
                    { name: 'Project management', level: 2, importance: 'high', coverage: 0.5 },
                    { name: 'Strategic thinking', level: 2, importance: 'medium', coverage: 0.2 }
                ],
                'Soft Skills': [
                    { name: 'Problem solving', level: 3, importance: 'critical', coverage: 0.9 },
                    { name: 'Communication', level: 2, importance: 'high', coverage: 0.8 },
                    { name: 'Collaboration', level: 2, importance: 'high', coverage: 0.7 }
                ]
            },
            'Healthcare': {
                'Clinical Skills': [
                    { name: 'Patient care', level: 3, importance: 'critical', coverage: 1.0 },
                    { name: 'Medical documentation', level: 2, importance: 'high', coverage: 0.9 },
                    { name: 'Treatment planning', level: 3, importance: 'critical', coverage: 0.8 }
                ],
                'Technology Skills': [
                    { name: 'Electronic health records', level: 2, importance: 'high', coverage: 0.6 },
                    { name: 'Medical devices', level: 2, importance: 'high', coverage: 0.7 }
                ]
            },
            'Marketing': {
                'Digital Skills': [
                    { name: 'Digital marketing', level: 3, importance: 'critical', coverage: 0.8 },
                    { name: 'Social media', level: 2, importance: 'high', coverage: 0.9 },
                    { name: 'Content marketing', level: 2, importance: 'high', coverage: 0.6 }
                ],
                'Analytics Skills': [
                    { name: 'Market research', level: 2, importance: 'high', coverage: 0.5 },
                    { name: 'Data analysis', level: 2, importance: 'medium', coverage: 0.4 }
                ]
            }
        };

        for (const [industry, categories] of Object.entries(benchmarks)) {
            this.industryBenchmarks.set(industry, categories);
        }
    }

    /**
     * Analyze individual employee skills
     */
    async analyzeEmployeeSkills(employeeData, options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        const { includeInferredSkills = true, minConfidence = 0.3 } = options;

        // Extract skills from employee data (resume, job description, etc.)
        let analysisText = '';
        if (employeeData.resume) analysisText += employeeData.resume + ' ';
        if (employeeData.jobDescription) analysisText += employeeData.jobDescription + ' ';
        if (employeeData.experience) analysisText += employeeData.experience + ' ';
        if (employeeData.skills) analysisText += employeeData.skills + ' ';

        const skillsResult = await this.inferenceEngine.inferSkills(analysisText, {
            minConfidence,
            maxSkills: 100,
            contextualAnalysis: true
        });

        // Categorize skills
        const skillCategories = {
            technical: [],
            soft: [],
            business: [],
            leadership: [],
            digital: []
        };

        const skillLevels = {
            beginner: [],
            intermediate: [],
            advanced: [],
            expert: []
        };

        skillsResult.skills.forEach(skill => {
            skillCategories[skill.type].push(skill);

            const levelName = this.getLevelName(skill.level);
            skillLevels[levelName].push(skill);
        });

        return {
            employeeId: employeeData.id,
            employeeName: employeeData.name,
            totalSkills: skillsResult.totalFound,
            skillsByCategory: skillCategories,
            skillsByLevel: skillLevels,
            topSkills: skillsResult.skills.slice(0, 10),
            emergingSkills: skillsResult.skills.filter(s => s.isEmerging),
            highDemandSkills: skillsResult.skills.filter(s => s.marketDemand === 'very_high' || s.marketDemand === 'high'),
            analysisMetrics: skillsResult.analysisMetrics
        };
    }

    /**
     * Analyze team skills and identify gaps
     */
    async analyzeTeamSkills(teamData, options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        const {
            industry = 'Technology',
            targetRole = null,
            includeRecommendations = true,
            detailedAnalysis = true
        } = options;

        logger.info(`Analyzing team skills for ${teamData.length} members`);

        // Analyze each team member's skills
        const memberAnalyses = [];
        for (const member of teamData) {
            const analysis = await this.analyzeEmployeeSkills(member);
            memberAnalyses.push(analysis);
        }

        // Aggregate team skills
        const teamSkillsMap = new Map();
        const skillDistribution = {
            technical: { total: 0, members: new Set() },
            soft: { total: 0, members: new Set() },
            business: { total: 0, members: new Set() },
            leadership: { total: 0, members: new Set() },
            digital: { total: 0, members: new Set() }
        };

        memberAnalyses.forEach(member => {
            Object.entries(member.skillsByCategory).forEach(([category, skills]) => {
                skillDistribution[category].total += skills.length;
                if (skills.length > 0) {
                    skillDistribution[category].members.add(member.employeeId);
                }

                skills.forEach(skill => {
                    if (!teamSkillsMap.has(skill.name)) {
                        teamSkillsMap.set(skill.name, {
                            ...skill,
                            memberCount: 0,
                            members: [],
                            avgConfidence: 0,
                            maxLevel: 0
                        });
                    }

                    const teamSkill = teamSkillsMap.get(skill.name);
                    teamSkill.memberCount++;
                    teamSkill.members.push({
                        id: member.employeeId,
                        name: member.employeeName,
                        confidence: skill.confidence,
                        level: skill.level
                    });
                    teamSkill.avgConfidence = (teamSkill.avgConfidence + skill.confidence) / 2;
                    teamSkill.maxLevel = Math.max(teamSkill.maxLevel, skill.level);
                });
            });
        });

        // Calculate team skill coverage
        const teamSkills = Array.from(teamSkillsMap.values()).sort((a, b) => b.memberCount - a.memberCount);

        // Compare against industry benchmarks
        const gapAnalysis = await this.performGapAnalysis(teamSkills, industry);

        // Generate skill matrix
        const skillMatrix = this.generateSkillMatrix(memberAnalyses, teamSkills.slice(0, 20));

        const analysis = {
            team: {
                totalMembers: teamData.length,
                totalUniqueSkills: teamSkills.length,
                skillDistribution: Object.fromEntries(
                    Object.entries(skillDistribution).map(([key, value]) => [
                        key,
                        {
                            total: value.total,
                            coverage: value.members.size / teamData.length,
                            avgPerMember: value.total / teamData.length
                        }
                    ])
                )
            },
            skills: {
                topTeamSkills: teamSkills.slice(0, 15),
                criticalSkills: teamSkills.filter(s => s.memberCount >= Math.ceil(teamData.length * 0.5)),
                rareSkills: teamSkills.filter(s => s.memberCount === 1),
                emergingSkills: teamSkills.filter(s => s.isEmerging),
                highDemandSkills: teamSkills.filter(s => s.marketDemand === 'very_high' || s.marketDemand === 'high')
            },
            gaps: gapAnalysis,
            matrix: skillMatrix,
            members: memberAnalyses
        };

        if (includeRecommendations) {
            analysis.recommendations = await this.generateRecommendations(analysis, industry);
        }

        return analysis;
    }

    /**
     * Perform gap analysis against industry benchmarks
     */
    async performGapAnalysis(teamSkills, industry) {
        const benchmarks = this.industryBenchmarks.get(industry);
        if (!benchmarks) {
            return { error: `No benchmarks available for industry: ${industry}` };
        }

        const gaps = {
            critical: [],
            high: [],
            medium: [],
            covered: []
        };

        for (const [category, requirements] of Object.entries(benchmarks)) {
            for (const requirement of requirements) {
                const teamSkill = teamSkills.find(s =>
                    s.name.toLowerCase().includes(requirement.name.toLowerCase()) ||
                    requirement.name.toLowerCase().includes(s.name.toLowerCase())
                );

                const gap = {
                    skill: requirement.name,
                    category,
                    requiredLevel: requirement.level,
                    importance: requirement.importance,
                    expectedCoverage: requirement.coverage,
                    currentCoverage: teamSkill ? (teamSkill.memberCount / 10) : 0, // Assuming team of 10
                    currentMaxLevel: teamSkill ? teamSkill.maxLevel : 0,
                    gapSize: requirement.level - (teamSkill ? teamSkill.maxLevel : 0),
                    membersWithSkill: teamSkill ? teamSkill.memberCount : 0
                };

                if (!teamSkill || gap.currentCoverage < requirement.coverage * 0.5) {
                    gaps[requirement.importance].push(gap);
                } else {
                    gaps.covered.push(gap);
                }
            }
        }

        return gaps;
    }

    /**
     * Generate skill matrix showing team member capabilities
     */
    generateSkillMatrix(memberAnalyses, topSkills) {
        const matrix = {
            skills: topSkills.map(s => s.name),
            members: memberAnalyses.map(member => ({
                id: member.employeeId,
                name: member.employeeName,
                skills: topSkills.map(skill => {
                    const memberSkill = member.topSkills.find(s => s.name === skill.name);
                    return memberSkill ? {
                        hasSkill: true,
                        confidence: memberSkill.confidence,
                        level: memberSkill.level,
                        levelName: this.getLevelName(memberSkill.level)
                    } : {
                        hasSkill: false,
                        confidence: 0,
                        level: 0,
                        levelName: 'none'
                    };
                })
            }))
        };

        return matrix;
    }

    /**
     * Generate actionable recommendations
     */
    async generateRecommendations(analysis, industry) {
        const recommendations = {
            immediate: [],
            shortTerm: [],
            longTerm: [],
            training: [],
            hiring: []
        };

        // Immediate actions (critical gaps)
        analysis.gaps.critical.forEach(gap => {
            if (gap.gapSize > 1) {
                recommendations.immediate.push({
                    type: 'critical_skill_gap',
                    skill: gap.skill,
                    action: `Address critical gap in ${gap.skill}`,
                    priority: 'high',
                    effort: 'high',
                    timeline: '1-3 months',
                    suggestion: gap.membersWithSkill === 0 ?
                        'Consider hiring or intensive training' :
                        'Upskill existing team members'
                });
            }
        });

        // Short-term training needs
        analysis.gaps.high.forEach(gap => {
            recommendations.shortTerm.push({
                type: 'skill_development',
                skill: gap.skill,
                action: `Develop ${gap.skill} capabilities`,
                priority: 'medium',
                effort: 'medium',
                timeline: '3-6 months',
                suggestion: 'Provide training and development opportunities'
            });
        });

        // Long-term strategic development
        analysis.skills.emergingSkills.forEach(skill => {
            recommendations.longTerm.push({
                type: 'emerging_skill',
                skill: skill.name,
                action: `Build expertise in ${skill.name}`,
                priority: 'low',
                effort: 'medium',
                timeline: '6-12 months',
                suggestion: 'Early adoption of emerging technologies'
            });
        });

        // Training recommendations
        const skillGaps = [...analysis.gaps.critical, ...analysis.gaps.high];
        skillGaps.forEach(gap => {
            if (gap.membersWithSkill > 0) {
                recommendations.training.push({
                    type: 'upskilling',
                    skill: gap.skill,
                    targetMembers: gap.membersWithSkill,
                    effort: gap.gapSize > 1 ? 'high' : 'medium',
                    approach: gap.gapSize > 1 ? 'intensive_training' : 'skill_enhancement'
                });
            }
        });

        // Hiring recommendations
        analysis.gaps.critical.filter(gap => gap.membersWithSkill === 0).forEach(gap => {
            recommendations.hiring.push({
                type: 'external_hire',
                skill: gap.skill,
                priority: 'high',
                role_suggestion: `Senior ${gap.skill} Specialist`,
                justification: `No current team expertise in critical skill: ${gap.skill}`
            });
        });

        return recommendations;
    }

    /**
     * Generate learning paths for skill development
     */
    async generateLearningPaths(skillName, currentLevel = 0, targetLevel = 3) {
        const learningPath = {
            skill: skillName,
            currentLevel: currentLevel,
            targetLevel: targetLevel,
            estimatedDuration: this.estimateLearningDuration(currentLevel, targetLevel),
            phases: []
        };

        // Get skill relationships to build learning path
        const skill = await SkillsMaster.findOne({ where: { skill_name: skillName } });
        if (!skill) {
            return { error: `Skill not found: ${skillName}` };
        }

        const hierarchy = this.skillsHierarchy.get(skill.skill_id);

        if (hierarchy) {
            // Add prerequisite skills
            if (hierarchy.prerequisites.length > 0) {
                learningPath.phases.push({
                    phase: 'Prerequisites',
                    duration: '2-4 weeks',
                    skills: hierarchy.prerequisites.map(p => ({
                        skillId: p.skillId,
                        importance: p.strength,
                        context: p.context
                    }))
                });
            }

            // Add complementary skills
            if (hierarchy.complementary.length > 0) {
                learningPath.phases.push({
                    phase: 'Complementary Skills',
                    duration: '4-8 weeks',
                    skills: hierarchy.complementary.map(c => ({
                        skillId: c.skillId,
                        importance: c.strength,
                        context: c.context
                    }))
                });
            }
        }

        // Add main skill development phases
        for (let level = currentLevel + 1; level <= targetLevel; level++) {
            learningPath.phases.push({
                phase: `${skillName} - ${this.getLevelName(level)}`,
                duration: this.estimatePhaseDuration(level),
                activities: this.generateLearningActivities(skillName, level),
                milestones: this.generateMilestones(skillName, level)
            });
        }

        return learningPath;
    }

    /**
     * Estimate learning duration based on skill levels
     */
    estimateLearningDuration(currentLevel, targetLevel) {
        const levelDurations = { 0: 0, 1: 4, 2: 8, 3: 16 }; // weeks
        return levelDurations[targetLevel] - levelDurations[currentLevel];
    }

    /**
     * Estimate phase duration
     */
    estimatePhaseDuration(level) {
        const durations = { 1: '2-4 weeks', 2: '4-8 weeks', 3: '8-16 weeks' };
        return durations[level] || '4-8 weeks';
    }

    /**
     * Generate learning activities for skill level
     */
    generateLearningActivities(skillName, level) {
        const activities = {
            1: ['Online courses', 'Documentation reading', 'Basic tutorials'],
            2: ['Hands-on projects', 'Peer learning', 'Workshops'],
            3: ['Advanced certification', 'Mentoring others', 'Industry conferences']
        };
        return activities[level] || activities[1];
    }

    /**
     * Generate milestones for skill level
     */
    generateMilestones(skillName, level) {
        const milestones = {
            1: [`Basic understanding of ${skillName}`, 'Complete introductory project'],
            2: [`Intermediate proficiency in ${skillName}`, 'Lead a team project using the skill'],
            3: [`Expert level in ${skillName}`, 'Train others', 'Contribute to best practices']
        };
        return milestones[level] || milestones[1];
    }

    /**
     * Get human-readable level name
     */
    getLevelName(level) {
        const levels = { 0: 'beginner', 1: 'intermediate', 2: 'advanced', 3: 'expert' };
        return levels[level] || 'beginner';
    }

    /**
     * Export team skills analysis to different formats
     */
    async exportAnalysis(analysis, format = 'json') {
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(analysis, null, 2);

            case 'csv':
                return this.generateCSVReport(analysis);

            case 'summary':
                return this.generateSummaryReport(analysis);

            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Generate CSV report
     */
    generateCSVReport(analysis) {
        const headers = ['Member Name', 'Total Skills', 'Technical Skills', 'Soft Skills', 'Leadership Skills', 'Top 3 Skills'];
        const rows = analysis.members.map(member => [
            member.employeeName,
            member.totalSkills,
            member.skillsByCategory.technical.length,
            member.skillsByCategory.soft.length,
            member.skillsByCategory.leadership.length,
            member.topSkills.slice(0, 3).map(s => s.name).join('; ')
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    /**
     * Generate executive summary report
     */
    generateSummaryReport(analysis) {
        const summary = `
TEAM SKILLS ANALYSIS SUMMARY
============================

Team Overview:
• Team Size: ${analysis.team.totalMembers} members
• Total Unique Skills: ${analysis.team.totalUniqueSkills}
• Technical Skills Coverage: ${(analysis.team.skillDistribution.technical.coverage * 100).toFixed(1)}%
• Leadership Skills Coverage: ${(analysis.team.skillDistribution.leadership.coverage * 100).toFixed(1)}%

Top Team Strengths:
${analysis.skills.topTeamSkills.slice(0, 5).map(s => `• ${s.name} (${s.memberCount} members)`).join('\n')}

Critical Skill Gaps:
${analysis.gaps.critical.slice(0, 5).map(g => `• ${g.skill} (Required: Level ${g.requiredLevel}, Current: Level ${g.currentMaxLevel})`).join('\n')}

Priority Recommendations:
${analysis.recommendations?.immediate.slice(0, 3).map(r => `• ${r.action}`).join('\n') || 'None'}
`;

        return summary.trim();
    }
}

module.exports = SkillsGapAnalysis;