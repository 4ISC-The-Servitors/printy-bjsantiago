import { supabase } from '../../lib/supabase';

export const useInquiryActions = () => {
  const updateInquiryStatus = async (inquiryId: string, status: string) => {
    const { error } = await supabase
      .from('inquiries')
      .update({ inquiry_status: status })
      .eq('inquiry_id', inquiryId);
    if (error) throw error;
  };

  const assignInquiry = async (inquiryId: string, assignee: string) => {
    const { error } = await supabase
      .from('inquiries')
      .update({ assigned_to: assignee })
      .eq('inquiry_id', inquiryId);
    if (error) throw error;
  };

  const saveResolutionComment = async (inquiryId: string, comment: string) => {
    const { error } = await supabase
      .from('inquiries')
      .update({ resolution_comments: comment })
      .eq('inquiry_id', inquiryId);
    if (error) throw error;
  };

  return { updateInquiryStatus, assignInquiry, saveResolutionComment };
};

export type InquiryActions = ReturnType<typeof useInquiryActions>;


