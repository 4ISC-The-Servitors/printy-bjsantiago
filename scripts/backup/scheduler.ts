import 'dotenv/config';
import cron from 'node-cron';
import { fileURLToPath } from 'node:url';
import { runBackup } from './backup.ts';

const cronExpr = process.env.BACKUP_CRON || '0 0 20 * * *';
const timezone = process.env.CRON_TZ || 'Asia/Manila';

console.log(`[backup] scheduler module loaded: ${cronExpr} (${timezone})`);

function startScheduler() {
  console.log(`[backup] scheduler starting: ${cronExpr} (${timezone})`);
  cron.schedule(
    cronExpr,
    async () => {
      const start = new Date();
      console.log(`[backup] Starting backup at ${start.toISOString()}`);
      try {
        await runBackup();
        console.log('[backup] Success');
      } catch (err) {
        console.error('[backup] Failure', err);
      }
    },
    { timezone }
  );
  // Keep process alive
  setInterval(() => { /* no-op: keep alive */ }, 1 << 30);
}

try {
  if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    startScheduler();
  }
} catch {
  startScheduler();
}


