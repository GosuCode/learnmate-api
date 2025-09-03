import axios from 'axios';

export interface FlashcardRequest {
    text: string;
    total_questions: number;
}

export interface MCQRequest {
    text: string;
    total_questions: number;
}

export interface Flashcard {
    question: string;
    answer: string;
}

export interface MCQ {
    id?: number;
    question: string;
    options: string[];
    correct_answer_index: number;
    correct_answer: string;
    explanation?: string;
}

export interface FlashcardResponse {
    flashcards: Flashcard[];
    total_flashcards: number;
    text_length: number;
    processing_method: string;
}

export interface MCQResponse {
    mcqs: MCQ[];
    total_mcqs: number;
    text_length: number;
    processing_method: string;
}

export class FlashcardService {
    private fastapiServiceUrl: string;

    constructor() {
        this.fastapiServiceUrl = process.env.FASTAPI_SERVICE_URL || 'http://localhost:8000';
    }

    private async callFastAPIService<T>(endpoint: string, data: any): Promise<T> {
        try {
            const response = await axios.post(`${this.fastapiServiceUrl}/api/v1${endpoint}`, data, {
                timeout: 30000,
                headers: { 'Content-Type': 'application/json' }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`FastAPI service error: ${error.response?.data?.detail || error.message}`);
            }
            throw new Error(`Failed to call FastAPI service: ${error}`);
        }
    }

    async generateFlashcards(request: FlashcardRequest): Promise<FlashcardResponse> {
        try {
            return await this.callFastAPIService('/flashcards/generate', request);
        } catch (error) {
            console.log('Falling back to basic generation due to FastAPI service error');
            return this.generateBasicFlashcards(request.text, request.total_questions);
        }
    }

    async generateMCQs(request: MCQRequest): Promise<MCQResponse> {
        try {
            return await this.callFastAPIService('/mcq/generate', request);
        } catch (error) {
            console.log('Falling back to basic generation due to FastAPI service error');
            return this.generateBasicMCQs(request.text, request.total_questions);
        }
    }

    async checkFastAPIServiceHealth(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.fastapiServiceUrl}/health`, { timeout: 5000 });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    getServiceInfo() {
        return {
            service: 'Fastify Flashcard Service (FastAPI Integration)',
            fastapi_service_url: this.fastapiServiceUrl,
            features: ['flashcards', 'mcqs', 'fallback_generation'],
            use_fastapi_service: true
        };
    }

    // Basic fallback implementations
    private generateBasicFlashcards(text: string, totalQuestions: number): FlashcardResponse {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const flashcards: Flashcard[] = [];

        for (let i = 0; i < Math.min(totalQuestions, sentences.length); i++) {
            const sentence = sentences[i];
            flashcards.push({
                question: `What is the main point about: ${sentence.substring(0, 50)}...`,
                answer: sentence.trim()
            });
        }

        return {
            flashcards,
            total_flashcards: flashcards.length,
            text_length: text.length,
            processing_method: 'fallback'
        };
    }

    private generateBasicMCQs(text: string, totalQuestions: number): MCQResponse {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const mcqs: MCQ[] = [];

        for (let i = 0; i < Math.min(totalQuestions, sentences.length); i++) {
            const sentence = sentences[i];
            mcqs.push({
                question: `What is the main point about: ${sentence.substring(0, 50)}...`,
                options: [
                    sentence,
                    "This information is not provided in the text",
                    "The text does not mention this",
                    "None of the above"
                ],
                correct_answer_index: 0,
                correct_answer: sentence
            });
        }

        return {
            mcqs,
            total_mcqs: mcqs.length,
            text_length: text.length,
            processing_method: 'fallback'
        };
    }
}

export const flashcardService = new FlashcardService();
