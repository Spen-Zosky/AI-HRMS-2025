const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserLanguagePreference = sequelize.define('UserLanguagePreference', {
    preference_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Reference to users table'
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
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Primary language for this user'
    },
    proficiency_level: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'native'),
      defaultValue: 'native',
      allowNull: false
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'User timezone preference'
    },
    date_format_preference: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Override default date format'
    },
    number_format_preference: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Override default number format'
    }
  }, {
    tableName: 'i18n_user_language_preferences',
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['user_id', 'is_primary']
      },
      {
        fields: ['language_id']
      }
    ]
  });

  UserLanguagePreference.associate = function(models) {
    // UserLanguagePreference belongs to Language
    UserLanguagePreference.belongsTo(models.Language, {
      foreignKey: 'language_id',
      as: 'language'
    });

    // Note: User association will be added when User model is available
  };

  return UserLanguagePreference;
};