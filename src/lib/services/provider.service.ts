/**
 * Provider Service
 *
 * Business logic layer for Provider operations.
 * Coordinates between Provider and Page data, handles WikiContent transformations.
 */

import { PrismaClient, Provider } from '@prisma/client';
import { ProviderRepository, ProviderWithPage } from '../repositories/provider.repository';
import { PageService } from './page.service';
import {
  ProviderDTO,
  ProviderProfileDTO,
  CreateProviderInput,
  UpdateProviderInput,
} from '../dtos/provider.dto';
import { parseWikiContent } from '../utils/type-guards';
import { wikiContentToTipTap, tipTapToPlainText, legacyToWikiContent } from '../utils/content-transformers';
import { WikiContent } from '@/provider/wiki-schema';
import { toInputJsonValue } from '../utils/json-helpers';

export class ProviderService {
  private providerRepo: ProviderRepository;
  private pageService: PageService;

  constructor(prisma: PrismaClient) {
    this.providerRepo = new ProviderRepository(prisma);
    this.pageService = new PageService(prisma);
  }

  /**
   * Get provider profile with page data
   */
  async getProviderProfile(slug: string): Promise<ProviderProfileDTO | null> {
    const provider: ProviderWithPage | null = await this.providerRepo.findBySlugWithPage(slug);
    if (!provider) return null;

    // Parse WikiContent
    const wikiContent = parseWikiContent(provider.wikiContent);

    // If no wikiContent but has legacy fields, create WikiContent from legacy
    const effectiveWikiContent =
      wikiContent ||
      (provider.noteTemplate || provider.noteSmartPhrase
        ? legacyToWikiContent(provider.noteTemplate, provider.noteSmartPhrase, provider.preferences)
        : null);

    return {
      id: provider.id,
      slug: provider.slug,
      name: provider.name,
      credentials: provider.credentials,
      generalDifficulty: provider.generalDifficulty,
      speedDifficulty: provider.speedDifficulty,
      terminologyDifficulty: provider.terminologyDifficulty,
      noteDifficulty: provider.noteDifficulty,
      viewCount: provider.viewCount,
      page: provider.page ? this.pageService['mapToDTO'](provider.page) : null,
      wikiContent: effectiveWikiContent,
      legacyNoteTemplate: provider.noteTemplate,
      legacySmartPhrase: provider.noteSmartPhrase,
    };
  }

  /**
   * Create a new provider with associated page
   */
  async createProvider(input: CreateProviderInput): Promise<ProviderDTO> {
    const provider: Provider = await this.providerRepo.create(input);

    // Create associated page if wikiContent is provided
    if (input.wikiContent) {
      const content = wikiContentToTipTap(input.wikiContent);
      const textContent = tipTapToPlainText(content);

      await this.pageService.createPage({
        slug: `provider-${provider.slug}`,
        title: provider.name,
        content,
        type: 'PROVIDER',
        providerId: provider.id,
        category: 'Provider',
      });
    }

    return this.mapToDTO(provider);
  }

  /**
   * Update provider
   */
  async updateProvider(id: string, input: UpdateProviderInput): Promise<ProviderDTO> {
    // If wikiContent is being updated, also update the associated page
    if (input.wikiContent) {
      const content = wikiContentToTipTap(input.wikiContent);
      const textContent = tipTapToPlainText(content);

      await this.providerRepo.updateWithPageSync(
        id,
        input,
        {
          content: toInputJsonValue(content),
          textContent,
        },
      );
    } else {
      await this.providerRepo.update(id, input);
    }

    const provider: Provider | null = await this.providerRepo.findById(id);
    if (!provider) {
      throw new Error('Provider not found after update');
    }

    return this.mapToDTO(provider);
  }

  /**
   * Search providers
   */
  async searchProviders(query: string, limit = 20): Promise<ProviderDTO[]> {
    const providers: Provider[] = await this.providerRepo.search(query, limit);
    return providers.map((provider) => this.mapToDTO(provider));
  }

  /**
   * Get top providers by view count
   */
  async getTopProviders(limit = 10): Promise<ProviderDTO[]> {
    const providers: Provider[] = await this.providerRepo.findTopProviders(limit);
    return providers.map((provider) => this.mapToDTO(provider));
  }

  /**
   * Track provider view
   */
  async trackProviderView(id: string): Promise<void> {
    await this.providerRepo.incrementViewCount(id);
  }

  /**
   * Track provider search click
   */
  async trackProviderSearchClick(id: string): Promise<void> {
    await this.providerRepo.incrementSearchClickCount(id);
  }

  /**
   * Map Provider model to DTO
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
