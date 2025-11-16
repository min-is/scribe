import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/search - Full-text search across pages
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json([]);
    }

    // Search using case-insensitive LIKE for title and textContent
    // PostgreSQL full-text search would be more efficient for large datasets
    const pages = await prisma.page.findMany({
      where: {
        deletedAt: null,
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            textContent: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            tags: {
              hasSome: [query],
            },
          },
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
      },
      orderBy: [
        { viewCount: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: 20,
    });

    // Extract snippet from textContent
    const results = pages.map((page) => {
      let snippet = '';
      if (page.textContent) {
        const lowerText = page.textContent.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);

        if (index !== -1) {
          const start = Math.max(0, index - 50);
          const end = Math.min(page.textContent.length, index + query.length + 50);
          snippet = (start > 0 ? '...' : '') +
                    page.textContent.substring(start, end) +
                    (end < page.textContent.length ? '...' : '');
        } else {
          snippet = page.textContent.substring(0, 100) +
                    (page.textContent.length > 100 ? '...' : '');
        }
      }

      return {
        ...page,
        snippet,
        textContent: undefined, // Don't send full text to client
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching pages:', error);
    return NextResponse.json(
      { error: 'Failed to search pages' },
      { status: 500 }
    );
  }
}
