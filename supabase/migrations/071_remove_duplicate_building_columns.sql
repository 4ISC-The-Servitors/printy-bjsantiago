-- Migration: Remove duplicate building columns from location table
-- Keep only bldg_id foreign key and zip_code in location table
-- Building details should only be stored in building table

-- Remove duplicate building columns from location table
ALTER TABLE location DROP COLUMN IF EXISTS bldg_name;
ALTER TABLE location DROP COLUMN IF EXISTS bldg_num;

-- Verify the cleanup
SELECT 
  l.location_id,
  l.bldg_id,
  l.zip_code,
  b.bldg_name,
  b.bldg_num,
  b.street_id,
  s.street_name
FROM location l
LEFT JOIN building b ON l.bldg_id = b.bldg_id
LEFT JOIN street s ON b.street_id = s.street_id
WHERE l.location_id = '2f21c770-ac29-4d6b-82a1-4b5a31b65792';
