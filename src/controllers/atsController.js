const fs = require('fs');
const path = require('path');
const { extractTextFromPDF, extractTextFromDOCX, extractTextFromTXT, parseCV, rankCandidates } = require('../services/aiService');
const logger = require('../utils/logger');

// POST /ats/cv:parse - CV parsing con AI
const parseCVWithAI = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: 'Nessun file CV caricato',
                usage: 'Invia un file PDF, DOCX o TXT con chiave "cv"'
            });
        }

        const filePath = req.file.path;
        const originalName = req.file.originalname;
        const fileExtension = path.extname(originalName).toLowerCase();

        logger.info(`Processing CV: ${originalName} (${fileExtension})`);

        let extractedText = '';
        
        // Estrazione testo basata sul tipo file
        try {
            if (fileExtension === '.pdf') {
                extractedText = await extractTextFromPDF(filePath);
            } else if (fileExtension === '.docx') {
                extractedText = await extractTextFromDOCX(filePath);
            } else if (fileExtension === '.txt') {
                extractedText = await extractTextFromTXT(filePath);
            } else {
                return res.status(400).json({
                    error: 'Formato file non supportato',
                    supportedFormats: ['.pdf', '.docx', '.txt']
                });
            }
        } catch (extractError) {
            logger.error('Text extraction error:', extractError);
            return res.status(500).json({
                error: 'Errore durante l\'estrazione del testo',
                details: extractError.message
            });
        }

        if (!extractedText || extractedText.trim().length < 10) {
            return res.status(400).json({
                error: 'Impossibile estrarre testo significativo dal CV',
                extractedLength: extractedText.length
            });
        }

        // Parsing del CV con AI
        const parsedCV = await parseCV(extractedText);
        
        // Cleanup file temporaneo
        try {
            fs.unlinkSync(filePath);
        } catch (cleanupError) {
            logger.warn('Could not cleanup temp file:', cleanupError);
        }

        logger.info(`CV parsed successfully: ${parsedCV.personalInfo.name}`);

        res.json({
            message: 'CV parsing completato con successo',
            file: {
                originalName,
                size: req.file.size,
                type: fileExtension
            },
            extractedData: parsedCV,
            confidence: {
                overall: parsedCV.personalInfo.email && parsedCV.skills.length > 0 ? 'high' : 'medium',
                personalInfo: parsedCV.personalInfo.email ? 'high' : 'low',
                skills: parsedCV.skills.length > 0 ? 'high' : 'low',
                experience: parsedCV.experience.yearsTotal > 0 ? 'medium' : 'low'
            },
            processingTime: new Date().toISOString()
        });

    } catch (error) {
        logger.error('CV parsing error:', error);
        
        // Cleanup in caso di errore
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                logger.warn('Could not cleanup temp file after error:', cleanupError);
            }
        }

        res.status(500).json({
            error: 'Errore interno durante il parsing del CV',
            code: 'PARSING_ERROR'
        });
    }
};

// POST /ats/rank - Ranking candidati con AI
const rankCandidatesWithAI = async (req, res) => {
    try {
        const { candidates, jobCriteria } = req.body;

        if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
            return res.status(400).json({
                error: 'Lista candidati richiesta',
                required: 'candidates array'
            });
        }

        if (!jobCriteria) {
            return res.status(400).json({
                error: 'Criteri di lavoro richiesti',
                required: 'jobCriteria object'
            });
        }

        logger.info(`Ranking ${candidates.length} candidates for job criteria`);

        // Esegui ranking con AI
        const rankedCandidates = rankCandidates(candidates, jobCriteria);

        // Genera statistiche
        const statistics = {
            totalCandidates: candidates.length,
            averageScore: Math.round(
                rankedCandidates.reduce((sum, c) => sum + c.score, 0) / candidates.length
            ),
            topCandidateScore: rankedCandidates[0]?.score || 0,
            biasWarnings: rankedCandidates.filter(c => 
                c.biasAnalysis.recommendation === 'REVIEW_REQUIRED'
            ).length
        };

        res.json({
            message: 'Ranking candidati completato',
            jobCriteria,
            rankedCandidates: rankedCandidates.map((candidate, index) => ({
                id: candidate.id || candidate.personalInfo?.email,
                name: candidate.personalInfo?.name,
                email: candidate.personalInfo?.email,
                score: candidate.score,
                rank: index + 1,
                explanations: candidate.explanations,
                biasAnalysis: candidate.biasAnalysis,
                topSkills: (candidate.skills || []).slice(0, 5)
            })),
            statistics,
            modelVersion: 'ai-hrms-v1.0',
            processedAt: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Candidate ranking error:', error);
        res.status(500).json({
            error: 'Errore interno durante il ranking',
            code: 'RANKING_ERROR'
        });
    }
};

// GET /ats/jobs - Lista lavori con AI insights
const getJobsWithAI = (req, res) => {
    res.json({
        message: 'Lista posizioni con AI insights',
        jobs: [
            {
                id: 1,
                title: 'Senior Full Stack Developer',
                department: 'Engineering',
                status: 'active',
                aiInsights: {
                    expectedApplications: 45,
                    timeToHire: '21 giorni',
                    topSkillsRequired: ['React', 'Node.js', 'PostgreSQL'],
                    difficultyLevel: 'medium'
                }
            },
            {
                id: 2,
                title: 'HR Business Partner',
                department: 'People',
                status: 'active',
                aiInsights: {
                    expectedApplications: 28,
                    timeToHire: '14 giorni',
                    topSkillsRequired: ['HR Analytics', 'Employee Relations', 'Recruiting'],
                    difficultyLevel: 'low'
                }
            }
        ],
        aiFeatures: [
            'Candidate ranking con explainable AI',
            'Bias detection e mitigation',
            'Automatic CV parsing',
            'Time-to-hire prediction'
        ]
    });
};

module.exports = {
    parseCVWithAI,
    rankCandidatesWithAI,
    getJobsWithAI
};
