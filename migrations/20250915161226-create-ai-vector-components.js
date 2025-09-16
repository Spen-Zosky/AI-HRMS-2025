'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create skills_embeddings table for vector storage with fallback strategy
    await queryInterface.createTable('skills_embeddings', {
      embedding_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      skill_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'skills_master',
          key: 'skill_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      embedding_vector: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of embedding values - fallback for when vector DB unavailable'
      },
      vector_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'External vector database ID (Qdrant/Pinecone/etc)'
      },
      model_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'sentence-transformer',
        comment: 'Model used for embedding generation'
      },
      language_code: {
        type: Sequelize.STRING(5),
        allowNull: false,
        defaultValue: 'en'
      },
      is_external_stored: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'True if stored in external vector DB, false if local JSON fallback'
      },
      similarity_threshold: {
        type: Sequelize.FLOAT,
        defaultValue: 0.8,
        comment: 'Threshold for semantic similarity matching'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      }
    });

    // Create ai_providers_config table for multi-provider AI management
    await queryInterface.createTable('ai_providers_config', {
      config_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      provider_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'openai, anthropic, ollama, huggingface'
      },
      provider_type: {
        type: Sequelize.STRING(30),
        allowNull: false,
        comment: 'llm, embedding, vision, audio'
      },
      is_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_available: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Runtime availability check result'
      },
      priority_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Fallback priority (lower = higher priority)'
      },
      api_endpoint: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      model_name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      max_tokens: {
        type: Sequelize.INTEGER,
        defaultValue: 4000
      },
      rate_limit_rpm: {
        type: Sequelize.INTEGER,
        defaultValue: 60,
        comment: 'Requests per minute limit'
      },
      last_health_check: {
        type: Sequelize.DATE,
        allowNull: true
      },
      health_status: {
        type: Sequelize.STRING(20),
        defaultValue: 'unknown',
        comment: 'healthy, unhealthy, unknown'
      },
      fallback_strategy: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Configuration for fallback behavior'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      }
    });

    // Create ai_processing_jobs table for async AI operations
    await queryInterface.createTable('ai_processing_jobs', {
      job_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      job_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'cv_parse, skill_match, embedding_generation, translation'
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'pending, processing, completed, failed'
      },
      input_data: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Input parameters for the AI job'
      },
      output_data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Results from AI processing'
      },
      provider_used: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Which AI provider was actually used'
      },
      fallback_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of fallback attempts made'
      },
      processing_time_ms: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      retry_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      max_retries: {
        type: Sequelize.INTEGER,
        defaultValue: 3
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 5,
        comment: '1-10, lower = higher priority'
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      }
    });

    // Create vector_search_cache table for performance optimization
    await queryInterface.createTable('vector_search_cache', {
      cache_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      query_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
        comment: 'SHA-256 hash of search query for caching'
      },
      query_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      search_type: {
        type: Sequelize.STRING(30),
        allowNull: false,
        comment: 'skill_match, semantic_search, cv_analysis'
      },
      results: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Cached search results'
      },
      confidence_score: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      provider_used: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      language_code: {
        type: Sequelize.STRING(5),
        allowNull: false,
        defaultValue: 'en'
      },
      hit_count: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: 'Number of times this cache entry was used'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Cache expiration time'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('skills_embeddings', ['skill_id']);
    await queryInterface.addIndex('skills_embeddings', ['language_code']);
    await queryInterface.addIndex('skills_embeddings', ['is_external_stored']);
    await queryInterface.addIndex('skills_embeddings', ['model_name']);

    await queryInterface.addIndex('ai_providers_config', ['provider_name']);
    await queryInterface.addIndex('ai_providers_config', ['provider_type']);
    await queryInterface.addIndex('ai_providers_config', ['is_enabled', 'is_available']);
    await queryInterface.addIndex('ai_providers_config', ['priority_order']);

    await queryInterface.addIndex('ai_processing_jobs', ['job_type']);
    await queryInterface.addIndex('ai_processing_jobs', ['status']);
    await queryInterface.addIndex('ai_processing_jobs', ['created_at']);
    await queryInterface.addIndex('ai_processing_jobs', ['priority', 'created_at']);

    await queryInterface.addIndex('vector_search_cache', ['query_hash']);
    await queryInterface.addIndex('vector_search_cache', ['search_type']);
    await queryInterface.addIndex('vector_search_cache', ['expires_at']);
    await queryInterface.addIndex('vector_search_cache', ['language_code']);

    console.log('✅ AI/Vector components with fallback strategies created successfully');
  },

  async down (queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('vector_search_cache');
    await queryInterface.dropTable('ai_processing_jobs');
    await queryInterface.dropTable('ai_providers_config');
    await queryInterface.dropTable('skills_embeddings');

    console.log('✅ AI/Vector components tables dropped successfully');
  }
};
