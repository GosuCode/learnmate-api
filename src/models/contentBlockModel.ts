import { z } from 'zod';

export const blockTypes = ['PARAGRAPH', 'IMAGE', 'VIDEO', 'PDF'] as const;
export type BlockType = typeof blockTypes[number];

// Input schema for creating a ContentBlock
const createContentBlockSchema = z.object({
  type: z.enum(blockTypes),
  text: z.string().optional(),
  fileUrl: z.string().url().optional(),
  order: z.number().int().nonnegative(),
  contentId: z.string(),
});

export type CreateContentBlockInput = z.infer<typeof createContentBlockSchema>;

// Response schema
const contentBlockResponseSchema = z.object({
  id: z.string(),
  type: z.enum(blockTypes),
  text: z.string().nullable(),
  fileUrl: z.string().url().nullable(),
  order: z.number().int(),
  contentId: z.string(),
});

export const contentBlockSchemas = {
  createContentBlockSchema,
  contentBlockResponseSchema,
};
