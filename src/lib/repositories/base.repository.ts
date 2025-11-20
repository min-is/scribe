import type { PrismaClient } from '@prisma/client';

/**
 * Base repository class providing common CRUD operations
 * Specific repositories can extend this for shared functionality
 */
export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Abstract method to get the Prisma model delegate
   * Must be implemented by concrete repositories
   */
  protected abstract getModel(): unknown;
}
