/**
 * Base Repository
 *
 * Abstract base class providing common CRUD operations
 */

import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Abstract method to get the Prisma model delegate
   * Must be implemented by child classes
   */
  protected abstract getModel(): any;

  /**
   * Find a single record by ID
   */
  async findById(id: string): Promise<T | null> {
    const model = this.getModel();
    return (await model.findUnique({
      where: { id },
    })) as T | null;
  }

  /**
   * Find all records matching a filter
   */
  async findMany(filter?: any): Promise<T[]> {
    const model = this.getModel();
    return (await model.findMany(filter)) as T[];
  }

  /**
   * Create a new record
   */
  async create(data: any): Promise<T> {
    const model = this.getModel();
    return (await model.create({ data })) as T;
  }

  /**
   * Update an existing record
   */
  async update(id: string, data: any): Promise<T> {
    const model = this.getModel();
    return (await model.update({
      where: { id },
      data,
    })) as T;
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<void> {
    const model = this.getModel();
    await model.delete({
      where: { id },
    });
  }

  /**
   * Soft delete a record (if deletedAt field exists)
   */
  async softDelete(id: string): Promise<T> {
    const model = this.getModel();
    return (await model.update({
      where: { id },
      data: { deletedAt: new Date() },
    })) as T;
  }

  /**
   * Count records matching a filter
   */
  async count(filter?: any): Promise<number> {
    const model = this.getModel();
    return await model.count(filter);
  }
}
