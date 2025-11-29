/**
 * ShiftGen Sync Service
 * Orchestrates scraping and database synchronization
 */

import { prisma } from '@/lib/prisma';
import { ShiftGenScraper } from './scraper';
import { ScheduleParser } from './parser';
import { NameMapper } from './name-mapper';
import { SITES_TO_FETCH } from './config';
import { RawShiftData, ScrapeResult } from './types';

/**
 * Delay utility
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Parse time string (e.g., "0800-1600") into start and end times
 */
function parseTimeRange(timeStr: string): { startTime: string; endTime: string } {
  const parts = timeStr.split('-');
  if (parts.length !== 2) {
    return { startTime: timeStr, endTime: timeStr };
  }

  let [start, end] = parts;

  // Normalize to 4 digits (e.g., "800" -> "0800")
  start = start.padStart(4, '0');
  end = end.padStart(4, '0');

  return { startTime: start, endTime: end };
}

/**
 * Find or create a scribe by name
 */
async function findOrCreateScribe(name: string, standardizedName?: string) {
  return prisma.scribe.upsert({
    where: { name },
    create: { name, standardizedName },
    update: { standardizedName },
  });
}

/**
 * Find provider by name (fuzzy matching)
 */
async function findProviderByName(name: string) {
  if (!name) return null;

  // Remove common titles and suffixes
  const cleanName = name
    .replace(/^Dr\.\s*/i, '')
    .replace(/,?\s*(MD|DO|PA-C|NP)$/i, '')
    .trim();

  // Try exact match first
  let provider = await prisma.provider.findFirst({
    where: {
      name: {
        contains: cleanName,
        mode: 'insensitive',
      },
    },
  });

  // If no match, try last name only
  if (!provider) {
    const lastNameMatch = cleanName.split(' ').pop();
    if (lastNameMatch) {
      provider = await prisma.provider.findFirst({
        where: {
          name: {
            contains: lastNameMatch,
            mode: 'insensitive',
          },
        },
      });
    }
  }

  return provider;
}

/**
 * Sync shifts to database
 */
async function syncShiftsToDatabase(
  shiftsData: RawShiftData[],
  nameMapper: NameMapper
): Promise<{ created: number; updated: number; errors: string[] }> {
  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const shiftData of shiftsData) {
    try {
      const { startTime, endTime } = parseTimeRange(shiftData.time);
      const standardizedName = nameMapper.standardizeName(shiftData.person, shiftData.role);

      // Determine if this is a scribe or provider shift
      let scribeId: string | null = null;
      let providerId: string | null = null;

      if (shiftData.role === 'Scribe') {
        const scribe = await findOrCreateScribe(shiftData.person, standardizedName);
        scribeId = scribe.id;
      } else {
        // Physician or MLP
        const provider = await findProviderByName(standardizedName);
        if (provider) {
          providerId = provider.id;
        } else {
          errors.push(`Provider not found: ${standardizedName} (${shiftData.role})`);
          continue;
        }
      }

      // Upsert shift
      const existingShift = await prisma.shift.findFirst({
        where: {
          date: new Date(shiftData.date),
          zone: shiftData.label || 'Unknown',
          startTime,
          scribeId,
          providerId,
        },
      });

      if (existingShift) {
        await prisma.shift.update({
          where: { id: existingShift.id },
          data: {
            endTime,
            site: shiftData.site,
          },
        });
        updated++;
      } else {
        await prisma.shift.create({
          data: {
            date: new Date(shiftData.date),
            zone: shiftData.label || 'Unknown',
            startTime,
            endTime,
            site: shiftData.site,
            scribeId,
            providerId,
          },
        });
        created++;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to process shift on ${shiftData.date} for ${shiftData.person}: ${errorMsg}`);
    }
  }

  return { created, updated, errors };
}

/**
 * Main scraping and sync function
 */
export async function scrapeAndSync(): Promise<ScrapeResult> {
  const startTime = new Date().toISOString();
  let shiftsScraped = 0;
  let shiftsCreated = 0;
  let shiftsUpdated = 0;
  const errors: string[] = [];

  try {
    // Initialize components
    const scraper = new ShiftGenScraper();
    const parser = new ScheduleParser();
    const nameMapper = new NameMapper();

    // Load name legend
    await nameMapper.loadLegend();

    // Login
    console.log('🔐 Logging in to ShiftGen...');
    const loginSuccess = await scraper.login();
    if (!loginSuccess) {
      throw new Error('Login failed');
    }
    console.log('✅ Login successful');

    // Scrape all sites
    const allShiftsData: RawShiftData[] = [];

    for (const site of SITES_TO_FETCH) {
      console.log(`\n📍 Processing: ${site.name}`);

      if (!await scraper.changeSite(site.id, site.name)) {
        errors.push(`Failed to change to site: ${site.name}`);
        continue;
      }

      await delay(2000);
      const schedules = await scraper.fetchSchedules();
      console.log(`   Found ${schedules.length} schedule(s)`);

      for (const schedule of schedules) {
        console.log(`   Fetching: ${schedule.title}`);
        const htmlContent = await scraper.getPrintableSchedule(schedule.id);

        if (htmlContent) {
          const scheduleData = parser.parseCalendar(htmlContent, site.name);
          allShiftsData.push(...scheduleData);
          console.log(`   Parsed ${scheduleData.length} shift(s)`);
        } else {
          errors.push(`Failed to fetch schedule: ${schedule.title}`);
        }
      }

      await scraper.navigateToHome();
      await delay(1000);
    }

    shiftsScraped = allShiftsData.length;
    console.log(`\n📊 Total shifts scraped: ${shiftsScraped}`);

    // Sync to database
    console.log('\n💾 Syncing to database...');
    const syncResult = await syncShiftsToDatabase(allShiftsData, nameMapper);
    shiftsCreated = syncResult.created;
    shiftsUpdated = syncResult.updated;
    errors.push(...syncResult.errors);

    // Save name mapper updates
    await nameMapper.saveUpdates();
    const stats = nameMapper.getStats();
    if (stats.newPhysicians > 0 || stats.newMLPs > 0) {
      console.log(`\n📝 Discovered ${stats.newPhysicians} new physician(s) and ${stats.newMLPs} new MLP(s)`);
    }

    console.log('\n✅ Sync complete!');
    console.log(`   Created: ${shiftsCreated}`);
    console.log(`   Updated: ${shiftsUpdated}`);
    if (errors.length > 0) {
      console.log(`   Errors: ${errors.length}`);
    }

    return {
      success: true,
      shiftsScraped,
      shiftsCreated,
      shiftsUpdated,
      errors,
      timestamp: startTime,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Scrape and sync failed:', errorMsg);

    return {
      success: false,
      shiftsScraped,
      shiftsCreated,
      shiftsUpdated,
      errors: [...errors, errorMsg],
      timestamp: startTime,
    };
  }
}
