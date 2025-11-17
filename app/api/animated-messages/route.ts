import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/animated-messages - Get all animated messages (optionally only enabled ones)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enabledOnly = searchParams.get('enabled') === 'true';

    const messages = await prisma.animatedMessage.findMany({
      where: enabledOnly ? { enabled: true } : undefined,
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching animated messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch animated messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/animated-messages - Create a new animated message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, order, enabled } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const newMessage = await prisma.animatedMessage.create({
      data: {
        message: message.trim(),
        order: order ?? 0,
        enabled: enabled ?? true,
      },
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Error creating animated message:', error);
    return NextResponse.json(
      { error: 'Failed to create animated message' },
      { status: 500 }
    );
  }
}
