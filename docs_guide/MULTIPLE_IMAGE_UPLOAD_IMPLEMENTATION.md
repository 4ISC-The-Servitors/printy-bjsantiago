# Multiple Image Upload Implementation Plan

## Overview
Implement support for multiple image uploads (up to 3 images) for ticket support system while maintaining single image upload for payment proofs. Add mobile image format support (HEIC/HEIF) with automatic conversion to ensure browser compatibility.

---

## Research Summary

### Supabase Free Tier Constraints
- **Total Storage**: 1 GB (database + files combined)
- **File Size Limit**: 50 MB per file (API default)
- **Bandwidth**: 2 GB/month
- **Estimated Capacity**: ~150-200 tickets with 3 images each (with compression)

### Mobile Image Formats

#### iOS (iPhone/iPad)
- **Default Format**: HEIC/HEIF (since iOS 11, 2017)
- **MIME Types**: `image/heic`, `image/heif`
- **Issue**: NOT supported in Chrome, Firefox, Edge browsers
- **Solution**: Auto-convert to JPEG before upload

#### Android
- **Primary Format**: JPEG (universal)
- **Modern Devices**: WebP, AVIF
- **MIME Types**: `image/jpeg`, `image/webp`, `image/avif`

### Browser Compatibility

| Format | Chrome | Firefox | Safari | Edge | Mobile Chrome | Mobile Safari |
|--------|--------|---------|--------|------|---------------|---------------|
| JPEG   | ✅     | ✅      | ✅     | ✅   | ✅            | ✅            |
| PNG    | ✅     | ✅      | ✅     | ✅   | ✅            | ✅            |
| WebP   | ✅     | ✅      | ✅     | ✅   | ✅            | ✅            |
| GIF    | ✅     | ✅      | ✅     | ✅   | ✅            | ✅            |
| **HEIC**   | ❌     | ❌      | ✅     | ❌   | ❌            | ✅            |
| **HEIF**   | ❌     | ❌      | ✅     | ❌   | ❌            | ✅            |
| AVIF   | ✅     | ✅      | ✅     | ✅   | ✅            | ✅            |

**Critical Issue**: Current validation rejects HEIC, but iOS users upload HEIC by default → causes upload failures

---

## Implementation Plan

### Phase 1: Dependencies & Configuration

#### 1.1 Install HEIC Conversion Library
```bash
npm install heic2any
```

#### 1.2 Create Upload Configuration (`src/features/chat/config/uploadConfig.ts`)
```typescript
export const IMAGE_UPLOAD_CONFIG = {
  // Ticket uploads (multiple images)
  ticket: {
    maxFileSize: 5 * 1024 * 1024,        // 5MB per file
    maxFilesPerUpload: 3,                 // 3 images max
    maxTotalSize: 10 * 1024 * 1024,      // 10MB total per upload
  },

  // Payment proof uploads (single image)
  payment: {
    maxFileSize: 5 * 1024 * 1024,        // 5MB per file
    maxFilesPerUpload: 1,                 // Single image only
    maxTotalSize: 5 * 1024 * 1024,       // 5MB total
  },

  // Supported file types (mobile-friendly)
  allowedTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',    // iOS default
    'image/heif',    // iOS/some Android
    'image/avif'     // Future-proofing
  ],

  // File types that need conversion
  conversionRequired: ['image/heic', 'image/heif'],
};
```

---

### Phase 2: HEIC Conversion Utility

#### 2.1 Create Conversion Utility (`src/shared/utils/convertHeicToJpeg.ts`)
```typescript
import heic2any from 'heic2any';

/**
 * Converts HEIC/HEIF images to JPEG for browser compatibility
 * @param file - The HEIC/HEIF file to convert
 * @returns Promise with converted JPEG File object
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  // Check if conversion is needed
  if (!file.type.includes('heic') && !file.type.includes('heif')) {
    return file;
  }

  try {
    console.log('[convertHeicToJpeg] Converting HEIC to JPEG:', file.name);

    // Convert HEIC to JPEG blob
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.85,
    });

    // Create new File object from converted blob
    const convertedFile = new File(
      [convertedBlob as Blob],
      file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
      { type: 'image/jpeg' }
    );

    console.log('[convertHeicToJpeg] Conversion successful:', {
      original: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      converted: `${convertedFile.name} (${(convertedFile.size / 1024 / 1024).toFixed(2)} MB)`
    });

    return convertedFile;
  } catch (error) {
    console.error('[convertHeicToJpeg] Conversion failed:', error);
    throw new Error('Failed to convert HEIC image. Please try a different image.');
  }
}

/**
 * Batch convert multiple files, processing HEIC files only
 * @param files - Array of files to process
 * @returns Promise with array of converted files
 */
export async function convertMultipleHeicToJpeg(files: File[]): Promise<File[]> {
  return Promise.all(files.map(file => convertHeicToJpeg(file)));
}
```

---

### Phase 3: Update Upload Utilities

#### 3.1 Update Payment Proof Upload (`src/shared/utils/uploadPaymentProof.ts`)

**Changes:**
- Add mobile image formats to `allowedTypes`
- Add HEIC conversion before upload
- Update error messages
- **Keep single file upload only** (no multiple support)

```typescript
import { convertHeicToJpeg } from './convertHeicToJpeg';
import { IMAGE_UPLOAD_CONFIG } from '@features/chat/config/uploadConfig';

export async function uploadPaymentProof(
  file: File,
  orderId: string,
  customerId: string
): Promise<UploadResult> {
  try {
    // Validate file type
    const allowedTypes = IMAGE_UPLOAD_CONFIG.allowedTypes;
    if (!allowedTypes.includes(file.type)) {
      return {
        url: '',
        error: 'Invalid file type. Please upload a photo (JPEG, PNG, GIF, WebP, or HEIC).',
      };
    }

    // Convert HEIC to JPEG if needed
    let processedFile = file;
    if (IMAGE_UPLOAD_CONFIG.conversionRequired.includes(file.type)) {
      console.log('[uploadPaymentProof] Converting HEIC to JPEG...');
      processedFile = await convertHeicToJpeg(file);
    }

    // Validate file size (after conversion)
    const maxSize = IMAGE_UPLOAD_CONFIG.payment.maxFileSize;
    if (processedFile.size > maxSize) {
      return {
        url: '',
        error: 'File too large. Please upload an image smaller than 5MB.',
      };
    }

    // ... rest of upload logic using processedFile
  } catch (error) {
    // ... error handling
  }
}
```

#### 3.2 Update Ticket Image Upload (`src/shared/utils/uploadTicketImage.ts` → Rename to `uploadTicketImages.ts`)

**Changes:**
- Rename file to plural `uploadTicketImages.ts`
- Accept array of files (up to 3)
- Add HEIC conversion for each file
- Validate total file count and size
- Return array of URLs

```typescript
import { convertMultipleHeicToJpeg } from './convertHeicToJpeg';
import { IMAGE_UPLOAD_CONFIG } from '@features/chat/config/uploadConfig';

export interface MultipleUploadResult {
  urls: string[];
  errors: string[];
}

/**
 * Uploads multiple ticket image files to Supabase Storage
 * @param files - Array of files to upload (max 3)
 * @param inquiryId - The inquiry/ticket ID for organizing files
 * @param customerId - The customer ID for organizing files
 * @param sessionId - Optional session ID for new inquiries
 * @returns Promise with upload results containing URLs and any errors
 */
export async function uploadTicketImages(
  files: File[],
  inquiryId: string,
  customerId: string,
  sessionId?: string
): Promise<MultipleUploadResult> {
  const urls: string[] = [];
  const errors: string[] = [];

  try {
    // Validate file count
    const maxFiles = IMAGE_UPLOAD_CONFIG.ticket.maxFilesPerUpload;
    if (files.length > maxFiles) {
      return {
        urls: [],
        errors: [`You can upload a maximum of ${maxFiles} images at once.`]
      };
    }

    // Validate file types
    const allowedTypes = IMAGE_UPLOAD_CONFIG.allowedTypes;
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Please upload photos only.`);
      }
    }

    if (errors.length > 0) {
      return { urls: [], errors };
    }

    // Convert HEIC files to JPEG
    console.log('[uploadTicketImages] Converting HEIC files if needed...');
    const processedFiles = await convertMultipleHeicToJpeg(files);

    // Validate individual file sizes
    const maxFileSize = IMAGE_UPLOAD_CONFIG.ticket.maxFileSize;
    for (const file of processedFiles) {
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: File too large (max 5MB per image).`);
      }
    }

    // Validate total size
    const totalSize = processedFiles.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = IMAGE_UPLOAD_CONFIG.ticket.maxTotalSize;
    if (totalSize > maxTotalSize) {
      return {
        urls: [],
        errors: [`Total file size exceeds 10MB. Please reduce the number or quality of images.`]
      };
    }

    if (errors.length > 0) {
      return { urls: [], errors };
    }

    // Upload each file
    console.log('[uploadTicketImages] Uploading', processedFiles.length, 'files...');

    for (let i = 0; i < processedFiles.length; i++) {
      const file = processedFiles[i];

      try {
        // Generate unique filename
        const timestamp = Date.now();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}_${i}_${sanitizedFileName}`;

        // Use sessionId for new inquiries (before inquiry record exists)
        const identifier = inquiryId || sessionId || 'temp';
        const filePath = `${customerId}/${identifier}/${fileName}`;

        console.log('[uploadTicketImages] Uploading file', i + 1, ':', filePath);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('ticket-uploads')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.error('[uploadTicketImages] Upload error for file', i + 1, ':', error);
          errors.push(`${file.name}: Upload failed - ${error.message}`);
          continue;
        }

        console.log('[uploadTicketImages] Upload successful for file', i + 1);

        // Construct supabase:// URL
        const fileUrl = `supabase://ticket-uploads/${filePath}`;
        urls.push(fileUrl);

      } catch (error) {
        console.error('[uploadTicketImages] Unexpected error for file', i + 1, ':', error);
        errors.push(`${file.name}: Upload failed`);
      }
    }

    console.log('[uploadTicketImages] Upload complete:', {
      successful: urls.length,
      failed: errors.length
    });

    return { urls, errors };

  } catch (error) {
    console.error('[uploadTicketImages] Unexpected error:', error);
    return {
      urls: [],
      errors: [error instanceof Error ? error.message : 'An unexpected error occurred']
    };
  }
}

// Keep backward compatibility - single file upload
export async function uploadTicketImage(
  file: File,
  inquiryId: string,
  customerId: string,
  sessionId?: string
): Promise<UploadResult> {
  const result = await uploadTicketImages([file], inquiryId, customerId, sessionId);

  if (result.urls.length > 0) {
    return { url: result.urls[0] };
  } else {
    return { url: '', error: result.errors[0] || 'Upload failed' };
  }
}
```

---

### Phase 4: Update Upload Hooks

#### 4.1 Update Customer Ticket Upload Hook (`src/features/chat/hooks/customer/useTicketImageUpload.ts`)

```typescript
import { uploadTicketImages } from '@shared/utils/uploadTicketImages';

export interface UseTicketImageUploadResult {
  handleTicketImageUpload: (
    files: FileList,
    inquiryId: string,
    onSuccess?: (urls: string[]) => void,
    onError?: (errors: string[]) => void,
    sessionId?: string
  ) => Promise<void>;
}

export function useTicketImageUpload(): UseTicketImageUploadResult {
  const handleTicketImageUpload = useCallback(
    async (
      files: FileList,
      inquiryId: string,
      onSuccess?: (urls: string[]) => void,
      onError?: (errors: string[]) => void,
      sessionId?: string
    ) => {
      if (!files || files.length === 0) {
        onError?.(['No files selected']);
        return;
      }

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          onError?.(['You must be logged in to upload images']);
          return;
        }

        // Convert FileList to Array
        const filesArray = Array.from(files);

        console.log('[handleTicketImageUpload] Uploading', filesArray.length, 'files');

        // Upload files
        const result = await uploadTicketImages(
          filesArray,
          inquiryId,
          user.id,
          sessionId
        );

        if (result.errors.length > 0) {
          console.error('[handleTicketImageUpload] Upload errors:', result.errors);
          onError?.(result.errors);

          // If some succeeded, still call onSuccess with partial results
          if (result.urls.length > 0) {
            onSuccess?.(result.urls);
          }
        } else {
          console.log('[handleTicketImageUpload] All uploads successful');
          onSuccess?.(result.urls);
        }
      } catch (error) {
        console.error('[handleTicketImageUpload] Error:', error);
        onError?.([
          error instanceof Error ? error.message : 'An unexpected error occurred'
        ]);
      }
    },
    []
  );

  return { handleTicketImageUpload };
}
```

#### 4.2 Update Admin Ticket Upload Hook (`src/features/chat/hooks/admin/useTicketImageUpload.ts`)
- Same structure as customer hook
- Copy implementation from 4.1

---

### Phase 5: Update Dashboard File Upload Handlers

#### 5.1 Update CustomerDashboard (`src/customer/pages/CustomerDashboard.tsx`)

**Changes:**
- Handle multiple ticket images (send each URL separately)
- Keep payment proof as single image

```typescript
// In handleFileUpload callback:

} else if (isIssueTicketFlow && activeConversation) {
  // Use ticket image upload for issue-ticket flows (NEW inquiry creation)
  console.log('[handleFileUpload] Issue ticket flow detected - multiple images supported');

  const sessionId = activeConversation.id;

  if (sessionId) {
    console.log('[handleFileUpload] Uploading', files.length, 'files with session ID:', sessionId);

    await handleTicketImageUpload(
      files,
      '', // Empty inquiryId for new inquiries
      (urls) => {
        // Send each uploaded URL to chat separately
        console.log('[handleFileUpload] Upload successful, sending', urls.length, 'URLs');
        urls.forEach(url => sendViaHook(url));
      },
      (errors) => {
        console.error('[handleFileUpload] Upload errors:', errors);
        errors.forEach(error => sendViaHook(`Upload failed: ${error}`));
      },
      sessionId
    );
  }
}
```

#### 5.2 Update AdminLayout (`src/admin/components/shared/layouts/AdminLayout.tsx`)

**Similar changes as CustomerDashboard:**
- Handle multiple ticket images
- Send each URL separately via sendViaHook

---

### Phase 6: Update File Input Attributes

#### 6.1 Update ChatInput Components

**For Ticket Uploads:**
```tsx
<input
  type="file"
  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,image/avif"
  multiple  // Enable multiple file selection
  onChange={handleFileSelect}
/>
```

**For Payment Proofs:**
```tsx
<input
  type="file"
  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,image/avif"
  // NO multiple attribute - single file only
  onChange={handleFileSelect}
/>
```

---

### Phase 7: Update Message Rendering

#### 7.1 Update MessageBubble (`src/features/chat/components/core/MessageBubble.tsx`)

**Changes:**
- Render multiple images in grid layout
- 2-column grid for 2-4 images
- Keep modal functionality per image

```tsx
{processedImageUrls.length > 0 && (
  <div
    className={`mt-3 grid gap-3 ${
      processedImageUrls.length === 1
        ? 'grid-cols-1'
        : 'grid-cols-2'
    }`}
    onClick={(e) => e.stopPropagation()}
  >
    {processedImageUrls.map((src, idx) => (
      <div
        key={idx}
        role="button"
        tabIndex={0}
        className="rounded-lg overflow-hidden border border-neutral-200 bg-white block group cursor-pointer p-0 w-full"
        onClick={() => {
          setLightboxIndex(idx);
          setLightboxOpen(true);
        }}
        // ... rest of image rendering
      >
        <img src={src} alt={`Attachment ${idx + 1}`} />
      </div>
    ))}
  </div>
)}
```

#### 7.2 Update MessageGroup (`src/features/chat/components/core/MessageGroup.tsx`)

**Changes:**
- Extract ALL image URLs (not just first one)
- Update regex to capture multiple occurrences

```typescript
const extractImageUrls = (text: string): string[] => {
  if (!text || typeof text !== 'string') return [];

  if (text.includes('Conversation History:') || text.includes('NEW TICKET REQUEST')) {
    return [];
  }

  const imageUrlRegex = /(supabase:\/\/ticket-uploads\/[^\s]+|supabase:\/\/payment-proofs\/[^\s]+)/g;
  const matches = Array.from(text.matchAll(imageUrlRegex)).map(match => match[0]);

  // Filter duplicates
  return [...new Set(matches)];
};
```

---

### Phase 8: Update Action Handlers

#### 8.1 Update createInquiry (`src/features/chat/actions/customer/createInquiry.ts`)

**Changes:**
- Context now contains array of image URLs
- No need to create duplicate messages (already handled by flow processor)

```typescript
const config = actionNode.action_config as any;
const imageUrlKey = config.image_url_key || 'inquiry_image_url';

// Get image URLs from context (could be array or single URL)
const imageUrls = context[imageUrlKey] || null;

// Images are already stored as customer messages when uploaded via sendViaHook
// No need to create duplicate messages here
```

#### 8.2 Update sendAdminReply (`src/features/chat/actions/admin/replyToTicket.ts`)

**Changes:**
- Handle array of uploaded image URLs
- Embed all URLs in message text

```typescript
const uploadedImageUrls = context['uploaded_image_urls'] ||
                          (context['uploaded_image_url'] ? [context['uploaded_image_url']] : []);

const hasAttachments = uploadedImageUrls.length > 0;

let messageText = adminReply.trim();
if (hasAttachments) {
  if (!messageText) {
    messageText = 'Uploaded images:';
  }
  // Embed all storage URLs in message text
  messageText = `${messageText}\n${uploadedImageUrls.join('\n')}`;
}

const result = await insertMessageV2({
  sessionId: ticketSession.session_id,
  text: messageText,
  role: 'admin',
  nodeId: 'admin_reply',
  metadata: hasAttachments
    ? {
        has_attachment: true,
        attachment_urls: uploadedImageUrls, // Array of URLs
      }
    : undefined,
});
```

#### 8.3 Update fetchTicketForAdmin (`src/features/chat/actions/admin/fetchTicketForAdmin.ts`)

**Changes:**
- Look for ALL uploaded images (not just first)
- Display all images in description

```typescript
// Look for any uploaded images from the initial inquiry creation
const uploadedImages = allMessages.filter(
  (msg: any) =>
    msg.sender_role === 'customer' &&
    msg.node_id === 'upload_image_instructions' &&
    msg.message_text?.startsWith('supabase://')
);

// Append ALL images to description
if (uploadedImages.length > 0) {
  const imageUrls = uploadedImages.map((msg: any) => msg.message_text.trim());
  customerDescription += '\n\n' + imageUrls.join('\n');
}
```

#### 8.4 Update trackTicket (`src/features/chat/actions/customer/trackTicket.ts`)

**Same changes as fetchTicketForAdmin:**
- Extract all image URLs
- Display all in conversation history

---

## Testing Checklist

### Mobile Format Testing
- [ ] iOS Safari - Upload HEIC photo from camera
- [ ] iOS Safari - Upload HEIC photo from photos app
- [ ] Android Chrome - Upload JPEG from camera
- [ ] Android Chrome - Upload WebP image
- [ ] Desktop Chrome - Upload JPEG
- [ ] Desktop Safari - Upload HEIC (if available)

### Multiple Image Testing
- [ ] Upload 1 image to ticket - works
- [ ] Upload 2 images to ticket - works
- [ ] Upload 3 images to ticket - works
- [ ] Upload 4 images to ticket - shows error
- [ ] Upload 3 images over 10MB total - shows error
- [ ] Upload single 6MB image - shows error

### Payment Proof Testing
- [ ] Upload single JPEG - works
- [ ] Upload single HEIC - converts and works
- [ ] Try to upload multiple - should only accept first file

### Display Testing
- [ ] View ticket with 1 image - displays correctly
- [ ] View ticket with 2 images - grid layout 2 columns
- [ ] View ticket with 3 images - grid layout 2 columns
- [ ] Click image - opens modal
- [ ] Navigate between images in modal
- [ ] Images in conversation history render inline
- [ ] Images grouped with correct sender

### Conversion Testing
- [ ] HEIC converts to JPEG successfully
- [ ] Converted file size is reasonable
- [ ] Converted image displays correctly
- [ ] Conversion errors show user-friendly message

---

## Rollback Plan

If issues arise after deployment:

1. **Revert upload utilities:**
   - Restore `uploadTicketImage.ts` (singular)
   - Restore `uploadPaymentProof.ts` original validation

2. **Revert hooks:**
   - Restore single file handling in upload hooks

3. **Revert dashboards:**
   - Remove multiple file handling code

4. **Database:**
   - No schema changes needed
   - Old single-image messages still work

---

## Future Enhancements (Post-MVP)

1. **Client-side image compression** (reduce storage usage by 50-70%)
2. **Upload progress bars** for each image (src/shared/components/ui/Progress)
3. **Image preview before upload** with ability to remove individual images
4. **Drag and drop** file upload
5. **Storage monitoring dashboard** (track usage against 1GB limit)
6. **Automatic cleanup** of old ticket images after 90 days
7. **Image optimization** (resize to max 2048x2048)

---

## Dependencies

### New Packages
```json
{
  "heic2any": "^0.0.4"
}
```

### Affected Files
- `src/features/chat/config/uploadConfig.ts` (NEW)
- `src/shared/utils/convertHeicToJpeg.ts` (NEW)
- `src/shared/utils/uploadPaymentProof.ts` (MODIFIED - mobile formats only)
- `src/shared/utils/uploadTicketImage.ts` (RENAME & MODIFY → uploadTicketImages.ts)
- `src/features/chat/hooks/customer/useTicketImageUpload.ts` (MODIFIED)
- `src/features/chat/hooks/admin/useTicketImageUpload.ts` (MODIFIED)
- `src/customer/pages/CustomerDashboard.tsx` (MODIFIED)
- `src/admin/components/shared/layouts/AdminLayout.tsx` (MODIFIED)
- `src/features/chat/components/core/MessageBubble.tsx` (MODIFIED)
- `src/features/chat/components/core/MessageGroup.tsx` (MODIFIED)
- `src/features/chat/actions/customer/createInquiry.ts` (MODIFIED)
- `src/features/chat/actions/admin/replyToTicket.ts` (MODIFIED)
- `src/features/chat/actions/admin/fetchTicketForAdmin.ts` (MODIFIED)
- `src/features/chat/actions/customer/trackTicket.ts` (MODIFIED)

---

## Notes

- Payment proof upload remains **single image only** as requested
- HEIC conversion happens client-side for better UX (no server delay)
- File validation is centralized in config for easy maintenance
- Backward compatible - existing single-image messages still work
- Error handling provides specific feedback per file
