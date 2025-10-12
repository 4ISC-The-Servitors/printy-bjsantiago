import 'dotenv/config';
import { spawn } from 'node:child_process';
import { admin, ensureBackupBucket } from './supabaseAdmin.ts';

const bucketName = process.env.BACKUP_BUCKET || 'backup';
const objectPath = process.env.BACKUP_OBJECT || 'db/backup.sql';
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL. Configure .env.backup');
}

const pgDumpBin = process.env.PG_BIN
  ? `${process.env.PG_BIN.replace(/\\$/,'')}/pg_dump`
  : 'pg_dump';

export async function runBackup(): Promise<void> {
  await ensureBackupBucket(bucketName);
  return new Promise<void>((resolve, reject) => {
    const args = ['--dbname', databaseUrl, '--no-owner', '--no-acl'];
    const proc = spawn(pgDumpBin, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    const chunks: Buffer[] = [];
    proc.stdout.on('data', d => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
    proc.stderr.on('data', d => process.stderr.write(d));

    proc.on('error', err => reject(err));
    proc.on('close', async code => {
      if (code !== 0) return reject(new Error(`pg_dump exited with code ${code}`));
      const buffer = Buffer.concat(chunks);
      const { error } = await admin.storage
        .from(bucketName)
        .upload(objectPath, buffer, { upsert: true, contentType: 'application/sql' });
      if (error) return reject(error);
      resolve();
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runBackup()
    .then(() => console.log('[backup] Uploaded latest dump to Storage'))
    .catch(err => {
      console.error('[backup] Failed', err);
      process.exit(1);
    });
}


