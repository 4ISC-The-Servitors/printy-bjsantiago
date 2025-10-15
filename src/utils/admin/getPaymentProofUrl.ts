/**
 * getPaymentProofUrl
 * Gets a signed URL for viewing payment proof images (admin only)
 */

import { supabase } from '../../lib/supabase';

/**
 * Gets a signed URL for viewing a payment proof image
 * @param filePath - The file path in the payment-proofs bucket
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Promise with signed URL or error
 */
export async function getPaymentProofUrl(
  filePath: string,
  expiresIn: number = 3600 // 1 hour
): Promise<{ url: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return {
        url: '',
        error: `Failed to create signed URL: ${error.message}`
      };
    }

    if (!data?.signedUrl) {
      return {
        url: '',
        error: 'No signed URL returned'
      };
    }

    return {
      url: data.signedUrl
    };

  } catch (error) {
    console.error('Error getting payment proof URL:', error);
    return {
      url: '',
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Gets a signed URL for viewing a payment proof image with a shorter expiration
 * @param filePath - The file path in the payment-proofs bucket
 * @returns Promise with signed URL or error (15 minutes expiration)
 */
export async function getPaymentProofUrlShort(
  filePath: string
): Promise<{ url: string; error?: string }> {
  return getPaymentProofUrl(filePath, 900); // 15 minutes
}
