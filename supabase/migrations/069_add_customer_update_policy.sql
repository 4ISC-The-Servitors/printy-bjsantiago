-- Migration: Add UPDATE RLS policy for customer table
-- This allows authenticated users to update their own customer information

-- Add UPDATE policy for customer table
CREATE POLICY "Users can update own customer record" ON customer
    FOR UPDATE USING (
      auth.uid() = customer_id
    );

-- Add INSERT policy for customer table (in case new customers need to be created)
CREATE POLICY "Users can insert own customer record" ON customer
    FOR INSERT WITH CHECK (
      auth.uid() = customer_id
    );

-- Migration: Update existing RLS policies for correct table relationships
-- Update existing policies to reflect location -> building -> street relationship

-- Update existing street table policy - users can update streets through location -> building -> street
ALTER POLICY "Users can update own street" ON street
USING (
  EXISTS (
    SELECT 1 FROM building b
    JOIN location l ON l.bldg_id = b.bldg_id
    JOIN customer c ON c.location_id = l.location_id
    WHERE b.street_id = street.street_id 
    AND c.customer_id = auth.uid()
  )
);

-- Update existing barangay table policy - users can update barangays through location -> building -> street -> barangay
ALTER POLICY "Users can update own barangay" ON barangay
USING (
  EXISTS (
    SELECT 1 FROM street s
    JOIN building b ON b.street_id = s.street_id
    JOIN location l ON l.bldg_id = b.bldg_id
    JOIN customer c ON c.location_id = l.location_id
    WHERE s.brgy_id = barangay.brgy_id 
    AND c.customer_id = auth.uid()
  )
);

-- Add building table policy since we're using it in the relationship
ALTER TABLE building ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can update own building" ON building
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM location l
        JOIN customer c ON c.location_id = l.location_id
        WHERE l.bldg_id = building.bldg_id 
        AND c.customer_id = auth.uid()
      )
    );

-- Grant UPDATE permission on building table
GRANT UPDATE ON building TO authenticated;
