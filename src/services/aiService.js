const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const logger = require('../utils/logger');
const aiServiceFactory = require('./aiServiceFactory');
const { parseCV: parseAdvancedCV } = require('./advancedCVParser');

// File extraction functions (unchanged)
const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    } catch (error) {
        logger.error('Error extracting text from PDF:', error);
        throw error;
    }
};

const extractTextFromDOCX = async (filePath) => {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        logger.error('Error extracting text from DOCX:', error);
        throw error;
    }
};

const extractTextFromTXT = async (filePath) => {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        logger.error('Error reading TXT file:', error);
        throw error;
    }
};

/**
 * Enhanced CV parser using Advanced NLP with AI fallback
 * Parsing priority: Advanced NLP -> AI Enhancement -> Pattern Matching
 */
const parseCV = async (text) => {
    try {
        logger.info('Starting CV parsing with advanced NLP pipeline');

        // Primary method: Advanced NLP parsing
        try {
            const advancedResult = await parseAdvancedCV(text);

            if (advancedResult && advancedResult.confidence.overall > 0.3) {
                logger.info(`CV parsed successfully with advanced NLP (confidence: ${advancedResult.confidence.overall.toFixed(2)})`);
                return {
                    ...advancedResult,
                    parsingMethod: advancedResult.parsingMethod || 'advanced_nlp'
                };
            } else {
                logger.warn('Advanced NLP parsing had low confidence, trying AI enhancement');
            }
        } catch (nlpError) {
            logger.warn('Advanced NLP parsing failed, trying AI enhancement:', nlpError.message);
        }

        // Secondary method: AI-enhanced parsing
        try {
            const provider = await aiServiceFactory.getProvider();
            const aiParsedCV = await provider.enhanceCVParsing(text);

            if (aiParsedCV && !aiParsedCV.error) {
                logger.info(`CV parsed successfully using AI provider: ${provider.name}`);
                return {
                    ...aiParsedCV,
                    parsingMethod: 'ai_enhanced',
                    provider: provider.name
                };
            }
        } catch (aiError) {
            logger.warn('AI parsing failed, falling back to pattern matching:', aiError.message);
        }

        // Fallback method: Pattern matching (legacy)
        logger.info('Using pattern matching fallback for CV parsing');

        const emailRegex = /([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        const phoneRegex = /(\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})/g;

        // Extract email
        const emailMatch = text.match(emailRegex);
        const email = emailMatch ? emailMatch[0] : null;

        // Extract phone
        const phoneMatch = text.match(phoneRegex);
        const phone = phoneMatch ? phoneMatch[0] : null;

        // Extract name (first two "words" if not common)
        const commonWords = ['cv', 'curriculum', 'vitae', 'resume', 'profile'];
        const words = text.split(/\s+/).filter(word =>
            word.length > 2 &&
            !commonWords.includes(word.toLowerCase()) &&
            /^[A-Za-z]+$/.test(word)
        );
        const name = words.slice(0, 2).join(' ');

        // Enhanced skills extraction using AI if available
        let skillsData = {
            technical: [],
            soft: [],
            business: [],
            industry: []
        };

        try {
            const provider = await aiServiceFactory.getProvider();
            skillsData = await provider.extractSkillsFromText(text, 'resume');
        } catch (skillsError) {
            logger.warn('AI skills extraction failed, using pattern matching');
        }

        // Fallback skills pattern matching
        if (!skillsData.technical.length && !skillsData.soft.length) {
            const techSkills = [
                'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'React', 'Vue', 'Angular',
                'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Docker', 'Kubernetes',
                'AWS', 'Azure', 'GCP', 'PostgreSQL', 'MongoDB', 'MySQL', 'Redis',
                'Git', 'Jenkins', 'Terraform', 'Linux', 'HTML', 'CSS', 'Sass', 'Bootstrap'
            ];

            skillsData.technical = techSkills.filter(skill =>
                text.toLowerCase().includes(skill.toLowerCase())
            );
        }

        // Extract years of experience
        const experienceRegex = /(\d+)[\s-]*(?:years?|anni|year|anno)/gi;
        const expMatch = text.match(experienceRegex);
        const experience = expMatch ?
            Math.max(...expMatch.map(match => parseInt(match.match(/\d+/)[0]))) : 0;

        // Extract education
        const educationKeywords = ['university', 'università', 'degree', 'laurea', 'master', 'phd', 'bachelor'];
        const educationLines = text.split('\n').filter(line =>
            educationKeywords.some(keyword =>
                line.toLowerCase().includes(keyword)
            )
        );

        return {
            personalInfo: {
                name: name || 'Not found',
                email: email,
                phone: phone,
                address: null
            },
            skills: [...skillsData.technical, ...skillsData.soft, ...skillsData.business],
            skillsCategories: skillsData,
            experience: {
                yearsTotal: experience,
                positions: []
            },
            education: educationLines.slice(0, 3),
            languages: [],
            summary: text.substring(0, 200) + '...',
            parsingMethod: 'pattern_matching',
            confidence: {
                overall: 0.4, // Basic confidence for pattern matching
                personalInfo: email || phone ? 0.6 : 0.2,
                experience: experience > 0 ? 0.5 : 0.1,
                education: educationLines.length > 0 ? 0.5 : 0.1,
                skills: skillsData.technical.length > 0 ? 0.6 : 0.2,
                languages: 0.1
            }
        };

    } catch (error) {
        logger.error('Error parsing CV:', error);
        throw error;
    }
};

/**
 * AI-powered job description generation
 */
const generateJobDescription = async (role, company, requirements = {}) => {
    try {
        const provider = await aiServiceFactory.getProvider();
        return await provider.generateJobDescription(role, company, requirements);
    } catch (error) {
        logger.error('Error generating job description:', error);
        throw error;
    }
};

/**
 * AI-powered skills extraction
 */
const extractSkillsFromText = async (text, context = 'resume') => {
    try {
        const provider = await aiServiceFactory.getProvider();
        return await provider.extractSkillsFromText(text, context);
    } catch (error) {
        logger.error('Error extracting skills from text:', error);
        throw error;
    }
};

/**
 * AI-powered interview questions generation
 */
const generateInterviewQuestions = async (role, skills = [], experienceLevel = 'mid') => {
    try {
        const provider = await aiServiceFactory.getProvider();
        return await provider.generateInterviewQuestions(role, skills, experienceLevel);
    } catch (error) {
        logger.error('Error generating interview questions:', error);
        throw error;
    }
};

/**
 * AI-powered bias analysis
 */
const analyzeBiasInText = async (text, type = 'job_description') => {
    try {
        const provider = await aiServiceFactory.getProvider();
        return await provider.analyzeBiasInText(text, type);
    } catch (error) {
        logger.error('Error analyzing bias in text:', error);
        throw error;
    }
};

/**
 * Get AI service status and provider information
 */
const getServiceStatus = async () => {
    try {
        const currentProvider = await aiServiceFactory.getProvider();
        const allProviders = await aiServiceFactory.getProviderStatus();

        return {
            currentProvider: currentProvider ? currentProvider.name : 'none',
            availableProviders: allProviders,
            initialized: aiServiceFactory.initialized
        };
    } catch (error) {
        logger.error('Error getting service status:', error);
        return {
            currentProvider: 'none',
            availableProviders: {},
            initialized: false,
            error: error.message
        };
    }
};

/**
 * Switch to a specific AI provider
 */
const switchProvider = async (providerName) => {
    try {
        await aiServiceFactory.switchProvider(providerName);
        logger.info(`Successfully switched to provider: ${providerName}`);
        return true;
    } catch (error) {
        logger.error(`Error switching to provider ${providerName}:`, error);
        throw error;
    }
};

// Bias analysis for recruiting (unchanged)
const analyzeBias = (cvData, jobRequirements = {}) => {
    const biasChecks = {
        nameGendered: false,
        ageIndicators: false,
        locationBias: false,
        overqualified: false
    };

    const warnings = [];

    // Check for gender indicators in name
    const maleNames = ['mario', 'giuseppe', 'franco', 'luigi', 'antonio'];
    const femaleNames = ['maria', 'anna', 'giulia', 'francesca', 'laura'];

    const firstName = (cvData.personalInfo?.name || '').split(' ')[0]?.toLowerCase();
    if (firstName && (maleNames.includes(firstName) || femaleNames.includes(firstName))) {
        biasChecks.nameGendered = true;
        warnings.push('Nome potenzialmente indicativo di genere rilevato');
    }

    // Check for over-qualification
    const candidateExp = cvData.experience?.yearsTotal || 0;
    const maxExp = jobRequirements.maxExperience || 10;
    if (candidateExp > maxExp) {
        biasChecks.overqualified = true;
        warnings.push('Candidato potenzialmente sovra-qualificato');
    }

    return {
        biasScore: warnings.length / 4,
        checks: biasChecks,
        warnings: warnings,
        recommendation: warnings.length > 2 ? 'REVIEW_REQUIRED' : 'OK'
    };
};

// Candidate ranking with explanations (unchanged)
const rankCandidates = (candidates, jobCriteria) => {
    const rankedCandidates = candidates.map(candidate => {
        let score = 0;
        const explanations = [];

        // Skills match score
        const requiredSkills = jobCriteria.skills || [];
        const candidateSkills = candidate.skills || [];
        const matchedSkills = candidateSkills.filter(skill =>
            requiredSkills.some(req =>
                req.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(req.toLowerCase())
            )
        );

        const skillsScore = requiredSkills.length > 0 ?
            (matchedSkills.length / requiredSkills.length) * 40 : 0;
        score += skillsScore;

        if (matchedSkills.length > 0) {
            explanations.push({
                factor: 'Skills Match',
                impact: skillsScore,
                details: `${matchedSkills.length}/${requiredSkills.length} skills richieste`
            });
        }

        // Experience score
        const minExp = jobCriteria.minExperience || 0;
        const maxExp = jobCriteria.maxExperience || 15;
        const candidateExp = candidate.experience?.yearsTotal || 0;

        let expScore = 0;
        if (candidateExp >= minExp && candidateExp <= maxExp) {
            expScore = 30;
        } else if (candidateExp < minExp) {
            expScore = (candidateExp / minExp) * 30;
        } else {
            expScore = 25;
        }
        score += expScore;

        explanations.push({
            factor: 'Experience',
            impact: expScore,
            details: `${candidateExp} anni di esperienza`
        });

        // Profile completeness score
        const email = candidate.personalInfo?.email;
        const phone = candidate.personalInfo?.phone;
        const skills = candidate.skills || [];
        const education = candidate.education || [];

        const completenessScore = (
            (email ? 10 : 0) +
            (phone ? 10 : 0) +
            (skills.length > 0 ? 10 : 0) +
            (education.length > 0 ? 10 : 0)
        );
        score += completenessScore;

        if (completenessScore > 0) {
            explanations.push({
                factor: 'Profile Completeness',
                impact: completenessScore,
                details: 'Profilo completo con contatti e informazioni'
            });
        }

        return {
            ...candidate,
            score: Math.round(score),
            explanations,
            biasAnalysis: analyzeBias(candidate, jobCriteria)
        };
    });

    return rankedCandidates.sort((a, b) => b.score - a.score);
};

module.exports = {
    // File extraction
    extractTextFromPDF,
    extractTextFromDOCX,
    extractTextFromTXT,

    // AI-powered functions
    parseCV,
    generateJobDescription,
    extractSkillsFromText,
    generateInterviewQuestions,
    analyzeBiasInText,

    // Service management
    getServiceStatus,
    switchProvider,

    // Legacy functions (non-AI)
    analyzeBias,
    rankCandidates
};