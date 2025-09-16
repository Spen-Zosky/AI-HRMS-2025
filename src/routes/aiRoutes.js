const express = require('express');
const router = express.Router();
const { getServiceStatus, switchProvider } = require('../services/aiService');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route GET /api/ai/status
 * @desc Get AI service status and available providers
 * @access Private
 */
router.get('/status', async (req, res) => {
  try {
    const status = await getServiceStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting AI service status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI service status',
      error: error.message
    });
  }
});

/**
 * @route POST /api/ai/switch-provider
 * @desc Switch to a specific AI provider
 * @access Private
 */
router.post('/switch-provider', async (req, res) => {
  try {
    const { provider } = req.body;

    if (!provider) {
      return res.status(400).json({
        success: false,
        message: 'Provider name is required'
      });
    }

    await switchProvider(provider);

    res.json({
      success: true,
      message: `Successfully switched to ${provider} provider`,
      data: { currentProvider: provider }
    });

  } catch (error) {
    logger.error(`Error switching to provider ${req.body.provider}:`, error);
    res.status(400).json({
      success: false,
      message: `Failed to switch to provider ${req.body.provider}`,
      error: error.message
    });
  }
});

/**
 * @route GET /api/ai/providers
 * @desc Get list of available AI providers with their capabilities
 * @access Private
 */
router.get('/providers', async (req, res) => {
  try {
    const status = await getServiceStatus();

    const providersInfo = Object.entries(status.availableProviders).map(([name, info]) => ({
      name,
      available: info.available,
      rateLimits: info.rateLimits,
      costInfo: info.costInfo,
      error: info.error,
      capabilities: {
        jobDescription: true,
        skillsExtraction: true,
        cvParsing: true,
        interviewQuestions: true,
        biasAnalysis: true
      }
    }));

    res.json({
      success: true,
      data: {
        currentProvider: status.currentProvider,
        providers: providersInfo
      }
    });

  } catch (error) {
    logger.error('Error getting providers info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get providers information',
      error: error.message
    });
  }
});

/**
 * @route POST /api/ai/test-provider
 * @desc Test a specific provider with a simple task
 * @access Private
 */
router.post('/test-provider', async (req, res) => {
  try {
    const { provider, testType = 'simple' } = req.body;

    if (!provider) {
      return res.status(400).json({
        success: false,
        message: 'Provider name is required'
      });
    }

    // Switch to the provider for testing
    const originalProvider = (await getServiceStatus()).currentProvider;
    await switchProvider(provider);

    let testResult;
    if (testType === 'skills') {
      const aiService = require('../services/aiService');
      testResult = await aiService.extractSkillsFromText(
        "I am a software engineer with 5 years of experience in JavaScript, React, and Python.",
        'resume'
      );
    } else {
      const aiServiceFactory = require('../services/aiServiceFactory');
      const providerInstance = await aiServiceFactory.getProvider();
      testResult = await providerInstance.generateText(
        "Write a one-sentence summary for a software engineer position.",
        { maxTokens: 50 }
      );
    }

    // Switch back to original provider if different
    if (originalProvider && originalProvider !== provider) {
      try {
        await switchProvider(originalProvider);
      } catch (switchBackError) {
        logger.warn('Failed to switch back to original provider:', switchBackError);
      }
    }

    res.json({
      success: true,
      message: `Test completed successfully with ${provider} provider`,
      data: {
        provider,
        testType,
        result: testResult
      }
    });

  } catch (error) {
    logger.error(`Error testing provider ${req.body.provider}:`, error);
    res.status(400).json({
      success: false,
      message: `Failed to test provider ${req.body.provider}`,
      error: error.message
    });
  }
});

module.exports = router;