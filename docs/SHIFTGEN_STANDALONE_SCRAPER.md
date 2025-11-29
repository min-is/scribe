# ShiftGen Standalone Webscraper

**Phase 2 Implementation**: Standalone webscraping system for shift scheduling data.

---

## Overview

This is a **completely standalone** shift scheduling system that webscrapes data directly from ShiftGen's legacy API. It does NOT integrate with the Discord bot - instead, it manages its own database independently.

---

## Architecture

### Components

1. **Scraper** (`src/lib/shiftgen/scraper.ts`)
   - Authenticates with legacy.shiftgen.com
   - Manages session cookies
   - Navigates between sites
   - Fetches schedule HTML

2. **Parser** (`src/lib/shiftgen/parser.ts`)
   - Parses HTML calendar data
   - Extracts shift information
   - Handles various shift formats

3. **Name Mapper** (`src/lib/shiftgen/name-mapper.ts`)
   - Standardizes provider/scribe names
   - Loads from JSON legend file
   - Auto-discovers new names

4. **Sync Service** (`src/lib/shiftgen/sync.ts`)
   - Orchestrates scraping process
   - Syncs data to Vercel Postgres
   - Handles fuzzy provider matching

5. **API Endpoint** (`app/api/shifts/scrape/route.ts`)
   - Triggers manual scraping
   - Protected by API key
   - Returns sync results

---

## Setup Instructions

### 1. Environment Variables

Add to Vercel (Settings → Environment Variables):

```env
# ShiftGen Credentials (for scraping)
SHIFTGEN_USERNAME=your-email@example.com
SHIFTGEN_PASSWORD=your-password

# API Key (for triggering scrapes)
SHIFTGEN_API_KEY=<generate-secure-random-key>
```

**Generate API key:**
```bash
openssl rand -base64 32
```

### 2. Install Dependencies

The scraper requires `cheerio` for HTML parsing:

```bash
npm install
```

### 3. Database Setup

The database schema is already in place from Phase 1:
- `Scribe` model: stores scribe information
- `Shift` model: stores shift schedules
- `Provider` model: extended with shift relations

---

## Usage

### Trigger Manual Scrape

```bash
curl -X POST https://yoursite.com/api/shifts/scrape \
  -H "Authorization: Bearer $SHIFTGEN_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "shiftsScraped": 450,
  "shiftsCreated": 120,
  "shiftsUpdated": 15,
  "errors": [],
  "timestamp": "2025-11-29T23:00:00.000Z"
}
```

### Error Handling

If errors occur, they're included in the response:

```json
{
  "success": true,
  "shiftsScraped": 450,
  "shiftsCreated": 118,
  "shiftsUpdated": 15,
  "errors": [
    "Provider not found: Dr. NewProvider (Physician)",
    "Failed to fetch schedule: January 2026"
  ],
  "timestamp": "2025-11-29T23:00:00.000Z"
}
```

---

## Scraping Process

1. **Login** to legacy.shiftgen.com with credentials
2. **Iterate sites** (3 sites: Scribe, Physician, MLP)
3. **Change site** via dropdown
4. **Fetch schedules** available for that site
5. **Get printable version** of each schedule (HTML)
6. **Parse calendar** HTML into structured data
7. **Standardize names** using legend file
8. **Sync to database**:
   - Create/update Scribe records
   - Match Providers by name (fuzzy matching)
   - Upsert Shift records

---

## Name Standardization

The scraper uses a JSON legend file (`feature/shiftgen/name_legend.json`) to standardize names:

**Example legend:**
```json
{
  "physicians": {
    "MERJANIAN": "Dr. Merjanian",
    "SMITH": "Dr. Smith"
  },
  "mlps": {
    "DEOGRACIA": "Reagan Deogracia",
    "FURTEK": "Marryanne Furtek"
  }
}
```

**Auto-Discovery:**
- If a name isn't in the legend, the scraper auto-generates a default format:
  - Physicians: `Dr. [TitleCase]`
  - MLPs: `[TitleCase], PA-C`
  - Scribes: `[TitleCase]`
- New names are automatically added to the legend file for review

---

## Data Flow

```
ShiftGen Legacy API
        ↓
   [Scraper] Login & fetch HTML
        ↓
    [Parser] Extract shifts from HTML
        ↓
  [Name Mapper] Standardize names
        ↓
  [Sync Service] Match providers & save
        ↓
  Vercel Postgres Database
```

---

## Sites Scraped

From `src/lib/shiftgen/config.ts`:

1. **St Joseph Scribe** (ID: 82)
   - Role: Scribe
   - Stores scribe shift data

2. **St Joseph/CHOC Physician** (ID: 80)
   - Role: Physician
   - Matches to existing Provider records

3. **St Joseph/CHOC MLP** (ID: 84)
   - Role: MLP (Mid-Level Provider)
   - Matches to existing Provider records

---

## Provider Matching

The sync service uses **fuzzy matching** to link shifts to existing providers:

1. **Clean name**: Remove "Dr.", "MD", "DO", "PA-C", etc.
2. **Exact match**: Search for contains (case-insensitive)
3. **Last name match**: If no exact match, try last name only
4. **Not found**: Log error and skip shift

**Example:**
- Scraped: "MERJANIAN"
- Legend: "Dr. Merjanian"
- Database search: Contains "Merjanian" (case-insensitive)
- Match: Provider with name "Dr. Merjanian" or "Merjanian, MD"

---

## Scheduling Automated Scrapes

### Option 1: Vercel Cron (Recommended)

Create `app/api/cron/refresh-shifts/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { scrapeAndSync } from '@/lib/shiftgen/sync';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await scrapeAndSync();
  return NextResponse.json(result);
}
```

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-shifts",
      "schedule": "0 */12 * * *"
    }
  ]
}
```

This runs every 12 hours.

### Option 2: GitHub Actions

Create `.github/workflows/scrape-shifts.yml`:

```yaml
name: Scrape Shifts

on:
  schedule:
    - cron: '0 */12 * * *'  # Every 12 hours
  workflow_dispatch:  # Manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger scrape
        run: |
          curl -X POST https://yoursite.com/api/shifts/scrape \
            -H "Authorization: Bearer ${{ secrets.SHIFTGEN_API_KEY }}"
```

---

## Security Notes

1. **API Key Protection**: The scrape endpoint requires Bearer token authentication
2. **Environment Variables**: Store all credentials in Vercel environment variables
3. **HTTPS Only**: ShiftGen credentials are transmitted over HTTPS
4. **No Public Scraping**: Only authenticated requests can trigger scraping

---

## Troubleshooting

### "Login failed"
- Check `SHIFTGEN_USERNAME` and `SHIFTGEN_PASSWORD` are correct
- Verify credentials work at legacy.shiftgen.com

### "Provider not found" errors
- Provider doesn't exist in database
- Add provider via admin interface first
- Or update fuzzy matching logic to be more lenient

### "Failed to fetch schedule"
- ShiftGen site may be down
- Network timeout (increase timeout in scraper)
- Schedule doesn't have printable version

### Shifts not appearing
- Check date format (must be YYYY-MM-DD)
- Verify time parsing (e.g., "0800-1600" → "0800", "1600")
- Ensure zone/label is extracted correctly

---

## Testing

### Local Testing

1. Set environment variables in `.env.local`:
```env
SHIFTGEN_USERNAME=your-email
SHIFTGEN_PASSWORD=your-password
SHIFTGEN_API_KEY=test-key-123
DATABASE_URL=your-postgres-url
```

2. Run development server:
```bash
npm run dev
```

3. Trigger scrape:
```bash
curl -X POST http://localhost:3000/api/shifts/scrape \
  -H "Authorization: Bearer test-key-123"
```

---

## Next Steps (Phase 3)

Phase 3 will implement the frontend integration:

1. Update `ScheduleCalendar.tsx` with real shift data
2. Create minimalistic shift cards (Apple-inspired design)
3. Build daily detail view modal
4. Add "currently working" widget
5. Implement zone color coding

---

## Key Differences from Discord Bot

| Discord Bot | Website |
|-------------|---------|
| Python (requests, BeautifulSoup) | TypeScript (cheerio) |
| CSV storage | Vercel Postgres |
| Discord embeds with emoji | Minimalistic web UI |
| Auto-refresh every 12h via bot loop | Manual trigger or Vercel Cron |
| Railway PostgreSQL | Vercel Postgres |

**No shared infrastructure** - completely independent systems.

---

## Files Created

```
src/lib/shiftgen/
  ├── config.ts           # Configuration constants
  ├── types.ts            # TypeScript type definitions
  ├── scraper.ts          # ShiftGen scraper (login, fetch)
  ├── parser.ts           # HTML parser
  ├── name-mapper.ts      # Name standardization
  ├── sync.ts             # Database sync orchestrator
  └── index.ts            # Main entry point

app/api/shifts/
  └── scrape/
      └── route.ts        # POST /api/shifts/scrape endpoint

docs/
  └── SHIFTGEN_STANDALONE_SCRAPER.md  # This file
```

---

## Summary

Phase 2 provides a **complete standalone webscraping system** for shift data:

✅ **TypeScript scraper** (port of Python bot)
✅ **HTML parsing** with cheerio
✅ **Name standardization** with legend file
✅ **Database synchronization** to Vercel Postgres
✅ **API endpoint** for triggering scrapes
✅ **Fuzzy provider matching** for linking shifts
✅ **Comprehensive error handling** and logging
✅ **Zero Discord bot dependencies**

Ready for Phase 3 (Frontend Integration)!
