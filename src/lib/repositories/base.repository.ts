/**
 * Base Repository
 *
 * Abstract base class providing common CRUD operations for all repositories.
 */

import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get the Prisma model delegate for this repository
   */
  protected abstract getModel(): any;

  /**
   * Find a record by ID
   */
  async findById(id: string): Promise<T | null> {
    const model = this.getModel();
    return await model.findUnique({ where: { id } });
  }

  /**
   * Find all records
   */
  async findAll(): Promise<T[]> {
    const model = this.getModel();
    return await model.findMany();
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<void> {
    const model = this.getModel();
    await model.delete({ where: { id } });
  }
}
