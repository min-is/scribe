import { NextResponse } from 'next/server';
import { PrismaClient, PageType } from '@prisma/client';
import { generateJitteredKeyBetween } from 'fractional-indexing-jittered';
import { wikiContentToTipTap, tipTapToPlainText } from '@/lib/utils/content-transformers';
import { parseWikiContent } from '@/lib/utils/type-guards';

const prisma = new PrismaClient();

/**
 * One-time migration endpoint to create Page records from existing data
 * Visit: https://your-site.vercel.app/api/migrate-pages
 *
 * IMPORTANT: This should only be run once after deployment
 */
export async function GET() {
  try {
    // Check if Page table exists and has data
    let existingPages = 0;
    let tableExists = true;

    try {
      existingPages = await prisma.page.count();
    } catch (error: any) {
      if (error.message.includes('does not exist')) {
        tableExists = false;
      } else {
        throw error;
      }
    }

    if (!tableExists) {
      return NextResponse.json({
        success: false,
        message: 'Page table does not exist yet. The database migration may have failed during deployment. Please check Vercel deployment logs.',
        hint: 'The automated migration should run during build. If it failed, you may need to run migrations manually.',
      }, { status: 500 });
    }
    if (existingPages > 0) {
      return NextResponse.json({
        success: false,
        message: `Migration already completed. Found ${existingPages} existing pages.`,
        existingPages,
      });
    }

    const results = {
      providers: 0,
      procedures: 0,
      smartphrases: 0,
      scenarios: 0,
      errors: [] as string[],
    };

    // Migrate Providers
    try {
      const providers = await prisma.provider.findMany({
        where: { page: null },
        orderBy: { createdAt: 'asc' },
      });

      let position = generateJitteredKeyBetween(null, null);

      for (const provider of providers) {
        const wikiContent = parseWikiContent(provider.wikiContent);

        const content = wikiContent
          ? wikiContentToTipTap(wikiContent)
          : {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Provider information will be added here.',
                    },
                  ],
                },
              ],
            };

        const title = provider.credentials
          ? `${provider.name}, ${provider.credentials}`
          : provider.name;

        const textContent = tipTapToPlainText(content);

        await prisma.page.create({
          data: {
            slug: provider.slug,
            title,
            content,
            textContent,
            type: PageType.PROVIDER,
            position,
            icon: '👨‍⚕️',
            providerId: provider.id,
            createdAt: provider.createdAt,
            updatedAt: provider.updatedAt,
          },
        });

        position = generateJitteredKeyBetween(position, null);
        results.providers++;
      }
    } catch (error: any) {
      results.errors.push(`Providers: ${error.message}`);
    }

    // Migrate Procedures
    try {
      const procedures = await prisma.procedure.findMany({
        where: { page: null },
        orderBy: { createdAt: 'asc' },
      });

      let position = generateJitteredKeyBetween(null, null);

      for (const procedure of procedures) {
        const content = {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: procedure.description || procedure.title }],
            },
          ],
        };

        await prisma.page.create({
          data: {
            slug: procedure.slug,
            title: procedure.title,
            content,
            textContent: procedure.description || procedure.title,
            type: PageType.PROCEDURE,
            position,
            icon: '📋',
            category: procedure.category,
            procedureId: procedure.id,
            createdAt: procedure.createdAt,
            updatedAt: procedure.updatedAt,
          },
        });

        position = generateJitteredKeyBetween(position, null);
        results.procedures++;
      }
    } catch (error: any) {
      results.errors.push(`Procedures: ${error.message}`);
    }

    // Migrate SmartPhrases
    try {
      const smartphrases = await prisma.smartPhrase.findMany({
        where: { page: null },
        orderBy: { createdAt: 'asc' },
      });

      let position = generateJitteredKeyBetween(null, null);

      for (const smartphrase of smartphrases) {
        const content = {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: smartphrase.content }],
            },
          ],
        };

        await prisma.page.create({
          data: {
            slug: smartphrase.slug,
            title: smartphrase.title,
            content,
            textContent: smartphrase.content,
            type: PageType.SMARTPHRASE,
            position,
            icon: '💬',
            category: smartphrase.category,
            tags: smartphrase.tags,
            smartPhraseId: smartphrase.id,
            createdAt: smartphrase.createdAt,
            updatedAt: smartphrase.updatedAt,
          },
        });

        position = generateJitteredKeyBetween(position, null);
        results.smartphrases++;
      }
    } catch (error: any) {
      results.errors.push(`SmartPhrases: ${error.message}`);
    }

    // Migrate Scenarios
    try {
      const scenarios = await prisma.scenario.findMany({
        where: { page: null },
        orderBy: { createdAt: 'asc' },
      });

      let position = generateJitteredKeyBetween(null, null);

      for (const scenario of scenarios) {
        const content = {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: scenario.content }],
            },
          ],
        };

        await prisma.page.create({
          data: {
            slug: scenario.slug,
            title: scenario.title,
            content,
            textContent: scenario.content,
            type: PageType.SCENARIO,
            position,
            icon: '🚨',
            category: scenario.category,
            tags: scenario.tags,
            scenarioId: scenario.id,
            createdAt: scenario.createdAt,
            updatedAt: scenario.updatedAt,
          },
        });

        position = generateJitteredKeyBetween(position, null);
        results.scenarios++;
      }
    } catch (error: any) {
      results.errors.push(`Scenarios: ${error.message}`);
    }

    const totalCreated = results.providers + results.procedures + results.smartphrases + results.scenarios;

    return NextResponse.json({
      success: true,
      message: `Migration completed successfully! Created ${totalCreated} pages.`,
      results,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
