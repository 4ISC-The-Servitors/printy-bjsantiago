import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables for the backup worker. Prefer a dedicated file to
// avoid mixing with the frontend's .env. This keeps the Service Role key out of
// the client build and ensures scripts work when run directly.
dotenv.config({ path: process.env.ENV_FILE || '.env.backup' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error(
    'Missing SUPABASE_URL (or VITE_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_SERVICE_ROLE_KEY). Configure .env.backup.'
  );
}

export const admin = createClient(supabaseUrl, serviceKey);

export async function ensureBackupBucket(bucketName: string) {
  // Try to create the bucket; if it already exists, ignore the error.
  try {
    const { data, error } = await admin.storage.getBucket(bucketName);
    if (!error && data) return;
  } catch {
    // fallthrough to createBucket
  }
  const { error: createErr } = await admin.storage.createBucket(bucketName, {
    public: false,
  });
  if (createErr && (createErr as any).status !== 409) {
    // 409 => already exists. Anything else is a real error.
    throw createErr;
  }
}


