{
  "nodes": {
    "end": {
      "type": "end",
      "message": "Thanks for choosing B.J. Santiago! Have a great day!"
    },
    "ask_upload_image": {
      "type": "message",
      "message": "Would you like to upload an image to support your order details?",
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
      "message": "Hi! I'm Printy, B.J. Santiago's bot assistant. As a valued customer, there's no upfront payment required — we'll process your order immediately after details are finalized.\n\nPlease describe what you'd like printed. You can copy and fill out this form:\n\n• Product Name\n• Description\n• Size (e.g., 3.5in x 2in, A4, 24in x 36in)\n• Quantity\n• Materials (e.g., Cardstock, Vinyl)\n• Color (e.g., Full Color, Black & White, PMS 286)\n• Finishing (e.g., Glossy, Matte, UV Coating)\n• Deadline",
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
      "message": "Let me process your order details. Hang on for a minute.",
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
  "title": "Place Order",
  "flow_id": "place-order",
  "description": "Valued customers place order without upfront payment; immediate processing.",
  "initial_node": "intro"
}