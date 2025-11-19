import { supabase } from '@lib/supabase';

export interface AboutSection {
  about_id: string;
  about_name: string;
  description: string;
  created_at: string;
  created_by?: string | null;
  updated_at: string;
  updated_by?: string | null;
}

export class AboutCompanyService {
  static async listSections(): Promise<AboutSection[]> {
    const { data, error } = await supabase
      .from('about_bj_santiago')
      .select(
        'about_id, about_name, description, created_at, created_by, updated_at, updated_by'
      )
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load company profile sections:', error);
      throw error;
    }

    return data ?? [];
  }
}

