import { z } from 'zod';

const courseSchema = z.object({
    id: z.string().uuid().optional(),
    slug: z.string().min(2, { message: 'Slug must be at least 2 characters' }),
    name: z.string().min(3, { message: 'Course name must be at least 3 characters' }),
    semester: z.number().int().min(1).max(8),
    description: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export const createCourseSchema = courseSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const updateCourseSchema = courseSchema.partial().extend({
    id: z.string().uuid(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
