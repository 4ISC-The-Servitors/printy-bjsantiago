{
  "nodes": {
    "end": {
      "type": "end",
      "message": "Thanks for choosing B.J. Santiago! Have a great day!"
    },
    "ask_upload_image": {
      "type": "message",
      "message": "Would you like to upload an image to support your description? (e.g., references, examples, or sketches)",
      "options": [
        {
          "next": "upload_image_instructions",
          "label": "Yes, upload image",
          "value": "yes",
          "store_as": "wants_image_upload"
        },
        {
          "next": "create_quote",
          "label": "No, continue without image",
          "value": "no",
          "store_as": "wants_image_upload"
        }
      ]
    },
    "upload_image_instructions": {
      "next": "create_quote",
      "type": "message",
      "message": "Please click the attachment button below beside the typing area to upload an image. Make sure to upload MAXIMUM of 3 images and MAXIMUM of 10MB only.",
      "input_config": {
        "store_as": "uploaded_image_url"
      },
      "expects_input": true
    },
    "intro": {
      "next": "ask_upload_image",
      "type": "message",
      "message": "Hi! I'm Printy, B.J. Santiago's bot assistant. Let's get you a quote for the product you want printed!\n\nPlease describe what you'd like printed. Include as many details as possible:\n\n• Item type (business cards, flyers, banners, etc.)\n• Size and dimensions (e.g., 3.5\" x 2\", A4, custom)\n• Quantity (how many do you need?)\n• Materials or finishing (glossy, matte, cardstock, etc.)\n• Your deadline (when do you need it by?)",
      "input_config": {
        "required": true,
        "store_as": "quote_details"
      },
      "expects_input": true
    },
    "create_quote": {
      "next": "quote_created",
      "type": "action",
      "action": "create_quote_conversation",
      "message": "Let me process your quote request. Hang on for a minute.",
      "action_config": {
        "details_key": "quote_details",
        "show_display_id": true
      }
    },
    "quote_created": {
      "type": "message",
      "message": [],
      "options": [
        {
          "next": "end",
          "label": "End Chat"
        }
      ]
    }
  },
  "title": "Request a Quote",
  "flow_id": "ask-quote",
  "description": "Customer describes what they want printed and submits a quote request",
  "initial_node": "intro"
}