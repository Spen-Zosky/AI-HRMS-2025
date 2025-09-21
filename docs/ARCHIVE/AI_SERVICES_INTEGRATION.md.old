# AI Services Integration

## Overview
Multi-provider AI integration architecture for AI-HRMS-2025 supporting OpenAI, Anthropic Claude, and Ollama with automatic fallback mechanisms and graceful degradation.

## Architecture Principles

### Multi-Provider Strategy
- **Provider Agnostic**: Unified interface for all AI providers
- **Automatic Fallback**: Seamless switching between providers
- **Graceful Degradation**: System continues without AI when all providers fail
- **Cost Optimization**: Smart provider selection based on task type
- **Rate Limit Management**: Built-in rate limiting and quota tracking

### Factory Pattern Implementation
```javascript
// Central AI service factory with provider management
class AIServiceFactory {
  constructor() {
    this.providers = new Map();
    this.fallbackChain = [];
    this.currentProvider = null;
  }

  async initialize() {
    const primaryProvider = process.env.AI_PROVIDER || 'openai';
    const fallbackProviders = process.env.AI_FALLBACK_PROVIDERS.split(',');

    // Register all available providers
    this.registerProvider('openai', OpenAIProvider);
    this.registerProvider('anthropic', AnthropicProvider);
    this.registerProvider('ollama', OllamaProvider);

    // Set up fallback chain
    this.fallbackChain = [primaryProvider, ...fallbackProviders];
    this.currentProvider = await this.getAvailableProvider();
  }
}
```

## Provider Implementations

### OpenAI Provider
```javascript
class OpenAIProvider extends AIProviderInterface {
  constructor(config = {}) {
    super(config);
    this.name = 'OpenAI';
    this.client = null;
    this.rateLimitTracker = {
      requests: [],
      maxPerMinute: 60,
      canMakeRequest() {
        this.cleanup();
        return this.requests.length < this.maxPerMinute;
      }
    };
  }

  async initialize() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your-openai-api-key-here') {
      throw new Error('OpenAI API key not configured');
    }
    this.client = new OpenAI({ apiKey });
  }

  async isAvailable() {
    try {
      await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

### Anthropic Claude Provider
```javascript
class AnthropicProvider extends AIProviderInterface {
  constructor(config = {}) {
    super(config);
    this.name = 'Anthropic';
    this.defaultModel = 'claude-3-5-sonnet-20241022';
  }

  async initialize() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }
    this.client = new Anthropic({ apiKey });
  }

  async generateText(prompt, options = {}) {
    const response = await this.client.messages.create({
      model: options.model || this.defaultModel,
      max_tokens: options.maxTokens || 1024,
      messages: [{ role: 'user', content: prompt }]
    });
    return response.content[0].text;
  }
}
```

### Ollama Local Provider
```javascript
class OllamaProvider extends AIProviderInterface {
  constructor(config = {}) {
    super(config);
    this.name = 'Ollama';
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.defaultModel = process.env.OLLAMA_MODEL || 'llama3.1';
  }

  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async generateText(prompt, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || this.defaultModel,
        prompt,
        stream: false
      })
    });
    const data = await response.json();
    return data.response;
  }
}
```

## Automatic Fallback System

### Fallback Chain Execution
```javascript
async executeWithFallback(methodName, ...args) {
  let lastError = null;

  for (const providerName of this.fallbackChain) {
    try {
      const provider = await this.createProvider(providerName);
      if (await provider.isAvailable()) {
        const result = await provider[methodName](...args);

        // Update current provider if successful
        if (this.currentProvider?.name !== provider.name) {
          this.currentProvider = provider;
          logger.info(`Switched to provider: ${provider.name}`);
        }

        return result;
      }
    } catch (error) {
      lastError = error;
      logger.warn(`Provider ${providerName} failed:`, error.message);
      continue;
    }
  }

  throw new Error(`All providers failed. Last error: ${lastError?.message}`);
}
```

### Provider Health Monitoring
```javascript
async getProviderStatus() {
  const status = {};

  for (const [name] of this.providers) {
    try {
      const provider = await this.createProvider(name);
      status[name] = {
        available: await provider.isAvailable(),
        rateLimits: provider.getRateLimits(),
        costInfo: provider.getCostInfo(),
        lastUsed: provider.getLastUsedTime()
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
```

## Task-Specific Provider Selection

### Smart Provider Recommendations
```javascript
getRecommendedProvider(taskType) {
  const recommendations = {
    'job_description': 'anthropic',     // Claude excels at structured content
    'cv_parsing': 'openai',            // GPT-4 handles complex parsing well
    'skills_extraction': 'anthropic',  // Claude is great at categorization
    'interview_questions': 'anthropic', // Claude follows instructions well
    'bias_analysis': 'anthropic',      // Claude has strong safety training
    'general': 'ollama'                // Local for cost efficiency
  };

  return recommendations[taskType] || recommendations.general;
}

// Usage in services
async generateJobDescription(jobData) {
  const preferredProvider = this.getRecommendedProvider('job_description');

  try {
    const provider = await this.createProvider(preferredProvider);
    return await provider.generateText(jobPrompt, {
      maxTokens: 1500,
      temperature: 0.7
    });
  } catch (error) {
    // Fallback to next available provider
    return await this.executeWithFallback('generateText', jobPrompt);
  }
}
```

## CV Parsing Integration

### Advanced CV Parser Service
```javascript
class AdvancedCVParser {
  constructor(aiServiceFactory) {
    this.aiServiceFactory = aiServiceFactory;
    this.supportedFormats = ['pdf', 'docx', 'txt'];
  }

  async parseCV(filePath, options = {}) {
    try {
      // Extract text from document
      const extractedText = await this.extractTextFromFile(filePath);

      // Use AI to parse structured data
      const provider = await this.aiServiceFactory.getProvider();
      const parsedData = await provider.generateStructuredOutput(
        this.buildCVParsingPrompt(extractedText),
        { format: 'json', maxTokens: 2000 }
      );

      // Post-process and validate
      const validatedData = await this.validateParsedData(parsedData);

      // Extract skills with confidence scores
      const skillsAnalysis = await this.extractSkills(extractedText);

      return {
        personalInfo: validatedData.personalInfo,
        experience: validatedData.experience,
        education: validatedData.education,
        skills: skillsAnalysis.skills,
        skillsConfidence: skillsAnalysis.confidence,
        rawText: extractedText,
        metadata: {
          parseAccuracy: validatedData.confidence,
          processingTime: Date.now() - startTime,
          provider: provider.name
        }
      };
    } catch (error) {
      logger.error('CV parsing failed:', error);
      return this.fallbackToBasicParsing(filePath);
    }
  }

  buildCVParsingPrompt(text) {
    return `
Parse the following CV/resume text and extract structured information.
Return the data in JSON format with the following structure:

{
  "personalInfo": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number",
    "location": "city, country"
  },
  "experience": [{
    "company": "Company Name",
    "position": "Job Title",
    "startDate": "YYYY-MM",
    "endDate": "YYYY-MM or Present",
    "description": "Job description and achievements"
  }],
  "education": [{
    "institution": "University/School Name",
    "degree": "Degree Type",
    "field": "Field of Study",
    "graduationDate": "YYYY"
  }],
  "skills": ["skill1", "skill2", "skill3"]
}

CV Text:
${text}

Extracted Data:`;
  }
}
```

## Skills Extraction and Matching

### AI-Powered Skills Analysis
```javascript
class SkillsExtractionService {
  constructor(aiServiceFactory) {
    this.aiServiceFactory = aiServiceFactory;
    this.skillsTaxonomy = null; // Loaded from database
  }

  async extractSkills(text, jobRole = null) {
    const provider = await this.aiServiceFactory.getProvider();

    const skillsPrompt = this.buildSkillsExtractionPrompt(text, jobRole);
    const response = await provider.generateStructuredOutput(skillsPrompt, {
      format: 'json',
      maxTokens: 1500
    });

    // Match against skills taxonomy
    const matchedSkills = await this.matchAgainstTaxonomy(response.skills);

    // Calculate proficiency scores
    const proficiencyScores = await this.calculateProficiency(text, matchedSkills);

    return {
      extractedSkills: matchedSkills,
      proficiencyScores,
      confidence: response.confidence,
      suggestedSkills: await this.suggestRelatedSkills(matchedSkills),
      roleMatch: jobRole ? await this.calculateRoleMatch(matchedSkills, jobRole) : null
    };
  }

  async matchAgainstTaxonomy(extractedSkills) {
    // Load skills taxonomy (WEF, O*NET, ESCO)
    if (!this.skillsTaxonomy) {
      this.skillsTaxonomy = await this.loadSkillsTaxonomy();
    }

    const matches = [];
    for (const skill of extractedSkills) {
      const taxonomyMatch = await this.findBestMatch(skill, this.skillsTaxonomy);
      if (taxonomyMatch.confidence > 0.7) {
        matches.push({
          original: skill,
          canonical: taxonomyMatch.skill,
          category: taxonomyMatch.category,
          framework: taxonomyMatch.framework,
          confidence: taxonomyMatch.confidence
        });
      }
    }

    return matches;
  }
}
```

## Vector Database Integration

### Qdrant Integration for Semantic Search
```javascript
class VectorService {
  constructor(aiServiceFactory) {
    this.aiServiceFactory = aiServiceFactory;
    this.qdrantClient = null;
    this.collectionPrefix = process.env.QDRANT_COLLECTION_PREFIX || 'hrms';
  }

  async initialize() {
    const { QdrantClient } = require('@qdrant/js-client-rest');
    this.qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY
    });
  }

  async indexCandidate(candidateData) {
    const provider = await this.aiServiceFactory.getProvider();

    // Generate embeddings for candidate profile
    const profileText = this.buildCandidateProfile(candidateData);
    const embeddings = await provider.generateEmbeddings(profileText);

    // Store in vector database
    await this.qdrantClient.upsert(`${this.collectionPrefix}_candidates`, {
      points: [{
        id: candidateData.id,
        vector: embeddings,
        payload: {
          name: candidateData.name,
          skills: candidateData.skills,
          experience: candidateData.experience,
          lastUpdated: new Date().toISOString()
        }
      }]
    });
  }

  async searchCandidates(jobRequirements, limit = 10) {
    const provider = await this.aiServiceFactory.getProvider();

    // Generate embeddings for job requirements
    const queryEmbeddings = await provider.generateEmbeddings(jobRequirements);

    // Search vector database
    const searchResults = await this.qdrantClient.search(`${this.collectionPrefix}_candidates`, {
      vector: queryEmbeddings,
      limit,
      with_payload: true,
      score_threshold: 0.7
    });

    return searchResults.map(result => ({
      candidate: result.payload,
      similarity: result.score,
      matchedSkills: this.extractMatchedSkills(result.payload.skills, jobRequirements)
    }));
  }
}
```

## Error Handling and Resilience

### Graceful Degradation Patterns
```javascript
class ResilientAIService {
  constructor() {
    this.fallbackStrategies = new Map();
    this.setupFallbackStrategies();
  }

  setupFallbackStrategies() {
    // CV parsing fallback
    this.fallbackStrategies.set('cv_parsing', async (filePath) => {
      logger.warn('AI CV parsing failed, using basic text extraction');
      const basicText = await this.extractTextOnly(filePath);
      return {
        rawText: basicText,
        personalInfo: await this.extractBasicInfo(basicText),
        skills: await this.extractKeywords(basicText),
        confidence: 0.3, // Low confidence for basic parsing
        fallback: true
      };
    });

    // Job matching fallback
    this.fallbackStrategies.set('job_matching', async (candidate, job) => {
      logger.warn('AI job matching failed, using keyword matching');
      return {
        score: await this.calculateKeywordMatch(candidate.skills, job.requirements),
        method: 'keyword_matching',
        confidence: 0.4,
        fallback: true
      };
    });
  }

  async executeWithGracefulDegradation(operation, ...args) {
    try {
      // Try AI-powered operation
      return await this.aiServiceFactory.executeWithFallback(operation, ...args);
    } catch (error) {
      logger.error(`AI operation ${operation} failed, using fallback:`, error);

      // Use fallback strategy if available
      const fallbackStrategy = this.fallbackStrategies.get(operation);
      if (fallbackStrategy) {
        return await fallbackStrategy(...args);
      }

      // If no fallback available, return basic result
      return {
        success: false,
        error: 'AI services unavailable',
        fallback: true
      };
    }
  }
}
```

## Performance Optimization

### Caching Strategy
```javascript
class AIResponseCache {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 1000;
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  generateCacheKey(prompt, provider, options) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify({ prompt, provider, options }));
    return hash.digest('hex');
  }

  async get(prompt, provider, options) {
    const key = this.generateCacheKey(prompt, provider, options);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      logger.debug('Cache hit for AI request');
      return cached.response;
    }

    return null;
  }

  async set(prompt, provider, options, response) {
    const key = this.generateCacheKey(prompt, provider, options);

    // Clean up old entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
  }
}
```

### Rate Limiting and Quota Management
```javascript
class RateLimitManager {
  constructor() {
    this.providerLimits = {
      openai: { requestsPerMinute: 60, tokensPerMinute: 60000 },
      anthropic: { requestsPerMinute: 50, tokensPerMinute: 40000 },
      ollama: { requestsPerMinute: 100, tokensPerMinute: 100000 }
    };
    this.usage = new Map();
  }

  async checkRateLimit(provider, tokensRequired = 1000) {
    const limits = this.providerLimits[provider];
    const usage = this.getUsage(provider);

    // Clean up old usage records
    const oneMinuteAgo = Date.now() - 60000;
    usage.requests = usage.requests.filter(time => time > oneMinuteAgo);
    usage.tokens = usage.tokens.filter(record => record.time > oneMinuteAgo);

    // Check request limit
    if (usage.requests.length >= limits.requestsPerMinute) {
      throw new Error(`Rate limit exceeded for ${provider}: requests per minute`);
    }

    // Check token limit
    const tokensUsed = usage.tokens.reduce((sum, record) => sum + record.count, 0);
    if (tokensUsed + tokensRequired > limits.tokensPerMinute) {
      throw new Error(`Rate limit exceeded for ${provider}: tokens per minute`);
    }

    return true;
  }

  recordUsage(provider, tokensUsed) {
    const usage = this.getUsage(provider);
    const now = Date.now();

    usage.requests.push(now);
    usage.tokens.push({ time: now, count: tokensUsed });
  }
}
```

## Configuration and Environment

### Environment Variables
```bash
# Primary AI Provider Configuration
AI_PROVIDER=openai                    # Primary provider: openai, anthropic, ollama
AI_FALLBACK_PROVIDERS=openai,anthropic,ollama  # Fallback chain

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4                    # Default model
OPENAI_MAX_TOKENS=2048               # Default max tokens

# Anthropic Configuration
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_MAX_TOKENS=4096

# Ollama Configuration (Local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
OLLAMA_TIMEOUT=30000

# Vector Database Configuration
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-qdrant-api-key
QDRANT_COLLECTION_PREFIX=hrms_prod

# AI Service Configuration
AI_CACHE_ENABLED=true
AI_CACHE_TTL=86400                   # 24 hours in seconds
AI_MAX_RETRIES=3
AI_TIMEOUT=30000                     # 30 seconds
```

### Service Configuration
```javascript
const aiConfig = {
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2048,
      timeout: 30000
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS) || 4096,
      timeout: 30000
    },
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama3.1',
      timeout: parseInt(process.env.OLLAMA_TIMEOUT) || 30000
    }
  },
  cache: {
    enabled: process.env.AI_CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.AI_CACHE_TTL) || 86400,
    maxSize: 1000
  },
  rateLimiting: {
    enabled: true,
    maxRetries: parseInt(process.env.AI_MAX_RETRIES) || 3,
    backoffFactor: 2
  }
};
```

## Integration Examples

### Job Description Generation
```javascript
async function generateJobDescription(jobData) {
  const aiService = await aiServiceFactory.getProvider();

  const prompt = `
Create a comprehensive job description for the following position:

Title: ${jobData.title}
Department: ${jobData.department}
Level: ${jobData.level}
Required Skills: ${jobData.requiredSkills.join(', ')}
Preferred Skills: ${jobData.preferredSkills.join(', ')}

Include: job summary, key responsibilities, requirements, and benefits.
Format as structured text suitable for job posting.
  `;

  try {
    const description = await aiService.generateText(prompt, {
      maxTokens: 1500,
      temperature: 0.7
    });

    return {
      description,
      generatedBy: aiService.name,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Job description generation failed:', error);
    return fallbackJobDescription(jobData);
  }
}
```

### Candidate Screening
```javascript
async function screenCandidate(candidateData, jobRequirements) {
  const aiService = await aiServiceFactory.getProvider();

  const screeningPrompt = `
Analyze this candidate against job requirements and provide screening assessment:

Candidate Profile:
${JSON.stringify(candidateData, null, 2)}

Job Requirements:
${JSON.stringify(jobRequirements, null, 2)}

Provide assessment with:
1. Overall match score (0-100)
2. Skills alignment analysis
3. Experience relevance
4. Potential concerns
5. Interview recommendations

Format as JSON.
  `;

  const assessment = await aiService.generateStructuredOutput(screeningPrompt, {
    format: 'json',
    maxTokens: 2000
  });

  return {
    candidateId: candidateData.id,
    matchScore: assessment.matchScore,
    skillsAlignment: assessment.skillsAlignment,
    experienceRelevance: assessment.experienceRelevance,
    concerns: assessment.concerns,
    interviewRecommendations: assessment.interviewRecommendations,
    assessedBy: aiService.name,
    assessmentDate: new Date().toISOString()
  };
}
```

## Monitoring and Analytics

### AI Usage Analytics
```javascript
class AIUsageAnalytics {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      providerUsage: {},
      averageResponseTime: 0,
      tokenUsage: 0,
      costTracking: {}
    };
  }

  recordRequest(provider, operation, responseTime, tokens, success, cost = 0) {
    this.metrics.totalRequests++;

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Provider usage tracking
    if (!this.metrics.providerUsage[provider]) {
      this.metrics.providerUsage[provider] = { requests: 0, tokens: 0, cost: 0 };
    }
    this.metrics.providerUsage[provider].requests++;
    this.metrics.providerUsage[provider].tokens += tokens;
    this.metrics.providerUsage[provider].cost += cost;

    // Overall metrics
    this.metrics.tokenUsage += tokens;
    this.updateAverageResponseTime(responseTime);

    logger.info('AI request recorded', {
      provider,
      operation,
      responseTime,
      tokens,
      success,
      cost
    });
  }

  generateReport() {
    return {
      summary: {
        successRate: (this.metrics.successfulRequests / this.metrics.totalRequests) * 100,
        averageResponseTime: this.metrics.averageResponseTime,
        totalTokensUsed: this.metrics.tokenUsage,
        totalCost: Object.values(this.metrics.providerUsage)
          .reduce((sum, provider) => sum + provider.cost, 0)
      },
      providerBreakdown: this.metrics.providerUsage,
      recommendations: this.generateRecommendations()
    };
  }
}
```