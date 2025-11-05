import { supabase } from '@lib/supabase';
import { IMAGE_UPLOAD_CONFIG } from '@features/chat/config/uploadConfig';
import { convertMultipleHeicToJpeg } from './convertHeicToJpeg';

export interface MultipleUploadResult {
  urls: string[];
  errors: string[];
}

export async function uploadOrderImages(
  files: File[],
  orderId: string,
  customerId: string,
  onProgress?: (value: number) => void
): Promise<MultipleUploadResult> {
  const urls: string[] = [];
  const errors: string[] = [];

  try {
    const maxFiles = (IMAGE_UPLOAD_CONFIG as any).orders?.maxFilesPerUpload ?? IMAGE_UPLOAD_CONFIG.ticket.maxFilesPerUpload;
    if (files.length > maxFiles) {
      return {
        urls: [],
        errors: [`You can upload a maximum of ${maxFiles} images at once.`],
      };
    }

    const allowedTypes = IMAGE_UPLOAD_CONFIG.allowedTypes;
    for (const f of files) {
      if (!allowedTypes.includes(f.type)) {
        errors.push(`${f.name}: Invalid file type. Please upload photos only.`);
      }
    }
    if (errors.length > 0) {
      return { urls: [], errors };
    }

    const processedFiles = await convertMultipleHeicToJpeg(files);

    const maxFileSize = (IMAGE_UPLOAD_CONFIG as any).orders?.maxFileSize ?? IMAGE_UPLOAD_CONFIG.ticket.maxFileSize;
    for (const f of processedFiles) {
      if (f.size > maxFileSize) {
        errors.push(`${f.name}: File too large.`);
      }
    }

    const totalSize = processedFiles.reduce((sum, f) => sum + f.size, 0);
    const maxTotalSize = (IMAGE_UPLOAD_CONFIG as any).orders?.maxTotalSize ?? IMAGE_UPLOAD_CONFIG.ticket.maxTotalSize;
    if (totalSize > maxTotalSize) {
      return {
        urls: [],
        errors: ['Total file size exceeds limit. Please reduce images.'],
      };
    }

    if (errors.length > 0) {
      return { urls: [], errors };
    }

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
        const identifier = orderId || 'pending';
        const filePath = `${customerId}/${identifier}/${fileName}`;

        const { error } = await supabase.storage
          .from('order-uploads')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (error) {
          errors.push(`${file.name}: Upload failed - ${error.message}`);
          continue;
        }

        const fileUrl = `supabase://order-uploads/${filePath}`;
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


