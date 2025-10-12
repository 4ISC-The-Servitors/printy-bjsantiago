import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: process.env.ENV_FILE || '.env.backup' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Configure .env.backup.');
}

export const admin = createClient(supabaseUrl, serviceKey);

export async function ensureBackupBucket(bucketName) {
  try {
    const { data, error } = await admin.storage.getBucket(bucketName);
    if (!error && data) return;
  } catch {
    // continue to create
  }
  const { error: createErr } = await admin.storage.createBucket(bucketName, { public: false });
  if (createErr && createErr.status !== 409) {
    throw createErr;
  }
}


