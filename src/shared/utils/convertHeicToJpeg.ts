/**
 * Converts HEIC/HEIF images to JPEG for browser compatibility
 * Dynamically imports heic2any to reduce initial bundle size
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!file.type.includes('heic') && !file.type.includes('heif')) {
    return file;
  }

  // Dynamically import heic2any only when HEIC conversion is needed
  const heic2any = (await import('heic2any')).default;
  const convertedBlob = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.85,
  });

  // heic2any may return a Blob or an array of Blobs
  // For single file conversion, it typically returns a single Blob
  // Handle both cases for safety
  const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

  const convertedFile = new File(
    [blob as Blob],
    file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
    { type: 'image/jpeg' }
  );

  return convertedFile;
}

/**
 * Batch convert multiple files; converts HEIC/HEIF only
 */
export async function convertMultipleHeicToJpeg(
  files: File[]
): Promise<File[]> {
  return Promise.all(files.map(f => convertHeicToJpeg(f)));
}
