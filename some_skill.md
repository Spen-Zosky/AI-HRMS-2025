# Core Skills Tables - Sample Data

This document shows the first 5 rows from each of the 10 core skills tables in the AI-HRMS-2025 database.

## 1. skl_skills_master (369 records)
Master skills catalog with comprehensive skill definitions.

| skill_id | skill_name | skill_code | skill_description | skill_type | source_taxonomy |
|----------|------------|------------|-------------------|------------|-----------------|
| bec3c7c8-9ce6-481a-8e3a-7c458c18a34d | AI and machine learning | AIANDMACHINELEARNING | AI and machine learning - identified as a key skill in WEF Future of Jobs 2023 | technical | WEF Future of Jobs 2023 |
| 89dd038b-ca6a-4f9e-b13e-058d588cad82 | API design | api_design | Hard skill | technical | ESCO/O*NET (tranche1) |
| 7a9e71a5-6780-49ad-9927-3aaee3d36f0d | API development | APIDEVELOPMENT | API development - identified as a key skill in WEF Future of Jobs 2023 | soft | WEF Future of Jobs 2023 |
| f38992b2-8c01-4f7b-becd-9aaf7fee8a73 | Academic writing | ACADEMICWRITING | Academic writing - skill from ESCO European classification | soft | ESCO Classification |
| 43486bd2-b17f-4b93-9163-1898594f32e0 | Accounting principles | ACCOUNTINGPRINCIPLES | Accounting principles - occupational skill from O*NET database | soft | O*NET Database |

## 2. skl_skills_category_map (110 records)
Maps skills to their categories for organizational purposes.

| skill_id | category_id | created_at |
|----------|-------------|------------|
| 003dc2d4-7c9c-42c3-b0b6-ec903f954aa3 | f45b8ee3-1971-4590-9336-37a09d6e5893 | 2025-09-15T18:08:45.316Z |
| 04640b84-82f4-4623-be53-5c604d625e3c | bd899b9f-ecd9-49e7-af0b-7f9f8f72d9bb | 2025-09-15T18:08:45.316Z |
| 055b92d3-25e3-45da-b31d-57a02bd683dc | 94c761bb-f149-414d-9e46-b095e1f995e0 | 2025-09-15T18:08:45.316Z |
| 06515050-d144-46dd-b1b4-5ece619dd05f | bd899b9f-ecd9-49e7-af0b-7f9f8f72d9bb | 2025-09-15T18:08:45.316Z |
| 096d4b80-467e-4d2d-87d4-586a898c453b | 134c3f2a-b34f-4a38-90f0-0090b39bc99e | 2025-09-15T18:08:45.316Z |

## 3. skl_skills_synonyms (35 records)
Skill aliases and alternative names to improve search and matching.

| synonym_id | skill_id | synonym_text | language_code | confidence_score | source_type | source_key |
|------------|----------|--------------|---------------|------------------|-------------|------------|
| 005dc2d7-125e-4f4d-be34-26ee634cb886 | 85bf0296-4054-4b00-9e9a-9be517845931 | Project Coordination | en | 0.95 | manual | ONET_SYNONYMS |
| 1937d205-4f8c-4864-8168-f78c3136957b | 3b717635-80d0-4fa6-b149-5fa777d80cee | Oral Communication | en | 0.95 | manual | ONET_SYNONYMS |
| 1a8fe69b-334d-4a61-8d62-ab66f8fe338d | 88b18c8b-a507-4d31-9c3d-caf189da5136 | Content Writing | en | 0.95 | manual | ONET_SYNONYMS |
| 1d52e74a-b652-4615-8e5f-c37d9631cc1d | 3b717635-80d0-4fa6-b149-5fa777d80cee | Public Speaking | en | 0.95 | manual | ONET_SYNONYMS |
| 1d78d1f5-d545-49b0-933a-5b2314f03e27 | 14a136af-971a-4ac8-9cf4-caca8293162e | Data Analysis | en | 0.95 | manual | ONET_SYNONYMS |

## 4. skl_job_skills_requirements (30 records)
Defines skill requirements for specific job roles with importance levels.

| requirement_id | role_id | skill_id | required_level | importance | can_be_learned | weight |
|----------------|---------|----------|----------------|------------|----------------|--------|
| 0ece6dbb-6030-4d9d-a085-e545515d2f6d | 0b4b5f58-6f04-4007-b60a-4698aec821c8 | 5ce4087c-c89b-4fae-b40b-895c944d17b6 | 4 | important | true | 1.00 |
| 15cf557f-4db2-49b9-9de3-43a209ad6d84 | b6de834e-b640-473e-8650-092f1cfbbee1 | 12a9148c-7070-4a78-96a4-f4aab4fd2a8c | 5 | essential | true | 1.00 |
| 16191b86-cf06-499b-a1ae-2ca4bc4761af | 0b4b5f58-6f04-4007-b60a-4698aec821c8 | e4ed75b2-2565-41e0-978a-70fcc3797890 | 3 | nice_to_have | true | 1.00 |
| 18b5fe36-5056-4a8c-814b-8746e182633f | b6de834e-b640-473e-8650-092f1cfbbee1 | aa6e2f48-d970-4952-afe6-e244b4870a79 | 5 | essential | true | 1.00 |
| 2da88052-0e05-4c27-bd21-394190eaee12 | 0b4b5f58-6f04-4007-b60a-4698aec821c8 | 442df86f-5fd7-4553-bc86-cd6871ebb0aa | 4 | important | true | 1.00 |

## 5. skl_industry_skills (18 records)
Industry-specific skill mappings with market data and salary premiums.

| mapping_id | skill_id | industry_code | industry_name | importance_score | prevalence | salary_premium | future_demand |
|------------|----------|---------------|---------------|------------------|------------|----------------|---------------|
| 16b3c7d5-f722-452e-903b-9dec8b14bf21 | aa6e2f48-d970-4952-afe6-e244b4870a79 | NAICS_54 | Professional, Scientific, and Technical Services | 4.50 | 92.10 | 15.20 | growing |
| 5938d2ef-cb26-4ecd-ab04-909cd53897c7 | 5ce4087c-c89b-4fae-b40b-895c944d17b6 | NAICS_52 | Finance and Insurance | 4.40 | 76.80 | 19.50 | growing |
| 5a65f8e9-8ed3-4bce-aee2-6bde437ab0ca | 14a136af-971a-4ac8-9cf4-caca8293162e | NAICS_52 | Finance and Insurance | 4.70 | 88.50 | 22.30 | growing |
| 65bbeddd-3c8f-4cfb-ac98-e9d23da5790a | 14a136af-971a-4ac8-9cf4-caca8293162e | NAICS_54 | Professional, Scientific, and Technical Services | 4.30 | 78.50 | 18.30 | growing |
| 697215c8-5f01-4a85-b81b-251385043463 | e4ed75b2-2565-41e0-978a-70fcc3797890 | NAICS_62 | Health Care and Social Assistance | 4.60 | 98.20 | 12.30 | growing |

## 6. skl_skills_relationships (10 records)
Defines relationships between skills (prerequisite, complementary, builds_on).

| relationship_id | source_skill_id | target_skill_id | relationship_type | strength | context |
|----------------|-----------------|-----------------|-------------------|----------|---------|
| 0b3168a4-671d-4fbc-ac22-d041668f19c2 | 9f39bf8d-1fa1-47c7-8b78-b54926f7683a | aa6e2f48-d970-4952-afe6-e244b4870a79 | prerequisite | 0.75 | Reading comprehension is fundamental for developing advanced cognitive skills |
| 0d4d53a0-a798-4398-a8af-e2ca08874724 | 12a9148c-7070-4a78-96a4-f4aab4fd2a8c | aa6e2f48-d970-4952-afe6-e244b4870a79 | builds_on | 0.85 | Programming requires strong mathematical and logical thinking foundations |
| 0f6c2297-8650-42b4-8751-71b2217d67c0 | 310a74d8-d9f8-4d96-acce-f315f2c49b08 | ba32f5f8-9ca0-4b5e-9036-45cfab804524 | complementary | 0.83 | Technology design and operations analysis work together in technical problem-solving |
| 50e55ad3-be18-4c1a-9f7c-1eaa3938ee07 | b8a38778-9c84-4c81-993e-5d16e89591c9 | d049c74f-4b68-472b-a50b-784b98ef8d6e | complementary | 0.92 | Understanding social cues and active listening work together for effective interpersonal communication |
| 523e106a-48b0-4ced-b427-728d039840e8 | 97d9f5d7-47e4-465b-84e2-62ceba476195 | aa6e2f48-d970-4952-afe6-e244b4870a79 | builds_on | 0.90 | Complex problem solving requires critical thinking and continuous learning abilities |

## 7. skl_skill_categories (6 records)
Skill category definitions for classification and organization.

| category_id | category_code | category_name | description | display_order | is_active |
|-------------|---------------|---------------|-------------|---------------|-----------|
| 134c3f2a-b34f-4a38-90f0-0090b39bc99e | capability | Capability | null | 0 | true |
| 7a7a73f2-8ec0-47d2-bea6-59a0d7770745 | core | Core | null | 0 | true |
| 94c761bb-f149-414d-9e46-b095e1f995e0 | life | Life | null | 0 | true |
| bd899b9f-ecd9-49e7-af0b-7f9f8f72d9bb | hard | Hard | null | 0 | true |
| f19a7de2-c6ed-471d-b9f6-f88edc3edd00 | transversal | Transversal | null | 0 | true |

## 8. skl_job_skill_requirements (0 records)
*This table is currently empty.*

## 9. skl_skills_taxonomy_versions (0 records)
*This table is currently empty.*

## 10. skl_skills_version_history (0 records)
*This table is currently empty.*

---

## Summary

**Total Records Across Core Skills Tables: 578**

- **Populated Tables**: 7 tables with data
- **Empty Tables**: 3 tables without data
- **Largest Table**: skl_skills_master (369 records)
- **Most Complex**: Skills relationships showing prerequisite, complementary, and builds_on connections

### Data Sources
- **WEF Future of Jobs 2023**: Future-focused skills taxonomy
- **ESCO Classification**: European skills framework
- **O*NET Database**: US occupational information
- **BLS OES**: Bureau of Labor Statistics employment data

### Key Insights
- Skills span technical, soft, business, and leadership categories
- Industry mappings show salary premiums ranging from 12.3% to 22.3%
- Strong skill relationships with confidence scores up to 0.92
- Comprehensive synonym mapping for improved search capabilities