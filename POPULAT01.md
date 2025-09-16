# POPULAT01 — DATA POPULATION PLAYBOOK (JSON → PostgreSQL)

This document provides **end-to-end, idempotent, transaction-safe instructions** to populate your PostgreSQL database with the dataset contained in **`Skills_DB_Tranche1.json`** (first tranche: 4 industries, 80 roles, bilingual JDs, 15-skill mapping/role). It is designed to be passed directly to a coding AI agent.

> This playbook assumes you have already applied the schema upgrades described in `DATABASE_IMPROVEMENT.md` (six-category taxonomy, i18n tables/sections, embeddings, etc.).

---

## 0) Scope & Outcomes

**Goal:** Import the JSON dataset into the database while preserving referential integrity and avoiding duplicates.

**Entities included:**
- `industries`
- `skill_categories` (seed if missing)
- `skills_master` + `skills_category_map`
- `roles` + bilingual JD sections (EN/IT) via `job_description_templates.sections` (JSONB) or `roles_i18n`
- bridge `role_skill_map`
- `reference_sources`

**Outcome:** A JSON report summarizing inserted/updated/skipped counts per table.

---

## 1) Prerequisites

- **Database:** PostgreSQL 12+
- **Extensions:** `pgcrypto` (UUID generation), `vector` (for embeddings — not required by this import but available)
- **Schema:** Up-to-date per `DATABASE_IMPROVEMENT.md`
- **Files available:**
  - `Skills_DB_Tranche1.json` (main import source)
  - *(Optional)* `Skills_DB_Tranche1.xlsx` (human-readable mirror)

**Connection Inputs (suggested env vars):**
```
PGHOST=...
PGPORT=5432
PGDATABASE=...
PGUSER=...
PGPASSWORD=...
```

---

## 2) Input JSON Structure

`Skills_DB_Tranche1.json` contains:
```json
{
  "industries": [{ "industry_code": "TECH_FIN", "industry_name": "Technology & FinTech" }, ...],
  "roles": [{
    "industry_code": "TECH_FIN",
    "role_title": "Software Engineer",
    "jd_responsibilities_en": "...bullet list...",
    "jd_responsibilities_it": "...elenco puntato...",
    "jd_requirements_en": "...",
    "jd_requirements_it": "...",
    "tools_en": "Git, Docker, ...",
    "tools_it": "Git, Docker, ...",
    "source_hints": "ESCO; O*NET; SFIA"
  }, ...],
  "skills": [{
    "skill_name": "Critical thinking",
    "skill_description": "Core skill applicable across industries.",
    "category": "Core",
    "industry_scope": "generic"
  }, ...],
  "role_skill_map": [{
    "industry_code": "TECH_FIN",
    "role_title": "Software Engineer",
    "skill_name": "Python programming",
    "category": "Hard",
    "expected_level": "advanced"
  }, ...],
  "sources": [{ "source_key": "ESCO", "description": "EU Occupations/Skills (multilingual)", "url": "https://esco.ec.europa.eu/" }],
  "meta": { "version": "tranche1-1.0", "notes": "80 roles across 4 industries..." }
}
```

**Canonical categories**: `core`, `hard`, `soft`, `life`, `transversal`, `capability` (case-insensitive).

---

## 3) Natural Keys & Idempotency Rules

Use **upsert** logic with natural keys to make the process **idempotent**:

- **Industries:** unique by `industry_code`
- **Skill Categories:** unique by `category_code` (seed 6 canonical codes)
- **Skills:** unique by `skill_name` (normalized, case-insensitive)
- **Roles:** unique composite `(role_title, industry_id)`
- **Role ↔ Skill:** unique composite `(role_id, skill_id)`
- **Sources:** unique by `source_key`

---

## 4) Import Order & Transactions

Execute each stage in its **own transaction**. If any step fails, **rollback** that step and report the error.

**Order:**
1. `industries`
2. `skill_categories` (seed if not present)
3. `skills_master` + `skills_category_map`
4. `roles` + JD sections (JSONB) bilingual EN/IT
5. `role_skill_map`
6. `reference_sources`

---

## 5) Validation Rules

- Reject if `category` is not one of the six canonical codes (case-insensitive).
- Reject a `role` if its `industry_code` doesn’t exist.
- Reject a `role_skill_map` record if either `role` or `skill` cannot be resolved.
- Log category mismatches between `role_skill_map.category` and the `skills_category_map` for that `skill`.
- Normalize strings (trim spaces, collapse repeated whitespace).

---

## 6) SQL Templates (UPSERT)

> Adapt table/column names if your actual schema differs.

### 6.1 Industries
```sql
INSERT INTO industries (industry_id, industry_code, industry_name)
VALUES (gen_random_uuid(), :code, :name)
ON CONFLICT (industry_code)
DO UPDATE SET industry_name = EXCLUDED.industry_name
RETURNING industry_id;
```

### 6.2 Skill Categories (Seed 6 codes)
```sql
INSERT INTO skill_categories (category_id, category_code, category_name)
VALUES (gen_random_uuid(), :code, INITCAP(:code))
ON CONFLICT (category_code) DO NOTHING
RETURNING category_id;
```

### 6.3 Skills + Category Map
```sql
-- Resolve category_id from skill_categories by :category_code (lowercased)
WITH ins AS (
  INSERT INTO skills_master (skill_id, skill_name, skill_description, source_taxonomy, version, is_emerging)
  VALUES (gen_random_uuid(), :skill_name, :skill_description, :source_taxonomy, :version, false)
  ON CONFLICT (skill_name)
  DO UPDATE SET skill_description = EXCLUDED.skill_description
  RETURNING skill_id
)
INSERT INTO skills_category_map (skill_id, category_id)
SELECT ins.skill_id, :category_id
FROM ins
ON CONFLICT (skill_id) DO UPDATE SET category_id = EXCLUDED.category_id;
```

### 6.4 Roles + Bilingual JD Sections
```sql
-- 1) Resolve industry_id by :industry_code
-- 2) Upsert role
WITH ind AS (
  SELECT industry_id FROM industries WHERE industry_code = :industry_code
),
ins AS (
  INSERT INTO roles (role_id, role_title, industry_id, source_hints)
  SELECT gen_random_uuid(), :role_title, ind.industry_id, :source_hints FROM ind
  ON CONFLICT (role_title, industry_id)
  DO UPDATE SET source_hints = EXCLUDED.source_hints
  RETURNING role_id
)
-- 3) Upsert JD sections JSONB (bilingual)
INSERT INTO job_description_templates (template_id, role_id, sections)
SELECT gen_random_uuid(), ins.role_id,
       jsonb_build_object(
         'en', jsonb_build_object(
           'responsibilities', to_jsonb(:jd_resp_en::text),
           'requirements',     to_jsonb(:jd_req_en::text),
           'tools',            to_jsonb(:tools_en::text)
         ),
         'it', jsonb_build_object(
           'responsibilities', to_jsonb(:jd_resp_it::text),
           'requirements',     to_jsonb(:jd_req_it::text),
           'tools',            to_jsonb(:tools_it::text)
         )
       )
FROM ins
ON CONFLICT (role_id)
DO UPDATE SET sections = EXCLUDED.sections;
```

> If you maintain dedicated `roles_i18n`, insert there instead/as well using `(role_id, lang_code, title, responsibilities, requirements, tools)`.

### 6.5 Role ↔ Skill Map
```sql
WITH r AS (
  SELECT r.role_id
  FROM roles r
  JOIN industries i ON i.industry_id = r.industry_id
  WHERE r.role_title = :role_title AND i.industry_code = :industry_code
),
s AS (
  SELECT s.skill_id
  FROM skills_master s
  WHERE s.skill_name = :skill_name
)
INSERT INTO role_skill_map (role_id, skill_id, expected_level)
SELECT r.role_id, s.skill_id, :level
FROM r, s
ON CONFLICT (role_id, skill_id)
DO UPDATE SET expected_level = EXCLUDED.expected_level;
```

### 6.6 Reference Sources
```sql
INSERT INTO reference_sources (source_id, source_key, description, url)
VALUES (gen_random_uuid(), :key, :desc, :url)
ON CONFLICT (source_key)
DO UPDATE SET description = EXCLUDED.description, url = EXCLUDED.url;
```

---

## 7) Algorithm (Pseudocode)

```pseudo
LOAD json = Skills_DB_Tranche1.json

BEGIN TRANSACTION
  FOR each industry IN json.industries:
    upsertIndustry(industry_code, industry_name)
COMMIT

BEGIN TRANSACTION
  SEED categories = [core, hard, soft, life, transversal, capability]
  FOR each category IN categories:
    upsertCategory(category_code=lower(category))
COMMIT

BEGIN TRANSACTION
  FOR each skill IN json.skills:
    category_id = findCategoryId(lower(skill.category))
    upsertSkill(skill_name, skill_description, source_taxonomy="ESCO/O*NET (tranche1)", version=json.meta.version)
    mapSkillToCategory(skill_id, category_id)
    -- optional i18n: insert into skills_i18n for 'en' and 'it'
COMMIT

BEGIN TRANSACTION
  FOR each role IN json.roles:
    industry_id = findIndustryId(role.industry_code)
    upsertRole(role_title, industry_id, source_hints)
    sections = buildSectionsJSONB(role.jd_responsibilities_en, role.jd_requirements_en, role.tools_en,
                                  role.jd_responsibilities_it, role.jd_requirements_it, role.tools_it)
    upsertRoleSections(role_id, sections)
COMMIT

BEGIN TRANSACTION
  FOR each link IN json.role_skill_map:
    role_id = findRoleId(link.role_title, link.industry_code)
    skill_id = findSkillId(link.skill_name)
    assert(categoryOf(skill_id) == lower(link.category))  -- warn if mismatch
    upsertRoleSkill(role_id, skill_id, link.expected_level)
COMMIT

BEGIN TRANSACTION
  FOR each src IN json.sources:
    upsertSource(src.key, src.description, src.url)
COMMIT

RETURN usageReport()
```

---

## 8) Reporting

Produce a final **JSON report** like:
```json
{
  "result": "ok",
  "counts": {
    "industries": {"inserted": 4, "updated": 0, "skipped": 0},
    "skill_categories": {"inserted": 6, "updated": 0},
    "skills_master": {"inserted": X, "updated": Y},
    "skills_category_map": {"upserted": X},
    "roles": {"inserted": 80, "updated": 0},
    "job_description_templates": {"upserted": 80},
    "role_skill_map": {"upserted": ~1200},
    "reference_sources": {"upserted": 4}
  },
  "warnings": [
    "2 skills had category mismatches and were skipped",
    "3 role_skill_map entries referenced unknown skills"
  ]
}
```

---

## 9) Error Handling & Recovery

- On any **SQL error**, rollback the current transaction and log the failing payload.
- Continue with the next entity type unless **foreign key dependencies** are broken (stop and return error).
- Provide a **retry plan**: re-run idempotent upserts after fixing payload.

---

## 10) Performance Notes

- Batch upserts in chunks of 500–1000 records.
- Use prepared statements and parameterized SQL.
- Create indexes if missing:
  - `skills_master(skill_name)` unique
  - `roles(role_title, industry_id)` unique
  - `skill_categories(category_code)` unique
  - Foreign key indexes on `role_skill_map(role_id)` and `(skill_id)`

---

## 11) Optional: Python Loader Skeleton (psycopg)

```python
import json, psycopg
from psycopg.rows import dict_row

with open("Skills_DB_Tranche1.json", "r", encoding="utf-8") as f:
    data = json.load(f)

conn = psycopg.connect("postgresql://USER:PASS@HOST:5432/DB", autocommit=False, row_factory=dict_row)

def upsert_industry(cur, code, name):
    cur.execute("""
        INSERT INTO industries (industry_id, industry_code, industry_name)
        VALUES (gen_random_uuid(), %s, %s)
        ON CONFLICT (industry_code) DO UPDATE SET industry_name = EXCLUDED.industry_name
        RETURNING industry_id;
    \"", (code, name))
    return cur.fetchone()["industry_id"]

# Implement the rest following the SQL templates above...
# Wrap each stage in try/except with conn.rollback()/conn.commit().
```

---

## 12) Optional: Node.js Loader Skeleton (Sequelize/pg)

```js
// Pseudocode — implement upserts with parameterized queries and transactions
const fs = require('fs');
const { Client } = require('pg');

const json = JSON.parse(fs.readFileSync('Skills_DB_Tranche1.json', 'utf8'));
const client = new Client({ connectionString: process.env.DATABASE_URL });

(async () => {
  await client.connect();
  try {
    await client.query('BEGIN');
    for (const ind of json.industries) {
      await client.query(\`
        INSERT INTO industries (industry_id, industry_code, industry_name)
        VALUES (gen_random_uuid(), $1, $2)
        ON CONFLICT (industry_code) DO UPDATE SET industry_name = EXCLUDED.industry_name;\`, [ind.industry_code, ind.industry_name]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK'); throw e;
  }
  // Repeat for categories, skills, roles (+sections), mapping, sources
  await client.end();
})();
```

---

## 13) i18n Considerations

- This tranche provides **EN/IT** JD content. Store it in:
  - `job_description_templates.sections` JSONB (preferred) **or**
  - `roles_i18n` if you maintain a dedicated i18n table (one row per `lang_code`).  
- For skills: duplicate the English description into `skills_i18n` for `en` and `it` if you want immediate UI availability (replace later with human translations).

---

## 14) Dry-Run Mode (Optional)

Implement a **dry-run flag**: parse JSON, resolve keys, and simulate upsert counts without writing to DB. Helps validate mappings before first load.

---

## 15) Deliverables

- Import engine executing Sections **4–8** exactly as defined.
- JSON report written to stdout (and optionally stored in a table `import_logs`).

> End of POPULAT01.
