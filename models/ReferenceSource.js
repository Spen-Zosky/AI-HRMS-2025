const { DataTypes, Sequelize } = require('sequelize');

let ReferenceSource;

const initReferenceSource = (sequelizeInstance) => {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance is required to initialize ReferenceSource model');
  }

  ReferenceSource = sequelizeInstance.define('ReferenceSource', {
    source_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    source_key: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    // Multilingual name fields
    name_en: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    name_it: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    name_fr: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    name_es: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    // Multilingual description fields
    description_en: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description_it: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description_fr: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description_es: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'reference_sources',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return ReferenceSource;
};

module.exports = { initReferenceSource, getReferenceSourceModel: () => ReferenceSource };