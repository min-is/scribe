/**
 * Provider Service
 *
 * Business logic for Provider operations.
 * Handles Provider ↔ Page synchronization and WikiContent transformations.
 */

import type { PrismaClient, Prisma } from '@prisma/client';
import type { WikiContent } from '@/provider/wiki-schema';
import { ProviderRepository } from '../repositories/provider.repository';
import { PageRepository } from '../repositories/page.repository';
import { parseWikiContent } from '../utils/type-guards';
import { wikiContentToTipTap, legacyToWikiContent } from '../utils/content-transformers';
import { toInputJsonValue } from '../utils/json-helpers';
import type {
  ProviderDTO,
  ProviderProfileDTO,
  CreateProviderInput,
  UpdateProviderInput,
} from '../dtos/provider.dto';
import type { PageDTO } from '../dtos/page.dto';

export class ProviderService {
  private providerRepo: ProviderRepository;
  private pageRepo: PageRepository;

  constructor(prisma: PrismaClient) {
    this.providerRepo = new ProviderRepository(prisma);
    this.pageRepo = new PageRepository(prisma);
  }

  /**
   * Get provider profile with page data.
   */
  async getProviderProfile(slug: string): Promise<ProviderProfileDTO | null> {
    const provider = await this.providerRepo.findBySlugWithPage(slug);
    if (!provider) return null;

    // Parse WikiContent if present
    const wikiContent = parseWikiContent(provider.wikiContent);

    return {
      id: provider.id,
      slug: provider.slug,
      name: provider.name,
      credentials: provider.credentials,
      wikiContent,
      noteTemplate: provider.noteTemplate,
      noteSmartPhrase: provider.noteSmartPhrase,
      page: provider.page ? this.pageToDTO(provider.page) : null,
      viewCount: provider.viewCount,
    };
  }

  /**
   * Create a new provider with associated page.
   */
  async createProvider(input: CreateProviderInput): Promise<ProviderDTO> {
    const provider = await this.providerRepo.create({
      slug: input.slug,
      name: input.name,
      credentials: input.credentials,
      generalDifficulty: input.generalDifficulty,
      noteTemplate: input.noteTemplate,
      wikiContent: input.wikiContent,
      preferences: input.preferences,
    });

    // Create associated page
    const content = input.wikiContent
      ? wikiContentToTipTap(input.wikiContent)
      : { type: 'doc', content: [{ type: 'paragraph', content: [] }] };

    await this.pageRepo.create({
      slug: `provider-${input.slug}`,
      title: input.name,
      content,
      type: 'PROVIDER',
      providerId: provider.id,
    });

    return this.toDTO(provider);
  }

  /**
   * Update provider and sync with page.
   */
  async updateProvider(id: string, input: UpdateProviderInput): Promise<ProviderDTO> {
    // Update provider with proper type conversion
    const provider = await this.providerRepo.update(id, {
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

    // If WikiContent was updated, sync with page
    if (input.wikiContent) {
      const page = await this.pageRepo.findBySlug(`provider-${provider.slug}`);
      if (page) {
        const content = wikiContentToTipTap(input.wikiContent);
        await this.pageRepo.updateContent(page.id, content);
      }
    }

    return this.toDTO(provider);
  }

  /**
   * Search providers.
   */
  async searchProviders(query: string): Promise<ProviderDTO[]> {
    const providers = await this.providerRepo.search(query);
    return providers.map((p) => this.toDTO(p));
  }

  /**
   * Convert Prisma Provider model to ProviderDTO.
   */
  private toDTO(provider: any): ProviderDTO {
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
      preferences: provider.preferences as Record<string, unknown> | null,
      wikiContent: parseWikiContent(provider.wikiContent),
      page: provider.page ? this.pageToDTO(provider.page) : null,
      viewCount: provider.viewCount,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }

  /**
   * Convert Prisma Page model to PageDTO.
   */
  private pageToDTO(page: any): PageDTO {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      content: page.content,
      textContent: page.textContent,
      type: page.type,
      icon: page.icon,
      coverPhoto: page.coverPhoto,
      viewCount: page.viewCount,
      deletedAt: page.deletedAt,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }
}
