import { z } from 'zod';

export const contentTypes = ['TOPIC', 'CHAPTER', 'SUMMARY', 'NOTE'] as const;
export type ContentType = typeof contentTypes[number];

// Input schema for creating a Content
const createContentSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters long'),
  slug: z.string().min(2, 'Slug must be at least 2 characters long'),
  type: z.enum(contentTypes),
  subjectId: z.string(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional().default(false),
  createdById: z.string(),
});

export type CreateContentInput = z.infer<typeof createContentSchema>;

// Response schema
const contentResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  type: z.enum(contentTypes),
  description: z.string().nullable(),
  subjectId: z.string(),
  parentId: z.string().nullable(),
  tags: z.array(z.string()),
  published: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string(),
});

export const contentSchemas = {
  createContentSchema,
  contentResponseSchema,
};
