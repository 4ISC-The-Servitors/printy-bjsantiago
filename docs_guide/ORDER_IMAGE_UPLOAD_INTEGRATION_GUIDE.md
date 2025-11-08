# Order Image Upload Integration Guide

## What’s already implemented (tickets & payments)

- Multiple ticket image uploads (up to 3) with client-side HEIC/HEIF → JPEG conversion
- Centralized upload config with allowed types, size limits, and conversion rules
- Single-send behavior: multiple selected images are uploaded and sent in one chat message (newline-separated `supabase://` URLs)
- Customer and Admin hooks updated to handle arrays and errors, with optional progress reporting
- Payment proof upload (single image) supports mobile formats and HEIC conversion
- Message rendering updates: grid layout for multiple images and signed URL resolution

Key modules updated/added:

- `src/features/chat/config/uploadConfig.ts` — shared limits and allowed types
- `src/shared/utils/convertHeicToJpeg.ts` — HEIC/HEIF → JPEG conversion utility
- `src/shared/utils/uploadTicketImages.ts` — multi-image upload flow (returns array of `supabase://` URLs)
- `src/shared/utils/uploadPaymentProof.ts` — single-image flow with conversion
- `src/features/chat/hooks/customer/useTicketImageUpload.ts` — customer multiple upload + progress
- `src/features/chat/hooks/admin/useTicketImageUpload.ts` — admin multiple upload + progress
- `src/customer/pages/CustomerDashboard.tsx` — one-send behavior and optional progress overlay
- `src/admin/components/shared/layouts/AdminLayout.tsx` — one-send behavior and optional progress
- `src/features/chat/components/core/MessageBubble.tsx` — 1 or 2-column image grid + modal
- `src/features/chat/components/core/MessageGroup.tsx` — extract multiple image URLs (deduped)

## Extend to Orders (order-uploads bucket)

The order integration mirrors the ticket flow with bucket and path changes. Below are the minimal, targeted additions.

### 1) Bucket and URL pattern

- Storage bucket: `order-uploads`
- URL token format: `supabase://order-uploads/<customerId>/<orderId>/<filename>`

Update patterns wherever `ticket-uploads` and `payment-proofs` are recognized/displayed to also match `order-uploads`:

- Message parsing (URL extraction regex)
- Signed URL resolution (MessageBubble inline and attachment resolvers)

### 2) Create order upload utility

- Create `src/shared/utils/uploadOrderImages.ts` modeled after `uploadTicketImages.ts`:
  - Accept `files: File[]`, `orderId: string`, `customerId: string`
  - Reuse `IMAGE_UPLOAD_CONFIG` and `convertMultipleHeicToJpeg`
  - Enforce limits using `IMAGE_UPLOAD_CONFIG.ticket` (or define an `orders` section if you want distinct limits)
  - Upload to `order-uploads` bucket with path `${customerId}/${orderId}/${timestamp_index_filename}`
  - Return `{ urls: string[]; errors: string[] }` with `supabase://order-uploads/...` URLs
  - Optional `onProgress?: (value: number) => void` callback like the ticket flow

Optional single-file wrapper for compatibility:

- `export async function uploadOrderImage(file, orderId, customerId): Promise<{ url: string; error?: string }>`

### 3) Customer hook for orders

- Add `src/features/chat/hooks/customer/useOrderImageUpload.ts` mirroring `useTicketImageUpload`:
  - API: `(files, orderId, onSuccess?: (urls: string[]) => void, onError?: (errors: string[]) => void, onProgress?: (value: number) => void)`
  - Get current user, convert `FileList → File[]`, call `uploadOrderImages`
  - Return `urls` on success, aggregate `errors` on failure

### 4) Admin hook for orders (optional)

- Add `src/features/chat/hooks/admin/useOrderImageUpload.ts` mirroring the admin ticket hook:
  - API: `(files, orderId, customerId, onSuccess?, onError?, onProgress?)`
  - Verify admin via existing helper, call `uploadOrderImages`

### 5) Wire into chat/file handlers for order flows

- Where orders can attach images (e.g., “Place Order” or “Edit Order” flows), call the new order hook instead of regular attachments.
- Keep “single send” behavior by joining URL array via newline: `sendViaHook(urls.join('\n'))`.

### 6) Rendering updates

- Ensure `MessageGroup` extraction regex includes `supabase://order-uploads/…`
- Ensure `MessageBubble` signed URL resolution handles `order-uploads` and includes those images in the grid.

### 7) Config adjustments (optional)

If you want different limits for orders (e.g., up to 5 images or different total size):

- Extend `IMAGE_UPLOAD_CONFIG` with an `orders` section:
  - `orders: { maxFileSize, maxFilesPerUpload, maxTotalSize }`
- Point the new `uploadOrderImages` to `IMAGE_UPLOAD_CONFIG.orders` for validations.

## Minimal Code Diffs (high-level)

- New files:
  - `src/shared/utils/uploadOrderImages.ts`
  - `src/features/chat/hooks/customer/useOrderImageUpload.ts`
  - (optional) `src/features/chat/hooks/admin/useOrderImageUpload.ts`
- Regex additions (include `order-uploads`):
  - `src/features/chat/components/core/MessageGroup.tsx` (extraction & removal)
  - `src/features/chat/components/core/MessageBubble.tsx` (inline/signed URL resolution)
- Wire hooks in file handlers where order images can be attached.

## Example user experiences

- Customer selects up to 3 order images → instant HEIC conversion → single send with 3 URLs → renders as 2-column grid.
- Admin in an order-review context attaches images to the order → single send → same rendering behavior.

## Testing Checklist (Orders)

- Mobile formats
  - iOS Safari: HEIC → converted to JPEG
  - Android Chrome: JPEG/WebP accepted
- Limits and validation
  - 1–3 images upload succeeds
  - 4th image triggers validation error
  - > 10MB total triggers validation error (or your orders limit if customized)
- Message rendering
  - Multiple images display in grid
  - Modal opens per image and navigation works
- Signed URLs
  - `order-uploads` images resolve and display via signed URLs

## Rollout Steps

1. Add new order utility and hooks
2. Add `order-uploads` parsing and signed URL resolution to Message components
3. Wire customer/admin file handlers for relevant order flows
4. Validate on staging with the testing checklist
5. Deploy

## Notes

- This is fully client-side for conversion; no server changes required
- Existing bucket `order-uploads` should mirror RLS settings of ticket/payment buckets
- Single-send behavior ensures downstream steps parse one message containing all URLs
