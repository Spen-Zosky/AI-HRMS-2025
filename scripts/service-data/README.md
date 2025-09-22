# Service Data Management Scripts

This directory contains scripts and tools for managing Service Tables (reference data, taxonomies, and libraries) in AI-HRMS-2025.

## Quick Start

```bash
# Initialize service data infrastructure
npm run service:init

# Populate skills taxonomy from external sources
npm run service:sync-skills

# Populate job roles and industry data
npm run service:sync-jobs

# Run AI enhancement pipelines
npm run service:ai-enhance

# Deploy new taxonomy version
npm run service:deploy --version=1.1.0
```

## Scripts Overview

### Core Management Scripts
- `init-service-infrastructure.js` - Set up service data management infrastructure
- `populate-skills-taxonomy.js` - Initialize and populate skills taxonomy
- `populate-job-framework.js` - Set up job roles and industry classifications
- `sync-external-sources.js` - Synchronize with external data sources

### AI Enhancement Scripts
- `generate-skills-embeddings.js` - Create AI embeddings for skills
- `enhance-job-descriptions.js` - AI-generated job description improvements
- `validate-taxonomies.js` - AI-powered taxonomy validation

### Maintenance Scripts
- `version-manager.js` - Version control for service data
- `data-quality-check.js` - Validate reference data integrity
- `cleanup-outdated.js` - Remove obsolete reference data

## External Data Sources

### Skills Taxonomy Sources
- **O*NET**: Occupational Information Network
- **LinkedIn Skills API**: Professional skills database
- **Europass**: European qualifications framework
- **ESCO**: European Skills/Competences/Occupations

### Industry & Job Sources
- **NAICS**: North American Industry Classification
- **SOC**: Standard Occupational Classification
- **ISCO**: International Standard Classification of Occupations
- **SIC**: Standard Industrial Classification

## Usage Examples

See individual script files for detailed usage instructions and configuration options.