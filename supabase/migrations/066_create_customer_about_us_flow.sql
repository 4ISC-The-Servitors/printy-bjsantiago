-- Create customer about us flow
INSERT INTO chat_flows_v2 (flow_id, flow_definition, active, flow_owner)
VALUES (
  'about-us',
  '{
    "flow_id": "about-us",
    "title": "About Us",
    "description": "Learn about B.J. Santiago Inc. company history, mission, and values",
    "initial_node": "welcome",
    "nodes": {
      "welcome": {
        "type": "message",
        "message": "Hi! I''m Printy, B.J. Santiago''s bot assistant. What would you like to know about our company?",
        "options": [
          {"label": "Company History", "next": "company_history"},
          {"label": "Our Mission & Vision", "next": "mission_vision"},
          {"label": "Why Choose Us", "next": "why_choose_us"},
          {"label": "Our Technology", "next": "technology"},
          {"label": "Contact Information", "next": "contact_info"},
          {"label": "End Chat", "next": "end"}
        ]
      },
      "company_history": {
        "type": "message",
        "message": "B.J. Santiago Inc. was founded in 1992 and has been serving clients for over 30 years. We may be considered a small player in an industry occupied by giant printing corporations, but as our President Benedict S. Santiago Jr. says, we''re like ''David in a field filled with Goliaths.''\n\nWe provide the highest-quality products and services based on the latest trends in printing at very competitive prices. Since 1992, we have maintained a strict commitment to customers, investing in the latest printing technology, software, and talented employees.",
        "options": [
          {"label": "Our Mission & Vision", "next": "mission_vision"},
          {"label": "Why Choose Us", "next": "why_choose_us"},
          {"label": "Our Technology", "next": "technology"},
          {"label": "Contact Information", "next": "contact_info"},
          {"label": "Back to Main Menu", "next": "welcome"},
          {"label": "End Chat", "next": "end"}
        ]
      },
      "mission_vision": {
        "type": "message",
        "message": "Our mission is to provide innovative printing solutions to local and global markets, aimed at building lasting relationships through customer satisfaction.\n\nWe believe in translating your brilliant ideas into innovative designs and quality prints. Our top objective is to move towards global printing ventures by providing superior services and quality printing materials to foreign markets.\n\nWe place high regard to creativity and quality, and our commitment to excellence extends beyond the quality of the finished product.",
        "options": [
          {"label": "Company History", "next": "company_history"},
          {"label": "Why Choose Us", "next": "why_choose_us"},
          {"label": "Our Technology", "next": "technology"},
          {"label": "Contact Information", "next": "contact_info"},
          {"label": "Back to Main Menu", "next": "welcome"},
          {"label": "End Chat", "next": "end"}
        ]
      },
      "why_choose_us": {
        "type": "message",
        "message": "Being small has BIG advantages! Here''s why you should choose B.J. Santiago Inc.:\n\n• Experience & Knowledge: We are BIG on experience and new ideas. Our people are half of our strength, and we greatly value the expertise, skills, and knowledge of every employee.\n\n• Technology: We are BIG on knowledge and technology. We utilize the power of technology to increase customer satisfaction and profitability.\n\n• Competitive Pricing: We are BIG on competitive pricing. Running a tight ship with smaller overhead makes it possible for us to pass on more savings to our clients.\n\n• Customer Service: We are BIG on good customer interactions. The secret to our success is sustaining long-term relationships with our clients.",
        "options": [
          {"label": "Company History", "next": "company_history"},
          {"label": "Our Mission & Vision", "next": "mission_vision"},
          {"label": "Our Technology", "next": "technology"},
          {"label": "Contact Information", "next": "contact_info"},
          {"label": "Back to Main Menu", "next": "welcome"},
          {"label": "End Chat", "next": "end"}
        ]
      },
      "technology": {
        "type": "message",
        "message": "We utilize cutting-edge technology to deliver superior printing solutions:\n\n• Computer-to-plate technology for precise printing\n• State-of-the-art printing equipment that''s always dependable and efficient\n• Marketing and creative brainstorming capabilities\n• International connections for global reach\n\nOur other half of strength is our quest for the best machines available - always dependable and efficient, thus time and cost-saving. We believe that quality prints don''t need to be very costly, and our company prides itself with efficient logistics and close cooperation with every supplier of various print materials.",
        "options": [
          {"label": "Company History", "next": "company_history"},
          {"label": "Our Mission & Vision", "next": "mission_vision"},
          {"label": "Why Choose Us", "next": "why_choose_us"},
          {"label": "Contact Information", "next": "contact_info"},
          {"label": "Back to Main Menu", "next": "welcome"},
          {"label": "End Chat", "next": "end"}
        ]
      },
      "contact_info": {
        "type": "message",
        "message": "Get in touch with B.J. Santiago Inc.:\n\nAddress: 657 A. H. Lacson Street, Sampaloc, Manila, Philippines 1008\n\nPhone: +632 8781 3457 / +632 8736 9121\n\nTelefax: +632 8743 6851\n\nEmail: bjsantiagoinc@gmail.com / bjsantiagoinc@yahoo.com\n\nWe''re here to help with all your printing needs! Feel free to reach out for quick, honest, and expert advice in all stages of production - from design to delivery.",
        "options": [
          {"label": "Company History", "next": "company_history"},
          {"label": "Our Mission & Vision", "next": "mission_vision"},
          {"label": "Why Choose Us", "next": "why_choose_us"},
          {"label": "Our Technology", "next": "technology"},
          {"label": "Back to Main Menu", "next": "welcome"},
          {"label": "End Chat", "next": "end"}
        ]
      },
      "end": {
        "type": "end",
        "message": "Thank you for learning about B.J. Santiago Inc.! We look forward to serving your printing needs. Have a great day!"
      }
    }
  }'::jsonb,
  true,
  'customer'
);
