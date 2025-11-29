# ShiftGen Integration - Phase 1: Database Schema

## Overview

Phase 1 establishes the database foundation for integrating ShiftGen shift scheduling into the Scribe Dashboard website. This phase focuses on:
- Creating database tables for shifts and scribes
- Setting up automatic migrations
- Configuring Vercel Postgres integration
- Preparing for API development in Phase 2

## What Was Completed

### 1. Database Schema

Two new Prisma models were added to `prisma/schema.prisma`:

#### **Scribe Model**
```prisma
model Scribe {
  id               String   @id @default(cuid())
  name             String   @unique
  standardizedName String?  // Standardized name from name mapper

  shifts           Shift[]  @relation("ScribeShifts")

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([name])
}
```

**Purpose:** Store scribe information and link to their shifts.

**Features:**
- Unique names (prevents duplicates)
- Name standardization support (for fuzzy matching)
- One-to-many relationship with shifts

#### **Shift Model**
```prisma
model Shift {
  id        String   @id @default(cuid())
  date      DateTime @db.Date
  zone      String   // Zone identifier (A, B, C, PA, etc.)
  startTime String   // e.g., "0800"
  endTime   String   // e.g., "1600"
  site      String   // Site name

  scribeId     String?
  scribe       Scribe?   @relation("ScribeShifts", fields: [scribeId], references: [id])
  providerId   String?
  provider     Provider? @relation("ProviderShifts", fields: [providerId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([date, zone, startTime, scribeId, providerId])
  @@index([date])
  @@index([scribeId, date])
  @@index([providerId, date])
}
```

**Purpose:** Store shift schedules with scribe-provider pairings.

**Features:**
- Date stored as PostgreSQL `DATE` type (no timezone issues)
- Zone identifier (A, B, C, PA, etc.) for location/assignment
- Start/end times as strings (e.g., "0800", "1600")
- Relations to both Scribe and Provider
- Unique constraint prevents duplicate shifts
- Optimized indexes for date-based queries

#### **Provider Model Extension**

Extended the existing `Provider` model:
```prisma
model Provider {
  // ... existing fields ...

  shifts  Shift[]  @relation("ProviderShifts")
}
```

### 2. Automatic Migration System

Added migration `20251129000000_add_shift_and_scribe_tables` to `scripts/run-migrations.js`:

**Migration Features:**
- ✅ **Idempotent:** Safe to run multiple times
- ✅ **Automatic:** Runs on every build/startup
- ✅ **No manual commands:** Works with Vercel web interface
- ✅ **Creates tables** if they don't exist
- ✅ **Creates indexes** for performance
- ✅ **Creates foreign keys** for data integrity

**How It Works:**

The migration system is already integrated into your build process:

```json
{
  "scripts": {
    "build": "npm run migrate && prisma generate && next build",
    "start": "npm run migrate && next start",
    "dev": "npm run migrate && next dev --turbo"
  }
}
```

Every deployment or local startup:
1. Runs `npm run migrate` (executes `scripts/run-migrations.js`)
2. Connects to database
3. Runs all migrations in order
4. Skips already-applied migrations
5. Generates Prisma Client
6. Starts application

### 3. Database Setup Documentation

Created comprehensive guide at `docs/VERCEL_DATABASE_SETUP.md`:

**Topics Covered:**
- Setting up Vercel Postgres
- Environment variable configuration
- Local development options
- Database management tools
- Migration monitoring
- Troubleshooting
- Security best practices

**Key Takeaway:** No manual `npx` commands needed! Everything runs automatically.

## Database Schema Diagram

```
┌─────────────┐         ┌─────────────┐
│   Scribe    │         │  Provider   │
├─────────────┤         ├─────────────┤
│ id          │         │ id          │
│ name*       │         │ name        │
│ standardized│         │ slug        │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │    ┌─────────────┐    │
       └────│    Shift    │────┘
            ├─────────────┤
            │ id          │
            │ date        │ (DATE)
            │ zone        │ (A, B, C, PA)
            │ startTime   │ (0800)
            │ endTime     │ (1600)
            │ site        │
            │ scribeId    │ (FK → Scribe)
            │ providerId  │ (FK → Provider)
            └─────────────┘

* Unique constraint
```

## Design Decisions

### 1. Separate Database (Not Railway Bridge)

**Decision:** Use Vercel Postgres instead of bridging to Railway Discord bot database

**Rationale:**
- Simpler deployment (everything in Vercel)
- Better performance (same region as app)
- Easier to manage (one platform)
- Can sync data from Discord bot via API

**Implementation:**
- Website has its own Vercel Postgres database
- Discord bot continues using Railway PostgreSQL
- Python scraper POSTs data to website API (Phase 2)
- Both databases stay in sync via scheduled refresh

### 2. Automatic Migrations (No npx Commands)

**Decision:** Use custom SQL migration system instead of Prisma Migrate

**Rationale:**
- Works with Vercel web interface (no CLI access needed)
- Idempotent (safe to run repeatedly)
- Runs automatically on every deployment
- Handles complex migrations gracefully
- Already proven to work in your project

**Implementation:**
- All migrations in `scripts/run-migrations.js`
- SQL uses `IF NOT EXISTS` checks
- Runs via `npm run migrate` on every build/start

### 3. Zone Field (Not Label)

**Decision:** Rename "label" field from Discord bot to "zone"

**Rationale:**
- More semantic and descriptive
- "Zone" better describes location/assignment concept
- Avoids confusion with UI labels/tags
- Matches medical terminology (ER zones)

**Data Mapping:**
```
Discord Bot → Website
"A"  → Zone A  (Blue)
"B"  → Zone B  (Red)
"C"  → Zone C  (Amber)
"D"  → Zone D  (Amber)
"PA" → Zone PA (Emerald)
"FT" → Zone FT (Purple)
```

### 4. Date as PostgreSQL DATE Type

**Decision:** Use `@db.Date` instead of `DateTime`

**Rationale:**
- Shifts are day-based (not time-based)
- Avoids timezone conversion issues
- Simpler queries (`WHERE date = '2025-12-01'`)
- Smaller storage footprint

**Usage:**
```typescript
// Query shifts for a date
const shifts = await prisma.shift.findMany({
  where: {
    date: new Date('2025-12-01')
  }
});
```

### 5. Unique Constraint on Composite Key

**Decision:** Prevent duplicate shifts with composite unique index

**Constraint:** `@@unique([date, zone, startTime, scribeId, providerId])`

**Rationale:**
- One person can't be in two places at once
- Same zone/time can have multiple people (scribe + provider)
- Prevents data corruption from double-syncing
- Enables upsert operations (create or update)

## Next Steps

### Phase 2: API Layer (Next)

**Endpoints to Create:**
```
POST   /api/shifts/sync          # Sync shifts from scraper
GET    /api/shifts               # Query shifts by date
GET    /api/shifts/current       # Currently working
GET    /api/shifts/range         # Date range query
POST   /api/shifts/refresh       # Manual refresh (admin)
```

**Features:**
- Authentication for admin endpoints
- Change detection and notifications
- Scribe/provider fuzzy matching
- Data validation
- Rate limiting

### Phase 3: Frontend Integration

**Components:**
- Update `ScheduleCalendar.tsx` with real data
- Create minimalistic Apple-inspired shift cards
- Add daily detail view
- Implement "currently working" widget
- Zone color coding

### Phase 4: Python Scraper Integration

**Implementation:**
- Keep Python scraper on Railway as separate service
- POST scraped data to `/api/shifts/sync` endpoint
- Authenticate with API key
- Handle errors and retries

### Phase 5: Automation

**Features:**
- Scheduled refresh (12-hour cycle)
- Change detection alerts
- Admin dashboard
- Monitoring and logging

## Testing Checklist

Before moving to Phase 2, verify:

- [ ] Vercel Postgres database created
- [ ] `DATABASE_URL` environment variable set
- [ ] Deploy to Vercel (or run locally)
- [ ] Check deployment logs for migration success
- [ ] Open Prisma Studio: `npx prisma studio`
- [ ] Verify Scribe and Shift tables exist
- [ ] Check indexes are created
- [ ] Verify foreign key constraints work

## SQL Migration Details

The migration creates:

**Tables:**
- `Scribe` - 3 columns + timestamps
- `Shift` - 8 columns + timestamps

**Indexes:**
- `Scribe_name_key` (UNIQUE)
- `Scribe_name_idx`
- `Shift_date_idx`
- `Shift_scribeId_date_idx`
- `Shift_providerId_date_idx`
- `Shift_date_zone_startTime_scribeId_providerId_key` (UNIQUE)

**Foreign Keys:**
- `Shift.scribeId` → `Scribe.id` (SET NULL on delete)
- `Shift.providerId` → `Provider.id` (SET NULL on delete)

**Design Choice:** `SET NULL` instead of `CASCADE` allows keeping shift records even if scribe/provider is deleted (historical data preservation).

## Files Modified

```
scripts/run-migrations.js       # Added shift/scribe migration
prisma/schema.prisma            # Added Scribe and Shift models
docs/VERCEL_DATABASE_SETUP.md  # Database setup guide (new)
docs/SHIFTGEN_PHASE1.md         # This file (new)
```

## Summary

Phase 1 establishes a solid database foundation for ShiftGen integration:

- ✅ **Database schema** designed and documented
- ✅ **Automatic migrations** configured (no manual npx needed)
- ✅ **Vercel Postgres** setup guide created
- ✅ **Separate database** approach (not Railway bridge)
- ✅ **Production-ready** with proper indexes and constraints

The system is ready for Phase 2 (API development) whenever you're ready to proceed!

---

**Completed:** 2025-11-29
**Next Phase:** API Layer Development
