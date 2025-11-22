#!/usr/bin/env node

/**
 * Diagnostic script to check for orphaned Pages
 * (Pages with type=PROVIDER but providerId=NULL)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for orphaned Pages...\n');

  // Check for Pages with type=PROVIDER but no providerId
  const orphanedProviderPages = await prisma.page.findMany({
    where: {
      type: 'PROVIDER',
      providerId: null,
      deletedAt: null, // Only active pages
    },
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      providerId: true,
      createdAt: true,
      updatedAt: true,
      viewCount: true,
    },
  });

  console.log(`Found ${orphanedProviderPages.length} orphaned PROVIDER pages:\n`);

  if (orphanedProviderPages.length > 0) {
    console.table(orphanedProviderPages);

    console.log('\n⚠️  These pages appear in search results but have no associated Provider record!');
    console.log('This is likely why deleted providers still appear in search.\n');
  } else {
    console.log('✅ No orphaned PROVIDER pages found.\n');
  }

  // Check for specific providers mentioned by user
  console.log('🔍 Checking for specific providers mentioned...\n');

  const specificPages = await prisma.page.findMany({
    where: {
      OR: [
        { title: { contains: 'Test, Test', mode: 'insensitive' } },
        { title: { contains: 'Katie Doering', mode: 'insensitive' } },
        { slug: { contains: 'doering', mode: 'insensitive' } },
      ],
      deletedAt: null,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      providerId: true,
      provider: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      createdAt: true,
    },
  });

  if (specificPages.length > 0) {
    console.log('Found pages matching "Test, Test" or "Katie Doering":\n');
    specificPages.forEach((page) => {
      console.log(`Page: ${page.title}`);
      console.log(`  - Slug: ${page.slug}`);
      console.log(`  - Type: ${page.type}`);
      console.log(`  - Provider ID: ${page.providerId || 'NULL ⚠️'}`);
      console.log(`  - Provider exists: ${page.provider ? 'YES' : 'NO ⚠️'}`);
      if (page.provider) {
        console.log(`  - Provider name: ${page.provider.name}`);
      }
      console.log('');
    });
  } else {
    console.log('No pages found matching those names.\n');
  }

  // Check all Page types and their provider relationships
  console.log('📊 Summary of all Page types and orphaned status:\n');

  const pageStats = await prisma.$queryRaw`
    SELECT
      type,
      COUNT(*) as total,
      COUNT(CASE WHEN "providerId" IS NULL AND type = 'PROVIDER' THEN 1 END) as orphaned,
      COUNT(CASE WHEN "deletedAt" IS NULL THEN 1 END) as active
    FROM "Page"
    GROUP BY type
    ORDER BY total DESC
  `;

  console.table(pageStats);

  // Check if Providers exist without Pages
  console.log('\n🔍 Checking for Providers without Pages...\n');

  const providersWithoutPages = await prisma.provider.findMany({
    where: {
      page: null,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      createdAt: true,
    },
  });

  if (providersWithoutPages.length > 0) {
    console.log(`Found ${providersWithoutPages.length} Providers without associated Pages:\n`);
    console.table(providersWithoutPages);
  } else {
    console.log('✅ All Providers have associated Pages.\n');
  }
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
