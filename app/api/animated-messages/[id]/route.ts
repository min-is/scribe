import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/animated-messages/[id] - Get a single animated message
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const message = await prisma.animatedMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error fetching animated message:', error);
    return NextResponse.json(
      { error: 'Failed to fetch animated message' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/animated-messages/[id] - Update an animated message
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { message, order, enabled } = body;

    const updatedMessage = await prisma.animatedMessage.update({
      where: { id },
      data: {
        ...(message !== undefined && { message: message.trim() }),
        ...(order !== undefined && { order }),
        ...(enabled !== undefined && { enabled }),
      },
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Error updating animated message:', error);
    return NextResponse.json(
      { error: 'Failed to update animated message' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/animated-messages/[id] - Delete an animated message
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await prisma.animatedMessage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting animated message:', error);
    return NextResponse.json(
      { error: 'Failed to delete animated message' },
      { status: 500 }
    );
  }
}
