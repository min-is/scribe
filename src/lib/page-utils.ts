/**
 * Page Utilities
 *
 * Utilities for managing pages, hierarchy, and tree operations.
 */

import { prisma } from '@/lib/prisma';
import { Page, PageType } from '@prisma/client';
import { getPositionAfter, getPositionBetween, getPositionBefore, sortByPosition } from './fractional-index';

/**
 * Get breadcrumb trail for a page
 */
export async function getPageBreadcrumbs(pageId: string): Promise<Array<{ id: string; title: string; slug: string; icon?: string | null }>> {
  const breadcrumbs: Array<{ id: string; title: string; slug: string; icon?: string | null }> = [];
  let currentPage = await prisma.page.findUnique({
    where: { id: pageId },
    select: { id: true, title: true, slug: true, icon: true, parentId: true }
  });

  while (currentPage) {
    breadcrumbs.unshift({
      id: currentPage.id,
      title: currentPage.title,
      slug: currentPage.slug,
      icon: currentPage.icon,
    });

    if (currentPage.parentId) {
      currentPage = await prisma.page.findUnique({
        where: { id: currentPage.parentId },
        select: { id: true, title: true, slug: true, icon: true, parentId: true }
      });
    } else {
      break;
    }
  }

  return breadcrumbs;
}

/**
 * Get all direct children of a page
 */
export async function getPageChildren(parentId: string | null) {
  return await prisma.page.findMany({
    where: {
      parentId,
      deletedAt: null
    },
    orderBy: { position: 'asc' },
  });
}

/**
 * Get entire page tree (recursive)
 */
export async function getPageTree(parentId: string | null = null): Promise<any[]> {
  const pages = await getPageChildren(parentId);

  const tree = await Promise.all(
    pages.map(async (page) => ({
      ...page,
      children: await getPageTree(page.id),
    }))
  );

  return tree;
}

/**
 * Get page tree with specific type filter
 */
export async function getPageTreeByType(type?: PageType, parentId: string | null = null): Promise<any[]> {
  const pages = await prisma.page.findMany({
    where: {
      parentId,
      deletedAt: null,
      ...(type && { type })
    },
    orderBy: { position: 'asc' },
  });

  const tree = await Promise.all(
    pages.map(async (page) => ({
      ...page,
      children: await getPageTreeByType(type, page.id),
    }))
  );

  return tree;
}

/**
 * Convert WikiContent sections to TipTap JSON
 */
export function wikiContentToTipTap(wikiContent: any): any {
  if (!wikiContent || !wikiContent.sections) {
    return {
      type: 'doc',
      content: [],
    };
  }

  const content: any[] = [];

  // Convert each section
  wikiContent.sections.forEach((section: any) => {
    // Add section heading
    if (section.title) {
      content.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: section.title }],
      });
    }

    // Add section content (parse HTML or plain text)
    if (section.content) {
      // Simple paragraph conversion (can be enhanced with HTML parsing)
      const paragraphs = section.content.split('\n\n');
      paragraphs.forEach((para: string) => {
        if (para.trim()) {
          content.push({
            type: 'paragraph',
            content: [{ type: 'text', text: para.trim() }],
          });
        }
      });
    }
  });

  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph' }],
  };
}

/**
 * Extract plain text from TipTap JSON for search indexing
 */
export function extractTextFromTipTap(content: any): string {
  if (!content || !content.content) {
    return '';
  }

  const texts: string[] = [];

  function traverse(node: any) {
    if (node.type === 'text') {
      texts.push(node.text || '');
    }

    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  traverse(content);
  return texts.join(' ');
}

/**
 * Get next position for a new child page
 */
export async function getNextChildPosition(parentId: string | null): Promise<string> {
  const lastChild = await prisma.page.findFirst({
    where: { parentId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  return lastChild ? getPositionAfter(lastChild.position) : 'a0';
}

/**
 * Move page to new position
 */
export async function movePage(
  pageId: string,
  newParentId: string | null,
  afterPageId: string | null
): Promise<void> {
  let newPosition: string;

  if (afterPageId) {
    // Get the page after which we want to insert
    const afterPage = await prisma.page.findUnique({
      where: { id: afterPageId },
      select: { position: true, parentId: true },
    });

    if (!afterPage) {
      throw new Error('After page not found');
    }

    // Get the next sibling
    const nextSibling = await prisma.page.findFirst({
      where: {
        parentId: newParentId,
        position: { gt: afterPage.position },
      },
      orderBy: { position: 'asc' },
      select: { position: true },
    });

    newPosition = getPositionBetween(afterPage.position, nextSibling?.position || null);
  } else {
    // Insert at the beginning
    const firstSibling = await prisma.page.findFirst({
      where: { parentId: newParentId },
      orderBy: { position: 'asc' },
      select: { position: true },
    });

    newPosition = firstSibling ? getPositionBefore(firstSibling.position) : 'a0';
  }

  await prisma.page.update({
    where: { id: pageId },
    data: {
      parentId: newParentId,
      position: newPosition,
    },
  });
}

/**
 * Soft delete a page and all its children
 */
export async function softDeletePage(pageId: string): Promise<void> {
  const now = new Date();

  // Get all descendants
  async function getAllDescendants(id: string): Promise<string[]> {
    const children = await prisma.page.findMany({
      where: { parentId: id },
      select: { id: true },
    });

    const descendantIds: string[] = [];
    for (const child of children) {
      descendantIds.push(child.id);
      const childDescendants = await getAllDescendants(child.id);
      descendantIds.push(...childDescendants);
    }

    return descendantIds;
  }

  const descendantIds = await getAllDescendants(pageId);
  const allIds = [pageId, ...descendantIds];

  // Soft delete all
  await prisma.page.updateMany({
    where: { id: { in: allIds } },
    data: { deletedAt: now },
  });
}

/**
 * Restore a soft-deleted page
 */
export async function restorePage(pageId: string): Promise<void> {
  await prisma.page.update({
    where: { id: pageId },
    data: { deletedAt: null },
  });
}

/**
 * Permanently delete a page
 */
export async function permanentlyDeletePage(pageId: string): Promise<void> {
  await prisma.page.delete({
    where: { id: pageId },
  });
}

/**
 * Get icon for page type
 */
export function getDefaultIconForType(type: PageType): string {
  const icons: Record<PageType, string> = {
    PROVIDER: '👨‍⚕️',
    PROCEDURE: '📋',
    SMARTPHRASE: '💬',
    SCENARIO: '🚨',
    WIKI: '📄',
    FOLDER: '📁',
  };

  return icons[type] || '📄';
}
