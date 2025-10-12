import 'dotenv/config';
import { spawn } from 'node:child_process';
import { admin } from './supabaseAdmin.ts';

const bucketName = process.env.BACKUP_BUCKET || 'backup';
const objectPath = process.env.BACKUP_OBJECT || 'db/backup.sql';
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL. Configure .env.backup');
}

const psqlBin = process.env.PG_BIN
  ? `${process.env.PG_BIN.replace(/\\$/,'')}/psql`
  : 'psql';

export async function runRestore(): Promise<void> {
  const { data, error } = await admin.storage.from(bucketName).download(objectPath);
  if (error) throw error;

  const reader = (data as any).stream?.() ?? (data as any);
  const chunks: Buffer[] = [];
  // Support both web stream and Node stream from SDKs
  if (typeof reader?.getReader === 'function') {
    const stream = reader as ReadableStream;
    const r = stream.getReader();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await r.read();
      if (done) break;
      if (value) chunks.push(Buffer.from(value));
    }
  } else {
    await new Promise<void>((resolve, reject) => {
      reader.on('data', (d: Buffer) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
      reader.on('error', reject);
      reader.on('end', () => resolve());
    });
  }

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(
      psqlBin,
      ['--dbname', databaseUrl, '-v', 'ON_ERROR_STOP=1', '-1', '-f', '-'],
      { stdio: ['pipe', 'inherit', 'inherit'] }
    );
    proc.stdin.write(Buffer.concat(chunks));
    proc.stdin.end();
    proc.on('error', reject);
    proc.on('close', code => (code === 0 ? resolve() : reject(new Error(`psql exited with code ${code}`))));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runRestore()
    .then(() => console.log('[restore] Database restored from Storage backup'))
    .catch(err => {
      console.error('[restore] Failed', err);
      process.exit(1);
    });
}


