import { InquiriesApi } from '../../api';

export const useInquiryActions = () => {
  const updateInquiryStatus = async (inquiryId: string, status: string) => {
    await InquiriesApi.updateInquiryStatus({ inquiry_id: inquiryId, inquiry_status: status });
  };

  const assignInquiry = async (inquiryId: string, assignee: string) => {
    await InquiriesApi.assignInquiry({ inquiry_id: inquiryId, assigned_to: assignee });
  };

  const saveResolutionComment = async (inquiryId: string, comment: string) => {
    await InquiriesApi.saveResolutionComment({ inquiry_id: inquiryId, resolution_comments: comment });
  };

  return { updateInquiryStatus, assignInquiry, saveResolutionComment };
};

export type InquiryActions = ReturnType<typeof useInquiryActions>;
