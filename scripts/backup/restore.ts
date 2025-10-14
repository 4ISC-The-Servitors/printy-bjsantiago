import 'dotenv/config';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dns from 'node:dns/promises';
import { admin } from './supabaseAdmin.ts';

const bucketName = process.env.BACKUP_BUCKET || 'backup';
const objectPath = process.env.BACKUP_OBJECT || 'db/backup.sql';
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL. Configure .env.backup');
}

const isWindows = process.platform === 'win32';
const psqlExe = isWindows ? 'psql.exe' : 'psql';
const psqlBin = process.env.PG_BIN
  ? path.join(process.env.PG_BIN.replace(/\\+$/,'') as string, psqlExe)
  : psqlExe;

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

  // Attempt to resolve IPv4 and pass as PGHOSTADDR to avoid AAAA-only environments
  let hostaddr: string | null = null;
  const host = new URL(databaseUrl).hostname;
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

  await new Promise<void>((resolve, reject) => {
    console.log(`[restore] Using psql at: ${psqlBin}`);
    const env = { ...process.env } as NodeJS.ProcessEnv;
    if (hostaddr) {
      env.PGHOSTADDR = hostaddr;
      console.log(`[restore] Resolved hostaddr: ${hostaddr}`);
    } else {
      console.log('[restore] Could not resolve IPv4 hostaddr; proceeding with default resolver');
    }
    const proc = spawn(psqlBin, ['--dbname', databaseUrl, '-v', 'ON_ERROR_STOP=1', '-1', '-f', '-'], {
      stdio: ['pipe', 'inherit', 'inherit'],
      env,
    });
    proc.stdin.write(Buffer.concat(chunks));
    proc.stdin.end();
    proc.on('error', reject);
    proc.on('close', code => (code === 0 ? resolve() : reject(new Error(`psql exited with code ${code}`))));
  });
}

try {
  if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    console.log('[restore] Entry detected, starting…');
    runRestore()
      .then(() => console.log('[restore] Database restored from Storage backup'))
      .catch(err => {
        console.error('[restore] Failed', err);
        process.exit(1);
      });
  }
} catch {
  // no-op
}


