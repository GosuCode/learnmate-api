export interface Content {
  id: string;
  title: string;
  slug: string;
  type: 'TEXT' | 'PDF' | 'URL';
  description?: string;
  subjectId: string;
  parentId?: string | null;
  tags: string[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
}

export interface CreateContentRequest {
  title: string;
  slug: string;
  type: 'TEXT' | 'PDF' | 'URL';
  description?: string;
  subjectId: string;
  parentId?: string | null;
  tags?: string[];
  published?: boolean;
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