-- Seed data for About Us flow

-- Flow
INSERT INTO public.chat_flows (flow_id, title, active)
VALUES ('about', 'About Us', true)
ON CONFLICT (flow_id) DO UPDATE SET title = EXCLUDED.title, active = EXCLUDED.active;

-- Nodes
INSERT INTO public.chat_flow_nodes (node_id, flow_id, node_type, text, is_initial) VALUES
  ('about_us_start','about','start','Hi! I''m Printy. What do you want to know about B.J. Santiago Inc.?', true)
ON CONFLICT (node_id) DO NOTHING;

INSERT INTO public.chat_flow_nodes (node_id, flow_id, node_type, text, is_initial) VALUES
  ('company_history','about','message','B.J. Santiago Inc. was founded in 1992 and has been serving numerous clients with offset, large-format, and digital printing.', false),
  ('contact_us','about','message','You can contact us at +63 917 123 4567.', false),
  ('end','about','end','Thank you for chatting with Printy! Have a great day.', false)
ON CONFLICT (node_id) DO NOTHING;

-- Options
INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order) VALUES
  ('about','about_us_start','Can I know more about the history of the company?','company_history',0)
ON CONFLICT DO NOTHING;

INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order) VALUES
  ('about','about_us_start','How can I contact you?','contact_us',1)
ON CONFLICT DO NOTHING;

INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order) VALUES
  ('about','about_us_start','End Chat','end',2)
ON CONFLICT DO NOTHING;

INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order) VALUES
  ('about','company_history','How can I contact you?','contact_us',0)
ON CONFLICT DO NOTHING;

INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order) VALUES
  ('about','company_history','End Chat','end',1)
ON CONFLICT DO NOTHING;

INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order) VALUES
  ('about','contact_us','Can I know more about the history of the company?','company_history',0)
ON CONFLICT DO NOTHING;

INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order) VALUES
  ('about','contact_us','End Chat','end',1)
ON CONFLICT DO NOTHING;


