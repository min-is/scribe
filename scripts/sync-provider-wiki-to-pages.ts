/**
 * Migration Script: Sync Provider Wiki Content to Page Records
 *
 * This script synchronizes existing provider wikiContent to their associated Page records.
 * Run this once after deploying the updateProvider fix.
 *
 * Usage: npx tsx scripts/sync-provider-wiki-to-pages.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface WikiContent {
  sections?: Array<{
    id: string;
    type: string;
    visible: boolean;
    content?: {
      type: string;
      content?: any[];
    };
  }>;
}

async function syncProviderWikiToPages() {
  console.log('🔄 Starting provider wiki content sync...\n');

  try {
    // Fetch all providers (we'll filter in application code)
    const providers = await prisma.provider.findMany({
      include: {
        page: true,
      },
    });

    // Filter to only those with wikiContent
    const providersWithWiki = providers.filter(p => p.wikiContent != null);

    console.log(`Found ${providersWithWiki.length} providers with wiki content to sync\n`);

    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const provider of providersWithWiki) {
      try {
        const wikiContent = provider.wikiContent as WikiContent;

        // Extract and combine all visible section content
        const visibleSections = wikiContent.sections?.filter(s => s.visible) || [];

        let combinedContent: any = {
          type: 'doc',
          content: [],
        };

        if (visibleSections.length > 0) {
          // Combine all visible sections into one document
          for (const section of visibleSections) {
            if (section.content?.content) {
              combinedContent.content.push(...section.content.content);
            }
          }
        }

        // If no content, use empty paragraph
        if (combinedContent.content.length === 0) {
          combinedContent.content = [{ type: 'paragraph', content: [] }];
        }

        // Update or create the associated Page record
        if (provider.page) {
          await prisma.page.update({
            where: { id: provider.page.id },
            data: {
              content: combinedContent,
              title: provider.name,
              slug: provider.slug,
            },
          });
          console.log(`✅ Synced: ${provider.name} (${provider.slug})`);
          syncedCount++;
        } else {
          // Create a new Page if it doesn't exist
          await prisma.page.create({
            data: {
              slug: provider.slug,
              title: provider.name,
              content: combinedContent,
              type: 'PROVIDER',
              providerId: provider.id,
              position: 'a0',
            },
          });
          console.log(`✅ Created page: ${provider.name} (${provider.slug})`);
          syncedCount++;
        }
      } catch (error) {
        console.error(`❌ Error syncing ${provider.name}:`, error);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Sync Summary:');
    console.log(`   ✅ Synced: ${syncedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(50));

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review above.');
    }
  } catch (error) {
    console.error('❌ Fatal error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
syncProviderWikiToPages()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
