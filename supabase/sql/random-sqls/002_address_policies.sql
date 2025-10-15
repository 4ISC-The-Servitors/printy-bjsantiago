-- RLS policies for address hierarchy

-- Enable RLS
alter table if exists public.region enable row level security;
alter table if exists public.province enable row level security;
alter table if exists public.city enable row level security;
alter table if exists public.zipcode enable row level security;
alter table if exists public.barangay enable row level security;
alter table if exists public.street enable row level security;
alter table if exists public.building enable row level security;
alter table if exists public.location enable row level security;

-- Basic policies: any authenticated user can read and insert
create policy if not exists "Authenticated can select region" on public.region for select using (auth.role() = 'authenticated');
create policy if not exists "Authenticated can insert region" on public.region for insert with check (auth.role() = 'authenticated');

create policy if not exists "Authenticated can select province" on public.province for select using (auth.role() = 'authenticated');
create policy if not exists "Authenticated can insert province" on public.province for insert with check (auth.role() = 'authenticated');

create policy if not exists "Authenticated can select city" on public.city for select using (auth.role() = 'authenticated');
create policy if not exists "Authenticated can insert city" on public.city for insert with check (auth.role() = 'authenticated');

create policy if not exists "Authenticated can select zipcode" on public.zipcode for select using (auth.role() = 'authenticated');
create policy if not exists "Authenticated can insert zipcode" on public.zipcode for insert with check (auth.role() = 'authenticated');

create policy if not exists "Authenticated can select barangay" on public.barangay for select using (auth.role() = 'authenticated');
create policy if not exists "Authenticated can insert barangay" on public.barangay for insert with check (auth.role() = 'authenticated');

create policy if not exists "Authenticated can select street" on public.street for select using (auth.role() = 'authenticated');
create policy if not exists "Authenticated can insert street" on public.street for insert with check (auth.role() = 'authenticated');

create policy if not exists "Authenticated can select building" on public.building for select using (auth.role() = 'authenticated');
create policy if not exists "Authenticated can insert building" on public.building for insert with check (auth.role() = 'authenticated');

create policy if not exists "Authenticated can select location" on public.location for select using (auth.role() = 'authenticated');
create policy if not exists "Authenticated can insert location" on public.location for insert with check (auth.role() = 'authenticated');


