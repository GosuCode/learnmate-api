import { z } from 'zod';
import { ContentType } from '@prisma/client';

export const contentSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  slug: z
    .string({ required_error: 'slug is required' })
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and single hyphens between words'),
  type: z.nativeEnum(ContentType),
  description: z.string().optional(),
  subjectId: z.string().min(1),
  parentId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional(),
  createdById: z.string().min(1),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});


export const createContentSchema = contentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateContentSchema = contentSchema.partial().extend({
  id: z.string(),
});

export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
