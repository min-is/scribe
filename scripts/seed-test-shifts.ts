/**
 * Seed Test Shifts
 *
 * Creates sample shift data for testing the calendar without scraping ShiftGen
 * Useful for development and testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestShifts() {
  console.log('\n========================================');
  console.log('🌱 SEEDING TEST SHIFTS');
  console.log('========================================\n');

  try {
    // Create test scribes
    console.log('Creating test scribes...');
    const scribes = await Promise.all([
      prisma.scribe.upsert({
        where: { name: 'Isaac Min' },
        update: {},
        create: {
          name: 'Isaac Min',
          standardizedName: 'Isaac Min',
        },
      }),
      prisma.scribe.upsert({
        where: { name: 'John Doe' },
        update: {},
        create: {
          name: 'John Doe',
          standardizedName: 'John Doe',
        },
      }),
      prisma.scribe.upsert({
        where: { name: 'Jane Smith' },
        update: {},
        create: {
          name: 'Jane Smith',
          standardizedName: 'Jane Smith',
        },
      }),
      prisma.scribe.upsert({
        where: { name: 'Alice Johnson' },
        update: {},
        create: {
          name: 'Alice Johnson',
          standardizedName: 'Alice Johnson',
        },
      }),
    ]);
    console.log(`✅ Created ${scribes.length} test scribes`);

    // Try to find some providers (optional - shifts will still work without)
    const providers = await prisma.provider.findMany({
      take: 4,
      orderBy: { name: 'asc' },
    });

    if (providers.length > 0) {
      console.log(`✅ Found ${providers.length} existing providers to link`);
    } else {
      console.log('⚠️  No providers in database - shifts will have no provider links');
    }

    // Create shifts for the next 7 days
    console.log('\nCreating test shifts for next 7 days...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const zones = ['A', 'B', 'C', 'PA'];
    const shifts = [
      { startTime: '0700', endTime: '1500' },
      { startTime: '0800', endTime: '1600' },
      { startTime: '1500', endTime: '2300' },
    ];

    let shiftCount = 0;

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);

      // Create 2-4 shifts per day
      const shiftsForDay = Math.floor(Math.random() * 3) + 2;

      for (let i = 0; i < shiftsForDay; i++) {
        const zone = zones[i % zones.length];
        const shift = shifts[i % shifts.length];
        const scribe = scribes[Math.floor(Math.random() * scribes.length)];
        const provider = providers.length > 0 ? providers[Math.floor(Math.random() * providers.length)] : null;

        await prisma.shift.upsert({
          where: {
            date_zone_startTime_scribeId_providerId: {
              date,
              zone,
              startTime: shift.startTime,
              scribeId: scribe.id,
              providerId: provider?.id || null,
            },
          },
          update: {
            endTime: shift.endTime,
            site: 'Test Site',
          },
          create: {
            date,
            zone,
            startTime: shift.startTime,
            endTime: shift.endTime,
            site: 'Test Site',
            scribeId: scribe.id,
            providerId: provider?.id || null,
          },
        });

        shiftCount++;
      }
    }

    console.log(`✅ Created ${shiftCount} test shifts`);

    // Summary
    console.log('\n========================================');
    console.log('✅ SEEDING COMPLETE');
    console.log('========================================\n');

    const totalScribes = await prisma.scribe.count();
    const totalShifts = await prisma.shift.count();

    console.log(`Total scribes in database: ${totalScribes}`);
    console.log(`Total shifts in database: ${totalShifts}`);
    console.log('');
    console.log('🎉 Test data seeded successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Visit your calendar page');
    console.log('2. Enter passcode: 5150');
    console.log('3. Click on dates to see test shifts');
    console.log('');
    console.log('Note: This is test data. Run a real scrape to get actual ShiftGen schedules.');
    console.log('');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
seedTestShifts()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
