# Yearly Archive

Exports prior-year rows to CSV files in a private Supabase Storage bucket, then deletes only those rows.

- Bucket: `archives` (configurable via `ARCHIVES_BUCKET`)
- Output path: `archives/YYYY/<table>-YYYY.csv`
- Scope: `deliveries`, `inquiries` (export via `inquiries_secure`), `orders_duplicate`, and normalized quote tables (`quote_conversations`, `quote_messages`, `quote_specs`, `quote_proposals`, `quote_orders`).

## Run locally

```bash
npm run archive:yearly
# or with dry-run (no deletes)
DRY_RUN=true npm run archive:yearly
```

Requires `.env.backup` with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or VITE\_ variants).

## Scheduled

`.github/workflows/db-archive.yml` runs every Jan 1 at 12:00 UTC.
