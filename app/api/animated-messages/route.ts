import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/animated-messages - Get all enabled animated messages
 */
export async function GET(request: NextRequest) {
  try {
    const messages = await prisma.animatedMessage.findMany({
      where: { enabled: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        message: true,
        order: true,
        enabled: true,
      },
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

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    const newMessage = await prisma.animatedMessage.create({
      data: {
        message,
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
