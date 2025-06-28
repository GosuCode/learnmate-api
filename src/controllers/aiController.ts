import { FastifyRequest, FastifyReply } from "fastify";
import { AIServiceRequest, SummaryResponse, QuizResponse, CategorizeResponse } from "../types/ai";
import { ApiResponse } from "../types/api";
import { AIService } from "../services/aiService";

const aiService = new AIService();

export const aiController = {
  async generateSummary(request: FastifyRequest<{ Body: AIServiceRequest }>, reply: FastifyReply) {
    try {
      const { content: _content, options: _options } = request.body;
      
      // Use TF-IDF for summarization
      const summary = await aiService.generateSummary(_content, {
        maxLength: _options?.maxLength,
        useTFIDF: true
      });
      
      const response: ApiResponse<SummaryResponse> = {
        success: true,
        data: summary,
        message: 'Summary generated successfully using TF-IDF',
      };
      
      return reply.send(response);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to generate summary',
      });
    }
  },

  async generateQuiz(request: FastifyRequest<{ Body: AIServiceRequest }>, reply: FastifyReply) {
    try {
      const { content: _content, options: _options } = request.body;
      
      // TODO: Implement AI quiz generation
      // - Call OpenAI/Gemini API
      // - Process response
      // - Save to database if needed
      
      const quiz: QuizResponse = {
        questions: [
          {
            question: "What is the main topic discussed in the content?",
            options: [
              "Option A",
              "Option B",
              "Option C",
              "Option D",
            ],
            correctAnswer: 0,
            explanation: "This is the correct answer because...",
          },
        ],
        totalQuestions: 1,
      };
      
      const response: ApiResponse<QuizResponse> = {
        success: true,
        data: quiz,
        message: 'Quiz generated successfully',
      };
      
      return reply.send(response);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to generate quiz',
      });
    }
  },

  async categorizeContent(request: FastifyRequest<{ Body: AIServiceRequest }>, reply: FastifyReply) {
    try {
      const { content: _content } = request.body;
      
      // Use TF-IDF analysis for categorization
      const categorization = await aiService.categorizeContent(_content);
      
      const response: ApiResponse<CategorizeResponse> = {
        success: true,
        data: categorization,
        message: 'Content categorized successfully using TF-IDF analysis',
      };
      
      return reply.send(response);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to categorize content',
      });
    }
  },

  async analyzeContent(request: FastifyRequest<{ Body: AIServiceRequest }>, reply: FastifyReply) {
    try {
      const { content: _content } = request.body;
      
      // Get detailed TF-IDF analysis
      const analysis = await aiService.analyzeContent(_content);
      
      const response: ApiResponse = {
        success: true,
        data: {
          wordFrequency: analysis.wordFrequency,
          sentenceScores: analysis.sentenceScores.slice(0, 10), // Top 10 sentences
          topWords: analysis.topWords.slice(0, 15), // Top 15 words
          totalWords: Object.keys(analysis.wordFrequency).length,
          totalSentences: analysis.sentenceScores.length,
        },
        message: 'Content analysis completed successfully',
      };
      
      return reply.send(response);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to analyze content',
      });
    }
  },
}; 