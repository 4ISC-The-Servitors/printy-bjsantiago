export const IMAGE_UPLOAD_CONFIG = {
  // Ticket uploads (multiple files)
  ticket: {
    maxFileSize: 10 * 1024 * 1024, // 10MB per file
    maxFilesPerUpload: 3, // 3 files max
    maxTotalSize: 10 * 1024 * 1024, // 10MB total per upload
  },

  // Payment proof uploads (single file)
  payment: {
    maxFileSize: 10 * 1024 * 1024, // 10MB per file
    maxFilesPerUpload: 1, // Single file only
    maxTotalSize: 10 * 1024 * 1024, // 10MB total
  },

  // Supported file types (static images + PDFs)
  allowedTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic', // iOS default
    'image/heif', // iOS/some Android
    'image/avif', // Future-proofing
    'application/pdf', // PDF support
  ],

  // File types that need conversion
  conversionRequired: ['image/heic', 'image/heif'],
};

export type ImageUploadConfig = typeof IMAGE_UPLOAD_CONFIG;
