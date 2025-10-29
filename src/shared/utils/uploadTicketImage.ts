/**
 * uploadTicketImage
 * Uploads ticket image files to Supabase Storage
 */

import { supabase } from '@lib/supabase';

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
  console.log('[uploadTicketImage] Starting upload:', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    inquiryId,
    customerId,
    sessionId
  });

  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error('[uploadTicketImage] Invalid file type:', file.type);
      return {
        url: '',
        error:
          'Invalid file type. Please upload an image file (JPEG, PNG, GIF, or WebP).',
      };
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      console.error('[uploadTicketImage] File too large:', file.size);
      return {
        url: '',
        error: 'File too large. Please upload an image smaller than 5MB.',
      };
    }

    // Generate unique filename with timestamp
    // Replace spaces and special chars to avoid URL issues
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;

    // Use sessionId for new inquiries (when inquiryId is not available yet)
    // This allows uploading images during inquiry creation before the inquiry record exists
    const identifier = inquiryId || sessionId || 'temp';
    const filePath = `${customerId}/${identifier}/${fileName}`;

    console.log('[uploadTicketImage] Uploading to bucket:', {
      bucket: 'ticket-uploads',
      filePath,
      fileName,
      originalFileName: file.name
    });

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('ticket-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('[uploadTicketImage] Upload error:', error);
      return {
        url: '',
        error: `Upload failed: ${error.message}`,
      };
    }

    console.log('[uploadTicketImage] Upload successful:', data);

    // For private bucket, we need to construct a proper URL reference
    // This will be used by the chat system to identify uploaded files
    const fileUrl = `supabase://ticket-uploads/${filePath}`;

    console.log('[uploadTicketImage] Returning file URL:', fileUrl);

    return {
      url: fileUrl,
    };
  } catch (error) {
    console.error('[uploadTicketImage] Unexpected error:', error);
    return {
      url: '',
      error:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred during upload.',
    };
  }
}

