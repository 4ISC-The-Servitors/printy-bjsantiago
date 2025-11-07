-- Migration: Add "Upload Image" option to track-ticket and admin-review-ticket flows

-- Update track-ticket flow
UPDATE chat_flows_v2
SET flow_definition = jsonb_set(
  jsonb_set(
    flow_definition,
    '{nodes,show_conversation,options}',
    COALESCE(
      (flow_definition->'nodes'->'show_conversation'->'options')::jsonb ||
      '[]'::jsonb,
      '[]'::jsonb
    ) || jsonb_build_array(
      jsonb_build_object(
        'next', 'upload_image_instructions',
        'label', 'Reply with an Image',
        'value', 'reply_with_image'
      )
    )
  ),
  '{nodes,upload_image_instructions}',
  jsonb_build_object(
    'type', 'message',
    'message', 'Please click the attachment button below beside the typing area to upload an image. You can also add a text message along with your image.',
    'expects_input', true,
    'input_config', jsonb_build_object(
      'store_as', 'uploaded_image_url'
    ),
    'next', 'collect_reply'
  )
)
WHERE flow_id = 'track-ticket';

-- Update admin-review-ticket flow
UPDATE chat_flows_v2
SET flow_definition = jsonb_set(
  jsonb_set(
    flow_definition,
    '{nodes,show_ticket_details,options}',
    COALESCE(
      (flow_definition->'nodes'->'show_ticket_details'->'options')::jsonb ||
      '[]'::jsonb,
      '[]'::jsonb
    ) || jsonb_build_array(
      jsonb_build_object(
        'next', 'upload_image_instructions',
        'label', 'Reply with an Image',
        'value', 'reply_with_image'
      )
    )
  ),
  '{nodes,upload_image_instructions}',
  jsonb_build_object(
    'type', 'message',
    'message', 'Please click the attachment button below beside the typing area to upload an image. You can also add a text message along with your image.',
    'expects_input', true,
    'input_config', jsonb_build_object(
      'store_as', 'uploaded_image_url'
    ),
    'next', 'collect_admin_reply'
  )
)
WHERE flow_id = 'admin-review-ticket';

-- Verify updates
DO $$
DECLARE
  track_ticket_has_upload boolean;
  admin_review_has_upload boolean;
BEGIN
  -- Check track-ticket flow
  SELECT EXISTS(
    SELECT 1 
    FROM chat_flows_v2 
    WHERE flow_id = 'track-ticket'
      AND flow_definition->'nodes'->'show_conversation'->'options' @> '[{"label":"Reply with an Image"}]'::jsonb
      AND flow_definition->'nodes'->'upload_image_instructions' IS NOT NULL
  ) INTO track_ticket_has_upload;

  -- Check admin-review-ticket flow
  SELECT EXISTS(
    SELECT 1 
    FROM chat_flows_v2 
    WHERE flow_id = 'admin-review-ticket'
      AND flow_definition->'nodes'->'show_ticket_details'->'options' @> '[{"label":"Reply with an Image"}]'::jsonb
      AND flow_definition->'nodes'->'upload_image_instructions' IS NOT NULL
  ) INTO admin_review_has_upload;

  IF NOT track_ticket_has_upload THEN
    RAISE WARNING 'track-ticket flow update may have failed - Reply with an Image option not found';
  END IF;

  IF NOT admin_review_has_upload THEN
    RAISE WARNING 'admin-review-ticket flow update may have failed - Reply with an Image option not found';
  END IF;
END $$;

COMMENT ON TABLE chat_flows_v2 IS 
'Flow definitions including ticket reply flows with image upload support via upload_image_instructions node';

