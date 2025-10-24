-- Migration: Fix building connection for street_id de1df295-48f1-4d64-b1d0-f7b29461aa25
-- Update building name to fix the connection for customer Andeng Salazar

-- Update building table with building name
UPDATE building 
SET bldg_name = 'Building 123'
WHERE bldg_id = '56e515b2-44f6-4059-9a44-ac10bda0b0be'
AND street_id = 'de1df295-48f1-4d64-b1d0-f7b29461aa25';

-- Also update the location table building name
UPDATE location 
SET bldg_name = 'Building 123'
WHERE bldg_id = '56e515b2-44f6-4059-9a44-ac10bda0b0be';

-- Verify the connection is working
SELECT 
  c.customer_id,
  c.first_name,
  c.last_name,
  c.email_address,
  l.bldg_name as location_building,
  l.bldg_num as building_number,
  l.zip_code,
  b.bldg_name as building_name,
  s.street_name,
  br.brgy_name
FROM customer c
JOIN location l ON c.location_id = l.location_id
JOIN building b ON l.bldg_id = b.bldg_id
JOIN street s ON b.street_id = s.street_id
LEFT JOIN barangay br ON s.brgy_id = br.brgy_id
WHERE b.street_id = 'de1df295-48f1-4d64-b1d0-f7b29461aa25';
