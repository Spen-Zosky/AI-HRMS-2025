const logger = require('../utils/logger');
const aiServiceFactory = require('./aiServiceFactory');
const vectorService = require('./vectorService');
const { SkillsMaster } = require('../../models');

/**
 * Advanced Skills Matching Engine with Semantic Similarity and AI Enhancement
 */
class SkillsMatchingEngine {
    constructor() {
        // Skills hierarchy and relationships cache
        this.skillsCache = null;
        this.skillsHierarchy = new Map();
        this.skillsSynonyms = new Map();

        // Weighted scoring configuration
        this.scoringWeights = {
            exactMatch: 1.0,
            semanticSimilarity: 0.9,
            hierarchicalRelationship: 0.8,
            synonymMatch: 0.7,
            experienceLevel: 0.6,
            transferableSkills: 0.5,
            industryRelevance: 0.4
        };

        // Experience level mapping
        this.experienceLevels = {
            'beginner': 1,
            'basic': 1,
            'intermediate': 2,
            'advanced': 3,
            'expert': 4,
            'master': 5
        };

        // Transferable skills mapping
        this.transferableSkills = {
            // Programming languages
            'javascript': ['typescript', 'node.js', 'react', 'vue', 'angular'],
            'python': ['django', 'flask', 'data science', 'machine learning'],
            'java': ['spring', 'kotlin', 'android development', 'enterprise software'],
            'c++': ['c', 'system programming', 'embedded systems', 'game development'],

            // Databases
            'postgresql': ['mysql', 'database design', 'sql', 'data modeling'],
            'mongodb': ['nosql', 'document databases', 'json', 'database administration'],

            // Cloud platforms
            'aws': ['cloud computing', 'docker', 'kubernetes', 'devops'],
            'azure': ['microsoft cloud', 'cloud architecture', 'containerization'],
            'gcp': ['google cloud', 'big data', 'machine learning platform'],

            // Soft skills
            'leadership': ['team management', 'project management', 'mentoring', 'strategic thinking'],
            'communication': ['presentation skills', 'writing', 'collaboration', 'stakeholder management'],
            'problem solving': ['analytical thinking', 'debugging', 'troubleshooting', 'critical thinking']
        };
    }

    /**
     * Initialize the skills matching engine
     */
    async initialize() {
        try {
            logger.info('Initializing Skills Matching Engine');
            await this.loadSkillsData();
            await this.buildSkillsHierarchy();
            logger.info('Skills Matching Engine initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Skills Matching Engine:', error);
            throw error;
        }
    }

    /**
     * Load skills data from database
     */
    async loadSkillsData() {
        try {
            const skills = await SkillsMaster.findAll({
                include: ['relationships', 'synonyms']
            });

            this.skillsCache = skills.reduce((acc, skill) => {
                acc[skill.skill_name.toLowerCase()] = {
                    id: skill.skill_id,
                    name: skill.skill_name,
                    category: skill.category,
                    subcategory: skill.subcategory,
                    description: skill.description,
                    demand_level: skill.demand_level,
                    relationships: skill.relationships || [],
                    synonyms: skill.synonyms ? skill.synonyms.map(s => s.synonym.toLowerCase()) : []
                };
                return acc;
            }, {});

            logger.info(`Loaded ${Object.keys(this.skillsCache).length} skills from database`);
        } catch (error) {
            logger.error('Error loading skills data:', error);
            // Fallback to basic skill set if database fails
            this.skillsCache = this.createFallbackSkillsData();
        }
    }

    /**
     * Build skills hierarchy and synonyms mapping
     */
    async buildSkillsHierarchy() {
        if (!this.skillsCache) return;

        Object.values(this.skillsCache).forEach(skill => {
            // Build hierarchy relationships
            skill.relationships.forEach(rel => {
                if (!this.skillsHierarchy.has(skill.name.toLowerCase())) {
                    this.skillsHierarchy.set(skill.name.toLowerCase(), {
                        parents: [],
                        children: [],
                        related: []
                    });
                }

                const hierarchy = this.skillsHierarchy.get(skill.name.toLowerCase());

                switch (rel.relationship_type) {
                    case 'prerequisite':
                        hierarchy.parents.push(rel.related_skill_name.toLowerCase());
                        break;
                    case 'builds_on':
                        hierarchy.children.push(rel.related_skill_name.toLowerCase());
                        break;
                    case 'complementary':
                        hierarchy.related.push(rel.related_skill_name.toLowerCase());
                        break;
                }
            });

            // Build synonyms mapping
            skill.synonyms.forEach(synonym => {
                this.skillsSynonyms.set(synonym, skill.name.toLowerCase());
            });
        });
    }

    /**
     * Match candidate skills against job requirements
     */
    async matchSkills(candidateSkills, jobRequiredSkills, jobPreferredSkills = [], options = {}) {
        try {
            logger.info('Starting skills matching analysis');

            if (!this.skillsCache) {
                await this.initialize();
            }

            const candidateProfile = this.normalizeSkills(candidateSkills);
            const requiredProfile = this.normalizeSkills(jobRequiredSkills);
            const preferredProfile = this.normalizeSkills(jobPreferredSkills);

            // Calculate matches for required skills
            const requiredMatches = await this.calculateSkillMatches(candidateProfile, requiredProfile, 'required');
            const preferredMatches = await this.calculateSkillMatches(candidateProfile, preferredProfile, 'preferred');

            // Calculate overall matching score
            const overallScore = this.calculateOverallScore(requiredMatches, preferredMatches);

            // Generate explanations
            const explanations = this.generateMatchExplanations(requiredMatches, preferredMatches);

            // Identify skill gaps
            const skillGaps = this.identifySkillGaps(candidateProfile, requiredProfile, preferredProfile);

            // Get skill recommendations
            const recommendations = await this.generateSkillRecommendations(candidateProfile, skillGaps);

            return {
                overallScore,
                matchBreakdown: {
                    required: {
                        matched: requiredMatches.filter(m => m.score > 0.5).length,
                        total: requiredProfile.length,
                        score: this.calculateCategoryScore(requiredMatches),
                        matches: requiredMatches
                    },
                    preferred: {
                        matched: preferredMatches.filter(m => m.score > 0.5).length,
                        total: preferredProfile.length,
                        score: this.calculateCategoryScore(preferredMatches),
                        matches: preferredMatches
                    }
                },
                skillGaps,
                recommendations,
                explanations,
                confidence: this.calculateConfidence(requiredMatches, preferredMatches),
                processingTime: Date.now(),
                metadata: {
                    candidateSkillsCount: candidateProfile.length,
                    requiredSkillsCount: requiredProfile.length,
                    preferredSkillsCount: preferredProfile.length,
                    matchingMethod: 'semantic_enhanced'
                }
            };

        } catch (error) {
            logger.error('Error in skills matching:', error);
            throw error;
        }
    }

    /**
     * Calculate skill matches between candidate and job requirements
     */
    async calculateSkillMatches(candidateSkills, jobSkills, category) {
        const matches = [];

        for (const jobSkill of jobSkills) {
            const bestMatch = await this.findBestSkillMatch(candidateSkills, jobSkill);
            matches.push({
                jobSkill: jobSkill.name,
                candidateSkill: bestMatch.candidateSkill,
                score: bestMatch.score,
                matchType: bestMatch.type,
                explanation: bestMatch.explanation,
                category
            });
        }

        return matches;
    }

    /**
     * Find the best matching skill from candidate's profile
     */
    async findBestSkillMatch(candidateSkills, jobSkill) {
        let bestMatch = {
            candidateSkill: null,
            score: 0,
            type: 'none',
            explanation: 'No matching skill found'
        };

        const jobSkillLower = jobSkill.name.toLowerCase();

        for (const candidateSkill of candidateSkills) {
            const candidateSkillLower = candidateSkill.name.toLowerCase();
            let score = 0;
            let matchType = 'none';
            let explanation = '';

            // 1. Exact match
            if (candidateSkillLower === jobSkillLower) {
                score = this.scoringWeights.exactMatch;
                matchType = 'exact';
                explanation = 'Exact skill match';
            }
            // 2. Synonym match
            else if (this.skillsSynonyms.has(candidateSkillLower) &&
                     this.skillsSynonyms.get(candidateSkillLower) === jobSkillLower) {
                score = this.scoringWeights.synonymMatch;
                matchType = 'synonym';
                explanation = 'Synonym match found';
            }
            // 3. Hierarchical relationship
            else if (this.hasHierarchicalRelationship(candidateSkillLower, jobSkillLower)) {
                score = this.scoringWeights.hierarchicalRelationship;
                matchType = 'hierarchical';
                explanation = 'Related skill in hierarchy';
            }
            // 4. Transferable skills
            else if (this.hasTransferableRelationship(candidateSkillLower, jobSkillLower)) {
                score = this.scoringWeights.transferableSkills;
                matchType = 'transferable';
                explanation = 'Transferable skill match';
            }
            // 5. Semantic similarity (AI-powered)
            else {
                const semanticScore = await this.calculateSemanticSimilarity(candidateSkillLower, jobSkillLower);
                if (semanticScore > 0.3) {
                    score = semanticScore * this.scoringWeights.semanticSimilarity;
                    matchType = 'semantic';
                    explanation = `Semantic similarity: ${(semanticScore * 100).toFixed(1)}%`;
                }
            }

            // Apply experience level adjustment
            if (score > 0 && candidateSkill.level && jobSkill.level) {
                const levelAdjustment = this.calculateExperienceLevelAdjustment(candidateSkill.level, jobSkill.level);
                score *= levelAdjustment;
                explanation += ` (adjusted for experience level)`;
            }

            // Update best match if this is better
            if (score > bestMatch.score) {
                bestMatch = {
                    candidateSkill: candidateSkill.name,
                    score,
                    type: matchType,
                    explanation
                };
            }
        }

        return bestMatch;
    }

    /**
     * Calculate semantic similarity using AI/vector search
     */
    async calculateSemanticSimilarity(skill1, skill2) {
        try {
            // Try vector similarity first
            const vectorSimilarity = await vectorService.calculateSimilarity(skill1, skill2);
            if (vectorSimilarity !== null) {
                return vectorSimilarity;
            }

            // Fallback to AI-powered similarity
            const provider = await aiServiceFactory.getProvider();
            if (provider) {
                const prompt = `Rate the similarity between these skills on a scale of 0.0 to 1.0: "${skill1}" and "${skill2}". Respond with just the number.`;
                const response = await provider.generateText(prompt, { maxTokens: 10 });
                const similarity = parseFloat(response.trim());
                return isNaN(similarity) ? 0 : Math.min(Math.max(similarity, 0), 1);
            }

            // String similarity fallback
            return this.calculateStringSimilarity(skill1, skill2);

        } catch (error) {
            logger.warn('Semantic similarity calculation failed:', error.message);
            return this.calculateStringSimilarity(skill1, skill2);
        }
    }

    /**
     * Check for hierarchical relationships between skills
     */
    hasHierarchicalRelationship(skill1, skill2) {
        const hierarchy1 = this.skillsHierarchy.get(skill1);
        const hierarchy2 = this.skillsHierarchy.get(skill2);

        if (!hierarchy1 || !hierarchy2) return false;

        return (
            hierarchy1.parents.includes(skill2) ||
            hierarchy1.children.includes(skill2) ||
            hierarchy1.related.includes(skill2) ||
            hierarchy2.parents.includes(skill1) ||
            hierarchy2.children.includes(skill1) ||
            hierarchy2.related.includes(skill1)
        );
    }

    /**
     * Check for transferable skills relationships
     */
    hasTransferableRelationship(skill1, skill2) {
        const transferable1 = this.transferableSkills[skill1] || [];
        const transferable2 = this.transferableSkills[skill2] || [];

        return (
            transferable1.includes(skill2) ||
            transferable2.includes(skill1)
        );
    }

    /**
     * Calculate experience level adjustment factor
     */
    calculateExperienceLevelAdjustment(candidateLevel, requiredLevel) {
        const candidateExp = this.experienceLevels[candidateLevel.toLowerCase()] || 2;
        const requiredExp = this.experienceLevels[requiredLevel.toLowerCase()] || 2;

        if (candidateExp >= requiredExp) {
            return 1.0; // No penalty for meeting or exceeding requirements
        } else {
            return Math.max(0.5, candidateExp / requiredExp); // Penalty for lower experience
        }
    }

    /**
     * Calculate string similarity (fallback method)
     */
    calculateStringSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

        const distance = this.levenshteinDistance(longer, shorter);
        return Math.max(0, (longer.length - distance) / longer.length);
    }

    /**
     * Levenshtein distance calculation
     */
    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));

        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j - 1][i] + 1,
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i - 1] + cost
                );
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Normalize skills array to consistent format
     */
    normalizeSkills(skills) {
        if (!Array.isArray(skills)) return [];

        return skills.map(skill => {
            if (typeof skill === 'string') {
                return { name: skill, level: 'intermediate' };
            }
            return {
                name: skill.name || skill.skill_name || skill,
                level: skill.level || skill.proficiency || 'intermediate',
                experience: skill.experience || skill.years_experience || 0
            };
        });
    }

    /**
     * Calculate overall matching score
     */
    calculateOverallScore(requiredMatches, preferredMatches) {
        const requiredScore = this.calculateCategoryScore(requiredMatches);
        const preferredScore = this.calculateCategoryScore(preferredMatches);

        // Weighted combination (required skills are more important)
        return Math.round((requiredScore * 0.7 + preferredScore * 0.3) * 100) / 100;
    }

    /**
     * Calculate category-specific score
     */
    calculateCategoryScore(matches) {
        if (matches.length === 0) return 0;

        const totalScore = matches.reduce((sum, match) => sum + match.score, 0);
        return Math.round((totalScore / matches.length) * 100) / 100;
    }

    /**
     * Identify skill gaps
     */
    identifySkillGaps(candidateSkills, requiredSkills, preferredSkills) {
        const candidateSkillNames = candidateSkills.map(s => s.name.toLowerCase());

        const missingRequired = requiredSkills.filter(skill =>
            !candidateSkillNames.some(cs =>
                cs === skill.name.toLowerCase() ||
                this.hasAnyRelationship(cs, skill.name.toLowerCase())
            )
        );

        const missingPreferred = preferredSkills.filter(skill =>
            !candidateSkillNames.some(cs =>
                cs === skill.name.toLowerCase() ||
                this.hasAnyRelationship(cs, skill.name.toLowerCase())
            )
        );

        return {
            critical: missingRequired.map(s => s.name),
            preferred: missingPreferred.map(s => s.name),
            total: missingRequired.length + missingPreferred.length
        };
    }

    /**
     * Check if skills have any relationship
     */
    hasAnyRelationship(skill1, skill2) {
        return (
            this.skillsSynonyms.get(skill1) === skill2 ||
            this.hasHierarchicalRelationship(skill1, skill2) ||
            this.hasTransferableRelationship(skill1, skill2)
        );
    }

    /**
     * Generate skill recommendations for candidate
     */
    async generateSkillRecommendations(candidateSkills, skillGaps) {
        const recommendations = [];

        // Recommend critical missing skills
        for (const criticalSkill of skillGaps.critical.slice(0, 5)) {
            const relatedSkills = this.findRelatedSkills(criticalSkill);
            const difficulty = this.estimateLearningDifficulty(candidateSkills, criticalSkill);

            recommendations.push({
                skill: criticalSkill,
                priority: 'high',
                reason: 'Required for job match',
                relatedSkills,
                estimatedLearningTime: difficulty.timeEstimate,
                difficulty: difficulty.level
            });
        }

        // Recommend preferred skills
        for (const preferredSkill of skillGaps.preferred.slice(0, 3)) {
            const relatedSkills = this.findRelatedSkills(preferredSkill);
            const difficulty = this.estimateLearningDifficulty(candidateSkills, preferredSkill);

            recommendations.push({
                skill: preferredSkill,
                priority: 'medium',
                reason: 'Would improve job match',
                relatedSkills,
                estimatedLearningTime: difficulty.timeEstimate,
                difficulty: difficulty.level
            });
        }

        return recommendations;
    }

    /**
     * Find related skills for learning path
     */
    findRelatedSkills(skillName) {
        const skillLower = skillName.toLowerCase();
        const related = [];

        // Check transferable skills
        if (this.transferableSkills[skillLower]) {
            related.push(...this.transferableSkills[skillLower]);
        }

        // Check hierarchical relationships
        const hierarchy = this.skillsHierarchy.get(skillLower);
        if (hierarchy) {
            related.push(...hierarchy.parents, ...hierarchy.children, ...hierarchy.related);
        }

        return [...new Set(related)].slice(0, 3); // Remove duplicates and limit
    }

    /**
     * Estimate learning difficulty based on existing skills
     */
    estimateLearningDifficulty(candidateSkills, targetSkill) {
        const candidateSkillNames = candidateSkills.map(s => s.name.toLowerCase());
        const targetSkillLower = targetSkill.toLowerCase();

        // Check if candidate has related skills
        const hasRelatedSkills = candidateSkillNames.some(skill =>
            this.hasTransferableRelationship(skill, targetSkillLower)
        );

        if (hasRelatedSkills) {
            return { level: 'easy', timeEstimate: '2-4 weeks' };
        }

        // Check if it's in same category
        const targetSkillData = this.skillsCache?.[targetSkillLower];
        if (targetSkillData) {
            const sameCategory = candidateSkills.some(skill => {
                const skillData = this.skillsCache?.[skill.name.toLowerCase()];
                return skillData?.category === targetSkillData.category;
            });

            if (sameCategory) {
                return { level: 'medium', timeEstimate: '1-2 months' };
            }
        }

        return { level: 'hard', timeEstimate: '3-6 months' };
    }

    /**
     * Generate match explanations
     */
    generateMatchExplanations(requiredMatches, preferredMatches) {
        const explanations = {
            strengths: [],
            gaps: [],
            recommendations: []
        };

        // Identify strengths
        const strongMatches = requiredMatches.filter(m => m.score > 0.7);
        if (strongMatches.length > 0) {
            explanations.strengths.push(`Strong matches found for ${strongMatches.length} required skills`);
        }

        // Identify gaps
        const weakMatches = requiredMatches.filter(m => m.score < 0.5);
        if (weakMatches.length > 0) {
            explanations.gaps.push(`${weakMatches.length} required skills need attention`);
        }

        // Generate recommendations
        if (strongMatches.length >= requiredMatches.length * 0.7) {
            explanations.recommendations.push('Candidate is a strong match for this position');
        } else if (strongMatches.length >= requiredMatches.length * 0.5) {
            explanations.recommendations.push('Candidate has good potential with some skill development');
        } else {
            explanations.recommendations.push('Significant skill development would be needed');
        }

        return explanations;
    }

    /**
     * Calculate confidence score for the matching result
     */
    calculateConfidence(requiredMatches, preferredMatches) {
        let confidence = 0.5; // Base confidence

        // Boost confidence for exact matches
        const exactMatches = [...requiredMatches, ...preferredMatches].filter(m => m.type === 'exact');
        confidence += exactMatches.length * 0.1;

        // Reduce confidence for semantic-only matches
        const semanticMatches = [...requiredMatches, ...preferredMatches].filter(m => m.type === 'semantic');
        confidence -= semanticMatches.length * 0.05;

        // Ensure within bounds
        return Math.max(0.1, Math.min(1.0, confidence));
    }

    /**
     * Create fallback skills data if database is unavailable
     */
    createFallbackSkillsData() {
        const fallbackSkills = [
            'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'html', 'css',
            'communication', 'leadership', 'problem solving', 'teamwork', 'project management',
            'git', 'docker', 'kubernetes', 'aws', 'azure', 'postgresql', 'mongodb'
        ];

        return fallbackSkills.reduce((acc, skill) => {
            acc[skill] = {
                id: skill,
                name: skill,
                category: 'general',
                subcategory: 'general',
                description: skill,
                demand_level: 'medium',
                relationships: [],
                synonyms: []
            };
            return acc;
        }, {});
    }
}

// Export singleton instance
const skillsMatchingEngine = new SkillsMatchingEngine();

module.exports = {
    matchSkills: skillsMatchingEngine.matchSkills.bind(skillsMatchingEngine),
    initialize: skillsMatchingEngine.initialize.bind(skillsMatchingEngine),
    SkillsMatchingEngine
};