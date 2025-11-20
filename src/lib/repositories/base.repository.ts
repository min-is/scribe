/**
 * Base Repository
 *
 * Abstract base class providing common CRUD operations for all repositories.
 * Repositories encapsulate all database operations using Prisma.
 */

import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Find a record by ID
   */
  abstract findById(id: string): Promise<T | null>;

  /**
   * Find all records
   */
  abstract findAll(): Promise<T[]>;

  /**
   * Create a new record
   */
  abstract create(data: Partial<T>): Promise<T>;

  /**
   * Update an existing record
   */
  abstract update(id: string, data: Partial<T>): Promise<T>;

  /**
   * Delete a record
   */
  abstract delete(id: string): Promise<void>;
}
