/**
 * Base Repository
 * Abstract base class providing common CRUD operations
 */

import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository<T> {
  constructor(protected prisma: PrismaClient) {}

  /**
   * Find a record by ID
   */
  abstract findById(id: string): Promise<T | null>;

  /**
   * Find multiple records
   */
  abstract findMany(filters?: unknown): Promise<T[]>;

  /**
   * Create a new record
   */
  abstract create(data: unknown): Promise<T>;

  /**
   * Update an existing record
   */
  abstract update(id: string, data: unknown): Promise<T>;

  /**
   * Delete a record
   */
  abstract delete(id: string): Promise<void>;
}
