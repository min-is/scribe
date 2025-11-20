/**
 * Base Repository
 *
 * Abstract base class for repositories, providing common database operations.
 * This encapsulates Prisma queries and provides a consistent interface for
 * data access across different models.
 */

import { prisma } from '@/lib/prisma';

export type PrismaDelegate<T> = {
  findUnique: (args: any) => Promise<T | null>;
  findMany: (args?: any) => Promise<T[]>;
  create: (args: any) => Promise<T>;
  update: (args: any) => Promise<T>;
  delete: (args: any) => Promise<T>;
  count: (args?: any) => Promise<number>;
};

/**
 * Base repository providing common CRUD operations
 */
export abstract class BaseRepository<T> {
  protected prisma = prisma;

  /**
   * Get the Prisma delegate for this model
   * Must be implemented by subclasses
   */
  protected abstract getDelegate(): PrismaDelegate<T>;

  /**
   * Find a record by ID
   */
  async findById(id: string): Promise<T | null> {
    return this.getDelegate().findUnique({
      where: { id },
    });
  }

  /**
   * Find all records matching the filter
   */
  async findMany(args?: any): Promise<T[]> {
    return this.getDelegate().findMany(args);
  }

  /**
   * Count records matching the filter
   */
  async count(args?: any): Promise<number> {
    return this.getDelegate().count(args);
  }

  /**
   * Create a new record
   */
  async create(data: any): Promise<T> {
    return this.getDelegate().create({
      data,
    });
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: any): Promise<T> {
    return this.getDelegate().update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<T> {
    return this.getDelegate().delete({
      where: { id },
    });
  }
}
