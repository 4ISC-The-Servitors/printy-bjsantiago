import 'dotenv/config';
import cron from 'node-cron';
import { runBackup } from './backup.ts';

const cronExpr = process.env.BACKUP_CRON || '0 0 20 * * *';
const timezone = process.env.CRON_TZ || 'Asia/Manila';

console.log(`[backup] scheduler ready: ${cronExpr} (${timezone})`);

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
setInterval(() => {}, 1 << 30);


