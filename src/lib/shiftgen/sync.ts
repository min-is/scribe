/**
 * ShiftGen Sync Service
 *
 * Orchestrates scraping, parsing, and database synchronization
 */

import { ShiftGenScraper } from './scraper';
import { ScheduleParser, RawShiftData } from './parser';
import { NameMapper } from './name-mapper';
import { SITES_TO_FETCH, SITE_CHANGE_DELAY, PAGE_LOAD_DELAY } from './config';
import { findOrCreateScribe, findOrCreateProvider, upsertShift } from './db';

export interface SyncResult {
  success: boolean;
  shiftsScraped: number;
  shiftsCreated: number;
  shiftsUpdated: number;
  errors: string[];
  timestamp: string;
}

export class ShiftGenSyncService {
  private scraper: ShiftGenScraper;
  private parser: ScheduleParser;
  private nameMapper: NameMapper;

  constructor(username?: string, password?: string) {
    this.scraper = new ShiftGenScraper(username, password);
    this.parser = new ScheduleParser();
    this.nameMapper = new NameMapper();
  }

  /**
   * Run full sync: scrape, parse, and save to database
   */
  async runSync(): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      shiftsScraped: 0,
      shiftsCreated: 0,
      shiftsUpdated: 0,
      errors: [],
      timestamp: new Date().toISOString(),
    };

    try {
      // Load name legend
      await this.nameMapper.loadLegend();

      // Login
      console.log('Logging in to ShiftGen...');
      const loggedIn = await this.scraper.login();
      if (!loggedIn) {
        result.errors.push('Failed to login to ShiftGen');
        return result;
      }
      console.log('✓ Logged in successfully');

      // Process each site
      for (const site of SITES_TO_FETCH) {
        console.log(`\nProcessing site: ${site.name} (ID: ${site.id})`);

        // Change to site
        const changed = await this.scraper.changeSite(site.id, site.name);
        if (!changed) {
          result.errors.push(`Failed to change to site: ${site.name}`);
          continue;
        }

        await this.delay(SITE_CHANGE_DELAY);

        // Fetch schedules
        const schedules = await this.scraper.fetchSchedules();
        console.log(`Found ${schedules.length} schedule(s)`);

        for (const schedule of schedules) {
          console.log(`  Fetching: ${schedule.title}`);

          const html = await this.scraper.getPrintableSchedule(schedule.id);
          if (!html) {
            result.errors.push(`Failed to fetch schedule: ${schedule.title}`);
            continue;
          }

          await this.delay(PAGE_LOAD_DELAY);

          // Parse shifts
          const shifts = this.parser.parseCalendar(html, site.name);
          console.log(`    Parsed ${shifts.length} shift(s)`);
          result.shiftsScraped += shifts.length;

          // Match scribes with providers and save to database
          const matchedShifts = this.matchScribesWithProviders(shifts);
          console.log(`    Matched into ${matchedShifts.length} shift(s) with providers`);

          for (const shift of matchedShifts) {
            try {
              const syncShiftResult = await this.syncShiftToDatabase(shift);
              if (syncShiftResult.created) {
                result.shiftsCreated++;
              } else if (syncShiftResult.updated) {
                result.shiftsUpdated++;
              }
            } catch (error) {
              const errorMsg = `Failed to sync shift: ${JSON.stringify(shift)} - ${error}`;
              result.errors.push(errorMsg);
              console.error(`      ✗ ${errorMsg}`);
            }
          }
        }
      }

      // Save any new providers discovered
      await this.nameMapper.saveUpdates();

      result.success = result.errors.length === 0;
      console.log('\n✓ Sync complete');
      console.log(`  Shifts scraped: ${result.shiftsScraped}`);
      console.log(`  Shifts created: ${result.shiftsCreated}`);
      console.log(`  Shifts updated: ${result.shiftsUpdated}`);
      console.log(`  Errors: ${result.errors.length}`);

      return result;
    } catch (error) {
      result.errors.push(`Sync failed: ${error}`);
      console.error('Sync error:', error);
      return result;
    }
  }

  /**
   * Match scribes with their providers based on date, zone, and time
   * Following the same logic as the Discord bot
   *
   * Now uses normalized shift letters (A, B, C, etc.) which are consistent
   * between scribe and provider schedules thanks to getShiftLetterFromTime()
   */
  private matchScribesWithProviders(shifts: RawShiftData[]): RawShiftData[] {
    const matchedShifts: RawShiftData[] = [];
    const processedIndices = new Set<number>();

    for (let i = 0; i < shifts.length; i++) {
      const shift = shifts[i];

      // Only process scribe shifts
      if (shift.role !== 'Scribe' || processedIndices.has(i)) {
        continue;
      }

      const isPaShift = shift.label === 'PA';
      let matchingProvider: RawShiftData | null = null;

      // Find matching provider
      for (let j = 0; j < shifts.length; j++) {
        const other = shifts[j];

        // Must be same date
        if (other.date !== shift.date) continue;

        if (isPaShift && other.role === 'MLP') {
          // For PA shifts, match MLPs by time overlap
          if (this.timesOverlapOrClose(shift.time, other.time)) {
            matchingProvider = other;
            processedIndices.add(j);
            break;
          }
        } else if (other.role === 'Physician') {
          // For regular shifts, match physicians by normalized shift letter AND time
          // Both scribe and physician schedules now have normalized labels (A, B, C, etc.)
          if (other.time === shift.time && other.label === shift.label) {
            matchingProvider = other;
            processedIndices.add(j);
            break;
          }
        }
      }

      // Create matched shift with both scribe and provider
      matchedShifts.push({
        ...shift,
        providerName: matchingProvider?.person,
        providerRole: matchingProvider?.role,
      });

      processedIndices.add(i);
    }

    return matchedShifts;
  }

  /**
   * Check if two shift times overlap or start within tolerance
   * For PA matching: scribe 1000-1830 should match MLP 1000-2000
   */
  private timesOverlapOrClose(time1: string, time2: string, toleranceMinutes: number = 60): boolean {
    try {
      const [start1, end1] = time1.split('-');
      const [start2, end2] = time2.split('-');

      const toMinutes = (time: string): number => {
        const padded = time.padStart(4, '0');
        const h = parseInt(padded.substring(0, 2));
        const m = parseInt(padded.substring(2, 4));
        return h * 60 + m;
      };

      const s1 = toMinutes(start1);
      const s2 = toMinutes(start2);

      return Math.abs(s1 - s2) <= toleranceMinutes;
    } catch {
      return false;
    }
  }

  /**
   * Sync a single shift to the database
   */
  private async syncShiftToDatabase(
    shift: RawShiftData & { providerName?: string; providerRole?: string }
  ): Promise<{ created: boolean; updated: boolean }> {
    // Standardize scribe name
    const scribeStandardizedName = this.nameMapper.standardizeName(shift.person, shift.role);

    // Parse time
    const [startTime, endTime] = shift.time.split('-');
    if (!startTime || !endTime) {
      throw new Error(`Invalid time format: ${shift.time}`);
    }

    // Normalize to 4-digit format (0800, 1600, etc.)
    const normalizedStartTime = startTime.padStart(4, '0');
    const normalizedEndTime = endTime.padStart(4, '0');

    // Find or create scribe
    const scribe = await findOrCreateScribe(shift.person, scribeStandardizedName);
    const scribeId = scribe.id;

    // Find or create provider if matched
    let providerId: string | null = null;
    if (shift.providerName && shift.providerRole) {
      const providerStandardizedName = this.nameMapper.standardizeName(
        shift.providerName,
        shift.providerRole
      );
      const provider = await findOrCreateProvider(providerStandardizedName);
      providerId = provider.id;
    }

    // Upsert shift (shift.date is in YYYY-MM-DD format from parser)
    // Parse it properly to avoid timezone issues
    const [year, month, day] = shift.date.split('-').map(Number);
    const shiftDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    const result = await upsertShift({
      date: shiftDate,
      zone: shift.label || 'Unknown',
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      site: shift.site,
      scribeId,
      providerId,
    });

    return {
      created: result.created,
      updated: result.updated,
    };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
