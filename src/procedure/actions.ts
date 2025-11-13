'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Procedure } from '@prisma/client';

export type ProcedureFormData = {
  slug: string;
  title: string;
  category: string;
  description?: string;
  indications?: string;
  contraindications?: string;
  equipment?: string;
  steps: string;
  complications?: string;
  tags: string[];
};

/**
 * Get all procedures
 */
export async function getProcedures(): Promise<Procedure[]> {
  try {
    return await prisma.procedure.findMany({
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
    });
  } catch (error) {
    console.error('Error fetching procedures:', error);
    return [];
  }
}

/**
 * Get procedures by category
 */
export async function getProceduresByCategory(
  category: string,
): Promise<Procedure[]> {
  try {
    return await prisma.procedure.findMany({
      where: { category },
      orderBy: { title: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching procedures by category:', error);
    return [];
  }
}

/**
 * Search procedures by query
 */
export async function searchProcedures(query: string): Promise<Procedure[]> {
  try {
    const lowerQuery = query.toLowerCase();
    return await prisma.procedure.findMany({
      where: {
        OR: [
          { slug: { contains: lowerQuery, mode: 'insensitive' } },
          { title: { contains: lowerQuery, mode: 'insensitive' } },
          { description: { contains: lowerQuery, mode: 'insensitive' } },
          { steps: { contains: lowerQuery, mode: 'insensitive' } },
          { tags: { has: lowerQuery } },
        ],
      },
      orderBy: [{ viewCount: 'desc' }, { title: 'asc' }],
    });
  } catch (error) {
    console.error('Error searching procedures:', error);
    return [];
  }
}

/**
 * Get a single procedure by ID
 */
export async function getProcedure(id: string): Promise<Procedure | null> {
  try {
    return await prisma.procedure.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error fetching procedure:', error);
    return null;
  }
}

/**
 * Get a procedure by slug
 */
export async function getProcedureBySlug(
  slug: string,
): Promise<Procedure | null> {
  try {
    return await prisma.procedure.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.error('Error fetching procedure by slug:', error);
    return null;
  }
}

/**
 * Increment procedure view count
 */
export async function incrementProcedureViewCount(
  id: string,
): Promise<{ success: boolean }> {
  try {
    await prisma.procedure.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Error incrementing procedure view count:', error);
    return { success: false };
  }
}

/**
 * Get all unique categories
 */
export async function getProcedureCategories(): Promise<string[]> {
  try {
    const result = await prisma.procedure.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return result.map((r: { category: string }) => r.category);
  } catch (error) {
    console.error('Error fetching procedure categories:', error);
    return [];
  }
}

/**
 * Create a new procedure (admin only)
 */
export async function createProcedure(
  data: ProcedureFormData,
): Promise<{ success: boolean; error?: string; procedure?: Procedure }> {
  try {
    const procedure = await prisma.procedure.create({
      data: {
        slug: data.slug,
        title: data.title,
        category: data.category,
        description: data.description,
        indications: data.indications,
        contraindications: data.contraindications,
        equipment: data.equipment,
        steps: data.steps,
        complications: data.complications,
        tags: data.tags,
      },
    });

    revalidatePath('/procedures');
    revalidatePath('/admin/procedures');

    return { success: true, procedure };
  } catch (error) {
    console.error('Error creating procedure:', error);
    return { success: false, error: 'Failed to create procedure' };
  }
}

/**
 * Update an existing procedure (admin only)
 */
export async function updateProcedure(
  id: string,
  data: Partial<ProcedureFormData>,
): Promise<{ success: boolean; error?: string; procedure?: Procedure }> {
  try {
    const procedure = await prisma.procedure.update({
      where: { id },
      data: {
        slug: data.slug,
        title: data.title,
        category: data.category,
        description: data.description,
        indications: data.indications,
        contraindications: data.contraindications,
        equipment: data.equipment,
        steps: data.steps,
        complications: data.complications,
        tags: data.tags,
      },
    });

    revalidatePath('/procedures');
    revalidatePath('/admin/procedures');

    return { success: true, procedure };
  } catch (error) {
    console.error('Error updating procedure:', error);
    return { success: false, error: 'Failed to update procedure' };
  }
}

/**
 * Delete a procedure (admin only)
 */
export async function deleteProcedure(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.procedure.delete({
      where: { id },
    });

    revalidatePath('/procedures');
    revalidatePath('/admin/procedures');

    return { success: true };
  } catch (error) {
    console.error('Error deleting procedure:', error);
    return { success: false, error: 'Failed to delete procedure' };
  }
}
