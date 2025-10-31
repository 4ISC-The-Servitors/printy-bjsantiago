import heic2any from 'heic2any';

/**
 * Converts HEIC/HEIF images to JPEG for browser compatibility
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!file.type.includes('heic') && !file.type.includes('heif')) {
    return file;
  }

  const convertedBlob = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.85,
  });

  const convertedFile = new File(
    [convertedBlob as Blob],
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
