create table public.chat_message_meta (
  message_id uuid not null,
  sender_role text not null,
  node_id text null,
  constraint chat_message_meta_pkey primary key (message_id),
  constraint chat_message_meta_message_id_fkey foreign KEY (message_id) references chat_messages (message_id) on delete CASCADE,
  constraint chat_message_meta_node_id_fkey foreign KEY (node_id) references chat_flow_nodes (node_id),
  constraint chat_message_meta_sender_role_check check (
    (
      sender_role = any (
        array['customer'::text, 'admin'::text, 'printy'::text]
      )
    )
  )
) TABLESPACE pg_default;

-- sample table data:
insert into public.chat_message_meta (message_id, sender_role, node_id) values
  ('13775639-d7a4-4db6-95f5-456480d3cf28', 'printy', 'end'),
  ('1528e488-ed50-43ac-a4a0-e8de5e8d1b85', 'customer', null),
  ('1602f373-1bbd-4d75-bb25-047564672cf1', 'customer', null),
  ('1a24ae69-9a5d-41f7-b260-03fa11ac487e', 'printy', 'end'),
  ('1ad92ce7-d017-4519-86d6-ae58aaf1704b', 'printy', 'about_us_start');