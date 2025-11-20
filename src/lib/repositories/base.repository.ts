import { PrismaClient } from '@prisma/client';

/**
 * Base Repository Pattern
 *
 * Provides common CRUD operations for all repositories.
 * Encapsulates Prisma queries to:
 * - Improve testability (easy to mock)
 * - Centralize database logic
 * - Provide type-safe abstractions
 */
export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get the Prisma delegate for the model
   * Must be implemented by subclasses
   */
  protected abstract getDelegate(): any;

  /**
   * Find a record by ID
   */
  async findById(id: string): Promise<T | null> {
    const delegate = this.getDelegate();
    return await delegate.findUnique({
      where: { id },
    });
  }

  /**
   * Find a record by slug
   */
  async findBySlug(slug: string): Promise<T | null> {
    const delegate = this.getDelegate();
    return await delegate.findUnique({
      where: { slug },
    });
  }

  /**
   * Find all records
   */
  async findMany(filter?: any): Promise<T[]> {
    const delegate = this.getDelegate();
    return await delegate.findMany(filter);
  }

  /**
   * Create a new record
   */
  async create(data: any): Promise<T> {
    const delegate = this.getDelegate();
    return await delegate.create({
      data,
    });
  }

  /**
   * Update a record
   */
  async update(id: string, data: any): Promise<T> {
    const delegate = this.getDelegate();
    return await delegate.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<void> {
    const delegate = this.getDelegate();
    await delegate.delete({
      where: { id },
    });
  }

  /**
   * Count records
   */
  async count(filter?: any): Promise<number> {
    const delegate = this.getDelegate();
    return await delegate.count(filter);
  }
}
