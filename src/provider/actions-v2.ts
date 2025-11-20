/**
 * Provider Actions V2 - Refactored to use Service Layer
 *
 * This is the refactored version of provider actions using the new
 * service layer architecture. It provides a clean separation between
 * API/action handlers and business logic.
 *
 * To migrate, replace imports from './actions' to './actions-v2'
 */

'use server';

import { revalidatePath } from 'next/cache';
import { Provider } from '@prisma/client';
import { ProviderService } from '@/lib/services';
import { CreateProviderInput, UpdateProviderInput } from '@/lib/dtos';
import { parseWikiContent } from '@/lib/type-guards';

const providerService = new ProviderService();

/**
 * Get all providers
 */
export async function getProviders(): Promise<Provider[]> {
  try {
    const providers = await providerService.getAllProviders('name');
    return providers as any; // DTOs are compatible with Provider model
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
    // For backward compatibility, we need to fetch via slug
    // This would need ID-based lookup in the service
    return null; // TODO: Add getProviderById to service if needed
  } catch (error) {
    console.error('Error fetching provider:', error);
    return null;
  }
}

/**
 * Get a provider by slug
 */
export async function getProviderBySlug(slug: string): Promise<Provider | null> {
  try {
    const provider = await providerService.getProviderBySlug(slug);
    return provider as any;
  } catch (error) {
    console.error('Error fetching provider by slug:', error);
    return null;
  }
}

/**
 * Get provider profile with page content
 */
export async function getProviderProfile(slug: string) {
  try {
    const profile = await providerService.getProviderProfile(slug);
    return profile;
  } catch (error) {
    console.error('Error fetching provider profile:', error);
    return null;
  }
}

/**
 * Get top providers by popularity
 */
export async function getTopProviders(limit: number = 10): Promise<Provider[]> {
  try {
    const providers = await providerService.getTopProviders(limit);
    return providers as any;
  } catch (error) {
    console.error('Error fetching top providers:', error);
    return [];
  }
}

/**
 * Increment provider view count
 */
export async function incrementProviderViewCount(slug: string): Promise<{ success: boolean }> {
  try {
    await providerService.incrementViewCount(slug);
    return { success: true };
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return { success: false };
  }
}

/**
 * Increment provider search click count
 */
export async function incrementProviderSearchClick(slug: string): Promise<{ success: boolean }> {
  try {
    await providerService.incrementSearchClickCount(slug);
    return { success: true };
  } catch (error) {
    console.error('Error incrementing search click count:', error);
    return { success: false };
  }
}

/**
 * Create a new provider
 */
export async function createProvider(data: {
  name: string;
  slug: string;
  credentials?: string;
  generalDifficulty?: number;
  speedDifficulty?: number;
  terminologyDifficulty?: number;
  noteDifficulty?: number;
  noteTemplate?: string;
  noteSmartPhrase?: string;
}): Promise<{ success: boolean; error?: string; provider?: any }> {
  try {
    const input: CreateProviderInput = {
      name: data.name,
      slug: data.slug,
      credentials: data.credentials,
      generalDifficulty: data.generalDifficulty,
      speedDifficulty: data.speedDifficulty,
      terminologyDifficulty: data.terminologyDifficulty,
      noteDifficulty: data.noteDifficulty,
      noteTemplate: data.noteTemplate,
      noteSmartPhrase: data.noteSmartPhrase,
    };

    const provider = await providerService.createProvider(input);

    revalidatePath('/admin/providers');
    revalidatePath('/providers');
    revalidatePath('/');

    return { success: true, provider };
  } catch (error) {
    console.error('Error creating provider:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create provider';
    return { success: false, error: errorMessage };
  }
}

/**
 * Update a provider
 */
export async function updateProvider(
  id: string,
  data: {
    name?: string;
    slug?: string;
    credentials?: string;
    generalDifficulty?: number;
    speedDifficulty?: number;
    terminologyDifficulty?: number;
    noteDifficulty?: number;
    wikiContent?: unknown;
  }
): Promise<{ success: boolean; error?: string; provider?: any }> {
  try {
    const input: UpdateProviderInput = {
      name: data.name,
      credentials: data.credentials,
      generalDifficulty: data.generalDifficulty,
      speedDifficulty: data.speedDifficulty,
      terminologyDifficulty: data.terminologyDifficulty,
      noteDifficulty: data.noteDifficulty,
    };

    // Validate and parse wikiContent if provided
    if (data.wikiContent !== undefined) {
      const wikiContent = parseWikiContent(data.wikiContent);
      if (wikiContent) {
        input.wikiContent = wikiContent;
      }
    }

    const provider = await providerService.updateProvider(id, input);

    // Revalidate relevant paths
    const oldSlug = data.slug; // Would need to get this from existing provider
    revalidatePath('/admin/providers');
    revalidatePath('/providers');
    revalidatePath(`/providers/${provider.slug}`);
    if (oldSlug && oldSlug !== provider.slug) {
      revalidatePath(`/providers/${oldSlug}`);
    }
    revalidatePath('/');

    return { success: true, provider };
  } catch (error) {
    console.error('Error updating provider:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update provider';
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete a provider
 * Note: This maintains existing behavior from original actions
 */
export async function deleteProvider(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Implementation depends on whether you want soft or hard delete
    // For now, leaving as TODO since original didn't have delete
    return { success: false, error: 'Delete not implemented' };
  } catch (error) {
    console.error('Error deleting provider:', error);
    return { success: false, error: 'Failed to delete provider' };
  }
}

/**
 * Search providers
 */
export async function searchProviders(query: string): Promise<Provider[]> {
  try {
    const providers = await providerService.searchProviders(query);
    return providers as any;
  } catch (error) {
    console.error('Error searching providers:', error);
    return [];
  }
}
