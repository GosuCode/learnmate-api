export interface Content {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'text' | 'pdf' | 'url';
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContentRequest {
  title: string;
  content: string;
  type: 'text' | 'pdf' | 'url';
  category?: string;
}

export interface UpdateContentRequest {
  title?: string;
  content?: string;
  type?: 'text' | 'pdf' | 'url';
  category?: string;
}

export interface AIServiceRequest {
  content: string;
  type: 'summary' | 'quiz' | 'categorize';
  options?: {
    maxLength?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    numQuestions?: number;
  };
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

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface CategorizeResponse {
  categories: string[];
  confidence: number;
} 