-- RPC to upsert full address hierarchy and return location_id

create or replace function public.upsert_full_address(
  p_region text,
  p_province text,
  p_city text,
  p_zip_code text,
  p_barangay text,
  p_street text,
  p_building_number text,
  p_building_name text
) returns uuid as $$
declare
  v_region_id uuid;
  v_province_id uuid;
  v_city_id uuid;
  v_zip_id uuid;
  v_barangay_id uuid;
  v_street_id uuid;
  v_bldg_id uuid;
  v_location_id uuid;
  v_zip_numeric numeric;
begin
  -- Region (region.region_name)
  if p_region is null or length(trim(p_region)) = 0 then
    raise exception 'Region is required';
  end if;
  select region_id into v_region_id
  from public.region
  where lower(region_name) = lower(trim(p_region))
  limit 1;
  if v_region_id is null then
    v_region_id := gen_random_uuid();
    insert into public.region(region_id, region_name)
    values (v_region_id, trim(p_region));
  end if;

  -- Province (province.province_name)
  if p_province is null or length(trim(p_province)) = 0 then
    raise exception 'Province is required';
  end if;
  select province_id into v_province_id
  from public.province
  where region_id = v_region_id and lower(province_name) = lower(trim(p_province))
  limit 1;
  if v_province_id is null then
    v_province_id := gen_random_uuid();
    insert into public.province(province_id, region_id, province_name)
    values (v_province_id, v_region_id, trim(p_province));
  end if;

  -- City (city.city_name)
  if p_city is null or length(trim(p_city)) = 0 then
    raise exception 'City is required';
  end if;
  select city_id into v_city_id
  from public.city
  where province_id = v_province_id and lower(city_name) = lower(trim(p_city))
  limit 1;
  if v_city_id is null then
    v_city_id := gen_random_uuid();
    insert into public.city(city_id, province_id, city_name)
    values (v_city_id, v_province_id, trim(p_city));
  end if;

  -- Zipcode (optional) -> zipcode.zip_code (numeric)
  if p_zip_code is not null and length(trim(p_zip_code)) > 0 then
    begin
      v_zip_numeric := nullif(regexp_replace(trim(p_zip_code), '\\D', '', 'g'), '')::numeric;
    exception when invalid_text_representation then
      v_zip_numeric := null;
    end;
    if v_zip_numeric is not null then
      select zip_id into v_zip_id
      from public.zipcode
      where city_id = v_city_id and zip_code = v_zip_numeric
      limit 1;
      if v_zip_id is null then
        v_zip_id := gen_random_uuid();
        insert into public.zipcode(zip_id, city_id, zip_code)
        values (v_zip_id, v_city_id, v_zip_numeric);
      end if;
    else
      v_zip_id := null;
    end if;
  else
    v_zip_id := null;
  end if;

  -- Barangay (barangay.brgy_name)
  if p_barangay is null or length(trim(p_barangay)) = 0 then
    raise exception 'Barangay is required';
  end if;
  select brgy_id into v_barangay_id
  from public.barangay
  where city_id = v_city_id and lower(brgy_name) = lower(trim(p_barangay))
  limit 1;
  if v_barangay_id is null then
    v_barangay_id := gen_random_uuid();
    insert into public.barangay(brgy_id, city_id, brgy_name)
    values (v_barangay_id, v_city_id, trim(p_barangay));
  end if;

  -- Street (street.street_name)
  if p_street is null or length(trim(p_street)) = 0 then
    raise exception 'Street is required';
  end if;
  select street_id into v_street_id
  from public.street
  where brgy_id = v_barangay_id and lower(street_name) = lower(trim(p_street))
  limit 1;
  if v_street_id is null then
    v_street_id := gen_random_uuid();
    insert into public.street(street_id, brgy_id, street_name)
    values (v_street_id, v_barangay_id, trim(p_street));
  end if;

  -- Building (optional) (building.bldg_num, building.bldg_name)
  if (p_building_number is not null and length(trim(p_building_number)) > 0)
     or (p_building_name is not null and length(trim(p_building_name)) > 0) then
    select bldg_id into v_bldg_id
    from public.building
    where street_id = v_street_id
      and coalesce(bldg_num, '') = coalesce(nullif(trim(p_building_number), ''), '')
      and coalesce(bldg_name, '') = coalesce(nullif(trim(p_building_name), ''), '')
    limit 1;
    if v_bldg_id is null then
      v_bldg_id := gen_random_uuid();
      insert into public.building(bldg_id, street_id, bldg_num, bldg_name)
      values (v_bldg_id, v_street_id, nullif(trim(p_building_number), ''), nullif(trim(p_building_name), ''));
    end if;
  else
    v_bldg_id := null;
  end if;

  -- Location (aggregated) per your schema: location holds bldg_id and zip_id, plus duplicates
  -- Try to find existing location by bldg_id + zip_id
  select location_id into v_location_id
  from public.location
  where coalesce(bldg_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(v_bldg_id, '00000000-0000-0000-0000-000000000000'::uuid)
    and coalesce(zip_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(v_zip_id, '00000000-0000-0000-0000-000000000000'::uuid)
  limit 1;
  if v_location_id is null then
    v_location_id := gen_random_uuid();
    insert into public.location(
      location_id, bldg_id, zip_id, bldg_name, bldg_num, zip_code
    ) values (
      v_location_id, v_bldg_id, v_zip_id, nullif(trim(p_building_name), ''), nullif(trim(p_building_number), ''), v_zip_numeric
    );
  end if;

  return v_location_id;
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.upsert_full_address(text, text, text, text, text, text, text, text) from public;
grant execute on function public.upsert_full_address(text, text, text, text, text, text, text, text) to authenticated;


