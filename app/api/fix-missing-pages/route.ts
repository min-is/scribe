import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Fix missing Page records for providers, procedures, smartphrases, and scenarios
 * This ensures all items have corresponding pages even if they were created
 * before the auto-create logic was implemented.
 *
 * Visit: https://your-site.vercel.app/api/fix-missing-pages
 */
export async function GET() {
  try {
    const results = {
      providersFixed: 0,
      proceduresFixed: 0,
      smartphrasesFixed: 0,
      scenariosFixed: 0,
      errors: [] as string[],
    };

    // Find providers without pages
    const providersWithoutPages = await prisma.provider.findMany({
      where: {
        page: null,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        wikiContent: true,
      },
    });

    console.log(`Found ${providersWithoutPages.length} providers without pages`);

    for (const provider of providersWithoutPages) {
      try {
        // Extract content from wikiContent if it exists
        let pageContent: any = {
          type: 'doc',
          content: [{ type: 'paragraph', content: [] }],
        };

        if (provider.wikiContent && typeof provider.wikiContent === 'object') {
          const wikiContentObj = provider.wikiContent as any;
          if (wikiContentObj.sections && Array.isArray(wikiContentObj.sections) && wikiContentObj.sections.length > 0) {
            const firstSection = wikiContentObj.sections[0];
            if (firstSection.content && firstSection.content.type === 'doc') {
              pageContent = firstSection.content;
            }
          }
        }

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
        results.providersFixed++;
      } catch (error: any) {
        console.error(`Failed to create page for provider ${provider.slug}:`, error);
        results.errors.push(`Provider ${provider.slug}: ${error.message}`);
      }
    }

    // Find procedures without pages
    const proceduresWithoutPages = await prisma.procedure.findMany({
      where: {
        page: null,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
      },
    });

    console.log(`Found ${proceduresWithoutPages.length} procedures without pages`);

    for (const procedure of proceduresWithoutPages) {
      try {
        await prisma.page.create({
          data: {
            slug: procedure.slug,
            title: procedure.title,
            content: {
              type: 'doc',
              content: [{ type: 'paragraph', content: [] }],
            },
            type: 'PROCEDURE',
            procedureId: procedure.id,
            category: procedure.category,
            position: 'a0',
          },
        });
        results.proceduresFixed++;
      } catch (error: any) {
        console.error(`Failed to create page for procedure ${procedure.slug}:`, error);
        results.errors.push(`Procedure ${procedure.slug}: ${error.message}`);
      }
    }

    // Find smartphrases without pages
    const smartphrasesWithoutPages = await prisma.smartPhrase.findMany({
      where: {
        page: null,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
      },
    });

    console.log(`Found ${smartphrasesWithoutPages.length} smartphrases without pages`);

    for (const smartphrase of smartphrasesWithoutPages) {
      try {
        await prisma.page.create({
          data: {
            slug: smartphrase.slug,
            title: smartphrase.title,
            content: {
              type: 'doc',
              content: [{ type: 'paragraph', content: [] }],
            },
            type: 'SMARTPHRASE',
            smartPhraseId: smartphrase.id,
            category: smartphrase.category,
            position: 'a0',
          },
        });
        results.smartphrasesFixed++;
      } catch (error: any) {
        console.error(`Failed to create page for smartphrase ${smartphrase.slug}:`, error);
        results.errors.push(`SmartPhrase ${smartphrase.slug}: ${error.message}`);
      }
    }

    // Find scenarios without pages
    const scenariosWithoutPages = await prisma.scenario.findMany({
      where: {
        page: null,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
      },
    });

    console.log(`Found ${scenariosWithoutPages.length} scenarios without pages`);

    for (const scenario of scenariosWithoutPages) {
      try {
        await prisma.page.create({
          data: {
            slug: scenario.slug,
            title: scenario.title,
            content: {
              type: 'doc',
              content: [{ type: 'paragraph', content: [] }],
            },
            type: 'SCENARIO',
            scenarioId: scenario.id,
            category: scenario.category,
            position: 'a0',
          },
        });
        results.scenariosFixed++;
      } catch (error: any) {
        console.error(`Failed to create page for scenario ${scenario.slug}:`, error);
        results.errors.push(`Scenario ${scenario.slug}: ${error.message}`);
      }
    }

    const totalFixed = results.providersFixed + results.proceduresFixed + results.smartphrasesFixed + results.scenariosFixed;

    return NextResponse.json({
      success: true,
      message: `Fixed ${totalFixed} missing pages`,
      details: results,
    });
  } catch (error: any) {
    console.error('Error fixing missing pages:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
