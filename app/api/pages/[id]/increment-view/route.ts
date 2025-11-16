import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.page.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error incrementing page view count:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to increment view count' },
      { status: 500 }
    );
  }
}
