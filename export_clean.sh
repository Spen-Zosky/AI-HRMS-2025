#!/bin/bash
export PGPASSWORD=hrms_password

# Create a clean migration file
echo "-- AI-HRMS-2025 Initial Migration to Supabase" > /tmp/clean_migration.sql
echo "-- Generated: $(date)" >> /tmp/clean_migration.sql
echo "" >> /tmp/clean_migration.sql
echo "-- Disable foreign key checks" >> /tmp/clean_migration.sql
echo "SET session_replication_role = 'replica';" >> /tmp/clean_migration.sql
echo "" >> /tmp/clean_migration.sql

# Export schema only (CREATE statements)
pg_dump -h localhost -U hrms_user -d ai_hrms_2025 \
  --schema-only \
  --no-owner \
  --no-acl \
  --no-comments \
  --no-security-labels \
  --no-tablespaces \
  --no-unlogged-table-data \
  --schema=public 2>/dev/null | \
  grep -v "^--" | \
  grep -v "^$" | \
  grep -v "^SET " | \
  grep -v "^SELECT pg_catalog" | \
  grep -v "^DROP " | \
  grep -v "^ALTER TABLE.*DROP CONSTRAINT" >> /tmp/clean_migration.sql

echo "" >> /tmp/clean_migration.sql
echo "-- Enable foreign key checks" >> /tmp/clean_migration.sql
echo "SET session_replication_role = 'origin';" >> /tmp/clean_migration.sql
echo "" >> /tmp/clean_migration.sql

# Export data only (INSERT statements)
echo "-- Data inserts" >> /tmp/clean_migration.sql
pg_dump -h localhost -U hrms_user -d ai_hrms_2025 \
  --data-only \
  --no-owner \
  --no-acl \
  --no-comments \
  --disable-triggers \
  --schema=public 2>/dev/null | \
  grep -v "^--" | \
  grep -v "^$" | \
  grep -v "^SET " | \
  grep -v "^SELECT pg_catalog" >> /tmp/clean_migration.sql

# Move to final location
mv /tmp/clean_migration.sql /home/enzo/AI-HRMS-2025/supabase/migrations/20250123134416_initial_push.sql

echo "Migration file created successfully!"
