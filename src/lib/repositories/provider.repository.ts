/**
 * Provider Repository
 *
 * Data access layer for Provider model.
 * Encapsulates all Prisma queries for Providers.
 */

import type { PrismaClient, Provider, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { toInputJsonValue } from '../utils/json-helpers';

export class ProviderRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findBySlug(slug: string): Promise<Provider | null> {
    return this.prisma.provider.findUnique({
      where: { slug },
    });
  }

  async findBySlugWithPage(slug: string): Promise<
    | (Provider & {
        page: {
          id: string;
          slug: string;
          title: string;
          content: any;
          textContent: string | null;
          type: string;
          icon: string | null;
          coverPhoto: string | null;
          viewCount: number;
          deletedAt: Date | null;
          createdAt: Date;
          updatedAt: Date;
        } | null;
      })
    | null
  > {
    return this.prisma.provider.findUnique({
      where: { slug },
      include: { page: true },
    });
  }

  async create(data: {
    slug: string;
    name: string;
    credentials?: string;
    generalDifficulty?: number;
    noteTemplate?: string;
    wikiContent?: any;
    preferences?: any;
  }): Promise<Provider> {
    return this.prisma.provider.create({
      data: {
        slug: data.slug,
        name: data.name,
        credentials: data.credentials ?? undefined,
        generalDifficulty: data.generalDifficulty ?? undefined,
        noteTemplate: data.noteTemplate ?? undefined,
        wikiContent: data.wikiContent ? toInputJsonValue(data.wikiContent) : Prisma.JsonNull,
        preferences: data.preferences ? toInputJsonValue(data.preferences) : Prisma.JsonNull,
      },
    });
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
      preferences?: any;
      wikiContent?: any;
    }
  ): Promise<Provider> {
    return this.prisma.provider.update({
      where: { id },
      data: {
        name: data.name,
        credentials: data.credentials,
        generalDifficulty: data.generalDifficulty,
        speedDifficulty: data.speedDifficulty,
        terminologyDifficulty: data.terminologyDifficulty,
        noteDifficulty: data.noteDifficulty,
        noteTemplate: data.noteTemplate,
        noteSmartPhrase: data.noteSmartPhrase,
        preferences: data.preferences !== undefined
          ? (data.preferences ? toInputJsonValue(data.preferences) : Prisma.JsonNull)
          : undefined,
        wikiContent: data.wikiContent !== undefined
          ? (data.wikiContent ? toInputJsonValue(data.wikiContent) : Prisma.JsonNull)
          : undefined,
        updatedAt: new Date(),
      },
    });
  }

  async findTopProviders(limit = 10): Promise<Provider[]> {
    return this.prisma.provider.findMany({
      orderBy: { viewCount: 'desc' },
      take: limit,
    });
  }

  async search(query: string): Promise<Provider[]> {
    return this.prisma.provider.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    });
  }
}
