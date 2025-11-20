/**
 * Data Repair Script: Fix corrupted Page content
 *
 * This script identifies and repairs Page records where the content was
 * incorrectly created by JSON.stringify(wikiContent) instead of proper
 * transformation to TipTap format.
 *
 * Run with: npx tsx scripts/repair-page-content.ts
 */

import { PrismaClient } from '@prisma/client';
import { ContentTransformers } from '../src/lib/content-transformers';
import { parseWikiContent, isCorruptedPageContent } from '../src/lib/type-guards';

const prisma = new PrismaClient();

interface RepairStats {
  total: number;
  corrupted: number;
  repaired: number;
  failed: number;
  errors: Array<{ pageId: string; slug: string; error: string }>;
}

/**
 * Find and repair corrupted page content
 */
async function repairCorruptedPages(): Promise<RepairStats> {
  const stats: RepairStats = {
    total: 0,
    corrupted: 0,
    repaired: 0,
    failed: 0,
    errors: [],
  };

  console.log('🔍 Scanning for corrupted pages...\n');

  // Get all pages
  const pages = await prisma.page.findMany({
    include: {
      provider: true,
    },
  });

  stats.total = pages.length;
  console.log(`Found ${stats.total} pages to check\n`);

  for (const page of pages) {
    const isCorrupted = isCorruptedPageContent(page.content);

    if (isCorrupted) {
      stats.corrupted++;
      console.log(`❌ Corrupted: ${page.slug} (${page.type})`);

      try {
        // Attempt to repair the page
        let repairedContent;

        if (page.provider && page.provider.wikiContent) {
          // Try to parse the provider's wikiContent
          const wikiContent = parseWikiContent(page.provider.wikiContent);

          if (wikiContent) {
            repairedContent = ContentTransformers.wikiContentToTipTap(wikiContent);
          } else {
            // Fallback to legacy content
            repairedContent = ContentTransformers.legacyToWikiContent(
              page.provider.noteTemplate,
              page.provider.noteSmartPhrase,
              page.provider.preferences
            );
          }
        } else {
          // No source data available, create empty document
          repairedContent = ContentTransformers.createEmptyDocument();
        }

        // Update the page with repaired content
        const textContent = ContentTransformers.tipTapToPlainText(repairedContent);

        await prisma.page.update({
          where: { id: page.id },
          data: {
            content: repairedContent,
            textContent: textContent || page.title,
          },
        });

        stats.repaired++;
        console.log(`   ✅ Repaired successfully\n`);
      } catch (error) {
        stats.failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        stats.errors.push({
          pageId: page.id,
          slug: page.slug,
          error: errorMessage,
        });
        console.log(`   ❌ Failed to repair: ${errorMessage}\n`);
      }
    }
  }

  return stats;
}

/**
 * Display a summary of repaired pages
 */
function displaySummary(stats: RepairStats): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Repair Summary');
  console.log('='.repeat(60));
  console.log(`Total pages scanned:     ${stats.total}`);
  console.log(`Corrupted pages found:   ${stats.corrupted}`);
  console.log(`Successfully repaired:   ${stats.repaired}`);
  console.log(`Failed to repair:        ${stats.failed}`);
  console.log('='.repeat(60));

  if (stats.errors.length > 0) {
    console.log('\n❌ Errors:\n');
    for (const error of stats.errors) {
      console.log(`   Page: ${error.slug} (${error.pageId})`);
      console.log(`   Error: ${error.error}\n`);
    }
  }

  if (stats.repaired > 0) {
    console.log(`\n✅ Successfully repaired ${stats.repaired} page(s)!`);
  } else if (stats.corrupted === 0) {
    console.log('\n✅ No corrupted pages found!');
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting page content repair...\n');

  try {
    const stats = await repairCorruptedPages();
    displaySummary(stats);

    if (stats.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Repair script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
