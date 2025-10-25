-- Migration: Migrate mock services data to new normalized structure
-- This migration inserts all categories and services from src/data/services.ts

-- 1. Insert service categories
INSERT INTO service_categories (category_name, description, display_order) VALUES
  ('BIR Registered Forms', 'Official government forms and documents', 1),
  ('Commercial Forms', 'Business and commercial documentation forms', 2),
  ('Business Forms', 'Corporate stationery and business materials', 3),
  ('Commercial Printing', 'Marketing and promotional printing materials', 4),
  ('Packaging', 'Product packaging and labeling solutions', 5),
  ('Digital Printing', 'Digital printing services and products', 6),
  ('Large Format Printing', 'Large format signage and display materials', 7);

-- 2. Insert services with proper category mapping
-- BIR Registered Forms
INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Official Receipt', category_id, 'active', 'Official receipt printing for business transactions'
FROM service_categories WHERE category_name = 'BIR Registered Forms';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Sales Invoice', category_id, 'active', 'Sales invoice printing for business transactions'
FROM service_categories WHERE category_name = 'BIR Registered Forms';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Purchase Order', category_id, 'inactive', 'Purchase order forms for procurement'
FROM service_categories WHERE category_name = 'BIR Registered Forms';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Delivery Receipt', category_id, 'retired', 'Delivery receipt forms for shipping'
FROM service_categories WHERE category_name = 'BIR Registered Forms';

-- Commercial Forms
INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Insurance Form', category_id, 'active', 'Insurance application and claim forms'
FROM service_categories WHERE category_name = 'Commercial Forms';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Application Form', category_id, 'active', 'General application forms for various purposes'
FROM service_categories WHERE category_name = 'Commercial Forms';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Registration Form', category_id, 'inactive', 'Registration forms for events and services'
FROM service_categories WHERE category_name = 'Commercial Forms';

-- Business Forms
INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Company Folder', category_id, 'inactive', 'Professional company folders and presentation materials'
FROM service_categories WHERE category_name = 'Business Forms';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Business Card', category_id, 'active', 'Professional business card printing'
FROM service_categories WHERE category_name = 'Business Forms';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Letterhead', category_id, 'active', 'Custom letterhead printing for business correspondence'
FROM service_categories WHERE category_name = 'Business Forms';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Envelope', category_id, 'retired', 'Custom envelope printing'
FROM service_categories WHERE category_name = 'Business Forms';

-- Commercial Printing
INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Brochures', category_id, 'active', 'Marketing brochures and promotional materials'
FROM service_categories WHERE category_name = 'Commercial Printing';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Flyers', category_id, 'active', 'Promotional flyers and handouts'
FROM service_categories WHERE category_name = 'Commercial Printing';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Posters', category_id, 'inactive', 'Large format posters and displays'
FROM service_categories WHERE category_name = 'Commercial Printing';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Banners', category_id, 'active', 'Custom banners for events and advertising'
FROM service_categories WHERE category_name = 'Commercial Printing';

-- Packaging
INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Soap Box', category_id, 'active', 'Custom soap packaging boxes'
FROM service_categories WHERE category_name = 'Packaging';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Coffee / Tea Box', category_id, 'active', 'Coffee and tea packaging boxes'
FROM service_categories WHERE category_name = 'Packaging';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Pharmaceutical Box', category_id, 'active', 'Pharmaceutical packaging and labeling'
FROM service_categories WHERE category_name = 'Packaging';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Paper Bag', category_id, 'inactive', 'Custom paper bags and shopping bags'
FROM service_categories WHERE category_name = 'Packaging';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Hang Tag', category_id, 'retired', 'Product hang tags and labels'
FROM service_categories WHERE category_name = 'Packaging';

-- Digital Printing
INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Photo Prints', category_id, 'active', 'High-quality photo printing services'
FROM service_categories WHERE category_name = 'Digital Printing';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Canvas Prints', category_id, 'retired', 'Canvas printing for artwork and photos'
FROM service_categories WHERE category_name = 'Digital Printing';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Stickers', category_id, 'active', 'Custom sticker printing and decals'
FROM service_categories WHERE category_name = 'Digital Printing';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Labels', category_id, 'active', 'Custom label printing for products and packaging'
FROM service_categories WHERE category_name = 'Digital Printing';

-- Large Format Printing
INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Signage', category_id, 'active', 'Large format signage and display materials'
FROM service_categories WHERE category_name = 'Large Format Printing';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Vehicle Wraps', category_id, 'inactive', 'Vehicle wrap printing and installation'
FROM service_categories WHERE category_name = 'Large Format Printing';

INSERT INTO printing_services (service_name, category_id, status, description) 
SELECT 'Window Graphics', category_id, 'active', 'Window graphics and decals'
FROM service_categories WHERE category_name = 'Large Format Printing';

-- 3. Verify data migration
-- Check that all categories were inserted
SELECT 'Categories inserted:' as status, COUNT(*) as count FROM service_categories;

-- Check that all services were inserted
SELECT 'Services inserted:' as status, COUNT(*) as count FROM printing_services;

-- Check services by status
SELECT 'Services by status:' as status, ps.status, COUNT(*) as count 
FROM printing_services ps
GROUP BY ps.status 
ORDER BY ps.status;

-- Check services by category
SELECT 'Services by category:' as status, sc.category_name, COUNT(ps.service_id) as service_count
FROM service_categories sc
LEFT JOIN printing_services ps ON sc.category_id = ps.category_id
GROUP BY sc.category_name, sc.display_order
ORDER BY sc.display_order;
