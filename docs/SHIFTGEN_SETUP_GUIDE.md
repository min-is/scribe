# ShiftGen Setup & Troubleshooting Guide

## Quick Diagnosis: Why Is My Calendar Empty?

If your calendar shows no shifts, follow this checklist:

### ✅ Step 1: Verify Environment Variables

The scraper requires three environment variables to be set in Vercel:

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add these variables**:

   ```
   SHIFTGEN_USERNAME = your-shiftgen-email@example.com
   SHIFTGEN_PASSWORD = your-shiftgen-password
   SHIFTGEN_API_KEY = <generate-with-openssl-rand-base64-32>
   CRON_SECRET = <generate-with-openssl-rand-base64-32>
   ```

3. **Generate API keys** (run locally):
   ```bash
   # For SHIFTGEN_API_KEY
   openssl rand -base64 32

   # For CRON_SECRET
   openssl rand -base64 32
   ```

4. **Set environment for**: Production, Preview, Development

### ✅ Step 2: Trigger Initial Scrape

**Option A: Admin Portal (Recommended)**

1. Navigate to: `https://yoursite.com/admin/shifts`
2. Enter passcode: `5150`
3. Click "Trigger Manual Scrape"
4. Enter your `SHIFTGEN_API_KEY` when prompted
5. Wait for results (typically 1-2 minutes)

**Option B: API Call (Advanced)**

```bash
curl -X POST https://yoursite.com/api/shifts/scrape \
  -H "Authorization: Bearer YOUR_SHIFTGEN_API_KEY"
```

### ✅ Step 3: Verify Data in Database

After scraping completes, check:

1. **Vercel Dashboard** → Storage → Your Postgres Database → Data
2. Look for records in `Shift` and `Scribe` tables
3. Should see hundreds of shift records

### ✅ Step 4: Verify Calendar Display

1. Navigate to: `https://yoursite.com` (or your calendar page)
2. Enter passcode: `5150`
3. Calendar should show blue-highlighted dates with shift counts
4. Click any highlighted date to see shift details

---

## Automated Scheduling (Vercel Cron)

### What It Does

- Automatically scrapes ShiftGen once per day
- Updates database with new/modified shifts
- Runs at 12:00 AM UTC (midnight)

### Setup

1. **Cron configuration** is already in `vercel.json`:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/scrape-shifts",
         "schedule": "0 0 * * *"
       }
     ]
   }
   ```

2. **Enable Vercel Cron**:
   - Deploy your project
   - Vercel automatically enables cron jobs on all plans (Hobby: 2 jobs, once per day)
   - Check Vercel Dashboard → Your Project → Cron Jobs

3. **Set `CRON_SECRET`** environment variable (required for security)

### Monitoring

Check cron execution logs:
- Vercel Dashboard → Your Project → Deployments → Functions
- Look for `/api/cron/scrape-shifts` invocations

---

## Troubleshooting

### Problem: "Server configuration error: API key not set"

**Cause**: `SHIFTGEN_API_KEY` not set in Vercel

**Solution**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add `SHIFTGEN_API_KEY` with a secure random value
3. Redeploy your project

### Problem: "Failed to login to ShiftGen"

**Cause**: Invalid `SHIFTGEN_USERNAME` or `SHIFTGEN_PASSWORD`

**Solution**:
1. Verify credentials work by logging into legacy.shiftgen.com manually
2. Update environment variables in Vercel
3. Ensure no extra spaces or special characters
4. Redeploy

### Problem: "Module not found: Can't resolve 'fs'"

**Cause**: Client component trying to import server-only modules

**Solution**: Already fixed in latest code. The main index at `src/lib/shiftgen/index.ts` only exports client-safe utilities.

### Problem: Scraper runs but creates 0 shifts

**Possible Causes**:
1. **Name mapper can't find providers**: Check `feature/shiftgen/name_legend.json` exists
2. **HTML parsing failed**: ShiftGen may have changed their HTML structure
3. **Time parsing failed**: Check logs for parsing errors

**Debug Steps**:
1. Check Vercel logs for detailed error messages
2. Look for "Parsed X shift(s)" messages - should be > 0
3. Review error array in scrape result

### Problem: Calendar shows dates but no shifts in modal

**Cause**: Data exists but daily grouping failed

**Solution**:
1. Check `/api/shifts/daily?date=YYYY-MM-DD` endpoint directly
2. Verify time format in database (should be "0800", "1600", etc.)
3. Check browser console for API errors

### Problem: Cron job not running

**Vercel Cron Requirements**:
- Available on all plans (**Hobby**: 2 cron jobs, once per day; **Pro/Enterprise**: more frequent)
- Requires `CRON_SECRET` environment variable
- Check Vercel Dashboard → Cron Jobs to verify setup
- On Hobby tier, ensure schedule is once per day (e.g., `0 0 * * *`)

**Alternative**: Use GitHub Actions for more frequent scraping (if needed)

---

## Manual Database Management

### View Data (Prisma Studio)

```bash
# Run locally
npx prisma studio
```

Opens at http://localhost:5555

### Clear All Shifts

```typescript
// Run in Vercel Postgres SQL editor or local script
DELETE FROM "Shift";
DELETE FROM "Scribe";
```

### Check Shift Count

```sql
SELECT COUNT(*) FROM "Shift";
SELECT COUNT(*) FROM "Scribe";
```

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│   1. Trigger (Manual or Cron)          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   2. ShiftGenSyncService.runSync()     │
│      • Login to ShiftGen               │
│      • Fetch schedules (3 sites)       │
│      • Parse HTML calendars            │
│      • Standardize names               │
│      • Match providers                 │
│      • Upsert shifts to database       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   3. Vercel Postgres Database          │
│      • Scribe table                     │
│      • Shift table (with relations)     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   4. API Endpoints                     │
│      • GET /api/shifts/range           │
│      • GET /api/shifts/daily           │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   5. ScheduleCalendar Component        │
│      • Fetches month data              │
│      • Displays shift counts           │
│      • Shows daily details             │
└─────────────────────────────────────────┘
```

---

## Environment Variables Reference

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `SHIFTGEN_USERNAME` | ShiftGen login email | `user@example.com` | ✅ Yes |
| `SHIFTGEN_PASSWORD` | ShiftGen password | `your-password` | ✅ Yes |
| `SHIFTGEN_API_KEY` | API endpoint security | `openssl rand -base64 32` | ✅ Yes |
| `CRON_SECRET` | Vercel Cron security | `openssl rand -base64 32` | Optional* |
| `DATABASE_URL` | Postgres connection | Auto-set by Vercel | ✅ Yes |

*Required only if using Vercel Cron

---

## Next Steps After Setup

1. **Initial Scrape**: Use admin portal to populate database
2. **Verify Calendar**: Check shifts are displaying correctly
3. **Enable Cron**: Set `CRON_SECRET` for automated updates
4. **Monitor Logs**: Check Vercel logs for any errors
5. **Customize**: Adjust cron schedule if needed (currently every 12 hours)

---

## Support

If you encounter issues not covered here:

1. Check Vercel deployment logs
2. Review browser console for client-side errors
3. Test API endpoints directly with curl
4. Verify database has data via Prisma Studio

**Common Files to Check**:
- `app/api/shifts/scrape/route.ts` - Manual scrape endpoint
- `app/api/cron/scrape-shifts/route.ts` - Automated scrape
- `src/lib/shiftgen/sync.ts` - Sync orchestration
- `src/components/calendar/ScheduleCalendar.tsx` - Frontend

---

## Quick Reference: Important URLs

- **Calendar**: `https://yoursite.com/` (passcode: 5150)
- **Admin Portal**: `https://yoursite.com/admin/shifts` (passcode: 5150)
- **Scrape API**: `POST https://yoursite.com/api/shifts/scrape`
- **Cron Endpoint**: `GET https://yoursite.com/api/cron/scrape-shifts`
- **Daily Shifts API**: `GET https://yoursite.com/api/shifts/daily?date=YYYY-MM-DD`
- **Range API**: `GET https://yoursite.com/api/shifts/range?startDate=...&endDate=...`

---

**Last Updated**: November 30, 2025
