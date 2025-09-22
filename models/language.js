const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Language = sequelize.define('Language', {
    language_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    language_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      comment: 'ISO 639-1 language code (e.g., en, fr, de, it, es)'
    },
    language_name_native: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Language name in its native script'
    },
    language_name_english: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Language name in English'
    },
    locale_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'Full locale code (e.g., en-US, fr-FR, de-DE)'
    },
    country_code: {
      type: DataTypes.STRING(3),
      allowNull: true,
      comment: 'ISO 3166-1 alpha-2 country code'
    },
    is_rtl: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Right-to-left text direction'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Whether this language is available for selection'
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Default language for the system'
    },
    date_format: {
      type: DataTypes.STRING(20),
      defaultValue: 'DD/MM/YYYY',
      comment: 'Preferred date format for this locale'
    },
    number_format: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Number formatting preferences (decimal separator, thousands separator)'
    },
    currency_symbol: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Default currency symbol for this locale'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      comment: 'Display order in language selection UI'
    }
  }, {
    tableName: 'languages',
    underscored: true,
    indexes: [
      {
        fields: ['language_code']
      },
      {
        fields: ['locale_code']
      },
      {
        fields: ['is_active', 'is_default']
      }
    ]
  });

  Language.associate = function(models) {
    // Language has many translations
    Language.hasMany(models.Translation, {
      foreignKey: 'language_id',
      as: 'translations'
    });

    // Language has many user preferences
    Language.hasMany(models.UserLanguagePreference, {
      foreignKey: 'language_id',
      as: 'userPreferences'
    });

    // Language has many organization settings
    Language.hasMany(models.OrganizationLanguageSetting, {
      foreignKey: 'language_id',
      as: 'organizationSettings'
    });

    // Self-referencing for fallback language
    Language.hasMany(models.OrganizationLanguageSetting, {
      foreignKey: 'fallback_language_id',
      as: 'fallbackSettings'
    });
  };

  return Language;
};