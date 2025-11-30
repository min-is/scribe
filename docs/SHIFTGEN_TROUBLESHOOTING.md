# ShiftGen Integration Troubleshooting Guide

This guide helps diagnose and fix issues with the ShiftGen shift calendar integration.

## Quick Diagnostic

Run the diagnostic script to identify issues:

```bash
node scripts/diagnose-shiftgen.js
```

This will check:
- ✅ Environment variables
- ✅ Database connection and tables
- ✅ Name legend file
- ✅ API endpoints
- ✅ Scraper components

---

## Common Issue: Calendar Shows No Data

### Symptom
- Calendar loads successfully with passcode `5150`
- Dates are clickable but show "No shifts scheduled"
- Month view shows no shift counts

### Root Cause
**The database has never been populated with shift data.** All code is working, but no scraping has been triggered.

### Solution

#### Step 1: Verify Environment Variables

Go to **Vercel Dashboard → Settings → Environment Variables** and ensure these are set:

| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `SHIFTGEN_USERNAME` | Your ShiftGen account email | Use your login email |
| `SHIFTGEN_PASSWORD` | Your ShiftGen account password | Use your login password |
| `SHIFTGEN_API_KEY` | API key for scraper endpoint | `openssl rand -base64 32` |
| `CRON_SECRET` | Secret for cron authentication | `openssl rand -base64 32` |

**Important:** After adding environment variables, you must **redeploy** for changes to take effect.

#### Step 2: Trigger Initial Scrape

**Option A: Admin Portal (Recommended)**

1. Visit `https://yoursite.com/admin/shifts`
2. Enter passcode: `5150`
3. Click **"Trigger Manual Scrape"**
4. Enter your `SHIFTGEN_API_KEY` when prompted
5. Wait 1-2 minutes for scraping to complete
6. Review results (shifts scraped, created, updated)

**Option B: API Call**

```bash
curl -X POST https://yoursite.com/api/shifts/scrape \
  -H "Authorization: Bearer $SHIFTGEN_API_KEY"
```

**Option C: Wait for Cron Job**

- Cron job runs automatically at **midnight UTC** daily
- Check next run time in **Vercel Dashboard → Cron Jobs**
- View logs to see if cron has run

#### Step 3: Verify Calendar

1. Visit calendar page
2. Enter passcode: `5150`
3. Dates with shifts should show blue highlights with counts
4. Click dates to see detailed shift information

---

## Common Issue: Scraping Fails

### Symptom
- Admin portal shows errors when triggering scrape
- Cron job logs show failures
- API returns 500 errors

### Possible Causes & Solutions

#### Cause 1: Invalid ShiftGen Credentials

**Error:** `Failed to login to ShiftGen`

**Solution:**
1. Verify `SHIFTGEN_USERNAME` and `SHIFTGEN_PASSWORD` are correct
2. Test login manually at https://legacy.shiftgen.com/login
3. Update environment variables in Vercel if needed
4. Redeploy after updating

#### Cause 2: Missing API Key

**Error:** `Missing or invalid authorization header`

**Solution:**
1. Ensure `SHIFTGEN_API_KEY` is set in Vercel environment variables
2. Generate a new key: `openssl rand -base64 32`
3. Update in Vercel and redeploy

#### Cause 3: Network/Timeout Issues

**Error:** `Request timeout` or `Network error`

**Solution:**
- This is usually temporary - retry the scrape
- ShiftGen's legacy site may be slow or down temporarily
- Check Vercel function logs for detailed error messages

#### Cause 4: Database Connection Issues

**Error:** `Database connection failed`

**Solution:**
1. Verify `DATABASE_URL` is set correctly in Vercel
2. Check Vercel Postgres dashboard for database status
3. Ensure database is not paused (happens on free tier)
4. Run diagnostic script to test connection

---

## Common Issue: Cron Job Not Running

### Symptom
- Manual scraping works
- Cron job doesn't run at scheduled time
- No automatic updates

### Possible Causes & Solutions

#### Cause 1: Missing CRON_SECRET

**Error:** `Unauthorized` in cron logs

**Solution:**
1. Set `CRON_SECRET` environment variable in Vercel
2. Generate: `openssl rand -base64 32`
3. Redeploy

#### Cause 2: Vercel Cron Not Configured

**Solution:**
1. Check `vercel.json` has cron configuration:
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
2. Redeploy to apply changes
3. Verify in **Vercel Dashboard → Cron Jobs**

#### Cause 3: Free Tier Limitations

**Note:** Vercel Hobby (free) tier allows:
- 2 cron jobs maximum
- Once per day frequency only

If you need more frequent updates, consider upgrading to Pro tier or using manual triggers.

---

## Common Issue: Old Data in Calendar

### Symptom
- Calendar shows shifts from weeks/months ago
- No recent shifts visible

### Solution

Trigger a fresh scrape to update data:
1. Visit `/admin/shifts`
2. Click "Trigger Manual Scrape"
3. Verify scrape results show new shifts created

The scraper fetches the **current month** from ShiftGen, so recent shifts should appear.

---

## Common Issue: Provider Names Not Matching

### Symptom
- Shifts show scribe names but no provider names
- Provider field is blank in shift cards

### Root Cause
Provider name from ShiftGen doesn't match any providers in the database.

### Solution

#### Option 1: Check Name Legend

The name mapper standardizes provider names. Check `feature/shiftgen/name_legend.json`:

```json
{
  "physicians": {
    "MERJANIAN": "Dr. Merjanian",
    "SMITH": "Dr. Smith"
  },
  "mlps": {
    "JONES": "Jones, PA"
  }
}
```

If a provider is missing:
1. Add them to the legend file
2. Re-run scrape
3. Shifts will link to providers

#### Option 2: Add Provider to Database

Providers must exist in the database with matching names:

1. Go to admin panel
2. Add provider with exact name from legend
3. Re-run scrape

**Name Matching Logic:**
- Removes titles (Dr., MD, DO, PA, NP)
- Case-insensitive
- Removes punctuation
- Fuzzy match

Example matches:
- "Dr. Merjanian" ↔ "MERJANIAN"
- "Smith, MD" ↔ "Dr. Smith"
- "Jones PA" ↔ "Jones, PA"

---

## Database Management

### View Database Contents

**Option 1: Prisma Studio (Local)**
```bash
npx prisma studio
```
Opens at http://localhost:5555

**Option 2: Vercel Postgres Dashboard**
1. Go to Vercel Dashboard → Storage
2. Select your database
3. Go to Data tab
4. Browse Shift and Scribe tables

### Clear All Shifts (Fresh Start)

If you need to clear all shift data:

**WARNING: This deletes all shifts permanently!**

```sql
-- In Prisma Studio or Vercel Postgres SQL editor
DELETE FROM "Shift";
DELETE FROM "Scribe";
```

Then trigger a fresh scrape to repopulate.

---

## API Endpoints Reference

All endpoints return standardized JSON:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-11-30T10:00:00.000Z"
}
```

### Query Shifts by Date
```bash
GET /api/shifts?date=2025-12-01
```

### Query Date Range
```bash
GET /api/shifts/range?startDate=2025-12-01&endDate=2025-12-07
```

### Get Daily Schedule
```bash
GET /api/shifts/daily?date=2025-12-01
```

### Get Currently Active Shifts
```bash
GET /api/shifts/current
```

### Trigger Scrape (Authenticated)
```bash
POST /api/shifts/scrape
Authorization: Bearer $SHIFTGEN_API_KEY
```

### Cron Scrape (Authenticated)
```bash
GET /api/cron/scrape-shifts
Authorization: Bearer $CRON_SECRET
```

---

## Logging & Debugging

### Enable Verbose Logging

The scraper logs to console during execution. View logs in:
- **Vercel Functions:** Vercel Dashboard → Functions → View logs
- **Local Development:** Terminal output when running `npm run dev`

### Key Log Messages

**Successful scrape:**
```
✓ Logged in successfully
Processing site: St Joseph Scribe (ID: 82)
Found 3 schedule(s)
  Fetching: St Joseph Scribe - December 2025
    Parsed 120 shift(s)
✓ Sync complete
  Shifts scraped: 120
  Shifts created: 95
  Shifts updated: 25
```

**Login failure:**
```
Failed to login to ShiftGen
```
→ Check credentials

**Parsing errors:**
```
Failed to sync shift: {...}
```
→ New shift format not recognized - may need parser update

---

## Performance Considerations

### Scrape Duration
- **Typical:** 1-2 minutes for 3 sites
- **Factors:** Network speed, ShiftGen response time, number of shifts

### Database Query Performance
- **Indexed fields:** date, scribeId, providerId
- **Typical query:** <100ms for monthly data
- **Optimized:** Queries use database indexes for fast lookups

### Caching
- No caching implemented (real-time data)
- If needed, add Redis or in-memory cache

---

## Architecture Overview

```
┌─────────────────┐
│  ShiftGen Site  │
└────────┬────────┘
         │
         │ (Scrape HTML)
         ▼
┌─────────────────┐
│  Scraper.ts     │ ← Login, fetch schedules
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Parser.ts     │ ← Extract shifts from HTML
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ NameMapper.ts   │ ← Standardize names
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Sync.ts      │ ← Orchestrate sync
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     DB.ts       │ ← Save to Postgres
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vercel Postgres│
└────────┬────────┘
         │
         │ (API Queries)
         ▼
┌─────────────────┐
│  API Endpoints  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Calendar UI    │
└─────────────────┘
```

---

## Getting Help

If you've tried all troubleshooting steps and still have issues:

1. **Run Diagnostic Script:**
   ```bash
   node scripts/diagnose-shiftgen.js
   ```

2. **Check Logs:**
   - Vercel Dashboard → Functions → Logs
   - Look for errors during scrape/cron execution

3. **Verify All Requirements:**
   - ✅ Environment variables set
   - ✅ Database exists and accessible
   - ✅ ShiftGen credentials valid
   - ✅ At least one scrape triggered

4. **Test Individual Components:**
   - Test login manually at https://legacy.shiftgen.com
   - Test API endpoints with curl
   - Check database with Prisma Studio

---

## Quick Reference

### Admin Portal
- **URL:** `/admin/shifts`
- **Passcode:** `5150`
- **Purpose:** Manual scrape trigger, view results

### Calendar
- **URL:** Your calendar route
- **Passcode:** `5150`
- **Purpose:** View shifts

### Cron Schedule
- **Frequency:** Daily at midnight UTC (00:00)
- **Endpoint:** `/api/cron/scrape-shifts`

### Environment Variables
```bash
DATABASE_URL=postgresql://...
SHIFTGEN_USERNAME=your-email@example.com
SHIFTGEN_PASSWORD=your-password
SHIFTGEN_API_KEY=<random-key>
CRON_SECRET=<random-key>
```

### Generate Secure Keys
```bash
openssl rand -base64 32
```
