const logger = require('../utils/logger');
const aiServiceFactory = require('./aiServiceFactory');

/**
 * Advanced Job Description Generator with AI Enhancement and Industry Templates
 */
class JobDescriptionGenerator {
    constructor() {
        // Industry-specific templates and patterns
        this.industryTemplates = {
            technology: {
                commonSkills: ['problem-solving', 'analytical thinking', 'continuous learning'],
                technicalSkills: ['programming', 'software development', 'system architecture', 'testing', 'debugging'],
                benefits: ['flexible work arrangements', 'professional development budget', 'latest technology stack'],
                culture: ['innovation-driven', 'collaborative', 'fast-paced', 'growth-oriented']
            },
            marketing: {
                commonSkills: ['creativity', 'strategic thinking', 'data analysis', 'communication'],
                technicalSkills: ['digital marketing', 'content creation', 'campaign management', 'analytics'],
                benefits: ['creative freedom', 'marketing conferences', 'brand development opportunities'],
                culture: ['creative', 'results-driven', 'customer-focused', 'dynamic']
            },
            finance: {
                commonSkills: ['analytical skills', 'attention to detail', 'regulatory knowledge', 'risk assessment'],
                technicalSkills: ['financial modeling', 'accounting', 'compliance', 'auditing'],
                benefits: ['professional certifications', 'career progression', 'competitive compensation'],
                culture: ['professional', 'detail-oriented', 'integrity-focused', 'stable']
            },
            healthcare: {
                commonSkills: ['empathy', 'communication', 'critical thinking', 'teamwork'],
                technicalSkills: ['patient care', 'medical procedures', 'healthcare technology', 'compliance'],
                benefits: ['comprehensive healthcare', 'continuing education', 'meaningful impact'],
                culture: ['caring', 'professional', 'mission-driven', 'collaborative']
            },
            design: {
                commonSkills: ['creativity', 'visual thinking', 'user empathy', 'collaboration'],
                technicalSkills: ['design software', 'user research', 'prototyping', 'visual design'],
                benefits: ['creative tools', 'design conferences', 'portfolio development'],
                culture: ['creative', 'user-focused', 'collaborative', 'innovative']
            }
        };

        // Role-level templates
        this.roleLevels = {
            entry: {
                experience: '0-2 years',
                responsibilities: ['Learn and apply', 'Support team members', 'Complete assigned tasks'],
                qualifications: ['Bachelor\'s degree or equivalent', 'Basic knowledge of', 'Eagerness to learn']
            },
            mid: {
                experience: '2-5 years',
                responsibilities: ['Lead projects', 'Mentor junior team members', 'Contribute to strategy'],
                qualifications: ['Bachelor\'s degree required', 'Proven experience in', 'Strong expertise in']
            },
            senior: {
                experience: '5-8 years',
                responsibilities: ['Drive strategic initiatives', 'Lead cross-functional teams', 'Mentor and develop talent'],
                qualifications: ['Bachelor\'s/Master\'s degree', 'Extensive experience in', 'Leadership experience']
            },
            lead: {
                experience: '8+ years',
                responsibilities: ['Set technical vision', 'Lead organization-wide initiatives', 'Build and scale teams'],
                qualifications: ['Advanced degree preferred', 'Proven leadership experience', 'Industry expertise']
            }
        };

        // Bias-free language patterns
        this.biasPatterns = {
            gendered: [
                { pattern: /\b(guys?|guys and gals)\b/gi, replacement: 'team members' },
                { pattern: /\b(brotherhood|fraternity)\b/gi, replacement: 'community' },
                { pattern: /\b(manpower)\b/gi, replacement: 'workforce' },
                { pattern: /\b(man hours?)\b/gi, replacement: 'person hours' }
            ],
            ageist: [
                { pattern: /\b(young|youthful|energetic)\b/gi, replacement: 'dynamic' },
                { pattern: /\b(mature|experienced professional)\b/gi, replacement: 'seasoned professional' },
                { pattern: /\b(digital native)\b/gi, replacement: 'tech-savvy' }
            ],
            cultural: [
                { pattern: /\b(ninja|rockstar|guru)\b/gi, replacement: 'expert' },
                { pattern: /\b(culture fit)\b/gi, replacement: 'team collaboration' }
            ]
        };

        // Salary benchmarking data (simplified - in production, use external API)
        this.salaryBenchmarks = {
            'software engineer': { min: 70000, max: 150000, median: 95000 },
            'data scientist': { min: 80000, max: 180000, median: 120000 },
            'product manager': { min: 90000, max: 200000, median: 130000 },
            'marketing manager': { min: 60000, max: 140000, median: 85000 },
            'ux designer': { min: 65000, max: 130000, median: 85000 },
            'devops engineer': { min: 75000, max: 160000, median: 110000 }
        };
    }

    /**
     * Generate a comprehensive job description
     */
    async generateJobDescription(role, company, requirements = {}) {
        try {
            logger.info(`Generating job description for ${role} at ${company}`);

            // Detect industry and role level
            const industry = this.detectIndustry(role, requirements.industry);
            const level = this.detectRoleLevel(role, requirements.level);

            // Try AI enhancement first
            let aiGeneratedJD = null;
            try {
                const provider = await aiServiceFactory.getProvider();
                if (provider) {
                    aiGeneratedJD = await provider.generateJobDescription(role, company, requirements);
                    if (aiGeneratedJD && !aiGeneratedJD.error) {
                        logger.info(`AI-generated job description using ${provider.name}`);
                        // Continue with AI-enhanced version
                    } else {
                        aiGeneratedJD = null;
                    }
                }
            } catch (aiError) {
                logger.warn('AI job description generation failed, using template-based approach:', aiError.message);
            }

            // Generate structured job description
            const jobDescription = aiGeneratedJD || this.generateTemplateBasedJD(role, company, industry, level, requirements);

            // Enhance with additional features
            const enhancedJD = await this.enhanceJobDescription(jobDescription, role, company, industry, level, requirements);

            // Perform bias check
            const biasAnalysis = this.analyzeBias(enhancedJD);

            return {
                ...enhancedJD,
                biasAnalysis,
                metadata: {
                    generatedBy: aiGeneratedJD ? 'ai_enhanced' : 'template_based',
                    industry: industry,
                    level: level,
                    generatedAt: new Date().toISOString(),
                    version: '2.0'
                }
            };

        } catch (error) {
            logger.error('Error generating job description:', error);
            throw error;
        }
    }

    /**
     * Generate template-based job description (fallback)
     */
    generateTemplateBasedJD(role, company, industry, level, requirements) {
        const template = this.industryTemplates[industry] || this.industryTemplates.technology;
        const roleTemplate = this.roleLevels[level] || this.roleLevels.mid;

        const title = this.generateJobTitle(role, level);
        const summary = this.generateJobSummary(role, company, roleTemplate, template);
        const responsibilities = this.generateResponsibilities(role, roleTemplate, requirements.responsibilities);
        const qualifications = this.generateQualifications(role, roleTemplate, template, requirements.qualifications);
        const benefits = this.generateBenefits(company, template, requirements.benefits);
        const compensation = this.generateCompensation(role, level, requirements.salary);

        return {
            title,
            company,
            location: requirements.location || 'Remote/Hybrid',
            employmentType: requirements.employmentType || 'Full-time',
            summary,
            responsibilities,
            qualifications: {
                required: qualifications.required,
                preferred: qualifications.preferred
            },
            benefits,
            compensation,
            applicationInstructions: this.generateApplicationInstructions(company, requirements.applicationProcess)
        };
    }

    /**
     * Enhance job description with additional features
     */
    async enhanceJobDescription(jobDescription, role, company, industry, level, requirements) {
        // Add skills requirements
        const skillsRequirements = await this.generateSkillsRequirements(role, industry, level);

        // Add career progression
        const careerProgression = this.generateCareerProgression(role, level);

        // Add diversity statement
        const diversityStatement = this.generateDiversityStatement();

        // Add company culture information
        const cultureInfo = this.generateCultureInfo(industry, requirements.culture);

        return {
            ...jobDescription,
            skillsRequirements,
            careerProgression,
            diversityStatement,
            cultureInfo,
            workEnvironment: {
                remote: requirements.remote || 'hybrid',
                collaboration: 'cross-functional teams',
                tools: this.getIndustryTools(industry),
                environment: cultureInfo.environment
            }
        };
    }

    /**
     * Generate skills requirements based on role and industry
     */
    async generateSkillsRequirements(role, industry, level) {
        const template = this.industryTemplates[industry] || this.industryTemplates.technology;
        const roleTemplate = this.roleLevels[level] || this.roleLevels.mid;

        // Try to get AI-enhanced skills
        let aiSkills = null;
        try {
            const provider = await aiServiceFactory.getProvider();
            if (provider) {
                const skillsPrompt = `Generate required and preferred skills for a ${level} ${role} position in the ${industry} industry`;
                aiSkills = await provider.extractSkillsFromText(skillsPrompt, 'job_requirements');
            }
        } catch (error) {
            logger.warn('AI skills generation failed, using template-based approach');
        }

        return {
            technical: aiSkills?.technical || template.technicalSkills,
            soft: aiSkills?.soft || template.commonSkills,
            tools: this.getIndustryTools(industry),
            proficiencyLevels: {
                beginner: level === 'entry' ? ['basic understanding', 'willingness to learn'] : [],
                intermediate: level === 'mid' ? ['working knowledge', 'practical experience'] : [],
                advanced: ['expert level', 'deep understanding'],
                expert: level === 'senior' || level === 'lead' ? ['thought leadership', 'industry expertise'] : []
            }
        };
    }

    /**
     * Detect industry from role and requirements
     */
    detectIndustry(role, providedIndustry) {
        if (providedIndustry && this.industryTemplates[providedIndustry.toLowerCase()]) {
            return providedIndustry.toLowerCase();
        }

        const roleLower = role.toLowerCase();

        if (roleLower.includes('engineer') || roleLower.includes('developer') || roleLower.includes('devops')) {
            return 'technology';
        } else if (roleLower.includes('marketing') || roleLower.includes('brand')) {
            return 'marketing';
        } else if (roleLower.includes('finance') || roleLower.includes('accounting')) {
            return 'finance';
        } else if (roleLower.includes('design') || roleLower.includes('ux') || roleLower.includes('ui')) {
            return 'design';
        } else if (roleLower.includes('health') || roleLower.includes('medical')) {
            return 'healthcare';
        }

        return 'technology'; // default
    }

    /**
     * Detect role level from title and requirements
     */
    detectRoleLevel(role, providedLevel) {
        if (providedLevel && this.roleLevels[providedLevel.toLowerCase()]) {
            return providedLevel.toLowerCase();
        }

        const roleLower = role.toLowerCase();

        if (roleLower.includes('senior') || roleLower.includes('sr.')) {
            return 'senior';
        } else if (roleLower.includes('lead') || roleLower.includes('principal') || roleLower.includes('staff')) {
            return 'lead';
        } else if (roleLower.includes('junior') || roleLower.includes('entry') || roleLower.includes('associate')) {
            return 'entry';
        }

        return 'mid'; // default
    }

    /**
     * Generate job title with level and specialization
     */
    generateJobTitle(role, level) {
        const levelPrefix = {
            entry: 'Junior',
            mid: '',
            senior: 'Senior',
            lead: 'Lead'
        };

        const prefix = levelPrefix[level];
        return prefix ? `${prefix} ${role}` : role;
    }

    /**
     * Generate job summary
     */
    generateJobSummary(role, company, roleTemplate, industryTemplate) {
        return `Join ${company} as a ${role} and contribute to our ${industryTemplate.culture.join(', ')} environment. ` +
               `We're looking for a professional with ${roleTemplate.experience} of experience who can ${roleTemplate.responsibilities[0].toLowerCase()} ` +
               `and drive meaningful impact in our organization.`;
    }

    /**
     * Generate responsibilities list
     */
    generateResponsibilities(role, roleTemplate, customResponsibilities) {
        const baseResponsibilities = roleTemplate.responsibilities;
        const roleSpecific = this.getRoleSpecificResponsibilities(role);
        const custom = customResponsibilities || [];

        return [
            ...baseResponsibilities,
            ...roleSpecific,
            ...custom
        ].slice(0, 8); // Limit to 8 responsibilities
    }

    /**
     * Generate qualifications (required and preferred)
     */
    generateQualifications(role, roleTemplate, industryTemplate, customQualifications) {
        const baseQualifications = roleTemplate.qualifications;
        const industrySkills = industryTemplate.technicalSkills.slice(0, 3);
        const softSkills = industryTemplate.commonSkills.slice(0, 2);

        return {
            required: [
                ...baseQualifications,
                ...industrySkills.map(skill => `Experience with ${skill}`),
                ...customQualifications?.required || []
            ].slice(0, 6),
            preferred: [
                ...softSkills.map(skill => `Strong ${skill} abilities`),
                'Industry certifications',
                'Previous startup/scale-up experience',
                ...customQualifications?.preferred || []
            ].slice(0, 4)
        };
    }

    /**
     * Generate benefits package
     */
    generateBenefits(company, industryTemplate, customBenefits) {
        const standardBenefits = [
            'Competitive salary and equity package',
            'Comprehensive health, dental, and vision insurance',
            'Flexible working arrangements (remote/hybrid)',
            '25 days paid vacation + public holidays',
            'Professional development budget',
            'Modern equipment and tools'
        ];

        const industryBenefits = industryTemplate.benefits || [];
        const custom = customBenefits || [];

        return [
            ...standardBenefits,
            ...industryBenefits,
            ...custom
        ].slice(0, 10);
    }

    /**
     * Generate compensation information
     */
    generateCompensation(role, level, customSalary) {
        if (customSalary) {
            return {
                type: 'salary',
                range: customSalary,
                currency: 'USD',
                frequency: 'annual',
                additional: ['Performance bonus', 'Equity participation', 'Annual reviews']
            };
        }

        const roleLower = role.toLowerCase();
        const benchmark = this.salaryBenchmarks[roleLower] || { min: 60000, max: 120000, median: 80000 };

        // Adjust for level
        const levelMultiplier = {
            entry: 0.8,
            mid: 1.0,
            senior: 1.3,
            lead: 1.6
        };

        const multiplier = levelMultiplier[level] || 1.0;

        return {
            type: 'salary',
            range: {
                min: Math.round(benchmark.min * multiplier),
                max: Math.round(benchmark.max * multiplier),
                median: Math.round(benchmark.median * multiplier)
            },
            currency: 'USD',
            frequency: 'annual',
            additional: ['Performance bonus', 'Equity participation', 'Annual reviews']
        };
    }

    /**
     * Analyze bias in job description
     */
    analyzeBias(jobDescription) {
        const text = JSON.stringify(jobDescription).toLowerCase();
        const biasIssues = [];
        let biasScore = 0;

        // Check for biased language patterns
        Object.keys(this.biasPatterns).forEach(category => {
            this.biasPatterns[category].forEach(({ pattern, replacement }) => {
                const matches = text.match(pattern);
                if (matches) {
                    biasIssues.push({
                        category,
                        issue: matches[0],
                        suggestion: replacement,
                        severity: 'medium'
                    });
                    biasScore += 0.1;
                }
            });
        });

        // Check for exclusive language
        const exclusiveTerms = ['ninja', 'rockstar', 'guru', 'culture fit', 'guys'];
        exclusiveTerms.forEach(term => {
            if (text.includes(term)) {
                biasIssues.push({
                    category: 'exclusive',
                    issue: term,
                    suggestion: 'Use more inclusive language',
                    severity: 'high'
                });
                biasScore += 0.15;
            }
        });

        return {
            score: Math.min(biasScore, 1.0),
            level: biasScore < 0.2 ? 'low' : biasScore < 0.5 ? 'medium' : 'high',
            issues: biasIssues,
            recommendations: this.generateBiasRecommendations(biasIssues),
            compliant: biasScore < 0.3
        };
    }

    /**
     * Helper methods
     */
    getRoleSpecificResponsibilities(role) {
        const roleLower = role.toLowerCase();

        if (roleLower.includes('engineer') || roleLower.includes('developer')) {
            return [
                'Design and implement scalable solutions',
                'Write clean, maintainable code',
                'Participate in code reviews',
                'Collaborate with product and design teams'
            ];
        } else if (roleLower.includes('marketing')) {
            return [
                'Develop and execute marketing campaigns',
                'Analyze campaign performance',
                'Manage marketing channels',
                'Create compelling content'
            ];
        } else if (roleLower.includes('design')) {
            return [
                'Create user-centered designs',
                'Develop prototypes and wireframes',
                'Conduct user research',
                'Collaborate with engineering teams'
            ];
        }

        return ['Contribute to team objectives', 'Maintain professional standards'];
    }

    getIndustryTools(industry) {
        const tools = {
            technology: ['Git', 'Docker', 'Kubernetes', 'CI/CD platforms', 'Cloud services'],
            marketing: ['Google Analytics', 'HubSpot', 'Adobe Creative Suite', 'Social media platforms'],
            design: ['Figma', 'Sketch', 'Adobe Creative Suite', 'Prototyping tools'],
            finance: ['Excel', 'Financial modeling software', 'ERP systems', 'Compliance tools'],
            healthcare: ['Electronic health records', 'Medical devices', 'Compliance systems']
        };

        return tools[industry] || tools.technology;
    }

    generateCareerProgression(role, level) {
        const progressionMap = {
            entry: [`Mid-level ${role}`, `Senior ${role}`, `Lead ${role}`],
            mid: [`Senior ${role}`, `Lead ${role}`, `Principal ${role}`],
            senior: [`Lead ${role}`, `Principal ${role}`, `Director of Engineering`],
            lead: [`Principal ${role}`, `Director`, `VP of Engineering`]
        };

        return {
            nextRoles: progressionMap[level] || [],
            timeframe: '2-3 years per level',
            development: 'Mentorship, training, and project leadership opportunities'
        };
    }

    generateDiversityStatement() {
        return "We are an equal opportunity employer committed to building a diverse and inclusive team. " +
               "We welcome applications from all qualified candidates regardless of race, gender, age, religion, " +
               "sexual orientation, or any other protected characteristic.";
    }

    generateCultureInfo(industry, customCulture) {
        const template = this.industryTemplates[industry] || this.industryTemplates.technology;
        const cultureValues = customCulture || template.culture;

        return {
            values: cultureValues,
            environment: `${cultureValues.join(', ')} workplace`,
            workStyle: 'Collaborative and results-oriented',
            growth: 'Continuous learning and development focused'
        };
    }

    generateApplicationInstructions(company, customProcess) {
        if (customProcess) {
            return customProcess;
        }

        return `To apply, please submit your resume and a brief cover letter explaining your interest in joining ${company}. ` +
               "We review applications on a rolling basis and will contact qualified candidates within 1-2 weeks.";
    }

    generateBiasRecommendations(biasIssues) {
        if (biasIssues.length === 0) {
            return ["Great! No bias issues detected in this job description."];
        }

        const recommendations = [
            "Review and update language to be more inclusive",
            "Consider using gender-neutral pronouns and terms",
            "Focus on skills and qualifications rather than culture fit",
            "Use specific, measurable requirements instead of subjective terms"
        ];

        return recommendations;
    }
}

// Export singleton instance
const jobDescriptionGenerator = new JobDescriptionGenerator();

module.exports = {
    generateJobDescription: jobDescriptionGenerator.generateJobDescription.bind(jobDescriptionGenerator),
    analyzeBias: jobDescriptionGenerator.analyzeBias.bind(jobDescriptionGenerator),
    JobDescriptionGenerator
};