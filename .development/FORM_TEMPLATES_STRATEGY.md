# FORM_TEMPLATES_STRATEGY.md
## Comprehensive Database-Driven Report Templates Implementation Strategy
### AI-HRMS-2025 System Transformation Plan

**Document Version:** 1.0
**Last Updated:** September 18, 2025
**Status:** Strategic Implementation Blueprint
**Target:** Transform Current User Status Full Report to Database-Driven System

---

## 🎯 Executive Summary

This document provides a comprehensive, granular implementation strategy for transforming the current static "Current User Status Full Report" into a dynamic, database-driven template system. This transformation will enable:

- **Dynamic Report Generation** without code deployment
- **Version Control** for template evolution
- **Role-Based Access** with granular permissions
- **Multi-Format Output** with advanced formatting
- **Visual Report Builder** for non-technical users
- **Performance Optimization** with caching and indexing
- **Complete Audit Trail** for compliance

---

## 📊 Current State Analysis

### Existing Architecture
```
Static Report System (Current)
├── CURRENT_USER_STATUS_FULL_REPORT_TEMPLATE.md (Hardcoded)
├── userFolderReportService.js (Static SQL)
├── 13 SQL Queries (Embedded in Service)
└── API Endpoints (Fixed Format)
```

### Target Architecture
```
Database-Driven System (Target)
├── report_templates Table (Dynamic Storage)
├── ReportEngine Service (Query Execution)
├── Template Version Control (History)
├── Dynamic API Layer (Flexible)
├── Visual Builder Interface (User-Friendly)
└── Multi-Format Renderer (Extensible)
```

---

## 🏗️ Phase 1: Database Foundation (Week 1)

### 1.1 Database Schema Implementation

#### Core Tables Creation

**report_templates**
```sql
CREATE TABLE report_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'HR',
    subcategory VARCHAR(100),
    version INTEGER DEFAULT 1,

    -- Template Structure
    sections JSONB NOT NULL, -- Array of report sections
    sql_queries JSONB NOT NULL, -- Map of query_id to SQL
    parameters JSONB DEFAULT '{}', -- Parameter definitions

    -- Configuration
    output_formats TEXT[] DEFAULT ARRAY['json', 'markdown', 'html'],
    default_format VARCHAR(50) DEFAULT 'json',
    template_config JSONB DEFAULT '{}', -- Visual config (colors, fonts, etc.)
    visualization_rules JSONB DEFAULT '{}', -- Chart definitions

    -- Security
    required_roles TEXT[] DEFAULT ARRAY['admin', 'hr'],
    data_sensitivity_level VARCHAR(50) DEFAULT 'standard',
    row_level_security JSONB DEFAULT '{}', -- RLS rules

    -- Metadata
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false, -- Protected system templates
    is_public BOOLEAN DEFAULT false, -- Available to all users

    -- Usage
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMP,
    avg_execution_time INTEGER, -- milliseconds

    -- Validation
    validation_schema JSONB DEFAULT '{}',
    test_parameters JSONB DEFAULT '{}', -- For testing

    -- Indexing
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    search_vector tsvector
);

-- Indexes for Performance
CREATE INDEX idx_report_templates_active ON report_templates(is_active);
CREATE INDEX idx_report_templates_category ON report_templates(category, subcategory);
CREATE INDEX idx_report_templates_roles ON report_templates USING GIN(required_roles);
CREATE INDEX idx_report_templates_tags ON report_templates USING GIN(tags);
CREATE INDEX idx_report_templates_search ON report_templates USING GIN(search_vector);

-- Full-text search trigger
CREATE TRIGGER update_report_templates_search
BEFORE INSERT OR UPDATE ON report_templates
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', name, display_name, description);
```

**report_template_versions**
```sql
CREATE TABLE report_template_versions (
    version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES report_templates(template_id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,

    -- Version Content (Complete Snapshot)
    name VARCHAR(255) NOT NULL,
    sections JSONB NOT NULL,
    sql_queries JSONB NOT NULL,
    parameters JSONB,
    template_config JSONB,
    visualization_rules JSONB,

    -- Change Tracking
    change_type VARCHAR(50) NOT NULL, -- 'major', 'minor', 'patch'
    changes_description TEXT NOT NULL,
    changes_detail JSONB, -- Detailed diff

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,

    -- Status
    is_published BOOLEAN DEFAULT false,
    is_rollback_point BOOLEAN DEFAULT false,

    UNIQUE(template_id, version_number)
);

CREATE INDEX idx_template_versions_template ON report_template_versions(template_id);
CREATE INDEX idx_template_versions_published ON report_template_versions(is_published);
```

**report_execution_log**
```sql
CREATE TABLE report_execution_log (
    execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES report_templates(template_id),
    template_version INTEGER NOT NULL,

    -- Execution Context
    executed_by UUID NOT NULL REFERENCES users(id),
    organization_id UUID REFERENCES organizations(organization_id),
    execution_context JSONB, -- IP, browser, etc.

    -- Parameters Used
    parameters_provided JSONB,
    parameters_resolved JSONB, -- After defaults/transforms

    -- Performance Metrics
    execution_time_ms INTEGER NOT NULL,
    query_execution_times JSONB, -- Per-query timing
    row_count INTEGER,
    data_size_bytes INTEGER,

    -- Output
    output_format VARCHAR(50) NOT NULL,
    output_cached BOOLEAN DEFAULT false,
    cache_key VARCHAR(255),

    -- Status
    status VARCHAR(50) NOT NULL, -- 'success', 'error', 'timeout', 'cancelled'
    error_message TEXT,
    error_details JSONB,
    warnings JSONB,

    -- Timing
    executed_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,

    -- Resource Usage
    memory_usage_mb INTEGER,
    cpu_time_ms INTEGER
);

-- Indexes for Analytics
CREATE INDEX idx_execution_log_template ON report_execution_log(template_id);
CREATE INDEX idx_execution_log_user ON report_execution_log(executed_by);
CREATE INDEX idx_execution_log_status ON report_execution_log(status);
CREATE INDEX idx_execution_log_date ON report_execution_log(executed_at DESC);
CREATE INDEX idx_execution_log_performance ON report_execution_log(execution_time_ms);

-- Partitioning for Scale (Monthly)
CREATE TABLE report_execution_log_2025_09 PARTITION OF report_execution_log
FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
```

**report_template_permissions**
```sql
CREATE TABLE report_template_permissions (
    permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES report_templates(template_id) ON DELETE CASCADE,

    -- Grantee (User, Role, or Organization)
    grantee_type VARCHAR(50) NOT NULL, -- 'user', 'role', 'organization'
    grantee_id UUID NOT NULL,

    -- Permissions
    can_view BOOLEAN DEFAULT true,
    can_execute BOOLEAN DEFAULT true,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_share BOOLEAN DEFAULT false,
    can_schedule BOOLEAN DEFAULT false,

    -- Constraints
    parameter_restrictions JSONB, -- Limit allowed parameters
    data_filters JSONB, -- Additional WHERE clauses
    row_limit INTEGER,

    -- Metadata
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,

    UNIQUE(template_id, grantee_type, grantee_id)
);

CREATE INDEX idx_template_permissions_template ON report_template_permissions(template_id);
CREATE INDEX idx_template_permissions_grantee ON report_template_permissions(grantee_type, grantee_id);
```

### 1.2 Migration Script for Current User Status Report

```javascript
// migrations/20250918-migrate-current-user-status-report.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert the Current User Status Full Report template
    await queryInterface.bulkInsert('report_templates', [{
      template_id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'current_user_status_full_report',
      display_name: 'Current User Status Full Report',
      description: 'Comprehensive 360-degree view of employee profile with 20 sections',
      category: 'HR',
      subcategory: 'Employee Profile',
      version: 1,

      sections: JSON.stringify([
        {
          id: 'executive_summary',
          name: 'Executive Summary',
          order: 1,
          icon: '☐',
          queries: ['user_core', 'organization', 'employee_summary']
        },
        {
          id: 'core_user_information',
          name: 'Core User Information',
          order: 2,
          icon: '○',
          queries: ['user_details', 'security_info']
        },
        // ... all 20 sections
      ]),

      sql_queries: JSON.stringify({
        user_core: `
          SELECT
            u.id,
            u.email,
            u.first_name,
            u.last_name,
            u.system_role,
            u.is_active,
            u.created_at,
            u.last_login
          FROM users u
          WHERE u.email = :user_email
        `,
        organization: `
          SELECT
            o.organization_id,
            o.organization_name,
            o.industry,
            o.company_size,
            om.joined_date,
            om.organization_role
          FROM users u
          JOIN organization_members om ON u.id = om.user_id
          JOIN organizations o ON om.organization_id = o.organization_id
          WHERE u.email = :user_email
            AND om.is_active = true
        `,
        // ... all 13 queries from current implementation
      }),

      parameters: JSON.stringify({
        user_email: {
          type: 'string',
          required: true,
          validation: 'email',
          description: 'Email address of the user',
          source: 'url_param' // or 'body', 'query', 'context'
        }
      }),

      output_formats: ['json', 'markdown', 'html', 'pdf'],
      default_format: 'json',

      template_config: JSON.stringify({
        theme: {
          fontFamily: 'Exo 2, sans-serif',
          primaryColor: '#E3F2FD',
          secondaryColor: '#F3E5F5',
          accentColor: '#E8F5E8'
        },
        icons: {
          style: 'material-outline-monochrome',
          mapping: {
            'executive_summary': '☐',
            'core_user_information': '○',
            'organization_employment': '▢',
            'compensation_benefits': '◇',
            'leave_management': '□',
            'organizational_hierarchy': '◯'
          }
        }
      }),

      visualization_rules: JSON.stringify({
        skills_assessment: {
          type: 'radar-beta',
          config: {
            min: 0,
            max: 5,
            ticks: 5,
            graticule: 'polygon',
            showLegend: true
          }
        },
        leave_usage: {
          type: 'pie',
          config: {
            showPercentages: true,
            colors: ['#E3F2FD', '#F3E5F5', '#E8F5E8', '#FFF3E0']
          }
        },
        profile_completeness: {
          type: 'radar-beta',
          config: {
            min: 0,
            max: 100,
            graticule: 'circle'
          }
        }
      }),

      required_roles: ['admin', 'hr', 'manager', 'employee'],
      data_sensitivity_level: 'high',

      row_level_security: JSON.stringify({
        employee: 'u.email = :current_user_email',
        manager: 'u.id IN (SELECT user_id FROM employees WHERE manager_id = :current_user_id)',
        hr: 'true',
        admin: 'true'
      }),

      is_active: true,
      is_system: true,
      is_public: false,

      validation_schema: JSON.stringify({
        type: 'object',
        properties: {
          user_email: {
            type: 'string',
            format: 'email'
          }
        },
        required: ['user_email']
      }),

      tags: ['employee', 'profile', 'comprehensive', 'hr', 'official'],

      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Create initial version record
    await queryInterface.bulkInsert('report_template_versions', [{
      template_id: '550e8400-e29b-41d4-a716-446655440001',
      version_number: 1,
      name: 'current_user_status_full_report',
      sections: JSON.stringify([/* ... */]),
      sql_queries: JSON.stringify({/* ... */}),
      parameters: JSON.stringify({/* ... */}),
      template_config: JSON.stringify({/* ... */}),
      visualization_rules: JSON.stringify({/* ... */}),
      change_type: 'major',
      changes_description: 'Initial migration from static template to database-driven system',
      is_published: true,
      is_rollback_point: true,
      created_at: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('report_template_versions', {
      template_id: '550e8400-e29b-41d4-a716-446655440001'
    });
    await queryInterface.bulkDelete('report_templates', {
      template_id: '550e8400-e29b-41d4-a716-446655440001'
    });
  }
};
```

---

## 🚀 Phase 2: Report Engine Service (Week 1-2)

### 2.1 Core ReportEngine Class

```javascript
// src/services/reportEngine.js
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');
const Handlebars = require('handlebars');
const MarkdownIt = require('markdown-it');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

class ReportEngine {
  constructor() {
    this.cache = new Map();
    this.queryTimeout = 30000; // 30 seconds
    this.maxRowCount = 10000;
    this.initializeHelpers();
  }

  /**
   * Main execution method
   */
  async executeReport(templateId, parameters, context) {
    const startTime = Date.now();
    const executionId = uuidv4();

    try {
      // 1. Load and validate template
      const template = await this.loadTemplate(templateId);
      if (!template.is_active) {
        throw new Error('Template is inactive');
      }

      // 2. Check permissions
      await this.checkPermissions(template, context.user);

      // 3. Validate and resolve parameters
      const resolvedParams = await this.resolveParameters(
        template.parameters,
        parameters,
        context
      );

      // 4. Check cache
      const cacheKey = this.generateCacheKey(templateId, resolvedParams);
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // 5. Execute queries
      const queryResults = await this.executeQueries(
        template.sql_queries,
        resolvedParams,
        template.row_level_security,
        context
      );

      // 6. Process and format data
      const processedData = await this.processData(
        queryResults,
        template.sections,
        template.template_config
      );

      // 7. Generate output
      const output = await this.generateOutput(
        processedData,
        parameters.format || template.default_format,
        template
      );

      // 8. Log execution
      await this.logExecution({
        execution_id: executionId,
        template_id: templateId,
        template_version: template.version,
        executed_by: context.user.id,
        parameters_provided: parameters,
        parameters_resolved: resolvedParams,
        execution_time_ms: Date.now() - startTime,
        status: 'success',
        output_format: parameters.format || template.default_format
      });

      // 9. Update cache
      this.cache.set(cacheKey, output);
      setTimeout(() => this.cache.delete(cacheKey), 300000); // 5 min cache

      // 10. Update template stats
      await this.updateTemplateStats(templateId, Date.now() - startTime);

      return output;

    } catch (error) {
      await this.logExecution({
        execution_id: executionId,
        template_id: templateId,
        executed_by: context.user.id,
        parameters_provided: parameters,
        execution_time_ms: Date.now() - startTime,
        status: 'error',
        error_message: error.message,
        error_details: error.stack
      });

      throw error;
    }
  }

  /**
   * Load template from database
   */
  async loadTemplate(templateId) {
    const template = await ReportTemplate.findByPk(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    return template;
  }

  /**
   * Check user permissions for template
   */
  async checkPermissions(template, user) {
    // Check required roles
    const userRoles = user.roles || [user.system_role];
    const hasRequiredRole = template.required_roles.some(
      role => userRoles.includes(role)
    );

    if (!hasRequiredRole) {
      // Check explicit permissions
      const permission = await ReportTemplatePermission.findOne({
        where: {
          template_id: template.template_id,
          grantee_type: 'user',
          grantee_id: user.id,
          can_execute: true
        }
      });

      if (!permission) {
        throw new Error('Insufficient permissions to execute this report');
      }
    }

    return true;
  }

  /**
   * Resolve and validate parameters
   */
  async resolveParameters(templateParams, providedParams, context) {
    const resolved = {};

    for (const [key, config] of Object.entries(templateParams)) {
      let value = providedParams[key];

      // Handle different parameter sources
      if (!value && config.source === 'context') {
        value = this.getFromContext(key, context);
      }

      // Apply defaults
      if (!value && config.default) {
        value = config.default;
      }

      // Check required
      if (!value && config.required) {
        throw new Error(`Required parameter missing: ${key}`);
      }

      // Validate type and format
      if (value) {
        value = await this.validateParameter(value, config);
      }

      resolved[key] = value;
    }

    // Add system parameters
    resolved.current_user_id = context.user.id;
    resolved.current_user_email = context.user.email;
    resolved.current_organization_id = context.user.organization_id;

    return resolved;
  }

  /**
   * Execute SQL queries with security
   */
  async executeQueries(queries, parameters, rlsRules, context) {
    const results = {};
    const queryTimes = {};

    for (const [queryId, sql] of Object.entries(queries)) {
      const startTime = Date.now();

      try {
        // Apply Row Level Security
        let securedSql = sql;
        if (rlsRules && rlsRules[context.user.system_role]) {
          securedSql = this.applyRowLevelSecurity(
            sql,
            rlsRules[context.user.system_role],
            parameters
          );
        }

        // Validate query safety
        this.validateQuerySafety(securedSql);

        // Execute with timeout
        const result = await this.executeWithTimeout(
          sequelize.query(securedSql, {
            replacements: parameters,
            type: QueryTypes.SELECT,
            raw: true
          }),
          this.queryTimeout
        );

        // Check row count limit
        if (result.length > this.maxRowCount) {
          throw new Error(`Query exceeded maximum row count: ${result.length}`);
        }

        results[queryId] = result;
        queryTimes[queryId] = Date.now() - startTime;

      } catch (error) {
        throw new Error(`Query ${queryId} failed: ${error.message}`);
      }
    }

    return { results, queryTimes };
  }

  /**
   * Apply Row Level Security rules
   */
  applyRowLevelSecurity(sql, rlsRule, parameters) {
    // Parse SQL and add WHERE clause
    const whereClause = Handlebars.compile(rlsRule)(parameters);

    // Simple implementation - in production use proper SQL parser
    if (sql.toLowerCase().includes('where')) {
      return sql.replace(/where/i, `WHERE (${whereClause}) AND `);
    } else {
      return sql.replace(/from\s+(\w+)/i, `FROM $1 WHERE ${whereClause}`);
    }
  }

  /**
   * Validate query doesn't contain dangerous operations
   */
  validateQuerySafety(sql) {
    const forbidden = [
      'DROP', 'DELETE', 'TRUNCATE', 'UPDATE', 'INSERT',
      'CREATE', 'ALTER', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE'
    ];

    const upperSql = sql.toUpperCase();
    for (const keyword of forbidden) {
      if (upperSql.includes(keyword)) {
        throw new Error(`Forbidden operation in query: ${keyword}`);
      }
    }

    return true;
  }

  /**
   * Process and structure data according to sections
   */
  async processData(queryResults, sections, config) {
    const processed = {
      metadata: {
        generated_at: new Date().toISOString(),
        version: '1.0',
        config: config
      },
      sections: []
    };

    for (const section of sections) {
      const sectionData = {
        id: section.id,
        name: section.name,
        icon: section.icon,
        order: section.order,
        data: {}
      };

      // Collect data from queries
      for (const queryId of section.queries) {
        if (queryResults.results[queryId]) {
          sectionData.data[queryId] = queryResults.results[queryId];
        }
      }

      // Apply transformations
      if (section.transformations) {
        sectionData.data = await this.applyTransformations(
          sectionData.data,
          section.transformations
        );
      }

      processed.sections.push(sectionData);
    }

    return processed;
  }

  /**
   * Generate output in requested format
   */
  async generateOutput(data, format, template) {
    switch (format.toLowerCase()) {
      case 'json':
        return this.generateJSON(data);

      case 'markdown':
        return this.generateMarkdown(data, template);

      case 'html':
        return this.generateHTML(data, template);

      case 'pdf':
        return await this.generatePDF(data, template);

      case 'excel':
        return await this.generateExcel(data, template);

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate Markdown output
   */
  generateMarkdown(data, template) {
    let markdown = `# ${template.display_name}\n`;
    markdown += `## AI-HRMS-2025 System\n\n`;
    markdown += `**Generated:** ${data.metadata.generated_at}\n\n`;
    markdown += `---\n\n`;

    for (const section of data.sections) {
      markdown += `## ${section.icon} ${section.name}\n\n`;

      for (const [queryId, queryData] of Object.entries(section.data)) {
        if (Array.isArray(queryData) && queryData.length > 0) {
          // Generate table for array data
          if (queryData.length === 1) {
            // Single record - show as key-value pairs
            const record = queryData[0];
            for (const [key, value] of Object.entries(record)) {
              markdown += `- **${this.humanize(key)}:** ${value || 'N/A'}\n`;
            }
          } else {
            // Multiple records - show as table
            markdown += this.generateMarkdownTable(queryData);
          }
        }
        markdown += '\n';
      }
      markdown += '---\n\n';
    }

    // Add visualizations if defined
    if (template.visualization_rules) {
      markdown += this.generateMermaidCharts(data, template.visualization_rules);
    }

    return markdown;
  }

  /**
   * Generate Mermaid charts for visualizations
   */
  generateMermaidCharts(data, vizRules) {
    let charts = '## 📊 Data Visualizations\n\n';

    for (const [vizId, vizConfig] of Object.entries(vizRules)) {
      charts += `### ${this.humanize(vizId)}\n\n`;
      charts += '```mermaid\n';

      switch (vizConfig.type) {
        case 'radar-beta':
          charts += this.generateRadarChart(data, vizConfig);
          break;
        case 'pie':
          charts += this.generatePieChart(data, vizConfig);
          break;
        case 'xychart-beta':
          charts += this.generateXYChart(data, vizConfig);
          break;
        default:
          charts += `graph TD\n  A[Unsupported chart type: ${vizConfig.type}]`;
      }

      charts += '\n```\n\n';
    }

    return charts;
  }

  /**
   * Helper methods
   */
  humanize(str) {
    return str
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  generateCacheKey(templateId, parameters) {
    return `${templateId}:${JSON.stringify(parameters)}`;
  }

  async executeWithTimeout(promise, timeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeout)
      )
    ]);
  }

  initializeHelpers() {
    // Register Handlebars helpers for template processing
    Handlebars.registerHelper('formatDate', (date) => {
      return new Date(date).toLocaleDateString();
    });

    Handlebars.registerHelper('percentage', (value, total) => {
      return Math.round((value / total) * 100);
    });

    // Add more helpers as needed
  }
}

module.exports = ReportEngine;
```

### 2.2 Template Management Service

```javascript
// src/services/templateManagementService.js
class TemplateManagementService {
  /**
   * Create new template
   */
  async createTemplate(templateData, userId) {
    const transaction = await sequelize.transaction();

    try {
      // Validate template structure
      await this.validateTemplate(templateData);

      // Create template
      const template = await ReportTemplate.create({
        ...templateData,
        created_by: userId,
        updated_by: userId
      }, { transaction });

      // Create initial version
      await ReportTemplateVersion.create({
        template_id: template.template_id,
        version_number: 1,
        name: template.name,
        sections: template.sections,
        sql_queries: template.sql_queries,
        parameters: template.parameters,
        template_config: template.template_config,
        visualization_rules: template.visualization_rules,
        change_type: 'major',
        changes_description: 'Initial template creation',
        created_by: userId,
        is_published: true
      }, { transaction });

      await transaction.commit();
      return template;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update existing template
   */
  async updateTemplate(templateId, updates, userId, changeDescription) {
    const transaction = await sequelize.transaction();

    try {
      const template = await ReportTemplate.findByPk(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Determine change type
      const changeType = this.determineChangeType(template, updates);

      // Create new version
      const newVersion = template.version + 1;
      await ReportTemplateVersion.create({
        template_id: templateId,
        version_number: newVersion,
        name: updates.name || template.name,
        sections: updates.sections || template.sections,
        sql_queries: updates.sql_queries || template.sql_queries,
        parameters: updates.parameters || template.parameters,
        template_config: updates.template_config || template.template_config,
        visualization_rules: updates.visualization_rules || template.visualization_rules,
        change_type: changeType,
        changes_description: changeDescription,
        changes_detail: this.generateDiff(template, updates),
        created_by: userId,
        is_published: false
      }, { transaction });

      // Update template
      await template.update({
        ...updates,
        version: newVersion,
        updated_by: userId,
        updated_at: new Date()
      }, { transaction });

      await transaction.commit();
      return template;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Clone existing template
   */
  async cloneTemplate(templateId, newName, userId) {
    const source = await ReportTemplate.findByPk(templateId);
    if (!source) {
      throw new Error('Source template not found');
    }

    const clonedData = {
      name: newName,
      display_name: `${source.display_name} (Copy)`,
      description: source.description,
      category: source.category,
      subcategory: source.subcategory,
      sections: source.sections,
      sql_queries: source.sql_queries,
      parameters: source.parameters,
      output_formats: source.output_formats,
      default_format: source.default_format,
      template_config: source.template_config,
      visualization_rules: source.visualization_rules,
      required_roles: source.required_roles,
      data_sensitivity_level: source.data_sensitivity_level,
      row_level_security: source.row_level_security,
      validation_schema: source.validation_schema,
      tags: source.tags,
      is_system: false // Cloned templates are not system templates
    };

    return await this.createTemplate(clonedData, userId);
  }

  /**
   * Rollback to previous version
   */
  async rollbackTemplate(templateId, targetVersion, userId) {
    const transaction = await sequelize.transaction();

    try {
      const template = await ReportTemplate.findByPk(templateId);
      const version = await ReportTemplateVersion.findOne({
        where: {
          template_id: templateId,
          version_number: targetVersion
        }
      });

      if (!version) {
        throw new Error(`Version ${targetVersion} not found`);
      }

      // Create rollback version
      const newVersion = template.version + 1;
      await ReportTemplateVersion.create({
        template_id: templateId,
        version_number: newVersion,
        name: version.name,
        sections: version.sections,
        sql_queries: version.sql_queries,
        parameters: version.parameters,
        template_config: version.template_config,
        visualization_rules: version.visualization_rules,
        change_type: 'rollback',
        changes_description: `Rollback to version ${targetVersion}`,
        created_by: userId,
        is_published: true,
        is_rollback_point: true
      }, { transaction });

      // Update template
      await template.update({
        name: version.name,
        sections: version.sections,
        sql_queries: version.sql_queries,
        parameters: version.parameters,
        template_config: version.template_config,
        visualization_rules: version.visualization_rules,
        version: newVersion,
        updated_by: userId,
        updated_at: new Date()
      }, { transaction });

      await transaction.commit();
      return template;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Validate template structure
   */
  async validateTemplate(template) {
    // Validate required fields
    if (!template.name || !template.display_name) {
      throw new Error('Template name and display name are required');
    }

    // Validate SQL queries
    for (const [queryId, sql] of Object.entries(template.sql_queries || {})) {
      this.validateSQL(sql);
    }

    // Validate sections reference existing queries
    for (const section of template.sections || []) {
      for (const queryId of section.queries || []) {
        if (!template.sql_queries[queryId]) {
          throw new Error(`Section references non-existent query: ${queryId}`);
        }
      }
    }

    // Validate parameters
    for (const [paramId, config] of Object.entries(template.parameters || {})) {
      this.validateParameterConfig(config);
    }

    return true;
  }

  validateSQL(sql) {
    // Check for dangerous operations
    const forbidden = ['DROP', 'DELETE', 'TRUNCATE', 'UPDATE', 'INSERT'];
    const upperSql = sql.toUpperCase();

    for (const keyword of forbidden) {
      if (upperSql.includes(keyword)) {
        throw new Error(`SQL contains forbidden operation: ${keyword}`);
      }
    }

    // Check for parameter placeholders
    const params = sql.match(/:[a-zA-Z_]+/g);
    if (!params || params.length === 0) {
      console.warn('SQL query contains no parameters - might not be dynamic');
    }

    return true;
  }

  validateParameterConfig(config) {
    const validTypes = ['string', 'number', 'date', 'daterange', 'boolean', 'array'];
    if (!validTypes.includes(config.type)) {
      throw new Error(`Invalid parameter type: ${config.type}`);
    }

    if (config.validation) {
      // Validate validation rules
      const validValidations = ['email', 'uuid', 'url', 'regex'];
      if (!validValidations.includes(config.validation)) {
        throw new Error(`Invalid validation type: ${config.validation}`);
      }
    }

    return true;
  }

  determineChangeType(oldTemplate, updates) {
    // Major: SQL or structure changes
    if (updates.sql_queries || updates.sections) {
      return 'major';
    }

    // Minor: Config or visualization changes
    if (updates.template_config || updates.visualization_rules) {
      return 'minor';
    }

    // Patch: Metadata changes
    return 'patch';
  }

  generateDiff(oldData, newData) {
    // Simple diff generation - in production use proper diff library
    const diff = {
      added: {},
      removed: {},
      modified: {}
    };

    // Compare each field
    for (const key of Object.keys(newData)) {
      if (!oldData[key]) {
        diff.added[key] = newData[key];
      } else if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        diff.modified[key] = {
          old: oldData[key],
          new: newData[key]
        };
      }
    }

    for (const key of Object.keys(oldData)) {
      if (!newData[key]) {
        diff.removed[key] = oldData[key];
      }
    }

    return diff;
  }
}

module.exports = TemplateManagementService;
```

---

## 🔐 Phase 3: Security & API Layer (Week 2)

### 3.1 API Routes Implementation

```javascript
// src/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ReportController = require('../controllers/reportController');
const rateLimit = require('express-rate-limit');

// Rate limiting for report execution
const executionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many report executions, please try again later'
});

// Template Management Routes
router.get('/templates',
  authenticate,
  ReportController.listTemplates
);

router.get('/templates/:id',
  authenticate,
  ReportController.getTemplate
);

router.post('/templates',
  authenticate,
  authorize(['admin', 'hr']),
  ReportController.createTemplate
);

router.put('/templates/:id',
  authenticate,
  authorize(['admin', 'hr']),
  ReportController.updateTemplate
);

router.delete('/templates/:id',
  authenticate,
  authorize(['admin']),
  ReportController.deleteTemplate
);

router.post('/templates/:id/clone',
  authenticate,
  authorize(['admin', 'hr']),
  ReportController.cloneTemplate
);

// Version Management
router.get('/templates/:id/versions',
  authenticate,
  ReportController.getVersionHistory
);

router.post('/templates/:id/rollback',
  authenticate,
  authorize(['admin', 'hr']),
  ReportController.rollbackVersion
);

// Report Execution
router.post('/templates/:id/execute',
  authenticate,
  executionLimiter,
  ReportController.executeReport
);

router.post('/templates/:id/preview',
  authenticate,
  ReportController.previewReport
);

// Batch Execution
router.post('/batch/execute',
  authenticate,
  authorize(['admin', 'hr']),
  ReportController.batchExecute
);

// Scheduling
router.post('/templates/:id/schedule',
  authenticate,
  authorize(['admin', 'hr']),
  ReportController.scheduleReport
);

// Analytics
router.get('/analytics/usage',
  authenticate,
  authorize(['admin']),
  ReportController.getUsageAnalytics
);

router.get('/analytics/performance',
  authenticate,
  authorize(['admin']),
  ReportController.getPerformanceAnalytics
);

// Permissions
router.get('/templates/:id/permissions',
  authenticate,
  authorize(['admin', 'hr']),
  ReportController.getPermissions
);

router.post('/templates/:id/permissions',
  authenticate,
  authorize(['admin', 'hr']),
  ReportController.grantPermission
);

router.delete('/templates/:id/permissions/:permissionId',
  authenticate,
  authorize(['admin', 'hr']),
  ReportController.revokePermission
);

// Export/Import
router.get('/templates/:id/export',
  authenticate,
  authorize(['admin', 'hr']),
  ReportController.exportTemplate
);

router.post('/templates/import',
  authenticate,
  authorize(['admin', 'hr']),
  ReportController.importTemplate
);

module.exports = router;
```

### 3.2 Report Controller Implementation

```javascript
// src/controllers/reportController.js
const ReportEngine = require('../services/reportEngine');
const TemplateManagementService = require('../services/templateManagementService');
const { ReportTemplate, ReportExecutionLog } = require('../models');

class ReportController {
  constructor() {
    this.reportEngine = new ReportEngine();
    this.templateService = new TemplateManagementService();
  }

  /**
   * Execute a report template
   */
  async executeReport(req, res) {
    try {
      const { id: templateId } = req.params;
      const parameters = { ...req.query, ...req.body };
      const format = parameters.format || 'json';

      const context = {
        user: req.user,
        organization_id: req.user.organization_id,
        ip: req.ip,
        userAgent: req.get('user-agent')
      };

      const result = await this.reportEngine.executeReport(
        templateId,
        parameters,
        context
      );

      // Set appropriate headers based on format
      switch (format.toLowerCase()) {
        case 'json':
          res.json(result);
          break;
        case 'markdown':
          res.type('text/markdown').send(result);
          break;
        case 'html':
          res.type('text/html').send(result);
          break;
        case 'pdf':
          res.type('application/pdf').send(result);
          break;
        case 'excel':
          res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            .attachment(`report-${templateId}.xlsx`)
            .send(result);
          break;
        default:
          res.send(result);
      }

    } catch (error) {
      console.error('Report execution error:', error);
      res.status(error.message.includes('permission') ? 403 : 500).json({
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * List available templates
   */
  async listTemplates(req, res) {
    try {
      const { category, search, tags, page = 1, limit = 20 } = req.query;

      const where = {
        is_active: true,
        [Op.or]: [
          { is_public: true },
          { created_by: req.user.id },
          sequelize.literal(`
            EXISTS (
              SELECT 1 FROM report_template_permissions
              WHERE template_id = ReportTemplate.template_id
                AND grantee_type = 'user'
                AND grantee_id = '${req.user.id}'
                AND can_view = true
            )
          `)
        ]
      };

      if (category) {
        where.category = category;
      }

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { display_name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (tags && tags.length) {
        where.tags = { [Op.contains]: tags.split(',') };
      }

      const templates = await ReportTemplate.findAndCountAll({
        where,
        attributes: [
          'template_id',
          'name',
          'display_name',
          'description',
          'category',
          'subcategory',
          'tags',
          'execution_count',
          'last_executed_at',
          'created_at',
          'updated_at'
        ],
        order: [['execution_count', 'DESC']],
        limit,
        offset: (page - 1) * limit
      });

      res.json({
        templates: templates.rows,
        total: templates.count,
        page: parseInt(page),
        pages: Math.ceil(templates.count / limit)
      });

    } catch (error) {
      console.error('List templates error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get template details
   */
  async getTemplate(req, res) {
    try {
      const template = await ReportTemplate.findByPk(req.params.id);

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Check permissions
      const canView = await this.checkViewPermission(template, req.user);
      if (!canView) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(template);

    } catch (error) {
      console.error('Get template error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create new template
   */
  async createTemplate(req, res) {
    try {
      const template = await this.templateService.createTemplate(
        req.body,
        req.user.id
      );

      res.status(201).json(template);

    } catch (error) {
      console.error('Create template error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Update template
   */
  async updateTemplate(req, res) {
    try {
      const { changeDescription, ...updates } = req.body;

      const template = await this.templateService.updateTemplate(
        req.params.id,
        updates,
        req.user.id,
        changeDescription || 'Template updated'
      );

      res.json(template);

    } catch (error) {
      console.error('Update template error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Clone template
   */
  async cloneTemplate(req, res) {
    try {
      const { newName } = req.body;

      if (!newName) {
        return res.status(400).json({ error: 'New name is required' });
      }

      const cloned = await this.templateService.cloneTemplate(
        req.params.id,
        newName,
        req.user.id
      );

      res.status(201).json(cloned);

    } catch (error) {
      console.error('Clone template error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get usage analytics
   */
  async getUsageAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const analytics = await sequelize.query(`
        SELECT
          DATE(executed_at) as date,
          COUNT(*) as executions,
          COUNT(DISTINCT template_id) as unique_templates,
          COUNT(DISTINCT executed_by) as unique_users,
          AVG(execution_time_ms) as avg_execution_time,
          SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
        FROM report_execution_log
        WHERE executed_at BETWEEN :startDate AND :endDate
        GROUP BY DATE(executed_at)
        ORDER BY date DESC
      `, {
        replacements: {
          startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: endDate || new Date()
        },
        type: QueryTypes.SELECT
      });

      res.json(analytics);

    } catch (error) {
      console.error('Usage analytics error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Helper method to check view permission
   */
  async checkViewPermission(template, user) {
    if (template.is_public) return true;
    if (template.created_by === user.id) return true;

    const userRoles = user.roles || [user.system_role];
    if (template.required_roles.some(role => userRoles.includes(role))) {
      return true;
    }

    const permission = await ReportTemplatePermission.findOne({
      where: {
        template_id: template.template_id,
        grantee_type: 'user',
        grantee_id: user.id,
        can_view: true
      }
    });

    return !!permission;
  }
}

module.exports = new ReportController();
```

---

## 🎨 Phase 4: Enhanced Features (Week 3)

### 4.1 Multi-Format Renderer Service

```javascript
// src/services/formatRenderer.js
class FormatRenderer {
  async renderPDF(data, template) {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));

    // Header
    doc.fontSize(20).text(template.display_name, { align: 'center' });
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    // Sections
    for (const section of data.sections) {
      doc.fontSize(16).text(`${section.icon} ${section.name}`);
      doc.moveDown(0.5);

      for (const [key, values] of Object.entries(section.data)) {
        if (Array.isArray(values) && values.length > 0) {
          this.renderPDFTable(doc, values);
        }
      }
      doc.moveDown();
    }

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  async renderExcel(data, template) {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Property', key: 'property', width: 30 },
      { header: 'Value', key: 'value', width: 50 }
    ];

    summarySheet.addRow({ property: 'Report Name', value: template.display_name });
    summarySheet.addRow({ property: 'Generated', value: new Date().toLocaleString() });
    summarySheet.addRow({ property: 'Total Sections', value: data.sections.length });

    // Section sheets
    for (const section of data.sections) {
      const sheet = workbook.addWorksheet(section.name.substring(0, 31));

      for (const [key, values] of Object.entries(section.data)) {
        if (Array.isArray(values) && values.length > 0) {
          // Add headers
          const headers = Object.keys(values[0]);
          sheet.columns = headers.map(h => ({
            header: this.humanize(h),
            key: h,
            width: 20
          }));

          // Add data
          values.forEach(row => sheet.addRow(row));

          // Style headers
          sheet.getRow(1).font = { bold: true };
          sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE3F2FD' }
          };
        }
      }
    }

    return await workbook.xlsx.writeBuffer();
  }

  renderHTML(data, template) {
    const config = template.template_config;

    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${template.display_name}</title>
  <style>
    body {
      font-family: ${config.theme?.fontFamily || 'Arial, sans-serif'};
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { color: ${config.theme?.primaryColor || '#2196F3'}; }
    h2 {
      color: #666;
      border-bottom: 2px solid ${config.theme?.primaryColor || '#E3F2FD'};
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: ${config.theme?.primaryColor || '#E3F2FD'};
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    .metadata {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 30px;
    }
    .section {
      margin-bottom: 40px;
    }
    .icon {
      font-size: 1.2em;
      margin-right: 10px;
    }
    @media print {
      body { font-size: 12pt; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>${template.display_name}</h1>

  <div class="metadata">
    <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
    <strong>Version:</strong> ${template.version}<br>
    <strong>Format:</strong> HTML Report
  </div>
`;

    // Render sections
    for (const section of data.sections) {
      html += `
  <div class="section">
    <h2><span class="icon">${section.icon}</span>${section.name}</h2>
`;

      for (const [key, values] of Object.entries(section.data)) {
        if (Array.isArray(values) && values.length > 0) {
          html += this.renderHTMLTable(values);
        }
      }

      html += `</div>`;
    }

    html += `
</body>
</html>`;

    return html;
  }

  renderHTMLTable(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);

    let table = '<table><thead><tr>';
    headers.forEach(h => {
      table += `<th>${this.humanize(h)}</th>`;
    });
    table += '</tr></thead><tbody>';

    data.forEach(row => {
      table += '<tr>';
      headers.forEach(h => {
        table += `<td>${row[h] || ''}</td>`;
      });
      table += '</tr>';
    });

    table += '</tbody></table>';
    return table;
  }

  humanize(str) {
    return str
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
}

module.exports = FormatRenderer;
```

---

## 🖥️ Phase 5: Visual Builder Interface (Week 4)

### 5.1 React Component Structure

```javascript
// frontend/src/components/ReportBuilder/ReportBuilder.jsx
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import QueryBuilder from './QueryBuilder';
import ParameterEditor from './ParameterEditor';
import VisualizationConfig from './VisualizationConfig';
import PreviewPane from './PreviewPane';

const ReportBuilder = () => {
  const [template, setTemplate] = useState({
    name: '',
    display_name: '',
    description: '',
    sections: [],
    sql_queries: {},
    parameters: {},
    visualization_rules: {}
  });

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle section reordering
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const sections = Array.from(template.sections);
    const [reorderedItem] = sections.splice(result.source.index, 1);
    sections.splice(result.destination.index, 0, reorderedItem);

    setTemplate({ ...template, sections });
  };

  // Add new section
  const addSection = () => {
    const newSection = {
      id: `section_${Date.now()}`,
      name: 'New Section',
      icon: '○',
      order: template.sections.length + 1,
      queries: []
    };

    setTemplate({
      ...template,
      sections: [...template.sections, newSection]
    });
  };

  // Add query to template
  const addQuery = (queryId, sql) => {
    setTemplate({
      ...template,
      sql_queries: {
        ...template.sql_queries,
        [queryId]: sql
      }
    });
  };

  // Preview report
  const handlePreview = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports/templates/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(template)
      });

      const result = await response.json();
      setPreview(result);
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save template
  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports/templates', {
        method: template.template_id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(template)
      });

      if (response.ok) {
        const saved = await response.json();
        setTemplate(saved);
        alert('Template saved successfully!');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-builder">
      <div className="builder-header">
        <h1>Report Template Builder</h1>
        <div className="actions">
          <button onClick={handlePreview} disabled={loading}>
            Preview
          </button>
          <button onClick={handleSave} disabled={loading}>
            Save Template
          </button>
        </div>
      </div>

      <div className="builder-content">
        <div className="left-panel">
          <div className="template-info">
            <input
              type="text"
              placeholder="Template Name"
              value={template.display_name}
              onChange={e => setTemplate({...template, display_name: e.target.value})}
            />
            <textarea
              placeholder="Description"
              value={template.description}
              onChange={e => setTemplate({...template, description: e.target.value})}
            />
          </div>

          <div className="sections-editor">
            <h3>Report Sections</h3>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {template.sections.map((section, index) => (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="section-item"
                          >
                            <span className="icon">{section.icon}</span>
                            <input
                              value={section.name}
                              onChange={e => updateSection(index, 'name', e.target.value)}
                            />
                            <button onClick={() => editSection(index)}>Edit</button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <button onClick={addSection}>Add Section</button>
          </div>

          <QueryBuilder onAddQuery={addQuery} />
          <ParameterEditor
            parameters={template.parameters}
            onChange={params => setTemplate({...template, parameters: params})}
          />
          <VisualizationConfig
            rules={template.visualization_rules}
            onChange={rules => setTemplate({...template, visualization_rules: rules})}
          />
        </div>

        <div className="right-panel">
          <PreviewPane data={preview} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;
```

---

## 📋 Implementation Checklist

### Week 1: Foundation
- [ ] Create database migrations for all tables
- [ ] Run migrations and verify schema
- [ ] Migrate Current User Status Report to database
- [ ] Create Sequelize models with associations
- [ ] Test basic CRUD operations

### Week 2: Engine & API
- [ ] Implement ReportEngine service
- [ ] Create Template Management service
- [ ] Build API routes and controllers
- [ ] Add authentication and authorization
- [ ] Test report execution with migrated template

### Week 3: Features & Security
- [ ] Implement multi-format renderers
- [ ] Add parameter validation system
- [ ] Create permission management
- [ ] Build analytics and monitoring
- [ ] Add caching layer

### Week 4: UI & Polish
- [ ] Create React components for builder
- [ ] Implement drag-and-drop interface
- [ ] Add preview functionality
- [ ] Build template gallery
- [ ] Complete documentation

---

## 🎯 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Template Creation Time | <5 minutes | Time from start to save |
| Report Execution Time | <500ms | Average execution time |
| User Adoption | 80% | Active users using templates |
| Error Rate | <1% | Failed executions / total |
| Template Library Size | 20+ | Number of active templates |
| Security Incidents | 0 | Unauthorized access attempts |

---

## 🔄 Migration Path

### Step 1: Parallel Running
1. Deploy database-driven system alongside static
2. Migrate Current User Status Report
3. Test thoroughly with both systems
4. Monitor performance and errors

### Step 2: Gradual Migration
1. Create new reports in database system
2. Migrate existing reports one by one
3. Update API endpoints to use new engine
4. Train users on new features

### Step 3: Deprecation
1. Mark static system as deprecated
2. Provide migration tools
3. Set sunset date
4. Remove static code

---

## 📚 Technical Decisions

### Why PostgreSQL JSON Columns?
- Flexible schema for template evolution
- Native JSON operations for performance
- Maintains relational integrity
- Supports complex nested structures

### Why Separate Version Table?
- Complete version history
- Rollback capabilities
- Audit trail compliance
- Storage optimization

### Why Handlebars for Templates?
- Simple, secure templating
- No arbitrary code execution
- Wide ecosystem support
- Easy to learn

### Why React for Builder?
- Component reusability
- Rich ecosystem
- Drag-and-drop libraries
- Real-time preview

---

## 🚨 Risk Mitigation

| Risk | Mitigation Strategy |
|------|-------------------|
| SQL Injection | Parameterized queries, validation, allowlist |
| Performance Issues | Caching, indexes, query optimization |
| Data Leakage | Row-level security, permission checks |
| Template Corruption | Version control, validation, rollback |
| User Adoption | Training, templates library, wizard |

---

## 📖 Documentation Requirements

1. **API Documentation** - OpenAPI/Swagger spec
2. **User Guide** - Template creation and usage
3. **Admin Guide** - System configuration
4. **Security Guide** - Best practices
5. **Migration Guide** - From static to dynamic

---

## 🎓 Training Plan

### For Developers
1. Database schema understanding
2. ReportEngine architecture
3. Security best practices
4. API usage

### For HR/Admin Users
1. Template builder interface
2. Parameter configuration
3. Visualization setup
4. Permission management

### For End Users
1. Report execution
2. Parameter selection
3. Format options
4. Scheduling

---

## ✅ Definition of Done

A report template is considered complete when:
1. ✅ All queries execute without errors
2. ✅ Parameters are validated
3. ✅ All output formats work
4. ✅ Permissions are enforced
5. ✅ Performance meets targets
6. ✅ Documentation is complete
7. ✅ Tests pass (unit, integration, security)
8. ✅ Reviewed and approved

---

## 🔮 Future Enhancements

### Phase 6: Advanced Features
- AI-powered query suggestions
- Natural language report requests
- Predictive caching
- Multi-language support
- Mobile app support

### Phase 7: Enterprise Features
- Multi-tenant isolation
- Advanced scheduling (cron)
- Report subscriptions
- Data warehouse integration
- BI tool integration

### Phase 8: Analytics Platform
- Custom dashboards
- Real-time data streaming
- Machine learning insights
- Predictive analytics
- Anomaly detection

---

*This comprehensive strategy document provides the complete roadmap for transforming the Current User Status Full Report into a powerful, database-driven template system that will revolutionize reporting in the AI-HRMS-2025 platform.*