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

    // Create provider and associated page in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the provider
      const provider = await tx.provider.create({
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
        if (wikiContentObj.sections && Array.isArray(wikiContentObj.sections) && wikiContentObj.sections.length > 0) {
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

    // Use transaction to update both provider and associated page
    const provider = await prisma.$transaction(async (tx) => {
      const updatedProvider = await tx.provider.update({
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
          ...(data.wikiContent !== undefined && {
            wikiContent: data.wikiContent,
          }),
        },
      });

      // Sync wiki content to associated Page record if wikiContent is updated
      if (data.wikiContent !== undefined) {
        // Extract content from wikiContent sections
        let pageContent: any = {
          type: 'doc',
          content: [],
        };

        if (data.wikiContent && typeof data.wikiContent === 'object') {
          const wikiContentObj = data.wikiContent as any;
          if (wikiContentObj.sections && Array.isArray(wikiContentObj.sections)) {
            // Combine all visible section contents into one document
            const allContent: any[] = [];
            for (const section of wikiContentObj.sections) {
              if (section.visible !== false && section.content && section.content.type === 'doc') {
                // Add section title as heading
                if (section.title) {
                  allContent.push({
                    type: 'heading',
                    attrs: { level: 2 },
                    content: [{ type: 'text', text: section.title }],
                  });
                }
                // Add section content
                if (section.content.content && Array.isArray(section.content.content)) {
                  allContent.push(...section.content.content);
                }
              }
            }
            pageContent.content = allContent;
          }
        }

        // Update or create the associated Page record
        const existingPage = await tx.page.findUnique({
          where: { providerId: id },
        });

        if (existingPage) {
          await tx.page.update({
            where: { providerId: id },
            data: {
              content: pageContent,
              ...(data.name && { title: data.name }),
              ...(data.slug && { slug: data.slug }),
            },
          });
        } else {
          // Create page if it doesn't exist (for legacy providers)
          await tx.page.create({
            data: {
              slug: data.slug || updatedProvider.slug,
              title: data.name || updatedProvider.name,
              content: pageContent,
              type: 'PROVIDER',
              providerId: id,
              position: 'a0',
            },
          });
        }
      } else if (data.name || data.slug) {
        // Update page title/slug even if wiki content isn't changing
        const existingPage = await tx.page.findUnique({
          where: { providerId: id },
        });

        if (existingPage) {
          await tx.page.update({
            where: { providerId: id },
            data: {
              ...(data.name && { title: data.name }),
              ...(data.slug && { slug: data.slug }),
            },
          });
        }
      }

      return updatedProvider;
    });

    revalidatePath('/admin/providers');
    revalidatePath('/providers');
    revalidatePath('/workspace');
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
