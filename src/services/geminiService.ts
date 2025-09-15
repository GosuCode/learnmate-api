import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('GEMINI_API_KEY not found in environment variables');
        } else {
            this.genAI = new GoogleGenerativeAI(apiKey);
            console.log('✅ Gemini API client initialized');
        }
    }

    async generateContent(prompt: string): Promise<string> {
        if (!this.genAI) {
            throw new Error('Gemini API client not available. Check GEMINI_API_KEY environment variable.');
        }

        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const result = await model.generateContent(prompt);
            const response = await result.response;

            return response.text();
        } catch (error) {
            console.error('Gemini API error:', error);
            throw new Error(`Gemini API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async *generateContentStream(prompt: string): AsyncGenerator<string, void, unknown> {
        if (!this.genAI) {
            throw new Error('Gemini API client not available. Check GEMINI_API_KEY environment variable.');
        }

        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContentStream(prompt);

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                if (chunkText) {
                    yield chunkText;
                }
            }
        } catch (error) {
            console.error('Gemini streaming API error:', error);
            throw new Error(`Gemini streaming API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async generateFlashcards(text: string, totalQuestions: number = 3): Promise<any> {
        if (!this.genAI) {
            throw new Error('Gemini API client not available. Check GEMINI_API_KEY environment variable.');
        }

        try {
            const prompt = `
            You are an expert educator creating flashcards. Generate exactly ${totalQuestions} high-quality flashcards from this text.
            
            Requirements:
            - Questions should test understanding, not just recall
            - Answers should be concise but complete
            - Vary question types (what, why, how, compare, etc.)
            - Focus on key concepts and important details
            - Generate EXACTLY ${totalQuestions} flashcards, no more, no less
            
            Text: ${text.substring(0, 3000)}
            
            Return ONLY valid JSON in this exact format:
            {
                "flashcards": [
                    {"question": "What is the main concept discussed in the first paragraph?", "answer": "The main concept is..."},
                    {"question": "Why is this important?", "answer": "This is important because..."}
                ]
            }
            `;

            const result = await this.generateContent(prompt);

            // Clean the response text
            let responseText = result.trim();
            if (responseText.startsWith('```json')) {
                responseText = responseText.substring(7, responseText.length - 3);
            } else if (responseText.startsWith('```')) {
                responseText = responseText.substring(3, responseText.length - 3);
            }

            try {
                const parsed = JSON.parse(responseText);
                const flashcards = parsed.flashcards || [];

                if (!flashcards || flashcards.length < totalQuestions) {
                    throw new Error(`Gemini returned insufficient flashcards. Expected ${totalQuestions}, got ${flashcards.length}`);
                }

                return {
                    flashcards,
                    total_flashcards: flashcards.length,
                    text_length: text.length,
                    processing_method: 'gemini_api'
                };
            } catch (parseError) {
                throw new Error(`Failed to parse Gemini response as JSON: ${parseError}. Response: ${responseText.substring(0, 200)}`);
            }
        } catch (error) {
            console.error('Gemini API error:', error);
            throw new Error(`Gemini API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async generateMCQs(text: string, totalQuestions: number = 3): Promise<any> {
        if (!this.genAI) {
            throw new Error('Gemini API client not available. Check GEMINI_API_KEY environment variable.');
        }

        try {
            const prompt = `
            You are an expert educator creating multiple choice questions. Generate exactly ${totalQuestions} high-quality MCQs from this text.
            
            Requirements:
            - Questions should test understanding, not just recall
            - All 4 options should be plausible but only one correct
            - Correct answer should be clearly right
            - Wrong options should be reasonable distractors
            - Focus on key concepts and important details
            - Generate EXACTLY ${totalQuestions} MCQs, no more, no less
            
            Text: ${text.substring(0, 3000)}
            
            Return ONLY valid JSON in this exact format:
            {
                "mcqs": [
                    {
                        "question": "What is the main concept discussed?",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correct_answer": "Option A",
                        "correct_answer_index": 0
                    }
                ]
            }
            `;

            const result = await this.generateContent(prompt);

            // Clean the response text
            let responseText = result.trim();
            if (responseText.startsWith('```json')) {
                responseText = responseText.substring(7, responseText.length - 3);
            } else if (responseText.startsWith('```')) {
                responseText = responseText.substring(3, responseText.length - 3);
            }

            try {
                const parsed = JSON.parse(responseText);
                const mcqs = parsed.mcqs || [];

                if (!mcqs || mcqs.length < totalQuestions) {
                    throw new Error(`Gemini returned insufficient MCQs. Expected ${totalQuestions}, got ${mcqs.length}`);
                }

                return {
                    mcqs,
                    total_mcqs: mcqs.length,
                    text_length: text.length,
                    processing_method: 'gemini_api'
                };
            } catch (parseError) {
                throw new Error(`Failed to parse Gemini response as JSON: ${parseError}. Response: ${responseText.substring(0, 200)}`);
            }
        } catch (error) {
            console.error('Gemini API error:', error);
            throw new Error(`Gemini API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const geminiService = new GeminiService();
