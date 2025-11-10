import { supabase } from '@lib/supabase';

export type Region = { region_id: string; region_name: string };
export type Province = {
  province_id: string;
  province_name: string;
  region_id: string;
};
export type City = { city_id: string; city_name: string; province_id: string };

export type Option = { value: string; label: string };

const toOption = (labelKey: string, valueKey: string) => (row: any): Option => ({
  value: String(row[valueKey]),
  label: String(row[labelKey]),
});

export async function searchRegions(
  query: string,
  limit = 50
): Promise<Region[]> {
  const like = query?.trim() ? `%${query.trim()}%` : undefined;
  const base = supabase.from('region').select('region_id, region_name');
  const q = like ? base.ilike('region_name', like) : base;
  const { data, error } = await q.order('region_name', { ascending: true }).limit(limit);
  if (error) {
    console.error('Error fetching regions:', error);
    return [];
  }
  return (data || []) as Region[];
}

export async function searchProvinces(
  regionId: string,
  query: string,
  limit = 100
): Promise<Province[]> {
  if (!regionId) return [];
  const like = query?.trim() ? `%${query.trim()}%` : undefined;
  const base = supabase
    .from('province')
    .select('province_id, province_name, region_id')
    .eq('region_id', regionId);
  const q = like ? base.ilike('province_name', like) : base;
  const { data, error } = await q.order('province_name', { ascending: true }).limit(limit);
  if (error) {
    console.error('Error fetching provinces:', error);
    return [];
  }
  return (data || []) as Province[];
}

export async function searchCities(
  provinceId: string,
  query: string,
  limit = 100
): Promise<City[]> {
  if (!provinceId) return [];
  const like = query?.trim() ? `%${query.trim()}%` : undefined;
  const base = supabase
    .from('city')
    .select('city_id, city_name, province_id')
    .eq('province_id', provinceId);
  const q = like ? base.ilike('city_name', like) : base;
  const { data, error } = await q.order('city_name', { ascending: true }).limit(limit);
  if (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
  return (data || []) as City[];
}

export async function regionOptions(q = '', limit = 50): Promise<Option[]> {
  const rows = await searchRegions(q, limit);
  return rows.map(toOption('region_name', 'region_id'));
}

export async function provinceOptions(
  regionId: string,
  q = '',
  limit = 100
): Promise<Option[]> {
  const rows = await searchProvinces(regionId, q, limit);
  return rows.map(toOption('province_name', 'province_id'));
}

export async function cityOptions(
  provinceId: string,
  q = '',
  limit = 100
): Promise<Option[]> {
  const rows = await searchCities(provinceId, q, limit);
  return rows.map(toOption('city_name', 'city_id'));
}


