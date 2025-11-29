/**
 * Seed script for shift data
 *
 * This creates sample shift data for testing the schedule calendar.
 * Run with: npx ts-node prisma/seed-shifts.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding shift data...');

  // Create sample scribes
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
      where: { name: 'Sarah Chen' },
      update: {},
      create: {
        name: 'Sarah Chen',
        standardizedName: 'Sarah Chen',
      },
    }),
    prisma.scribe.upsert({
      where: { name: 'Michael Rodriguez' },
      update: {},
      create: {
        name: 'Michael Rodriguez',
        standardizedName: 'Michael Rodriguez',
      },
    }),
    prisma.scribe.upsert({
      where: { name: 'Emily Johnson' },
      update: {},
      create: {
        name: 'Emily Johnson',
        standardizedName: 'Emily Johnson',
      },
    }),
  ]);

  console.log(`✅ Created ${scribes.length} scribes`);

  // Find or create sample providers (using existing provider model)
  // Note: These should match providers in your actual database
  const providers = await prisma.provider.findMany({
    take: 4,
  });

  if (providers.length === 0) {
    console.log('⚠️  No providers found in database. Skipping provider assignments.');
  } else {
    console.log(`✅ Found ${providers.length} providers`);
  }

  // Generate shifts for the next 7 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const shifts = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const shiftDate = new Date(today);
    shiftDate.setDate(today.getDate() + dayOffset);

    // Morning shifts (Zone 1, Zone 2)
    shifts.push(
      {
        date: shiftDate,
        zone: 'B', // Zone 1
        startTime: '0730',
        endTime: '1500',
        site: 'St Joseph Scribe',
        scribeId: scribes[0].id,
        providerId: providers[0]?.id || null,
      },
      {
        date: shiftDate,
        zone: 'A', // Zone 2
        startTime: '0800',
        endTime: '1600',
        site: 'St Joseph Scribe',
        scribeId: scribes[1].id,
        providerId: providers[1]?.id || null,
      }
    );

    // Afternoon shifts (Zone 3/4, Fast Track)
    shifts.push(
      {
        date: shiftDate,
        zone: 'C', // Zone 3/4
        startTime: '1200',
        endTime: '2000',
        site: 'St Joseph Scribe',
        scribeId: scribes[2].id,
        providerId: providers[2]?.id || null,
      },
      {
        date: shiftDate,
        zone: 'D', // Fast Track
        startTime: '1400',
        endTime: '2200',
        site: 'St Joseph Scribe',
        scribeId: scribes[3].id,
        providerId: providers[3]?.id || null,
      }
    );

    // PA shift
    shifts.push({
      date: shiftDate,
      zone: 'PA',
      startTime: '1000',
      endTime: '1830',
      site: 'St Joseph MLP',
      scribeId: scribes[0].id,
      providerId: null, // PA shifts may not have providers in the provider table
    });
  }

  // Create shifts
  for (const shift of shifts) {
    await prisma.shift.upsert({
      where: {
        date_zone_startTime_scribeId_providerId: {
          date: shift.date,
          zone: shift.zone,
          startTime: shift.startTime,
          scribeId: shift.scribeId,
          providerId: shift.providerId,
        },
      },
      update: {
        endTime: shift.endTime,
        site: shift.site,
      },
      create: shift,
    });
  }

  console.log(`✅ Created ${shifts.length} shifts for the next 7 days`);
  console.log('');
  console.log('📅 Sample schedule:');
  console.log(`   • ${scribes[0].name}: Zone 1 (Morning) + PA (Afternoon)`);
  console.log(`   • ${scribes[1].name}: Zone 2 (Morning)`);
  console.log(`   • ${scribes[2].name}: Zone 3/4 (Afternoon)`);
  console.log(`   • ${scribes[3].name}: Fast Track (Afternoon)`);
  console.log('');
  console.log('✨ Seed complete! Check the schedule calendar to view shifts.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding shifts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
