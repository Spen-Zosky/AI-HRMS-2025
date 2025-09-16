
# POPULAT05 — Autonomous Data Population Playbook (DemoTenant)

This playbook instructs your coding AI agent to **fully and automatically** populate the database
from the four company Excel workbooks you received earlier, under a **single tenant** named **DemoTenant**.
It is **idempotent** (safe to re-run) and **multi‑language ready** (EN/IT/FR/ES).

> Files to import (produced earlier in this session):
> - `FinNova_Org_JD_Skills.xlsx`
> - `BioNova_Org_JD_Skills.xlsx`
> - `EcoNova_Org_JD_Skills.xlsx`
> - `BankNova_Org_JD_Skills.xlsx`

---

## 0) Assumptions

- Schema already defined (industries, job_roles, job_roles_i18n, skills_master, skills_i18n,
  skill_categories, skills_category_map, job_skill_requirements, users, employees, etc.).
- PostgreSQL with `uuid-ossp` and `pgcrypto` extensions available.
- Row‑Level Security (RLS) by `tenant_id` is enabled.
- Language codes: `en`, `it`, `fr`, `es`.

---

## 1) Tenant and Users

Create DemoTenant and bootstrap accounts:

- **TenAdmin** — `tenadmin@demotenant.org`, passw: `tenadmin123!`, role: `tenant_super_admin`
- **TenUser** — `tenuser@demotenant.org`, passw: `tenuser123!`, role: `tenant_readonly`
- Each company employee user:
  - email: `[name].[surname]@[company].org` (lowercase, spaces removed)
  - password: `[name][surname]123!`
  - CEOs: role `company_ceo_readonly` (read all, no write)
  - Others: role `employee_default`

SQL excerpt:
```sql
INSERT INTO tenants (tenant_id, name, code, is_active)
VALUES (COALESCE((SELECT tenant_id FROM tenants WHERE code='DEMO'), uuid_generate_v4()), 'DemoTenant', 'DEMO', true)
ON CONFLICT (code) DO UPDATE SET is_active = true;

WITH t AS (SELECT tenant_id FROM tenants WHERE code='DEMO')
INSERT INTO users (user_id, tenant_id, email, display_name, password_hash, is_active, role)
SELECT uuid_generate_v4(), t.tenant_id, 'tenadmin@demotenant.org', 'TenAdmin',
       crypt('tenadmin123!', gen_salt('bf')), true, 'tenant_super_admin'
FROM t
ON CONFLICT (tenant_id, email) DO UPDATE
  SET display_name='TenAdmin', is_active=true, role='tenant_super_admin';
```

(Repeat for TenUser and employee generation.)

---

## 2) Staging Tables

```sql
DROP TABLE IF EXISTS stg_organigramma;
DROP TABLE IF EXISTS stg_job_descriptions;
DROP TABLE IF EXISTS stg_skills;

CREATE TABLE stg_organigramma (
  company   text,
  surname   text,
  name      text,
  role      text,
  location  text
);

CREATE TABLE stg_job_descriptions (
  company   text,
  role      text,
  en_responsibilities text,
  en_requirements     text,
  it_responsibilities text,
  it_requirements     text,
  fr_responsibilities text,
  fr_requirements     text,
  es_responsibilities text,
  es_requirements     text
);

CREATE TABLE stg_skills (
  company   text,
  role      text,
  category  text,
  skill     text
);
```

---

## 3) Import XLSX → Staging

For each workbook (FinNova, BioNova, EcoNova, BankNova) export sheets as CSV and load:

```sql
\copy stg_organigramma FROM 'FinNova_Organigramma.csv' CSV HEADER
\copy stg_job_descriptions FROM 'FinNova_JD.csv' CSV HEADER
\copy stg_skills FROM 'FinNova_Skills.csv' CSV HEADER
```

Repeat for the other companies.

---

## 4) Normalize to Master Tables

- Insert/Update **companies** and **locations**
- Insert/Update **job_roles** and **job_roles_i18n (EN/IT/FR/ES)**, fallback to EN if missing
- Insert/Update **skills_master**, **skills_category_map**, **skills_i18n**
- Insert **job_skill_requirements** from Skills staging

Example (Job Roles i18n EN):

```sql
INSERT INTO job_roles_i18n (translation_id, role_id, language_code, role_title, responsibilities, requirements)
SELECT uuid_generate_v4(), jr.role_id, 'en', jd.role, jd.en_responsibilities, jd.en_requirements
FROM stg_job_descriptions jd
JOIN job_roles jr ON jr.role_title = jd.role
JOIN tenants t    ON t.code='DEMO' AND jr.tenant_id = t.tenant_id
ON CONFLICT (role_id, language_code)
DO UPDATE SET responsibilities=EXCLUDED.responsibilities, requirements=EXCLUDED.requirements;
```

---

## 5) Employees and Users

From `stg_organigramma`:

```sql
WITH t AS (SELECT tenant_id FROM tenants WHERE code='DEMO')
INSERT INTO employees (employee_id, tenant_id, first_name, last_name, position, is_active)
SELECT uuid_generate_v4(), t.tenant_id, o.name, o.surname, o.role, true
FROM stg_organigramma o, t
ON CONFLICT DO NOTHING;

WITH t AS (SELECT tenant_id FROM tenants WHERE code='DEMO')
INSERT INTO users (user_id, tenant_id, email, display_name, password_hash, is_active, role)
SELECT uuid_generate_v4(), t.tenant_id,
       LOWER(o.name || '.' || o.surname || '@' || LOWER(o.company) || '.org'),
       INITCAP(o.name || ' ' || o.surname),
       crypt(LOWER(o.name||o.surname)||'123!', gen_salt('bf')),
       true,
       CASE WHEN o.role ILIKE '%CEO%' THEN 'company_ceo_readonly' ELSE 'employee_default' END
FROM stg_organigramma o, t
ON CONFLICT (tenant_id, email) DO UPDATE SET is_active = true;
```

---

## 6) Validation Checks

```sql
-- Roles without EN translation
SELECT jr.role_title FROM job_roles jr
LEFT JOIN job_roles_i18n jri ON jri.role_id=jr.role_id AND jri.language_code='en'
WHERE jri.role_id IS NULL;

-- Skills without category
SELECT sm.skill_name FROM skills_master sm
LEFT JOIN skills_category_map m ON m.skill_id=sm.skill_id
WHERE m.skill_id IS NULL;

-- Users per company
SELECT c.name, COUNT(*) FROM users u
JOIN employees e ON u.display_name = INITCAP(e.first_name||' '||e.last_name)
JOIN companies c ON c.company_id = e.company_id
GROUP BY 1;
```

---

## 7) Execution Order

1. Enable extensions
2. Create staging tables
3. Insert DemoTenant + TenAdmin + TenUser
4. Insert industries (TECH_FIN, FOOD_BIO, CLIMATE, BANK)
5. Import XLSX → staging
6. Normalize staging → master tables
7. Create employees and users
8. Assign roles (ceo_readonly, employee_default)
9. Run validation checks

---

## 8) Final JSON Summary (example)

```json
{
  "tenant": "DemoTenant",
  "users": {
    "super_admin": "tenadmin@demotenant.org",
    "readonly": "tenuser@demotenant.org",
    "company_accounts_created": 120
  },
  "import": {
    "companies": 4,
    "roles_upserted": 80,
    "skills_upserted": 350,
    "role_skill_mappings": 1200
  },
  "i18n": ["en","it","fr","es"],
  "status": "ok"
}
```

---

## Notes

- Placeholders: use `N/A` when source values are missing
- Passwords here are demo‑grade
- CEOs: read‑only across tenant
- Idempotent: re-run without duplication
