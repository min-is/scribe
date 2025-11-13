'use server';

import { revalidatePath } from 'next/cache';
import { query, queryOne, tableExists } from '@/lib/db';
import { nanoid } from 'nanoid';

// Scenario type (matches Prisma schema)
export type Scenario = {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string | null;
  content: string;
  tags: string[];
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ScenarioFormData = {
  slug: string;
  title: string;
  category: string;
  description?: string;
  content: string;
  tags: string[];
};

// Helper to check if Scenario table exists
async function ensureTableExists(): Promise<{ exists: boolean; error?: string }> {
  const exists = await tableExists('Scenario');
  if (!exists) {
    return {
      exists: false,
      error: 'Scenario table does not exist. Please run the SQL migrations from /admin/database',
    };
  }
  return { exists: true };
}

/**
 * Get all scenarios
 */
export async function getScenarios(): Promise<Scenario[]> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) {
      console.error(check.error);
      return [];
    }

    return await query<Scenario>(
      `SELECT * FROM "Scenario" ORDER BY category ASC, title ASC`
    );
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return [];
  }
}

/**
 * Get scenarios by category
 */
export async function getScenariosByCategory(
  category: string,
): Promise<Scenario[]> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) return [];

    return await query<Scenario>(
      `SELECT * FROM "Scenario" WHERE category = $1 ORDER BY title ASC`,
      [category]
    );
  } catch (error) {
    console.error('Error fetching scenarios by category:', error);
    return [];
  }
}

/**
 * Search scenarios by query
 */
export async function searchScenarios(
  searchQuery: string,
): Promise<Scenario[]> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) return [];

    const lowerQuery = `%${searchQuery.toLowerCase()}%`;
    return await query<Scenario>(
      `SELECT * FROM "Scenario"
       WHERE
         LOWER(slug) LIKE $1 OR
         LOWER(title) LIKE $1 OR
         LOWER(description) LIKE $1 OR
         LOWER(content) LIKE $1 OR
         EXISTS (SELECT 1 FROM unnest(tags) tag WHERE LOWER(tag) LIKE $1)
       ORDER BY "viewCount" DESC, title ASC`,
      [lowerQuery]
    );
  } catch (error) {
    console.error('Error searching scenarios:', error);
    return [];
  }
}

/**
 * Get a single scenario by ID
 */
export async function getScenario(id: string): Promise<Scenario | null> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) return null;

    return await queryOne<Scenario>(
      `SELECT * FROM "Scenario" WHERE id = $1`,
      [id]
    );
  } catch (error) {
    console.error('Error fetching scenario:', error);
    return null;
  }
}

/**
 * Get a scenario by slug
 */
export async function getScenarioBySlug(
  slug: string,
): Promise<Scenario | null> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) return null;

    return await queryOne<Scenario>(
      `SELECT * FROM "Scenario" WHERE slug = $1`,
      [slug]
    );
  } catch (error) {
    console.error('Error fetching scenario by slug:', error);
    return null;
  }
}

/**
 * Increment scenario view count
 */
export async function incrementScenarioViewCount(
  id: string,
): Promise<{ success: boolean }> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) return { success: false };

    await query(
      `UPDATE "Scenario" SET "viewCount" = "viewCount" + 1 WHERE id = $1`,
      [id]
    );
    return { success: true };
  } catch (error) {
    console.error('Error incrementing scenario view count:', error);
    return { success: false };
  }
}

/**
 * Get all unique categories
 */
export async function getScenarioCategories(): Promise<string[]> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) return [];

    const result = await query<{ category: string }>(
      `SELECT DISTINCT category FROM "Scenario" ORDER BY category ASC`
    );
    return result.map((r) => r.category);
  } catch (error) {
    console.error('Error fetching scenario categories:', error);
    return [];
  }
}

/**
 * Create a new scenario (admin only)
 */
export async function createScenario(
  data: ScenarioFormData,
): Promise<{ success: boolean; error?: string; scenario?: Scenario }> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) {
      return { success: false, error: check.error };
    }

    // Check if slug already exists
    const existing = await getScenarioBySlug(data.slug);
    if (existing) {
      return {
        success: false,
        error: `Scenario with slug "${data.slug}" already exists`,
      };
    }

    const id = nanoid();
    const now = new Date();

    const result = await query<Scenario>(
      `INSERT INTO "Scenario" (
        id, slug, title, category, description, content, tags, "viewCount", "createdAt", "updatedAt"
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

    const scenario = result[0];

    revalidatePath('/scenarios');
    revalidatePath('/admin/scenarios');

    return { success: true, scenario };
  } catch (error: any) {
    console.error('Error creating scenario:', error);

    // Handle PostgreSQL unique constraint violation
    if (error?.code === '23505') {
      return {
        success: false,
        error: `Scenario with slug "${data.slug}" already exists`,
      };
    }

    return {
      success: false,
      error: error?.message || 'Failed to create scenario',
    };
  }
}

/**
 * Update an existing scenario (admin only)
 */
export async function updateScenario(
  id: string,
  data: Partial<ScenarioFormData>,
): Promise<{ success: boolean; error?: string; scenario?: Scenario }> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) {
      return { success: false, error: check.error };
    }

    const now = new Date();
    const result = await query<Scenario>(
      `UPDATE "Scenario"
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

    const scenario = result[0];

    revalidatePath('/scenarios');
    revalidatePath('/admin/scenarios');

    return { success: true, scenario };
  } catch (error) {
    console.error('Error updating scenario:', error);
    return { success: false, error: 'Failed to update scenario' };
  }
}

/**
 * Delete a scenario (admin only)
 */
export async function deleteScenario(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) {
      return { success: false, error: check.error };
    }

    await query(`DELETE FROM "Scenario" WHERE id = $1`, [id]);

    revalidatePath('/scenarios');
    revalidatePath('/admin/scenarios');

    return { success: true };
  } catch (error) {
    console.error('Error deleting scenario:', error);
    return { success: false, error: 'Failed to delete scenario' };
  }
}
