import { supabase } from '../../lib/supabase';

export const useInquiryActions = () => {
  const updateInquiryStatus = async (inquiryId: string, status: string) => {
    const { error } = await supabase.rpc('api_update_inquiry_status', {
      p_inquiry_id: inquiryId,
      p_status: status,
    });
    if (error) throw error;
  };

  const assignInquiry = async (_inquiryId: string, _assignee: string) => {
    // No-op placeholder (assignment not implemented in schema). Safe to keep.
    return;
  };

  const saveResolutionComment = async (inquiryId: string, comment: string) => {
    const { error } = await supabase.rpc('api_update_inquiry_resolution', {
      p_inquiry_id: inquiryId,
      p_comment: comment,
    });
    if (error) throw error;
  };

  return { updateInquiryStatus, assignInquiry, saveResolutionComment };
};

export type InquiryActions = ReturnType<typeof useInquiryActions>;
