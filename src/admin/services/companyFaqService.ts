import { supabase } from '@lib/supabase';

export interface CompanyFaq {
  faq_id: string;
  question: string;
  answer: string;
  created_at: string;
  created_by?: string | null;
  updated_at: string;
  updated_by?: string | null;
}

export class CompanyFaqService {
  static async listFaqs(): Promise<CompanyFaq[]> {
    const { data, error } = await supabase
      .from('company_faqs')
      .select('faq_id, question, answer, created_at, created_by, updated_at, updated_by')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load company FAQs:', error);
      throw error;
    }

    return data ?? [];
  }
}

