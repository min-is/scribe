import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get root level pages (pages without parents)
    const pages = await prisma.page.findMany({
      where: {
        parentId: null,
        deletedAt: null,
      },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        icon: true,
        type: true,
      },
    });

    // Recursively fetch children for each page
    async function fetchChildren(parentId: string): Promise<any[]> {
      const children = await prisma.page.findMany({
        where: {
          parentId,
          deletedAt: null,
        },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          slug: true,
          title: true,
          icon: true,
          type: true,
        },
      });

      return await Promise.all(
        children.map(async (child) => ({
          ...child,
          children: await fetchChildren(child.id),
        }))
      );
    }

    const tree = await Promise.all(
      pages.map(async (page) => ({
        ...page,
        children: await fetchChildren(page.id),
      }))
    );

    return NextResponse.json({ pages: tree });
  } catch (error) {
    console.error('Error fetching page tree:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page tree', pages: [] },
      { status: 500 }
    );
  }
}
