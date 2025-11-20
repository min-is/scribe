import type { PrismaClient, Provider } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { toInputJsonValue } from '../utils/json-helpers';
import type { WikiContent } from '../utils/content-transformers';

export class ProviderRepository extends BaseRepository<Provider> {
  protected getModel() {
    return this.prisma.provider;
  }

  async findBySlug(slug: string): Promise<Provider | null> {
    const provider: Provider | null = await this.prisma.provider.findUnique({
      where: { slug },
    });

    return provider;
  }

  async findBySlugWithPage(slug: string): Promise<(Provider & { page: { id: string; slug: string } | null }) | null> {
    const provider = await this.prisma.provider.findUnique({
      where: { slug },
      include: {
        page: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });

    return provider;
  }

  async findAll(): Promise<Provider[]> {
    const providers: Provider[] = await this.prisma.provider.findMany({
      orderBy: { name: 'asc' },
    });

    return providers;
  }

  async search(query: string, limit = 10): Promise<Provider[]> {
    const providers: Provider[] = await this.prisma.provider.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { credentials: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });

    return providers;
  }

  async create(data: {
    slug: string;
    name: string;
    credentials?: string;
    generalDifficulty?: number;
    speedDifficulty?: number;
    terminologyDifficulty?: number;
    noteDifficulty?: number;
    noteTemplate?: string;
    noteSmartPhrase?: string;
    preferences?: Prisma.JsonValue;
    wikiContent?: WikiContent;
  }): Promise<Provider> {
    const provider: Provider = await this.prisma.provider.create({
      data: {
        slug: data.slug,
        name: data.name,
        credentials: data.credentials ?? null,
        generalDifficulty: data.generalDifficulty ?? null,
        speedDifficulty: data.speedDifficulty ?? null,
        terminologyDifficulty: data.terminologyDifficulty ?? null,
        noteDifficulty: data.noteDifficulty ?? null,
        noteTemplate: data.noteTemplate ?? null,
        noteSmartPhrase: data.noteSmartPhrase ?? null,
        preferences: data.preferences ? toInputJsonValue(data.preferences) : Prisma.JsonNull,
        wikiContent: data.wikiContent ? toInputJsonValue(data.wikiContent) : Prisma.JsonNull,
      },
    });

    return provider;
  }

  async update(
    id: string,
    data: {
      name?: string;
      credentials?: string;
      generalDifficulty?: number;
      speedDifficulty?: number;
      terminologyDifficulty?: number;
      noteDifficulty?: number;
      noteTemplate?: string;
      noteSmartPhrase?: string;
      preferences?: Prisma.JsonValue;
      wikiContent?: WikiContent;
    }
  ): Promise<Provider> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.credentials !== undefined) updateData.credentials = data.credentials ?? null;
    if (data.generalDifficulty !== undefined) updateData.generalDifficulty = data.generalDifficulty ?? null;
    if (data.speedDifficulty !== undefined) updateData.speedDifficulty = data.speedDifficulty ?? null;
    if (data.terminologyDifficulty !== undefined)
      updateData.terminologyDifficulty = data.terminologyDifficulty ?? null;
    if (data.noteDifficulty !== undefined) updateData.noteDifficulty = data.noteDifficulty ?? null;
    if (data.noteTemplate !== undefined) updateData.noteTemplate = data.noteTemplate ?? null;
    if (data.noteSmartPhrase !== undefined) updateData.noteSmartPhrase = data.noteSmartPhrase ?? null;
    if (data.preferences !== undefined) {
      updateData.preferences = data.preferences ? toInputJsonValue(data.preferences) : Prisma.JsonNull;
    }
    if (data.wikiContent !== undefined) {
      updateData.wikiContent = data.wikiContent ? toInputJsonValue(data.wikiContent) : Prisma.JsonNull;
    }

    const provider: Provider = await this.prisma.provider.update({
      where: { id },
      data: updateData,
    });

    return provider;
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.provider.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  async incrementSearchClickCount(id: string): Promise<void> {
    await this.prisma.provider.update({
      where: { id },
      data: { searchClickCount: { increment: 1 } },
    });
  }

  async findTopProviders(limit: number): Promise<Provider[]> {
    const providers: Provider[] = await this.prisma.provider.findMany({
      orderBy: { viewCount: 'desc' },
      take: limit,
    });

    return providers;
  }
}
