import 'dotenv/config';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dns from 'node:dns/promises';
import { admin, ensureBackupBucket } from './supabaseAdmin.ts';

const bucketName = process.env.BACKUP_BUCKET || 'backup';
const objectPath = process.env.BACKUP_OBJECT || 'db/backup.sql';
const databaseUrl = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL (or VITE_DATABASE_URL). Configure .env.backup');
}

const isWindows = process.platform === 'win32';
const pgDumpExe = isWindows ? 'pg_dump.exe' : 'pg_dump';
const pgDumpBin = process.env.PG_BIN
  ? path.join(process.env.PG_BIN.replace(/\\+$/,'') as string, pgDumpExe)
  : pgDumpExe;

export async function runBackup(): Promise<void> {
  await ensureBackupBucket(bucketName);

  // Attempt to resolve an IPv4 address to avoid environments that only return AAAA
  let hostaddr: string | null = null;
  const dbUrl: string = databaseUrl as string;
  const host = new URL(dbUrl).hostname;
  async function resolveIPv4(h: string): Promise<string | null> {
    try {
      const v4 = await dns.resolve4(h);
      if (v4 && v4.length > 0) return v4[0];
    } catch {}
    try {
      dns.setServers(['1.1.1.1', '8.8.8.8']);
      const v4 = await dns.resolve4(h);
      if (v4 && v4.length > 0) return v4[0];
    } catch {}
    try {
      const u = 'https://1.1.1.1/dns-query?name=' + encodeURIComponent(h) + '&type=A';
      const r = await fetch(u, { headers: { accept: 'application/dns-json' } });
      if (r.ok) {
        const j: any = await r.json();
        const ans = Array.isArray(j.Answer) ? j.Answer : [];
        const a = ans.find((x: any) => x && (x.type === 1 || x.type === 'A'));
        if (a?.data && /^(\d{1,3}\.){3}\d{1,3}$/.test(a.data)) return a.data;
      }
    } catch {}
    try {
      const u = 'https://dns.google/resolve?name=' + encodeURIComponent(h) + '&type=A';
      const r = await fetch(u);
      if (r.ok) {
        const j: any = await r.json();
        const ans = Array.isArray(j.Answer) ? j.Answer : [];
        const a = ans.find((x: any) => x && (x.type === 1 || x.type === 'A'));
        if (a?.data && /^(\d{1,3}\.){3}\d{1,3}$/.test(a.data)) return a.data;
      }
    } catch {}
    return null;
  }
  hostaddr = await resolveIPv4(host);

  return new Promise<void>((resolve, reject) => {
    const args: string[] = ['--dbname', dbUrl, '--no-owner', '--no-acl'];
    const env = { ...process.env } as NodeJS.ProcessEnv;
    if (hostaddr) {
      env.PGHOSTADDR = hostaddr;
      console.log(`[backup] Resolved hostaddr: ${hostaddr}`);
    } else {
      console.log('[backup] Could not resolve IPv4 hostaddr; proceeding with default resolver');
    }
    console.log(`[backup] Using pg_dump at: ${pgDumpBin}`);
    const proc = spawn(pgDumpBin, args, { stdio: ['ignore', 'pipe', 'pipe'] as const, env });

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

try {
  if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    console.log('[backup] Entry detected, starting…');
    runBackup()
      .then(() => console.log('[backup] Uploaded latest dump to Storage'))
      .catch(err => {
        console.error('[backup] Failed', err);
        process.exit(1);
      });
  }
} catch {
  // no-op if fileURLToPath not applicable
}


