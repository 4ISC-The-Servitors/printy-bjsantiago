export const IMAGE_UPLOAD_CONFIG = {
  // Ticket uploads (multiple images)
  ticket: {
    maxFileSize: 5 * 1024 * 1024, // 5MB per file
    maxFilesPerUpload: 3, // 3 images max
    maxTotalSize: 10 * 1024 * 1024, // 10MB total per upload
  },

  // Payment proof uploads (single image)
  payment: {
    maxFileSize: 5 * 1024 * 1024, // 5MB per file
    maxFilesPerUpload: 1, // Single image only
    maxTotalSize: 5 * 1024 * 1024, // 5MB total
  },

  // Supported file types (mobile-friendly)
  allowedTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic', // iOS default
    'image/heif', // iOS/some Android
    'image/avif', // Future-proofing
  ],

  // File types that need conversion
  conversionRequired: ['image/heic', 'image/heif'],
};

export type ImageUploadConfig = typeof IMAGE_UPLOAD_CONFIG;






