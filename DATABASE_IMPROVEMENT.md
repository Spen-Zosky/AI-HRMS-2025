# DATABASE IMPROVEMENT PLAN

This document defines the database improvements and structural changes required for your HR/Skills platform. It includes the full migration plan, new tables, relationships, seed data, and operational guidelines. It also contains instructions to enable **multilingual support (Italian, English, French, Spanish)** across the database, application, and user interfaces.

---

## 1. Objectives
- Transition from current ENUM-based `skill_type` to a **canonical taxonomy of six categories**:
  - Core, Hard, Soft, Life, Transversal, Capability
- Enhance **job/industry → skills mapping**
- Enable **multilingual support** for all data and user interfaces
- Add **versioning, synonyms, relationships, and AI-ready embeddings**
- Preserve **backward compatibility** (no breaking changes)

---

## 2. New Database Structures

### 2.1 Skill Categories
```sql
CREATE TABLE skill_categories (
  category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code VARCHAR(40) UNIQUE NOT NULL, -- core, hard, soft, life, transversal, capability
  category_name VARCHAR(80) NOT NULL,
  description TEXT
);

CREATE TABLE skills_category_map (
  skill_id UUID NOT NULL REFERENCES skills_master(skill_id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES skill_categories(category_id) ON DELETE RESTRICT,
  PRIMARY KEY (skill_id)
);
```

### 2.2 Unified View
```sql
CREATE OR REPLACE VIEW v_skills AS
SELECT s.skill_id, s.skill_name, s.skill_description,
       c.category_code AS category,
       s.source_taxonomy, s.skill_level, s.is_emerging, s.version
FROM skills_master s
JOIN skills_category_map m ON m.skill_id = s.skill_id
JOIN skill_categories c ON c.category_id = m.category_id;
```

---

## 3. Job and Industry Enhancements
```sql
ALTER TABLE job_skills_requirements
  ADD COLUMN evidence_type VARCHAR(60),
  ADD COLUMN certification_code VARCHAR(120),
  ADD COLUMN standard_ref VARCHAR(120);

ALTER TABLE industry_skills
  ADD COLUMN recommended_level VARCHAR(40),
  ADD COLUMN mobility_score FLOAT DEFAULT 0.0;

ALTER TABLE job_description_templates
  ADD COLUMN sections JSONB;
```

---

## 4. Multilingual Support

### 4.1 Skills Multilingual Table
```sql
CREATE TABLE skills_i18n (
  skill_id UUID REFERENCES skills_master(skill_id) ON DELETE CASCADE,
  lang_code VARCHAR(10) NOT NULL, -- it, en, fr, es
  display_name VARCHAR(255),
  description TEXT,
  PRIMARY KEY (skill_id, lang_code)
);
```

### 4.2 Application Multilingual Guidelines
- Store all **display text and labels** in JSON resource files (per language).
- Database stores **data translations** (skills, job roles, industries).
- Frontend/UI loads translations dynamically based on `lang_code`.
- Languages supported:  
  - `it` = Italian  
  - `en` = English  
  - `fr` = French  
  - `es` = Spanish  

Use **i18n frameworks**:
- **Frontend Web**: Next.js i18next or react-intl
- **Backend**: Node.js `i18next` middleware
- **Database**: `skills_i18n` + `jobs_i18n` + `industries_i18n` (extend same pattern)

**Rule:** Every entity with user-facing names/descriptions must have an `*_i18n` table.

---

## 5. Versioning and Synonyms

```sql
ALTER TABLE skills_synonyms
  ADD COLUMN is_preferred BOOLEAN DEFAULT false;

ALTER TABLE skills_relationships
  ADD COLUMN direction VARCHAR(10) DEFAULT 'forward',
  ADD COLUMN rationale TEXT;

CREATE TABLE skills_changelog (
  change_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills_master(skill_id) ON DELETE CASCADE,
  version_from VARCHAR(50),
  version_to VARCHAR(50),
  change_notes TEXT,
  changed_at TIMESTAMP DEFAULT now(),
  changed_by UUID NULL REFERENCES users(id)
);
```

---

## 6. AI Readiness (Embeddings and Search)

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE skills_master
  ADD COLUMN embedding vector(768),
  ADD COLUMN popularity_score FLOAT DEFAULT 0.0;

CREATE INDEX idx_skills_embedding ON skills_master USING ivfflat (embedding);
CREATE INDEX idx_skills_popularity ON skills_master(popularity_score DESC);
CREATE INDEX idx_skills_cat_map_cat ON skills_category_map(category_id);
CREATE INDEX idx_industry_skills_skill ON industry_skills(skill_id);
CREATE INDEX idx_job_req_role ON job_skills_requirements(role_id);
CREATE INDEX idx_job_req_skill ON job_skills_requirements(skill_id);
```

---

## 7. Migration Seeds

### 7.1 Insert Canonical Categories
```sql
INSERT INTO skill_categories (category_code, category_name) VALUES
('core','Core skills'),
('hard','Hard skills'),
('soft','Soft skills'),
('life','Life skills'),
('transversal','Transversal skills'),
('capability','Capability');
```

### 7.2 Backfill Skills
```sql
WITH cat AS (SELECT category_id, category_code FROM skill_categories),
src AS (
  SELECT s.skill_id,
         CASE
           WHEN s.skill_type='technical' THEN 'hard'
           WHEN s.skill_type='soft'      THEN 'soft'
           WHEN s.skill_type='leadership'THEN 'capability'
           WHEN s.skill_type='business'  THEN 'transversal'
           WHEN s.skill_type='digital'   THEN
             CASE WHEN lower(s.skill_name) IN ('digital literacy','alfabetizzazione digitale')
                  THEN 'core' ELSE 'hard' END
           ELSE 'transversal'
         END AS target_cat
  FROM skills_master s
)
INSERT INTO skills_category_map (skill_id, category_id)
SELECT src.skill_id, cat.category_id
FROM src
JOIN cat ON cat.category_code = src.target_cat
ON CONFLICT (skill_id) DO NOTHING;
```

---

## 8. Multilingual Enforcement Strategy

- **Step 1**: Add `_i18n` tables for all user-facing entities:
  - `skills_i18n`
  - `job_roles_i18n`
  - `industries_i18n`
- **Step 2**: Populate these tables with translations (IT, EN, FR, ES).
- **Step 3**: Modify backend queries to always JOIN on `_i18n` filtered by user’s `lang_code`.
- **Step 4**: UI and APIs must expose language selector and request-specific `lang_code`.

---

## 9. Migration Execution Order
1. Run all migrations (`001` → `005`).
2. Run seeders (`101` → `102`).
3. Validate `v_skills` view.
4. Populate i18n tables with translations.
5. Update API and UI to use `lang_code`.

---

## 10. Future-Proofing
- Deprecate ENUM `skill_type` after migration is complete.
- Build import scripts for external datasets (ESCO, O*NET, SFIA).
- Enable AI-driven updates:
  - Extract new skills from job postings
  - Insert into `skills_master` + `skills_category_map`
  - Auto-translate into `*_i18n` tables

---

# Conclusion
This plan upgrades the database to support:
- Canonical six-category taxonomy
- Full multilingual capability (IT, EN, FR, ES)
- Advanced AI/embedding search
- Structured job/industry relationships
- Backward compatibility with legacy data
