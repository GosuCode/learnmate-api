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

export interface Summary {
  id: string;
  contentId: string;
  summary: string;
  keyPoints: string[];
  createdAt: Date;
}

export interface Quiz {
  id: string;
  contentId: string;
  questions: QuizQuestion[];
  createdAt: Date;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
} 