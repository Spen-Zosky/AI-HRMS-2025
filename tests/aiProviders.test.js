const aiServiceFactory = require('../src/services/aiServiceFactory');
const OpenAIProvider = require('../src/services/providers/openaiProvider');
const AnthropicProvider = require('../src/services/providers/anthropicProvider');
const OllamaProvider = require('../src/services/providers/ollamaProvider');

describe('AI Providers', () => {
  beforeEach(() => {
    // Reset factory state before each test
    aiServiceFactory.initialized = false;
    aiServiceFactory.currentProvider = null;
  });

  describe('Provider Interface Compliance', () => {
    const testMethods = [
      'initialize',
      'isAvailable',
      'generateJobDescription',
      'extractSkillsFromText',
      'enhanceCVParsing',
      'generateInterviewQuestions',
      'analyzeBiasInText',
      'generateText',
      'generateJSON',
      'getRateLimits',
      'getCostInfo'
    ];

    test('OpenAI provider implements all required methods', () => {
      const provider = new OpenAIProvider();
      testMethods.forEach(method => {
        expect(typeof provider[method]).toBe('function');
      });
      expect(provider.name).toBe('OpenAI');
    });

    test('Anthropic provider implements all required methods', () => {
      const provider = new AnthropicProvider();
      testMethods.forEach(method => {
        expect(typeof provider[method]).toBe('function');
      });
      expect(provider.name).toBe('Anthropic');
    });

    test('Ollama provider implements all required methods', () => {
      const provider = new OllamaProvider();
      testMethods.forEach(method => {
        expect(typeof provider[method]).toBe('function');
      });
      expect(provider.name).toBe('Ollama');
    });
  });

  describe('Rate Limits and Cost Info', () => {
    test('All providers return rate limit information', () => {
      const providers = [
        new OpenAIProvider(),
        new AnthropicProvider(),
        new OllamaProvider()
      ];

      providers.forEach(provider => {
        const rateLimits = provider.getRateLimits();
        expect(rateLimits).toHaveProperty('requestsPerMinute');
        expect(rateLimits).toHaveProperty('tokensPerMinute');
        expect(rateLimits).toHaveProperty('maxConcurrent');
        expect(typeof rateLimits.requestsPerMinute).toBe('number');
      });
    });

    test('All providers return cost information', () => {
      const providers = [
        new OpenAIProvider(),
        new AnthropicProvider(),
        new OllamaProvider()
      ];

      providers.forEach(provider => {
        const costInfo = provider.getCostInfo();
        expect(costInfo).toHaveProperty('inputTokenCost');
        expect(costInfo).toHaveProperty('outputTokenCost');
        expect(costInfo).toHaveProperty('currency');
        expect(typeof costInfo.inputTokenCost).toBe('number');
      });
    });
  });

  describe('AI Service Factory', () => {
    beforeEach(() => {
      // Ensure factory has providers registered
      aiServiceFactory.registerProvider('openai', OpenAIProvider);
      aiServiceFactory.registerProvider('anthropic', AnthropicProvider);
      aiServiceFactory.registerProvider('ollama', OllamaProvider);
    });

    test('Factory can register providers', () => {
      expect(aiServiceFactory.providers.has('openai')).toBe(true);
      expect(aiServiceFactory.providers.has('anthropic')).toBe(true);
      expect(aiServiceFactory.providers.has('ollama')).toBe(true);
    });

    test('Factory creates provider instances correctly', async () => {
      // Mock environment variables to avoid actual API calls
      process.env.OPENAI_API_KEY = 'test-key';

      try {
        const provider = await aiServiceFactory.createProvider('openai');
        expect(provider).toBeInstanceOf(OpenAIProvider);
        expect(provider.name).toBe('OpenAI');
      } catch (error) {
        // Expected to fail without real API key during initialization
        expect(error.message).toContain('API key');
      }

      delete process.env.OPENAI_API_KEY;
    });

    test('Factory handles unknown providers', async () => {
      await expect(aiServiceFactory.createProvider('unknown'))
        .rejects.toThrow('Unknown provider: unknown');
    });
  });

  describe('Provider Availability', () => {
    test('OpenAI provider checks API key configuration', async () => {
      const provider = new OpenAIProvider();

      // Ensure no API key is set
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      // Without API key should fail
      await expect(provider.initialize()).rejects.toThrow('API key not configured');

      // With placeholder API key should also fail
      process.env.OPENAI_API_KEY = 'your-openai-api-key-here';
      await expect(provider.initialize()).rejects.toThrow('API key not configured');

      // Restore original key if it existed
      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    });

    test('Anthropic provider checks API key configuration', async () => {
      const provider = new AnthropicProvider();

      // Without API key should fail
      await expect(provider.initialize()).rejects.toThrow('API key not configured');

      // With placeholder API key should also fail
      process.env.ANTHROPIC_API_KEY = 'your-anthropic-api-key-here';
      await expect(provider.initialize()).rejects.toThrow('API key not configured');

      delete process.env.ANTHROPIC_API_KEY;
    });

    test('Ollama provider checks server availability', async () => {
      const provider = new OllamaProvider({ baseURL: 'http://nonexistent:11434' });

      // Should fail with connection error
      await expect(provider.initialize()).rejects.toThrow();
    }, 10000); // Increase timeout for network call
  });

  describe('Error Handling', () => {
    test('Providers handle rate limiting', () => {
      const openaiProvider = new OpenAIProvider();
      const anthropicProvider = new AnthropicProvider();

      // Simulate rate limit exhaustion
      openaiProvider.rateLimitTracker.requests = new Array(60).fill(Date.now());
      anthropicProvider.rateLimitTracker.requests = new Array(50).fill(Date.now());

      expect(() => openaiProvider.checkRateLimit()).toThrow('Rate limit exceeded');
      expect(() => anthropicProvider.checkRateLimit()).toThrow('Rate limit exceeded');
    });
  });

  describe('Configuration', () => {
    test('Providers accept custom configuration', () => {
      const customConfig = {
        apiKey: 'custom-key',
        baseURL: 'https://custom.api.com'
      };

      const provider = new OllamaProvider(customConfig);
      expect(provider.config).toEqual(customConfig);
    });
  });
});

describe('Integration Tests', () => {
  // These tests would require actual API keys and would be skipped in CI
  describe.skip('Live API Tests', () => {
    test('OpenAI provider can generate text', async () => {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
        console.log('Skipping OpenAI live test - no API key');
        return;
      }

      const provider = new OpenAIProvider();
      await provider.initialize();

      const text = await provider.generateText('Hello world', { maxTokens: 10 });
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });

    test('Anthropic provider can generate text', async () => {
      if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key-here') {
        console.log('Skipping Anthropic live test - no API key');
        return;
      }

      const provider = new AnthropicProvider();
      await provider.initialize();

      const text = await provider.generateText('Hello world', { maxTokens: 10 });
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });

    test('Ollama provider can generate text', async () => {
      const provider = new OllamaProvider();

      try {
        await provider.initialize();
        const text = await provider.generateText('Hello world', { maxTokens: 10 });
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThan(0);
      } catch (error) {
        console.log('Skipping Ollama live test - server not available');
      }
    });
  });
});