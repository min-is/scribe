-- Drop the old unique constraint
ALTER TABLE "Shift" DROP CONSTRAINT IF EXISTS "Shift_date_zone_startTime_scribeId_providerId_key";

-- Remove duplicate shifts, keeping only the most recent one for each (date, zone, startTime) combination
DELETE FROM "Shift" a USING (
  SELECT MIN(ctid) as ctid, date, zone, "startTime"
  FROM "Shift"
  GROUP BY date, zone, "startTime"
  HAVING COUNT(*) > 1
) b
WHERE a.date = b.date
  AND a.zone = b.zone
  AND a."startTime" = b."startTime"
  AND a.ctid <> b.ctid;

-- Add the new unique constraint
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_date_zone_startTime_key" UNIQUE (date, zone, "startTime");
