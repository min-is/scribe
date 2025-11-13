'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Scenario } from '@prisma/client';

export type ScenarioFormData = {
  slug: string;
  title: string;
  category: string;
  description?: string;
  content: string;
  tags: string[];
};

/**
 * Get all scenarios
 */
export async function getScenarios(): Promise<Scenario[]> {
  try {
    return await prisma.scenario.findMany({
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
    });
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return [];
  }
}

/**
 * Get scenarios by category
 */
export async function getScenariosByCategory(
  category: string,
): Promise<Scenario[]> {
  try {
    return await prisma.scenario.findMany({
      where: { category },
      orderBy: { title: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching scenarios by category:', error);
    return [];
  }
}

/**
 * Search scenarios by query
 */
export async function searchScenarios(query: string): Promise<Scenario[]> {
  try {
    const lowerQuery = query.toLowerCase();
    return await prisma.scenario.findMany({
      where: {
        OR: [
          { slug: { contains: lowerQuery, mode: 'insensitive' } },
          { title: { contains: lowerQuery, mode: 'insensitive' } },
          { description: { contains: lowerQuery, mode: 'insensitive' } },
          { content: { contains: lowerQuery, mode: 'insensitive' } },
          { tags: { has: lowerQuery } },
        ],
      },
      orderBy: [{ viewCount: 'desc' }, { title: 'asc' }],
    });
  } catch (error) {
    console.error('Error searching scenarios:', error);
    return [];
  }
}

/**
 * Get a single scenario by ID
 */
export async function getScenario(id: string): Promise<Scenario | null> {
  try {
    return await prisma.scenario.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error fetching scenario:', error);
    return null;
  }
}

/**
 * Get a scenario by slug
 */
export async function getScenarioBySlug(
  slug: string,
): Promise<Scenario | null> {
  try {
    return await prisma.scenario.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.error('Error fetching scenario by slug:', error);
    return null;
  }
}

/**
 * Increment scenario view count
 */
export async function incrementScenarioViewCount(
  id: string,
): Promise<{ success: boolean }> {
  try {
    await prisma.scenario.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Error incrementing scenario view count:', error);
    return { success: false };
  }
}

/**
 * Get all unique categories
 */
export async function getScenarioCategories(): Promise<string[]> {
  try {
    const result = await prisma.scenario.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return result.map((r: { category: string }) => r.category);
  } catch (error) {
    console.error('Error fetching scenario categories:', error);
    return [];
  }
}

/**
 * Create a new scenario (admin only)
 */
export async function createScenario(
  data: ScenarioFormData,
): Promise<{ success: boolean; error?: string; scenario?: Scenario }> {
  try {
    const scenario = await prisma.scenario.create({
      data: {
        slug: data.slug,
        title: data.title,
        category: data.category,
        description: data.description,
        content: data.content,
        tags: data.tags,
      },
    });

    revalidatePath('/scenarios');
    revalidatePath('/admin/scenarios');

    return { success: true, scenario };
  } catch (error: any) {
    console.error('Error creating scenario:', error);

    // Provide more specific error messages
    if (error?.code === 'P2002') {
      return { success: false, error: `Scenario with slug "${data.slug}" already exists` };
    }
    if (error?.message?.includes('does not exist') || error?.message?.includes('Unknown')) {
      return { success: false, error: 'Scenario table does not exist. Run: npm run prisma:migrate:deploy' };
    }

    return { success: false, error: error?.message || 'Failed to create scenario' };
  }
}

/**
 * Update an existing scenario (admin only)
 */
export async function updateScenario(
  id: string,
  data: Partial<ScenarioFormData>,
): Promise<{ success: boolean; error?: string; scenario?: Scenario }> {
  try {
    const scenario = await prisma.scenario.update({
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

    revalidatePath('/scenarios');
    revalidatePath('/admin/scenarios');

    return { success: true, scenario };
  } catch (error) {
    console.error('Error updating scenario:', error);
    return { success: false, error: 'Failed to update scenario' };
  }
}

/**
 * Delete a scenario (admin only)
 */
export async function deleteScenario(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.scenario.delete({
      where: { id },
    });

    revalidatePath('/scenarios');
    revalidatePath('/admin/scenarios');

    return { success: true };
  } catch (error) {
    console.error('Error deleting scenario:', error);
    return { success: false, error: 'Failed to delete scenario' };
  }
}
