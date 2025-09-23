const ExcelJS = require('exceljs');
const path = require('path');

async function createServiceTablesExcel() {
  const workbook = new ExcelJS.Workbook();

  // Define service tables with their structures and sample data
  const serviceTables = {
    // Skills Taxonomy Service Tables
    'SkillsMaster': {
      fields: [
        { name: 'skill_id', type: 'UUID', description: 'Primary key' },
        { name: 'skill_name', type: 'STRING(255)', description: 'Name of the skill' },
        { name: 'skill_code', type: 'STRING(50)', description: 'Unique skill code' },
        { name: 'skill_description', type: 'TEXT', description: 'Detailed description' },
        { name: 'skill_type', type: 'ENUM', description: 'technical, soft, business, leadership, digital' },
        { name: 'proficiency_levels', type: 'JSONB', description: 'Available proficiency levels' },
        { name: 'source_taxonomy', type: 'STRING(100)', description: 'Source taxonomy reference' },
        { name: 'parent_skill_id', type: 'UUID', description: 'Parent skill for hierarchy' },
        { name: 'skill_level', type: 'INTEGER', description: 'Hierarchy level' },
        { name: 'is_emerging', type: 'BOOLEAN', description: 'Is this an emerging skill' },
        { name: 'growth_rate', type: 'DECIMAL(5,2)', description: 'Skill demand growth rate' },
        { name: 'automation_risk', type: 'ENUM', description: 'Risk of automation' }
      ],
      sampleData: [
        ['uuid1', 'JavaScript Programming', 'JS_PROG', 'Frontend and backend JavaScript development', 'technical', '{"beginner": 1, "intermediate": 2, "advanced": 3, "expert": 4}', 'O*NET', null, 0, true, 15.5, 'low'],
        ['uuid2', 'Project Management', 'PM_MGMT', 'Planning and executing projects', 'business', '{"basic": 1, "certified": 2, "senior": 3}', 'PMI', null, 0, false, 8.2, 'very_low'],
        ['uuid3', 'Machine Learning', 'ML_AI', 'AI and ML model development', 'technical', '{"beginner": 1, "intermediate": 2, "advanced": 3}', 'Custom', null, 0, true, 25.8, 'very_low']
      ]
    },

    'SkillsSynonyms': {
      fields: [
        { name: 'synonym_id', type: 'UUID', description: 'Primary key' },
        { name: 'skill_id', type: 'UUID', description: 'Reference to skills_master' },
        { name: 'synonym_name', type: 'STRING(255)', description: 'Alternative name for skill' },
        { name: 'language_code', type: 'STRING(10)', description: 'Language of synonym' },
        { name: 'context', type: 'STRING(100)', description: 'Context where synonym is used' }
      ],
      sampleData: [
        ['uuid4', 'uuid1', 'JS', 'en', 'informal'],
        ['uuid5', 'uuid1', 'ECMAScript', 'en', 'formal'],
        ['uuid6', 'uuid2', 'Gestione Progetti', 'it', 'translation']
      ]
    },

    'SkillsRelationship': {
      fields: [
        { name: 'relationship_id', type: 'UUID', description: 'Primary key' },
        { name: 'source_skill_id', type: 'UUID', description: 'Source skill' },
        { name: 'target_skill_id', type: 'UUID', description: 'Target skill' },
        { name: 'relationship_type', type: 'ENUM', description: 'prerequisite, complement, alternative' },
        { name: 'strength', type: 'DECIMAL(3,2)', description: 'Relationship strength 0-1' }
      ],
      sampleData: [
        ['uuid7', 'uuid1', 'uuid3', 'prerequisite', 0.8],
        ['uuid8', 'uuid2', 'uuid1', 'complement', 0.6]
      ]
    },

    'IndustrySkills': {
      fields: [
        { name: 'industry_skill_id', type: 'UUID', description: 'Primary key' },
        { name: 'skill_id', type: 'UUID', description: 'Reference to skills_master' },
        { name: 'industry_code', type: 'STRING(50)', description: 'Industry classification code' },
        { name: 'industry_name', type: 'STRING(255)', description: 'Industry name' },
        { name: 'relevance_score', type: 'DECIMAL(3,2)', description: 'Skill relevance to industry' },
        { name: 'demand_level', type: 'ENUM', description: 'low, medium, high, critical' }
      ],
      sampleData: [
        ['uuid9', 'uuid1', 'TECH_001', 'Software Development', 0.95, 'critical'],
        ['uuid10', 'uuid3', 'TECH_001', 'Software Development', 0.85, 'high']
      ]
    },

    // Job Architecture Service Tables
    'JobFamily': {
      fields: [
        { name: 'family_id', type: 'UUID', description: 'Primary key' },
        { name: 'family_name', type: 'STRING(255)', description: 'Job family name' },
        { name: 'family_code', type: 'STRING(50)', description: 'Unique family code' },
        { name: 'description', type: 'TEXT', description: 'Family description' },
        { name: 'industry_focus', type: 'STRING(255)', description: 'Primary industry focus' },
        { name: 'career_level', type: 'ENUM', description: 'entry, mid, senior, executive' }
      ],
      sampleData: [
        ['uuid11', 'Engineering', 'ENG', 'Software and technical engineering roles', 'Technology', 'mid'],
        ['uuid12', 'Sales', 'SALES', 'Sales and business development roles', 'General', 'entry'],
        ['uuid13', 'Executive', 'EXEC', 'C-level and senior leadership', 'General', 'executive']
      ]
    },

    'JobRole': {
      fields: [
        { name: 'role_id', type: 'UUID', description: 'Primary key' },
        { name: 'family_id', type: 'UUID', description: 'Reference to job_families' },
        { name: 'role_name', type: 'STRING(255)', description: 'Job role name' },
        { name: 'role_code', type: 'STRING(50)', description: 'Unique role code' },
        { name: 'seniority_level', type: 'ENUM', description: 'junior, mid, senior, lead, principal' },
        { name: 'min_experience_years', type: 'INTEGER', description: 'Minimum experience required' },
        { name: 'max_experience_years', type: 'INTEGER', description: 'Maximum relevant experience' }
      ],
      sampleData: [
        ['uuid14', 'uuid11', 'Senior Software Engineer', 'SSE', 'senior', 5, 10],
        ['uuid15', 'uuid11', 'Principal Engineer', 'PE', 'principal', 8, 15],
        ['uuid16', 'uuid12', 'Sales Representative', 'SR', 'junior', 0, 3]
      ]
    },

    'JobSkillsRequirement': {
      fields: [
        { name: 'requirement_id', type: 'UUID', description: 'Primary key' },
        { name: 'role_id', type: 'UUID', description: 'Reference to job_roles' },
        { name: 'skill_id', type: 'UUID', description: 'Reference to skills_master' },
        { name: 'proficiency_level', type: 'INTEGER', description: 'Required proficiency level' },
        { name: 'is_required', type: 'BOOLEAN', description: 'Is this skill mandatory' },
        { name: 'weight', type: 'DECIMAL(3,2)', description: 'Importance weight for role' }
      ],
      sampleData: [
        ['uuid17', 'uuid14', 'uuid1', 3, true, 0.9],
        ['uuid18', 'uuid14', 'uuid3', 2, false, 0.7],
        ['uuid19', 'uuid15', 'uuid1', 4, true, 0.95]
      ]
    },

    'JobDescriptionTemplate': {
      fields: [
        { name: 'template_id', type: 'UUID', description: 'Primary key' },
        { name: 'role_id', type: 'UUID', description: 'Reference to job_roles' },
        { name: 'template_name', type: 'STRING(255)', description: 'Template name' },
        { name: 'description_template', type: 'TEXT', description: 'Job description template' },
        { name: 'responsibilities_template', type: 'TEXT', description: 'Responsibilities template' },
        { name: 'qualifications_template', type: 'TEXT', description: 'Qualifications template' },
        { name: 'is_default', type: 'BOOLEAN', description: 'Is default template for role' }
      ],
      sampleData: [
        ['uuid20', 'uuid14', 'Standard SSE Template', 'Senior Software Engineer responsible for...', 'Design and implement software solutions...', 'Bachelor\'s degree in Computer Science...', true]
      ]
    },

    // Assessment Framework Service Tables
    'Assessment': {
      fields: [
        { name: 'assessment_id', type: 'UUID', description: 'Primary key' },
        { name: 'assessment_name', type: 'STRING(255)', description: 'Assessment name' },
        { name: 'assessment_type', type: 'ENUM', description: 'technical, behavioral, cognitive' },
        { name: 'description', type: 'TEXT', description: 'Assessment description' },
        { name: 'duration_minutes', type: 'INTEGER', description: 'Expected duration' },
        { name: 'passing_score', type: 'DECIMAL(5,2)', description: 'Minimum passing score' },
        { name: 'is_adaptive', type: 'BOOLEAN', description: 'Uses adaptive questioning' }
      ],
      sampleData: [
        ['uuid21', 'JavaScript Proficiency Test', 'technical', 'Comprehensive JavaScript assessment', 60, 75.0, false],
        ['uuid22', 'Leadership Assessment', 'behavioral', 'Leadership skills evaluation', 45, 70.0, true]
      ]
    },

    'AssessmentQuestion': {
      fields: [
        { name: 'question_id', type: 'UUID', description: 'Primary key' },
        { name: 'assessment_id', type: 'UUID', description: 'Reference to assessments' },
        { name: 'skill_id', type: 'UUID', description: 'Related skill' },
        { name: 'question_text', type: 'TEXT', description: 'Question content' },
        { name: 'question_type', type: 'ENUM', description: 'multiple_choice, code, essay' },
        { name: 'difficulty_level', type: 'INTEGER', description: 'Difficulty 1-5' },
        { name: 'points', type: 'INTEGER', description: 'Points for correct answer' },
        { name: 'correct_answer', type: 'TEXT', description: 'Correct answer or solution' }
      ],
      sampleData: [
        ['uuid23', 'uuid21', 'uuid1', 'What is the difference between let and var?', 'multiple_choice', 2, 10, 'Block scope vs function scope'],
        ['uuid24', 'uuid21', 'uuid1', 'Implement a debounce function', 'code', 4, 25, 'function debounce(func, delay) { ... }']
      ]
    },

    // Hierarchy Definition Service Tables
    'HierarchyDefinition': {
      fields: [
        { name: 'hierarchy_id', type: 'UUID', description: 'Primary key' },
        { name: 'hierarchy_name', type: 'STRING(255)', description: 'Hierarchy name' },
        { name: 'hierarchy_type', type: 'ENUM', description: 'reporting, matrix, functional, geographic' },
        { name: 'description', type: 'TEXT', description: 'Hierarchy description' },
        { name: 'max_depth', type: 'INTEGER', description: 'Maximum hierarchy depth' },
        { name: 'allows_multiple_parents', type: 'BOOLEAN', description: 'Matrix organization support' }
      ],
      sampleData: [
        ['uuid25', 'Corporate Reporting Structure', 'reporting', 'Traditional reporting hierarchy', 8, false],
        ['uuid26', 'Project Matrix', 'matrix', 'Project-based matrix organization', 5, true]
      ]
    },

    'DynamicRole': {
      fields: [
        { name: 'role_id', type: 'UUID', description: 'Primary key' },
        { name: 'role_name', type: 'STRING(255)', description: 'Role name' },
        { name: 'role_description', type: 'TEXT', description: 'Role description' },
        { name: 'permissions', type: 'JSONB', description: 'Role permissions' },
        { name: 'is_system_role', type: 'BOOLEAN', description: 'System-defined role' },
        { name: 'scope_level', type: 'ENUM', description: 'tenant, organization, department, team' }
      ],
      sampleData: [
        ['uuid27', 'HR Manager', 'Human Resources Manager', '{"hr": ["read", "write", "delete"], "employees": ["read", "write"]}', true, 'organization'],
        ['uuid28', 'Team Lead', 'Technical Team Leader', '{"team": ["read", "write"], "projects": ["read", "write"]}', true, 'team']
      ]
    },

    'ContextualPermission': {
      fields: [
        { name: 'permission_id', type: 'UUID', description: 'Primary key' },
        { name: 'permission_name', type: 'STRING(255)', description: 'Permission name' },
        { name: 'resource_type', type: 'STRING(100)', description: 'Resource type' },
        { name: 'action', type: 'STRING(50)', description: 'Action (read, write, delete)' },
        { name: 'context_filter', type: 'JSONB', description: 'Context-based filters' },
        { name: 'scope_level', type: 'ENUM', description: 'tenant, organization, department, team, self' }
      ],
      sampleData: [
        ['uuid29', 'Read Employee Data', 'employee', 'read', '{"department": "same", "reporting": "direct"}', 'department'],
        ['uuid30', 'Manage Leave Requests', 'leave_request', 'write', '{"status": "pending", "approver": "self"}', 'team']
      ]
    },

    // Localization Service Tables
    'Language': {
      fields: [
        { name: 'language_id', type: 'UUID', description: 'Primary key' },
        { name: 'language_code', type: 'STRING(10)', description: 'ISO 639-1 language code' },
        { name: 'language_name_native', type: 'STRING(100)', description: 'Native language name' },
        { name: 'language_name_english', type: 'STRING(100)', description: 'English language name' },
        { name: 'locale_code', type: 'STRING(10)', description: 'Full locale code' },
        { name: 'country_code', type: 'STRING(3)', description: 'ISO country code' },
        { name: 'is_rtl', type: 'BOOLEAN', description: 'Right-to-left text direction' },
        { name: 'is_active', type: 'BOOLEAN', description: 'Available for selection' },
        { name: 'is_default', type: 'BOOLEAN', description: 'Default system language' },
        { name: 'date_format', type: 'STRING(20)', description: 'Preferred date format' },
        { name: 'currency_symbol', type: 'STRING(10)', description: 'Default currency symbol' }
      ],
      sampleData: [
        ['uuid31', 'en', 'English', 'English', 'en-US', 'US', false, true, true, 'MM/DD/YYYY', '$'],
        ['uuid32', 'it', 'Italiano', 'Italian', 'it-IT', 'IT', false, true, false, 'DD/MM/YYYY', '€'],
        ['uuid33', 'fr', 'Français', 'French', 'fr-FR', 'FR', false, true, false, 'DD/MM/YYYY', '€']
      ]
    },

    'TranslationKey': {
      fields: [
        { name: 'key_id', type: 'UUID', description: 'Primary key' },
        { name: 'key_name', type: 'STRING(255)', description: 'Translation key identifier' },
        { name: 'key_category', type: 'STRING(100)', description: 'Category (ui, email, report)' },
        { name: 'description', type: 'TEXT', description: 'Key description' },
        { name: 'default_value', type: 'TEXT', description: 'Default English text' },
        { name: 'context', type: 'STRING(255)', description: 'Usage context' }
      ],
      sampleData: [
        ['uuid34', 'dashboard.welcome', 'ui', 'Welcome message on dashboard', 'Welcome to AI-HRMS', 'dashboard header'],
        ['uuid35', 'employee.add.success', 'ui', 'Success message for adding employee', 'Employee added successfully', 'notification'],
        ['uuid36', 'email.leave.approved', 'email', 'Leave approval email subject', 'Your leave request has been approved', 'email subject']
      ]
    },

    'Translation': {
      fields: [
        { name: 'translation_id', type: 'UUID', description: 'Primary key' },
        { name: 'key_id', type: 'UUID', description: 'Reference to translation_keys' },
        { name: 'language_id', type: 'UUID', description: 'Reference to languages' },
        { name: 'translated_text', type: 'TEXT', description: 'Translated text' },
        { name: 'is_approved', type: 'BOOLEAN', description: 'Translation approved by reviewer' },
        { name: 'translator_notes', type: 'TEXT', description: 'Translator notes' }
      ],
      sampleData: [
        ['uuid37', 'uuid34', 'uuid32', 'Benvenuto in AI-HRMS', true, 'Standard welcome message'],
        ['uuid38', 'uuid34', 'uuid33', 'Bienvenue dans AI-HRMS', true, 'Standard welcome message'],
        ['uuid39', 'uuid35', 'uuid32', 'Dipendente aggiunto con successo', true, 'Success notification']
      ]
    },

    // Reference Data Service Tables
    'ReferenceSource': {
      fields: [
        { name: 'source_id', type: 'UUID', description: 'Primary key' },
        { name: 'source_name', type: 'STRING(255)', description: 'Source name' },
        { name: 'source_type', type: 'ENUM', description: 'government, academic, industry, standards_body' },
        { name: 'description', type: 'TEXT', description: 'Source description' },
        { name: 'url', type: 'STRING(500)', description: 'Source URL' },
        { name: 'country_code', type: 'STRING(3)', description: 'Country of origin' },
        { name: 'language_code', type: 'STRING(10)', description: 'Primary language' },
        { name: 'is_authoritative', type: 'BOOLEAN', description: 'Authoritative source' },
        { name: 'last_updated', type: 'DATE', description: 'Last update date' }
      ],
      sampleData: [
        ['uuid40', 'O*NET Database', 'government', 'US Department of Labor occupational database', 'https://www.onetcenter.org/', 'US', 'en', true, '2024-01-01'],
        ['uuid41', 'European Skills Framework', 'standards_body', 'EU skills classification framework', 'https://ec.europa.eu/social/main.jsp?catId=1326', 'EU', 'en', true, '2023-12-15'],
        ['uuid42', 'ISCO-08 Classification', 'standards_body', 'International Standard Classification of Occupations', 'https://www.ilo.org/public/english/bureau/stat/isco/', 'INT', 'en', true, '2023-11-30']
      ]
    },

    // Template Inheritance Service Table
    'TemplateInheritance': {
      fields: [
        { name: 'inheritance_id', type: 'UUID', description: 'Primary key' },
        { name: 'template_type', type: 'STRING(100)', description: 'Type of template' },
        { name: 'parent_template_id', type: 'UUID', description: 'Parent template reference' },
        { name: 'child_template_id', type: 'UUID', description: 'Child template reference' },
        { name: 'inheritance_rules', type: 'JSONB', description: 'Inheritance rules and overrides' },
        { name: 'is_active', type: 'BOOLEAN', description: 'Inheritance is active' }
      ],
      sampleData: [
        ['uuid43', 'job_description', 'uuid20', 'uuid44', '{"override_fields": ["salary_range"], "inherit_all": true}', true],
        ['uuid44', 'assessment', 'uuid21', 'uuid45', '{"custom_questions": true, "base_scoring": false}', true]
      ]
    }
  };

  // Create sheets for each service table
  for (const [tableName, tableData] of Object.entries(serviceTables)) {
    const worksheet = workbook.addWorksheet(tableName);

    // Set up headers
    const headerRow = ['Field Name', 'Data Type', 'Description'];
    const headers = worksheet.addRow(headerRow);
    headers.font = { bold: true };
    headers.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    // Add field definitions
    tableData.fields.forEach(field => {
      worksheet.addRow([field.name, field.type, field.description]);
    });

    // Add separator row
    const separatorRow = worksheet.addRow(['', '', '']);
    separatorRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCCCCC' }
    };

    // Add sample data header
    const sampleHeader = worksheet.addRow(['SAMPLE DATA', '', '']);
    sampleHeader.font = { bold: true };
    sampleHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFCCCC' }
    };

    // Add sample data column headers
    const dataHeaders = tableData.fields.map(field => field.name);
    const dataHeaderRow = worksheet.addRow(dataHeaders);
    dataHeaderRow.font = { bold: true };
    dataHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF99' }
    };

    // Add sample data rows
    if (tableData.sampleData) {
      tableData.sampleData.forEach(row => {
        worksheet.addRow(row);
      });
    }

    // Auto-size columns
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    });
  }

  // Add summary sheet
  const summarySheet = workbook.addWorksheet('Service Tables Summary');
  const summaryHeaders = ['Table Name', 'Category', 'Purpose', 'Fields Count'];
  const summaryHeaderRow = summarySheet.addRow(summaryHeaders);
  summaryHeaderRow.font = { bold: true };
  summaryHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  summaryHeaderRow.font.color = { argb: 'FFFFFFFF' };

  // Add table categories
  const categories = {
    'Skills Taxonomy': ['SkillsMaster', 'SkillsSynonyms', 'SkillsRelationship', 'IndustrySkills'],
    'Job Architecture': ['JobFamily', 'JobRole', 'JobSkillsRequirement', 'JobDescriptionTemplate'],
    'Assessment Framework': ['Assessment', 'AssessmentQuestion'],
    'Hierarchy Definition': ['HierarchyDefinition', 'DynamicRole', 'ContextualPermission'],
    'Localization': ['Language', 'TranslationKey', 'Translation'],
    'Reference Data': ['ReferenceSource'],
    'Template System': ['TemplateInheritance']
  };

  for (const [category, tables] of Object.entries(categories)) {
    tables.forEach(tableName => {
      if (serviceTables[tableName]) {
        const purpose = getPurpose(tableName);
        summarySheet.addRow([tableName, category, purpose, serviceTables[tableName].fields.length]);
      }
    });
  }

  // Auto-size summary columns
  summarySheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(maxLength + 2, 60);
  });

  // Save the workbook
  const filename = 'dbms-service-tables.xlsx';
  await workbook.xlsx.writeFile(filename);
  console.log(`✅ Excel file created: ${filename}`);
  console.log(`📊 Total service tables: ${Object.keys(serviceTables).length}`);

  return filename;
}

function getPurpose(tableName) {
  const purposes = {
    'SkillsMaster': 'Master catalog of all skills with standardized definitions',
    'SkillsSynonyms': 'Alternative names and aliases for skills',
    'SkillsRelationship': 'Relationships between skills (prerequisites, complements)',
    'IndustrySkills': 'Industry-specific skill mappings and relevance',
    'JobFamily': 'High-level job family classifications',
    'JobRole': 'Specific job roles within families',
    'JobSkillsRequirement': 'Skill requirements for job roles',
    'JobDescriptionTemplate': 'Standardized job description templates',
    'Assessment': 'Assessment templates and frameworks',
    'AssessmentQuestion': 'Question bank for assessments',
    'HierarchyDefinition': 'Organizational hierarchy type definitions',
    'DynamicRole': 'Reusable role definitions across organizations',
    'ContextualPermission': 'Context-based permission templates',
    'Language': 'Supported languages and localization settings',
    'TranslationKey': 'Translation keys for internationalization',
    'Translation': 'Actual translations for each language',
    'ReferenceSource': 'External data sources and references',
    'TemplateInheritance': 'Template inheritance rules and relationships'
  };
  return purposes[tableName] || 'Service table for system configuration';
}

// Run the function
createServiceTablesExcel().catch(console.error);