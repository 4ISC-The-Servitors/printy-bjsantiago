-- Compatibility wrapper that accepts normalized params and proxies to upsert_full_address

create or replace function public.upsert_location_from_meta(
  p_region text,
  p_province text,
  p_city text,
  p_zip_code text,
  p_barangay text,
  p_street text,
  p_building_number text,
  p_building_name text
) returns uuid as $$
begin
  return public.upsert_full_address(
    p_region,
    p_province,
    p_city,
    p_zip_code,
    p_barangay,
    p_street,
    p_building_number,
    p_building_name
  );
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.upsert_location_from_meta(text, text, text, text, text, text, text, text) from public;
grant execute on function public.upsert_location_from_meta(text, text, text, text, text, text, text, text) to authenticated;


