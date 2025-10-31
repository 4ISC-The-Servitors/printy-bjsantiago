/**
 * uploadTicketImage
 * Uploads ticket image files to Supabase Storage
 */

import { uploadTicketImage as uploadSingle } from './uploadTicketImages';

export interface UploadResult {
  url: string;
  error?: string;
}

/**
 * Uploads a ticket image file to Supabase Storage
 * @param file - The file to upload
 * @param inquiryId - The inquiry/ticket ID for organizing the file
 * @param customerId - The customer ID for organizing the file
 * @param sessionId - Optional session ID to use when inquiryId is not available yet (for new inquiries)
 * @returns Promise with upload result containing URL or error
 */
export async function uploadTicketImage(
  file: File,
  inquiryId: string,
  customerId: string,
  sessionId?: string
): Promise<UploadResult> {
  return uploadSingle(file, inquiryId, customerId, sessionId);
}
