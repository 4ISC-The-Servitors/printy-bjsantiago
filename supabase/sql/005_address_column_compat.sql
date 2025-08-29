-- Compatibility migration: add standard columns expected by RPCs
-- It does NOT drop/rename your existing columns. It only adds and backfills.

-- REGION: add name from region
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='region' and column_name='name'
  ) then
    alter table public.region add column name text;
    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='region' and column_name='region'
    ) then
      update public.region set name = region where name is null;
    end if;
  end if;
  -- Optional unique index on name
  create unique index if not exists idx_region_name_unique on public.region(name);
end $$;

-- PROVINCE: add name from province_name
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='province' and column_name='name'
  ) then
    alter table public.province add column name text;
    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='province' and column_name='province_name'
    ) then
      update public.province set name = province_name where name is null;
    end if;
  end if;
  create index if not exists idx_province_region_name on public.province(region_id, name);
end $$;

-- CITY: add name from city_name
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='city' and column_name='name'
  ) then
    alter table public.city add column name text;
    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='city' and column_name='city_name'
    ) then
      update public.city set name = city_name where name is null;
    end if;
  end if;
  create index if not exists idx_city_province_name on public.city(province_id, name);
end $$;

-- BARANGAY: add name from brgy_name
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='barangay' and column_name='name'
  ) then
    alter table public.barangay add column name text;
    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='barangay' and column_name='brgy_name'
    ) then
      update public.barangay set name = brgy_name where name is null;
    end if;
  end if;
  create index if not exists idx_barangay_city_name on public.barangay(city_id, name);
end $$;

-- STREET: add name from street_name
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='street' and column_name='name'
  ) then
    alter table public.street add column name text;
    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='street' and column_name='street_name'
    ) then
      update public.street set name = street_name where name is null;
    end if;
  end if;
  create index if not exists idx_street_barangay_name on public.street(barangay_id, name);
end $$;

-- BUILDING: ensure standard columns number, name; backfill from bldg_num/bldg_name
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='building' and column_name='number'
  ) then
    alter table public.building add column number text;
    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='building' and column_name='bldg_num'
    ) then
      update public.building set number = bldg_num where number is null;
    end if;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='building' and column_name='name'
  ) then
    alter table public.building add column name text;
    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='building' and column_name='bldg_name'
    ) then
      update public.building set name = bldg_name where name is null;
    end if;
  end if;
  create index if not exists idx_building_street_number_name on public.building(street_id, number, name);
end $$;

-- ZIPCODE: ensure standard column code; backfill from zip_code
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='zipcode' and column_name='code'
  ) then
    alter table public.zipcode add column code text;
    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='zipcode' and column_name='zip_code'
    ) then
      update public.zipcode set code = zip_code where code is null;
    end if;
  end if;
  create index if not exists idx_zipcode_city_code on public.zipcode(city_id, code);
end $$;


