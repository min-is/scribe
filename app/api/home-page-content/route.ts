import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/home-page-content - Get home page content
 */
export async function GET(request: NextRequest) {
  try {
    // Get the first (and should be only) record
    let content = await prisma.homePageContent.findFirst();

    // If no content exists, create default content
    if (!content) {
      content = await prisma.homePageContent.create({
        data: {
          id: 'default',
          announcementText: 'Welcome! Check back here for important updates and announcements.',
          gettingStartedText: `Welcome to your home!

• Browse provider preferences and documentation
• Access procedure guides and protocols
• Find smart phrases for EPIC documentation
• Review critical scenarios and emergency protocols`,
        },
      });
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching home page content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch home page content' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/home-page-content - Update home page content
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { announcementText, gettingStartedText } = body;

    if (announcementText === undefined && gettingStartedText === undefined) {
      return NextResponse.json(
        { error: 'At least one field must be provided' },
        { status: 400 }
      );
    }

    // Get the first record (or create if doesn't exist)
    let content = await prisma.homePageContent.findFirst();

    if (!content) {
      content = await prisma.homePageContent.create({
        data: {
          id: 'default',
          announcementText: announcementText || 'Welcome! Check back here for important updates and announcements.',
          gettingStartedText: gettingStartedText || 'Welcome to your home!',
        },
      });
    } else {
      content = await prisma.homePageContent.update({
        where: { id: content.id },
        data: {
          ...(announcementText !== undefined && { announcementText }),
          ...(gettingStartedText !== undefined && { gettingStartedText }),
        },
      });
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error updating home page content:', error);
    return NextResponse.json(
      { error: 'Failed to update home page content' },
      { status: 500 }
    );
  }
}
