'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create core language support tables

    // 1. Create languages table with comprehensive language metadata
    await queryInterface.createTable('languages', {
      language_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      language_code: {
        type: Sequelize.STRING(10),
        allowNull: false,
        unique: true,
        comment: 'ISO 639-1 language code (e.g., en, fr, de, it, es)'
      },
      language_name_native: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Language name in its native script'
      },
      language_name_english: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Language name in English'
      },
      locale_code: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: 'Full locale code (e.g., en-US, fr-FR, de-DE)'
      },
      country_code: {
        type: Sequelize.STRING(3),
        allowNull: true,
        comment: 'ISO 3166-1 alpha-2 country code'
      },
      is_rtl: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Right-to-left text direction'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'Whether this language is available for selection'
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Default language for the system'
      },
      date_format: {
        type: Sequelize.STRING(20),
        defaultValue: 'DD/MM/YYYY',
        comment: 'Preferred date format for this locale'
      },
      number_format: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Number formatting preferences (decimal separator, thousands separator)'
      },
      currency_symbol: {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'Default currency symbol for this locale'
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 100,
        comment: 'Display order in language selection UI'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // 2. Create translation keys table for centralized translation management
    await queryInterface.createTable('translation_keys', {
      key_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      key_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'Unique translation key (e.g., ui.login.welcome, api.error.unauthorized)'
      },
      key_category: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Category: ui, api, email, notification, report, etc.'
      },
      key_context: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Additional context for translators'
      },
      default_value: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Default text in primary language (English)'
      },
      supports_interpolation: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this key supports variable interpolation'
      },
      interpolation_variables: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Array of variable names that can be interpolated'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // 3. Create translations table for actual translated content
    await queryInterface.createTable('translations', {
      translation_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      key_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'translation_keys',
          key: 'key_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      language_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'languages',
          key: 'language_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      translated_text: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Translated text in the target language'
      },
      translation_status: {
        type: Sequelize.ENUM('pending', 'translated', 'reviewed', 'approved', 'needs_revision'),
        defaultValue: 'pending',
        allowNull: false
      },
      translation_quality_score: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: true,
        comment: 'Quality score from 0.0 to 10.0'
      },
      translator_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'User ID of the translator'
      },
      reviewer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'User ID of the reviewer'
      },
      translation_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Notes from translator or reviewer'
      },
      last_updated_by: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // 4. Create user language preferences table
    await queryInterface.createTable('user_language_preferences', {
      preference_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Reference to users table'
      },
      language_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'languages',
          key: 'language_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'Primary language for this user'
      },
      proficiency_level: {
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced', 'native'),
        defaultValue: 'native',
        allowNull: false
      },
      timezone: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'User timezone preference'
      },
      date_format_preference: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Override default date format'
      },
      number_format_preference: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Override default number format'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // 5. Create organization language settings table
    await queryInterface.createTable('organization_language_settings', {
      setting_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Reference to organizations table'
      },
      language_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'languages',
          key: 'language_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Default language for this organization'
      },
      is_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'Whether this language is available for organization users'
      },
      fallback_language_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'languages',
          key: 'language_id'
        },
        comment: 'Fallback language if translation not available'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // Create indexes for performance
    await queryInterface.addIndex('languages', ['language_code']);
    await queryInterface.addIndex('languages', ['locale_code']);
    await queryInterface.addIndex('languages', ['is_active', 'is_default']);

    await queryInterface.addIndex('translation_keys', ['key_name']);
    await queryInterface.addIndex('translation_keys', ['key_category']);
    await queryInterface.addIndex('translation_keys', ['is_active']);

    await queryInterface.addIndex('translations', ['key_id', 'language_id'], {
      unique: true,
      name: 'translations_key_language_unique'
    });
    await queryInterface.addIndex('translations', ['translation_status']);

    await queryInterface.addIndex('user_language_preferences', ['user_id']);
    await queryInterface.addIndex('user_language_preferences', ['user_id', 'is_primary']);

    await queryInterface.addIndex('organization_language_settings', ['organization_id']);
    await queryInterface.addIndex('organization_language_settings', ['organization_id', 'is_default']);

    console.log('✅ Created comprehensive multilingual infrastructure');
    console.log('🌍 Languages table with metadata and locale support');
    console.log('🔑 Translation keys management system');
    console.log('📝 Translations with quality control workflow');
    console.log('👤 User language preferences');
    console.log('🏢 Organization-level language settings');
  },

  async down(queryInterface, Sequelize) {
    // Drop in reverse order of creation
    await queryInterface.dropTable('organization_language_settings');
    await queryInterface.dropTable('user_language_preferences');
    await queryInterface.dropTable('translations');
    await queryInterface.dropTable('translation_keys');
    await queryInterface.dropTable('languages');

    console.log('✅ Removed multilingual infrastructure');
  }
};