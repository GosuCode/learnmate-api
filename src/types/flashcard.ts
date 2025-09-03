export interface FlashcardRequest {
    text: string;
    total_questions: number;
}

export interface Flashcard {
    question: string;
    answer: string;
}


export interface FlashcardResponse {
    flashcards: Flashcard[];
    total_flashcards: number;
    text_length: number;
    processing_method: string;
}