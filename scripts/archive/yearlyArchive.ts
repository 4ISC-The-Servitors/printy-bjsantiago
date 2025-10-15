import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

type Row = Record<string, unknown>;
type AdminClient = ReturnType<typeof createClient>;

function getAdminClient(): AdminClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

function getPrevCalendarYearBounds(): { year: number; startIso: string; endIso: string } {
  // Use Asia/Manila as business TZ, then compute UTC bounds of that calendar year.
  const tz = 'Asia/Manila';
  const now = new Date();
  const nowInTz = new Date(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now)
  );
  const targetYear = nowInTz.getUTCFullYear() - 1;
  const start = new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0));
  const end = new Date(Date.UTC(targetYear + 1, 0, 1, 0, 0, 0));
  return { year: targetYear, startIso: start.toISOString(), endIso: end.toISOString() };
}

function toCsv(rows: Row[]): string {
  if (!rows.length) return '';
  const headers = Array.from(
    rows.reduce<Set<string>>((s, r) => {
      Object.keys(r).forEach((k) => s.add(k));
      return s;
    }, new Set())
  );
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const str = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (/[",\n\r]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
    return str;
  };
  const lines: string[] = [];
  lines.push(headers.join(','));
  for (const row of rows) {
    lines.push(headers.map((h) => esc((row as any)[h])).join(','));
  }
  return lines.join('\n');
}

async function ensureBucket(admin: AdminClient, bucket: string): Promise<void> {
  try {
    const { data, error } = await admin.storage.getBucket(bucket);
    if (!error && data) return;
  } catch {}
  const { error: createErr } = await admin.storage.createBucket(bucket, { public: false });
  if (createErr && (createErr as any).status !== 409) throw createErr;
}

async function uploadCsv(
  admin: AdminClient,
  bucket: string,
  objectPath: string,
  rows: Row[]
): Promise<void> {
  const csv = toCsv(rows);
  const bytes = Buffer.from(csv, 'utf8');
  const { error } = await admin.storage.from(bucket).upload(objectPath, bytes, {
    upsert: true,
    contentType: 'text/csv',
  });
  if (error) throw error;
}

function rowsToCsvLinesUsingHeaders(headers: string[], rows: Row[]): string {
  if (!rows.length) return '';
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const str = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (/[",\n\r]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
    return str;
  };
  return rows.map((row) => headers.map((h) => esc((row as any)[h])).join(',')).join('\n');
}

async function appendCsv(
  admin: AdminClient,
  bucket: string,
  objectPath: string,
  rows: Row[]
): Promise<void> {
  if (!rows.length) return;
  // Try to download existing CSV; if it doesn't exist, create new
  const dl = await admin.storage.from(bucket).download(objectPath);
  if (dl.error || !dl.data) {
    await uploadCsv(admin, bucket, objectPath, rows);
    return;
  }
  // Read existing text
  const blob: any = dl.data as any;
  let existing = '';
  if (typeof blob.text === 'function') {
    existing = await blob.text();
  } else if (typeof blob.arrayBuffer === 'function') {
    const ab = await blob.arrayBuffer();
    existing = Buffer.from(ab).toString('utf8');
  } else {
    // Fallback: re-upload as new
    await uploadCsv(admin, bucket, objectPath, rows);
    return;
  }
  // Extract header from first line
  const firstNl = existing.indexOf('\n');
  const headerLine = firstNl === -1 ? existing : existing.slice(0, firstNl);
  const headers = headerLine.split(',');
  const extra = rowsToCsvLinesUsingHeaders(headers, rows);
  const needsNl = existing.length > 0 && !existing.endsWith('\n');
  const combined = existing + (extra ? (needsNl ? '\n' : '') + extra + '\n' : '');
  const bytes = Buffer.from(combined, 'utf8');
  const { error } = await admin.storage.from(bucket).upload(objectPath, bytes, {
    upsert: true,
    contentType: 'text/csv',
  });
  if (error) throw error;
}

async function run(): Promise<void> {
  const admin = getAdminClient();
  const bucket = process.env.ARCHIVES_BUCKET || 'archives';
  const { year, startIso, endIso } = getPrevCalendarYearBounds();
  const dryRun = /^true$/i.test(String(process.env.DRY_RUN || 'false'));

  await ensureBucket(admin, bucket);

  const prefix = `archives/${year}`;

  // Helper to fetch rows via RPC or query builder fallbacks
  async function fetchAll(tableOrView: string, filterCol: string): Promise<Row[]> {
    const rows: Row[] = [];
    let from = admin.from(tableOrView).select('*').gte(filterCol, startIso).lt(filterCol, endIso);
    const { data, error } = await from.limit(100000); // practical cap
    if (error) throw error;
    if (data) rows.push(...data);
    return rows;
  }

  // Helper to delete exported rows
  async function deleteRange(table: string, filterCol: string): Promise<number> {
    const { count, error } = await admin
      .from(table)
      .delete({ count: 'exact' })
      .gte(filterCol, startIso)
      .lt(filterCol, endIso);
    if (error) throw error;
    return count || 0;
  }

  // Archive deliveries
  {
    const table = 'deliveries';
    const timeCol = 'delivered_datetime';
    const rows = await fetchAll(table, timeCol);
    if (rows.length) {
      const objectPath = `${prefix}/${table}-${year}.csv`;
      await appendCsv(admin, bucket, objectPath, rows);
      if (!dryRun) await deleteRange(table, timeCol);
      console.log(`[archive] ${table}: exported ${rows.length}${dryRun ? ' (dry-run)' : ''}`);
    } else {
      console.log(`[archive] ${table}: no rows in range`);
    }
  }

  // Archive inquiries: export from view inquiries_secure, delete from base inquiries
  {
    const view = 'inquiries_secure';
    const table = 'inquiries';
    const timeCol = 'received_at';
    const rows = await fetchAll(view, timeCol);
    if (rows.length) {
      const objectPath = `${prefix}/${table}-${year}.csv`;
      await appendCsv(admin, bucket, objectPath, rows);
      if (!dryRun) await deleteRange(table, timeCol);
      console.log(`[archive] ${table}: exported ${rows.length}${dryRun ? ' (dry-run)' : ''}`);
    } else {
      console.log(`[archive] ${table}: no rows in range`);
    }
  }

  // Archive orders_duplicate by created_at
  {
    const table = 'orders_duplicate';
    const timeCol = 'created_at';
    const rows = await fetchAll(table, timeCol);
    if (rows.length) {
      const objectPath = `${prefix}/${table}-${year}.csv`;
      await appendCsv(admin, bucket, objectPath, rows);
      if (!dryRun) await deleteRange(table, timeCol);
      console.log(`[archive] ${table}: exported ${rows.length}${dryRun ? ' (dry-run)' : ''}`);
    } else {
      console.log(`[archive] ${table}: no rows in range`);
    }
  }

  // Archive quote_* normalized tables using conversations in range
  {
    const convTable = 'quote_conversations';
    const convTimeCol = 'created_at';
    const { data: convs, error: convErr } = await admin
      .from(convTable)
      .select('conversation_id')
      .gte(convTimeCol, startIso)
      .lt(convTimeCol, endIso)
      .limit(100000);
    if (convErr) throw convErr;
    const convIds = (convs || []).map((c: any) => c.conversation_id);
    if (convIds.length) {
      const inFilter = (q: any) => q.in('conversation_id', convIds);
      // Export in dependency order: messages, specs, proposals, orders, conversations
      const tables = [
        { name: 'quote_messages', key: 'conversation_id' },
        { name: 'quote_specs', key: 'conversation_id' },
        { name: 'quote_proposals', key: 'conversation_id' },
        { name: 'quote_orders', key: 'conversation_id' },
        { name: 'quote_conversations', key: 'conversation_id' },
      ] as const;

      for (const t of tables) {
        const { data, error } = await inFilter(admin.from(t.name).select('*')).limit(100000);
        if (error) throw error;
        const rows = data || [];
        if (rows.length) {
          const objectPath = `${prefix}/${t.name}-${year}.csv`;
          await appendCsv(admin, bucket, objectPath, rows);
        }
      }

      if (!dryRun) {
        // Delete children first then conversations
        for (const t of ['quote_orders', 'quote_proposals', 'quote_specs', 'quote_messages']) {
          const { error } = await admin.from(t).delete().in('conversation_id', convIds);
          if (error) throw error;
        }
        const { error: delConvErr } = await admin
          .from('quote_conversations')
          .delete()
          .in('conversation_id', convIds);
        if (delConvErr) throw delConvErr;
      }
      console.log(`[archive] quote_*: exported conversations=${convIds.length}${dryRun ? ' (dry-run)' : ''}`);
    } else {
      console.log('[archive] quote_*: no conversations in range');
    }
  }

  console.log(`[archive] Completed archive for ${year}`);
}

run().catch((err) => {
  console.error('[archive] Failed:', err);
  process.exit(1);
});


