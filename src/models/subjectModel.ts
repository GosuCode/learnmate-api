import { z } from 'zod';

// Input schema for creating a Subject
const createSubjectSchema = z.object({
  name: z.string().min(2, {
    message: 'Subject name must be at least 2 characters long',
  }),
  code: z.string().min(3, {
    message: 'Subject code must be at least 3 characters long',
  }),
  semesterId: z.string({
    required_error: 'Semester ID is required',
  }),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

// Response schema for returning Subject data
const subjectResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  semesterId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const subjectSchemas = {
  createSubjectSchema,
  subjectResponseSchema,
};
