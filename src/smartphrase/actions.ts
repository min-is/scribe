'use server';

import { revalidatePath } from 'next/cache';
import { query, queryOne, tableExists } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

// SmartPhrase type (matches Prisma schema)
export type SmartPhrase = {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string | null;
  content: string;
  tags: string[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type SmartPhraseFormData = {
  slug: string;
  title: string;
  category: string;
  description?: string;
  content: string;
  tags: string[];
};

// Helper to check if SmartPhrase table exists
async function ensureTableExists(): Promise<{ exists: boolean; error?: string }> {
  const exists = await tableExists('SmartPhrase');
  if (!exists) {
    return {
      exists: false,
      error: 'SmartPhrase table does not exist. Please run the SQL migrations from /admin/database',
    };
  }
  return { exists: true };
}

/**
 * Get all smartphrases
 */
export async function getSmartPhrases(): Promise<SmartPhrase[]> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) {
      console.error(check.error);
      return [];
    }

    return await query<SmartPhrase>(
      `SELECT * FROM "SmartPhrase" ORDER BY category ASC, title ASC`
    );
  } catch (error) {
    console.error('Error fetching smartphrases:', error);
    return [];
  }
}

/**
 * Get smartphrases by category
 */
export async function getSmartPhrasesByCategory(
  category: string,
): Promise<SmartPhrase[]> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) return [];

    return await query<SmartPhrase>(
      `SELECT * FROM "SmartPhrase" WHERE category = $1 ORDER BY title ASC`,
      [category]
    );
  } catch (error) {
    console.error('Error fetching smartphrases by category:', error);
    return [];
  }
}

/**
 * Search smartphrases by query
 */
export async function searchSmartPhrases(
  searchQuery: string,
): Promise<SmartPhrase[]> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) return [];

    const lowerQuery = `%${searchQuery.toLowerCase()}%`;
    return await query<SmartPhrase>(
      `SELECT * FROM "SmartPhrase"
       WHERE
         LOWER(slug) LIKE $1 OR
         LOWER(title) LIKE $1 OR
         LOWER(description) LIKE $1 OR
         LOWER(content) LIKE $1 OR
         EXISTS (SELECT 1 FROM unnest(tags) tag WHERE LOWER(tag) LIKE $1)
       ORDER BY "usageCount" DESC, title ASC`,
      [lowerQuery]
    );
  } catch (error) {
    console.error('Error searching smartphrases:', error);
    return [];
  }
}

/**
 * Get a single smartphrase by ID
 */
export async function getSmartPhrase(id: string): Promise<SmartPhrase | null> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) return null;

    return await queryOne<SmartPhrase>(
      `SELECT * FROM "SmartPhrase" WHERE id = $1`,
      [id]
    );
  } catch (error) {
    console.error('Error fetching smartphrase:', error);
    return null;
  }
}

/**
 * Get a smartphrase by slug
 */
export async function getSmartPhraseBySlug(
  slug: string,
): Promise<SmartPhrase | null> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) return null;

    return await queryOne<SmartPhrase>(
      `SELECT * FROM "SmartPhrase" WHERE slug = $1`,
      [slug]
    );
  } catch (error) {
    console.error('Error fetching smartphrase by slug:', error);
    return null;
  }
}

/**
 * Increment smartphrase usage count when copied
 */
export async function incrementSmartPhraseUsage(
  id: string,
): Promise<{ success: boolean }> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) return { success: false };

    await query(
      `UPDATE "SmartPhrase" SET "usageCount" = "usageCount" + 1 WHERE id = $1`,
      [id]
    );
    return { success: true };
  } catch (error) {
    console.error('Error incrementing smartphrase usage:', error);
    return { success: false };
  }
}

/**
 * Get all unique categories
 */
export async function getCategories(): Promise<string[]> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) return [];

    const result = await query<{ category: string }>(
      `SELECT DISTINCT category FROM "SmartPhrase" ORDER BY category ASC`
    );
    return result.map((r) => r.category);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Create a new smartphrase (admin only)
 */
export async function createSmartPhrase(
  data: SmartPhraseFormData,
): Promise<{ success: boolean; error?: string; smartphrase?: SmartPhrase }> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) {
      return { success: false, error: check.error };
    }

    // Check if slug already exists
    const existing = await getSmartPhraseBySlug(data.slug);
    if (existing) {
      return {
        success: false,
        error: `SmartPhrase with slug "${data.slug}" already exists`,
      };
    }

    const id = nanoid();
    const now = new Date();

    const result = await query<SmartPhrase>(
      `INSERT INTO "SmartPhrase" (
        id, slug, title, category, description, content, tags, "usageCount", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        id,
        data.slug,
        data.title,
        data.category,
        data.description || null,
        data.content,
        data.tags,
        0,
        now,
        now,
      ]
    );

    const smartphrase = result[0];

    // Create associated Page record using Prisma
    await prisma.page.create({
      data: {
        slug: smartphrase.slug,
        title: smartphrase.title,
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [] }],
        },
        type: 'SMARTPHRASE',
        smartPhraseId: smartphrase.id,
        category: smartphrase.category,
        position: 'a0',
      },
    });

    revalidatePath('/smartphrases');
    revalidatePath('/admin/smartphrases');

    return { success: true, smartphrase };
  } catch (error: any) {
    console.error('Error creating smartphrase:', error);

    // Handle PostgreSQL unique constraint violation
    if (error?.code === '23505') {
      return {
        success: false,
        error: `SmartPhrase with slug "${data.slug}" already exists`,
      };
    }

    return {
      success: false,
      error: error?.message || 'Failed to create smartphrase',
    };
  }
}

/**
 * Update an existing smartphrase (admin only)
 */
export async function updateSmartPhrase(
  id: string,
  data: Partial<SmartPhraseFormData>,
): Promise<{ success: boolean; error?: string; smartphrase?: SmartPhrase }> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) {
      return { success: false, error: check.error };
    }

    const now = new Date();
    const result = await query<SmartPhrase>(
      `UPDATE "SmartPhrase"
       SET
         slug = COALESCE($2, slug),
         title = COALESCE($3, title),
         category = COALESCE($4, category),
         description = COALESCE($5, description),
         content = COALESCE($6, content),
         tags = COALESCE($7, tags),
         "updatedAt" = $8
       WHERE id = $1
       RETURNING *`,
      [
        id,
        data.slug,
        data.title,
        data.category,
        data.description,
        data.content,
        data.tags,
        now,
      ]
    );

    const smartphrase = result[0];

    revalidatePath('/smartphrases');
    revalidatePath('/admin/smartphrases');

    return { success: true, smartphrase };
  } catch (error) {
    console.error('Error updating smartphrase:', error);
    return { success: false, error: 'Failed to update smartphrase' };
  }
}

/**
 * Delete a smartphrase (admin only)
 */
export async function deleteSmartPhrase(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) {
      return { success: false, error: check.error };
    }

    // Delete associated Page records first using Prisma
    await prisma.page.deleteMany({
      where: { smartPhraseId: id },
    });

    // Then delete the smartphrase
    await query(`DELETE FROM "SmartPhrase" WHERE id = $1`, [id]);

    revalidatePath('/smartphrases');
    revalidatePath('/admin/smartphrases');

    return { success: true };
  } catch (error) {
    console.error('Error deleting smartphrase:', error);
    return { success: false, error: 'Failed to delete smartphrase' };
  }
}
