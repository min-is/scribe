import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateJitteredKeyBetween } from 'fractional-indexing-jittered';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/pages/[id]/move - Move a page in the hierarchy
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { parentId, beforeId, afterId } = body;

    // Calculate new position
    let newPosition: string;

    if (beforeId && afterId) {
      // Moving between two siblings
      const [before, after] = await Promise.all([
        prisma.page.findUnique({ where: { id: beforeId }, select: { position: true } }),
        prisma.page.findUnique({ where: { id: afterId }, select: { position: true } }),
      ]);

      if (!before || !after) {
        return NextResponse.json(
          { error: 'Invalid sibling IDs' },
          { status: 400 }
        );
      }

      newPosition = generateJitteredKeyBetween(before.position, after.position);
    } else if (afterId) {
      // Moving to the end (after last sibling)
      const after = await prisma.page.findUnique({
        where: { id: afterId },
        select: { position: true },
      });

      if (!after) {
        return NextResponse.json(
          { error: 'Invalid sibling ID' },
          { status: 400 }
        );
      }

      newPosition = generateJitteredKeyBetween(after.position, null);
    } else if (beforeId) {
      // Moving to the beginning (before first sibling)
      const before = await prisma.page.findUnique({
        where: { id: beforeId },
        select: { position: true },
      });

      if (!before) {
        return NextResponse.json(
          { error: 'Invalid sibling ID' },
          { status: 400 }
        );
      }

      newPosition = generateJitteredKeyBetween(null, before.position);
    } else {
      // Moving to new parent without specific position - add to end
      const siblings = await prisma.page.findMany({
        where: {
          parentId: parentId || null,
          deletedAt: null,
          id: { not: id },
        },
        orderBy: { position: 'desc' },
        take: 1,
      });

      newPosition = siblings.length > 0
        ? generateJitteredKeyBetween(siblings[0].position, null)
        : generateJitteredKeyBetween(null, null);
    }

    // Update the page
    const page = await prisma.page.update({
      where: { id },
      data: {
        parentId: parentId || null,
        position: newPosition,
      },
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error('Error moving page:', error);
    return NextResponse.json(
      { error: 'Failed to move page' },
      { status: 500 }
    );
  }
}
