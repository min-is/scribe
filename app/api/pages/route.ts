import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PageType } from '@prisma/client';
import { generateJitteredKeyBetween } from 'fractional-indexing-jittered';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pages - List all pages with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as PageType | null;
    const parentId = searchParams.get('parentId');
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (parentId === 'null' || parentId === '') {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    const pages = await prisma.page.findMany({
      where,
      orderBy: { position: 'asc' },
      include: {
        _count: {
          select: { children: true },
        },
      },
    });

    return NextResponse.json(pages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pages - Create a new page
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      type,
      parentId,
      icon,
      coverPhoto,
      category,
      tags,
    } = body;

    // Validate required fields
    if (!title || !type) {
      return NextResponse.json(
        { error: 'Title and type are required' },
        { status: 400 }
      );
    }

    // Generate slug from title
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.page.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Calculate position (add to end of siblings)
    const siblings = await prisma.page.findMany({
      where: {
        parentId: parentId || null,
        deletedAt: null,
      },
      orderBy: { position: 'desc' },
      take: 1,
    });

    const position = siblings.length > 0
      ? generateJitteredKeyBetween(siblings[0].position, null)
      : generateJitteredKeyBetween(null, null);

    // Extract text content from TipTap JSON
    const textContent = extractTextFromContent(content);

    const page = await prisma.page.create({
      data: {
        slug,
        title,
        content: content || { type: 'doc', content: [] },
        textContent,
        type: type as PageType,
        parentId: parentId || null,
        position,
        icon: icon || getDefaultIcon(type),
        coverPhoto,
        category,
        tags: tags || [],
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: 'Failed to create page' },
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

/**
 * Get default icon for page type
 */
function getDefaultIcon(type: string): string {
  const icons: Record<string, string> = {
    PROVIDER: '👨‍⚕️',
    PROCEDURE: '📋',
    SMARTPHRASE: '💬',
    SCENARIO: '🚨',
    WIKI: '📄',
    FOLDER: '📁',
  };
  return icons[type] || '📄';
}
