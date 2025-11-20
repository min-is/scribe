/**
 * Provider Service
 *
 * Business logic layer for Provider operations.
 * Handles provider-specific logic and coordinates with PageService.
 */

import { PrismaClient } from '@prisma/client';
import { ProviderRepository } from '../repositories';
import { ProviderDTO, ProviderProfileDTO, CreateProviderInput, UpdateProviderInput } from '../dtos';
import { WikiContent } from '@/provider/wiki-schema';
import { parseWikiContent } from '../utils/type-guards';

export class ProviderService {
  private providerRepo: ProviderRepository;

  constructor(prisma: PrismaClient) {
    this.providerRepo = new ProviderRepository(prisma);
  }

  /**
   * Get provider profile by slug (with page)
   */
  async getProviderProfile(slug: string): Promise<ProviderProfileDTO | null> {
    const provider = await this.providerRepo.findBySlugWithPage(slug);
    if (!provider) return null;

    return this.toProfileDTO(provider);
  }

  /**
   * Get provider by ID
   */
  async getProviderById(id: string): Promise<ProviderDTO | null> {
    const provider = await this.providerRepo.findById(id);
    if (!provider) return null;

    return this.toDTO(provider);
  }

  /**
   * Get all providers
   */
  async getAllProviders(): Promise<ProviderDTO[]> {
    const providers = await this.providerRepo.findMany();
    return providers.map((provider) => this.toDTO(provider));
  }

  /**
   * Create a new provider (with page)
   */
  async createProvider(input: CreateProviderInput): Promise<ProviderDTO> {
    const provider = await this.providerRepo.create(input);
    return this.toDTO(provider);
  }

  /**
   * Update a provider (with page sync)
   */
  async updateProvider(id: string, input: UpdateProviderInput): Promise<ProviderProfileDTO> {
    const provider = await this.providerRepo.updateWithPageSync(id, input);
    return this.toProfileDTO(provider);
  }

  /**
   * Delete a provider
   */
  async deleteProvider(id: string): Promise<void> {
    await this.providerRepo.delete(id);
  }

  /**
   * Search providers by name
   */
  async searchProviders(query: string): Promise<ProviderDTO[]> {
    const providers = await this.providerRepo.search(query);
    return providers.map((provider) => this.toDTO(provider));
  }

  /**
   * Get top providers by view count
   */
  async getTopProviders(limit = 10): Promise<ProviderDTO[]> {
    const providers = await this.providerRepo.findTopProviders(limit);
    return providers.map((provider) => this.toDTO(provider));
  }

  /**
   * Increment provider view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.providerRepo.incrementViewCount(id);
  }

  /**
   * Convert Prisma Provider to DTO
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
      preferences: provider.preferences,
      wikiContent: parseWikiContent(provider.wikiContent),
      viewCount: provider.viewCount,
      searchClickCount: provider.searchClickCount,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }

  /**
   * Convert Prisma Provider with Page to ProfileDTO
   */
  private toProfileDTO(provider: any): ProviderProfileDTO {
    return {
      ...this.toDTO(provider),
      page: provider.page
        ? {
            id: provider.page.id,
            slug: provider.page.slug,
            title: provider.page.title,
            content: provider.page.content,
            textContent: provider.page.textContent,
            type: provider.page.type,
            parentId: provider.page.parentId,
            position: provider.page.position,
            icon: provider.page.icon,
            coverPhoto: provider.page.coverPhoto,
            category: provider.page.category,
            tags: provider.page.tags,
            deletedAt: provider.page.deletedAt,
            viewCount: provider.page.viewCount,
            createdAt: provider.page.createdAt,
            updatedAt: provider.page.updatedAt,
            createdBy: provider.page.createdBy,
            updatedBy: provider.page.updatedBy,
          }
        : null,
    };
  }
}
