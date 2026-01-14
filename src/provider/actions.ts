'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Provider, Prisma } from '@prisma/client';

export type ProviderFormData = {
  name: string;
  slug: string;
  credentials?: string;
  icon?: string;
  generalDifficulty?: number;
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
 * Get top providers by difficulty (hardest providers to work with)
 */
export async function getTopProviders(limit: number = 5): Promise<Provider[]> {
  try {
    const providers = await prisma.provider.findMany({
      where: {
        generalDifficulty: {
          not: null,
        },
      },
      orderBy: [
        { generalDifficulty: 'desc' },
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

    // Create provider and associated page in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the provider
      const provider = await tx.provider.create({
        data: {
          name: data.name,
          slug: data.slug,
          credentials: data.credentials || null,
          icon: data.icon || null,
          generalDifficulty: data.generalDifficulty || null,
          noteTemplate: data.noteTemplate || null,
          noteSmartPhrase: data.noteSmartPhrase || null,
          ...(data.preferences && { preferences: data.preferences }),
          ...(data.wikiContent && { wikiContent: data.wikiContent }),
        },
      });

      // Extract content from wikiContent if it exists
      let pageContent: any = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [] }],
      };

      if (data.wikiContent && typeof data.wikiContent === 'object') {
        const wikiContentObj = data.wikiContent as any;
        // Check for v2 structure first (direct content field)
        if (wikiContentObj.content && wikiContentObj.content.type === 'doc') {
          pageContent = wikiContentObj.content;
        }
        // Fall back to v1 structure (sections-based)
        else if (wikiContentObj.sections && Array.isArray(wikiContentObj.sections) && wikiContentObj.sections.length > 0) {
          const firstSection = wikiContentObj.sections[0];
          if (firstSection.content && firstSection.content.type === 'doc') {
            pageContent = firstSection.content;
          }
        }
      }

      // Create associated Page record
      await tx.page.create({
        data: {
          slug: provider.slug,
          title: provider.name,
          content: pageContent,
          type: 'PROVIDER',
          providerId: provider.id,
          position: 'a0',
        },
      });

      return provider;
    });

    revalidatePath('/admin/providers');
    revalidatePath('/providers');
    revalidatePath('/');

    return { success: true, provider: result };
  } catch (error) {
    console.error('Error creating provider:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create provider';
    return { success: false, error: `Failed to create provider: ${errorMessage}` };
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

    // Update provider and sync to Page in a transaction
    const provider = await prisma.$transaction(async (tx) => {
      // Update the provider
      const updatedProvider = await tx.provider.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.slug && { slug: data.slug }),
          ...(data.credentials !== undefined && {
            credentials: data.credentials,
          }),
          ...(data.icon !== undefined && {
            icon: data.icon,
          }),
          ...(data.generalDifficulty !== undefined && {
            generalDifficulty: data.generalDifficulty,
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
          ...(data.wikiContent !== undefined && {
            wikiContent: data.wikiContent,
          }),
        },
        include: {
          page: true,
        },
      });

      // If wikiContent was updated, sync to the Page record
      if (data.wikiContent !== undefined && updatedProvider.page) {
        const wikiContentObj = data.wikiContent as any;

        // Extract content for syncing to Page
        let combinedContent: any = {
          type: 'doc',
          content: [],
        };

        // Check for v2 structure first (direct content field)
        // Deep clone to avoid reference sharing between providers
        if (wikiContentObj?.content && wikiContentObj.content.type === 'doc') {
          combinedContent = JSON.parse(JSON.stringify(wikiContentObj.content));
        }
        // Fall back to v1 structure (sections-based)
        else if (wikiContentObj?.sections && Array.isArray(wikiContentObj.sections)) {
          const visibleSections = wikiContentObj.sections.filter((s: any) => s.visible);

          for (const section of visibleSections) {
            if (section.content?.content) {
              combinedContent.content.push(...section.content.content);
            }
          }
        }

        // If no content, use empty paragraph
        if (combinedContent.content.length === 0) {
          combinedContent.content = [{ type: 'paragraph', content: [] }];
        }

        // Update the associated Page record
        await tx.page.update({
          where: { id: updatedProvider.page.id },
          data: {
            content: combinedContent,
            ...(data.name && { title: data.name }),
            ...(data.slug && { slug: data.slug }),
          },
        });
      }

      return updatedProvider;
    });

    revalidatePath('/admin/providers');
    revalidatePath('/providers');
    revalidatePath('/');

    return { success: true, provider };
  } catch (error) {
    console.error('Error updating provider:', error);
    // Return more specific error message if available
    const errorMessage = error instanceof Error ? error.message : 'Failed to update provider';
    return { success: false, error: `Failed to update provider: ${errorMessage}` };
  }
}

/**
 * Delete a provider
 */
export async function deleteProvider(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete provider and associated page in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete associated Page records first
      await tx.page.deleteMany({
        where: { providerId: id },
      });

      // Then delete the provider
      await tx.provider.delete({
        where: { id },
      });
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
