import { z } from 'zod';

export const subjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, {
    message: 'Subject name must be at least 2 characters long',
  }),
  code: z.string().min(3, {
    message: 'Subject code must be at least 3 characters long',
  }),
  semesterId: z.string({
    required_error: 'Semester ID is required',
  }),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const createSubjectSchema = subjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSubjectSchema = subjectSchema.partial().extend({
  id: z.string(),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
