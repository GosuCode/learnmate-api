export interface Group {
  id: string;
  name: string;
  description?: string;
  color?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  flashcards?: Flashcard[];
  quizzes?: Quiz[];
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  color?: string;
}

export interface GroupResponse {
  success: boolean;
  group: Group;
}

export interface GroupsResponse {
  success: boolean;
  groups: Group[];
  total: number;
}

export interface GroupWithCounts {
  id: string;
  name: string;
  description?: string;
  color?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  flashcardCount: number;
  quizCount: number;
}

// Re-export Flashcard and Quiz types for convenience
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  easeFactor: number;
  interval: number;
  repetition: number;
  lastReviewed: Date;
  nextReview: Date;
  userId: string;
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quiz {
  id: string;
  title: string;
  originalText: string;
  questions: any;
  totalQuestions: number;
  processingMethod: string;
  userId: string;
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
}
