-- Migration: Create dynamic services-catalog chat flow for customers and guests
-- This flow uses dynamic actions to fetch real-time active services and categories from the database

INSERT INTO chat_flows_v2 (flow_id, flow_definition, active, flow_owner) VALUES (
  'services-offered',
  '{
    "nodes": {
      "welcome": {
        "type": "action",
        "action": "display_service_categories",
        "action_config": {}
      },
      "category_dynamic": {
        "type": "action",
        "action": "display_services_by_category",
        "action_config": {
          "category_source": "context"
        }
      },
      "end": {
        "type": "end",
        "message": "Thank you for browsing our services! If you need a quote for any of these services or have questions, feel free to start a new chat. We look forward to serving your printing needs!"
      }
    },
    "title": "Services Offered",
    "flow_id": "services-offered",
    "description": "Browse active printing services organized by category",
    "initial_node": "welcome"
  }'::jsonb,
  true,
  'customer'
);

-- Also create a guest version with identical structure
INSERT INTO chat_flows_v2 (flow_id, flow_definition, active, flow_owner) VALUES (
  'guest-services-offered',
  '{
    "nodes": {
      "welcome": {
        "type": "action",
        "action": "display_service_categories",
        "action_config": {}
      },
      "category_dynamic": {
        "type": "action",
        "action": "display_services_by_category",
        "action_config": {
          "category_source": "context"
        }
      },
      "end": {
        "type": "end",
        "message": "Thank you for browsing our services! If you need a quote for any of these services or have questions, feel free to start a new chat. We look forward to serving your printing needs!"
      }
    },
    "title": "Services Offered",
    "flow_id": "guest-services-offered",
    "description": "Browse active printing services organized by category",
    "initial_node": "welcome"
  }'::jsonb,
  true,
  'guest'
);
