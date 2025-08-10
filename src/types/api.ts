export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  statusCode: number;
}

export interface MCQGenerationRequest {
  text: string;
  num_questions?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  question_type?: 'single_choice' | 'multiple_choice';
}

export interface MCQQuestion {
  question: string;
  options: string[];
  correct_answer: string | string[];
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface MCQGenerationResponse {
  questions: MCQQuestion[];
  total_questions: number;
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
} 