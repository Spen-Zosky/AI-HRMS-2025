/**
 * Abstract AI Provider Interface
 *
 * This interface defines the standard methods that all AI providers must implement.
 * It provides a consistent API for AI operations regardless of the underlying provider.
 */

class AIProviderInterface {
  constructor(config = {}) {
    this.config = config;
    this.name = 'BaseProvider';
  }

  /**
   * Initialize the provider with API keys and configuration
   */
  async initialize() {
    throw new Error('initialize() must be implemented by provider');
  }

  /**
   * Check if the provider is properly configured and available
   */
  async isAvailable() {
    throw new Error('isAvailable() must be implemented by provider');
  }

  /**
   * Generate a job description
   * @param {Object} role - Job role information
   * @param {Object} company - Company information
   * @param {Object} requirements - Job requirements
   * @returns {Promise<Object>} Generated job description with metadata
   */
  async generateJobDescription(role, company, requirements = {}) {
    throw new Error('generateJobDescription() must be implemented by provider');
  }

  /**
   * Extract skills from text
   * @param {string} text - Text to analyze
   * @param {string} context - Context (resume, job_description, etc.)
   * @returns {Promise<Object>} Categorized skills
   */
  async extractSkillsFromText(text, context = 'resume') {
    throw new Error('extractSkillsFromText() must be implemented by provider');
  }

  /**
   * Enhanced CV parsing with AI
   * @param {string} rawText - Raw CV text
   * @returns {Promise<Object>} Structured CV data
   */
  async enhanceCVParsing(rawText) {
    throw new Error('enhanceCVParsing() must be implemented by provider');
  }

  /**
   * Generate interview questions
   * @param {string} role - Job role
   * @param {Array} skills - Required skills
   * @param {string} experienceLevel - Experience level
   * @returns {Promise<Object>} Categorized interview questions
   */
  async generateInterviewQuestions(role, skills = [], experienceLevel = 'mid') {
    throw new Error('generateInterviewQuestions() must be implemented by provider');
  }

  /**
   * Analyze text for bias
   * @param {string} text - Text to analyze
   * @param {string} type - Type of text (job_description, etc.)
   * @returns {Promise<Object>} Bias analysis with score and suggestions
   */
  async analyzeBiasInText(text, type = 'job_description') {
    throw new Error('analyzeBiasInText() must be implemented by provider');
  }

  /**
   * Generic text generation method
   * @param {string} prompt - The prompt for text generation
   * @param {Object} options - Generation options (temperature, max_tokens, etc.)
   * @returns {Promise<string>} Generated text
   */
  async generateText(prompt, options = {}) {
    throw new Error('generateText() must be implemented by provider');
  }

  /**
   * Generic JSON generation method with structured output
   * @param {string} prompt - The prompt for JSON generation
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Parsed JSON object
   */
  async generateJSON(prompt, options = {}) {
    throw new Error('generateJSON() must be implemented by provider');
  }

  /**
   * Get provider-specific rate limits
   * @returns {Object} Rate limit information
   */
  getRateLimits() {
    return {
      requestsPerMinute: 60,
      tokensPerMinute: 60000,
      maxConcurrent: 5
    };
  }

  /**
   * Create embedding for text (optional - not all providers support this)
   * @param {string} text - Text to create embedding for
   * @returns {Promise<Array<number>>} Embedding vector
   */
  async createEmbedding(text) {
    // Default implementation - providers can override if they support embeddings
    throw new Error(`Embedding not supported by ${this.name} provider`);
  }

  /**
   * Get provider costs (optional)
   * @returns {Object} Cost information per token/request
   */
  getCostInfo() {
    return {
      inputTokenCost: 0,
      outputTokenCost: 0,
      requestCost: 0,
      currency: 'USD'
    };
  }
}

module.exports = AIProviderInterface;