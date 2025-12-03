# Railway Database Integration

This document explains the dual-database approach used in the Scribe application.

## Overview

The application now uses **two separate PostgreSQL databases**:

1. **Vercel Postgres** (primary database)
   - Managed by Prisma ORM
   - Contains: providers, smart phrases, procedures, scenarios, user accounts, etc.
   - Used for all main application features

2. **Railway Postgres** (shift data only)
   - External database managed by the Discord bot
   - Contains: correctly formatted shift schedules
   - Used exclusively for the calendar feature

## Why Two Databases?

The Railway database contains shift data that is:
- Scraped and formatted correctly by the Discord bot
- Already structured with the correct schema
- Automatically maintained and updated by the bot

Rather than scraping ShiftGen.com directly from the Next.js app (which had persistent issues with data formatting), we query the external Railway database that already has clean, validated data.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  Vercel Postgres│         │ Railway Postgres │
│  (Prisma ORM)   │         │  (Direct Queries)│
└────────┬────────┘         └────────┬─────────┘
         │                           │
         │                           │
    ┌────▼────────────────────────▼─────┐
    │      Next.js Application          │
    │                                    │
    │  • Provider profiles → Vercel     │
    │  • Shift calendar → Railway       │
    └────────────────────────────────────┘
```

## Environment Variables

Add the following to your `.env.local` file:

```bash
# Vercel Postgres (existing)
DATABASE_URL="postgresql://user:password@host:port/database"

# Railway Postgres (new)
RAILWAY_DATABASE_URL="postgresql://postgres:password@host:port/database"
```

For production (Vercel deployment), set `RAILWAY_DATABASE_URL` in your Vercel project environment variables.

## Railway Database Schema

The Railway database uses a simple schema managed by the Discord bot:

```sql
CREATE TABLE shifts (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    label VARCHAR(50) NOT NULL,         -- Shift letter (A, B, C, etc.)
    time VARCHAR(20) NOT NULL,          -- HHMM-HHMM format (e.g., "0530-1400")
    person VARCHAR(255) NOT NULL,       -- Scribe or provider name
    role VARCHAR(50) NOT NULL,          -- 'Scribe', 'Physician', or 'MLP'
    site VARCHAR(255) NOT NULL,         -- Hospital site
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, label, time, person, role)
);
```

## API Endpoints

The application provides Railway-specific API endpoints:

### `GET /api/railway-shifts/daily`

Get shifts for a specific date.

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "date": "2025-12-03",
  "zones": {
    "zone1": [
      {
        "label": "B",
        "time": "0530-1400",
        "scribe": "Frances",
        "provider": "Dr. Arafa",
        "providerRole": "Physician"
      }
    ],
    "zone2": [...]
  }
}
```

### `GET /api/railway-shifts/range`

Get shifts for a date range.

**Query Parameters:**
- `startDate` (required): Start date in YYYY-MM-DD format
- `endDate` (required): End date in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "startDate": "2025-12-01",
  "endDate": "2025-12-31",
  "shifts": {
    "2025-12-03": [...],
    "2025-12-04": [...]
  },
  "totalShifts": 531
}
```

### `GET /api/railway-shifts/stats`

Get database statistics.

**Response:**
```json
{
  "success": true,
  "connected": true,
  "totalShifts": 531,
  "totalScribes": 42,
  "totalProviders": 30,
  "dateRange": {
    "min": "2025-12-01",
    "max": "2025-12-31"
  }
}
```

## Components

### `RailwayScheduleCalendar`

The calendar component that displays shift data from the Railway database.

**Features:**
- Passcode-protected access (same as original calendar)
- Monthly calendar view with shift counts
- Daily schedule modal with zone-based grouping
- Provider information displayed alongside scribes

**Usage:**
```tsx
import RailwayScheduleCalendar from '@/components/calendar/RailwayScheduleCalendar';

<RailwayScheduleCalendar />
```

## Data Flow

1. **Discord Bot** (Python)
   - Scrapes ShiftGen.com daily
   - Validates and formats data
   - Stores in Railway Postgres database

2. **Next.js App** (TypeScript)
   - Queries Railway database via `/api/railway-shifts/*` endpoints
   - Displays data in `RailwayScheduleCalendar` component
   - Matches scribes with providers based on shift label and time

## Shift Matching Logic

The API automatically matches scribes with providers:

1. **Fetch all shifts** for the requested date from Railway database
2. **Separate** scribes and providers (by `role` field)
3. **Match** by shift label and time:
   - If scribe `A` works `0530-1400` and provider also has `A` at `0530-1400`, they're matched
4. **Group** by zones based on shift letter
5. **Return** structured data with both scribe and provider names

## Zone Mappings

The zone groupings follow the ED structure:

| Zone Group | Shifts | Description |
|------------|--------|-------------|
| Zone 1     | B, F, X | First zone shifts |
| Zone 2     | A, E, I | Second zone shifts |
| Zones 3/4  | C, G    | Combined zones 3 and 4 |
| Zones 5/6  | D, H, PA | Combined zones 5 and 6 (Fast Track) |
| Overflow/PIT | PIT   | Overflow and PIT shifts |

## Maintenance

### Database Updates

The Railway database is automatically maintained by the Discord bot:
- **Automatic refresh**: Every 2 hours
- **Manual refresh**: Discord command `.refresh`
- **Duplicate cleanup**: Discord command `.cleanduplicates`

### Monitoring

Check database health:
```bash
curl https://your-app.vercel.app/api/railway-shifts/stats
```

### Troubleshooting

**Connection Issues:**
- Verify `RAILWAY_DATABASE_URL` is set correctly
- Check if Railway database is accessible from Vercel
- Ensure Railway allows external connections (not using `postgres.railway.internal` hostname for external access)

**No Data Showing:**
- Verify shifts exist in Railway database (check Discord bot)
- Check API response at `/api/railway-shifts/daily?date=YYYY-MM-DD`
- Ensure date is within the database date range

**Provider Names Missing:**
- Verify provider data exists in Railway database
- Check that shift labels match between scribes and providers
- Ensure times match exactly (e.g., both "0530-1400")

## Migration Notes

### From Old Scraping Approach

The old approach (scraping ShiftGen.com directly from Next.js) has been replaced with querying the Railway database. The old scraping code is still present in the codebase but is no longer used for the calendar display.

**Benefits of Railway Approach:**
- ✅ No more data formatting issues
- ✅ No more duplicate entries
- ✅ Provider matching works correctly
- ✅ Data is pre-validated by Discord bot
- ✅ Automatic updates via Discord bot cron jobs
- ✅ No need to maintain scraping logic in multiple places

### Keeping Both Systems

The Vercel database is still used for:
- Provider profiles and preferences
- Smart phrases and procedures
- User accounts and authentication
- All other application features

Only the **shift calendar** now pulls from Railway database.

## Future Considerations

1. **Database Sync**: Consider syncing Railway shift data to Vercel database for unified data model
2. **Fallback Strategy**: Implement fallback to Vercel database if Railway is unavailable
3. **Caching**: Add Redis caching layer for frequently accessed shift data
4. **Real-time Updates**: Consider webhooks from Discord bot to trigger calendar updates
