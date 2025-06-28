import { AIServiceRequest, SummaryResponse, QuizResponse, CategorizeResponse } from '../types/ai';
import { aiConfig } from '../config';
import { TFIDFService, TFIDFSummaryOptions } from './tfidfService';

export class AIService {
  private openaiApiKey: string;
  private geminiApiKey: string;
  private tfidfService: TFIDFService;

  constructor() {
    this.openaiApiKey = aiConfig.openai.apiKey;
    this.geminiApiKey = aiConfig.gemini.apiKey;
    this.tfidfService = new TFIDFService();
  }

  async generateSummary(content: string, options?: { maxLength?: number; useTFIDF?: boolean }): Promise<SummaryResponse> {
    const { maxLength = 500, useTFIDF = true } = options || {};

    // Use TF-IDF for local summarization
    if (useTFIDF) {
      const tfidfOptions: TFIDFSummaryOptions = {
        maxSentences: Math.max(2, Math.floor(content.length / 200)), // Adaptive sentence count
        minSentenceLength: 10,
        maxSummaryLength: maxLength,
        removeStopWords: true
      };

      const result = this.tfidfService.summarize(content, tfidfOptions);
      
      return {
        summary: result.summary,
        keyPoints: result.keyPoints,
        wordCount: result.wordCount,
      };
    }

    // TODO: Implement OpenAI/Gemini API call for summary generation
    // For now, return TF-IDF as fallback
    const result = this.tfidfService.summarize(content, {
      maxSentences: 3,
      maxSummaryLength: maxLength
    });

    return {
      summary: result.summary,
      keyPoints: result.keyPoints,
      wordCount: result.wordCount,
    };
  }

  async generateQuiz(content: string, options?: { difficulty?: string; numQuestions?: number }): Promise<QuizResponse> {
    // TODO: Implement OpenAI/Gemini API call for quiz generation
    // For now, return mock data
    return {
      questions: [
        {
          question: "What is the main topic discussed?",
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: 0,
          explanation: "This is the correct answer because...",
        },
      ],
      totalQuestions: 1,
    };
  }

  async categorizeContent(content: string): Promise<CategorizeResponse> {
    // Use TF-IDF analysis to help with categorization
    const analysis = this.tfidfService.analyze(content);
    
    // Simple categorization based on key words
    const categories = this.categorizeByKeywords(analysis.topWords);
    
    return {
      categories,
      confidence: 0.85,
    };
  }

  /**
   * Get detailed TF-IDF analysis of content
   */
  async analyzeContent(content: string) {
    return this.tfidfService.analyze(content);
  }

  /**
   * Simple keyword-based categorization
   */
  private categorizeByKeywords(topWords: Array<{ word: string; tfidf: number }>): string[] {
    const categories: string[] = [];
    const keywords = topWords.map(w => w.word.toLowerCase());

    // Define category keywords
    const categoryKeywords = {
      'Technology': ['algorithm', 'computer', 'software', 'data', 'system', 'technology', 'digital', 'code', 'programming'],
      'Science': ['research', 'study', 'experiment', 'scientific', 'analysis', 'theory', 'hypothesis', 'method'],
      'Education': ['learning', 'teaching', 'education', 'student', 'knowledge', 'academic', 'course', 'study'],
      'Business': ['business', 'market', 'company', 'management', 'strategy', 'finance', 'economic', 'industry'],
      'Health': ['health', 'medical', 'treatment', 'disease', 'patient', 'medicine', 'clinical', 'therapy'],
      'History': ['history', 'historical', 'past', 'ancient', 'century', 'period', 'era', 'civilization'],
      'Literature': ['book', 'author', 'story', 'novel', 'poetry', 'writing', 'literature', 'fiction'],
      'Sports': ['sport', 'game', 'team', 'player', 'competition', 'athletic', 'match', 'tournament']
    };

    // Check which categories match the keywords
    Object.entries(categoryKeywords).forEach(([category, words]) => {
      const matches = keywords.filter(keyword => 
        words.some(catWord => keyword.includes(catWord) || catWord.includes(keyword))
      );
      
      if (matches.length > 0) {
        categories.push(category);
      }
    });

    // Return top 3 categories or default to 'General'
    return categories.slice(0, 3).length > 0 ? categories.slice(0, 3) : ['General'];
  }
}