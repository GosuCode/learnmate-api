import { z } from 'zod';

const chapterSchema = z.object({
    id: z.string().uuid().optional(),
    courseId: z.string().uuid(),
    chapterNumber: z.number().int().min(1, { message: 'Chapter number must be at least 1' }),
    slug: z.string().min(1, { message: 'Slug is required' }),
    title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
    content: z.string().min(1, { message: 'Content cannot be empty' }),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export const createChapterSchema = chapterSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const updateChapterSchema = chapterSchema.partial().extend({
    id: z.string().uuid(),
});

export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;
