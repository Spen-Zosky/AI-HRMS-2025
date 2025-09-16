const vectorService = require('../src/services/vectorService');

describe('Vector Service', () => {
  beforeEach(() => {
    // Reset vector service state
    vectorService.initialized = false;
    vectorService.client = null;
  });

  describe('Service Configuration', () => {
    test('Has correct collection names', () => {
      expect(vectorService.collections).toEqual({
        CVS: 'cvs',
        JOBS: 'jobs',
        SKILLS: 'skills',
        PROFILES: 'profiles'
      });
    });

    test('Has correct default vector size', () => {
      expect(vectorService.vectorSize).toBe(1536);
    });

    test('Collection configurations are valid', () => {
      const cvConfig = vectorService.getCollectionConfig('CVS');
      expect(cvConfig).toHaveProperty('vectors');
      expect(cvConfig.vectors.size).toBe(1536);
      expect(cvConfig.vectors.distance).toBe('Cosine');

      const jobConfig = vectorService.getCollectionConfig('JOBS');
      expect(jobConfig).toHaveProperty('hnsw_config');
      expect(jobConfig.hnsw_config.m).toBe(16);

      const skillConfig = vectorService.getCollectionConfig('SKILLS');
      expect(skillConfig.hnsw_config.m).toBe(8);
    });
  });

  describe('Embedding Creation', () => {
    test('Creates fallback embedding when provider unavailable', () => {
      const text = "Test text for embedding";
      const embedding = vectorService.createFallbackEmbedding(text);

      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(1536);
      expect(embedding.every(val => typeof val === 'number')).toBe(true);
      expect(embedding.some(val => val !== 0)).toBe(true); // Should not be all zeros
    });

    test('Simple hash function produces consistent results', () => {
      const text = "Test string";
      const hash1 = vectorService.simpleHash(text);
      const hash2 = vectorService.simpleHash(text);

      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('number');
      expect(hash1).toBeGreaterThan(0);
    });

    test('Different texts produce different hashes', () => {
      const text1 = "Test string one";
      const text2 = "Test string two";

      const hash1 = vectorService.simpleHash(text1);
      const hash2 = vectorService.simpleHash(text2);

      expect(hash1).not.toBe(hash2);
    });

    test('Fallback embeddings are different for different texts', () => {
      const text1 = "Software engineer with React experience";
      const text2 = "Data scientist with Python expertise";

      const embedding1 = vectorService.createFallbackEmbedding(text1);
      const embedding2 = vectorService.createFallbackEmbedding(text2);

      expect(embedding1).not.toEqual(embedding2);
    });
  });

  describe('Service Availability', () => {
    test('Returns false when not initialized and connection fails', async () => {
      // Mock Qdrant client to simulate connection failure
      const originalClient = vectorService.client;
      vectorService.client = {
        getCollections: () => {
          throw new Error('Connection refused');
        }
      };

      const isAvailable = await vectorService.isAvailable();
      expect(isAvailable).toBe(false);

      // Restore original client
      vectorService.client = originalClient;
    });

    test('Handles initialization errors gracefully', async () => {
      // Set invalid URL to trigger connection error
      process.env.QDRANT_URL = 'http://nonexistent:6333';

      await expect(vectorService.initialize()).rejects.toThrow();

      delete process.env.QDRANT_URL;
    }, 10000); // Increase timeout for network operation
  });

  describe('Data Processing Methods', () => {
    test('CV embedding payload structure is correct', async () => {
      const cvId = 'test-cv-123';
      const cvText = 'Software engineer with 5 years experience';
      const cvData = {
        personalInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-0123'
        },
        skills: ['JavaScript', 'React'],
        experience: { yearsTotal: 5 }
      };

      // Mock the storeEmbedding method to capture payload
      let capturedPayload;
      vectorService.storeEmbedding = jest.fn((collection, id, embedding, payload) => {
        capturedPayload = payload;
        return Promise.resolve(true);
      });

      // Mock createEmbedding to return a valid embedding
      vectorService.createEmbedding = jest.fn(() =>
        Promise.resolve(new Array(1536).fill(0.1))
      );

      await vectorService.storeCVEmbedding(cvId, cvText, cvData);

      expect(capturedPayload).toEqual(
        expect.objectContaining({
          type: 'cv',
          cv_id: cvId,
          candidate_name: 'John Doe',
          skills: ['JavaScript', 'React'],
          experience_years: 5,
          email: 'john@example.com',
          phone: '+1-555-0123'
        })
      );
      expect(capturedPayload.text).toBe(cvText);
    });

    test('Job embedding payload structure is correct', async () => {
      const jobId = 'test-job-456';
      const jobDescription = 'Senior React Developer position';
      const jobData = {
        title: 'Senior React Developer',
        company: 'Tech Corp',
        requiredSkills: ['React', 'TypeScript'],
        experienceLevel: 'senior',
        location: 'Remote'
      };

      // Mock the storeEmbedding method
      let capturedPayload;
      vectorService.storeEmbedding = jest.fn((collection, id, embedding, payload) => {
        capturedPayload = payload;
        return Promise.resolve(true);
      });

      // Mock createEmbedding
      vectorService.createEmbedding = jest.fn(() =>
        Promise.resolve(new Array(1536).fill(0.2))
      );

      await vectorService.storeJobEmbedding(jobId, jobDescription, jobData);

      expect(capturedPayload).toEqual(
        expect.objectContaining({
          type: 'job',
          job_id: jobId,
          title: 'Senior React Developer',
          company: 'Tech Corp',
          required_skills: ['React', 'TypeScript'],
          experience_level: 'senior',
          location: 'Remote'
        })
      );
      expect(capturedPayload.description).toBe(jobDescription);
    });
  });

  describe('Error Handling', () => {
    test('Handles embedding creation errors gracefully', async () => {
      vectorService.createEmbedding = jest.fn(() =>
        Promise.reject(new Error('Embedding service unavailable'))
      );

      await expect(vectorService.storeCVEmbedding('test', 'text', {}))
        .rejects.toThrow('Embedding service unavailable');
    });

    test('Handles storage errors gracefully', async () => {
      vectorService.createEmbedding = jest.fn(() =>
        Promise.resolve(new Array(1536).fill(0.1))
      );

      vectorService.storeEmbedding = jest.fn(() =>
        Promise.reject(new Error('Storage failed'))
      );

      await expect(vectorService.storeJobEmbedding('test', 'description', {}))
        .rejects.toThrow('Storage failed');
    });
  });

  describe('Batch Processing', () => {
    test('Batch processing returns expected structure', async () => {
      const result = await vectorService.batchProcessExistingData('cvs', 5);

      expect(result).toEqual({
        processed: expect.any(Number),
        type: 'cvs',
        success: true
      });
    });

    test('Batch processing handles different data types', async () => {
      const types = ['cvs', 'jobs', 'profiles'];

      for (const type of types) {
        const result = await vectorService.batchProcessExistingData(type);
        expect(result.type).toBe(type);
        expect(result.success).toBe(true);
      }
    });
  });

  afterEach(() => {
    // Clean up any mocks
    jest.restoreAllMocks();
  });
});