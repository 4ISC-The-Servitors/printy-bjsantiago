-- Rollback Migration: Remove "Upload Image" option from track-ticket and admin-review-ticket flows
-- Use this to restore the original flow definitions if migration 093 causes issues
--
-- To apply: Run this file after migration 093 to revert flow changes
-- This will remove the upload_image_instructions node and "Upload Image" option from both flows

-- Rollback track-ticket flow: Remove "Upload Image" option and upload_image_instructions node
UPDATE chat_flows_v2
SET flow_definition = flow_definition
  - 'nodes' || jsonb_build_object(
    'nodes',
    (flow_definition->'nodes')::jsonb - 'upload_image_instructions' ||
    jsonb_build_object(
      'show_conversation',
      (flow_definition->'nodes'->'show_conversation')::jsonb - 'options' ||
      jsonb_build_object(
        'options',
        COALESCE(
          (
            SELECT jsonb_agg(opt)
            FROM jsonb_array_elements(
              flow_definition->'nodes'->'show_conversation'->'options'
            ) AS opt
            WHERE opt->>'label' != 'Reply with an Image'
          ),
          '[]'::jsonb
        )
      )
    )
  )
WHERE flow_id = 'track-ticket'
  AND flow_definition->'nodes'->'upload_image_instructions' IS NOT NULL;

-- Rollback admin-review-ticket flow: Remove "Upload Image" option and upload_image_instructions node
UPDATE chat_flows_v2
SET flow_definition = flow_definition
  - 'nodes' || jsonb_build_object(
    'nodes',
    (flow_definition->'nodes')::jsonb - 'upload_image_instructions' ||
    jsonb_build_object(
      'show_ticket_details',
      (flow_definition->'nodes'->'show_ticket_details')::jsonb - 'options' ||
      jsonb_build_object(
        'options',
        COALESCE(
          (
            SELECT jsonb_agg(opt)
            FROM jsonb_array_elements(
              flow_definition->'nodes'->'show_ticket_details'->'options'
            ) AS opt
            WHERE opt->>'label' != 'Reply with an Image'
          ),
          '[]'::jsonb
        )
      )
    )
  )
WHERE flow_id = 'admin-review-ticket'
  AND flow_definition->'nodes'->'upload_image_instructions' IS NOT NULL;

-- Verify rollback
DO $$
DECLARE
  track_ticket_still_has_upload boolean;
  admin_review_still_has_upload boolean;
BEGIN
  -- Check track-ticket flow
  SELECT EXISTS(
    SELECT 1 
    FROM chat_flows_v2 
    WHERE flow_id = 'track-ticket'
      AND (
        flow_definition->'nodes'->'show_conversation'->'options' @> '[{"label":"Reply with an Image"}]'::jsonb
        OR flow_definition->'nodes'->'upload_image_instructions' IS NOT NULL
      )
  ) INTO track_ticket_still_has_upload;

  -- Check admin-review-ticket flow
  SELECT EXISTS(
    SELECT 1 
    FROM chat_flows_v2 
    WHERE flow_id = 'admin-review-ticket'
      AND (
        flow_definition->'nodes'->'show_ticket_details'->'options' @> '[{"label":"Reply with an Image"}]'::jsonb
        OR flow_definition->'nodes'->'upload_image_instructions' IS NOT NULL
      )
  ) INTO admin_review_still_has_upload;

  IF track_ticket_still_has_upload THEN
    RAISE WARNING 'track-ticket flow rollback may have failed - Reply with an Image option still present';
  END IF;

  IF admin_review_still_has_upload THEN
    RAISE WARNING 'admin-review-ticket flow rollback may have failed - Reply with an Image option still present';
  END IF;
END $$;

