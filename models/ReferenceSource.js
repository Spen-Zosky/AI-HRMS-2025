const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class ReferenceSource extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }

  ReferenceSource.init({
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
    },
    // Source metadata and classification fields
    geographic_scope: {
      type: DataTypes.ENUM('global', 'usa', 'europe', 'italy', 'oecd_countries', 'regional'),
      allowNull: true,
      comment: 'Geographic coverage of the data source'
    },
    field_of_application: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Primary field or domain of application'
    },
    organization_type: {
      type: DataTypes.ENUM(
        'government_federal', 'government_national', 'government_eu', 'government_regional',
        'international_organization', 'professional_body', 'research_institute',
        'private_company', 'business_association', 'international_standards'
      ),
      allowNull: true,
      comment: 'Type of organization maintaining the source'
    },
    data_format: {
      type: DataTypes.ENUM(
        'api_database', 'api_statistical_data', 'api_proprietary', 'api_commercial',
        'structured_framework', 'structured_classification', 'structured_data_tables',
        'reports_databases', 'survey_research_data', 'administrative_data',
        'standards_documents', 'reports_statistical_data'
      ),
      allowNull: true,
      comment: 'Format and access method for the data'
    },
    access_type: {
      type: DataTypes.ENUM(
        'free_public', 'free_public_api', 'free_public_reports',
        'public_with_registration', 'research_collaboration',
        'paid_subscription', 'api_commercial', 'mixed_free_paid'
      ),
      allowNull: true,
      comment: 'Access requirements and cost structure'
    },
    last_updated: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Last known update date of the source data'
    },
    update_frequency: {
      type: DataTypes.ENUM(
        'real_time', 'continuous', 'daily', 'weekly', 'monthly', 'quarterly',
        'annual', 'biennial', 'quinquennial', 'decennial',
        'major_periodic', 'major_biennial', 'major_decennial', 'decennial_with_midterm',
        'periodic_updates', 'ongoing', 'as_needed'
      ),
      allowNull: true,
      comment: 'How frequently the source data is updated'
    },
    reliability_score: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 10.0
      },
      comment: 'Reliability score from 0.0 to 10.0 based on source authority and accuracy'
    },
    coverage_score: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 10.0
      },
      comment: 'Coverage score from 0.0 to 10.0 based on comprehensiveness and scope'
    },
    contact_info: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Contact information for the data source'
    }
  }, {
    sequelize,
    modelName: 'ReferenceSource',
    tableName: 'reference_sources',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return ReferenceSource;
};