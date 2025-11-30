/**
 * ShiftGen Sync Service
 *
 * Orchestrates scraping, parsing, and database synchronization
 */

import { ShiftGenScraper } from './scraper';
import { ScheduleParser, RawShiftData } from './parser';
import { NameMapper } from './name-mapper';
import { SITES_TO_FETCH, SITE_CHANGE_DELAY, PAGE_LOAD_DELAY } from './config';
import { findOrCreateScribe, findProviderByName, upsertShift } from './db';

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

          // Save to database
          for (const shift of shifts) {
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
   * Sync a single shift to the database
   */
  private async syncShiftToDatabase(
    shift: RawShiftData
  ): Promise<{ created: boolean; updated: boolean }> {
    // Standardize name
    const standardizedName = this.nameMapper.standardizeName(shift.person, shift.role);

    // Parse time
    const [startTime, endTime] = shift.time.split('-');
    if (!startTime || !endTime) {
      throw new Error(`Invalid time format: ${shift.time}`);
    }

    // Normalize to 4-digit format (0800, 1600, etc.)
    const normalizedStartTime = startTime.padStart(4, '0');
    const normalizedEndTime = endTime.padStart(4, '0');

    // Find or create scribe/provider
    let scribeId: string | null = null;
    let providerId: string | null = null;

    if (shift.role === 'Scribe') {
      const scribe = await findOrCreateScribe(shift.person, standardizedName);
      scribeId = scribe.id;
    } else if (shift.role === 'Physician' || shift.role === 'MLP') {
      const provider = await findProviderByName(standardizedName);
      providerId = provider?.id || null;
    }

    // Upsert shift
    const result = await upsertShift({
      date: new Date(shift.date),
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
