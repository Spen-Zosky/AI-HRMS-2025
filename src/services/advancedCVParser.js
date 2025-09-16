const natural = require('natural');
const compromise = require('compromise');
const { format, parse, isValid } = require('date-fns');
const logger = require('../utils/logger');
const aiServiceFactory = require('./aiServiceFactory');

// Enhanced tokenizer and stemmer
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const analyzer = natural.SentimentAnalyzer;

/**
 * Advanced CV Parser with Named Entity Recognition and Structured Data Extraction
 */
class AdvancedCVParser {
    constructor() {
        this.confidence = {
            personalInfo: 0,
            experience: 0,
            education: 0,
            skills: 0,
            languages: 0,
            overall: 0
        };

        // Language patterns for multi-language support
        this.languagePatterns = {
            en: {
                sections: ['experience', 'work experience', 'employment', 'career', 'professional experience'],
                education: ['education', 'academic', 'qualification', 'degree', 'university', 'college'],
                skills: ['skills', 'competencies', 'expertise', 'abilities', 'technical skills'],
                languages: ['languages', 'linguistic', 'language proficiency'],
                certifications: ['certifications', 'certificates', 'certified'],
                projects: ['projects', 'portfolio', 'achievements']
            },
            it: {
                sections: ['esperienza', 'esperienza lavorativa', 'impiego', 'carriera'],
                education: ['istruzione', 'formazione', 'educazione', 'laurea', 'università'],
                skills: ['competenze', 'abilità', 'capacità', 'competenze tecniche'],
                languages: ['lingue', 'linguistico', 'competenze linguistiche'],
                certifications: ['certificazioni', 'certificati', 'qualifiche'],
                projects: ['progetti', 'portfolio', 'realizzazioni']
            },
            es: {
                sections: ['experiencia', 'experiencia laboral', 'empleo', 'carrera'],
                education: ['educación', 'formación', 'académico', 'título', 'universidad'],
                skills: ['habilidades', 'competencias', 'destrezas', 'capacidades'],
                languages: ['idiomas', 'lenguas', 'competencia lingüística'],
                certifications: ['certificaciones', 'certificados', 'cualificaciones'],
                projects: ['proyectos', 'portafolio', 'logros']
            },
            fr: {
                sections: ['expérience', 'expérience professionnelle', 'emploi', 'carrière'],
                education: ['éducation', 'formation', 'académique', 'diplôme', 'université'],
                skills: ['compétences', 'aptitudes', 'capacités', 'savoir-faire'],
                languages: ['langues', 'compétences linguistiques'],
                certifications: ['certifications', 'certificats', 'qualifications'],
                projects: ['projets', 'portfolio', 'réalisations']
            }
        };

        // Skill categories and keywords
        this.skillCategories = {
            technical: {
                programming: ['javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'typescript'],
                frameworks: ['react', 'vue', 'angular', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails'],
                databases: ['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'oracle', 'sqlite'],
                cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'gitlab'],
                tools: ['git', 'jira', 'confluence', 'figma', 'photoshop', 'illustrator', 'sketch']
            },
            soft: ['leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking', 'creativity', 'adaptability'],
            business: ['project management', 'agile', 'scrum', 'lean', 'six sigma', 'business analysis', 'strategy'],
            languages: ['english', 'spanish', 'french', 'german', 'italian', 'chinese', 'japanese', 'portuguese']
        };
    }

    /**
     * Main parsing method with confidence scoring
     */
    async parseCV(text) {
        try {
            logger.info('Starting advanced CV parsing with NER and structured extraction');

            // Detect language
            const detectedLanguage = this.detectLanguage(text);
            logger.info(`Detected language: ${detectedLanguage}`);

            // Clean and preprocess text
            const cleanedText = this.preprocessText(text);

            // Extract sections using NLP
            const sections = this.extractSections(cleanedText, detectedLanguage);

            // Named Entity Recognition
            const entities = this.performNER(cleanedText);

            // Extract structured data
            const structuredData = await this.extractStructuredData(sections, entities, cleanedText);

            // Calculate confidence scores
            this.calculateConfidence(structuredData, cleanedText);

            // Try AI enhancement if available
            let aiEnhancedData = null;
            try {
                const provider = await aiServiceFactory.getProvider();
                if (provider) {
                    aiEnhancedData = await provider.enhanceCVParsing(text);
                    if (aiEnhancedData && !aiEnhancedData.error) {
                        // Merge AI data with structured data
                        structuredData.aiEnhancements = aiEnhancedData;
                        structuredData.parsingMethod = 'hybrid_ai_nlp';
                        this.confidence.overall = Math.min(this.confidence.overall + 0.1, 1.0);
                    }
                }
            } catch (aiError) {
                logger.warn('AI enhancement failed, using NLP-only parsing:', aiError.message);
            }

            return {
                ...structuredData,
                language: detectedLanguage,
                confidence: this.confidence,
                parsingMethod: structuredData.parsingMethod || 'advanced_nlp',
                processingTimestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Error in advanced CV parsing:', error);
            throw error;
        }
    }

    /**
     * Detect text language using character frequency analysis
     */
    detectLanguage(text) {
        const langScores = { en: 0, it: 0, es: 0, fr: 0 };
        const lowerText = text.toLowerCase();

        // Language-specific character patterns
        const patterns = {
            en: /\b(the|and|of|to|a|in|for|is|on|that|by|this|with|i|you|it|not|or|be|are|from|at|as|your|all|any|can|had|her|was|one|our|out|day|get|has|him|his|how|man|new|now|old|see|two|way|who|boy|did|its|let|put|say|she|too|use)\b/g,
            it: /\b(il|la|di|e|a|da|in|un|che|per|con|non|una|su|le|del|si|è|lo|gli|come|al|ma|se|ci|o|anche|hai|delle|nella|sulla|dalla|alla|questa|tutto|quando|essere|fare|più|dire|molto|bene|dove|cosa)\b/g,
            es: /\b(el|la|de|y|a|en|un|es|se|no|te|lo|le|da|su|por|son|con|para|una|él|las|del|los|al|como|le|fue|si|más|pero|sus|me|ya|muy|hasta|desde|está|cuando|todo|esta|ser|tienen|había|donde)\b/g,
            fr: /\b(le|de|et|à|un|il|être|et|en|avoir|que|pour|dans|ce|son|une|sur|avec|ne|se|pas|tout|plus|par|grand|en|me|même|y|ces|mon|contre|tout|autre|comme|notre|temps|très|sans|bien|où)\b/g
        };

        Object.keys(patterns).forEach(lang => {
            const matches = lowerText.match(patterns[lang]);
            langScores[lang] = matches ? matches.length : 0;
        });

        const detectedLang = Object.keys(langScores).reduce((a, b) =>
            langScores[a] > langScores[b] ? a : b
        );

        return detectedLang;
    }

    /**
     * Preprocess text for better parsing
     */
    preprocessText(text) {
        return text
            .replace(/\r\n/g, '\n')
            .replace(/\t/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Extract sections using NLP and pattern matching
     */
    extractSections(text, language) {
        const patterns = this.languagePatterns[language] || this.languagePatterns.en;
        const sections = {};

        // Split text into lines for section detection
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        let currentSection = 'header';
        let currentContent = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            let sectionFound = false;

            // Check for section headers
            Object.keys(patterns).forEach(sectionType => {
                patterns[sectionType].forEach(pattern => {
                    if (line.includes(pattern) && line.length < 50) {
                        if (currentSection && currentContent.length > 0) {
                            sections[currentSection] = currentContent.join('\n');
                        }
                        currentSection = sectionType;
                        currentContent = [];
                        sectionFound = true;
                    }
                });
            });

            if (!sectionFound) {
                currentContent.push(lines[i]);
            }
        }

        // Add last section
        if (currentSection && currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n');
        }

        return sections;
    }

    /**
     * Named Entity Recognition using compromise.js
     */
    performNER(text) {
        const doc = compromise(text);

        return {
            people: doc.people().out('array'),
            places: doc.places().out('array'),
            organizations: doc.organizations().out('array'),
            dates: doc.match('#Date').out('array'),
            emails: this.extractEmails(text),
            phones: this.extractPhones(text),
            urls: this.extractUrls(text)
        };
    }

    /**
     * Extract structured data from sections and entities
     */
    async extractStructuredData(sections, entities, fullText) {
        const data = {
            personalInfo: this.extractPersonalInfo(sections, entities, fullText),
            experience: this.extractExperience(sections, entities),
            education: this.extractEducation(sections, entities),
            skills: await this.extractAdvancedSkills(sections, fullText),
            languages: this.extractLanguages(sections, fullText),
            certifications: this.extractCertifications(sections, fullText),
            projects: this.extractProjects(sections, fullText),
            summary: this.extractSummary(sections, fullText)
        };

        return data;
    }

    /**
     * Extract personal information with confidence scoring
     */
    extractPersonalInfo(sections, entities, fullText) {
        const headerText = sections.header || '';
        const lines = headerText.split('\n').slice(0, 5); // First 5 lines

        const personalInfo = {
            name: this.extractName(entities, lines),
            email: entities.emails[0] || null,
            phone: entities.phones[0] || null,
            address: this.extractAddress(entities, headerText),
            linkedIn: this.extractLinkedIn(fullText),
            website: entities.urls.find(url => !url.includes('linkedin')) || null
        };

        // Calculate confidence for personal info
        let confidence = 0;
        if (personalInfo.name) confidence += 0.3;
        if (personalInfo.email) confidence += 0.25;
        if (personalInfo.phone) confidence += 0.2;
        if (personalInfo.address) confidence += 0.15;
        if (personalInfo.linkedIn || personalInfo.website) confidence += 0.1;

        this.confidence.personalInfo = confidence;

        return personalInfo;
    }

    /**
     * Extract work experience with dates and positions
     */
    extractExperience(sections, entities) {
        const experienceText = sections.sections || sections.experience || '';
        if (!experienceText) {
            this.confidence.experience = 0;
            return { yearsTotal: 0, positions: [] };
        }

        const positions = this.parseWorkPositions(experienceText);
        const yearsTotal = this.calculateTotalExperience(positions);

        this.confidence.experience = positions.length > 0 ? Math.min(positions.length * 0.2, 1.0) : 0;

        return {
            yearsTotal,
            positions
        };
    }

    /**
     * Extract education information
     */
    extractEducation(sections, entities) {
        const educationText = sections.education || '';
        if (!educationText) {
            this.confidence.education = 0;
            return [];
        }

        const education = this.parseEducation(educationText);
        this.confidence.education = education.length > 0 ? Math.min(education.length * 0.3, 1.0) : 0;

        return education;
    }

    /**
     * Advanced skills extraction with categorization
     */
    async extractAdvancedSkills(sections, fullText) {
        const skillsText = sections.skills || '';
        const allText = (skillsText + ' ' + fullText).toLowerCase();

        const extractedSkills = {
            technical: [],
            soft: [],
            business: [],
            languages: [],
            tools: []
        };

        // Extract technical skills
        Object.keys(this.skillCategories.technical).forEach(category => {
            this.skillCategories.technical[category].forEach(skill => {
                if (allText.includes(skill.toLowerCase())) {
                    if (category === 'tools') {
                        extractedSkills.tools.push(skill);
                    } else {
                        extractedSkills.technical.push(skill);
                    }
                }
            });
        });

        // Extract soft skills
        this.skillCategories.soft.forEach(skill => {
            if (allText.includes(skill.toLowerCase())) {
                extractedSkills.soft.push(skill);
            }
        });

        // Extract business skills
        this.skillCategories.business.forEach(skill => {
            if (allText.includes(skill.toLowerCase())) {
                extractedSkills.business.push(skill);
            }
        });

        // Try AI enhancement for skills
        try {
            const provider = await aiServiceFactory.getProvider();
            if (provider) {
                const aiSkills = await provider.extractSkillsFromText(fullText, 'resume');
                if (aiSkills && !aiSkills.error) {
                    // Merge AI-extracted skills
                    extractedSkills.aiEnhanced = aiSkills;
                }
            }
        } catch (aiError) {
            logger.warn('AI skills enhancement failed:', aiError.message);
        }

        const totalSkills = extractedSkills.technical.length +
                           extractedSkills.soft.length +
                           extractedSkills.business.length;

        this.confidence.skills = totalSkills > 0 ? Math.min(totalSkills * 0.1, 1.0) : 0;

        return extractedSkills;
    }

    /**
     * Extract languages with proficiency levels
     */
    extractLanguages(sections, fullText) {
        const languageText = sections.languages || '';
        const allText = (languageText + ' ' + fullText).toLowerCase();
        const languages = [];

        this.skillCategories.languages.forEach(lang => {
            if (allText.includes(lang)) {
                const proficiency = this.extractProficiency(allText, lang);
                languages.push({
                    language: lang,
                    proficiency: proficiency
                });
            }
        });

        this.confidence.languages = languages.length > 0 ? Math.min(languages.length * 0.2, 1.0) : 0;
        return languages;
    }

    /**
     * Helper methods for specific extractions
     */
    extractName(entities, lines) {
        // Try to get name from NER first
        if (entities.people && entities.people.length > 0) {
            return entities.people[0];
        }

        // Fallback to first line pattern matching
        const firstLine = lines[0] || '';
        const words = firstLine.split(' ').filter(word =>
            word.length > 1 &&
            /^[A-Za-z]+$/.test(word) &&
            !['cv', 'resume', 'curriculum'].includes(word.toLowerCase())
        );

        return words.slice(0, 2).join(' ') || null;
    }

    extractEmails(text) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        return text.match(emailRegex) || [];
    }

    extractPhones(text) {
        const phoneRegex = /(\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})/g;
        return text.match(phoneRegex) || [];
    }

    extractUrls(text) {
        const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
        return text.match(urlRegex) || [];
    }

    extractLinkedIn(text) {
        const linkedInRegex = /(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)([-a-zA-Z0-9]+)/i;
        const match = text.match(linkedInRegex);
        return match ? `https://linkedin.com/in/${match[1]}` : null;
    }

    extractAddress(entities, headerText) {
        if (entities.places && entities.places.length > 0) {
            return entities.places[0];
        }
        // Simple address pattern matching
        const addressRegex = /\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln)/i;
        const match = headerText.match(addressRegex);
        return match ? match[0] : null;
    }

    parseWorkPositions(experienceText) {
        // This is a simplified implementation
        // In production, you'd want more sophisticated parsing
        const positions = [];
        const sections = experienceText.split('\n\n');

        sections.forEach(section => {
            const lines = section.split('\n');
            if (lines.length >= 2) {
                const title = lines[0];
                const company = lines[1];
                const dates = this.extractDatesFromText(section);

                positions.push({
                    title: title.trim(),
                    company: company.trim(),
                    startDate: dates.start,
                    endDate: dates.end,
                    description: lines.slice(2).join(' ').trim()
                });
            }
        });

        return positions;
    }

    parseEducation(educationText) {
        const education = [];
        const sections = educationText.split('\n\n');

        sections.forEach(section => {
            const lines = section.split('\n');
            if (lines.length >= 1) {
                const degree = lines[0];
                const institution = lines[1] || '';
                const dates = this.extractDatesFromText(section);

                education.push({
                    degree: degree.trim(),
                    institution: institution.trim(),
                    year: dates.end || dates.start,
                    description: lines.slice(2).join(' ').trim()
                });
            }
        });

        return education;
    }

    extractDatesFromText(text) {
        const datePatterns = [
            /\b(\d{4})\s*[-–—]\s*(\d{4}|\bpresent\b|\bcurrent\b|\bnow\b)/gi,
            /\b(\w+\s+\d{4})\s*[-–—]\s*(\w+\s+\d{4}|\bpresent\b|\bcurrent\b|\bnow\b)/gi,
            /\b(\d{1,2}\/\d{4})\s*[-–—]\s*(\d{1,2}\/\d{4}|\bpresent\b|\bcurrent\b|\bnow\b)/gi
        ];

        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                return {
                    start: match[1],
                    end: match[2].toLowerCase().includes('present') ||
                         match[2].toLowerCase().includes('current') ||
                         match[2].toLowerCase().includes('now') ? null : match[2]
                };
            }
        }

        return { start: null, end: null };
    }

    calculateTotalExperience(positions) {
        let totalMonths = 0;
        const currentYear = new Date().getFullYear();

        positions.forEach(position => {
            if (position.startDate) {
                const startYear = parseInt(position.startDate.match(/\d{4}/)?.[0]) || currentYear;
                const endYear = position.endDate ?
                    parseInt(position.endDate.match(/\d{4}/)?.[0]) || currentYear :
                    currentYear;

                totalMonths += (endYear - startYear) * 12;
            }
        });

        return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal
    }

    extractCertifications(sections, fullText) {
        const certText = sections.certifications || '';
        const allText = (certText + ' ' + fullText).toLowerCase();
        const certifications = [];

        const certPatterns = [
            /certified\s+[\w\s]+/gi,
            /certification\s+in\s+[\w\s]+/gi,
            /\b[A-Z]{2,}\s+certified/gi
        ];

        certPatterns.forEach(pattern => {
            const matches = allText.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    if (!certifications.includes(match.trim())) {
                        certifications.push(match.trim());
                    }
                });
            }
        });

        return certifications;
    }

    extractProjects(sections, fullText) {
        const projectText = sections.projects || '';
        if (!projectText) return [];

        const projects = [];
        const sections_split = projectText.split('\n\n');

        sections_split.forEach(section => {
            const lines = section.split('\n');
            if (lines.length >= 1) {
                projects.push({
                    name: lines[0].trim(),
                    description: lines.slice(1).join(' ').trim()
                });
            }
        });

        return projects;
    }

    extractSummary(sections, fullText) {
        // Look for summary/objective section first
        const summaryText = sections.summary || sections.objective || sections.profile || '';

        if (summaryText) {
            return summaryText.trim();
        }

        // Generate summary from first paragraph or few sentences
        const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 20);
        return sentences.slice(0, 3).join('. ').trim() + '.';
    }

    extractProficiency(text, language) {
        const proficiencyLevels = ['native', 'fluent', 'advanced', 'intermediate', 'basic', 'beginner'];

        for (const level of proficiencyLevels) {
            if (text.includes(language + ' ' + level) || text.includes(level + ' ' + language)) {
                return level;
            }
        }

        return 'intermediate'; // default
    }

    /**
     * Calculate overall confidence score
     */
    calculateConfidence(structuredData, fullText) {
        const weights = {
            personalInfo: 0.25,
            experience: 0.25,
            education: 0.20,
            skills: 0.20,
            languages: 0.10
        };

        this.confidence.overall = Object.keys(weights).reduce((total, key) => {
            return total + (this.confidence[key] * weights[key]);
        }, 0);

        // Boost confidence if text is substantial
        if (fullText.length > 1000) {
            this.confidence.overall = Math.min(this.confidence.overall * 1.1, 1.0);
        }
    }
}

// Export singleton instance
const advancedParser = new AdvancedCVParser();

module.exports = {
    parseCV: advancedParser.parseCV.bind(advancedParser),
    AdvancedCVParser
};