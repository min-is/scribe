'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { PhysicianDirectory, Prisma } from '@prisma/client';

export type PhysicianDirectoryFormData = {
  name: string;
  slug: string;
  specialty: string;
  tags?: string[];
};

/**
 * Get all physician directory entries
 */
export async function getPhysicianDirectories(): Promise<PhysicianDirectory[]> {
  try {
    return await prisma.physicianDirectory.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching physician directories:', error);
    return [];
  }
}

/**
 * Get a single physician directory entry by ID
 */
export async function getPhysicianDirectory(id: string): Promise<PhysicianDirectory | null> {
  try {
    return await prisma.physicianDirectory.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error fetching physician directory:', error);
    return null;
  }
}

/**
 * Get a physician directory entry by slug
 */
export async function getPhysicianDirectoryBySlug(
  slug: string,
): Promise<PhysicianDirectory | null> {
  try {
    return await prisma.physicianDirectory.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.error('Error fetching physician directory by slug:', error);
    return null;
  }
}

/**
 * Create a new physician directory entry
 */
export async function createPhysicianDirectory(
  data: PhysicianDirectoryFormData,
): Promise<{ success: boolean; error?: string; entry?: PhysicianDirectory }> {
  try {
    // Check if slug already exists
    const existing = await prisma.physicianDirectory.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return {
        success: false,
        error: 'A physician with this slug already exists',
      };
    }

    // Create physician directory entry and associated page in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the physician directory entry
      const entry = await tx.physicianDirectory.create({
        data: {
          name: data.name,
          slug: data.slug,
          specialty: data.specialty,
          tags: data.tags || [],
        },
      });

      // Create associated Page record
      await tx.page.create({
        data: {
          slug: entry.slug,
          title: entry.name,
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: `${entry.name} - ${entry.specialty}`,
                  },
                ],
              },
            ],
          },
          textContent: `${entry.name} ${entry.specialty}`,
          type: 'PHYSICIAN_DIRECTORY',
          category: entry.specialty,
          tags: data.tags || [],
          physicianDirectoryId: entry.id,
          position: 'a0',
        },
      });

      return entry;
    });

    revalidatePath('/admin/physicians');
    revalidatePath('/physicians');
    revalidatePath('/');

    return { success: true, entry: result };
  } catch (error) {
    console.error('Error creating physician directory entry:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create physician directory entry';
    return { success: false, error: `Failed to create physician directory entry: ${errorMessage}` };
  }
}

/**
 * Update a physician directory entry
 */
export async function updatePhysicianDirectory(
  id: string,
  data: Partial<PhysicianDirectoryFormData>,
): Promise<{ success: boolean; error?: string; entry?: PhysicianDirectory }> {
  try {
    // If slug is being updated, check it doesn't conflict
    if (data.slug) {
      const existing = await prisma.physicianDirectory.findFirst({
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

    const entry = await prisma.physicianDirectory.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.specialty && { specialty: data.specialty }),
        ...(data.tags !== undefined && { tags: data.tags }),
      },
    });

    revalidatePath('/admin/physicians');
    revalidatePath('/physicians');
    revalidatePath('/');

    return { success: true, entry };
  } catch (error) {
    console.error('Error updating physician directory entry:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update physician directory entry';
    return { success: false, error: `Failed to update physician directory entry: ${errorMessage}` };
  }
}

/**
 * Delete a physician directory entry
 */
export async function deletePhysicianDirectory(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete physician directory entry and associated page in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete associated Page records first
      await tx.page.deleteMany({
        where: { physicianDirectoryId: id },
      });

      // Then delete the physician directory entry
      await tx.physicianDirectory.delete({
        where: { id },
      });
    });

    revalidatePath('/admin/physicians');
    revalidatePath('/physicians');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error deleting physician directory entry:', error);
    return { success: false, error: 'Failed to delete physician directory entry' };
  }
}
