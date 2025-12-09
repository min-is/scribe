import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { searchQuerySchema } from '@/lib/validation/schemas';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/search - Full-text search across pages using PostgreSQL
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      q: searchParams.get('q') || '',
      type: searchParams.get('type') || undefined,
    };

    // Validate query parameters with Zod
    const validation = searchQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { q: query, type } = validation.data;

    if (!query || query.trim().length === 0) {
      return NextResponse.json([]);
    }

    // Build base filters with explicit Prisma types
    const baseFilters: Prisma.PageWhereInput = {
      deletedAt: null,
      // Exclude orphaned pages
      NOT: {
        OR: [
          { type: 'PROVIDER', providerId: null },
          { type: 'PROCEDURE', procedureId: null },
          { type: 'SCENARIO', scenarioId: null },
          { type: 'SMARTPHRASE', smartPhraseId: null },
          { type: 'PHYSICIAN_DIRECTORY', physicianDirectoryId: null },
          { type: 'MEDICATION', medicationId: null },
        ],
      },
    };

    const typeFilter = type ? { type } : {};

    let pages: any[];

    // Try PostgreSQL full-text search first
    try {
      const searchTerms = query
        .trim()
        .split(/\s+/)
        .filter((term) => term.length > 0)
        .map((term) => term.replace(/[^\w]/g, '') + ':*')
        .join(' & ');

      if (searchTerms) {
        const typeCondition = type
          ? `AND type = '${type}'::"PageType"`
          : '';

        const result = (await prisma.$queryRawUnsafe(`
          SELECT
            id, slug, title, icon, type, "textContent",
            "viewCount", "updatedAt",
            ts_rank(search_vector, to_tsquery('english', $1)) as rank
          FROM "Page"
          WHERE
            "deletedAt" IS NULL
            ${typeCondition}
            AND search_vector @@ to_tsquery('english', $1)
            AND NOT (
              (type = 'PROVIDER' AND "providerId" IS NULL) OR
              (type = 'PROCEDURE' AND "procedureId" IS NULL) OR
              (type = 'SCENARIO' AND "scenarioId" IS NULL) OR
              (type = 'SMARTPHRASE' AND "smartPhraseId" IS NULL) OR
              (type = 'PHYSICIAN_DIRECTORY' AND "physicianDirectoryId" IS NULL) OR
              (type = 'MEDICATION' AND "medicationId" IS NULL)
            )
          ORDER BY rank DESC, "viewCount" DESC, "updatedAt" DESC
          LIMIT 20
        `, searchTerms)) as any[];

        pages = result;
      } else {
        pages = [];
      }
    } catch (ftsError) {
      // Fallback to basic search if full-text search fails
      logger.error('Full-text search failed, using fallback', ftsError);

      pages = await prisma.page.findMany({
        where: {
          ...baseFilters,
          ...typeFilter,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { textContent: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } },
          ],
        },
        select: {
          id: true,
          slug: true,
          title: true,
          icon: true,
          type: true,
          textContent: true,
          viewCount: true,
          updatedAt: true,
          provider: {
            select: {
              name: true,
              credentials: true,
            },
          },
        },
        orderBy: [{ viewCount: 'desc' }, { updatedAt: 'desc' }],
        take: 20,
      });
    }

    // Fetch provider information for pages that need it
    const pagesWithProvider = await Promise.all(
      pages.map(async (page) => {
        if (page.type === 'PROVIDER' && !page.provider) {
          const fullPage = await prisma.page.findUnique({
            where: { id: page.id },
            select: {
              provider: {
                select: {
                  name: true,
                  credentials: true,
                },
              },
            },
          });
          return { ...page, provider: fullPage?.provider };
        }
        return page;
      })
    );

    // Extract snippet from textContent
    const results = pagesWithProvider.map((page) => {
      let snippet = '';
      if (page.textContent) {
        const lowerText = page.textContent.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);

        if (index !== -1) {
          const start = Math.max(0, index - 50);
          const end = Math.min(
            page.textContent.length,
            index + query.length + 50
          );
          snippet =
            (start > 0 ? '...' : '') +
            page.textContent.substring(start, end) +
            (end < page.textContent.length ? '...' : '');
        } else {
          snippet =
            page.textContent.substring(0, 100) +
            (page.textContent.length > 100 ? '...' : '');
        }
      }

      // For providers, include credentials in the title
      let title = page.title;
      if (page.provider && page.provider.credentials) {
        title = `${page.provider.name}, ${page.provider.credentials}`;
      }

      return {
        ...page,
        title,
        snippet,
        textContent: undefined, // Don't send full text to client
        provider: undefined, // Don't send provider object to client
        rank: undefined, // Don't send rank to client
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    logger.error('Error searching pages', error);
    return NextResponse.json(
      { error: 'Failed to search pages' },
      { status: 500 }
    );
  }
}
