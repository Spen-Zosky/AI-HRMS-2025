const express = require('express');
const router = express.Router();
const vectorService = require('../services/vectorService');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route GET /api/vector/status
 * @desc Get vector database status and statistics
 * @access Private
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = await vectorService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting vector database status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vector database status',
      error: error.message
    });
  }
});

/**
 * @route POST /api/vector/cv/store
 * @desc Store CV embedding in vector database
 * @access Private
 */
router.post('/cv/store', authenticateToken, async (req, res) => {
  try {
    const { cvId, cvText, cvData } = req.body;

    if (!cvId || !cvText) {
      return res.status(400).json({
        success: false,
        message: 'CV ID and text are required'
      });
    }

    await vectorService.storeCVEmbedding(cvId, cvText, cvData || {});

    res.json({
      success: true,
      message: 'CV embedding stored successfully',
      data: { cvId }
    });

  } catch (error) {
    logger.error('Error storing CV embedding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store CV embedding',
      error: error.message
    });
  }
});

/**
 * @route POST /api/vector/job/store
 * @desc Store job embedding in vector database
 * @access Private
 */
router.post('/job/store', authenticateToken, async (req, res) => {
  try {
    const { jobId, jobDescription, jobData } = req.body;

    if (!jobId || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Job ID and description are required'
      });
    }

    await vectorService.storeJobEmbedding(jobId, jobDescription, jobData || {});

    res.json({
      success: true,
      message: 'Job embedding stored successfully',
      data: { jobId }
    });

  } catch (error) {
    logger.error('Error storing job embedding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store job embedding',
      error: error.message
    });
  }
});

/**
 * @route POST /api/vector/search/cvs
 * @desc Find CVs similar to a job description
 * @access Private
 */
router.post('/search/cvs', authenticateToken, async (req, res) => {
  try {
    const { jobDescription, limit = 10, filters = {} } = req.body;

    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Job description is required'
      });
    }

    const results = await vectorService.findSimilarCVs(jobDescription, limit, filters);

    res.json({
      success: true,
      data: {
        query: jobDescription,
        results: results,
        total: results.length
      }
    });

  } catch (error) {
    logger.error('Error searching CVs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search CVs',
      error: error.message
    });
  }
});

/**
 * @route POST /api/vector/search/jobs
 * @desc Find jobs similar to a CV
 * @access Private
 */
router.post('/search/jobs', authenticateToken, async (req, res) => {
  try {
    const { cvText, limit = 10, filters = {} } = req.body;

    if (!cvText) {
      return res.status(400).json({
        success: false,
        message: 'CV text is required'
      });
    }

    const results = await vectorService.findSimilarJobs(cvText, limit, filters);

    res.json({
      success: true,
      data: {
        query: cvText.substring(0, 100) + '...',
        results: results,
        total: results.length
      }
    });

  } catch (error) {
    logger.error('Error searching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search jobs',
      error: error.message
    });
  }
});

/**
 * @route POST /api/vector/similarity/search
 * @desc Generic similarity search
 * @access Private
 */
router.post('/similarity/search', authenticateToken, async (req, res) => {
  try {
    const { collection, query, limit = 10, filters = {} } = req.body;

    if (!collection || !query) {
      return res.status(400).json({
        success: false,
        message: 'Collection and query are required'
      });
    }

    // Create embedding for query
    const embedding = await vectorService.createEmbedding(query);

    // Search for similar vectors
    const results = await vectorService.searchSimilar(collection, embedding, limit, filters);

    res.json({
      success: true,
      data: {
        collection,
        query: query.substring(0, 100) + '...',
        results: results,
        total: results.length
      }
    });

  } catch (error) {
    logger.error('Error performing similarity search:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform similarity search',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/vector/:collection/:id
 * @desc Delete embedding from collection
 * @access Private
 */
router.delete('/:collection/:id', authenticateToken, async (req, res) => {
  try {
    const { collection, id } = req.params;

    await vectorService.deleteEmbedding(collection, id);

    res.json({
      success: true,
      message: 'Embedding deleted successfully',
      data: { collection, id }
    });

  } catch (error) {
    logger.error('Error deleting embedding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete embedding',
      error: error.message
    });
  }
});

/**
 * @route POST /api/vector/batch/process
 * @desc Batch process existing data to create embeddings
 * @access Private
 */
router.post('/batch/process', authenticateToken, async (req, res) => {
  try {
    const { dataType, batchSize = 10 } = req.body;

    if (!dataType) {
      return res.status(400).json({
        success: false,
        message: 'Data type is required (cvs, jobs, profiles)'
      });
    }

    const result = await vectorService.batchProcessExistingData(dataType, batchSize);

    res.json({
      success: true,
      message: 'Batch processing completed',
      data: result
    });

  } catch (error) {
    logger.error('Error in batch processing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process batch',
      error: error.message
    });
  }
});

/**
 * @route GET /api/vector/collections
 * @desc Get information about all collections
 * @access Private
 */
router.get('/collections', authenticateToken, async (req, res) => {
  try {
    const status = await vectorService.getStatus();

    res.json({
      success: true,
      data: {
        collections: status.collections,
        total_collections: status.total_collections,
        vector_size: status.vector_size
      }
    });

  } catch (error) {
    logger.error('Error getting collections info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get collections information',
      error: error.message
    });
  }
});

module.exports = router;