# ShiftGen Integration - Phase 2: API Layer

## Overview

Phase 2 implements the REST API layer for shift scheduling, enabling:
- Querying shift data by date or date range
- Real-time "who's working now" functionality
- Data ingestion from Python scraper (Discord bot)
- Daily schedule views with time period grouping

This phase builds on Phase 1's database foundation and prepares for Phase 3's frontend integration.

---

## What Was Completed

### 1. Core Library (`src/lib/shiftgen/`)

#### **Type Definitions** (`types.ts`)
Comprehensive TypeScript types for:
- `ShiftWithRelations` - Shift with scribe and provider data
- `GroupedShifts` - Shifts organized by time period
- `DailySchedule` - Complete daily view with summary stats
- `CurrentShifts` - Real-time active shifts
- `ScraperShiftData` - Python scraper data format
- `ShiftIngestPayload` - Batch import structure
- `SyncSummary` - Data sync results
- `ShiftChange` - Change detection
- `ZoneConfig` & `ZoneStyles` - UI styling configuration
- `ApiResponse` - Standardized API response wrapper

#### **Constants** (`constants.ts`)
Zone mappings and utilities:
- **Zone Configurations**: Maps A, B, C, D, PA, FT to display names and colors
- **Zone Styling**: Tailwind CSS classes for minimalistic Apple-inspired design
- **Color Schemes**: Inline styles to avoid Tailwind purging issues
- **Time Period Definitions**: Morning (6-12), Afternoon (12-18), Night (18-6)
- **Time Utilities**: Parsing, formatting, and validation helpers
- **Active Shift Detection**: Real-time shift status checking

**Design Philosophy:**
- Subtle colored left borders (3px accent, 30% opacity)
- Muted backgrounds (5% opacity)
- Clean, readable text colors
- Dark mode support
- No color emojis (replaced Discord bot's 🟦🟥🟨🟪🟩 system)

#### **Database Utilities** (`db.ts`)
Production-ready CRUD operations:
- `getShiftsForDate()` - Query shifts for a specific date
- `getShiftsInRange()` - Query with date range and filters
- `getCurrentShifts()` - Real-time active shifts
- `getDailySchedule()` - Grouped shifts with summary stats
- `findOrCreateScribe()` - Fuzzy name matching for scribes
- `findProviderByName()` - Fuzzy provider lookup
- `upsertShift()` - Create or update shift records
- `syncShiftsFromScraper()` - Batch import from Python bot
- `detectChanges()` - Change detection algorithm
- `cleanupOldShifts()` - Automatic data retention
- `getAllScribes()` - List all scribes
- `getScribeWithShifts()` - Scribe profile with shift history

**Features:**
- Fuzzy name matching (handles "Dr. Smith" vs "Smith, MD")
- Automatic scribe creation
- Duplicate prevention via unique constraints
- Error handling and rollback
- Change tracking for notifications

#### **Validators** (`validators.ts`)
Input validation and sanitization:
- `validateShiftData()` - Validate scraper shift data
- `validateShiftQueryParams()` - Validate API query parameters
- `validateDateString()` - Date format validation (YYYY-MM-DD)
- `validateTimeString()` - Time format validation (HHMM-HHMM)
- `sanitizeShiftData()` - Normalize and clean shift data

**Validation Features:**
- Required field checks
- Format validation (dates, times, roles)
- Range validation (date ranges ≤ 90 days)
- Error message accumulation
- Type safety

#### **Main Entry Point** (`index.ts`)
Re-exports all types, constants, and utilities for clean imports:
```typescript
import {
  getShiftsForDate,
  validateShiftData,
  getZoneStyles,
  ApiResponse,
} from '@/lib/shiftgen';
```

---

### 2. REST API Endpoints (`app/api/shifts/`)

#### **GET /api/shifts**
Query shifts for a specific date.

**Parameters:**
- `date` (required): YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-12-01",
    "count": 8,
    "shifts": [ ... ]
  }
}
```

**Use Case:** Calendar date selection

---

#### **GET /api/shifts/current**
Get currently active shifts.

**Parameters:** None

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-12-01T14:30:00Z",
    "count": 3,
    "shifts": [ ... ]
  }
}
```

**Use Case:** "Who's working now?" widget

---

#### **GET /api/shifts/range**
Query shifts within a date range with optional filtering.

**Parameters:**
- `startDate` (required): YYYY-MM-DD
- `endDate` (required): YYYY-MM-DD
- `zone` (optional): Filter by zone
- `scribeId` (optional): Filter by scribe
- `providerId` (optional): Filter by provider
- `site` (optional): Filter by site

**Constraints:**
- Maximum 90-day range
- `startDate` < `endDate`

**Response:**
```json
{
  "success": true,
  "data": {
    "startDate": "2025-12-01",
    "endDate": "2025-12-07",
    "count": 45,
    "shifts": [ ... ]
  }
}
```

**Use Case:** Weekly/monthly calendar views

---

#### **GET /api/shifts/daily**
Get daily schedule with time period grouping and summary.

**Parameters:**
- `date` (required): YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-12-01",
    "summary": {
      "totalShifts": 10,
      "scribesWorking": 4,
      "providersWorking": 3,
      "zones": ["A", "B", "C", "PA"]
    },
    "grouped": {
      "morning": [ ... ],
      "afternoon": [ ... ],
      "night": [ ... ]
    }
  }
}
```

**Use Case:** Daily detail view in calendar

---

#### **POST /api/shifts/ingest**
Ingest shift data from Python scraper.

**Authentication:** Required (API key in `Authorization` header)

**Request Body:**
```json
{
  "shifts": [
    {
      "date": "2025-12-01",
      "label": "A",
      "time": "0800-1600",
      "person": "John Doe",
      "role": "Scribe",
      "site": "St Joseph Scribe"
    }
  ],
  "source": "discord-bot",
  "timestamp": "2025-12-01T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 15,
      "created": 10,
      "updated": 3,
      "unchanged": 2,
      "errors": 0
    }
  },
  "message": "Successfully synced 13 shifts"
}
```

**Features:**
- API key authentication (`SHIFTGEN_API_KEY` env var)
- Batch import with validation
- Fuzzy name matching
- Error tracking (partial success support)
- Duplicate prevention

**Use Case:** Scheduled sync from Python scraper every 12 hours

---

### 3. Documentation

Created comprehensive API documentation:

#### **API Reference** (`docs/SHIFTGEN_API.md`)
- Complete endpoint documentation
- Request/response examples
- Authentication guide
- Data models reference
- Error handling
- Integration examples (Python, Next.js)

#### **Phase 2 Summary** (`docs/SHIFTGEN_PHASE2.md`)
- Implementation overview
- File structure
- Design decisions
- Testing guide
- Next steps

---

## File Structure

```
src/lib/shiftgen/
  ├── index.ts           # Main entry point
  ├── types.ts           # TypeScript type definitions
  ├── constants.ts       # Zone mappings, colors, time periods
  ├── db.ts              # Database CRUD operations
  └── validators.ts      # Input validation and sanitization

app/api/shifts/
  ├── route.ts           # GET /api/shifts (query by date)
  ├── current/
  │   └── route.ts       # GET /api/shifts/current
  ├── range/
  │   └── route.ts       # GET /api/shifts/range
  ├── daily/
  │   └── route.ts       # GET /api/shifts/daily
  └── ingest/
      └── route.ts       # POST /api/shifts/ingest

docs/
  ├── SHIFTGEN_API.md    # API reference documentation
  ├── SHIFTGEN_PHASE1.md # Phase 1 summary (database)
  └── SHIFTGEN_PHASE2.md # Phase 2 summary (API layer)
```

---

## Design Decisions

### 1. Minimalistic Apple-Inspired Design

**Problem:** Discord bot used color emojis (🟦🟥🟨🟪🟩) which don't fit website aesthetic.

**Solution:** Subtle colored accents with muted backgrounds
- 3px left border (30% opacity)
- 5% background opacity
- Dark mode support
- Clean typography

**Example:**
```css
/* Zone A (Blue) */
border-left: 4px solid rgba(59, 130, 246, 0.3);
background-color: rgba(59, 130, 246, 0.05);
```

### 2. Fuzzy Name Matching

**Problem:** Scraper data may have inconsistent names (e.g., "Dr. Smith" vs "Smith, MD").

**Solution:** Standardize names for matching
- Remove titles (Dr., MD, DO, PA, NP)
- Remove punctuation
- Lowercase comparison
- Store both original and standardized names

**Implementation:**
```typescript
function standardizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(dr\.?|md|do|pa|np)\b/gi, '')
    .replace(/[.,]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}
```

### 3. API Response Consistency

**Problem:** Different endpoints may return different response formats.

**Solution:** Standardized `ApiResponse<T>` wrapper
```typescript
{
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}
```

**Benefits:**
- Predictable error handling
- Type safety
- Consistent client-side parsing

### 4. Authentication Strategy

**Problem:** Ingestion endpoint needs protection but query endpoints should be public.

**Solution:** Two-tier authentication
- **Query endpoints**: Public (passcode-protected at page level)
- **Ingestion endpoint**: API key required

**Rationale:**
- Query endpoints are already behind passcode-protected calendar page
- Ingestion endpoint needs machine-to-machine auth (Python bot)
- Simple Bearer token authentication

### 5. Time Period Grouping

**Problem:** Long list of shifts is hard to scan.

**Solution:** Group shifts by time period
- **Morning**: 6 AM - 12 PM (☀️)
- **Afternoon**: 12 PM - 6 PM (🌤️)
- **Night**: 6 PM - 6 AM (🌙)

**Use Case:** Daily detail view in calendar

### 6. Change Detection

**Problem:** Need to notify when schedules are updated.

**Solution:** `detectChanges()` function compares old vs new shifts
- Tracks additions, modifications, removals
- Returns structured change log
- Can be used for notifications in Phase 4

---

## API Authentication Setup

### Step 1: Generate API Key

```bash
# Generate a secure random key (32 characters)
openssl rand -base64 32
```

### Step 2: Add to Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   - **Name**: `SHIFTGEN_API_KEY`
   - **Value**: (paste generated key)
   - **Environments**: Production, Preview, Development

### Step 3: Update Python Scraper (Discord Bot)

Add API key to Railway environment variables:

```bash
# In Railway dashboard
SHIFTGEN_API_KEY=<same-key-from-vercel>
WEBSITE_API_URL=https://yoursite.com/api/shifts/ingest
```

Update Python scraper to POST data:

```python
import requests
import os

API_KEY = os.getenv('SHIFTGEN_API_KEY')
API_URL = os.getenv('WEBSITE_API_URL')

def sync_to_website(shifts_data):
    payload = {
        'shifts': shifts_data,
        'source': 'discord-bot',
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }

    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }

    response = requests.post(API_URL, json=payload, headers=headers)
    print(f"Sync status: {response.status_code}")
```

---

## Testing Guide

### 1. Local Testing

**Start development server:**
```bash
npm run dev
```

**Test query endpoint:**
```bash
curl http://localhost:3000/api/shifts?date=2025-12-01
```

**Test current shifts:**
```bash
curl http://localhost:3000/api/shifts/current
```

**Test daily schedule:**
```bash
curl http://localhost:3000/api/shifts/daily?date=2025-12-01
```

**Test ingestion (requires API key):**
```bash
curl -X POST http://localhost:3000/api/shifts/ingest \
  -H "Authorization: Bearer your-test-key" \
  -H "Content-Type: application/json" \
  -d '{
    "shifts": [
      {
        "date": "2025-12-01",
        "label": "A",
        "time": "0800-1600",
        "person": "Test Scribe",
        "role": "Scribe",
        "site": "St Joseph Scribe"
      }
    ]
  }'
```

### 2. Production Testing

Once deployed to Vercel:

**Test public endpoints:**
```bash
curl https://yoursite.com/api/shifts?date=2025-12-01
curl https://yoursite.com/api/shifts/current
```

**Test ingestion with production API key:**
```bash
curl -X POST https://yoursite.com/api/shifts/ingest \
  -H "Authorization: Bearer $SHIFTGEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d @test-shifts.json
```

### 3. Manual Testing Checklist

- [ ] Query shifts for today's date
- [ ] Query shifts for future date (should return empty if no data)
- [ ] Query shifts with invalid date format (should return 400 error)
- [ ] Get current shifts (verify time-based filtering)
- [ ] Query date range (7 days)
- [ ] Query date range with zone filter
- [ ] Query date range > 90 days (should return 400 error)
- [ ] Get daily schedule with grouping
- [ ] Ingest shifts without API key (should return 401)
- [ ] Ingest shifts with invalid API key (should return 401)
- [ ] Ingest valid shifts with API key (should return 200)
- [ ] Ingest shifts with validation errors (should return 400)

---

## Next Steps

### Phase 3: Frontend Integration

**Goals:**
- Update `ScheduleCalendar.tsx` to use real shift data
- Design minimalistic shift cards (Apple-inspired)
- Create daily detail view modal
- Implement "currently working" widget
- Add zone color coding

**Components to Create:**
- `ShiftCard.tsx` - Individual shift display
- `DailyScheduleView.tsx` - Grouped daily view
- `CurrentShiftsWidget.tsx` - Real-time widget
- `ZoneBadge.tsx` - Zone identifier with styling

**Features:**
- Click date → Show daily schedule modal
- Hover shift → Highlight scribe-provider pairing
- Auto-refresh current shifts every 60 seconds
- Smooth transitions and animations

### Phase 4: Python Scraper Integration

**Goals:**
- Update Discord bot to POST to website API
- Implement scheduled sync (every 12 hours)
- Add error handling and retry logic
- Create sync status monitoring

**Implementation:**
```python
# In Discord bot main loop
import schedule

def sync_shifts():
    # Scrape data from ShiftGen
    shifts_data = scrape_all_sites()

    # POST to website
    sync_to_website(shifts_data)

    # Update Discord (optional)
    update_discord_channels(shifts_data)

# Run every 12 hours
schedule.every(12).hours.do(sync_shifts)
```

### Phase 5: Automation & Monitoring

**Goals:**
- Implement change detection notifications
- Create admin dashboard for manual refresh
- Add monitoring and logging
- Set up alerting for sync failures
- Implement automatic cleanup of old shifts

**Features:**
- Email notifications when schedules change
- Admin page: `/admin/shifts` (manual refresh, view sync logs)
- Sentry error tracking
- Discord webhook for sync status

---

## Performance Considerations

### Database Indexes

Already created in Phase 1:
- `Shift_date_idx` - Fast date queries
- `Shift_scribeId_date_idx` - Fast scribe lookups
- `Shift_providerId_date_idx` - Fast provider lookups
- Unique constraint on composite key

### Caching Strategy (Future)

Recommended for Phase 4:
- Redis cache for current shifts (TTL: 60 seconds)
- Cache daily schedules (TTL: 5 minutes)
- Invalidate cache on ingestion

### Query Optimization

Current optimizations:
- Date stored as `@db.Date` (no timezone issues)
- Ordered results (zone, startTime)
- Include only necessary relations
- Maximum 90-day range limit

---

## Security Considerations

### API Key Protection

✅ **Implemented:**
- API key stored in environment variables only
- Never logged or exposed to client
- Bearer token authentication

❌ **Not Implemented (Future):**
- Key rotation
- Multiple API keys
- IP whitelisting

### Input Validation

✅ **Implemented:**
- All inputs validated before database operations
- Date format validation
- Time format validation
- Role enumeration
- SQL injection prevention (Prisma)

### Rate Limiting

❌ **Not Implemented (Future):**
- Consider adding in Phase 4
- Recommended: 100 requests/minute per IP

---

## Summary

Phase 2 is **complete and production-ready**. The API layer provides:

✅ **Query Endpoints:**
- GET /api/shifts (by date)
- GET /api/shifts/current (real-time)
- GET /api/shifts/range (date range with filters)
- GET /api/shifts/daily (grouped with summary)

✅ **Ingestion Endpoint:**
- POST /api/shifts/ingest (authenticated)
- Batch import with validation
- Fuzzy name matching
- Error tracking

✅ **Core Library:**
- TypeScript types
- Database utilities
- Validators
- Constants and helpers

✅ **Documentation:**
- Complete API reference
- Integration examples
- Testing guide

**What's Next:**
- ⏳ Phase 3: Frontend components
- ⏳ Phase 4: Python scraper integration
- ⏳ Phase 5: Automation and monitoring

---

**Completed:** 2025-11-29
**Next Phase:** Frontend Integration
