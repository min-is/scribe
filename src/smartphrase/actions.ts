'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { SmartPhrase } from '@prisma/client';

export type SmartPhraseFormData = {
  slug: string;
  title: string;
  category: string;
  description?: string;
  content: string;
  tags: string[];
};

/**
 * Get all smartphrases
 */
export async function getSmartPhrases(): Promise<SmartPhrase[]> {
  try {
    return await prisma.smartPhrase.findMany({
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
    });
  } catch (error) {
    console.error('Error fetching smartphrases:', error);
    return [];
  }
}

/**
 * Get smartphrases by category
 */
export async function getSmartPhrasesByCategory(
  category: string,
): Promise<SmartPhrase[]> {
  try {
    return await prisma.smartPhrase.findMany({
      where: { category },
      orderBy: { title: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching smartphrases by category:', error);
    return [];
  }
}

/**
 * Search smartphrases by query
 */
export async function searchSmartPhrases(
  query: string,
): Promise<SmartPhrase[]> {
  try {
    const lowerQuery = query.toLowerCase();
    return await prisma.smartPhrase.findMany({
      where: {
        OR: [
          { slug: { contains: lowerQuery, mode: 'insensitive' } },
          { title: { contains: lowerQuery, mode: 'insensitive' } },
          { description: { contains: lowerQuery, mode: 'insensitive' } },
          { content: { contains: lowerQuery, mode: 'insensitive' } },
          { tags: { has: lowerQuery } },
        ],
      },
      orderBy: [{ usageCount: 'desc' }, { title: 'asc' }],
    });
  } catch (error) {
    console.error('Error searching smartphrases:', error);
    return [];
  }
}

/**
 * Get a single smartphrase by ID
 */
export async function getSmartPhrase(id: string): Promise<SmartPhrase | null> {
  try {
    return await prisma.smartPhrase.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error fetching smartphrase:', error);
    return null;
  }
}

/**
 * Get a smartphrase by slug
 */
export async function getSmartPhraseBySlug(
  slug: string,
): Promise<SmartPhrase | null> {
  try {
    return await prisma.smartPhrase.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.error('Error fetching smartphrase by slug:', error);
    return null;
  }
}

/**
 * Increment smartphrase usage count when copied
 */
export async function incrementSmartPhraseUsage(
  id: string,
): Promise<{ success: boolean }> {
  try {
    await prisma.smartPhrase.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Error incrementing smartphrase usage:', error);
    return { success: false };
  }
}

/**
 * Get all unique categories
 */
export async function getCategories(): Promise<string[]> {
  try {
    const result = await prisma.smartPhrase.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return result.map((r: { category: string }) => r.category);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Create a new smartphrase (admin only)
 */
export async function createSmartPhrase(
  data: SmartPhraseFormData,
): Promise<{ success: boolean; error?: string; smartphrase?: SmartPhrase }> {
  try {
    const smartphrase = await prisma.smartPhrase.create({
      data: {
        slug: data.slug,
        title: data.title,
        category: data.category,
        description: data.description,
        content: data.content,
        tags: data.tags,
      },
    });

    revalidatePath('/smartphrases');
    revalidatePath('/admin/smartphrases');

    return { success: true, smartphrase };
  } catch (error: any) {
    console.error('Error creating smartphrase:', error);

    // Provide more specific error messages
    if (error?.code === 'P2002') {
      return { success: false, error: `SmartPhrase with slug "${data.slug}" already exists` };
    }
    if (error?.code === 'P2003') {
      return { success: false, error: 'Foreign key constraint violation' };
    }
    if (error?.message?.includes('does not exist') || error?.message?.includes('Unknown')) {
      return { success: false, error: 'SmartPhrase table does not exist. Run: npm run prisma:migrate:deploy' };
    }

    return { success: false, error: error?.message || 'Failed to create smartphrase' };
  }
}

/**
 * Update an existing smartphrase (admin only)
 */
export async function updateSmartPhrase(
  id: string,
  data: Partial<SmartPhraseFormData>,
): Promise<{ success: boolean; error?: string; smartphrase?: SmartPhrase }> {
  try {
    const smartphrase = await prisma.smartPhrase.update({
      where: { id },
      data: {
        slug: data.slug,
        title: data.title,
        category: data.category,
        description: data.description,
        content: data.content,
        tags: data.tags,
      },
    });

    revalidatePath('/smartphrases');
    revalidatePath('/admin/smartphrases');

    return { success: true, smartphrase };
  } catch (error) {
    console.error('Error updating smartphrase:', error);
    return { success: false, error: 'Failed to update smartphrase' };
  }
}

/**
 * Delete a smartphrase (admin only)
 */
export async function deleteSmartPhrase(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.smartPhrase.delete({
      where: { id },
    });

    revalidatePath('/smartphrases');
    revalidatePath('/admin/smartphrases');

    return { success: true };
  } catch (error) {
    console.error('Error deleting smartphrase:', error);
    return { success: false, error: 'Failed to delete smartphrase' };
  }
}
