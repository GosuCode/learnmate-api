export interface AIServiceRequest {
  content: string;
  type: 'summary' | 'quiz' | 'categorize';
  options?: {
    maxLength?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    numQuestions?: number;
  };
}

export interface AIServiceResponse {
  success: boolean;
  data: any;
  error?: string;
}

export interface SummaryResponse {
  summary: string;
  keyPoints: string[];
  wordCount: number;
}

export interface QuizResponse {
  questions: QuizQuestion[];
  totalQuestions: number;
}

export interface CategorizeResponse {
  categories: string[];
  confidence: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
} 