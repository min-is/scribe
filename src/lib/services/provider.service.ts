/**
 * Provider Service
 * Business logic for provider operations
 */

import { PrismaClient, Provider } from '@prisma/client';
import { ProviderRepository, PageRepository } from '../repositories';
import { ProviderDTO, ProviderProfileDTO, CreateProviderInput, UpdateProviderInput } from '../dtos';
import { PageService } from './page.service';
import { wikiContentToTipTap, tipTapToPlainText, legacyToWikiContent } from '../utils/content-transformers';
import { parseWikiContent } from '../utils/type-guards';
import { fromJsonValue } from '../utils/json-helpers';
import { WikiContent } from '@/provider/wiki-schema';

export class ProviderService {
  private repository: ProviderRepository;
  private pageService: PageService;

  constructor(prisma: PrismaClient) {
    this.repository = new ProviderRepository(prisma);
    this.pageService = new PageService(prisma);
  }

  /**
   * Convert Prisma Provider to ProviderDTO
   */
  private toDTO(provider: Provider): ProviderDTO {
    const wikiContent = parseWikiContent(provider.wikiContent);

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
      wikiContent,
      viewCount: provider.viewCount,
      searchClickCount: provider.searchClickCount,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }

  /**
   * Get a provider profile by slug with associated page
   */
  async getProviderProfile(slug: string): Promise<ProviderProfileDTO | null> {
    const providerWithPage = await this.repository.findBySlugWithPage(slug);

    if (!providerWithPage) return null;

    const dto: ProviderDTO = this.toDTO(providerWithPage);
    const pageDTO = providerWithPage.page ? await this.pageService.getPageById(providerWithPage.page.id) : null;

    return {
      ...dto,
      page: pageDTO,
    };
  }

  /**
   * Get a provider by ID
   */
  async getProvider(id: string): Promise<ProviderDTO | null> {
    const provider: Provider | null = await this.repository.findById(id);
    return provider ? this.toDTO(provider) : null;
  }

  /**
   * Get all providers
   */
  async getAllProviders(): Promise<ProviderDTO[]> {
    const providers: Provider[] = await this.repository.findMany();
    return providers.map((p) => this.toDTO(p));
  }

  /**
   * Search providers
   */
  async searchProviders(query: string): Promise<ProviderDTO[]> {
    const providers: Provider[] = await this.repository.search(query);
    return providers.map((p) => this.toDTO(p));
  }

  /**
   * Create a new provider
   */
  async createProvider(input: CreateProviderInput): Promise<ProviderDTO> {
    const provider: Provider = await this.repository.create(input);
    return this.toDTO(provider);
  }

  /**
   * Update a provider
   */
  async updateProvider(id: string, input: UpdateProviderInput): Promise<ProviderDTO> {
    const provider: Provider = await this.repository.update(id, input);

    // If wikiContent was updated and there's an associated page, sync it
    if (input.wikiContent) {
      const providerWithPage = await this.repository.findBySlugWithPage(provider.slug);
      if (providerWithPage?.page) {
        const content = wikiContentToTipTap(input.wikiContent);
        const textContent = tipTapToPlainText(content);

        await this.pageService.updatePageContent(providerWithPage.page.id, content);
      }
    }

    return this.toDTO(provider);
  }

  /**
   * Delete a provider
   */
  async deleteProvider(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.repository.incrementViewCount(id);
  }

  /**
   * Increment search click count
   */
  async incrementSearchClickCount(id: string): Promise<void> {
    await this.repository.incrementSearchClickCount(id);
  }

  /**
   * Get top providers
   */
  async getTopProviders(limit = 10): Promise<ProviderDTO[]> {
    const providers: Provider[] = await this.repository.findTopProviders(limit);
    return providers.map((p) => this.toDTO(p));
  }

  /**
   * Migrate legacy provider data to WikiContent
   */
  async migrateLegacyProvider(id: string): Promise<ProviderDTO> {
    const provider: Provider | null = await this.repository.findById(id);

    if (!provider) {
      throw new Error('Provider not found');
    }

    // If already has WikiContent, no migration needed
    if (provider.wikiContent) {
      return this.toDTO(provider);
    }

    // Create WikiContent from legacy fields
    const wikiContent: WikiContent = legacyToWikiContent(
      provider.noteTemplate,
      provider.noteSmartPhrase
    );

    // Update provider with WikiContent
    const updated: Provider = await this.repository.update(id, { wikiContent });

    return this.toDTO(updated);
  }
}
