import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PageType } from '@prisma/client';
import { generateJitteredKeyBetween } from 'fractional-indexing-jittered';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/pages/[id] - Get a specific page
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const page = await prisma.page.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          where: { deletedAt: null },
          orderBy: { position: 'asc' },
        },
        provider: true,
        procedure: true,
        smartPhrase: true,
        scenario: true,
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.page.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/pages/[id] - Update a page
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const {
      title,
      content,
      icon,
      coverPhoto,
      category,
      tags,
      parentId,
    } = body;

    // Prepare update data
    const updateData: any = {};

    if (title !== undefined) {
      updateData.title = title;
    }

    if (content !== undefined) {
      updateData.content = content;
      updateData.textContent = extractTextFromContent(content);
    }

    if (icon !== undefined) {
      updateData.icon = icon;
    }

    if (coverPhoto !== undefined) {
      updateData.coverPhoto = coverPhoto;
    }

    if (category !== undefined) {
      updateData.category = category;
    }

    if (tags !== undefined) {
      updateData.tags = tags;
    }

    // Handle parent change (move page)
    if (parentId !== undefined) {
      updateData.parentId = parentId || null;

      // Recalculate position when moving to new parent
      const siblings = await prisma.page.findMany({
        where: {
          parentId: parentId || null,
          deletedAt: null,
          id: { not: id },
        },
        orderBy: { position: 'desc' },
        take: 1,
      });

      updateData.position = siblings.length > 0
        ? generateJitteredKeyBetween(siblings[0].position, null)
        : generateJitteredKeyBetween(null, null);
    }

    // Update the page and get its type and provider relation
    const page = await prisma.page.update({
      where: { id },
      data: updateData,
      include: {
        provider: true,
      },
    });

    // If this is a PROVIDER page and content was updated, sync back to Provider.wikiContent
    if (page.type === 'PROVIDER' && page.provider && content !== undefined) {
      // Deep clone content to avoid reference sharing between providers
      const clonedContent = JSON.parse(JSON.stringify(content));

      // Update the provider's wikiContent with the new content
      const updatedWikiContent = {
        version: 2,
        content: clonedContent,
        sections: [], // Keep empty sections for backward compatibility
        media: [],
        metadata: {
          lastEditedAt: new Date().toISOString(),
          totalEdits: 0, // We don't track this perfectly in reverse sync
        },
      };

      // Try to preserve existing media and metadata from provider's wikiContent
      if (page.provider.wikiContent && typeof page.provider.wikiContent === 'object') {
        const existingWiki = page.provider.wikiContent as any;
        if (existingWiki.media) {
          // Deep clone media array to avoid reference sharing
          updatedWikiContent.media = JSON.parse(JSON.stringify(existingWiki.media));
        }
        if (existingWiki.metadata) {
          updatedWikiContent.metadata = {
            ...existingWiki.metadata,
            lastEditedAt: new Date().toISOString(),
            totalEdits: (existingWiki.metadata.totalEdits || 0) + 1,
          };
        }
      }

      await prisma.provider.update({
        where: { id: page.provider.id },
        data: {
          wikiContent: updatedWikiContent,
        },
      });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pages/[id] - Soft delete a page
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      // Hard delete
      await prisma.page.delete({
        where: { id },
      });
    } else {
      // Soft delete
      await prisma.page.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}

/**
 * Extract plain text from TipTap JSON content
 */
function extractTextFromContent(content: any): string {
  if (!content || !content.content) return '';

  const extractFromNode = (node: any): string => {
    if (node.type === 'text') {
      return node.text || '';
    }

    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractFromNode).join(' ');
    }

    return '';
  };

  return content.content.map(extractFromNode).join(' ').trim();
}
