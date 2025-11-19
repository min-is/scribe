/**
 * Sync Provider Wiki Content to Page Records
 *
 * This script updates all existing provider Page records to sync their content
 * with the provider's wikiContent field. This ensures that workspace pages
 * display the same rich content as the provider modal.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncProviderWikiToPages() {
  console.log('Starting sync of provider wiki content to pages...\n');

  try {
    // Get all providers with wiki content
    const providers = await prisma.provider.findMany({
      where: {
        wikiContent: {
          not: null,
        },
      },
      include: {
        page: true,
      },
    });

    console.log(`Found ${providers.length} providers with wiki content\n`);

    let updated = 0;
    let created = 0;
    let skipped = 0;

    for (const provider of providers) {
      const wikiContent = provider.wikiContent as any;

      // Skip if wikiContent is not properly structured
      if (!wikiContent || !wikiContent.sections || !Array.isArray(wikiContent.sections)) {
        console.log(`⚠️  Skipping ${provider.name} - invalid wiki content structure`);
        skipped++;
        continue;
      }

      // Build combined page content from all visible sections
      const pageContent: any = {
        type: 'doc',
        content: [],
      };

      for (const section of wikiContent.sections) {
        if (section.visible !== false && section.content && section.content.type === 'doc') {
          // Add section title as heading
          if (section.title) {
            pageContent.content.push({
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: section.title }],
            });
          }
          // Add section content
          if (section.content.content && Array.isArray(section.content.content)) {
            pageContent.content.push(...section.content.content);
          }
        }
      }

      // Update or create page
      if (provider.page) {
        await prisma.page.update({
          where: { id: provider.page.id },
          data: {
            content: pageContent,
            title: provider.name,
            slug: provider.slug,
          },
        });
        console.log(`✓ Updated page for ${provider.name}`);
        updated++;
      } else {
        await prisma.page.create({
          data: {
            slug: provider.slug,
            title: provider.name,
            content: pageContent,
            type: 'PROVIDER',
            providerId: provider.id,
            position: 'a0',
          },
        });
        console.log(`✓ Created page for ${provider.name}`);
        created++;
      }
    }

    console.log('\n=== Sync Complete ===');
    console.log(`Updated: ${updated}`);
    console.log(`Created: ${created}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Total:   ${providers.length}`);
  } catch (error) {
    console.error('Error syncing provider wiki content:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncProviderWikiToPages()
  .then(() => {
    console.log('\n✓ Sync completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Sync failed:', error);
    process.exit(1);
  });
