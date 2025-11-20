/**
 * Base Repository
 *
 * Abstract base class for common database operations.
 */

import type { PrismaClient } from '@prisma/client';

export abstract class BaseRepository {
  constructor(protected prisma: PrismaClient) {}
}
