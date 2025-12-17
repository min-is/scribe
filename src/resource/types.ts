import { z } from 'zod';
import { Page } from '@prisma/client';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const ResourceSectionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  icon: z.string().optional(),
  position: z.string().optional(),
});

export const ResourceArticleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.any(), // TipTap JSON content
  sectionId: z.string().min(1, 'Section is required'),
  icon: z.string().optional(),
  position: z.string().optional(),
});

// ============================================================================
// TYPES
// ============================================================================

export type ResourceSectionData = z.infer<typeof ResourceSectionSchema>;
export type ResourceArticleData = z.infer<typeof ResourceArticleSchema>;

// Extended type with children for hierarchical display
export type ResourceSection = Page & {
  children?: ResourceArticle[];
};

export type ResourceArticle = Page;
