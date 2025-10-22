-- Create guest FAQs flow
INSERT INTO chat_flows_v2 (flow_id, flow_definition, active, flow_owner)
VALUES (
  'guest-faqs',
  '{
    "flow_id": "guest-faqs",
    "title": "FAQs",
    "description": "Quick answers to common questions about B.J. Santiago Inc.",
    "initial_node": "faq_start",
    "nodes": {
      "faq_start": {
        "type": "message",
        "message": "Hi! I''m Printy, B.J. Santiago''s bot assistant. Here are some frequently asked questions. What would you like to know?",
        "options": [
          {"label": "How long has B.J. Santiago been in business?", "next": "q1"},
          {"label": "What makes B.J. Santiago different from larger companies?", "next": "q2"},
          {"label": "What types of materials can you print?", "next": "q3"},
          {"label": "Do you offer design services?", "next": "q4"},
          {"label": "What is your approach to pricing?", "next": "q5"},
          {"label": "How do you ensure quality?", "next": "q6"},
          {"label": "What technology do you use?", "next": "q7"},
          {"label": "Can you work within my budget and timeline?", "next": "q8"},
          {"label": "Where are you located?", "next": "q9"},
          {"label": "How can I contact you?", "next": "q10"},
          {"label": "End Chat", "next": "end"}
        ]
      },
      "q1": {
        "type": "message",
        "message": "B.J. Santiago Inc. has been in business since 1992 - that''s over 30 years of experience in the printing industry! We''ve maintained a strict commitment to customers throughout the years, investing in the latest printing technology, software, and talented employees to continue flourishing through innovation, flexibility, and sheer competitiveness.",
        "options": [
          {"label": "What makes B.J. Santiago different from larger companies?", "next": "q2"},
          {"label": "What types of materials can you print?", "next": "q3"},
          {"label": "Do you offer design services?", "next": "q4"},
          {"label": "What is your approach to pricing?", "next": "q5"},
          {"label": "Back to All Questions", "next": "faq_start"},
          {"label": "End Chat", "next": "end"}
        ]
      },
      "q2": {
        "type": "message",
        "message": "Being small has BIG advantages! We may be considered a small player in an industry occupied by giant printing corporations, but as our President says, we''re like ''David in a field filled with Goliaths.''\n\nOur advantages include:\n• More personalized service and quick, honest, expert advice\n• Competitive pricing due to smaller overhead\n• Flexibility and innovation\n• Direct access to company leadership\n• Strong focus on customer relationships",
        "options": [
          {"label": "How long has B.J. Santiago been in business?", "next": "q1"},
          {"label": "What types of materials can you print?", "next": "q3"},
          {"label": "Do you offer design services?", "next": "q4"},
          {"label": "What is your approach to pricing?", "next": "q5"},
          {"label": "Back to All Questions", "next": "faq_start"},
          {"label": "End Chat", "next": "end"}
        ]
      },
      "q3": {
        "type": "message",
        "message": "We can print on a wide variety of materials including:\n\n• Paper and Paper Board Materials - Various weights and finishes\n• Labels and Stickers - Custom designs for any application\n• Vinyl and Mesh - For banners and outdoor signage\n• Fabric Materials - For specialized printing needs\n• Cardstock and Specialty Papers - For premium projects\n\nWe work with suppliers of various print materials to ensure we can meet your specific material requirements. For detailed material specifications, we recommend discussing your project with our team.",
        "options": [
          {"label": "How long has B.J. Santiago been in business?", "next": "q1"},
          {"label": "What makes B.J. Santiago different from larger companies?", "next": "q2"},
          {"label": "Do you offer design services?", "next": "q4"},
          {"label": "What is your approach to pricing?", "next": "q5"},
          {"label": "Back to All Questions", "next": "faq_start"},
          {"label": "End Chat", "next": "end"}
        ]
      },
      "q4": {
        "type": "message",
        "message": "Yes! We offer comprehensive creative services including:\n\n• Concept Development - Brainstorming and ideation\n• Design and Layout - Professional graphic design\n• Writing and Editing - Content creation and refinement\n• Photography - Custom photography for your projects\n• Production Management - End-to-end project coordination\n\nOur creative team is composed of experts from the fields of advertising, promotions, and publishing. We can handle everything from basic collaterals to packaging, catalogs, and books. We excel in translating your brilliant ideas into innovative designs and quality prints.",
        "options": [
          {"label": "How long has B.J. Santiago been in business?", "next": "q1"},
          {"label": "What makes B.J. Santiago different from larger companies?", "next": "q2"},
          {"label": "What types of materials can you print?", "next": "q3"},
          {"label": "What is your approach to pricing?", "next": "q5"},
          {"label": "Back to All Questions", "next": "faq_start"},
          {"label": "End Chat", "next": "end"}
        ]
      },
      "q5": {
        "type": "message",
        "message": "We believe that quality prints don''t need to be very costly! Our approach to pricing includes:\n\n• Competitive Pricing - We''re BIG on competitive pricing\n• Cost-Saving Operations - Running a tight ship with smaller overhead allows us to pass on more savings to our clients\n• Budget-Friendly Solutions - We work with your budget and timeline\n• Efficient Logistics - Our company prides itself with efficient logistics and close cooperation with suppliers\n• No Hidden Costs - Transparent pricing with quick cost estimating\n\nWe can provide quick cost estimates and work within your budget constraints while maintaining quality standards.",
        "options": [
          {"label": "How long has B.J. Santiago been in business?", "next": "q1"},
          {"label": "What makes B.J. Santiago different from larger companies?", "next": "q2"},
          {"label": "What types of materials can you print?", "next": "q3"},
          {"label": "Do you offer design services?", "next": "q4"},
          {"label": "Back to All Questions", "next": "faq_start"},
          {"label": "End Chat", "next": "end"}
        ]
      },
      "q6": {
        "type": "message",
        "message": "Quality is our top priority! We ensure quality through:\n\n• State-of-the-art Equipment - We invest in the best machines available, always dependable and efficient\n• Skilled Team - Our people are half of our strength, with expertise, skills, and knowledge in all aspects of our business\n• Quality Materials - Close cooperation with suppliers of various print materials\n• Attention to Detail - Our commitment to excellence extends beyond the quality of the finished product\n• Customer Approval Process - We work with client approval at every stage\n\nOur best collective efforts guarantee satisfaction among our customers.",
        "options": [
          {"label": "How long has B.J. Santiago been in business?", "next": "q1"},
          {"label": "What makes B.J. Santiago different from larger companies?", "next": "q2"},
          {"label": "What types of materials can you print?", "next": "q3"},
          {"label": "Do you offer design services?", "next": "q4"},
          {"label": "Back to All Questions", "next": "faq_start"},
          {"label": "End Chat", "next": "end"}
        ]
      },
      "q7": {
        "type": "message",
        "message": "We utilize cutting-edge technology including:\n\n• Computer-to-plate Technology - For precise and efficient printing\n• State-of-the-art Printing Equipment - Always dependable and efficient\n• Latest Software - We invest in the latest printing technology and software\n• Marketing and Creative Brainstorming Tools - For innovative solutions\n• International Connections - Technology that supports our global reach\n\nWe are BIG on knowledge and technology, utilizing the power of technology to increase customer satisfaction and profitability. Our quest for the best machines available ensures time and cost-saving operations.",
        "options": [
          {"label": "How long has B.J. Santiago been in business?", "next": "q1"},
          {"label": "What makes B.J. Santiago different from larger companies?", "next": "q2"},
          {"label": "What types of materials can you print?", "next": "q3"},
          {"label": "Do you offer design services?", "next": "q4"},
          {"label": "Back to All Questions", "next": "faq_start"},
          {"label": "End Chat", "next": "end"}
        ]
      },
      "q8": {
        "type": "message",
        "message": "Absolutely! We specialize in working within your constraints:\n\n• Budget Flexibility - We can work with your budget and provide quick cost estimating\n• Timeline Management - We understand your timeline requirements and work efficiently to meet them\n• Cost-Saving Solutions - Our efficient operations and smaller overhead allow us to offer competitive pricing\n• Quick Turnaround - We''re designed for efficiency and time-saving operations\n• Custom Solutions - We can tailor our services to fit your specific budget and timeline needs\n\nOur goal is to not only meet but exceed your expectations while working within your constraints.",
        "options": [
          {"label": "How long has B.J. Santiago been in business?", "next": "q1"},
          {"label": "What makes B.J. Santiago different from larger companies?", "next": "q2"},
          {"label": "What types of materials can you print?", "next": "q3"},
          {"label": "Do you offer design services?", "next": "q4"},
          {"label": "Back to All Questions", "next": "faq_start"},
          {"label": "End Chat", "next": "end"}
        ]
      },
      "q9": {
        "type": "message",
        "message": "We are located in Manila, Philippines:\n\nAddress: 657 A. H. Lacson Street, Sampaloc, Manila, Philippines 1008\n\nOur central Manila location allows us to serve clients throughout the Philippines and internationally. We''re easily accessible and well-positioned to handle both local and global printing ventures.",
        "options": [
          {"label": "How long has B.J. Santiago been in business?", "next": "q1"},
          {"label": "What makes B.J. Santiago different from larger companies?", "next": "q2"},
          {"label": "What types of materials can you print?", "next": "q3"},
          {"label": "How can I contact you?", "next": "q10"},
          {"label": "Back to All Questions", "next": "faq_start"},
          {"label": "End Chat", "next": "end"}
        ]
      },
      "q10": {
        "type": "message",
        "message": "You can contact us through multiple channels:Phone: +632 8781 3457 / +632 8736 9121\nTelefax: +632 8743 6851\nEmail: bjsantiagoinc@gmail.com / bjsantiagoinc@yahoo.com\nAddress: 657 A. H. Lacson Street, Sampaloc, Manila, Philippines 1008\n\nWe''re here to help with all your printing needs! Feel free to reach out for quick, honest, and expert advice in all stages of production - from design to delivery.",
        "options": [
          {"label": "How long has B.J. Santiago been in business?", "next": "q1"},
          {"label": "What makes B.J. Santiago different from larger companies?", "next": "q2"},
          {"label": "What types of materials can you print?", "next": "q3"},
          {"label": "Where are you located?", "next": "q9"},
          {"label": "Back to All Questions", "next": "faq_start"},
          {"label": "End Chat", "next": "end"}
        ]
      },
      "end": {
        "type": "end",
        "message": "Thank you for your questions! We hope we''ve been helpful. Feel free to reach out anytime for more information about B.J. Santiago Inc. Have a great day!"
      }
    }
  }'::jsonb,
  true,
  'guest'
);
