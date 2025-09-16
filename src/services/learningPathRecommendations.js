const { SkillsMaster, SkillsRelationship, SkillsSynonyms, IndustrySkills } = require('../../models');
const SkillsInferenceEngine = require('./skillsInferenceEngine');
const SkillsGapAnalysis = require('./skillsGapAnalysis');
const logger = require('../utils/logger');

/**
 * Advanced Learning Path Recommendations Engine
 * Creates personalized learning paths based on skills analysis and career goals
 */
class LearningPathRecommendations {
    constructor() {
        this.inferenceEngine = new SkillsInferenceEngine();
        this.gapAnalysis = new SkillsGapAnalysis();
        this.initialized = false;
        this.learningResources = new Map();
        this.careerPaths = new Map();
        this.industryTrends = new Map();
    }

    /**
     * Initialize the learning path engine
     */
    async initialize() {
        if (this.initialized) return;

        logger.info('Initializing Learning Path Recommendations Engine');

        // Initialize dependencies
        await this.inferenceEngine.initialize();
        await this.gapAnalysis.initialize();

        // Load learning resources database
        await this.loadLearningResources();

        // Build career path templates
        await this.buildCareerPaths();

        // Load industry trends
        await this.loadIndustryTrends();

        this.initialized = true;
        logger.info('Learning Path Recommendations Engine initialized');
    }

    /**
     * Load learning resources for different skills
     */
    async loadLearningResources() {
        // In production, this would come from external APIs or databases
        const resources = {
            'Programming': {
                beginner: [
                    { type: 'course', title: 'Introduction to Programming', provider: 'Coursera', duration: '4 weeks', cost: 49 },
                    { type: 'book', title: 'Learn to Program', provider: 'O\'Reilly', duration: '2 weeks', cost: 25 },
                    { type: 'tutorial', title: 'Programming Basics', provider: 'YouTube', duration: '1 week', cost: 0 }
                ],
                intermediate: [
                    { type: 'course', title: 'Data Structures & Algorithms', provider: 'edX', duration: '8 weeks', cost: 99 },
                    { type: 'project', title: 'Build a Web Application', provider: 'GitHub', duration: '4 weeks', cost: 0 },
                    { type: 'certification', title: 'Programming Fundamentals', provider: 'Microsoft', duration: '6 weeks', cost: 150 }
                ],
                advanced: [
                    { type: 'course', title: 'Advanced Software Architecture', provider: 'Udacity', duration: '12 weeks', cost: 299 },
                    { type: 'mentorship', title: 'Senior Developer Mentoring', provider: 'ADPList', duration: '16 weeks', cost: 200 },
                    { type: 'conference', title: 'Tech Conference Attendance', provider: 'Various', duration: '1 week', cost: 800 }
                ]
            },
            'Data Analysis': {
                beginner: [
                    { type: 'course', title: 'Data Analysis with Python', provider: 'DataCamp', duration: '6 weeks', cost: 79 },
                    { type: 'book', title: 'Python for Data Analysis', provider: 'O\'Reilly', duration: '3 weeks', cost: 35 },
                    { type: 'tutorial', title: 'Excel Data Analysis', provider: 'LinkedIn Learning', duration: '2 weeks', cost: 29 }
                ],
                intermediate: [
                    { type: 'course', title: 'Statistical Analysis', provider: 'Coursera', duration: '10 weeks', cost: 149 },
                    { type: 'project', title: 'Real-world Data Project', provider: 'Kaggle', duration: '8 weeks', cost: 0 },
                    { type: 'certification', title: 'Google Data Analytics', provider: 'Google', duration: '12 weeks', cost: 199 }
                ],
                advanced: [
                    { type: 'course', title: 'Advanced Machine Learning', provider: 'Stanford Online', duration: '16 weeks', cost: 499 },
                    { type: 'specialization', title: 'Data Science Specialization', provider: 'Johns Hopkins', duration: '20 weeks', cost: 799 },
                    { type: 'bootcamp', title: 'Data Science Bootcamp', provider: 'General Assembly', duration: '24 weeks', cost: 3500 }
                ]
            },
            'Leadership': {
                beginner: [
                    { type: 'course', title: 'Leadership Fundamentals', provider: 'LinkedIn Learning', duration: '4 weeks', cost: 49 },
                    { type: 'book', title: 'The First-Time Manager', provider: 'AMACOM', duration: '2 weeks', cost: 20 },
                    { type: 'workshop', title: 'Team Leadership Workshop', provider: 'Local Training', duration: '1 week', cost: 150 }
                ],
                intermediate: [
                    { type: 'course', title: 'Strategic Leadership', provider: 'Harvard Business School', duration: '8 weeks', cost: 299 },
                    { type: 'coaching', title: 'Executive Coaching Program', provider: 'ICF Certified', duration: '12 weeks', cost: 800 },
                    { type: 'assessment', title: '360-Degree Leadership Assessment', provider: 'Leadership Circle', duration: '2 weeks', cost: 250 }
                ],
                advanced: [
                    { type: 'program', title: 'Executive Leadership Program', provider: 'Wharton', duration: '20 weeks', cost: 2500 },
                    { type: 'mba', title: 'Executive MBA Program', provider: 'Top Business School', duration: '104 weeks', cost: 50000 },
                    { type: 'board', title: 'Board Advisory Experience', provider: 'Professional Network', duration: '52 weeks', cost: 0 }
                ]
            },
            'Project Management': {
                beginner: [
                    { type: 'course', title: 'Project Management Basics', provider: 'PMI', duration: '6 weeks', cost: 199 },
                    { type: 'certification', title: 'Google Project Management', provider: 'Google', duration: '8 weeks', cost: 149 },
                    { type: 'tool', title: 'Agile & Scrum Training', provider: 'Scrum Alliance', duration: '2 weeks', cost: 299 }
                ],
                intermediate: [
                    { type: 'certification', title: 'PMP Certification Prep', provider: 'PMI', duration: '12 weeks', cost: 599 },
                    { type: 'course', title: 'Advanced Project Management', provider: 'MIT xPRO', duration: '10 weeks', cost: 799 },
                    { type: 'practice', title: 'Real Project Leadership', provider: 'Internal Projects', duration: '16 weeks', cost: 0 }
                ],
                advanced: [
                    { type: 'certification', title: 'Program Management Professional', provider: 'PMI', duration: '16 weeks', cost: 899 },
                    { type: 'program', title: 'Strategic Project Leadership', provider: 'Stanford', duration: '20 weeks', cost: 1299 },
                    { type: 'consulting', title: 'Project Management Consulting', provider: 'Independent', duration: '52 weeks', cost: 0 }
                ]
            }
        };

        for (const [skill, levels] of Object.entries(resources)) {
            this.learningResources.set(skill.toLowerCase(), levels);
        }
    }

    /**
     * Build career path templates
     */
    async buildCareerPaths() {
        const careerPaths = {
            'Software Engineer': {
                levels: [
                    {
                        title: 'Junior Software Engineer',
                        experience: '0-2 years',
                        skills: ['Programming', 'Version Control', 'Basic Algorithms', 'Code Review'],
                        nextLevel: 'Mid-level Software Engineer'
                    },
                    {
                        title: 'Mid-level Software Engineer',
                        experience: '2-5 years',
                        skills: ['Advanced Programming', 'System Design', 'Database Design', 'Testing', 'Code Architecture'],
                        nextLevel: 'Senior Software Engineer'
                    },
                    {
                        title: 'Senior Software Engineer',
                        experience: '5-8 years',
                        skills: ['Technical Leadership', 'Mentoring', 'Architecture Design', 'Performance Optimization'],
                        nextLevel: 'Staff Engineer / Engineering Manager'
                    },
                    {
                        title: 'Staff Engineer / Engineering Manager',
                        experience: '8+ years',
                        skills: ['Strategic Thinking', 'Team Leadership', 'Cross-functional Collaboration', 'Technology Strategy'],
                        nextLevel: 'Principal Engineer / Director of Engineering'
                    }
                ]
            },
            'Data Scientist': {
                levels: [
                    {
                        title: 'Junior Data Scientist',
                        experience: '0-2 years',
                        skills: ['Statistics', 'Python/R', 'Data Visualization', 'SQL', 'Basic Machine Learning'],
                        nextLevel: 'Data Scientist'
                    },
                    {
                        title: 'Data Scientist',
                        experience: '2-5 years',
                        skills: ['Advanced Analytics', 'Feature Engineering', 'Model Selection', 'Business Insights'],
                        nextLevel: 'Senior Data Scientist'
                    },
                    {
                        title: 'Senior Data Scientist',
                        experience: '5-8 years',
                        skills: ['ML Engineering', 'Data Strategy', 'Stakeholder Management', 'Research Leadership'],
                        nextLevel: 'Principal Data Scientist / Data Science Manager'
                    },
                    {
                        title: 'Principal Data Scientist',
                        experience: '8+ years',
                        skills: ['Data Science Strategy', 'Team Leadership', 'Innovation', 'Cross-functional Leadership'],
                        nextLevel: 'VP of Data Science'
                    }
                ]
            },
            'Product Manager': {
                levels: [
                    {
                        title: 'Associate Product Manager',
                        experience: '0-2 years',
                        skills: ['Market Research', 'User Research', 'Basic Analytics', 'Roadmap Planning'],
                        nextLevel: 'Product Manager'
                    },
                    {
                        title: 'Product Manager',
                        experience: '2-5 years',
                        skills: ['Product Strategy', 'Stakeholder Management', 'Data Analysis', 'A/B Testing'],
                        nextLevel: 'Senior Product Manager'
                    },
                    {
                        title: 'Senior Product Manager',
                        experience: '5-8 years',
                        skills: ['Strategic Planning', 'Team Leadership', 'P&L Management', 'Cross-functional Leadership'],
                        nextLevel: 'Director of Product'
                    },
                    {
                        title: 'Director of Product',
                        experience: '8+ years',
                        skills: ['Product Vision', 'Organizational Leadership', 'Market Strategy', 'Innovation Management'],
                        nextLevel: 'VP of Product'
                    }
                ]
            }
        };

        for (const [role, path] of Object.entries(careerPaths)) {
            this.careerPaths.set(role.toLowerCase(), path);
        }
    }

    /**
     * Load industry trends and emerging skills
     */
    async loadIndustryTrends() {
        const trends = {
            'Technology': {
                emerging: ['AI/ML', 'Blockchain', 'Edge Computing', 'Quantum Computing', 'Extended Reality'],
                declining: ['Legacy System Maintenance', 'Basic Web Development', 'Manual Testing'],
                growing: ['Cloud Architecture', 'DevSecOps', 'Data Engineering', 'Full-Stack Development'],
                stable: ['Database Management', 'Network Administration', 'Software Testing']
            },
            'Healthcare': {
                emerging: ['Telemedicine', 'AI Diagnostics', 'Digital Health', 'Personalized Medicine'],
                declining: ['Paper-based Systems', 'Manual Record Keeping'],
                growing: ['Health Informatics', 'Clinical Data Analysis', 'Remote Patient Monitoring'],
                stable: ['Patient Care', 'Clinical Assessment', 'Medical Documentation']
            },
            'Finance': {
                emerging: ['Fintech', 'Cryptocurrency', 'Robo-advisory', 'RegTech', 'Open Banking'],
                declining: ['Manual Trading', 'Paper Processing'],
                growing: ['Risk Analytics', 'Algorithmic Trading', 'Digital Banking', 'Compliance Automation'],
                stable: ['Financial Planning', 'Risk Management', 'Audit', 'Investment Analysis']
            }
        };

        for (const [industry, trend] of Object.entries(trends)) {
            this.industryTrends.set(industry.toLowerCase(), trend);
        }
    }

    /**
     * Generate personalized learning path
     */
    async generateLearningPath(userData, options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        const {
            targetRole = null,
            industry = 'Technology',
            timeframe = 12, // months
            budget = 1000, // dollars
            learningStyle = 'mixed', // online, instructor-led, hands-on, mixed
            currentLevel = 'intermediate'
        } = options;

        // Analyze current skills
        let currentSkills = [];
        if (userData.resume || userData.experience) {
            const skillsAnalysis = await this.inferenceEngine.inferSkills(
                (userData.resume || '') + ' ' + (userData.experience || ''),
                { minConfidence: 0.4, maxSkills: 30 }
            );
            currentSkills = skillsAnalysis.skills;
        }

        // Determine skill gaps
        let skillGaps = [];
        if (targetRole) {
            const gapAnalysis = await this.identifySkillGaps(currentSkills, targetRole, industry);
            skillGaps = gapAnalysis.gaps;
        }

        // Get industry trends
        const industryTrends = this.industryTrends.get(industry.toLowerCase()) || {};

        // Build learning path
        const learningPath = {
            userId: userData.id,
            targetRole: targetRole,
            industry: industry,
            duration: timeframe,
            budget: budget,
            currentSkills: currentSkills.slice(0, 10),
            skillGaps: skillGaps.slice(0, 8),
            phases: [],
            totalCost: 0,
            totalDuration: 0,
            recommendations: []
        };

        // Phase 1: Foundation (Month 1-2)
        const foundationPhase = await this.buildFoundationPhase(skillGaps, learningStyle, budget * 0.3);
        learningPath.phases.push(foundationPhase);

        // Phase 2: Core Development (Month 3-6)
        const corePhase = await this.buildCorePhase(skillGaps, industryTrends, learningStyle, budget * 0.4);
        learningPath.phases.push(corePhase);

        // Phase 3: Advanced & Specialized (Month 7-10)
        const advancedPhase = await this.buildAdvancedPhase(skillGaps, targetRole, learningStyle, budget * 0.2);
        learningPath.phases.push(advancedPhase);

        // Phase 4: Practice & Portfolio (Month 11-12)
        const practicePhase = await this.buildPracticePhase(targetRole, industry, budget * 0.1);
        learningPath.phases.push(practicePhase);

        // Calculate totals
        learningPath.totalCost = learningPath.phases.reduce((sum, phase) => sum + phase.cost, 0);
        learningPath.totalDuration = learningPath.phases.reduce((sum, phase) => sum + phase.duration, 0);

        // Generate recommendations
        learningPath.recommendations = await this.generateRecommendations(learningPath, industryTrends);

        return learningPath;
    }

    /**
     * Build foundation learning phase
     */
    async buildFoundationPhase(skillGaps, learningStyle, budget) {
        const phase = {
            name: 'Foundation Building',
            description: 'Establish core competencies and fundamental skills',
            duration: 8, // weeks
            cost: 0,
            activities: [],
            milestones: ['Complete basic assessments', 'Build foundation projects', 'Join professional communities']
        };

        // Select top 3 foundational skill gaps
        const foundationalGaps = skillGaps.slice(0, 3);

        for (const gap of foundationalGaps) {
            const resources = this.learningResources.get(gap.skill.toLowerCase()) || {};
            const levelResources = resources.beginner || [];

            // Select appropriate resource based on learning style and budget
            const selectedResource = this.selectOptimalResource(levelResources, learningStyle, budget);

            if (selectedResource) {
                phase.activities.push({
                    skill: gap.skill,
                    resource: selectedResource,
                    priority: 'high',
                    estimatedEffort: '2-3 hours/week'
                });
                phase.cost += selectedResource.cost;
            }
        }

        return phase;
    }

    /**
     * Build core development phase
     */
    async buildCorePhase(skillGaps, industryTrends, learningStyle, budget) {
        const phase = {
            name: 'Core Development',
            description: 'Develop intermediate to advanced skills in key areas',
            duration: 16, // weeks
            cost: 0,
            activities: [],
            milestones: ['Complete major projects', 'Gain industry certifications', 'Build professional network']
        };

        // Select top 4 core skill gaps, prioritizing growing/emerging skills
        const coreGaps = skillGaps
            .filter(gap =>
                industryTrends.growing?.includes(gap.skill) ||
                industryTrends.emerging?.includes(gap.skill) ||
                gap.importance === 'high'
            )
            .slice(0, 4);

        for (const gap of coreGaps) {
            const resources = this.learningResources.get(gap.skill.toLowerCase()) || {};
            const levelResources = resources.intermediate || [];

            const selectedResource = this.selectOptimalResource(levelResources, learningStyle, budget);

            if (selectedResource) {
                phase.activities.push({
                    skill: gap.skill,
                    resource: selectedResource,
                    priority: industryTrends.emerging?.includes(gap.skill) ? 'high' : 'medium',
                    estimatedEffort: '4-6 hours/week'
                });
                phase.cost += selectedResource.cost;
            }
        }

        return phase;
    }

    /**
     * Build advanced learning phase
     */
    async buildAdvancedPhase(skillGaps, targetRole, learningStyle, budget) {
        const phase = {
            name: 'Advanced Specialization',
            description: 'Master advanced skills and develop expertise',
            duration: 12, // weeks
            cost: 0,
            activities: [],
            milestones: ['Achieve expert-level competency', 'Lead projects', 'Mentor others']
        };

        // Select top 2 advanced skills
        const advancedGaps = skillGaps.slice(0, 2);

        for (const gap of advancedGaps) {
            const resources = this.learningResources.get(gap.skill.toLowerCase()) || {};
            const levelResources = resources.advanced || [];

            const selectedResource = this.selectOptimalResource(levelResources, learningStyle, budget);

            if (selectedResource) {
                phase.activities.push({
                    skill: gap.skill,
                    resource: selectedResource,
                    priority: 'high',
                    estimatedEffort: '6-8 hours/week'
                });
                phase.cost += selectedResource.cost;
            }
        }

        return phase;
    }

    /**
     * Build practice and portfolio phase
     */
    async buildPracticePhase(targetRole, industry, budget) {
        const phase = {
            name: 'Practice & Portfolio',
            description: 'Apply skills through real projects and build portfolio',
            duration: 8, // weeks
            cost: 0,
            activities: [
                {
                    skill: 'Portfolio Development',
                    resource: {
                        type: 'project',
                        title: 'Personal Portfolio Project',
                        provider: 'Self-directed',
                        duration: '6 weeks',
                        cost: 0
                    },
                    priority: 'high',
                    estimatedEffort: '8-10 hours/week'
                },
                {
                    skill: 'Networking',
                    resource: {
                        type: 'networking',
                        title: 'Industry Events & Conferences',
                        provider: 'Professional Associations',
                        duration: '2 weeks',
                        cost: Math.min(budget, 200)
                    },
                    priority: 'medium',
                    estimatedEffort: '2-4 hours/week'
                }
            ],
            milestones: ['Complete portfolio project', 'Present at industry event', 'Secure informational interviews']
        };

        phase.cost = phase.activities.reduce((sum, activity) => sum + activity.resource.cost, 0);

        return phase;
    }

    /**
     * Select optimal learning resource based on criteria
     */
    selectOptimalResource(resources, learningStyle, budget) {
        if (!resources || resources.length === 0) return null;

        // Filter by budget
        const affordableResources = resources.filter(r => r.cost <= budget * 0.3);
        if (affordableResources.length === 0) return resources[0]; // Return cheapest if none affordable

        // Score resources based on learning style preferences
        const scoredResources = affordableResources.map(resource => {
            let score = 0;

            // Learning style preferences
            switch (learningStyle) {
                case 'online':
                    if (resource.type === 'course' || resource.type === 'tutorial') score += 3;
                    break;
                case 'instructor-led':
                    if (resource.type === 'course' || resource.type === 'workshop') score += 3;
                    break;
                case 'hands-on':
                    if (resource.type === 'project' || resource.type === 'bootcamp') score += 3;
                    break;
                case 'mixed':
                    score += 1; // All resources get base score
                    break;
            }

            // Value for money (duration per cost)
            const weeksFromDuration = parseInt(resource.duration.split(' ')[0]) || 1;
            if (resource.cost > 0) {
                score += Math.min(3, weeksFromDuration / (resource.cost / 100));
            } else {
                score += 2; // Free resources get bonus
            }

            return { ...resource, score };
        });

        // Return highest scoring resource
        return scoredResources.sort((a, b) => b.score - a.score)[0];
    }

    /**
     * Identify skill gaps for target role
     */
    async identifySkillGaps(currentSkills, targetRole, industry) {
        const careerPath = this.careerPaths.get(targetRole.toLowerCase());
        const industryTrends = this.industryTrends.get(industry.toLowerCase()) || {};

        let requiredSkills = [];

        if (careerPath) {
            // Get skills for target role level
            const targetLevel = careerPath.levels.find(level =>
                level.title.toLowerCase().includes(targetRole.toLowerCase())
            );

            if (targetLevel) {
                requiredSkills = targetLevel.skills;
            }
        }

        // Add trending industry skills
        if (industryTrends.emerging) {
            requiredSkills = [...requiredSkills, ...industryTrends.emerging.slice(0, 3)];
        }
        if (industryTrends.growing) {
            requiredSkills = [...requiredSkills, ...industryTrends.growing.slice(0, 2)];
        }

        // Calculate gaps
        const currentSkillNames = currentSkills.map(s => s.name.toLowerCase());
        const gaps = requiredSkills
            .filter(skill => !currentSkillNames.some(current =>
                current.includes(skill.toLowerCase()) || skill.toLowerCase().includes(current)
            ))
            .map(skill => ({
                skill: skill,
                importance: industryTrends.emerging?.includes(skill) ? 'critical' :
                           industryTrends.growing?.includes(skill) ? 'high' : 'medium',
                currentLevel: 0,
                targetLevel: 2
            }));

        return { gaps, requiredSkills };
    }

    /**
     * Generate recommendations
     */
    async generateRecommendations(learningPath, industryTrends) {
        const recommendations = [
            {
                type: 'time_management',
                title: 'Create a Consistent Learning Schedule',
                description: `Dedicate ${Math.ceil(learningPath.totalDuration / 4)} hours per week to achieve your learning goals`,
                priority: 'high'
            },
            {
                type: 'networking',
                title: 'Join Professional Communities',
                description: `Connect with professionals in ${learningPath.industry} to expand your network`,
                priority: 'medium'
            },
            {
                type: 'practice',
                title: 'Apply Skills Through Projects',
                description: 'Build a portfolio showcasing your newly acquired skills',
                priority: 'high'
            }
        ];

        // Add industry-specific recommendations
        if (industryTrends.emerging && industryTrends.emerging.length > 0) {
            recommendations.push({
                type: 'trend_awareness',
                title: 'Stay Updated on Emerging Technologies',
                description: `Follow developments in ${industryTrends.emerging.slice(0, 3).join(', ')}`,
                priority: 'medium'
            });
        }

        return recommendations;
    }

    /**
     * Track learning progress
     */
    async trackProgress(userId, learningPathId, completedActivities) {
        // This would integrate with actual progress tracking in production
        const progress = {
            userId,
            learningPathId,
            completedActivities: completedActivities.length,
            currentPhase: this.determineCurrentPhase(completedActivities),
            completionPercentage: this.calculateCompletionPercentage(completedActivities),
            estimatedTimeRemaining: this.estimateTimeRemaining(completedActivities),
            nextMilestones: this.getNextMilestones(completedActivities)
        };

        return progress;
    }

    /**
     * Get learning analytics and insights
     */
    async getLearningAnalytics(userId, timeframe = 30) {
        // Mock analytics data - in production, this would query actual learning data
        return {
            userId,
            timeframe,
            skillsImproved: 5,
            coursesCompleted: 3,
            projectsFinished: 2,
            certificationsEarned: 1,
            learningHours: 42,
            strongestGrowthAreas: ['Data Analysis', 'Project Management'],
            recommendedFocus: ['Leadership Skills', 'Advanced Programming'],
            streak: 7, // days
            achievements: [
                { title: 'Fast Learner', description: 'Completed 3 courses this month' },
                { title: 'Consistent Learner', description: '7-day learning streak' }
            ]
        };
    }

    /**
     * Generate team learning recommendations
     */
    async generateTeamLearningPaths(teamMembers, teamGoals, options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        const teamLearningPath = {
            teamSize: teamMembers.length,
            teamGoals,
            individualPaths: [],
            sharedLearning: [],
            totalBudget: 0,
            timeline: options.timeline || 12,
            recommendations: []
        };

        // Generate individual paths
        for (const member of teamMembers) {
            const individualPath = await this.generateLearningPath(member, options);
            teamLearningPath.individualPaths.push(individualPath);
            teamLearningPath.totalBudget += individualPath.totalCost;
        }

        // Identify shared learning opportunities
        const commonSkillGaps = this.identifyCommonSkillGaps(teamLearningPath.individualPaths);
        for (const commonGap of commonSkillGaps) {
            teamLearningPath.sharedLearning.push({
                skill: commonGap.skill,
                affectedMembers: commonGap.members,
                suggestedResource: {
                    type: 'group_training',
                    title: `Team ${commonGap.skill} Workshop`,
                    duration: '2 weeks',
                    cost: commonGap.members * 150,
                    savings: commonGap.members * 100 // Group discount
                }
            });
        }

        return teamLearningPath;
    }

    /**
     * Helper methods
     */
    determineCurrentPhase(completedActivities) {
        if (completedActivities.length <= 3) return 'Foundation';
        if (completedActivities.length <= 7) return 'Core Development';
        if (completedActivities.length <= 9) return 'Advanced Specialization';
        return 'Practice & Portfolio';
    }

    calculateCompletionPercentage(completedActivities) {
        const totalActivities = 12; // Typical learning path has ~12 activities
        return Math.min(100, (completedActivities.length / totalActivities) * 100);
    }

    estimateTimeRemaining(completedActivities) {
        const totalWeeks = 44; // Total learning path duration
        const completionRate = completedActivities.length / 12;
        return Math.max(0, totalWeeks * (1 - completionRate));
    }

    getNextMilestones(completedActivities) {
        const allMilestones = [
            'Complete basic assessments',
            'Build foundation projects',
            'Complete major projects',
            'Gain industry certifications',
            'Achieve expert-level competency',
            'Complete portfolio project'
        ];

        return allMilestones.slice(completedActivities.length, completedActivities.length + 2);
    }

    identifyCommonSkillGaps(individualPaths) {
        const skillCounts = new Map();

        individualPaths.forEach((path, memberIndex) => {
            path.skillGaps.forEach(gap => {
                if (!skillCounts.has(gap.skill)) {
                    skillCounts.set(gap.skill, { count: 0, members: [] });
                }
                skillCounts.get(gap.skill).count++;
                skillCounts.get(gap.skill).members.push(memberIndex);
            });
        });

        // Return skills needed by 2+ team members
        return Array.from(skillCounts.entries())
            .filter(([skill, data]) => data.count >= 2)
            .map(([skill, data]) => ({ skill, members: data.members.length }))
            .sort((a, b) => b.members - a.members);
    }
}

module.exports = LearningPathRecommendations;