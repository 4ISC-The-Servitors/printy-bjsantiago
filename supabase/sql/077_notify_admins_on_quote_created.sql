
begin
  if exists (
    select 1 from public.customer vc
    where vc.customer_id = new.customer_id
      and vc.customer_type = 'valued'
  ) then
    insert into notifications (id, customer_id, title, message, type, category, is_read, created_at)
    select gen_random_uuid(),
           c.customer_id,
           'Urgent Quote Request',
           'Quote ' || coalesce(new.display_id, new.quote_id::text) || ' was submitted by ' || (
             select trim(first_name || ' ' || last_name)
             from public.customer
             where customer_id = new.customer_id
           ) || '.',
           'warning',
           'quote',
           false,
           now()
    from public.customer c
    where c.customer_type = 'admin';
  else
    insert into notifications (id, customer_id, title, message, type, category, is_read, created_at)
    select gen_random_uuid(),
           c.customer_id,
           'Quote Request',
           'Quote ' || coalesce(new.display_id, new.quote_id::text) || ' was submitted by a customer.',
           'info',
           'quote',
           false,
           now()
    from customer c
    where c.customer_type = 'admin';
  end if;

  return new;
end;
