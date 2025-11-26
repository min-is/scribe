'use server';

import { revalidatePath } from 'next/cache';
import { query, queryOne, tableExists } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

// Procedure type (matches Prisma schema)
export type Procedure = {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string | null;
  steps: any; // TipTap JSON content
  complications: string | null;
  tags: string[];
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ProcedureFormData = {
  slug: string;
  title: string;
  category: string;
  description?: string;
  steps: any; // TipTap JSON content
  complications?: string;
  tags: string[];
};

// Helper to check if Procedure table exists
async function ensureTableExists(): Promise<{ exists: boolean; error?: string }> {
  const exists = await tableExists('Procedure');
  if (!exists) {
    return {
      exists: false,
      error: 'Procedure table does not exist. Please run the SQL migrations from /admin/database',
    };
  }
  return { exists: true };
}

/**
 * Get all procedures
 */
export async function getProcedures(): Promise<Procedure[]> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) {
      console.error(check.error);
      return [];
    }

    return await query<Procedure>(
      `SELECT * FROM "Procedure" ORDER BY category ASC, title ASC`
    );
  } catch (error) {
    console.error('Error fetching procedures:', error);
    return [];
  }
}

/**
 * Get procedures by category
 */
export async function getProceduresByCategory(
  category: string,
): Promise<Procedure[]> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) return [];

    return await query<Procedure>(
      `SELECT * FROM "Procedure" WHERE category = $1 ORDER BY title ASC`,
      [category]
    );
  } catch (error) {
    console.error('Error fetching procedures by category:', error);
    return [];
  }
}

/**
 * Search procedures by query
 */
export async function searchProcedures(
  searchQuery: string,
): Promise<Procedure[]> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) return [];

    const lowerQuery = `%${searchQuery.toLowerCase()}%`;
    return await query<Procedure>(
      `SELECT * FROM "Procedure"
       WHERE
         LOWER(slug) LIKE $1 OR
         LOWER(title) LIKE $1 OR
         LOWER(description) LIKE $1 OR
         LOWER(steps) LIKE $1 OR
         EXISTS (SELECT 1 FROM unnest(tags) tag WHERE LOWER(tag) LIKE $1)
       ORDER BY "viewCount" DESC, title ASC`,
      [lowerQuery]
    );
  } catch (error) {
    console.error('Error searching procedures:', error);
    return [];
  }
}

/**
 * Get a single procedure by ID
 */
export async function getProcedure(id: string): Promise<Procedure | null> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) return null;

    return await queryOne<Procedure>(
      `SELECT * FROM "Procedure" WHERE id = $1`,
      [id]
    );
  } catch (error) {
    console.error('Error fetching procedure:', error);
    return null;
  }
}

/**
 * Get a procedure by slug
 */
export async function getProcedureBySlug(
  slug: string,
): Promise<Procedure | null> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) return null;

    return await queryOne<Procedure>(
      `SELECT * FROM "Procedure" WHERE slug = $1`,
      [slug]
    );
  } catch (error) {
    console.error('Error fetching procedure by slug:', error);
    return null;
  }
}

/**
 * Increment procedure view count
 */
export async function incrementProcedureViewCount(
  id: string,
): Promise<{ success: boolean }> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) return { success: false };

    await query(
      `UPDATE "Procedure" SET "viewCount" = "viewCount" + 1 WHERE id = $1`,
      [id]
    );
    return { success: true };
  } catch (error) {
    console.error('Error incrementing procedure view count:', error);
    return { success: false };
  }
}

/**
 * Get all unique categories
 */
export async function getProcedureCategories(): Promise<string[]> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) return [];

    const result = await query<{ category: string }>(
      `SELECT DISTINCT category FROM "Procedure" ORDER BY category ASC`
    );
    return result.map((r) => r.category);
  } catch (error) {
    console.error('Error fetching procedure categories:', error);
    return [];
  }
}

/**
 * Create a new procedure (admin only)
 */
export async function createProcedure(
  data: ProcedureFormData,
): Promise<{ success: boolean; error?: string; procedure?: Procedure }> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) {
      return { success: false, error: check.error };
    }

    // Check if slug already exists
    const existing = await getProcedureBySlug(data.slug);
    if (existing) {
      return {
        success: false,
        error: `Procedure with slug "${data.slug}" already exists`,
      };
    }

    const id = nanoid();
    const now = new Date();

    const result = await query<Procedure>(
      `INSERT INTO "Procedure" (
        id, slug, title, category, description, steps, complications, tags, "viewCount", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        id,
        data.slug,
        data.title,
        data.category,
        data.description || null,
        JSON.stringify(data.steps),
        data.complications || null,
        data.tags,
        0,
        now,
        now,
      ]
    );

    const procedure = result[0];

    // Create associated Page record using Prisma
    await prisma.page.create({
      data: {
        slug: procedure.slug,
        title: procedure.title,
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [] }],
        },
        type: 'PROCEDURE',
        procedureId: procedure.id,
        category: procedure.category,
        position: 'a0',
      },
    });

    revalidatePath('/procedures');
    revalidatePath('/admin/procedures');

    return { success: true, procedure };
  } catch (error: any) {
    console.error('Error creating procedure:', error);

    // Handle PostgreSQL unique constraint violation
    if (error?.code === '23505') {
      return {
        success: false,
        error: `Procedure with slug "${data.slug}" already exists`,
      };
    }

    return {
      success: false,
      error: error?.message || 'Failed to create procedure',
    };
  }
}

/**
 * Update an existing procedure (admin only)
 */
export async function updateProcedure(
  id: string,
  data: Partial<ProcedureFormData>,
): Promise<{ success: boolean; error?: string; procedure?: Procedure }> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) {
      return { success: false, error: check.error };
    }

    const now = new Date();
    const result = await query<Procedure>(
      `UPDATE "Procedure"
       SET
         slug = COALESCE($2, slug),
         title = COALESCE($3, title),
         category = COALESCE($4, category),
         description = COALESCE($5, description),
         steps = COALESCE($6::jsonb, steps),
         complications = COALESCE($7, complications),
         tags = COALESCE($8, tags),
         "updatedAt" = $9
       WHERE id = $1
       RETURNING *`,
      [
        id,
        data.slug,
        data.title,
        data.category,
        data.description,
        data.steps ? JSON.stringify(data.steps) : null,
        data.complications,
        data.tags,
        now,
      ]
    );

    const procedure = result[0];

    revalidatePath('/procedures');
    revalidatePath('/admin/procedures');

    return { success: true, procedure };
  } catch (error) {
    console.error('Error updating procedure:', error);
    return { success: false, error: 'Failed to update procedure' };
  }
}

/**
 * Delete a procedure (admin only)
 */
export async function deleteProcedure(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const check = await ensureTableExists();
    if (!check.exists) {
      return { success: false, error: check.error };
    }

    // Delete associated Page records first using Prisma
    await prisma.page.deleteMany({
      where: { procedureId: id },
    });

    // Then delete the procedure
    await query(`DELETE FROM "Procedure" WHERE id = $1`, [id]);

    revalidatePath('/procedures');
    revalidatePath('/admin/procedures');

    return { success: true };
  } catch (error) {
    console.error('Error deleting procedure:', error);
    return { success: false, error: 'Failed to delete procedure' };
  }
}
