/**
 * Provider Service
 *
 * Business logic layer for Provider operations.
 * Handles provider-specific logic and coordinates with PageService.
 */

import { ProviderRepository } from '../repositories/provider.repository';
import { PageRepository } from '../repositories/page.repository';
import { ContentTransformers } from '../content-transformers';
import { parseWikiContent } from '../type-guards';
import {
  ProviderDTO,
  ProviderWithPageDTO,
  ProviderProfileDTO,
  CreateProviderInput,
  UpdateProviderInput,
} from '../dtos/provider.dto';
import { Provider, PageType } from '@prisma/client';
import { WikiContent } from '@/provider/wiki-schema';
import { generateJitteredKeyBetween } from 'fractional-indexing-jittered';

export class ProviderService {
  private providerRepository: ProviderRepository;
  private pageRepository: PageRepository;

  constructor() {
    this.providerRepository = new ProviderRepository();
    this.pageRepository = new PageRepository();
  }

  /**
   * Get provider by slug
   */
  async getProviderBySlug(slug: string): Promise<ProviderDTO | null> {
    const provider = await this.providerRepository.findBySlug(slug);
    return provider ? this.mapToDTO(provider) : null;
  }

  /**
   * Get provider profile with page content
   */
  async getProviderProfile(slug: string): Promise<ProviderProfileDTO | null> {
    const provider = await this.providerRepository.findBySlugWithPage(slug);
    if (!provider) return null;

    // Get content from Page if available, otherwise from provider fields
    let content;
    if (provider.page) {
      content = provider.page.content as any;
    } else {
      // Fallback to provider wikiContent or legacy fields
      const wikiContent = parseWikiContent(provider.wikiContent);
      if (wikiContent) {
        content = ContentTransformers.wikiContentToTipTap(wikiContent);
      } else {
        content = ContentTransformers.legacyToWikiContent(
          provider.noteTemplate,
          provider.noteSmartPhrase,
          provider.preferences
        );
      }
    }

    return {
      id: provider.id,
      slug: provider.slug,
      name: provider.name,
      credentials: provider.credentials,
      generalDifficulty: provider.generalDifficulty,
      speedDifficulty: provider.speedDifficulty,
      terminologyDifficulty: provider.terminologyDifficulty,
      noteDifficulty: provider.noteDifficulty,
      content,
      viewCount: provider.viewCount,
    };
  }

  /**
   * Get all providers
   */
  async getAllProviders(orderBy: 'name' | 'viewCount' | 'searchClickCount' = 'name'): Promise<ProviderDTO[]> {
    const providers = await this.providerRepository.findAll(orderBy);
    return providers.map(this.mapToDTO);
  }

  /**
   * Get top providers
   */
  async getTopProviders(limit: number = 10): Promise<ProviderDTO[]> {
    const providers = await this.providerRepository.findTopProviders(limit);
    return providers.map(this.mapToDTO);
  }

  /**
   * Search providers
   */
  async searchProviders(query: string): Promise<ProviderDTO[]> {
    const providers = await this.providerRepository.search(query);
    return providers.map(this.mapToDTO);
  }

  /**
   * Create a new provider
   */
  async createProvider(input: CreateProviderInput): Promise<ProviderDTO> {
    // Create provider
    const provider = await this.providerRepository.create({
      slug: input.slug,
      name: input.name,
      credentials: input.credentials,
      generalDifficulty: input.generalDifficulty,
      speedDifficulty: input.speedDifficulty,
      terminologyDifficulty: input.terminologyDifficulty,
      noteDifficulty: input.noteDifficulty,
      noteTemplate: input.noteTemplate,
      noteSmartPhrase: input.noteSmartPhrase,
    });

    // Create associated page
    const content = ContentTransformers.legacyToWikiContent(
      input.noteTemplate,
      input.noteSmartPhrase
    );
    const textContent = ContentTransformers.tipTapToPlainText(content);
    const title = input.credentials
      ? `${input.name}, ${input.credentials}`
      : input.name;

    await this.pageRepository.create({
      slug: input.slug,
      title,
      content,
      textContent: textContent || title,
      type: PageType.PROVIDER,
      icon: '👨‍⚕️',
      providerId: provider.id,
      position: generateJitteredKeyBetween(null, null),
    });

    return this.mapToDTO(provider);
  }

  /**
   * Update provider and sync with page
   */
  async updateProvider(id: string, input: UpdateProviderInput): Promise<ProviderDTO> {
    const updateData: any = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.credentials !== undefined) updateData.credentials = input.credentials;
    if (input.generalDifficulty !== undefined) updateData.generalDifficulty = input.generalDifficulty;
    if (input.speedDifficulty !== undefined) updateData.speedDifficulty = input.speedDifficulty;
    if (input.terminologyDifficulty !== undefined) updateData.terminologyDifficulty = input.terminologyDifficulty;
    if (input.noteDifficulty !== undefined) updateData.noteDifficulty = input.noteDifficulty;
    if (input.wikiContent !== undefined) updateData.wikiContent = input.wikiContent;

    // If wikiContent is being updated, sync to page
    let pageContent, pageTextContent;
    if (input.wikiContent) {
      pageContent = ContentTransformers.wikiContentToTipTap(input.wikiContent);
      pageTextContent = ContentTransformers.tipTapToPlainText(pageContent);
    }

    const provider = await this.providerRepository.updateWithPageSync(
      id,
      updateData,
      pageContent,
      pageTextContent
    );

    return this.mapToDTO(provider);
  }

  /**
   * Increment provider view count
   */
  async incrementViewCount(slug: string): Promise<void> {
    const provider = await this.providerRepository.findBySlug(slug);
    if (!provider) return;

    await this.providerRepository.incrementViewCount(provider.id);

    // Also increment page view count if exists
    const page = await this.pageRepository.findByProviderId(provider.id);
    if (page) {
      await this.pageRepository.incrementViewCount(page.id);
    }
  }

  /**
   * Increment search click count
   */
  async incrementSearchClickCount(slug: string): Promise<void> {
    const provider = await this.providerRepository.findBySlug(slug);
    if (provider) {
      await this.providerRepository.incrementSearchClickCount(provider.id);
    }
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
      viewCount: provider.viewCount,
      searchClickCount: provider.searchClickCount,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }
}
