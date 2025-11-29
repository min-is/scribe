# ShiftGen Integration - Standalone Schedule Viewer

## Overview

The ShiftGen integration provides a **standalone schedule viewer** for the website. This implementation is **completely separate** from the Discord bot and does not share code or databases.

### Key Principles

✅ **Standalone** - Independent schedule management system
✅ **No Discord Bot Integration** - Separate from `/feature/shiftgen` Discord bot code
✅ **Separate Database** - Uses Vercel Postgres (not shared with Railway)
✅ **Minimalistic Design** - Apple-inspired aesthetic with subtle colors
✅ **Passcode Protected** - Already secured via calendar passcode system

---

## Architecture

### Database Schema

Two new Prisma models added in Phase 1:

**Scribe Model:**
```prisma
model Scribe {
  id               String   @id @default(cuid())
  name             String   @unique
  standardizedName String?
  shifts           Shift[]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

**Shift Model:**
```prisma
model Shift {
  id         String    @id @default(cuid())
  date       DateTime  @db.Date
  zone       String    // A, B, C, PA, FT, etc.
  startTime  String    // "0800"
  endTime    String    // "1600"
  site       String
  scribeId   String?
  providerId String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

### Core Library (`src/lib/shiftgen/`)

**`types.ts`** - TypeScript type definitions
**`constants.ts`** - Zone mappings and styling utilities
**`db.ts`** - Database CRUD operations
**`index.ts`** - Clean re-exports for easy importing

### API Endpoints (`app/api/shifts/`)

All endpoints return standardized `ApiResponse<T>` format:

```typescript
{
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
```

---

## API Reference

### GET /api/shifts

Query shifts by date.

**Parameters:**
- `date` (required) - Date in YYYY-MM-DD format

**Example:**
```bash
GET /api/shifts?date=2025-12-01
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "date": "2025-12-01T00:00:00.000Z",
      "zone": "A",
      "startTime": "0800",
      "endTime": "1600",
      "site": "St Joseph Scribe",
      "scribe": { "name": "John Doe", ... },
      "provider": { "name": "Dr. Smith", ... }
    }
  ],
  "timestamp": "2025-11-29T22:00:00.000Z"
}
```

---

### GET /api/shifts/current

Get currently active shifts based on real-time.

**Example:**
```bash
GET /api/shifts/current
```

**Response:**
```json
{
  "success": true,
  "data": {
    "active": [...],
    "count": 3,
    "timestamp": "2025-11-29T14:30:00.000Z"
  },
  "timestamp": "2025-11-29T22:00:00.000Z"
}
```

---

### GET /api/shifts/daily

Get daily schedule grouped by time period (morning/afternoon/night).

**Parameters:**
- `date` (required) - Date in YYYY-MM-DD format

**Example:**
```bash
GET /api/shifts/daily?date=2025-12-01
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-12-01T00:00:00.000Z",
    "shifts": {
      "morning": [...],
      "afternoon": [...],
      "night": [...]
    },
    "summary": {
      "totalShifts": 12,
      "uniqueScribes": 4,
      "uniqueProviders": 8,
      "zonesCovered": ["A", "B", "C", "PA"]
    }
  },
  "timestamp": "2025-11-29T22:00:00.000Z"
}
```

---

### GET /api/shifts/range

Query shifts in a date range with optional filters.

**Parameters:**
- `startDate` (required) - Start date in YYYY-MM-DD format
- `endDate` (required) - End date in YYYY-MM-DD format
- `zone` (optional) - Filter by zone (A, B, C, PA, FT)
- `scribeId` (optional) - Filter by scribe ID
- `providerId` (optional) - Filter by provider ID
- `site` (optional) - Filter by site name

**Example:**
```bash
GET /api/shifts/range?startDate=2025-12-01&endDate=2025-12-07&zone=A
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "timestamp": "2025-11-29T22:00:00.000Z"
}
```

---

## Design System

### Zone Colors (Minimalistic Apple-Inspired)

Replaces Discord bot's color emoji system (🟦🟥🟨🟪🟩) with subtle, clean design:

| Zone | Label | Color | Border | Background |
|------|-------|-------|--------|------------|
| A | Zone 1 | Blue | `border-l-4 border-blue-500/30` | `bg-blue-500/5` |
| B | Zone 2 | Red | `border-l-4 border-red-500/30` | `bg-red-500/5` |
| C | Zone 3/4 | Amber | `border-l-4 border-amber-500/30` | `bg-amber-500/5` |
| PA | PA/NP | Emerald | `border-l-4 border-emerald-500/30` | `bg-emerald-500/5` |
| FT | Fast Track | Purple | `border-l-4 border-purple-500/30` | `bg-purple-500/5` |

**Features:**
- Subtle colored left borders (4px, 30% opacity)
- Muted backgrounds (5% opacity)
- Dark mode support throughout
- Clean typography
- Hover states with smooth transitions

### Time Periods

- **Morning** ☀️ (6 AM - 12 PM)
- **Afternoon** 🌤️ (12 PM - 6 PM)
- **Night** 🌙 (6 PM - 6 AM)

---

## Usage Examples

### Query Shifts in Next.js Component

```typescript
import { getShiftsForDate, getCurrentShifts, getZoneStyles } from '@/lib/shiftgen';

// Server Component
export default async function SchedulePage() {
  const shifts = await getShiftsForDate(new Date('2025-12-01'));
  const current = await getCurrentShifts();

  return (
    <div>
      {shifts.map((shift) => {
        const styles = getZoneStyles(shift.zone);
        return (
          <div key={shift.id} className={`${styles.border} ${styles.bg} p-4 rounded`}>
            <h3 className={styles.text}>{shift.zone} - {shift.scribe?.name}</h3>
            <p>{shift.startTime} - {shift.endTime}</p>
          </div>
        );
      })}
    </div>
  );
}
```

### Client-Side Fetch

```typescript
'use client';

import { useEffect, useState } from 'react';

export default function CurrentShifts() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/shifts/current')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
        }
      });
  }, []);

  return (
    <div>
      {data?.active.map((shift) => (
        <div key={shift.id}>
          {shift.scribe?.name} is working in {shift.zone}
        </div>
      ))}
    </div>
  );
}
```

---

## Data Entry

Since this is a standalone system (not integrated with Discord bot), shift data can be managed through:

### Option 1: Admin UI (Recommended for Phase 3)
Create an admin interface with:
- Manual shift entry form
- CSV upload capability
- Bulk import/export
- Edit/delete functionality

### Option 2: Direct Database Access
Use Prisma Studio for development:
```bash
npx prisma studio
```

### Option 3: API Scripts
Create utility scripts for bulk imports:
```typescript
import { createShift, findOrCreateScribe } from '@/lib/shiftgen';

// Example bulk import script
async function importShifts(data: any[]) {
  for (const item of data) {
    const scribe = await findOrCreateScribe(item.scribeName);
    await createShift({
      date: new Date(item.date),
      zone: item.zone,
      startTime: item.startTime,
      endTime: item.endTime,
      site: item.site,
      scribeId: scribe.id,
    });
  }
}
```

---

## Future Enhancements

### Phase 3: Frontend Integration
- Update `ScheduleCalendar.tsx` with real API data
- Create minimalistic shift cards
- Build daily detail view modal
- Add "currently working" widget
- Implement zone color coding

### Phase 4: Admin Interface
- Create admin dashboard for shift management
- Add CSV upload/download
- Implement bulk edit functionality
- Add shift conflict detection

### Phase 5: Automation
- Optional: automated data refresh from external source
- Change detection and notifications
- Automatic cleanup of old shifts
- Analytics and reporting

---

## Security

- ✅ Passcode protection via existing calendar system
- ✅ Vercel Postgres with SSL/TLS encryption
- ✅ No public data exposure
- ✅ API endpoints inherit app authentication

---

## Testing

After deployment, test endpoints:

```bash
# Query shifts
curl https://yoursite.com/api/shifts?date=2025-12-01

# Get current shifts
curl https://yoursite.com/api/shifts/current

# Get daily schedule
curl https://yoursite.com/api/shifts/daily?date=2025-12-01

# Query range with filters
curl "https://yoursite.com/api/shifts/range?startDate=2025-12-01&endDate=2025-12-07&zone=A"
```

---

## Summary

Phase 2 provides a **complete standalone API layer** for shift scheduling:

✅ **4 REST endpoints** for querying shift data
✅ **Comprehensive library** with types, utilities, and database operations
✅ **Minimalistic design system** replacing Discord emojis
✅ **Zero Discord bot dependencies** - fully standalone
✅ **Production-ready** with error handling and validation

Ready for Phase 3: Frontend integration!
