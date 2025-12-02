# ShiftGen Bot Improvements - Implementation Summary

## Overview
This document summarizes the major improvements made to the ShiftGen Discord bot, focusing on reliability, monitoring, and data validation.

---

## 1. PostgreSQL Database Migration

### What Changed
- **Migrated from CSV to PostgreSQL** for persistent, reliable data storage
- No more data loss on container restarts (Railway ephemeral filesystem issue solved)
- Database connection managed through `DATABASE_URL` environment variable

### New Files
- `core/postgres_db.py` - PostgreSQL database manager
- `core/models.py` - Pydantic validation models

### Benefits
- ✅ Persistent storage survives Railway restarts
- ✅ Better query performance with indexed columns
- ✅ ACID transaction guarantees
- ✅ Automatic schema initialization on first run

### Database Schema
```sql
CREATE TABLE shifts (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    label VARCHAR(50) NOT NULL,
    time VARCHAR(20) NOT NULL,
    person VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    site VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, label, time, person, role)
);

CREATE TABLE metadata (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Console Channel for Admin Monitoring

### New Command
```
.setconsole
```
Sets the current channel as the admin console for all monitoring, errors, and logs.

### What Gets Logged
- ✅ Refresh attempts and outcomes (success/failure)
- ✅ Login errors with retry information
- ✅ Data validation errors
- ✅ Health check reports (every 6 hours)
- ✅ Daily database backups
- ✅ All error messages with stack traces
- ✅ Command execution logs

### Example Console Messages
```
✅ [02:15:30 PM] Refresh complete: 1247 valid records
⚠️ [02:15:30 PM] Validation error: Invalid time format: 25:00-26:00
❌ [02:45:12 PM] Login failed on attempt 1
⚠️ [02:45:42 PM] Retrying in 30 seconds...
ℹ️ [03:00:00 PM] Starting scheduled refresh...
```

---

## 3. Retry Logic with Exponential Backoff

### How It Works
- **3 retry attempts** for all refresh operations
- **Exponential backoff**: 30s → 60s → 120s
- **All attempts logged to console channel**

### Example Flow
```
Attempt 1: Login failed → Wait 30s
Attempt 2: Login failed → Wait 60s
Attempt 3: Login failed → Wait 120s
All retries failed → Alert admins in console
```

### Benefits
- ✅ Handles temporary network issues
- ✅ Prevents immediate failures from transient errors
- ✅ Full visibility into retry attempts

---

## 4. Pydantic Data Validation

### What Changed
All shift data is validated using Pydantic models before being stored in the database.

### Validation Rules
- ✅ **Date format**: Must be YYYY-MM-DD
- ✅ **Time format**: Must be HHMM-HHMM or HMM-HHMM
- ✅ **Time values**: Hours ≤ 23, Minutes ≤ 59
- ✅ **Role**: Must be "Scribe", "Physician", or "MLP"
- ✅ **Required fields**: No empty person names, labels, or sites

### Error Handling
- Invalid records are **logged to console** but **not stored**
- First 5 validation errors per refresh are detailed in console
- Valid count and invalid count reported after each refresh

### Example
```python
# This would be rejected:
{
    "date": "2025-13-45",  # ❌ Invalid month
    "time": "2500-2600",   # ❌ Invalid hours
    "person": "",          # ❌ Empty name
}

# This would be accepted:
{
    "date": "2025-11-16",  # ✅ Valid
    "time": "0530-1400",   # ✅ Valid
    "person": "Dr. Smith", # ✅ Valid
    "role": "Physician",   # ✅ Valid
}
```

---

## 5. HTML Parsing Validation

### What Changed
HTML structure is validated **before** parsing to detect ShiftGen format changes.

### Validation Checks
- ✅ HTML content not empty
- ✅ Minimum content length (100 characters)
- ✅ Expected CSS markers present (vertical-align, font-size, etc.)
- ✅ Basic HTML tags exist (td, div, span)
- ✅ Calendar header present

### Error Handling
If validation fails:
1. **ValueError raised** with specific error message
2. **Error logged to console** with details
3. **Refresh attempt retried** (up to 3 times)

---

## 6. Command Cooldowns

### Rate Limits Applied
```python
@commands.cooldown(1, 10, commands.BucketType.user)
```

**User Commands** (1 use per 10 seconds):
- `.today`
- `.tomorrow`
- `.current`
- `.schedule`

### Benefits
- ✅ Prevents command spam
- ✅ Avoids Discord API rate limits
- ✅ Better server performance

### User Experience
```
User: .today
Bot: [Shows schedule]
User: .today (< 10 seconds later)
Bot: ⏰ Please wait 8 seconds before using this command again.
```

---

## 7. Loading Indicators for Slow Commands

### Implemented For
- **`.refresh`** - Shows progress through multi-step process
- **`.setup`** - Updates status message during each step

### Example: Refresh Command
```
🔄 Refreshing schedule database... This may take a minute.
↓
🔄 Refresh attempt 1/3...
↓
✅ Database refreshed successfully! Total records: 1247
```

### Example: Setup Command
```
🔄 Running complete setup... This may take a minute.
↓
🔄 Refreshing database from ShiftGen...
↓
🔄 Posting schedules...
↓
✅ Setup complete! Both schedules posted and will auto-update.
```

---

## 8. Discord-Based Monitoring

### Health Check Task
**Runs every 6 hours** - Posts health report to console channel

### Metrics Included
- Database status (Connected/Empty)
- Total record count
- Last refresh timestamp
- Last refresh status (Success/Failed)
- Date range of loaded schedules
- Number of active schedule displays
- Number of active current shift displays

### Example Health Report
```
🏥 Health Check Report

Database Status: ✅ Connected
Total Records: 1247
Last Refresh: 2025-11-16T14:30:00

Date Range: 2025-11-01 to 2025-12-31
Last Refresh Status: ✅ Success

Active Schedule Displays: 2
Active Current Displays: 1
```

---

## 9. Daily Automated Backups

### Backup Task
**Runs every 24 hours** - Exports entire database as CSV to console channel

### What's Included
- All shifts in CSV format
- Metadata (record count, date range)
- Timestamped filename: `schedule_backup_20251116.csv`

### Benefits
- ✅ Historical data preservation
- ✅ Easy data recovery
- ✅ Can be imported into Excel/Google Sheets
- ✅ Audit trail of schedule changes

### Example Backup Message
```
📦 Daily Database Backup

Records: 1247
Date Range: 2025-11-01 to 2025-12-31

[Attached: schedule_backup_20251116.csv]
```

---

## 10. Improved Error Messages

### Before
```
❌ No shifts scheduled for this date
```
**Problem**: Unclear if database is empty or just no shifts that day

### After
```
⚠️ Database Not Loaded

The schedule database hasn't been loaded yet.

This usually means:
• The bot just restarted
• Automatic refresh is in progress (takes ~1 minute)

Try:
• Wait 60 seconds and try again
• Contact a Lead Scribbler if this persists
```

### Date Range Validation
```
⚠️ Today's date (11/16/2025) is outside the loaded schedule
range (11/01 - 11/15)

A Lead Scribbler can run .refresh to update the database.
```

---

## 11. Enhanced Error Handling

### Global Error Handler
All errors now:
- **Logged to console** with full stack trace
- **User-friendly messages** sent to command channel
- **Auto-deleted** after timeout (no channel clutter)

### Error Types Handled
- `CommandNotFound` → "Command not found. Type `.commands`"
- `MissingRequiredArgument` → "Missing required argument"
- `CommandOnCooldown` → "Please wait X seconds"
- `CheckFailure` → "You don't have permission"
- **All other errors** → Logged to console with traceback

---

## Updated Command Reference

### User Commands
```
.today              - Show today's schedule
.tomorrow           - Show tomorrow's schedule
.current            - Show who's working right now
.schedule MM-DD-YYYY - Show schedule for specific date
.commands           - Show help message
```

### Admin Commands (Lead Scribbler or Administrator)
```
.setup                      - Run complete bot setup
.setconsole                 - Set admin console channel ⭐ NEW
.setchannel                 - Set daily schedule channel
.setalertchannel            - Set shift change alert channel
.postschedule               - Post auto-updating schedule
.postcurrent                - Post auto-updating current shifts
.updatenow                  - Force update all displays
.refresh                    - Manually refresh database
.setscheduledate MM-DD-YYYY - Lock schedule to specific date
.devcommands                - Show admin command list
```

---

## Environment Variables Required

### New Requirement: PostgreSQL
Add to your Railway environment variables:
```
DATABASE_URL=postgresql://user:password@host:port/database
```
**Note**: Railway automatically provides this when you add a PostgreSQL database.

### Existing Variables (unchanged)
```
SHIFTGEN_USERNAME=your_username
SHIFTGEN_PASSWORD=your_password
DISCORD_BOT_TOKEN=your_bot_token
```

---

## Migration Guide

### For Railway Deployment

1. **Add PostgreSQL Database**
   - In Railway dashboard: "New" → "Database" → "PostgreSQL"
   - Railway will automatically set `DATABASE_URL` environment variable

2. **Redeploy the Bot**
   - Push changes to GitHub
   - Railway will auto-deploy

3. **Set Up Console Channel**
   - In Discord, go to a private admin channel
   - Run `.setconsole`

4. **Initial Refresh**
   - The bot will auto-refresh on startup if database is empty
   - Or manually run `.refresh`

5. **Verify**
   - Check console channel for success messages
   - Run `.today` to test

### Expected First-Run Behavior
```
[Server Console]
Bot logged in as ShiftGenBot#1234
Connected to 1 server(s)
✅ PostgreSQL connected: 0 records in database
Started current shifts auto-update (every 10 minutes)
Started schedule auto-refresh (every 2 hours)
Started daily backup task
Started health check task (every 6 hours)
🔄 Database empty - running automatic refresh...

[Discord Console Channel]
⚠️ [02:00:00 PM] Database empty on startup - running automatic refresh...
ℹ️ [02:00:01 PM] Starting refresh attempt 1/3...
ℹ️ [02:00:05 PM] Login successful - fetching schedules...
✅ [02:01:23 PM] Refresh complete: 1247 valid records
```

---

## Technical Architecture

### New Module Structure
```
shiftgen_datamine/
├── bot.py                      (Updated - PostgreSQL integration)
├── requirements.txt            (Updated - added psycopg2, pydantic)
├── core/
│   ├── models.py              (NEW - Pydantic validation models)
│   ├── postgres_db.py         (NEW - PostgreSQL database manager)
│   ├── discord_formatter.py   (NEW - Discord embed formatting)
│   ├── parser.py              (Updated - HTML validation)
│   ├── database.py            (Legacy - kept for reference)
│   ├── scraper.py             (Unchanged)
│   ├── name_mapper.py         (Unchanged)
│   ├── config.py              (Unchanged)
│   └── main.py                (Unchanged)
```

### Dependencies Added
```
psycopg2-binary>=2.9.0  # PostgreSQL adapter
pydantic>=2.0.0         # Data validation
```

---

## Troubleshooting

### Issue: Bot won't start - PostgreSQL error
**Cause**: DATABASE_URL not set or PostgreSQL not running

**Solution**:
1. Check Railway dashboard for PostgreSQL database
2. Verify `DATABASE_URL` in environment variables
3. Ensure PostgreSQL is running

### Issue: No messages in console channel
**Cause**: Console channel not set

**Solution**:
1. Go to desired admin channel
2. Run `.setconsole`
3. Check for confirmation message

### Issue: Refresh fails repeatedly
**Cause**: ShiftGen login issues or HTML format change

**Solution**:
1. Check console channel for detailed error messages
2. Verify SHIFTGEN credentials are correct
3. If HTML validation errors, ShiftGen may have changed format

### Issue: Validation errors for all records
**Cause**: Parser not matching new ShiftGen format

**Solution**:
1. Check console channel for specific validation errors
2. HTML validation should catch format changes
3. May need to update regex patterns in `parser.py`

---

## Performance Improvements

### Database Queries
- **Indexed columns**: date, role, person
- **Faster lookups** for daily schedules
- **Efficient change detection** using database comparisons

### Memory Usage
- **No in-memory CSV loading** on each operation
- **Streaming database queries** for large datasets
- **Connection pooling** via psycopg2

### Network Resilience
- **Retry logic** handles transient failures
- **Exponential backoff** prevents overwhelming ShiftGen
- **Graceful degradation** if refresh fails

---

## Future Enhancements (Suggested)

1. **Persistent Channel Config**: Store channel IDs in database
2. **User Preferences**: Allow users to set notification preferences
3. **Schedule Subscriptions**: DM users their personal schedules
4. **Multi-Guild Support**: Support multiple Discord servers
5. **Web Dashboard**: View console logs via web interface
6. **Metrics/Analytics**: Track command usage, popular times
7. **Schedule Diff View**: Show exactly what changed between refreshes

---

## Summary of Fixes

### Critical Issues Resolved
✅ **Railway ephemeral filesystem** - PostgreSQL persistence
✅ **Silent failures** - Console logging with full visibility
✅ **Network errors** - Retry logic with exponential backoff
✅ **Data validation** - Pydantic models catch bad data
✅ **HTML parsing fragility** - Validation detects format changes

### User Experience Improvements
✅ **Command cooldowns** - Prevents spam
✅ **Loading indicators** - Users see progress
✅ **Better error messages** - Clear, actionable feedback
✅ **Date range validation** - Warns when data is stale

### Admin/Monitoring Improvements
✅ **Console channel** - Centralized logging
✅ **Health checks** - Automated monitoring (every 6 hours)
✅ **Daily backups** - Historical data preservation
✅ **Validation errors logged** - Know when data is bad

---

## Testing Checklist

### Before Going Live
- [ ] PostgreSQL database added in Railway
- [ ] `DATABASE_URL` environment variable set
- [ ] Bot starts without errors
- [ ] Console channel configured with `.setconsole`
- [ ] Initial refresh completes successfully
- [ ] `.today` command returns data
- [ ] Health check appears in console after 6 hours
- [ ] Daily backup appears in console after 24 hours

### Test Commands
- [ ] `.today` - Shows today's schedule
- [ ] `.refresh` - Manually refreshes database
- [ ] `.setup` - Complete setup works
- [ ] `.commands` - Help message displays
- [ ] Test command cooldown (run `.today` twice rapidly)
- [ ] Verify error handling (run `.schedule` without date)

---

## Questions or Issues?

If you encounter any problems:
1. Check the **console channel** for detailed error messages
2. Review the **server logs** in Railway dashboard
3. Verify all **environment variables** are set correctly
4. Ensure **PostgreSQL database** is running in Railway

---

**Implementation Date**: November 16, 2025
**Version**: 2.0.0
**Breaking Changes**: Requires PostgreSQL database
**Backward Compatibility**: Old CSV-based code preserved in `core/database.py` for reference
