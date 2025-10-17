/**
 * uploadPaymentProof
 * Uploads payment proof files to Supabase Storage
 */

import { supabase } from '../../lib/supabase';

export interface UploadResult {
  url: string;
  error?: string;
}

/**
 * Uploads a payment proof file to Supabase Storage
 * @param file - The file to upload
 * @param orderId - The order ID for organizing the file
 * @param customerId - The customer ID for organizing the file
 * @returns Promise with upload result containing URL or error
 */
export async function uploadPaymentProof(
  file: File,
  orderId: string,
  customerId: string
): Promise<UploadResult> {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        url: '',
        error: 'Invalid file type. Please upload an image file (JPEG, PNG, GIF, or WebP).'
      };
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return {
        url: '',
        error: 'File too large. Please upload an image smaller than 5MB.'
      };
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${orderId}_${timestamp}.${fileExtension}`;
    const filePath = `${customerId}/${fileName}`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        url: '',
        error: `Upload failed: ${error.message}`
      };
    }

    // For private bucket, we need to construct a proper URL
    // This will be used by the chat system to identify uploaded files
    const fileUrl = `supabase://payment-proofs/${filePath}`;

    return {
      url: fileUrl
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      url: '',
      error: error instanceof Error ? error.message : 'An unexpected error occurred during upload.'
    };
  }
}

/**
 * Uploads a payment method image to Supabase Storage (for admin use)
 * @param file - The file to upload
 * @param methodType - The type of payment method (bank_transfer or qrph)
 * @returns Promise with upload result containing URL or error
 */
export async function uploadPaymentMethod(
  file: File,
  methodType: 'bank_transfer' | 'qrph'
): Promise<UploadResult> {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        url: '',
        error: 'Invalid file type. Please upload an image file (JPEG, PNG, GIF, or WebP).'
      };
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return {
        url: '',
        error: 'File too large. Please upload an image smaller than 5MB.'
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${methodType}_${timestamp}.${fileExtension}`;
    const filePath = `${methodType}/${fileName}`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('payment-methods')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        url: '',
        error: `Upload failed: ${error.message}`
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('payment-methods')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return {
        url: '',
        error: 'Failed to get public URL for uploaded file.'
      };
    }

    return {
      url: urlData.publicUrl
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      url: '',
      error: error instanceof Error ? error.message : 'An unexpected error occurred during upload.'
    };
  }
}
