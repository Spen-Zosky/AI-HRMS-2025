# POPULAT02 — DATA POPULATION PLAYBOOK (JSON → PostgreSQL)

This playbook defines how to import the **Tranche 2 dataset** (`Skills_DB_Tranche2.json`) into the database.

## Scope
- Industries: 6 (Insurance, Logistics, Services, EPC/Ecology & Environment, E-Commerce, GDO)
- Roles: 120 (20 per industry)
- Bilingual JDs (EN/IT)
- Skills taxonomy with 6 canonical categories
- Role-Skill mappings (~1200+)
- Sources: ESCO, O*NET

## Procedure
Follow the same rules as POPULAT01 (idempotent UPSERTs, transactions per entity, JSONB storage for bilingual JD sections).

### Import Order
1. industries
2. skill_categories (seed if missing)
3. skills_master + skills_category_map
4. roles + job_description_templates (sections EN/IT)
5. role_skill_map
6. reference_sources

### Validation Rules
- Reject records with unknown category or industry_code
- Ensure category consistency in role_skill_map
- Normalize strings (trimmed, lowercased codes)
- Log duplicates and mismatches

### Expected Output
```json
{
  "result": "ok",
  "counts": {
    "industries": {"inserted": 6, "updated": 0},
    "skills_master": {"inserted": X, "updated": Y},
    "roles": {"inserted": 120, "updated": 0},
    "role_skill_map": {"upserted": ~1200}
  }
}
```

> End of POPULAT02.
