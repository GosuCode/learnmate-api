export interface MCQRequest {
    text: string;
    total_questions: number;
}

export interface MCQ {
    id?: number;
    question: string;
    options: string[];
    correct_answer_index: number;
    correct_answer: string;
    explanation?: string;
}

export interface MCQResponse {
    mcqs: MCQ[];
    total_mcqs: number;
    text_length: number;
    processing_method: string;
}