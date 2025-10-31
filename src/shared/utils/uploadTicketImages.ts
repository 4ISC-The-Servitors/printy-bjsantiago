import { supabase } from '@lib/supabase';
import { IMAGE_UPLOAD_CONFIG } from '@features/chat/config/uploadConfig';
import { convertMultipleHeicToJpeg } from './convertHeicToJpeg';

export interface MultipleUploadResult {
  urls: string[];
  errors: string[];
}

/**
 * Uploads multiple ticket image files to Supabase Storage
 */
export async function uploadTicketImages(
  files: File[],
  inquiryId: string,
  customerId: string,
  sessionId?: string,
  onProgress?: (value: number) => void
): Promise<MultipleUploadResult> {
  const urls: string[] = [];
  const errors: string[] = [];

  try {
    // Validate file count
    const maxFiles = IMAGE_UPLOAD_CONFIG.ticket.maxFilesPerUpload;
    if (files.length > maxFiles) {
      return {
        urls: [],
        errors: [`You can upload a maximum of ${maxFiles} images at once.`],
      };
    }

    // Validate file types
    const allowedTypes = IMAGE_UPLOAD_CONFIG.allowedTypes;
    for (const f of files) {
      if (!allowedTypes.includes(f.type)) {
        errors.push(`${f.name}: Invalid file type. Please upload photos only.`);
      }
    }
    if (errors.length > 0) {
      return { urls: [], errors };
    }

    // Convert HEIC files to JPEG
    const processedFiles = await convertMultipleHeicToJpeg(files);

    // Validate individual file sizes
    const maxFileSize = IMAGE_UPLOAD_CONFIG.ticket.maxFileSize;
    for (const f of processedFiles) {
      if (f.size > maxFileSize) {
        errors.push(`${f.name}: File too large (max 5MB per image).`);
      }
    }

    // Validate total size
    const totalSize = processedFiles.reduce((sum, f) => sum + f.size, 0);
    const maxTotalSize = IMAGE_UPLOAD_CONFIG.ticket.maxTotalSize;
    if (totalSize > maxTotalSize) {
      return {
        urls: [],
        errors: ['Total file size exceeds 10MB. Please reduce images.'],
      };
    }

    if (errors.length > 0) {
      return { urls: [], errors };
    }

    // Upload each file
    for (let i = 0; i < processedFiles.length; i++) {
      const file = processedFiles[i];
      try {
        if (onProgress) {
          const base = Math.floor((i / processedFiles.length) * 100);
          onProgress(Math.min(99, base));
        }
        const timestamp = Date.now();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}_${i}_${sanitizedFileName}`;
        const identifier = inquiryId || sessionId || 'temp';
        const filePath = `${customerId}/${identifier}/${fileName}`;

        const { error } = await supabase.storage
          .from('ticket-uploads')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (error) {
          errors.push(`${file.name}: Upload failed - ${error.message}`);
          continue;
        }

        const fileUrl = `supabase://ticket-uploads/${filePath}`;
        urls.push(fileUrl);
        if (onProgress) {
          const pct = Math.round(((i + 1) / processedFiles.length) * 100);
          onProgress(Math.min(100, pct));
        }
      } catch (err) {
        errors.push(`${file.name}: Upload failed`);
      }
    }

    return { urls, errors };
  } catch (e) {
    return {
      urls: [],
      errors: [e instanceof Error ? e.message : 'An unexpected error occurred'],
    };
  }
}

// Backward compatibility - single file upload wrapper result type
export interface UploadResult {
  url: string;
  error?: string;
}

export async function uploadTicketImage(
  file: File,
  inquiryId: string,
  customerId: string,
  sessionId?: string
): Promise<UploadResult> {
  const result = await uploadTicketImages(
    [file],
    inquiryId,
    customerId,
    sessionId
  );
  if (result.urls.length > 0) {
    return { url: result.urls[0] };
  }
  return { url: '', error: result.errors[0] || 'Upload failed' };
}
