const express = require('express');
const multer = require('multer');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    parseCVWithAI,
    rankCandidatesWithAI,
    getJobsWithAI
} = require('../controllers/atsController');

const router = express.Router();

// Configurazione multer per upload CV (con TXT per test)
const upload = multer({ 
    dest: 'uploads/cv/',
    limits: { 
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.docx', '.txt']; // Aggiunto .txt per test
        const fileExtension = require('path').extname(file.originalname).toLowerCase();
        
        if (allowedTypes.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error('Solo file PDF, DOCX e TXT (test) sono supportati'), false);
        }
    }
});

// GET /ats - Servizi ATS disponibili
router.get('/', authenticateToken, requireRole('hr', 'manager'), (req, res) => {
    res.json({
        message: 'AI-powered Applicant Tracking System',
        version: '2.0',
        endpoints: {
            'POST /api/ats/cv:parse': 'Parsing intelligente CV con AI',
            'POST /api/ats/rank': 'Ranking candidati con explainable AI + bias detection',
            'GET /api/ats/jobs': 'Lista posizioni con AI insights'
        },
        aiFeatures: [
            'CV parsing da PDF/DOCX/TXT',
            'Estrazione automatica skills e esperienza',
            'Ranking candidati con spiegazioni',
            'Bias detection per recruiting etico',
            'Predictive analytics per time-to-hire'
        ]
    });
});

// POST /ats/cv:parse - CV parsing intelligente
router.post('/cv:parse', 
    authenticateToken, 
    requireRole('hr', 'manager'),
    upload.single('cv'), 
    parseCVWithAI
);

// POST /ats/rank - Ranking candidati con AI
router.post('/rank',
    authenticateToken,
    requireRole('hr', 'manager'),
    rankCandidatesWithAI
);

// GET /ats/jobs - Lista lavori con AI insights
router.get('/jobs',
    authenticateToken,
    requireRole('hr', 'manager'),
    getJobsWithAI
);

// Error handler per multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File troppo grande',
                maxSize: '10MB'
            });
        }
    }
    
    if (error.message.includes('Solo file PDF')) {
        return res.status(400).json({
            error: error.message,
            supportedFormats: ['.pdf', '.docx', '.txt']
        });
    }
    
    next(error);
});

module.exports = router;
