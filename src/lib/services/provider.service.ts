/**
 * Provider Service
 *
 * Business logic layer for Provider operations
 */

import { PrismaClient } from '@prisma/client';
import { ProviderRepository, PageRepository } from '../repositories';
import {
  ProviderDTO,
  ProviderWithPageDTO,
  ProviderProfileDTO,
  CreateProviderInput,
  UpdateProviderInput,
} from '../dtos';
import { toInputJsonValue } from '../utils/json-helpers';
import { isWikiContent, parseWikiContent } from '../utils/type-guards';
import {
  wikiContentToTipTap,
  legacyToWikiContent,
  tipTapToPlainText,
} from '../utils/content-transformers';
import { WikiContent } from '@/provider/wiki-schema';

export class ProviderService {
  private providerRepo: ProviderRepository;
  private pageRepo: PageRepository;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.providerRepo = new ProviderRepository(prisma);
    this.pageRepo = new PageRepository(prisma);
  }

  /**
   * Get provider by slug
   */
  async getProviderBySlug(slug: string): Promise<ProviderDTO | null> {
    const provider = await this.providerRepo.findBySlug(slug);

    if (!provider) return null;

    return this.mapToDTO(provider);
  }

  /**
   * Get provider profile with page
   */
  async getProviderProfile(slug: string): Promise<ProviderProfileDTO | null> {
    const providerWithPage = await this.providerRepo.findBySlugWithPage(slug);

    if (!providerWithPage) return null;

    const providerDTO = this.mapToDTO(providerWithPage);

    // Get or create associated page
    let page = providerWithPage.page;

    if (!page && providerWithPage.wikiContent) {
      // Create page from wikiContent
      const wikiContent = parseWikiContent(providerWithPage.wikiContent);

      if (wikiContent) {
        const content = wikiContentToTipTap(wikiContent);
        const textContent = tipTapToPlainText(content);

        page = await this.pageRepo.create({
          slug: `provider-${providerWithPage.slug}`,
          title: providerWithPage.name,
          content: toInputJsonValue(content),
          textContent,
          type: 'PROVIDER',
          providerId: providerWithPage.id,
          icon: null,
          coverPhoto: null,
          parentId: null,
          tags: [],
          viewCount: 0,
        });
      }
    }

    return {
      provider: providerDTO,
      page: page
        ? {
            id: page.id,
            slug: page.slug,
            title: page.title,
            content: page.content as any,
            textContent: page.textContent,
            type: page.type,
            icon: page.icon,
            coverPhoto: page.coverPhoto,
            parentId: page.parentId,
            tags: page.tags,
            viewCount: page.viewCount,
            deletedAt: page.deletedAt,
            createdAt: page.createdAt,
            updatedAt: page.updatedAt,
          }
        : null,
      stats: {
        totalViews: providerWithPage.viewCount,
        searchClicks: providerWithPage.searchClickCount,
        lastUpdated: providerWithPage.updatedAt,
      },
    };
  }

  /**
   * Create a new provider
   */
  async createProvider(input: CreateProviderInput): Promise<ProviderDTO> {
    // Convert WikiContent to InputJsonValue using helper
    const wikiContentValue = input.wikiContent
      ? toInputJsonValue(input.wikiContent)
      : null;

    const preferencesValue = input.preferences
      ? toInputJsonValue(input.preferences)
      : null;

    const provider = await this.providerRepo.create({
      slug: input.slug,
      name: input.name,
      credentials: input.credentials || null,
      generalDifficulty: input.generalDifficulty || null,
      wikiContent: wikiContentValue,
      noteTemplate: input.noteTemplate || null,
      noteSmartPhrase: input.noteSmartPhrase || null,
      preferences: preferencesValue,
      viewCount: 0,
      searchClickCount: 0,
      deletedAt: null,
    });

    // Create associated page if wikiContent exists
    if (input.wikiContent) {
      const content = wikiContentToTipTap(input.wikiContent);
      const textContent = tipTapToPlainText(content);

      await this.pageRepo.create({
        slug: `provider-${input.slug}`,
        title: input.name,
        content: toInputJsonValue(content),
        textContent,
        type: 'PROVIDER',
        providerId: provider.id,
        icon: null,
        coverPhoto: null,
        parentId: null,
        tags: [],
        viewCount: 0,
      });
    }

    return this.mapToDTO(provider);
  }

  /**
   * Update provider
   */
  async updateProvider(
    id: string,
    input: UpdateProviderInput
  ): Promise<ProviderDTO> {
    // Use the repository method that handles JSON conversion
    const provider = await this.providerRepo.updateWithPageSync(id, input);

    // If wikiContent was updated, sync with page
    if (input.wikiContent) {
      const page = await this.pageRepo.findByProviderId(id);

      if (page) {
        const content = wikiContentToTipTap(input.wikiContent);
        const textContent = tipTapToPlainText(content);

        await this.pageRepo.updateContent(
          page.id,
          toInputJsonValue(content),
          textContent
        );
      }
    }

    return this.mapToDTO(provider);
  }

  /**
   * Search providers
   */
  async searchProviders(query: string, limit = 20): Promise<ProviderDTO[]> {
    const providers = await this.providerRepo.search(query, limit);

    return providers.map((p) => this.mapToDTO(p));
  }

  /**
   * Get top providers
   */
  async getTopProviders(limit = 10): Promise<ProviderDTO[]> {
    const providers = await this.providerRepo.findTopProviders(limit);

    return providers.map((p) => this.mapToDTO(p));
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.providerRepo.incrementViewCount(id);

    // Also increment page view count if page exists
    const page = await this.pageRepo.findByProviderId(id);

    if (page) {
      await this.pageRepo.incrementViewCount(page.id);
    }
  }

  /**
   * Map Prisma model to DTO
   */
  private mapToDTO(provider: any): ProviderDTO {
    const wikiContent = parseWikiContent(provider.wikiContent);

    return {
      id: provider.id,
      slug: provider.slug,
      name: provider.name,
      credentials: provider.credentials,
      generalDifficulty: provider.generalDifficulty,
      wikiContent,
      noteTemplate: provider.noteTemplate,
      noteSmartPhrase: provider.noteSmartPhrase,
      preferences: provider.preferences,
      viewCount: provider.viewCount,
      searchClickCount: provider.searchClickCount,
      deletedAt: provider.deletedAt,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }
}
