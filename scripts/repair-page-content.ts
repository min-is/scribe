import { PrismaClient } from '@prisma/client';
import { ContentTransformers } from '../src/lib/content-transformers';
import { isCorruptedPageContent, parseWikiContent } from '../src/lib/type-guards';

const prisma = new PrismaClient();

/**
 * Repair Script for Corrupted Page Content
 *
 * Fixes pages that have stringified WikiContent instead of proper TipTap JSON.
 * This happened due to a bug where JSON.stringify() was used instead of proper transformation.
 */
async function repairPageContent() {
  console.log('🔍 Scanning for corrupted page content...\n');

  const pages = await prisma.page.findMany({
    include: {
      provider: true,
    },
  });

  let corruptedCount = 0;
  let repairedCount = 0;
  const errors: string[] = [];

  for (const page of pages) {
    if (isCorruptedPageContent(page.content)) {
      corruptedCount++;
      console.log(`❌ Found corrupted page: ${page.slug} (${page.title})`);

      try {
        // Try to repair from provider.wikiContent if available
        if (page.provider?.wikiContent) {
          const wikiContent = parseWikiContent(page.provider.wikiContent);
          if (wikiContent) {
            const content = ContentTransformers.wikiContentToTipTap(wikiContent);
            const textContent = ContentTransformers.tipTapToPlainText(content);

            await prisma.page.update({
              where: { id: page.id },
              data: {
                content,
                textContent,
              },
            });

            console.log(`✅ Repaired: ${page.slug}`);
            repairedCount++;
            continue;
          }
        }

        // Fallback: Create placeholder content
        const content = ContentTransformers.createPlaceholderDocument(
          'Content needs to be re-entered.'
        );
        const textContent = ContentTransformers.tipTapToPlainText(content);

        await prisma.page.update({
          where: { id: page.id },
          data: {
            content,
            textContent,
          },
        });

        console.log(`⚠️  Replaced with placeholder: ${page.slug}`);
        repairedCount++;
      } catch (error: any) {
        const errorMsg = `Failed to repair ${page.slug}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Repair Summary');
  console.log('='.repeat(60));
  console.log(`Total pages scanned: ${pages.length}`);
  console.log(`Corrupted pages found: ${corruptedCount}`);
  console.log(`Successfully repaired: ${repairedCount}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach((error) => console.log(`  - ${error}`));
  }

  if (corruptedCount === 0) {
    console.log('\n✅ No corrupted pages found!');
  } else if (repairedCount === corruptedCount) {
    console.log('\n✅ All corrupted pages have been repaired!');
  } else {
    console.log('\n⚠️  Some pages could not be repaired. Please review the errors above.');
  }

  await prisma.$disconnect();
}

repairPageContent().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
