import { z } from 'zod';
import { PageType } from '@prisma/client';

/**
 * Search query validation schema
 */
export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200),
  type: z.nativeEnum(PageType).optional(),
});

/**
 * Page creation/update validation schema
 */
export const pageCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().optional(),
  textContent: z.string().optional(),
  icon: z.string().max(50).optional(),
  type: z.nativeEnum(PageType),
  tags: z.array(z.string()).optional(),
  parentId: z.string().optional(),
  position: z.string().optional(),
});

export const pageUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).optional(),
  content: z.string().optional(),
  textContent: z.string().optional(),
  icon: z.string().max(50).optional(),
  tags: z.array(z.string()).optional(),
  parentId: z.string().optional().nullable(),
  position: z.string().optional(),
});

/**
 * File upload validation schema
 */
export const uploadFileSchema = z.object({
  file: z.instanceof(File).refine((file) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
    ];
    return allowedTypes.includes(file.type);
  }, 'Invalid file type'),
  maxSize: z.number().positive().optional(),
});

/**
 * Provider validation schemas
 */
export const providerCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  credentials: z.string().max(50).optional(),
  specialty: z.string().max(100).optional(),
  npi: z.string().max(20).optional(),
});

export const providerUpdateSchema = providerCreateSchema.partial();

/**
 * Procedure validation schemas
 */
export const procedureCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  difficulty: z.number().int().min(0).max(100).optional(),
});

export const procedureUpdateSchema = procedureCreateSchema.partial();

/**
 * Scenario validation schemas
 */
export const scenarioCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  difficulty: z.number().int().min(0).max(100).optional(),
});

export const scenarioUpdateSchema = scenarioCreateSchema.partial();

/**
 * Medication validation schemas
 */
export const medicationCreateSchema = z.object({
  genericName: z.string().min(1, 'Generic name is required').max(200),
  brandName: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  dosage: z.string().max(100).optional(),
});

export const medicationUpdateSchema = medicationCreateSchema.partial();

/**
 * Helper function to validate data against a schema
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
