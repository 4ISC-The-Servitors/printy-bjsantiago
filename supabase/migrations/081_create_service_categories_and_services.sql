-- Migration: Create service_categories and overhaul printing_services tables
-- This migration creates a normalized service structure with proper categorization

-- 1. Create service_categories table
CREATE TABLE IF NOT EXISTS service_categories (
  category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Drop existing printing_services table and recreate with proper schema
DROP TABLE IF EXISTS printing_services CASCADE;

CREATE TABLE printing_services (
  service_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id VARCHAR(20) UNIQUE,
  service_name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES service_categories(category_id) ON DELETE RESTRICT,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'retired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES customer(customer_id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES customer(customer_id) ON DELETE SET NULL
);

-- 3. Create sequence for display IDs
CREATE SEQUENCE IF NOT EXISTS service_display_seq START WITH 1;

-- 4. Create trigger function for display ID generation
CREATE OR REPLACE FUNCTION generate_service_display_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.display_id IS NULL THEN
    NEW.display_id := 'SRV-' || LPAD(nextval('service_display_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger
CREATE TRIGGER set_service_display_id
  BEFORE INSERT ON printing_services
  FOR EACH ROW
  EXECUTE FUNCTION generate_service_display_id();

-- 6. Create indexes for performance
CREATE INDEX idx_services_category_id ON printing_services(category_id);
CREATE INDEX idx_services_status ON printing_services(status);
CREATE INDEX idx_services_display_id ON printing_services(display_id);
CREATE INDEX idx_categories_active ON service_categories(is_active);

-- 7. Enable RLS
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE printing_services ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for service_categories
-- Allow all users (authenticated and anonymous) to read categories
CREATE POLICY "Anyone can read service categories" ON service_categories
  FOR SELECT USING (true);

-- Only admins can modify categories
CREATE POLICY "Only admins can modify service categories" ON service_categories
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- 9. Create RLS policies for printing_services
-- Allow all users (authenticated and anonymous) to read services
CREATE POLICY "Anyone can read printing services" ON printing_services
  FOR SELECT USING (true);

-- Only admins can modify services
CREATE POLICY "Only admins can modify printing services" ON printing_services
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- 10. Grant permissions
GRANT SELECT ON service_categories TO authenticated, anon;
GRANT SELECT ON printing_services TO authenticated, anon;
GRANT ALL ON service_categories TO authenticated;
GRANT ALL ON printing_services TO authenticated;

-- 11. Add comments for documentation
COMMENT ON TABLE service_categories IS 'Service categories for organizing printing services';
COMMENT ON TABLE printing_services IS 'Printing services with normalized category relationships';
COMMENT ON COLUMN printing_services.display_id IS 'Human-readable service ID (e.g., SRV-000001)';
COMMENT ON COLUMN printing_services.status IS 'Service status: active, inactive, or retired';
