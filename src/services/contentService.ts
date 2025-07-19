import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import { Content, CreateContentRequest } from '@/types/content';
import { AIServiceResponse, SummaryResponse, QuizResponse, CategorizeResponse } from '@/types/ai';

const prisma = new PrismaClient();

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class ContentService {
    /**
     * Generate content using Gemini AI
     */
    static async generateContentWithAI(prompt: string, type: 'summary' | 'quiz' | 'categorize'): Promise<AIServiceResponse> {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            let systemPrompt = '';

            switch (type) {
                case 'summary':
                    systemPrompt = `You are an educational content summarizer. Create a comprehensive summary of the provided content with key points. 
          Format your response as JSON with: {"summary": "detailed summary", "keyPoints": ["point1", "point2", ...], "wordCount": number}`;
                    break;
                case 'quiz':
                    systemPrompt = `You are an educational quiz generator. Create multiple choice questions based on the provided content. 
          Format your response as JSON with: {"questions": [{"question": "question text", "options": ["option1", "option2", "option3", "option4"], "correctAnswer": 0, "explanation": "explanation"}]}`;
                    break;
                case 'categorize':
                    systemPrompt = `You are a content categorizer. Analyze the provided content and suggest relevant educational categories. 
          Format your response as JSON with: {"categories": ["category1", "category2", ...], "confidence": 0.95}`;
                    break;
            }

            const result = await model.generateContent([
                { text: systemPrompt },
                { text: `Content to process: ${prompt}` }
            ]);

            const response = await result.response;
            const text = response.text();

            // Try to parse JSON response
            try {
                const parsedResponse = JSON.parse(text);

                // Provide fallback values for missing properties
                if (type === 'summary') {
                    return {
                        success: true,
                        data: {
                            summary: parsedResponse.summary || text,
                            keyPoints: parsedResponse.keyPoints || [text.split('.')[0]],
                            wordCount: parsedResponse.wordCount || text.split(' ').length
                        }
                    };
                } else if (type === 'quiz') {
                    return {
                        success: true,
                        data: {
                            questions: parsedResponse.questions || [{
                                question: "What is the main topic discussed?",
                                options: ["Option A", "Option B", "Option C", "Option D"],
                                correctAnswer: 0,
                                explanation: "This is a fallback question."
                            }],
                            totalQuestions: parsedResponse.questions?.length || 1
                        }
                    };
                } else if (type === 'categorize') {
                    return {
                        success: true,
                        data: {
                            categories: parsedResponse.categories || ["General"],
                            confidence: parsedResponse.confidence || 0.5
                        }
                    };
                }

                return {
                    success: true,
                    data: parsedResponse
                };
            } catch (parseError) {
                // If JSON parsing fails, return structured fallback data
                if (type === 'summary') {
                    return {
                        success: true,
                        data: {
                            summary: text,
                            keyPoints: [text.split('.')[0]],
                            wordCount: text.split(' ').length
                        }
                    };
                } else if (type === 'quiz') {
                    return {
                        success: true,
                        data: {
                            questions: [{
                                question: "What is the main topic discussed?",
                                options: ["Option A", "Option B", "Option C", "Option D"],
                                correctAnswer: 0,
                                explanation: "This is a fallback question."
                            }],
                            totalQuestions: 1
                        }
                    };
                } else if (type === 'categorize') {
                    return {
                        success: true,
                        data: {
                            categories: ["General"],
                            confidence: 0.5
                        }
                    };
                }

                return {
                    success: true,
                    data: { content: text }
                };
            }
        } catch (error) {
            console.error('AI Content generation error:', error);
            return {
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Create content manually
     */
    static async createContent(userId: string, contentData: CreateContentRequest): Promise<Content> {
        if (!userId) {
            throw new Error('userId is required');
        }
        try {
            const content = await prisma.content.create({
                data: {
                    userId,
                    title: contentData.title,
                    content: contentData.content,
                    type: contentData.type,
                    category: contentData.category,
                }
            });

            return content as Content;
        } catch (error) {
            console.error('Error creating content:', error);
            throw new Error('Failed to create content');
        }
    }

    /**
     * Get content by ID
     */
    static async getContentById(contentId: string): Promise<Content | null> {
        try {
            const content = await prisma.content.findUnique({
                where: { id: contentId }
            });

            return content as Content | null;
        } catch (error) {
            console.error('Error fetching content:', error);
            throw new Error('Failed to fetch content');
        }
    }

    /**
     * Get all content for a user
     */
    static async getUserContent(userId: string): Promise<Content[]> {
        try {
            const content = await prisma.content.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });

            return content as Content[];
        } catch (error) {
            console.error('Error fetching user content:', error);
            throw new Error('Failed to fetch user content');
        }
    }

    /**
     * Update content
     */
    static async updateContent(contentId: string, userId: string, updates: Partial<CreateContentRequest>): Promise<Content> {
        try {
            const content = await prisma.content.update({
                where: {
                    id: contentId,
                    userId // Ensure user owns the content
                },
                data: updates
            });

            return content as Content;
        } catch (error) {
            console.error('Error updating content:', error);
            throw new Error('Failed to update content');
        }
    }

    /**
     * Delete content
     */
    static async deleteContent(contentId: string, userId: string): Promise<void> {
        try {
            await prisma.content.delete({
                where: {
                    id: contentId,
                    userId // Ensure user owns the content
                }
            });
        } catch (error) {
            console.error('Error deleting content:', error);
            throw new Error('Failed to delete content');
        }
    }

    /**
     * Generate summary for content
     */
    static async generateSummary(contentId: string): Promise<SummaryResponse> {
        try {
            const content = await this.getContentById(contentId);
            if (!content) {
                throw new Error('Content not found');
            }

            const aiResponse = await this.generateContentWithAI(content.content, 'summary');

            if (!aiResponse.success) {
                throw new Error(aiResponse.error || 'Failed to generate summary');
            }

            return aiResponse.data as SummaryResponse;
        } catch (error) {
            console.error('Error generating summary:', error);
            throw new Error('Failed to generate summary');
        }
    }

    /**
     * Generate quiz for content
     */
    static async generateQuiz(contentId: string): Promise<QuizResponse> {
        try {
            const content = await this.getContentById(contentId);
            if (!content) {
                throw new Error('Content not found');
            }

            const aiResponse = await this.generateContentWithAI(content.content, 'quiz');

            if (!aiResponse.success) {
                throw new Error(aiResponse.error || 'Failed to generate quiz');
            }

            return aiResponse.data as QuizResponse;
        } catch (error) {
            console.error('Error generating quiz:', error);
            throw new Error('Failed to generate quiz');
        }
    }

    /**
     * Categorize content
     */
    static async categorizeContent(contentId: string): Promise<CategorizeResponse> {
        try {
            const content = await this.getContentById(contentId);
            if (!content) {
                throw new Error('Content not found');
            }

            const aiResponse = await this.generateContentWithAI(content.content, 'categorize');

            if (!aiResponse.success) {
                throw new Error(aiResponse.error || 'Failed to categorize content');
            }

            return aiResponse.data as CategorizeResponse;
        } catch (error) {
            console.error('Error categorizing content:', error);
            throw new Error('Failed to categorize content');
        }
    }
} 