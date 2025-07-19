import { z } from 'zod';

const createUserSchema = z.object({
    email: z.string().email({
        message: 'Please provide a valid email address'
    }),
    password: z.string().min(8, {
        message: 'Password must be at least 8 characters long'
    }),
    name: z.string().min(2, {
        message: 'Name must be at least 2 characters long'
    }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

const createUserResponseSchema = z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
});

const loginSchema = z.object({
    email: z
        .string({
            required_error: 'Email is required',
            invalid_type_error: 'Email must be a string',
        })
        .email({
            message: 'Please provide a valid email address'
        }),
    password: z.string().min(8, {
        message: 'Password must be at least 8 characters long'
    }),
});

export type LoginUserInput = z.infer<typeof loginSchema>;

const loginResponseSchema = z.object({
    accessToken: z.string(),
});

export const userSchemas = {
    createUserSchema,
    createUserResponseSchema,
    loginSchema,
    loginResponseSchema,
};