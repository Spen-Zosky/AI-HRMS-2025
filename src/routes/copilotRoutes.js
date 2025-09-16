const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
    askHRCopilot,
    getAvailableTopics
} = require('../controllers/copilotController');
const enhancedCopilot = require('../services/enhancedCopilot');
const logger = require('../utils/logger');

const router = express.Router();

// GET /copilot - Info HR Copilot
router.get('/', authenticateToken, (req, res) => {
    res.json({
        message: 'HR Copilot - AI Assistant per HR',
        version: '1.0',
        capabilities: [
            'Q&A su policy HR aziendali',
            'Ricerca semantica nella knowledge base',
            'Risposte contestualizzate e personalizzate',
            'Supporto multilingue (IT/EN)'
        ],
        endpoints: {
            'POST /api/copilot/ask': 'Fai una domanda all\'HR Copilot',
            'GET /api/copilot/topics': 'Lista argomenti disponibili'
        },
        knowledgeBase: [
            'Politica ferie e permessi',
            'Processo di recruiting',
            'Gestione performance',
            'Policy formazione e sviluppo'
        ]
    });
});

// POST /copilot/ask - Fai domanda a HR Copilot
router.post('/ask', authenticateToken, askHRCopilot);

// GET /copilot/topics - Lista argomenti disponibili
router.get('/topics', authenticateToken, getAvailableTopics);

/**
 * @route POST /api/copilot/enhanced/query
 * @desc Process natural language query with enhanced AI
 * @access Private
 */
router.post('/enhanced/query', async (req, res) => {
    try {
        const { query, context = {} } = req.body;
        const userId = req.user?.id || 'default_user';

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Query is required'
            });
        }

        const response = await enhancedCopilot.processQuery(query, userId, context);

        res.json({
            success: true,
            data: response,
            processedAt: new Date()
        });
    } catch (error) {
        logger.error('Error processing enhanced query:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process query',
            error: error.message
        });
    }
});

/**
 * @route POST /api/copilot/chat
 * @desc Enhanced chat interface with conversation context
 * @access Private
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, conversationId, context = {} } = req.body;
        const userId = req.user?.id || 'default_user';

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        // Process with enhanced copilot
        const response = await enhancedCopilot.processQuery(message, userId, {
            ...context,
            conversationId
        });

        res.json({
            success: true,
            data: {
                message: response.message || response.type,
                type: response.type,
                data: response.data,
                suggestions: response.followUpSuggestions,
                conversationId: conversationId || `conv_${Date.now()}`,
                timestamp: new Date()
            }
        });
    } catch (error) {
        logger.error('Error in chat:', error);
        res.status(500).json({
            success: false,
            message: 'Chat service temporarily unavailable',
            error: error.message
        });
    }
});

module.exports = router;
