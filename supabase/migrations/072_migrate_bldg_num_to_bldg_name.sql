-- Migration: Migrate bldg_num data to bldg_name in building table
-- This migration copies building number data to building name where name is null/empty

-- Check current state before migration
SELECT 
  COUNT(*) as total_buildings,
  COUNT(CASE WHEN bldg_name IS NULL OR bldg_name = '' THEN 1 END) as needs_migration,
  COUNT(CASE WHEN bldg_name IS NOT NULL AND bldg_name != '' THEN 1 END) as has_name
FROM building;

-- Preview what will be migrated
SELECT 
  bldg_id,
  bldg_name as current_name,
  bldg_num as current_num,
  CASE 
    WHEN bldg_name IS NULL OR bldg_name = '' THEN bldg_num
    ELSE bldg_name
  END as new_bldg_name
FROM building 
WHERE bldg_name IS NULL OR bldg_name = ''
ORDER BY bldg_id;

-- Perform the migration: copy bldg_num to bldg_name where bldg_name is null/empty
UPDATE building 
SET bldg_name = bldg_num
WHERE bldg_name IS NULL OR bldg_name = '';

-- Verify the migration results
SELECT 
  COUNT(*) as total_buildings,
  COUNT(CASE WHEN bldg_name IS NULL OR bldg_name = '' THEN 1 END) as still_empty,
  COUNT(CASE WHEN bldg_name IS NOT NULL AND bldg_name != '' THEN 1 END) as has_name
FROM building;

-- Show final results
SELECT 
  bldg_id,
  bldg_name,
  bldg_num,
  street_id
FROM building 
ORDER BY bldg_id;
