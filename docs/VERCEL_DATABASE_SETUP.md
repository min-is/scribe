# Vercel Postgres Database Setup

This guide explains how to set up the PostgreSQL database for the Scribe Dashboard using Vercel Postgres.

## Overview

The Scribe Dashboard uses **automatic migrations** that run on every deployment and startup. You don't need to run any manual `npx` commands - the database tables are created and updated automatically.

## Setting Up Vercel Postgres

### 1. Create a Vercel Postgres Database

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose a name (e.g., `scribe-database`)
6. Select a region (choose closest to your users)
7. Click **Create**

### 2. Connect to Your Project

Vercel automatically creates environment variables for your database:

1. Go to your project's **Settings** → **Environment Variables**
2. You should see `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, and other database variables
3. The `DATABASE_URL` variable should be automatically set to `POSTGRES_PRISMA_URL`
4. If `DATABASE_URL` is not set, add it manually:
   - **Name:** `DATABASE_URL`
   - **Value:** Copy the value from `POSTGRES_PRISMA_URL`
   - **Environments:** Production, Preview, Development

### 3. Deploy Your Application

That's it! When you deploy your application:

1. Vercel will automatically set the database environment variables
2. On build (`npm run build`), migrations will run automatically
3. On startup (`npm run start`), migrations will verify the database is up to date
4. All tables, indexes, and constraints will be created automatically

## How It Works

### Automatic Migrations

The `scripts/run-migrations.js` file contains all database migrations as **idempotent SQL**. This means:

- ✅ Safe to run multiple times
- ✅ Won't break if tables already exist
- ✅ Automatically creates missing tables
- ✅ Automatically adds missing columns/indexes
- ✅ No manual intervention required

### Build Process

The build process is defined in `package.json`:

```json
{
  "scripts": {
    "build": "npm run migrate && prisma generate && next build",
    "start": "npm run migrate && next start",
    "dev": "npm run migrate && next dev --turbo",
    "migrate": "node scripts/run-migrations.js"
  }
}
```

Every time you run `npm run build`, `npm run start`, or `npm run dev`:
1. Migrations run first (`npm run migrate`)
2. Database tables are created/updated
3. Prisma client is generated
4. Application starts

## Local Development

### Option 1: Use Vercel Postgres Locally

1. Install Vercel CLI: `npm i -g vercel`
2. Link your project: `vercel link`
3. Pull environment variables: `vercel env pull .env.local`
4. Run dev server: `npm run dev`

The migrations will automatically connect to your Vercel Postgres database.

### Option 2: Use Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database: `createdb scribe-dev`
3. Create `.env.local` file:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/scribe-dev"
   ```
4. Run dev server: `npm run dev`

The migrations will automatically create all tables.

## Database Management

### Viewing Data

**Option 1: Vercel Dashboard**
- Go to **Storage** → Your database → **Data**
- Browse tables and run SQL queries

**Option 2: Prisma Studio**
```bash
npx prisma studio
```
Opens a visual database browser at http://localhost:5555

### Checking Migration Status

When you run the app, you'll see migration logs:

```
========================================
🔄 MIGRATION SCRIPT STARTED
========================================

✓ Using DATABASE_URL
  Connection string: postgresql://****@****

📡 Testing database connection...
✓ Database connection successful
  Database: scribe-db
  User: postgres
  PostgreSQL: PostgreSQL 15.x

🔧 Applying migrations...

➜ Migration: 20251129000000_add_shift_and_scribe_tables
  ✅ Completed in 45ms

========================================
✅ Migration Summary:
   10 succeeded
   0 failed
========================================
```

## ShiftGen Integration

The Shift and Scribe tables were added specifically for ShiftGen integration:

### Scribe Table
- Stores scribe information
- Links to shifts via one-to-many relationship
- Supports name standardization

### Shift Table
- Stores shift schedules
- Links to both scribes and providers
- Stores date (DATE type), zone, times, and site
- Indexed for fast queries by date and person

### Usage Example

The Discord bot's Python scraper can POST data to an API endpoint (to be created in Phase 2):

```python
import requests

shifts = [
    {
        "date": "2025-12-01",
        "zone": "A",
        "startTime": "0800",
        "endTime": "1600",
        "site": "St Joseph Scribe",
        "scribeName": "Isaac",
        "providerName": "Dr. Merjanian"
    }
]

response = requests.post(
    "https://your-site.vercel.app/api/shifts/sync",
    json={"shifts": shifts},
    headers={"Authorization": f"Bearer {API_KEY}"}
)
```

The API endpoint will:
1. Find or create the scribe
2. Find the provider by name
3. Upsert the shift (create or update)
4. Return sync summary

## Troubleshooting

### "No database URL found"

**Problem:** Migrations skip because `DATABASE_URL` is not set

**Solution:**
1. Check environment variables: `echo $DATABASE_URL`
2. In Vercel: Settings → Environment Variables → Add `DATABASE_URL`
3. Locally: Create `.env.local` with `DATABASE_URL=...`

### "Connection timeout"

**Problem:** Cannot connect to database

**Solution:**
1. Check database is running (Vercel Postgres dashboard)
2. Verify connection string is correct
3. Check firewall/network settings
4. Try connecting from Vercel Postgres dashboard's SQL editor

### "Migration failed"

**Problem:** SQL error during migration

**Solution:**
1. Check error message in logs
2. Verify database user has CREATE TABLE permissions
3. Check for conflicting table/index names
4. Contact support if issue persists

### "Prisma Client not generated"

**Problem:** TypeScript errors about Prisma types

**Solution:**
```bash
npx prisma generate
```

This regenerates the Prisma Client with the latest schema.

## Security Best Practices

1. ✅ **Never commit `.env` files** - Use `.env.local` for local dev
2. ✅ **Use connection pooling** - Vercel Postgres includes pgBouncer
3. ✅ **Restrict database access** - Only Vercel can connect (no public IP)
4. ✅ **Use read-only credentials** - For client-side queries (if needed)
5. ✅ **Enable SSL** - Vercel Postgres uses SSL by default

## Next Steps

Now that the database is set up:

1. ✅ **Phase 1 Complete:** Database schema ready
2. ⏳ **Phase 2:** Create API endpoints for shift data
3. ⏳ **Phase 3:** Update calendar UI to display shifts
4. ⏳ **Phase 4:** Integrate Python scraper with API
5. ⏳ **Phase 5:** Add scheduled refresh automation

## Support

- **Vercel Docs:** https://vercel.com/docs/storage/vercel-postgres
- **Prisma Docs:** https://www.prisma.io/docs
- **Migration Issues:** Check `scripts/run-migrations.js` for SQL

---

**Last Updated:** 2025-11-29
**Database Version:** PostgreSQL 15+
**Migration System:** Custom idempotent SQL migrations
