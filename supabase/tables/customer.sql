create table public.customer (
  customer_id uuid not null,
  first_name character varying null default ''::character varying,
  last_name character varying null default ''::character varying,
  contact_no character varying null default ''::character varying,
  email_address character varying null default ''::character varying,
  customer_type character varying null default ''::character varying, -- admin, regular or valued (refers to customer), superadmin
  location_id uuid not null,
  constraint customer_pkey primary key (customer_id),
  constraint customer_location_key_key unique (location_id),
  constraint customer_location_id_fkey foreign KEY (location_id) references location (location_id)
) TABLESPACE pg_default;

create unique INDEX IF not exists customer_email_unique_ci on public.customer using btree (lower((email_address)::text)) TABLESPACE pg_default;