-- Fix secure views to display existing plaintext rows until backfilled

-- chat_messages_secure: prefer decrypted, fallback to plaintext
create or replace view chat_messages_secure as
select
  message_id,
  session_id,
  sent_at,
  coalesce(priv.decrypt_text(message_text_enc), message_text) as message_text
from chat_messages;

grant select on chat_messages_secure to authenticated, service_role;

-- inquiries_secure: prefer decrypted, fallback to plaintext
create or replace view inquiries_secure as
select
  inquiry_id,
  customer_id,
  inquiry_type,
  inquiry_status,
  resolution_comments,
  received_at,
  coalesce(priv.decrypt_text(inquiry_message_enc), inquiry_message) as inquiry_message
from inquiries;

grant select on inquiries_secure to authenticated, service_role;

-- inquiries_secure_with_customer: same coalesce + join
create or replace view inquiries_secure_with_customer as
select
  i.inquiry_id,
  i.customer_id,
  i.inquiry_type,
  i.inquiry_status,
  i.resolution_comments,
  i.received_at,
  coalesce(priv.decrypt_text(i.inquiry_message_enc), i.inquiry_message) as inquiry_message,
  c.first_name as customer_first_name,
  c.last_name as customer_last_name
from inquiries i
left join customer c on c.customer_id = i.customer_id;

grant select on inquiries_secure_with_customer to authenticated, service_role;




