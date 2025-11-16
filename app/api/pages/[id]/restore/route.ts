import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/pages/[id]/restore - Restore a soft-deleted page
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const page = await prisma.page.update({
      where: { id },
      data: { deletedAt: null },
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error('Error restoring page:', error);
    return NextResponse.json(
      { error: 'Failed to restore page' },
      { status: 500 }
    );
  }
}
