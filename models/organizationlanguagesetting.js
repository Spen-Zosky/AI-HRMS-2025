const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrganizationLanguageSetting = sequelize.define('OrganizationLanguageSetting', {
    setting_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Reference to organizations table'
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
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Default language for this organization'
    },
    is_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Whether this language is available for organization users'
    },
    fallback_language_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'languages',
        key: 'language_id'
      },
      comment: 'Fallback language if translation not available'
    }
  }, {
    tableName: 'org_language_settings',
    underscored: true,
    indexes: [
      {
        fields: ['organization_id']
      },
      {
        fields: ['organization_id', 'is_default']
      },
      {
        fields: ['language_id']
      }
    ]
  });

  OrganizationLanguageSetting.associate = function(models) {
    // OrganizationLanguageSetting belongs to Language
    OrganizationLanguageSetting.belongsTo(models.Language, {
      foreignKey: 'language_id',
      as: 'language'
    });

    // OrganizationLanguageSetting belongs to fallback Language
    OrganizationLanguageSetting.belongsTo(models.Language, {
      foreignKey: 'fallback_language_id',
      as: 'fallbackLanguage'
    });

    // Note: Organization association will be added when Organization model is available
  };

  return OrganizationLanguageSetting;
};