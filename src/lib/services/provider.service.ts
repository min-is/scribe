import { PrismaClient, Provider, PageType } from '@prisma/client';
import { JSONContent } from '@tiptap/core';
import { ProviderRepository } from '../repositories/provider.repository';
import { PageService } from './page.service';
import { ContentTransformers } from '../content-transformers';
import { parseWikiContent } from '../type-guards';
import type {
  ProviderDTO,
  ProviderProfileDTO,
  CreateProviderInput,
  UpdateProviderInput,
  WikiContent,
} from '../dtos';

/**
 * Provider Service
 *
 * Business logic for Provider operations.
 * Coordinates between Provider and Page models.
 */
export class ProviderService {
  private providerRepo: ProviderRepository;
  private pageService: PageService;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.providerRepo = new ProviderRepository(prisma);
    this.pageService = new PageService(prisma);
  }

  /**
   * Get provider profile with page
   */
  async getProviderProfile(slug: string): Promise<ProviderProfileDTO | null> {
    const provider = await this.providerRepo.findBySlugWithPage(slug);

    if (!provider) {
      return null;
    }

    // Extract content from wikiContent or page
    let content: JSONContent | undefined;

    if (provider.wikiContent) {
      const wikiContent = parseWikiContent(provider.wikiContent);
      if (wikiContent) {
        content = ContentTransformers.wikiContentToTipTap(wikiContent);
      }
    } else if (provider.page) {
      content = provider.page.content as JSONContent;
    } else if (provider.noteTemplate) {
      // Fallback to legacy fields
      const legacyWiki = ContentTransformers.legacyToWikiContent(
        provider.noteTemplate,
        provider.noteSmartPhrase
      );
      if (legacyWiki) {
        content = ContentTransformers.wikiContentToTipTap(legacyWiki);
      }
    }

    return {
      ...this.mapToDTO(provider),
      page: provider.page
        ? (this.pageService as any).mapToDTO(provider.page)
        : null,
      content,
    };
  }

  /**
   * Get provider by slug
   */
  async getProviderBySlug(slug: string): Promise<ProviderDTO | null> {
    const provider = await this.providerRepo.findBySlug(slug);

    if (!provider) {
      return null;
    }

    return this.mapToDTO(provider);
  }

  /**
   * Create provider with page
   */
  async createProvider(input: CreateProviderInput): Promise<ProviderDTO> {
    // Create content from wikiContent if provided
    const content = input.wikiContent
      ? ContentTransformers.wikiContentToTipTap(input.wikiContent)
      : ContentTransformers.createPlaceholderDocument(
          'Provider information will be added here.'
        );

    const textContent = ContentTransformers.tipTapToPlainText(content);

    const provider = await this.providerRepo.createWithPage(
      {
        slug: input.slug,
        name: input.name,
        credentials: input.credentials,
        generalDifficulty: input.generalDifficulty,
        speedDifficulty: input.speedDifficulty,
        terminologyDifficulty: input.terminologyDifficulty,
        noteDifficulty: input.noteDifficulty,
        noteTemplate: input.noteTemplate,
        noteSmartPhrase: input.noteSmartPhrase,
        preferences: input.preferences,
        wikiContent: input.wikiContent,
      },
      {
        slug: `provider-${input.slug}`,
        title: input.name,
        content,
        textContent,
        type: PageType.PROVIDER,
        tags: [],
      }
    );

    return this.mapToDTO(provider);
  }

  /**
   * Update provider
   * Automatically syncs changes to associated page
   */
  async updateProvider(
    id: string,
    input: UpdateProviderInput
  ): Promise<ProviderDTO> {
    // Prepare provider update
    const providerData: any = {};

    if (input.name !== undefined) providerData.name = input.name;
    if (input.credentials !== undefined)
      providerData.credentials = input.credentials;
    if (input.generalDifficulty !== undefined)
      providerData.generalDifficulty = input.generalDifficulty;
    if (input.speedDifficulty !== undefined)
      providerData.speedDifficulty = input.speedDifficulty;
    if (input.terminologyDifficulty !== undefined)
      providerData.terminologyDifficulty = input.terminologyDifficulty;
    if (input.noteDifficulty !== undefined)
      providerData.noteDifficulty = input.noteDifficulty;
    if (input.noteTemplate !== undefined)
      providerData.noteTemplate = input.noteTemplate;
    if (input.noteSmartPhrase !== undefined)
      providerData.noteSmartPhrase = input.noteSmartPhrase;
    if (input.preferences !== undefined)
      providerData.preferences = input.preferences;
    if (input.wikiContent !== undefined)
      providerData.wikiContent = input.wikiContent;

    // Prepare page update if wikiContent or name changed
    let pageData: any = undefined;

    if (input.wikiContent) {
      const content =
        ContentTransformers.wikiContentToTipTap(input.wikiContent);
      const textContent = ContentTransformers.tipTapToPlainText(content);

      pageData = {
        content,
        textContent,
      };
    }

    if (input.name) {
      pageData = pageData || {};
      pageData.title = input.name;
    }

    const provider = await this.providerRepo.updateWithPageSync(
      id,
      providerData,
      pageData
    );

    return this.mapToDTO(provider);
  }

  /**
   * Update provider wiki content
   */
  async updateProviderWiki(
    id: string,
    wikiContent: WikiContent
  ): Promise<void> {
    const content = ContentTransformers.wikiContentToTipTap(wikiContent);
    const textContent = ContentTransformers.tipTapToPlainText(content);

    await this.providerRepo.updateWithPageSync(
      id,
      { wikiContent },
      { content, textContent }
    );
  }

  /**
   * Search providers
   */
  async searchProviders(
    query: string,
    limit = 20
  ): Promise<ProviderDTO[]> {
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
   * Get all providers
   */
  async getAllProviders(): Promise<ProviderDTO[]> {
    const providers = await this.providerRepo.findAll();

    return providers.map((p) => this.mapToDTO(p));
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.providerRepo.incrementViewCount(id);
  }

  /**
   * Map Prisma model to DTO
   */
  private mapToDTO(provider: Provider): ProviderDTO {
    return {
      id: provider.id,
      slug: provider.slug,
      name: provider.name,
      credentials: provider.credentials,
      generalDifficulty: provider.generalDifficulty,
      speedDifficulty: provider.speedDifficulty,
      terminologyDifficulty: provider.terminologyDifficulty,
      noteDifficulty: provider.noteDifficulty,
      noteTemplate: provider.noteTemplate,
      noteSmartPhrase: provider.noteSmartPhrase,
      preferences: provider.preferences,
      wikiContent: parseWikiContent(provider.wikiContent),
      viewCount: provider.viewCount,
      searchClickCount: provider.searchClickCount,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }
}
