'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Medication, Prisma } from '@prisma/client';

export type MedicationFormData = {
  name: string;
  slug: string;
  type: string;
  commonlyUsedFor?: string;
  tags?: string[];
};

/**
 * Get all medications
 */
export async function getMedications(): Promise<Medication[]> {
  try {
    return await prisma.medication.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching medications:', error);
    return [];
  }
}

/**
 * Get a single medication by ID
 */
export async function getMedication(id: string): Promise<Medication | null> {
  try {
    return await prisma.medication.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error fetching medication:', error);
    return null;
  }
}

/**
 * Get a medication by slug
 */
export async function getMedicationBySlug(
  slug: string,
): Promise<Medication | null> {
  try {
    return await prisma.medication.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.error('Error fetching medication by slug:', error);
    return null;
  }
}

/**
 * Create a new medication
 */
export async function createMedication(
  data: MedicationFormData,
): Promise<{ success: boolean; error?: string; medication?: Medication }> {
  try {
    // Check if slug already exists
    const existing = await prisma.medication.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return {
        success: false,
        error: 'A medication with this slug already exists',
      };
    }

    // Create medication and associated page in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the medication
      const medication = await tx.medication.create({
        data: {
          name: data.name,
          slug: data.slug,
          type: data.type,
          commonlyUsedFor: data.commonlyUsedFor || null,
          tags: data.tags || [],
        },
      });

      // Create associated Page record
      await tx.page.create({
        data: {
          slug: medication.slug,
          title: medication.name,
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: `${medication.name} - ${medication.type}`,
                  },
                ],
              },
            ],
          },
          textContent: `${medication.name} ${medication.type} ${medication.commonlyUsedFor || ''}`,
          type: 'MEDICATION',
          category: medication.type,
          tags: data.tags || [],
          medicationId: medication.id,
          position: 'a0',
        },
      });

      return medication;
    });

    revalidatePath('/admin/medications');
    revalidatePath('/medications');
    revalidatePath('/');

    return { success: true, medication: result };
  } catch (error) {
    console.error('Error creating medication:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create medication';
    return { success: false, error: `Failed to create medication: ${errorMessage}` };
  }
}

/**
 * Update a medication
 */
export async function updateMedication(
  id: string,
  data: Partial<MedicationFormData>,
): Promise<{ success: boolean; error?: string; medication?: Medication }> {
  try {
    // If slug is being updated, check it doesn't conflict
    if (data.slug) {
      const existing = await prisma.medication.findFirst({
        where: {
          slug: data.slug,
          NOT: { id },
        },
      });

      if (existing) {
        return {
          success: false,
          error: 'A medication with this slug already exists',
        };
      }
    }

    const medication = await prisma.medication.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.type && { type: data.type }),
        ...(data.commonlyUsedFor !== undefined && {
          commonlyUsedFor: data.commonlyUsedFor,
        }),
        ...(data.tags !== undefined && { tags: data.tags }),
      },
    });

    revalidatePath('/admin/medications');
    revalidatePath('/medications');
    revalidatePath('/');

    return { success: true, medication };
  } catch (error) {
    console.error('Error updating medication:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update medication';
    return { success: false, error: `Failed to update medication: ${errorMessage}` };
  }
}

/**
 * Delete a medication
 */
export async function deleteMedication(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete medication and associated page in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete associated Page records first
      await tx.page.deleteMany({
        where: { medicationId: id },
      });

      // Then delete the medication
      await tx.medication.delete({
        where: { id },
      });
    });

    revalidatePath('/admin/medications');
    revalidatePath('/medications');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error deleting medication:', error);
    return { success: false, error: 'Failed to delete medication' };
  }
}
