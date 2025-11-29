# ShiftGen API Documentation

Phase 2 of ShiftGen integration provides REST API endpoints for querying and managing shift schedules.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [GET /api/shifts](#get-apishifts)
  - [GET /api/shifts/current](#get-apishiftscurrent)
  - [GET /api/shifts/range](#get-apishiftsrange)
  - [GET /api/shifts/daily](#get-apishiftsdaily)
  - [POST /api/shifts/ingest](#post-apishiftsingest)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Overview

The ShiftGen API provides endpoints for:
- Querying shift schedules by date or date range
- Getting currently active shifts ("who's working now")
- Ingesting shift data from the Python scraper (Discord bot)
- Retrieving daily schedules with time period grouping

All endpoints return JSON responses in a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "timestamp": "2025-12-01T10:00:00.000Z"
}
```

---

## Authentication

### Public Endpoints
Most query endpoints are **public** (no authentication required):
- `GET /api/shifts`
- `GET /api/shifts/current`
- `GET /api/shifts/range`
- `GET /api/shifts/daily`

These endpoints are passcode-protected at the application level (calendar page).

### Protected Endpoints
Data ingestion endpoints require **API key authentication**:
- `POST /api/shifts/ingest`

**Authentication Format:**
```
Authorization: Bearer <api-key>
```

**Setup:**
Set the `SHIFTGEN_API_KEY` environment variable in Vercel:
```bash
SHIFTGEN_API_KEY=your-secure-random-key-here
```

**Example with curl:**
```bash
curl -X POST https://yoursite.com/api/shifts/ingest \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d @shifts.json
```

---

## Endpoints

### GET /api/shifts

Query shifts for a specific date.

**Query Parameters:**
- `date` (required): Date in `YYYY-MM-DD` format

**Example Request:**
```
GET /api/shifts?date=2025-12-01
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-12-01",
    "count": 8,
    "shifts": [
      {
        "id": "cm123abc",
        "date": "2025-12-01",
        "zone": "A",
        "startTime": "0800",
        "endTime": "1600",
        "site": "St Joseph Scribe",
        "scribe": {
          "id": "scribe123",
          "name": "John Doe"
        },
        "provider": {
          "id": "provider123",
          "name": "Dr. Smith",
          "credentials": "MD"
        }
      }
    ]
  },
  "timestamp": "2025-12-01T10:00:00.000Z"
}
```

**Error Responses:**
- `400` - Missing or invalid date parameter
- `500` - Internal server error

---

### GET /api/shifts/current

Get currently active shifts based on the current time.

**Example Request:**
```
GET /api/shifts/current
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-12-01T14:30:00.000Z",
    "count": 3,
    "shifts": [
      {
        "id": "cm123abc",
        "date": "2025-12-01",
        "zone": "A",
        "startTime": "0800",
        "endTime": "1600",
        "site": "St Joseph Scribe",
        "scribe": {
          "id": "scribe123",
          "name": "John Doe"
        },
        "provider": {
          "id": "provider123",
          "name": "Dr. Smith",
          "credentials": "MD"
        }
      }
    ]
  },
  "timestamp": "2025-12-01T14:30:00.000Z"
}
```

**Use Case:** "Who's working right now?" widget on the dashboard.

---

### GET /api/shifts/range

Query shifts within a date range with optional filtering.

**Query Parameters:**
- `startDate` (required): Start date in `YYYY-MM-DD` format
- `endDate` (required): End date in `YYYY-MM-DD` format
- `zone` (optional): Filter by zone (e.g., "A", "B", "PA")
- `scribeId` (optional): Filter by scribe ID
- `providerId` (optional): Filter by provider ID
- `site` (optional): Filter by site name

**Constraints:**
- Maximum range: 90 days
- `startDate` must be before `endDate`

**Example Request:**
```
GET /api/shifts/range?startDate=2025-12-01&endDate=2025-12-07&zone=A
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "startDate": "2025-12-01",
    "endDate": "2025-12-07",
    "filters": {
      "zone": "A",
      "scribeId": null,
      "providerId": null,
      "site": null
    },
    "count": 12,
    "shifts": [ ... ]
  },
  "timestamp": "2025-12-01T10:00:00.000Z"
}
```

**Error Responses:**
- `400` - Missing parameters or invalid date range
- `500` - Internal server error

---

### GET /api/shifts/daily

Get daily schedule with shifts grouped by time period and summary statistics.

**Query Parameters:**
- `date` (required): Date in `YYYY-MM-DD` format

**Example Request:**
```
GET /api/shifts/daily?date=2025-12-01
```

**Example Response:**
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
      "morning": [
        {
          "id": "cm123abc",
          "zone": "A",
          "time": "06:00 - 14:00",
          "startTime": "0600",
          "endTime": "1400",
          "site": "St Joseph Scribe",
          "scribe": { "id": "scribe123", "name": "John Doe" },
          "provider": { "id": "provider123", "name": "Dr. Smith", "credentials": "MD" }
        }
      ],
      "afternoon": [ ... ],
      "night": [ ... ]
    },
    "allShifts": [ ... ]
  },
  "timestamp": "2025-12-01T10:00:00.000Z"
}
```

**Time Periods:**
- **Morning**: 6:00 AM - 12:00 PM
- **Afternoon**: 12:00 PM - 6:00 PM
- **Night**: 6:00 PM - 6:00 AM

**Use Case:** Calendar daily detail view with organized shift display.

---

### POST /api/shifts/ingest

Ingest shift data from Python scraper (Discord bot).

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

**Field Descriptions:**
- `shifts` (required): Array of shift objects
  - `date` (required): Date in `YYYY-MM-DD` format
  - `label` (required): Zone identifier (A, B, C, PA, FT, etc.)
  - `time` (required): Time range in `HHMM-HHMM` or `HH:MM-HH:MM` format
  - `person` (required): Name of scribe or provider
  - `role` (required): "Scribe", "Physician", or "MLP"
  - `site` (required): Site name
- `source` (optional): Source identifier (e.g., "discord-bot", "manual")
- `timestamp` (optional): ISO timestamp of when data was scraped

**Example Response (Success):**
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
    },
    "source": "discord-bot",
    "scraperTimestamp": "2025-12-01T10:00:00Z",
    "errors": []
  },
  "message": "Successfully synced 13 shifts",
  "timestamp": "2025-12-01T10:05:00.000Z"
}
```

**Example Response (Partial Errors):**
```json
{
  "success": false,
  "data": {
    "summary": {
      "total": 15,
      "created": 10,
      "updated": 3,
      "unchanged": 0,
      "errors": 2
    },
    "source": "discord-bot",
    "scraperTimestamp": "2025-12-01T10:00:00Z",
    "errors": [
      {
        "shift": { "date": "2025-12-01", ... },
        "error": "Provider not found: Dr. Unknown"
      }
    ]
  },
  "message": "Sync completed with 2 errors",
  "timestamp": "2025-12-01T10:05:00.000Z"
}
```

**HTTP Status Codes:**
- `200` - Success (all shifts synced)
- `207` - Multi-Status (partial success, some errors)
- `400` - Validation error
- `401` - Unauthorized (missing or invalid API key)
- `500` - Internal server error

**Use Case:** Scheduled data sync from Python scraper every 12 hours.

---

## Data Models

### Shift Object

```typescript
{
  id: string;                    // Unique shift ID
  date: string;                  // Date (YYYY-MM-DD)
  zone: string;                  // Zone identifier (A, B, C, PA, FT)
  startTime: string;             // Start time (HHMM format)
  endTime: string;               // End time (HHMM format)
  site: string;                  // Site name
  scribe: {                      // Scribe (if role is Scribe)
    id: string;
    name: string;
  } | null;
  provider: {                    // Provider (if role is Physician/MLP)
    id: string;
    name: string;
    credentials: string | null;
  } | null;
}
```

### Zone Identifiers

| Zone | Name               | Color   | Description          |
|------|--------------------|---------|----------------------|
| A    | Zone 1             | Blue    | Main emergency zone  |
| B    | Zone 2             | Red     | Secondary zone       |
| C    | Zone 3             | Amber   | Tertiary zone        |
| D    | Zone 4             | Amber   | Quaternary zone      |
| PA   | Physician Assistant| Emerald | PA coverage          |
| FT   | Fast Track         | Purple  | Fast track zone      |

### Roles

- **Scribe**: Medical scribe
- **Physician**: Attending physician
- **MLP**: Mid-level provider (PA, NP)

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "timestamp": "2025-12-01T10:00:00.000Z"
}
```

**Common Error Types:**
- `"Validation error"` - Invalid input parameters
- `"Unauthorized"` - Missing or invalid API key
- `"Internal server error"` - Unexpected server error

**HTTP Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Currently, there is **no rate limiting** implemented. This may be added in future phases.

**Recommendations:**
- Cache shift data on the client side
- Use date range queries instead of multiple single-date queries
- Avoid polling `/api/shifts/current` more frequently than every 60 seconds

---

## Integration Examples

### Python Scraper (Discord Bot)

```python
import requests
import os

API_KEY = os.getenv('SHIFTGEN_API_KEY')
API_URL = 'https://yoursite.com/api/shifts/ingest'

def sync_shifts(shifts_data):
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

    if response.status_code in [200, 207]:
        result = response.json()
        print(f"Synced: {result['data']['summary']}")
    else:
        print(f"Error: {response.text}")

# Example shift data from scraper
shifts = [
    {
        'date': '2025-12-01',
        'label': 'A',
        'time': '0800-1600',
        'person': 'John Doe',
        'role': 'Scribe',
        'site': 'St Joseph Scribe'
    }
]

sync_shifts(shifts)
```

### Next.js Frontend (Calendar Component)

```typescript
// Fetch daily schedule for calendar
async function getDailySchedule(date: string) {
  const response = await fetch(`/api/shifts/daily?date=${date}`);
  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.message);
  }
}

// Fetch currently working
async function getCurrentShifts() {
  const response = await fetch('/api/shifts/current');
  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.message);
  }
}
```

---

## Next Steps

### Phase 3: Frontend Integration
- Update `ScheduleCalendar.tsx` to use real API data
- Create minimalistic shift cards with Apple-inspired design
- Implement daily detail view
- Add "currently working" widget

### Phase 4: Automation
- Set up scheduled cron job for scraper sync
- Implement change detection and notifications
- Create admin dashboard for manual refresh

---

**Last Updated:** 2025-11-29
**Version:** 2.0 (Phase 2)
