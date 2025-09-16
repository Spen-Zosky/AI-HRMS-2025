const { SkillsMaster, SkillsRelationship, SkillsSynonyms } = require('../../models');
const natural = require('natural');
const logger = require('../utils/logger');

/**
 * Advanced Skills Inference Engine
 * Extracts and infers skills from text using multiple AI and NLP techniques
 */
class SkillsInferenceEngine {
    constructor() {
        this.skillsCache = new Map();
        this.synonymsCache = new Map();
        this.relationshipsCache = new Map();
        this.tokenizer = new natural.WordTokenizer();
        this.stemmer = natural.PorterStemmer;

        // Initialize inference models
        this.initialized = false;
        this.skillPatterns = new Map();
        this.contextualWeights = new Map();
    }

    /**
     * Initialize the inference engine with skills data
     */
    async initialize() {
        if (this.initialized) return;

        logger.info('Initializing Skills Inference Engine');

        // Load all skills into cache
        const skills = await SkillsMaster.findAll({
            include: [
                {
                    model: SkillsSynonyms,
                    as: 'synonyms',
                    required: false
                },
                {
                    model: SkillsRelationship,
                    as: 'relationships',
                    required: false
                }
            ]
        });

        // Build skills cache with normalized names
        for (const skill of skills) {
            const skillKey = this.normalizeText(skill.skill_name);
            this.skillsCache.set(skillKey, {
                id: skill.skill_id,
                name: skill.skill_name,
                type: skill.skill_type,
                level: skill.skill_level,
                source: skill.source_taxonomy,
                isEmerging: skill.is_emerging,
                marketDemand: skill.market_demand,
                automationRisk: skill.automation_risk,
                growthRate: skill.growth_rate
            });

            // Build synonyms cache
            if (skill.synonyms && skill.synonyms.length > 0) {
                const synonyms = skill.synonyms.map(s => this.normalizeText(s.synonym_text));
                this.synonymsCache.set(skillKey, synonyms);

                // Map synonyms back to main skill
                synonyms.forEach(synonym => {
                    this.skillsCache.set(synonym, this.skillsCache.get(skillKey));
                });
            }

            // Build relationships cache
            if (skill.relationships && skill.relationships.length > 0) {
                this.relationshipsCache.set(skillKey, skill.relationships);
            }

            // Build skill patterns for better matching
            this.buildSkillPatterns(skill);
        }

        // Build contextual weights
        this.buildContextualWeights();

        this.initialized = true;
        logger.info(`Skills Inference Engine initialized with ${skills.length} skills`);
    }

    /**
     * Build skill patterns for advanced matching
     */
    buildSkillPatterns(skill) {
        const skillName = skill.skill_name.toLowerCase();
        const patterns = [];

        // Exact match pattern
        patterns.push(new RegExp(`\\b${this.escapeRegex(skillName)}\\b`, 'gi'));

        // Partial word matching for compound skills
        if (skillName.includes(' ')) {
            const words = skillName.split(' ');
            if (words.length >= 2) {
                // Create pattern for all words present
                const wordPattern = words.map(word => `(?=.*\\b${this.escapeRegex(word)}\\b)`).join('');
                patterns.push(new RegExp(wordPattern, 'gi'));
            }
        }

        // Acronym patterns
        if (skillName.includes(' ')) {
            const acronym = skillName.split(' ').map(word => word[0]).join('').toUpperCase();
            if (acronym.length >= 2) {
                patterns.push(new RegExp(`\\b${acronym}\\b`, 'g'));
            }
        }

        // Technology-specific patterns
        if (skill.skill_type === 'technical') {
            // Programming languages
            if (skillName.match(/\b(javascript|python|java|php|ruby|go|rust|swift)\b/i)) {
                patterns.push(new RegExp(`\\b${skillName.split(' ')[0]}\\b`, 'gi'));
            }

            // Frameworks and libraries
            if (skillName.match(/\b(react|angular|vue|node|express|django|flask|spring)\b/i)) {
                patterns.push(new RegExp(`\\b${skillName}\\b`, 'gi'));
            }
        }

        this.skillPatterns.set(skill.skill_id, patterns);
    }

    /**
     * Build contextual weights for different skill categories
     */
    buildContextualWeights() {
        this.contextualWeights.set('technical', {
            experience: 1.2,
            projects: 1.5,
            technologies: 1.3,
            programming: 1.4,
            development: 1.3
        });

        this.contextualWeights.set('soft', {
            achievements: 1.3,
            leadership: 1.4,
            team: 1.2,
            communication: 1.3,
            collaboration: 1.2
        });

        this.contextualWeights.set('business', {
            management: 1.4,
            strategy: 1.3,
            operations: 1.2,
            planning: 1.2,
            analysis: 1.3
        });

        this.contextualWeights.set('leadership', {
            managed: 1.5,
            led: 1.4,
            directed: 1.3,
            supervised: 1.3,
            coordinated: 1.2
        });
    }

    /**
     * Infer skills from text with confidence scoring
     */
    async inferSkills(text, options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        const {
            includeConfidence = true,
            minConfidence = 0.3,
            maxSkills = 50,
            contextualAnalysis = true
        } = options;

        const normalizedText = this.normalizeText(text);
        const tokens = this.tokenizer.tokenize(normalizedText);
        const skillMatches = new Map();

        // Phase 1: Direct skill matching
        await this.directSkillMatching(text, skillMatches);

        // Phase 2: Synonym and pattern matching
        await this.synonymMatching(text, skillMatches);

        // Phase 3: Contextual analysis
        if (contextualAnalysis) {
            await this.contextualAnalysis(text, skillMatches);
        }

        // Phase 4: Relationship-based inference
        await this.relationshipInference(skillMatches);

        // Phase 5: Confidence scoring and ranking
        const scoredSkills = this.calculateConfidenceScores(skillMatches, text);

        // Filter and sort results
        const results = Array.from(scoredSkills.values())
            .filter(skill => skill.confidence >= minConfidence)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, maxSkills);

        return {
            skills: results,
            totalFound: results.length,
            analysisMetrics: {
                textLength: text.length,
                tokensAnalyzed: tokens.length,
                directMatches: Array.from(skillMatches.values()).filter(s => s.matchType === 'direct').length,
                synonymMatches: Array.from(skillMatches.values()).filter(s => s.matchType === 'synonym').length,
                inferredMatches: Array.from(skillMatches.values()).filter(s => s.matchType === 'inferred').length
            }
        };
    }

    /**
     * Direct skill name matching
     */
    async directSkillMatching(text, skillMatches) {
        const normalizedText = this.normalizeText(text);

        for (const [skillKey, skillData] of this.skillsCache) {
            const skillName = skillData.name.toLowerCase();

            // Exact phrase matching
            if (normalizedText.includes(skillKey)) {
                const occurrences = (normalizedText.match(new RegExp(this.escapeRegex(skillKey), 'gi')) || []).length;

                skillMatches.set(skillData.id, {
                    ...skillData,
                    confidence: 0.9,
                    occurrences,
                    matchType: 'direct',
                    matchedText: skillData.name,
                    context: this.extractContext(text, skillData.name)
                });
            }

            // Pattern-based matching for this skill
            const patterns = this.skillPatterns.get(skillData.id);
            if (patterns) {
                for (const pattern of patterns) {
                    const matches = text.match(pattern);
                    if (matches && matches.length > 0) {
                        const existing = skillMatches.get(skillData.id);
                        if (!existing || existing.confidence < 0.8) {
                            skillMatches.set(skillData.id, {
                                ...skillData,
                                confidence: 0.8,
                                occurrences: matches.length,
                                matchType: 'pattern',
                                matchedText: matches[0],
                                context: this.extractContext(text, matches[0])
                            });
                        }
                    }
                }
            }
        }
    }

    /**
     * Synonym-based matching
     */
    async synonymMatching(text, skillMatches) {
        const normalizedText = this.normalizeText(text);

        for (const [skillKey, synonyms] of this.synonymsCache) {
            for (const synonym of synonyms) {
                if (normalizedText.includes(synonym)) {
                    const skillData = this.skillsCache.get(skillKey);
                    if (skillData && !skillMatches.has(skillData.id)) {
                        const occurrences = (normalizedText.match(new RegExp(this.escapeRegex(synonym), 'gi')) || []).length;

                        skillMatches.set(skillData.id, {
                            ...skillData,
                            confidence: 0.75,
                            occurrences,
                            matchType: 'synonym',
                            matchedText: synonym,
                            context: this.extractContext(text, synonym)
                        });
                    }
                }
            }
        }
    }

    /**
     * Contextual analysis to improve skill detection
     */
    async contextualAnalysis(text, skillMatches) {
        const normalizedText = text.toLowerCase();

        // Define context indicators
        const contextIndicators = {
            technical: ['programming', 'development', 'coding', 'software', 'technology', 'system', 'database', 'api'],
            experience: ['years', 'experience', 'worked', 'developed', 'implemented', 'built', 'created'],
            proficiency: ['expert', 'advanced', 'proficient', 'experienced', 'skilled', 'fluent', 'mastery'],
            project: ['project', 'application', 'system', 'platform', 'solution', 'implementation']
        };

        // Boost confidence for skills mentioned in strong contexts
        for (const [skillId, skillMatch] of skillMatches) {
            const skillType = skillMatch.type;
            const context = skillMatch.context.toLowerCase();

            let contextBoost = 0;

            // Check for context indicators
            for (const [contextType, indicators] of Object.entries(contextIndicators)) {
                const foundIndicators = indicators.filter(indicator => context.includes(indicator));
                if (foundIndicators.length > 0) {
                    contextBoost += foundIndicators.length * 0.1;
                }
            }

            // Apply skill-type specific context weights
            const typeWeights = this.contextualWeights.get(skillType) || {};
            for (const [keyword, weight] of Object.entries(typeWeights)) {
                if (context.includes(keyword)) {
                    contextBoost += (weight - 1) * 0.5;
                }
            }

            // Update confidence with context boost
            skillMatch.confidence = Math.min(1.0, skillMatch.confidence + contextBoost);
            skillMatches.set(skillId, skillMatch);
        }
    }

    /**
     * Infer related skills based on relationships
     */
    async relationshipInference(skillMatches) {
        const inferredSkills = new Map();

        for (const [skillId, skillMatch] of skillMatches) {
            const relationships = this.relationshipsCache.get(this.normalizeText(skillMatch.name));

            if (relationships) {
                for (const relationship of relationships) {
                    const relatedSkillId = relationship.target_skill_id;
                    const relatedSkill = await SkillsMaster.findByPk(relatedSkillId);

                    if (relatedSkill && !skillMatches.has(relatedSkillId) && !inferredSkills.has(relatedSkillId)) {
                        let inferenceConfidence = 0.4;

                        // Adjust confidence based on relationship type
                        switch (relationship.relationship_type) {
                            case 'prerequisite':
                                inferenceConfidence = 0.6;
                                break;
                            case 'builds_on':
                                inferenceConfidence = 0.5;
                                break;
                            case 'complementary':
                                inferenceConfidence = 0.4;
                                break;
                            case 'similar':
                                inferenceConfidence = 0.45;
                                break;
                        }

                        // Boost confidence if multiple skills point to this one
                        const parentConfidence = skillMatch.confidence;
                        inferenceConfidence *= parentConfidence;

                        inferredSkills.set(relatedSkillId, {
                            id: relatedSkill.skill_id,
                            name: relatedSkill.skill_name,
                            type: relatedSkill.skill_type,
                            level: relatedSkill.skill_level,
                            source: relatedSkill.source_taxonomy,
                            confidence: inferenceConfidence,
                            occurrences: 0,
                            matchType: 'inferred',
                            matchedText: `Inferred from ${skillMatch.name}`,
                            context: `Related skill (${relationship.relationship_type})`
                        });
                    }
                }
            }
        }

        // Add inferred skills to main collection
        for (const [skillId, inferredSkill] of inferredSkills) {
            skillMatches.set(skillId, inferredSkill);
        }
    }

    /**
     * Calculate final confidence scores
     */
    calculateConfidenceScores(skillMatches, originalText) {
        const scoredSkills = new Map();

        for (const [skillId, skillMatch] of skillMatches) {
            let finalConfidence = skillMatch.confidence;

            // Boost confidence based on skill characteristics
            if (skillMatch.isEmerging) {
                finalConfidence *= 1.1; // Boost emerging skills
            }

            if (skillMatch.marketDemand === 'very_high') {
                finalConfidence *= 1.05;
            }

            // Frequency boost
            if (skillMatch.occurrences > 1) {
                finalConfidence *= Math.min(1.2, 1 + (skillMatch.occurrences - 1) * 0.1);
            }

            // Penalize very low automation risk skills slightly (might be too generic)
            if (skillMatch.automationRisk === 'very_low') {
                finalConfidence *= 0.95;
            }

            scoredSkills.set(skillId, {
                ...skillMatch,
                confidence: Math.min(1.0, finalConfidence)
            });
        }

        return scoredSkills;
    }

    /**
     * Extract context around skill mentions
     */
    extractContext(text, skillText, contextLength = 100) {
        const skillIndex = text.toLowerCase().indexOf(skillText.toLowerCase());
        if (skillIndex === -1) return '';

        const start = Math.max(0, skillIndex - contextLength);
        const end = Math.min(text.length, skillIndex + skillText.length + contextLength);

        return text.substring(start, end).trim();
    }

    /**
     * Normalize text for consistent matching
     */
    normalizeText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
            .replace(/\s+/g, ' ')     // Normalize whitespace
            .trim();
    }

    /**
     * Escape special regex characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Batch process multiple texts for skills inference
     */
    async batchInferSkills(texts, options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        const results = [];
        const batchSize = options.batchSize || 10;

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const batchPromises = batch.map(async (text, index) => {
                try {
                    const result = await this.inferSkills(text, options);
                    return { index: i + index, result, success: true };
                } catch (error) {
                    logger.error(`Error processing text at index ${i + index}:`, error);
                    return { index: i + index, error: error.message, success: false };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        return results;
    }

    /**
     * Get skill statistics and analytics
     */
    async getSkillsAnalytics() {
        if (!this.initialized) {
            await this.initialize();
        }

        const analytics = {
            totalSkills: this.skillsCache.size,
            skillsByType: {},
            skillsBySource: {},
            emergingSkillsCount: 0,
            highDemandSkillsCount: 0,
            relationshipsCount: this.relationshipsCache.size,
            synonymsCount: Array.from(this.synonymsCache.values()).reduce((acc, synonyms) => acc + synonyms.length, 0)
        };

        for (const [, skillData] of this.skillsCache) {
            // Count by type
            analytics.skillsByType[skillData.type] = (analytics.skillsByType[skillData.type] || 0) + 1;

            // Count by source
            analytics.skillsBySource[skillData.source] = (analytics.skillsBySource[skillData.source] || 0) + 1;

            // Count emerging skills
            if (skillData.isEmerging) {
                analytics.emergingSkillsCount++;
            }

            // Count high demand skills
            if (skillData.marketDemand === 'very_high' || skillData.marketDemand === 'high') {
                analytics.highDemandSkillsCount++;
            }
        }

        return analytics;
    }
}

module.exports = SkillsInferenceEngine;