/**
 * Provider Service
 *
 * Business logic layer for Provider operations.
 */

import { PrismaClient, Provider, PageType } from '@prisma/client';
import { ProviderRepository, ProviderWithPage } from '../repositories/provider.repository';
import { PageService } from './page.service';
import {
  ProviderDTO,
  ProviderProfileDTO,
  CreateProviderInput,
  UpdateProviderInput,
} from '../dtos/provider.dto';
import { WikiContent } from '@/provider/wiki-schema';
import {
  wikiContentToTipTap,
  tipTapToPlainText,
  legacyToWikiContent,
} from '../utils/content-transformers';
import { parseWikiContent } from '../utils/type-guards';
import { toInputJsonValue } from '../utils/json-helpers';
import { Prisma } from '@prisma/client';

export class ProviderService {
  private repository: ProviderRepository;
  private pageService: PageService;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.repository = new ProviderRepository(prisma);
    this.pageService = new PageService(prisma);
  }

  /**
   * Get provider profile by slug
   */
  async getProviderProfile(slug: string): Promise<ProviderProfileDTO | null> {
    const provider = await this.repository.findBySlugWithPage(slug);
    if (!provider) return null;

    return this.toProfileDTO(provider);
  }

  /**
   * Get provider by slug
   */
  async getProviderBySlug(slug: string): Promise<ProviderDTO | null> {
    const provider = await this.repository.findBySlug(slug);
    return provider ? this.toDTO(provider) : null;
  }

  /**
   * Create a new provider with associated page
   */
  async createProvider(input: CreateProviderInput): Promise<ProviderProfileDTO> {
    // Prepare WikiContent
    const wikiContent = input.wikiContent
      ? input.wikiContent
      : legacyToWikiContent(input.noteTemplate, input.noteSmartPhrase);

    // Prepare page content
    const pageContent = wikiContent
      ? wikiContentToTipTap(wikiContent)
      : { type: 'doc' as const, content: [{ type: 'paragraph' as const, content: [] }] };

    const textContent = tipTapToPlainText(pageContent);

    const provider = await this.repository.createWithPage(
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
        preferences: input.preferences ? toInputJsonValue(input.preferences) : Prisma.JsonNull,
        wikiContent: wikiContent ? toInputJsonValue(wikiContent) : Prisma.JsonNull,
      },
      {
        slug: `provider-${input.slug}`,
        title: input.name,
        content: pageContent as Prisma.InputJsonValue,
        textContent,
        type: PageType.PROVIDER,
        icon: '👨‍⚕️',
        tags: [],
      }
    );

    return this.toProfileDTO(provider);
  }

  /**
   * Update provider
   */
  async updateProvider(
    id: string,
    input: UpdateProviderInput
  ): Promise<ProviderDTO> {
    const provider = await this.repository.updateProvider(id, {
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
    });

    // Update associated page if WikiContent changed
    if (input.wikiContent && provider.page) {
      const pageContent = wikiContentToTipTap(input.wikiContent);
      const textContent = tipTapToPlainText(pageContent);

      await this.pageService.updatePageContent(provider.page.id, pageContent);
    }

    return this.toDTO(provider);
  }

  /**
   * Search providers
   */
  async searchProviders(query: string): Promise<ProviderDTO[]> {
    const providers = await this.repository.search(query);
    return providers.map((p) => this.toDTO(p));
  }

  /**
   * Get top providers
   */
  async getTopProviders(limit: number): Promise<ProviderDTO[]> {
    const providers = await this.repository.findTopProviders(limit);
    return providers.map((p) => this.toDTO(p));
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
   * Convert Provider model to DTO
   */
  private toDTO(provider: Provider): ProviderDTO {
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

  /**
   * Convert ProviderWithPage to ProfileDTO
   */
  private toProfileDTO(provider: ProviderWithPage): ProviderProfileDTO {
    return {
      ...this.toDTO(provider),
      page: provider.page ? this.pageService['toDTO'](provider.page) : null,
    };
  }
}
