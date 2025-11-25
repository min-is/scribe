'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Terminology } from '@prisma/client';

export type TerminologyFormData = {
  term: string;
  slug: string;
  definition: string;
  category: string;
  examples?: string[];
};

/**
 * Get all terminology entries
 */
export async function getTerminologies(): Promise<Terminology[]> {
  try {
    return await prisma.terminology.findMany({
      orderBy: { term: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching terminologies:', error);
    return [];
  }
}

/**
 * Get a single terminology by ID
 */
export async function getTerminology(id: string): Promise<Terminology | null> {
  try {
    return await prisma.terminology.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error fetching terminology:', error);
    return null;
  }
}

/**
 * Get a terminology by slug
 */
export async function getTerminologyBySlug(
  slug: string,
): Promise<Terminology | null> {
  try {
    return await prisma.terminology.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.error('Error fetching terminology by slug:', error);
    return null;
  }
}

/**
 * Create a new terminology entry
 */
export async function createTerminology(
  data: TerminologyFormData,
): Promise<{ success: boolean; error?: string; terminology?: Terminology }> {
  try {
    // Check if slug already exists
    const existing = await prisma.terminology.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return {
        success: false,
        error: 'A terminology with this slug already exists',
      };
    }

    const terminology = await prisma.terminology.create({
      data: {
        term: data.term,
        slug: data.slug,
        definition: data.definition,
        category: data.category,
        examples: data.examples || [],
      },
    });

    revalidatePath('/admin/terminology');
    revalidatePath('/editor/terminology');
    revalidatePath('/terminology');
    revalidatePath('/');

    return { success: true, terminology };
  } catch (error) {
    console.error('Error creating terminology:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create terminology';
    return { success: false, error: `Failed to create terminology: ${errorMessage}` };
  }
}

/**
 * Update a terminology entry
 */
export async function updateTerminology(
  id: string,
  data: Partial<TerminologyFormData>,
): Promise<{ success: boolean; error?: string; terminology?: Terminology }> {
  try {
    // If slug is being updated, check it doesn't conflict
    if (data.slug) {
      const existing = await prisma.terminology.findFirst({
        where: {
          slug: data.slug,
          NOT: { id },
        },
      });

      if (existing) {
        return {
          success: false,
          error: 'A terminology with this slug already exists',
        };
      }
    }

    const terminology = await prisma.terminology.update({
      where: { id },
      data: {
        ...(data.term && { term: data.term }),
        ...(data.slug && { slug: data.slug }),
        ...(data.definition && { definition: data.definition }),
        ...(data.category && { category: data.category }),
        ...(data.examples !== undefined && { examples: data.examples }),
      },
    });

    revalidatePath('/admin/terminology');
    revalidatePath('/editor/terminology');
    revalidatePath('/terminology');
    revalidatePath('/');

    return { success: true, terminology };
  } catch (error) {
    console.error('Error updating terminology:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update terminology';
    return { success: false, error: `Failed to update terminology: ${errorMessage}` };
  }
}

/**
 * Delete a terminology entry
 */
export async function deleteTerminology(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.terminology.delete({
      where: { id },
    });

    revalidatePath('/admin/terminology');
    revalidatePath('/editor/terminology');
    revalidatePath('/terminology');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error deleting terminology:', error);
    return { success: false, error: 'Failed to delete terminology' };
  }
}
