import { z } from 'zod';

const semesterSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, {
    message: 'Semester name must be at least 2 characters long',
  }),
  code: z.string().min(7).max(10),
  subjects: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const createSemesterSchema = semesterSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSemesterSchema = semesterSchema.partial().extend({
  id: z.string(),
});

export type CreateSemesterInput = z.infer<typeof createSemesterSchema>;
export type UpdateSemesterInput = z.infer<typeof updateSemesterSchema>;
