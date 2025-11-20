/**
 * Base Repository
 *
 * Abstract base class providing common CRUD operations.
 * Uses generic types for input/output to allow child repositories
 * to define their own input types with required fields.
 */

import { PrismaClient } from '@prisma/client';

/**
 * Base repository with generic CRUD operations
 *
 * @template T - The entity type (e.g., Provider, Page)
 * @template CreateInput - The input type for creating entities
 * @template UpdateInput - The input type for updating entities
 */
export abstract class BaseRepository<T, CreateInput = Partial<T>, UpdateInput = Partial<T>> {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Find an entity by ID
   */
  abstract findById(id: string): Promise<T | null>;

  /**
   * Find multiple entities
   */
  abstract findMany(filter?: unknown): Promise<T[]>;

  /**
   * Create a new entity
   */
  abstract create(data: CreateInput): Promise<T>;

  /**
   * Update an existing entity
   */
  abstract update(id: string, data: UpdateInput): Promise<T>;

  /**
   * Delete an entity
   */
  abstract delete(id: string): Promise<void>;
}
