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
    const maxFiles =
      (IMAGE_UPLOAD_CONFIG as any).orders?.maxFilesPerUpload ??
      IMAGE_UPLOAD_CONFIG.ticket.maxFilesPerUpload;
    if (files.length > maxFiles) {
      return {
        urls: [],
        errors: [`You can upload a maximum of ${maxFiles} files at once.`],
      };
    }

    const allowedTypes = IMAGE_UPLOAD_CONFIG.allowedTypes;
    for (const f of files) {
      if (!allowedTypes.includes(f.type)) {
        errors.push(
          `${f.name}: Invalid file type. Please upload images or PDFs only.`
        );
      }
    }
    if (errors.length > 0) {
      return { urls: [], errors };
    }

    // Convert HEIC files to JPEG (PDFs and other files pass through unchanged)
    const processedFiles = await convertMultipleHeicToJpeg(files);

    const maxFileSize =
      (IMAGE_UPLOAD_CONFIG as any).orders?.maxFileSize ??
      IMAGE_UPLOAD_CONFIG.ticket.maxFileSize;
    for (const f of processedFiles) {
      if (f.size > maxFileSize) {
        errors.push(`${f.name}: File too large (max 10MB per file).`);
      }
    }

    const totalSize = processedFiles.reduce((sum, f) => sum + f.size, 0);
    const maxTotalSize =
      (IMAGE_UPLOAD_CONFIG as any).orders?.maxTotalSize ??
      IMAGE_UPLOAD_CONFIG.ticket.maxTotalSize;
    if (totalSize > maxTotalSize) {
      return {
        urls: [],
        errors: [
          'Total file size exceeds 10MB. Please reduce file size or number of files.',
        ],
      };
    }

    if (errors.length > 0) {
      return { urls: [], errors };
    }

    // Helper function to find an available filename within a session folder
    const findAvailableFileName = async (
      baseFileName: string,
      folderPath: string,
      bucket: string
    ): Promise<string> => {
      // Split filename into name and extension
      const lastDotIndex = baseFileName.lastIndexOf('.');
      const baseName =
        lastDotIndex > 0
          ? baseFileName.substring(0, lastDotIndex)
          : baseFileName;
      const extension =
        lastDotIndex > 0 ? baseFileName.substring(lastDotIndex) : '';

      // Check if files exist in the session folder
      const { data: listData } = await supabase.storage
        .from(bucket)
        .list(folderPath, {
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

    const identifier = orderId || 'pending';
    const folderPath = `${customerId}/${identifier}`;

    for (let i = 0; i < processedFiles.length; i++) {
      const file = processedFiles[i];
      try {
        if (onProgress) {
          const base = Math.floor((i / processedFiles.length) * 100);
          onProgress(Math.min(99, base));
        }

        // Generate filename using only the original filename (sanitized)
        // Format: sanitized_filename.ext (or filename_01.ext, filename_02.ext, etc. if duplicate exists)
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = await findAvailableFileName(
          sanitizedFileName,
          folderPath,
          'order-uploads'
        );
        const filePath = `${folderPath}/${fileName}`;

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
