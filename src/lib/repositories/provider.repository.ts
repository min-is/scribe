/**
 * Provider Repository
 * Data access layer for Provider model
 */

import { PrismaClient, Provider, Page } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { CreateProviderInput, UpdateProviderInput } from '../dtos';
import { toInputJsonValue } from '../utils/json-helpers';

type ProviderWithPage = Provider & { page: Page | null };

export class ProviderRepository extends BaseRepository<Provider> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Find a provider by ID
   */
  async findById(id: string): Promise<Provider | null> {
    const provider: Provider | null = await this.prisma.provider.findUnique({
      where: { id },
    });
    return provider;
  }

  /**
   * Find a provider by slug with associated page
   */
  async findBySlugWithPage(slug: string): Promise<ProviderWithPage | null> {
    const provider = await this.prisma.provider.findUnique({
      where: { slug },
      include: { page: true },
    });

    return provider;
  }

  /**
   * Find all providers
   */
  async findMany(): Promise<Provider[]> {
    const providers: Provider[] = await this.prisma.provider.findMany({
      orderBy: { name: 'asc' },
    });
    return providers;
  }

  /**
   * Find providers with their pages
   */
  async findManyWithPages(): Promise<ProviderWithPage[]> {
    const providers = await this.prisma.provider.findMany({
      include: { page: true },
      orderBy: { name: 'asc' },
    });
    return providers;
  }

  /**
   * Search providers by name
   */
  async search(query: string): Promise<Provider[]> {
    const providers: Provider[] = await this.prisma.provider.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    });
    return providers;
  }

  /**
   * Create a new provider
   */
  async create(input: CreateProviderInput): Promise<Provider> {
    const provider: Provider = await this.prisma.provider.create({
      data: {
        slug: input.slug,
        name: input.name,
        credentials: input.credentials || null,
        generalDifficulty: input.generalDifficulty || null,
        speedDifficulty: input.speedDifficulty || null,
        terminologyDifficulty: input.terminologyDifficulty || null,
        noteDifficulty: input.noteDifficulty || null,
        noteTemplate: input.noteTemplate || null,
        noteSmartPhrase: input.noteSmartPhrase || null,
        preferences: input.preferences ? toInputJsonValue(input.preferences) : null,
        wikiContent: input.wikiContent ? toInputJsonValue(input.wikiContent) : null,
      },
    });
    return provider;
  }

  /**
   * Update a provider
   */
  async update(id: string, input: UpdateProviderInput): Promise<Provider> {
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.credentials !== undefined) updateData.credentials = input.credentials;
    if (input.generalDifficulty !== undefined)
      updateData.generalDifficulty = input.generalDifficulty;
    if (input.speedDifficulty !== undefined) updateData.speedDifficulty = input.speedDifficulty;
    if (input.terminologyDifficulty !== undefined)
      updateData.terminologyDifficulty = input.terminologyDifficulty;
    if (input.noteDifficulty !== undefined) updateData.noteDifficulty = input.noteDifficulty;
    if (input.noteTemplate !== undefined) updateData.noteTemplate = input.noteTemplate;
    if (input.noteSmartPhrase !== undefined) updateData.noteSmartPhrase = input.noteSmartPhrase;
    if (input.preferences !== undefined)
      updateData.preferences = input.preferences ? toInputJsonValue(input.preferences) : null;
    if (input.wikiContent !== undefined)
      updateData.wikiContent = input.wikiContent ? toInputJsonValue(input.wikiContent) : null;

    const provider: Provider = await this.prisma.provider.update({
      where: { id },
      data: updateData,
    });
    return provider;
  }

  /**
   * Delete a provider
   */
  async delete(id: string): Promise<void> {
    await this.prisma.provider.delete({
      where: { id },
    });
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.provider.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  /**
   * Increment search click count
   */
  async incrementSearchClickCount(id: string): Promise<void> {
    await this.prisma.provider.update({
      where: { id },
      data: { searchClickCount: { increment: 1 } },
    });
  }

  /**
   * Find top providers by view count
   */
  async findTopProviders(limit = 10): Promise<Provider[]> {
    const providers: Provider[] = await this.prisma.provider.findMany({
      orderBy: { viewCount: 'desc' },
      take: limit,
    });
    return providers;
  }
}
