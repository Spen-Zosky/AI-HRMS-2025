const { QdrantClient } = require('@qdrant/js-client-rest');
const logger = require('../utils/logger');
const aiServiceFactory = require('./aiServiceFactory');

class VectorService {
  constructor() {
    this.client = null;
    this.collections = {
      CVS: 'cvs',
      JOBS: 'jobs',
      SKILLS: 'skills',
      PROFILES: 'profiles'
    };
    this.vectorSize = 1536; // Default for OpenAI embeddings
    this.initialized = false;
  }

  /**
   * Initialize Qdrant client and create collections
   */
  async initialize() {
    if (this.initialized) {
      return this.client;
    }

    try {
      // Initialize Qdrant client
      const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
      const qdrantApiKey = process.env.QDRANT_API_KEY;

      this.client = new QdrantClient({
        url: qdrantUrl,
        apiKey: qdrantApiKey
      });

      // Test connection
      await this.client.getCollections();
      logger.info(`Connected to Qdrant at ${qdrantUrl}`);

      // Create collections if they don't exist
      await this.ensureCollections();

      this.initialized = true;
      return this.client;

    } catch (error) {
      logger.error('Failed to initialize Qdrant client:', error);
      throw new Error(`Vector database initialization failed: ${error.message}`);
    }
  }

  /**
   * Ensure all required collections exist
   */
  async ensureCollections() {
    try {
      const existingCollections = await this.client.getCollections();
      const existingNames = existingCollections.collections.map(c => c.name);

      for (const [key, collectionName] of Object.entries(this.collections)) {
        if (!existingNames.includes(collectionName)) {
          await this.createCollection(collectionName, this.getCollectionConfig(key));
          logger.info(`Created collection: ${collectionName}`);
        }
      }
    } catch (error) {
      logger.error('Error ensuring collections:', error);
      throw error;
    }
  }

  /**
   * Get collection configuration based on type
   */
  getCollectionConfig(collectionType) {
    const baseConfig = {
      vectors: {
        size: this.vectorSize,
        distance: 'Cosine'
      },
      optimizers_config: {
        default_segment_number: 2
      },
      replication_factor: 1
    };

    switch (collectionType) {
      case 'CVS':
        return {
          ...baseConfig,
          // CV-specific configuration
          hnsw_config: {
            m: 16,
            ef_construct: 100
          }
        };
      case 'JOBS':
        return {
          ...baseConfig,
          // Job-specific configuration
          hnsw_config: {
            m: 16,
            ef_construct: 100
          }
        };
      case 'SKILLS':
        return {
          ...baseConfig,
          // Skills-specific configuration
          hnsw_config: {
            m: 8,
            ef_construct: 50
          }
        };
      case 'PROFILES':
        return {
          ...baseConfig,
          // Profile-specific configuration
          hnsw_config: {
            m: 16,
            ef_construct: 100
          }
        };
      default:
        return baseConfig;
    }
  }

  /**
   * Create a collection with specified configuration
   */
  async createCollection(collectionName, config) {
    try {
      await this.client.createCollection(collectionName, config);
      logger.info(`Collection ${collectionName} created successfully`);
    } catch (error) {
      logger.error(`Error creating collection ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Create embedding for text using current AI provider
   */
  async createEmbedding(text) {
    try {
      const provider = await aiServiceFactory.getProvider();

      // Check if provider supports embeddings
      if (typeof provider.createEmbedding === 'function') {
        return await provider.createEmbedding(text);
      }

      // Fallback to simple text hashing for local providers
      logger.warn('Provider does not support embeddings, using fallback');
      return this.createFallbackEmbedding(text);

    } catch (error) {
      logger.error('Error creating embedding:', error);
      throw error;
    }
  }

  /**
   * Fallback embedding creation for providers without embedding support
   */
  createFallbackEmbedding(text) {
    // Simple hash-based embedding for fallback
    const hash = this.simpleHash(text);
    const embedding = new Array(this.vectorSize).fill(0);

    // Distribute hash values across vector
    for (let i = 0; i < this.vectorSize; i++) {
      embedding[i] = Math.sin(hash * (i + 1)) * 0.1;
    }

    return embedding;
  }

  /**
   * Simple hash function for fallback embedding
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Store embedding with metadata
   */
  async storeEmbedding(collectionName, id, embedding, payload = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const point = {
        id: id,
        vector: embedding,
        payload: {
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      await this.client.upsert(collectionName, {
        wait: true,
        points: [point]
      });

      logger.debug(`Stored embedding for ${collectionName}:${id}`);
      return true;

    } catch (error) {
      logger.error(`Error storing embedding in ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Search for similar vectors
   */
  async searchSimilar(collectionName, queryVector, limit = 10, filter = null) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const searchParams = {
        vector: queryVector,
        limit: limit,
        with_payload: true,
        with_vector: false
      };

      if (filter) {
        searchParams.filter = filter;
      }

      const results = await this.client.search(collectionName, searchParams);

      return results.map(result => ({
        id: result.id,
        score: result.score,
        payload: result.payload
      }));

    } catch (error) {
      logger.error(`Error searching in ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Update existing embedding
   */
  async updateEmbedding(collectionName, id, embedding, payload = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const existingPoint = await this.client.retrieve(collectionName, [id]);

      const updatedPayload = {
        ...existingPoint[0]?.payload || {},
        ...payload,
        updated_at: new Date().toISOString()
      };

      await this.storeEmbedding(collectionName, id, embedding, updatedPayload);

      logger.debug(`Updated embedding for ${collectionName}:${id}`);
      return true;

    } catch (error) {
      logger.error(`Error updating embedding in ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Delete embedding
   */
  async deleteEmbedding(collectionName, id) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      await this.client.delete(collectionName, {
        wait: true,
        points: [id]
      });

      logger.debug(`Deleted embedding for ${collectionName}:${id}`);
      return true;

    } catch (error) {
      logger.error(`Error deleting embedding in ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Store CV embedding with full text and metadata
   */
  async storeCVEmbedding(cvId, cvText, cvData) {
    try {
      const embedding = await this.createEmbedding(cvText);

      const payload = {
        type: 'cv',
        cv_id: cvId,
        text: cvText.substring(0, 1000), // Store truncated text
        candidate_name: cvData.personalInfo?.name || 'Unknown',
        skills: cvData.skills || [],
        experience_years: cvData.experience?.yearsTotal || 0,
        email: cvData.personalInfo?.email,
        phone: cvData.personalInfo?.phone
      };

      return await this.storeEmbedding(this.collections.CVS, cvId, embedding, payload);
    } catch (error) {
      logger.error('Error storing CV embedding:', error);
      throw error;
    }
  }

  /**
   * Store job embedding with description and requirements
   */
  async storeJobEmbedding(jobId, jobDescription, jobData) {
    try {
      const embedding = await this.createEmbedding(jobDescription);

      const payload = {
        type: 'job',
        job_id: jobId,
        title: jobData.title || 'Unknown Position',
        company: jobData.company || 'Unknown Company',
        description: jobDescription.substring(0, 1000),
        required_skills: jobData.requiredSkills || [],
        experience_level: jobData.experienceLevel || 'mid',
        location: jobData.location || 'Remote'
      };

      return await this.storeEmbedding(this.collections.JOBS, jobId, embedding, payload);
    } catch (error) {
      logger.error('Error storing job embedding:', error);
      throw error;
    }
  }

  /**
   * Find similar CVs to a job description
   */
  async findSimilarCVs(jobDescription, limit = 10, filters = {}) {
    try {
      const embedding = await this.createEmbedding(jobDescription);

      let filter = null;
      if (Object.keys(filters).length > 0) {
        filter = { must: [] };

        if (filters.minExperience) {
          filter.must.push({
            range: {
              experience_years: { gte: filters.minExperience }
            }
          });
        }

        if (filters.requiredSkills && filters.requiredSkills.length > 0) {
          filter.must.push({
            should: filters.requiredSkills.map(skill => ({
              match: { skills: skill }
            }))
          });
        }
      }

      return await this.searchSimilar(this.collections.CVS, embedding, limit, filter);
    } catch (error) {
      logger.error('Error finding similar CVs:', error);
      throw error;
    }
  }

  /**
   * Find similar jobs to a CV
   */
  async findSimilarJobs(cvText, limit = 10, filters = {}) {
    try {
      const embedding = await this.createEmbedding(cvText);

      let filter = null;
      if (Object.keys(filters).length > 0) {
        filter = { must: [] };

        if (filters.experienceLevel) {
          filter.must.push({
            match: { experience_level: filters.experienceLevel }
          });
        }

        if (filters.location) {
          filter.must.push({
            match: { location: filters.location }
          });
        }
      }

      return await this.searchSimilar(this.collections.JOBS, embedding, limit, filter);
    } catch (error) {
      logger.error('Error finding similar jobs:', error);
      throw error;
    }
  }

  /**
   * Get vector database status and statistics
   */
  async getStatus() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const collections = await this.client.getCollections();
      const stats = {};

      for (const collection of collections.collections) {
        const info = await this.client.getCollection(collection.name);
        stats[collection.name] = {
          vectors_count: info.vectors_count || 0,
          indexed_vectors_count: info.indexed_vectors_count || 0,
          points_count: info.points_count || 0,
          segments_count: info.segments_count || 0,
          status: info.status || 'unknown'
        };
      }

      return {
        connected: true,
        collections: stats,
        vector_size: this.vectorSize,
        total_collections: collections.collections.length
      };

    } catch (error) {
      logger.error('Error getting vector database status:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Batch process existing data to create embeddings
   */
  async batchProcessExistingData(dataType, batchSize = 10) {
    try {
      logger.info(`Starting batch processing for ${dataType}`);

      // This would integrate with your existing data models
      // For now, returning a placeholder implementation

      const processedCount = 0;
      logger.info(`Batch processing completed: ${processedCount} ${dataType} processed`);

      return {
        processed: processedCount,
        type: dataType,
        success: true
      };

    } catch (error) {
      logger.error(`Error in batch processing ${dataType}:`, error);
      throw error;
    }
  }

  /**
   * Check if vector service is available
   */
  async isAvailable() {
    try {
      if (!this.client) {
        await this.initialize();
      }

      await this.client.getCollections();
      return true;
    } catch (error) {
      logger.warn('Vector service not available:', error.message);
      return false;
    }
  }
}

// Singleton instance
const vectorService = new VectorService();

module.exports = vectorService;