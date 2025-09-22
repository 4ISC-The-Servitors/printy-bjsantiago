import { invokeEdge } from './client';

export interface SubmitInquiryPayload {
  inquiry_id: string;
  inquiry_message: string;
  inquiry_type: string | null;
}

export interface SubmitInquiryResponse {
  inquiry_id: string;
}

export const submitInquiry = async (
  payload: SubmitInquiryPayload
): Promise<SubmitInquiryResponse> => {
  return invokeEdge<SubmitInquiryResponse, SubmitInquiryPayload>('inquiries-submit', payload);
};

export interface UpdateInquiryStatusPayload {
  inquiry_id: string;
  inquiry_status: string;
}

export const updateInquiryStatus = async (payload: UpdateInquiryStatusPayload) => {
  return invokeEdge('inquiries-update-status', payload);
};

export interface AssignInquiryPayload {
  inquiry_id: string;
  assigned_to: string;
}

export const assignInquiry = async (payload: AssignInquiryPayload) => {
  return invokeEdge('inquiries-assign', payload);
};

export interface SaveResolutionPayload {
  inquiry_id: string;
  resolution_comments: string;
}

export const saveResolutionComment = async (payload: SaveResolutionPayload) => {
  return invokeEdge('inquiries-save-resolution', payload);
};

export interface GetInquiryByIdPayload {
  inquiry_id: string;
}

export interface GetInquiryByIdResponse {
  inquiry_id: string;
  inquiry_message: string;
  inquiry_type: string | null;
  inquiry_status: string;
  resolution_comments: string | null;
  received_at: string;
}

export const getInquiryById = async (
  payload: GetInquiryByIdPayload
): Promise<GetInquiryByIdResponse | null> => {
  return invokeEdge<GetInquiryByIdResponse | null, GetInquiryByIdPayload>(
    'inquiries-get-by-id',
    payload
  );
};


