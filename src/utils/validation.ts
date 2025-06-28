// User validation schemas
export const createUserSchema = {
  email: {
    type: 'string',
    format: 'email',
    errorMessage: 'Invalid email format',
  },
  name: {
    type: 'string',
    minLength: 2,
    errorMessage: 'Name must be at least 2 characters',
  },
  password: {
    type: 'string',
    minLength: 6,
    errorMessage: 'Password must be at least 6 characters',
  },
};

export const loginSchema = {
  email: {
    type: 'string',
    format: 'email',
    errorMessage: 'Invalid email format',
  },
  password: {
    type: 'string',
    minLength: 1,
    errorMessage: 'Password is required',
  },
};

// Content validation schemas
export const createContentSchema = {
  title: {
    type: 'string',
    minLength: 1,
    errorMessage: 'Title is required',
  },
  content: {
    type: 'string',
    minLength: 1,
    errorMessage: 'Content is required',
  },
  type: {
    type: 'string',
    enum: ['text', 'pdf', 'url'],
    errorMessage: 'Type must be text, pdf, or url',
  },
  category: {
    type: 'string',
    optional: true,
  },
};

// AI service validation schemas
export const aiServiceSchema = {
  content: {
    type: 'string',
    minLength: 1,
    errorMessage: 'Content is required',
  },
  options: {
    maxLength: {
      type: 'number',
      min: 50,
      max: 1000,
      optional: true,
    },
    difficulty: {
      type: 'string',
      enum: ['easy', 'medium', 'hard'],
      optional: true,
    },
    numQuestions: {
      type: 'number',
      min: 1,
      max: 20,
      optional: true,
    },
  },
};

// Pagination validation schema
export const paginationSchema = {
  page: {
    type: 'number',
    min: 1,
    default: 1,
  },
  limit: {
    type: 'number',
    min: 1,
    max: 100,
    default: 10,
  },
};

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

// Content type validation
export function isValidContentType(type: string): boolean {
  return ['text', 'pdf', 'url'].includes(type);
}

// Difficulty validation
export function isValidDifficulty(difficulty: string): boolean {
  return ['easy', 'medium', 'hard'].includes(difficulty);
}

// Pagination validation
export function validatePagination(page: number, limit: number): { page: number; limit: number } {
  return {
    page: Math.max(1, Math.floor(page) || 1),
    limit: Math.min(100, Math.max(1, Math.floor(limit) || 10)),
  };
} 