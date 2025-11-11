'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Physician } from '@prisma/client';

export type PhysicianFormData = {
  name: string;
  slug: string;
  specialty?: string;
  credentials?: string;
  noteTemplate?: string;
  preferences?: Record<string, unknown>;
};

/**
 * Get all physicians
 */
export async function getPhysicians(): Promise<Physician[]> {
  try {
    return await prisma.physician.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching physicians:', error);
    return [];
  }
}

/**
 * Get a single physician by ID
 */
export async function getPhysician(id: string): Promise<Physician | null> {
  try {
    return await prisma.physician.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error fetching physician:', error);
    return null;
  }
}

/**
 * Get a physician by slug
 */
export async function getPhysicianBySlug(
  slug: string,
): Promise<Physician | null> {
  try {
    return await prisma.physician.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.error('Error fetching physician by slug:', error);
    return null;
  }
}

/**
 * Create a new physician
 */
export async function createPhysician(
  data: PhysicianFormData,
): Promise<{ success: boolean; error?: string; physician?: Physician }> {
  try {
    // Check if slug already exists
    const existing = await prisma.physician.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return {
        success: false,
        error: 'A physician with this slug already exists',
      };
    }

    const physician = await prisma.physician.create({
      data: {
        name: data.name,
        slug: data.slug,
        specialty: data.specialty || null,
        credentials: data.credentials || null,
        noteTemplate: data.noteTemplate || null,
        preferences: data.preferences || null,
      },
    });

    revalidatePath('/admin/physicians');
    revalidatePath('/');

    return { success: true, physician };
  } catch (error) {
    console.error('Error creating physician:', error);
    return { success: false, error: 'Failed to create physician' };
  }
}

/**
 * Update a physician
 */
export async function updatePhysician(
  id: string,
  data: Partial<PhysicianFormData>,
): Promise<{ success: boolean; error?: string; physician?: Physician }> {
  try {
    // If slug is being updated, check it doesn't conflict
    if (data.slug) {
      const existing = await prisma.physician.findFirst({
        where: {
          slug: data.slug,
          NOT: { id },
        },
      });

      if (existing) {
        return {
          success: false,
          error: 'A physician with this slug already exists',
        };
      }
    }

    const physician = await prisma.physician.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.specialty !== undefined && { specialty: data.specialty }),
        ...(data.credentials !== undefined && {
          credentials: data.credentials,
        }),
        ...(data.noteTemplate !== undefined && {
          noteTemplate: data.noteTemplate,
        }),
        ...(data.preferences !== undefined && {
          preferences: data.preferences,
        }),
      },
    });

    revalidatePath('/admin/physicians');
    revalidatePath('/');

    return { success: true, physician };
  } catch (error) {
    console.error('Error updating physician:', error);
    return { success: false, error: 'Failed to update physician' };
  }
}

/**
 * Delete a physician
 */
export async function deletePhysician(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.physician.delete({
      where: { id },
    });

    revalidatePath('/admin/physicians');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error deleting physician:', error);
    return { success: false, error: 'Failed to delete physician' };
  }
}
