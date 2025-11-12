'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Provider, Prisma } from '@prisma/client';

export type ProviderFormData = {
  name: string;
  slug: string;
  credentials?: string;
  generalDifficulty?: number;
  speedDifficulty?: number;
  terminologyDifficulty?: number;
  noteDifficulty?: number;
  noteTemplate?: string;
  noteSmartPhrase?: string;
  preferences?: Prisma.InputJsonValue;
  wikiContent?: Prisma.InputJsonValue;
};

/**
 * Get all providers
 */
export async function getProviders(): Promise<Provider[]> {
  try {
    return await prisma.provider.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return [];
  }
}

/**
 * Get a single provider by ID
 */
export async function getProvider(id: string): Promise<Provider | null> {
  try {
    return await prisma.provider.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error fetching provider:', error);
    return null;
  }
}

/**
 * Get a provider by slug
 */
export async function getProviderBySlug(
  slug: string,
): Promise<Provider | null> {
  try {
    return await prisma.provider.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.error('Error fetching provider by slug:', error);
    return null;
  }
}

/**
 * Get top providers by popularity (viewCount + searchClickCount)
 */
export async function getTopProviders(limit: number = 10): Promise<Provider[]> {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: [
        { viewCount: 'desc' },
        { searchClickCount: 'desc' },
        { name: 'asc' },
      ],
      take: limit,
    });
    return providers;
  } catch (error) {
    console.error('Error fetching top providers:', error);
    return [];
  }
}

/**
 * Increment provider view count when profile is viewed
 */
export async function incrementProviderViewCount(
  slug: string,
): Promise<{ success: boolean }> {
  try {
    await prisma.provider.update({
      where: { slug },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return { success: false };
  }
}

/**
 * Increment provider search click count when clicked from search
 */
export async function incrementProviderSearchClick(
  slug: string,
): Promise<{ success: boolean }> {
  try {
    await prisma.provider.update({
      where: { slug },
      data: {
        searchClickCount: {
          increment: 1,
        },
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Error incrementing search click count:', error);
    return { success: false };
  }
}

/**
 * Create a new provider
 */
export async function createProvider(
  data: ProviderFormData,
): Promise<{ success: boolean; error?: string; provider?: Provider }> {
  try {
    // Check if slug already exists
    const existing = await prisma.provider.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return {
        success: false,
        error: 'A provider with this slug already exists',
      };
    }

    const provider = await prisma.provider.create({
      data: {
        name: data.name,
        slug: data.slug,
        credentials: data.credentials || null,
        generalDifficulty: data.generalDifficulty || null,
        speedDifficulty: data.speedDifficulty || null,
        terminologyDifficulty: data.terminologyDifficulty || null,
        noteDifficulty: data.noteDifficulty || null,
        noteTemplate: data.noteTemplate || null,
        noteSmartPhrase: data.noteSmartPhrase || null,
        ...(data.preferences && { preferences: data.preferences }),
      },
    });

    revalidatePath('/admin/providers');
    revalidatePath('/providers');
    revalidatePath('/');

    return { success: true, provider };
  } catch (error) {
    console.error('Error creating provider:', error);
    return { success: false, error: 'Failed to create provider' };
  }
}

/**
 * Update a provider
 */
export async function updateProvider(
  id: string,
  data: Partial<ProviderFormData>,
): Promise<{ success: boolean; error?: string; provider?: Provider }> {
  try {
    // If slug is being updated, check it doesn't conflict
    if (data.slug) {
      const existing = await prisma.provider.findFirst({
        where: {
          slug: data.slug,
          NOT: { id },
        },
      });

      if (existing) {
        return {
          success: false,
          error: 'A provider with this slug already exists',
        };
      }
    }

    const provider = await prisma.provider.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.credentials !== undefined && {
          credentials: data.credentials,
        }),
        ...(data.generalDifficulty !== undefined && {
          generalDifficulty: data.generalDifficulty,
        }),
        ...(data.speedDifficulty !== undefined && {
          speedDifficulty: data.speedDifficulty,
        }),
        ...(data.terminologyDifficulty !== undefined && {
          terminologyDifficulty: data.terminologyDifficulty,
        }),
        ...(data.noteDifficulty !== undefined && {
          noteDifficulty: data.noteDifficulty,
        }),
        ...(data.noteTemplate !== undefined && {
          noteTemplate: data.noteTemplate,
        }),
        ...(data.noteSmartPhrase !== undefined && {
          noteSmartPhrase: data.noteSmartPhrase,
        }),
        ...(data.preferences !== undefined && {
          preferences: data.preferences,
        }),
      },
    });

    revalidatePath('/admin/providers');
    revalidatePath('/providers');
    revalidatePath('/');

    return { success: true, provider };
  } catch (error) {
    console.error('Error updating provider:', error);
    return { success: false, error: 'Failed to update provider' };
  }
}

/**
 * Delete a provider
 */
export async function deleteProvider(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.provider.delete({
      where: { id },
    });

    revalidatePath('/admin/providers');
    revalidatePath('/providers');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error deleting provider:', error);
    return { success: false, error: 'Failed to delete provider' };
  }
}
