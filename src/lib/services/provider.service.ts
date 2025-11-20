import type { PrismaClient, Provider } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { ProviderRepository } from '../repositories/provider.repository';
import { PageRepository } from '../repositories/page.repository';
import { wikiContentToTipTap, tipTapToPlainText, legacyToWikiContent } from '../utils/content-transformers';
import type { WikiContent } from '../utils/content-transformers';
import { parseWikiContent } from '../utils/type-guards';
import { fromJsonValue } from '../utils/json-helpers';
import type {
  ProviderDTO,
  ProviderProfileDTO,
  CreateProviderInput,
  UpdateProviderInput,
} from '../dtos/provider.dto';

export class ProviderService {
  private providerRepo: ProviderRepository;
  private pageRepo: PageRepository;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.providerRepo = new ProviderRepository(prisma);
    this.pageRepo = new PageRepository(prisma);
  }

  private mapToDTO(provider: Provider): ProviderDTO {
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

  private mapToProfileDTO(
    provider: Provider & { page: { id: string; slug: string } | null }
  ): ProviderProfileDTO {
    const dto = this.mapToDTO(provider);

    return {
      ...dto,
      pageId: provider.page?.id ?? null,
      pageSlug: provider.page?.slug ?? null,
    };
  }

  async getProviderBySlug(slug: string): Promise<ProviderDTO | null> {
    const provider: Provider | null = await this.providerRepo.findBySlug(slug);
    if (!provider) return null;

    return this.mapToDTO(provider);
  }

  async getProviderProfile(slug: string): Promise<ProviderProfileDTO | null> {
    const provider = await this.providerRepo.findBySlugWithPage(slug);
    if (!provider) return null;

    return this.mapToProfileDTO(provider);
  }

  async getAllProviders(): Promise<ProviderDTO[]> {
    const providers: Provider[] = await this.providerRepo.findAll();
    return providers.map((p) => this.mapToDTO(p));
  }

  async searchProviders(query: string, limit = 10): Promise<ProviderDTO[]> {
    const providers: Provider[] = await this.providerRepo.search(query, limit);
    return providers.map((p) => this.mapToDTO(p));
  }

  async createProvider(input: CreateProviderInput): Promise<ProviderDTO> {
    const provider: Provider = await this.providerRepo.create(input);
    return this.mapToDTO(provider);
  }

  async updateProvider(id: string, input: UpdateProviderInput): Promise<ProviderDTO> {
    const provider: Provider = await this.providerRepo.update(id, input);
    return this.mapToDTO(provider);
  }

  async updateProviderWithPageSync(id: string, input: UpdateProviderInput): Promise<ProviderDTO> {
    const provider: Provider = await this.prisma.$transaction(async (tx) => {
      const updatedProvider: Provider = await tx.provider.update({
        where: { id },
        data: {
          name: input.name,
          credentials: input.credentials ?? undefined,
          generalDifficulty: input.generalDifficulty ?? undefined,
          speedDifficulty: input.speedDifficulty ?? undefined,
          terminologyDifficulty: input.terminologyDifficulty ?? undefined,
          noteDifficulty: input.noteDifficulty ?? undefined,
          noteTemplate: input.noteTemplate ?? undefined,
          noteSmartPhrase: input.noteSmartPhrase ?? undefined,
          preferences: input.preferences ?? undefined,
          wikiContent: input.wikiContent ?? undefined,
        },
        include: {
          page: true,
        },
      });

      if (updatedProvider.page && input.wikiContent) {
        const content = wikiContentToTipTap(input.wikiContent);
        const textContent = tipTapToPlainText(content);

        await tx.page.update({
          where: { id: updatedProvider.page.id },
          data: {
            content: content as Prisma.InputJsonValue,
            textContent,
          },
        });
      }

      return updatedProvider;
    });

    return this.mapToDTO(provider);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.providerRepo.incrementViewCount(id);
  }

  async incrementSearchClickCount(id: string): Promise<void> {
    await this.providerRepo.incrementSearchClickCount(id);
  }

  async getTopProviders(limit: number): Promise<ProviderDTO[]> {
    const providers: Provider[] = await this.providerRepo.findTopProviders(limit);
    return providers.map((p) => this.mapToDTO(p));
  }

  async getProviderContentForPage(provider: Provider): Promise<{
    content: Prisma.InputJsonValue;
    textContent: string;
  }> {
    const wikiContent = parseWikiContent(provider.wikiContent);

    let content;
    if (wikiContent) {
      content = wikiContentToTipTap(wikiContent);
    } else {
      const legacyContent = legacyToWikiContent(provider.noteTemplate, provider.noteSmartPhrase);
      if (legacyContent) {
        content = wikiContentToTipTap(legacyContent);
      } else {
        content = {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Provider information will be added here.' }],
            },
          ],
        };
      }
    }

    const textContent = tipTapToPlainText(content);

    return {
      content: content as Prisma.InputJsonValue,
      textContent,
    };
  }
}
