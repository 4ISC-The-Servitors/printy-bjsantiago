-- Address hierarchy schema
-- Run this in Supabase SQL editor or via migrations

-- Enable required extension
create extension if not exists "pgcrypto"; -- for gen_random_uuid

-- REGION
create table if not exists public.region (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text unique,
  created_at timestamptz not null default now()
);

-- PROVINCE
create table if not exists public.province (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.region(id) on delete restrict,
  name text not null,
  code text,
  created_at timestamptz not null default now(),
  unique(region_id, name)
);

-- CITY
create table if not exists public.city (
  id uuid primary key default gen_random_uuid(),
  province_id uuid not null references public.province(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  unique(province_id, name)
);

-- ZIPCODE (connected to city)
create table if not exists public.zipcode (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.city(id) on delete restrict,
  code text not null,
  created_at timestamptz not null default now(),
  unique(city_id, code)
);

-- BARANGAY
create table if not exists public.barangay (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.city(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  unique(city_id, name)
);

-- STREET
create table if not exists public.street (
  id uuid primary key default gen_random_uuid(),
  barangay_id uuid not null references public.barangay(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  unique(barangay_id, name)
);

-- BUILDING / HOUSE
create table if not exists public.building (
  id uuid primary key default gen_random_uuid(),
  street_id uuid not null references public.street(id) on delete restrict,
  number text, -- house/building number
  name text,   -- optional building name
  created_at timestamptz not null default now(),
  unique(street_id, coalesce(number, ''), coalesce(name, ''))
);

-- LOCATION (aggregated reference)
create table if not exists public.location (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.region(id) on delete restrict,
  province_id uuid not null references public.province(id) on delete restrict,
  city_id uuid not null references public.city(id) on delete restrict,
  zipcode_id uuid references public.zipcode(id) on delete set null,
  barangay_id uuid not null references public.barangay(id) on delete restrict,
  street_id uuid not null references public.street(id) on delete restrict,
  building_id uuid references public.building(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(region_id, province_id, city_id, coalesce(zipcode_id, '00000000-0000-0000-0000-000000000000'::uuid), barangay_id, street_id, coalesce(building_id, '00000000-0000-0000-0000-000000000000'::uuid))
);


