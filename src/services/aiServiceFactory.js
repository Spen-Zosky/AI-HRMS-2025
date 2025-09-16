const OpenAIProvider = require('./providers/openaiProvider');
const AnthropicProvider = require('./providers/anthropicProvider');
const OllamaProvider = require('./providers/ollamaProvider');
const logger = require('../utils/logger');

class AIServiceFactory {
  constructor() {
    this.providers = new Map();
    this.fallbackChain = [];
    this.currentProvider = null;
    this.initialized = false;
  }

  /**
   * Initialize the AI service factory with configuration
   */
  async initialize() {
    if (this.initialized) {
      return this.currentProvider;
    }

    const primaryProvider = process.env.AI_PROVIDER || 'openai';
    const fallbackProviders = (process.env.AI_FALLBACK_PROVIDERS || 'openai,anthropic,ollama').split(',');

    // Register all available providers
    this.registerProvider('openai', OpenAIProvider);
    this.registerProvider('anthropic', AnthropicProvider);
    this.registerProvider('ollama', OllamaProvider);

    // Set up fallback chain
    this.fallbackChain = [primaryProvider, ...fallbackProviders.filter(p => p !== primaryProvider)];

    // Initialize primary provider
    this.currentProvider = await this.getAvailableProvider();

    if (!this.currentProvider) {
      throw new Error('No AI providers are available. Please check your configuration.');
    }

    this.initialized = true;
    logger.info(`AI Service Factory initialized with provider: ${this.currentProvider.name}`);
    return this.currentProvider;
  }

  /**
   * Register a provider class
   */
  registerProvider(name, ProviderClass) {
    this.providers.set(name, ProviderClass);
  }

  /**
   * Get the first available provider from the fallback chain
   */
  async getAvailableProvider() {
    for (const providerName of this.fallbackChain) {
      try {
        const provider = await this.createProvider(providerName);
        if (await provider.isAvailable()) {
          logger.info(`Provider ${providerName} is available`);
          return provider;
        }
      } catch (error) {
        logger.warn(`Provider ${providerName} failed initialization:`, error.message);
      }
    }

    return null;
  }

  /**
   * Create a provider instance
   */
  async createProvider(providerName) {
    const ProviderClass = this.providers.get(providerName);
    if (!ProviderClass) {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    const provider = new ProviderClass();
    await provider.initialize();
    return provider;
  }

  /**
   * Get current provider or initialize if needed
   */
  async getProvider() {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.currentProvider;
  }

  /**
   * Switch to a specific provider
   */
  async switchProvider(providerName) {
    try {
      const provider = await this.createProvider(providerName);
      if (await provider.isAvailable()) {
        this.currentProvider = provider;
        logger.info(`Switched to provider: ${providerName}`);
        return provider;
      } else {
        throw new Error(`Provider ${providerName} is not available`);
      }
    } catch (error) {
      logger.error(`Failed to switch to provider ${providerName}:`, error);
      throw error;
    }
  }

  /**
   * Execute a method with automatic fallback
   */
  async executeWithFallback(methodName, ...args) {
    let lastError = null;

    for (const providerName of this.fallbackChain) {
      try {
        const provider = await this.createProvider(providerName);
        if (await provider.isAvailable()) {
          const result = await provider[methodName](...args);

          // Update current provider if successful and different
          if (this.currentProvider?.name !== provider.name) {
            this.currentProvider = provider;
            logger.info(`Switched to provider: ${provider.name} for ${methodName}`);
          }

          return result;
        }
      } catch (error) {
        lastError = error;
        logger.warn(`Provider ${providerName} failed for ${methodName}:`, error.message);
        continue;
      }
    }

    throw new Error(`All providers failed for ${methodName}. Last error: ${lastError?.message}`);
  }

  /**
   * Get information about all providers
   */
  async getProviderStatus() {
    const status = {};

    for (const [name] of this.providers) {
      try {
        const provider = await this.createProvider(name);
        status[name] = {
          available: await provider.isAvailable(),
          rateLimits: provider.getRateLimits(),
          costInfo: provider.getCostInfo()
        };
      } catch (error) {
        status[name] = {
          available: false,
          error: error.message
        };
      }
    }

    return status;
  }

  /**
   * Get recommended provider for a specific task
   */
  getRecommendedProvider(taskType) {
    const recommendations = {
      'job_description': 'anthropic', // Claude excels at structured content
      'cv_parsing': 'openai',         // GPT-4 handles complex parsing well
      'skills_extraction': 'anthropic', // Claude is great at categorization
      'interview_questions': 'anthropic', // Claude follows instructions well
      'bias_analysis': 'anthropic',   // Claude has strong safety training
      'general': 'ollama'             // Local for cost efficiency
    };

    return recommendations[taskType] || recommendations.general;
  }
}

// Singleton instance
const aiServiceFactory = new AIServiceFactory();

module.exports = aiServiceFactory;