const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Translation = sequelize.define('Translation', {
    translation_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'translation_keys',
        key: 'key_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    language_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'languages',
        key: 'language_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    translated_text: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Translated text in the target language'
    },
    translation_status: {
      type: DataTypes.ENUM('pending', 'translated', 'reviewed', 'approved', 'needs_revision'),
      defaultValue: 'pending',
      allowNull: false
    },
    translation_quality_score: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true,
      comment: 'Quality score from 0.0 to 10.0'
    },
    translator_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User ID of the translator'
    },
    reviewer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User ID of the reviewer'
    },
    translation_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notes from translator or reviewer'
    },
    last_updated_by: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'i18n_translations',
    underscored: true,
    indexes: [
      {
        fields: ['key_id', 'language_id'],
        unique: true
      },
      {
        fields: ['translation_status']
      },
      {
        fields: ['language_id']
      },
      {
        fields: ['key_id']
      }
    ]
  });

  Translation.associate = function(models) {
    // Translation belongs to TranslationKey
    Translation.belongsTo(models.TranslationKey, {
      foreignKey: 'key_id',
      as: 'translationKey'
    });

    // Translation belongs to Language
    Translation.belongsTo(models.Language, {
      foreignKey: 'language_id',
      as: 'language'
    });
  };

  return Translation;
};