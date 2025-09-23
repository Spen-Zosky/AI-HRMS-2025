const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TranslationKey = sequelize.define('TranslationKey', {
    key_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      comment: 'Unique translation key (e.g., ui.login.welcome, api.error.unauthorized)'
    },
    key_category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Category: ui, api, email, notification, report, etc.'
    },
    key_context: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Additional context for translators'
    },
    default_value: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Default text in primary language (English)'
    },
    supports_interpolation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this key supports variable interpolation'
    },
    interpolation_variables: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Array of variable names that can be interpolated'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    tableName: 'i18n_translation_keys',
    underscored: true,
    indexes: [
      {
        fields: ['key_name']
      },
      {
        fields: ['key_category']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  TranslationKey.associate = function(models) {
    // TranslationKey has many translations
    TranslationKey.hasMany(models.Translation, {
      foreignKey: 'key_id',
      as: 'translations'
    });
  };

  return TranslationKey;
};