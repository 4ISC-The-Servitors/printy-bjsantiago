import json
import os

# Create directories
os.makedirs('supabase/tables', exist_ok=True)
os.makedirs('supabase/indexes', exist_ok=True)
os.makedirs('supabase/triggers', exist_ok=True)

# Index definitions (from the previous query result)
indexes = [
    {"schemaname": "public", "tablename": "barangay", "indexname": "barangay_city_id_idx", "indexdef": "CREATE INDEX barangay_city_id_idx ON public.barangay USING btree (city_id)"},
    {"schemaname": "public", "tablename": "barangay", "indexname": "barangay_pkey", "indexdef": "CREATE UNIQUE INDEX barangay_pkey ON public.barangay USING btree (brgy_id)"},
    # Will populate from actual data
]

# Trigger definitions (from the previous query result)
triggers = [
    {"trigger_name": "trg_provision_customer", "table_name": "auth.users", "function_name": "provision_customer_from_auth", "trigger_definition": "CREATE TRIGGER trg_provision_customer AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION provision_customer_from_auth()"},
    {"trigger_name": "set_timestamp_chat_flows_v2", "table_name": "chat_flows_v2", "function_name": "trigger_set_timestamp", "trigger_definition": "CREATE TRIGGER set_timestamp_chat_flows_v2 BEFORE UPDATE ON public.chat_flows_v2 FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp()"},
    {"trigger_name": "set_ticket_display_id_v2", "table_name": "inquiries_v2", "function_name": "generate_ticket_display_id", "trigger_definition": "CREATE TRIGGER set_ticket_display_id_v2 BEFORE INSERT ON public.inquiries_v2 FOR EACH ROW EXECUTE FUNCTION generate_ticket_display_id()"},
    {"trigger_name": "trigger_notify_admins_on_ticket_create", "table_name": "inquiries_v2", "function_name": "notify_admins_on_ticket_create", "trigger_definition": "CREATE TRIGGER trigger_notify_admins_on_ticket_create AFTER INSERT ON public.inquiries_v2 FOR EACH ROW EXECUTE FUNCTION notify_admins_on_ticket_create()"},
    {"trigger_name": "trigger_ticket_notifications_v2", "table_name": "inquiries_v2", "function_name": "notify_ticket_events", "trigger_definition": "CREATE TRIGGER trigger_ticket_notifications_v2 AFTER UPDATE ON public.inquiries_v2 FOR EACH ROW EXECUTE FUNCTION notify_ticket_events()"},
    {"trigger_name": "update_inquiries_v2_updated_at", "table_name": "inquiries_v2", "function_name": "update_inquiries_updated_at_column", "trigger_definition": "CREATE TRIGGER update_inquiries_v2_updated_at BEFORE UPDATE ON public.inquiries_v2 FOR EACH ROW EXECUTE FUNCTION update_inquiries_updated_at_column()"},
    {"trigger_name": "set_order_display_id", "table_name": "orders", "function_name": "generate_order_display_id", "trigger_definition": "CREATE TRIGGER set_order_display_id BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION generate_order_display_id()"},
    {"trigger_name": "trigger_order_notifications", "table_name": "orders", "function_name": "notify_order_events", "trigger_definition": "CREATE TRIGGER trigger_order_notifications AFTER INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION notify_order_events()"},
    {"trigger_name": "update_orders_updated_at", "table_name": "orders", "function_name": "update_orders_updated_at", "trigger_definition": "CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_orders_updated_at()"},
    {"trigger_name": "update_payment_methods_updated_at", "table_name": "payment_methods", "function_name": "update_payment_methods_updated_at", "trigger_definition": "CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION update_payment_methods_updated_at()"},
    {"trigger_name": "trigger_payment_notifications", "table_name": "payments", "function_name": "notify_payment_events", "trigger_definition": "CREATE TRIGGER trigger_payment_notifications AFTER INSERT OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION notify_payment_events()"},
    {"trigger_name": "set_service_display_id", "table_name": "printing_services", "function_name": "generate_service_display_id", "trigger_definition": "CREATE TRIGGER set_service_display_id BEFORE INSERT ON public.printing_services FOR EACH ROW EXECUTE FUNCTION generate_service_display_id()"},
    {"trigger_name": "trigger_notify_admins_on_quote_created", "table_name": "quotes", "function_name": "notify_admins_on_quote_created", "trigger_definition": "CREATE TRIGGER trigger_notify_admins_on_quote_created AFTER INSERT ON public.quotes FOR EACH ROW EXECUTE FUNCTION notify_admins_on_quote_created()"},
    {"trigger_name": "trigger_quote_notifications", "table_name": "quotes", "function_name": "notify_quote_events", "trigger_definition": "CREATE TRIGGER trigger_quote_notifications AFTER UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION notify_quote_events()"},
    {"trigger_name": "update_quotes_updated_at", "table_name": "quotes", "function_name": "update_updated_at_column", "trigger_definition": "CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"},
]

# Write triggers
for trigger in triggers:
    trigger_name = trigger['trigger_name']
    filename = f"{trigger_name}.sql"
    filepath = os.path.join('supabase/triggers', filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(trigger['trigger_definition'] + ';')

print(f"Created {len(triggers)} trigger files")

