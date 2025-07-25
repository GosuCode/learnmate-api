import { z } from 'zod';

// Input schema for creating a Semester
const createSemesterSchema = z.object({
  name: z.string().min(2, {
    message: 'Semester name must be at least 2 characters long',
  }),
});

export type CreateSemesterInput = z.infer<typeof createSemesterSchema>;

// Output schema for returning Semester data
const semesterResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const semesterSchemas = {
  createSemesterSchema,
  semesterResponseSchema,
};
