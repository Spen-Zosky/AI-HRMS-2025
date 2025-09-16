const { knowledgeBase } = require('../services/ragService');
const logger = require('../utils/logger');

// POST /copilot/ask - HR Copilot Q&A
const askHRCopilot = async (req, res) => {
    try {
        const { question, context } = req.body;
        
        if (!question || question.trim().length === 0) {
            return res.status(400).json({
                error: 'Domanda richiesta',
                required: 'question string'
            });
        }
        
        // Inizializza knowledge base se necessario
        if (!knowledgeBase.initialized) {
            await knowledgeBase.loadKnowledgeBase();
        }
        
        logger.info(`HR Copilot question: ${question.substring(0, 100)}...`);
        
        // Cerca documenti rilevanti
        const searchResults = knowledgeBase.search(question, 3);
        
        // Genera risposta
        const response = knowledgeBase.generateAnswer(question, searchResults);
        
        // Aggiungi contesto utente se disponibile
        let contextInfo = '';
        if (req.user) {
            contextInfo = ` Rispondo come HR Copilot per ${req.user.firstName} ${req.user.lastName} (${req.user.role}).`;
        }
        
        logger.info(`HR Copilot response confidence: ${response.confidence}`);
        
        res.json({
            question,
            answer: response.answer + contextInfo,
            confidence: response.confidence,
            sources: response.sources,
            searchResults: searchResults.length,
            timestamp: new Date().toISOString(),
            copilotVersion: 'hr-copilot-v1.0'
        });
        
    } catch (error) {
        logger.error('HR Copilot error:', error);
        res.status(500).json({
            error: 'Errore interno del HR Copilot',
            code: 'COPILOT_ERROR'
        });
    }
};

// GET /copilot/topics - Topics disponibili
const getAvailableTopics = async (req, res) => {
    try {
        // Inizializza knowledge base se necessario
        if (!knowledgeBase.initialized) {
            await knowledgeBase.loadKnowledgeBase();
        }
        
        const topics = [
            {
                category: 'Ferie e Permessi',
                examples: [
                    'Quanti giorni di ferie ho a disposizione?',
                    'Come faccio a richiedere ferie?',
                    'Chi deve approvare la mia richiesta?'
                ]
            },
            {
                category: 'Recruiting',
                examples: [
                    'Come funziona il processo di assunzione?',
                    'Quanto tempo ci vuole per assumere?',
                    'Come prevenite i bias nel recruiting?'
                ]
            },
            {
                category: 'Performance',
                examples: [
                    'Come funziona la valutazione performance?',
                    'Quando sono i review cycles?',
                    'Che scale di rating usate?'
                ]
            },
            {
                category: 'Formazione',
                examples: [
                    'Quanto budget ho per la formazione?',
                    'Che programmi di mentoring ci sono?',
                    'Posso partecipare a conference?'
                ]
            }
        ];
        
        res.json({
            message: 'HR Copilot - Topics disponibili',
            totalDocuments: knowledgeBase.documents.length,
            topics,
            usage: 'POST /api/copilot/ask con { "question": "la tua domanda" }'
        });
        
    } catch (error) {
        logger.error('Error getting topics:', error);
        res.status(500).json({
            error: 'Errore nel recupero topics',
            code: 'TOPICS_ERROR'
        });
    }
};

module.exports = {
    askHRCopilot,
    getAvailableTopics
};
