'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Page, Prisma } from '@prisma/client';
import { z } from 'zod';
import {
  ResourceSectionSchema,
  ResourceArticleSchema,
  ResourceSectionData,
  ResourceArticleData,
  ResourceSection,
  ResourceArticle,
} from './types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate fractional index between two positions
 * Simple implementation - for production consider using a library
 */
function generatePosition(before?: string | null, after?: string | null): string {
  if (!before && !after) return 'a0';
  if (!before) return String.fromCharCode((after || 'a0').charCodeAt(0) - 1) + '0';
  if (!after) return before + '0';

  // Simple midpoint calculation
  return before + 'm';
}

/**
 * Generate slug from title
 */
function generateSlug(title: string, prefix: string = ''): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return prefix ? `${prefix}-${slug}` : slug;
}

/**
 * Get or create the Resources root page
 */
async function getResourcesRoot(): Promise<Page> {
  let root = await prisma.page.findFirst({
    where: {
      slug: 'resources-root',
      type: 'FOLDER',
      parentId: null,
    },
  });

  if (!root) {
    // Create root page
    root = await prisma.page.create({
      data: {
        slug: 'resources-root',
        title: 'Resources',
        type: 'FOLDER',
        content: { type: 'doc', content: [] },
        icon: '📚',
        position: 'a0',
      },
    });
  }

  return root;
}

// ============================================================================
// SECTION MANAGEMENT
// ============================================================================

/**
 * Get all resource sections with their articles
 */
export async function getResourceTree(): Promise<ResourceSection[]> {
  try {
    const root = await getResourcesRoot();

    const sections = await prisma.page.findMany({
      where: {
        parentId: root.id,
        type: 'FOLDER',
        deletedAt: null,
      },
      include: {
        children: {
          where: {
            type: 'WIKI',
            deletedAt: null,
          },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    });

    return sections as ResourceSection[];
  } catch (error) {
    console.error('Error fetching resource tree:', error);
    return [];
  }
}

/**
 * Create a new resource section
 */
export async function createResourceSection(
  data: ResourceSectionData
): Promise<{ success: boolean; error?: string; section?: Page }> {
  try {
    // Validate input
    const validated = ResourceSectionSchema.parse(data);

    const root = await getResourcesRoot();

    // Generate slug from title
    const slug = generateSlug(validated.title, 'section');

    // Check if slug exists
    const existing = await prisma.page.findUnique({
      where: { slug },
    });

    if (existing) {
      return {
        success: false,
        error: `Section with slug "${slug}" already exists`,
      };
    }

    // Get position
    const position = validated.position || generatePosition();

    // Create section
    const section = await prisma.page.create({
      data: {
        slug,
        title: validated.title,
        type: 'FOLDER',
        content: { type: 'doc', content: [] },
        icon: validated.icon || '📁',
        parentId: root.id,
        position,
      },
    });

    revalidatePath('/resources');
    revalidatePath('/admin/resources');
    revalidatePath('/editor/resources');

    return { success: true, section };
  } catch (error: any) {
    console.error('Error creating resource section:', error);

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    return {
      success: false,
      error: error?.message || 'Failed to create section',
    };
  }
}

/**
 * Update a resource section
 */
export async function updateResourceSection(
  id: string,
  data: Partial<ResourceSectionData>
): Promise<{ success: boolean; error?: string; section?: Page }> {
  try {
    const updateData: Prisma.PageUpdateInput = {};

    if (data.title) {
      updateData.title = data.title;
      // Regenerate slug if title changes
      const newSlug = generateSlug(data.title, 'section');
      const existing = await prisma.page.findFirst({
        where: { slug: newSlug, id: { not: id } },
      });
      if (!existing) {
        updateData.slug = newSlug;
      }
    }

    if (data.icon !== undefined) {
      updateData.icon = data.icon;
    }

    if (data.position) {
      updateData.position = data.position;
    }

    const section = await prisma.page.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/resources');
    revalidatePath('/admin/resources');
    revalidatePath('/editor/resources');

    return { success: true, section };
  } catch (error: any) {
    console.error('Error updating resource section:', error);
    return {
      success: false,
      error: error?.message || 'Failed to update section',
    };
  }
}

/**
 * Delete a resource section (and all its articles)
 */
export async function deleteResourceSection(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Soft delete (set deletedAt timestamp)
    await prisma.page.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Also soft delete all child articles
    await prisma.page.updateMany({
      where: { parentId: id },
      data: { deletedAt: new Date() },
    });

    revalidatePath('/resources');
    revalidatePath('/admin/resources');
    revalidatePath('/editor/resources');

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting resource section:', error);
    return {
      success: false,
      error: error?.message || 'Failed to delete section',
    };
  }
}

/**
 * Reorder sections
 */
export async function reorderSections(
  sectionId: string,
  newPosition: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.page.update({
      where: { id: sectionId },
      data: { position: newPosition },
    });

    revalidatePath('/resources');
    revalidatePath('/admin/resources');
    revalidatePath('/editor/resources');

    return { success: true };
  } catch (error: any) {
    console.error('Error reordering sections:', error);
    return {
      success: false,
      error: error?.message || 'Failed to reorder sections',
    };
  }
}

// ============================================================================
// ARTICLE MANAGEMENT
// ============================================================================

/**
 * Get all articles in a section
 */
export async function getResourcesBySection(
  sectionId: string
): Promise<ResourceArticle[]> {
  try {
    const articles = await prisma.page.findMany({
      where: {
        parentId: sectionId,
        type: 'WIKI',
        deletedAt: null,
      },
      orderBy: { position: 'asc' },
    });

    return articles;
  } catch (error) {
    console.error('Error fetching resources by section:', error);
    return [];
  }
}

/**
 * Get a single article by slug
 */
export async function getResourceArticle(
  slug: string
): Promise<ResourceArticle | null> {
  try {
    const article = await prisma.page.findFirst({
      where: {
        slug,
        type: 'WIKI',
        deletedAt: null,
      },
      include: {
        parent: true, // Include section info
      },
    });

    return article;
  } catch (error) {
    console.error('Error fetching resource article:', error);
    return null;
  }
}

/**
 * Create a new resource article
 */
export async function createResourceArticle(
  data: ResourceArticleData
): Promise<{ success: boolean; error?: string; article?: Page }> {
  try {
    // Validate input
    const validated = ResourceArticleSchema.parse(data);

    // Check if slug exists
    const existing = await prisma.page.findUnique({
      where: { slug: validated.slug },
    });

    if (existing) {
      return {
        success: false,
        error: `Article with slug "${validated.slug}" already exists`,
      };
    }

    // Verify section exists
    const section = await prisma.page.findUnique({
      where: { id: validated.sectionId },
    });

    if (!section) {
      return {
        success: false,
        error: 'Section not found',
      };
    }

    // Get position
    const position = validated.position || generatePosition();

    // Extract plain text from TipTap content for search
    const textContent = extractTextFromTipTap(validated.content);

    // Create article
    const article = await prisma.page.create({
      data: {
        slug: validated.slug,
        title: validated.title,
        type: 'WIKI',
        content: validated.content,
        textContent,
        icon: validated.icon || '📄',
        parentId: validated.sectionId,
        position,
      },
    });

    revalidatePath('/resources');
    revalidatePath('/admin/resources');
    revalidatePath('/editor/resources');

    return { success: true, article };
  } catch (error: any) {
    console.error('Error creating resource article:', error);

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    return {
      success: false,
      error: error?.message || 'Failed to create article',
    };
  }
}

/**
 * Update a resource article
 */
export async function updateResourceArticle(
  id: string,
  data: Partial<ResourceArticleData>
): Promise<{ success: boolean; error?: string; article?: Page }> {
  try {
    const updateData: Prisma.PageUpdateInput = {};

    if (data.title) updateData.title = data.title;
    if (data.slug) {
      // Check slug uniqueness
      const existing = await prisma.page.findFirst({
        where: { slug: data.slug, id: { not: id } },
      });
      if (existing) {
        return {
          success: false,
          error: `Article with slug "${data.slug}" already exists`,
        };
      }
      updateData.slug = data.slug;
    }
    if (data.content) {
      updateData.content = data.content;
      updateData.textContent = extractTextFromTipTap(data.content);
    }
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.sectionId) {
      updateData.parent = { connect: { id: data.sectionId } };
    }
    if (data.position) updateData.position = data.position;

    const article = await prisma.page.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/resources');
    revalidatePath('/admin/resources');
    revalidatePath('/editor/resources');

    return { success: true, article };
  } catch (error: any) {
    console.error('Error updating resource article:', error);
    return {
      success: false,
      error: error?.message || 'Failed to update article',
    };
  }
}

/**
 * Delete a resource article
 */
export async function deleteResourceArticle(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Soft delete
    await prisma.page.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    revalidatePath('/resources');
    revalidatePath('/admin/resources');
    revalidatePath('/editor/resources');

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting resource article:', error);
    return {
      success: false,
      error: error?.message || 'Failed to delete article',
    };
  }
}

/**
 * Move article to a different section
 */
export async function moveArticle(
  articleId: string,
  newSectionId: string,
  newPosition?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const position = newPosition || generatePosition();

    await prisma.page.update({
      where: { id: articleId },
      data: {
        parentId: newSectionId,
        position,
      },
    });

    revalidatePath('/resources');
    revalidatePath('/admin/resources');
    revalidatePath('/editor/resources');

    return { success: true };
  } catch (error: any) {
    console.error('Error moving article:', error);
    return {
      success: false,
      error: error?.message || 'Failed to move article',
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract plain text from TipTap JSON for search
 */
function extractTextFromTipTap(content: any): string {
  if (!content) return '';

  let text = '';

  function traverse(node: any) {
    if (node.text) {
      text += node.text + ' ';
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  traverse(content);
  return text.trim();
}
