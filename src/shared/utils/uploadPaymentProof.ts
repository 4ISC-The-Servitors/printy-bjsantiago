/**
 * uploadPaymentProof
 * Uploads payment proof files to Supabase Storage
 */

import { supabase } from '@lib/supabase';

export interface UploadResult {
  url: string;
  error?: string;
}

/**
 * Uploads a payment proof file to Supabase Storage
 * @param file - The file to upload
 * @param _orderId - The order ID (currently unused, files are organized by customerId only)
 * @param customerId - The customer ID for organizing the file
 * @returns Promise with upload result containing URL or error
 */
export async function uploadPaymentProof(
  file: File,
  _orderId: string,
  customerId: string
): Promise<UploadResult> {
  try {
    // Validate and normalize file
    const { IMAGE_UPLOAD_CONFIG } = await import(
      '@features/chat/config/uploadConfig'
    );
    const { convertHeicToJpeg } = await import('./convertHeicToJpeg');

    const allowedTypes = IMAGE_UPLOAD_CONFIG.allowedTypes;
    if (!allowedTypes.includes(file.type)) {
      return {
        url: '',
        error:
          'Invalid file type. Please upload an image (JPEG, PNG, WebP, HEIC) or PDF.',
      };
    }

    // Convert HEIC files to JPEG (PDFs pass through unchanged)
    let processedFile = file;
    if (IMAGE_UPLOAD_CONFIG.conversionRequired.includes(file.type)) {
      processedFile = await convertHeicToJpeg(file);
    }

    // Validate file size (after conversion)
    const maxSize = IMAGE_UPLOAD_CONFIG.payment.maxFileSize;
    if (processedFile.size > maxSize) {
      return {
        url: '',
        error: 'File too large. Please upload a file smaller than 10MB.',
      };
    }

    // Generate filename using only the original filename (sanitized)
    // Format: sanitized_filename.ext (or filename_01.ext, filename_02.ext, etc. if duplicate exists)
    const sanitizedFileName = processedFile.name.replace(
      /[^a-zA-Z0-9.-]/g,
      '_'
    );

    // Helper function to find an available filename
    const findAvailableFileName = async (
      baseFileName: string,
      customerPath: string
    ): Promise<string> => {
      // Split filename into name and extension
      const lastDotIndex = baseFileName.lastIndexOf('.');
      const baseName =
        lastDotIndex > 0
          ? baseFileName.substring(0, lastDotIndex)
          : baseFileName;
      const extension =
        lastDotIndex > 0 ? baseFileName.substring(lastDotIndex) : '';

      // Check if the original filename exists
      const { data: listData } = await supabase.storage
        .from('payment-proofs')
        .list(customerPath, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (!listData || listData.length === 0) {
        // No files exist, use original filename
        return baseFileName;
      }

      // Check if original filename exists
      const fileNames = listData.map(f => f.name);
      if (!fileNames.includes(baseFileName)) {
        return baseFileName;
      }

      // Find the next available number
      // Escape the extension for regex (e.g., .pdf becomes \.pdf)
      const escapedExtension = extension.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(
        `^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_(\\d+)${escapedExtension}$`
      );
      const existingNumbers = fileNames
        .map(name => {
          const match = name.match(pattern);
          return match ? parseInt(match[1], 10) : null;
        })
        .filter((num): num is number => num !== null)
        .sort((a, b) => a - b);

      // Find the next available number
      let nextNumber = 1;
      for (const num of existingNumbers) {
        if (num === nextNumber) {
          nextNumber++;
        } else {
          break;
        }
      }

      // Format with zero-padding (01, 02, etc.)
      const paddedNumber = nextNumber.toString().padStart(2, '0');
      return `${baseName}_${paddedNumber}${extension}`;
    };

    // Find an available filename
    const fileName = await findAvailableFileName(sanitizedFileName, customerId);
    const filePath = `${customerId}/${fileName}`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, processedFile, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        url: '',
        error: `Upload failed: ${error.message}`,
      };
    }

    // For private bucket, we need to construct a proper URL
    // This will be used by the chat system to identify uploaded files
    const fileUrl = `supabase://payment-proofs/${filePath}`;

    return {
      url: fileUrl,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      url: '',
      error:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred during upload.',
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
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.type)) {
      return {
        url: '',
        error:
          'Invalid file type. Please upload an image file (JPEG, PNG, WebP) or PDF.',
      };
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return {
        url: '',
        error: 'File too large. Please upload a file smaller than 10MB.',
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
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        url: '',
        error: `Upload failed: ${error.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('payment-methods')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return {
        url: '',
        error: 'Failed to get public URL for uploaded file.',
      };
    }

    return {
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      url: '',
      error:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred during upload.',
    };
  }
}
