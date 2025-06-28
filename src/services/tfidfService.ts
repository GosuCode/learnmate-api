export interface TFIDFSummaryOptions {
  maxSentences?: number;
  minSentenceLength?: number;
  maxSummaryLength?: number;
  removeStopWords?: boolean;
}

export interface TFIDFResult {
  summary: string;
  keyPoints: string[];
  wordCount: number;
  sentenceCount: number;
  scores: Array<{ sentence: string; score: number; index: number }>;
}

export class TFIDFService {
  private stopWords: Set<string>;

  constructor() {
    // Common English stop words
    this.stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
      'had', 'what', 'said', 'each', 'which', 'she', 'do', 'how', 'their',
      'if', 'up', 'out', 'many', 'then', 'them', 'these', 'so', 'some',
      'her', 'would', 'make', 'like', 'into', 'him', 'time', 'two', 'more',
      'go', 'no', 'way', 'could', 'my', 'than', 'first', 'been', 'call',
      'who', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get',
      'come', 'made', 'may', 'part'
    ]);
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 0)
      .filter(word => !this.stopWords.has(word)); // Remove stop words
  }

  /**
   * Tokenize text into words without removing stop words
   */
  private tokenizeWithoutStopWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Split text into sentences
   */
  private splitSentences(text: string): string[] {
    // Improved sentence splitting that handles various punctuation
    const sentences = text
      .replace(/([.!?])\s*(?=[A-Z])/g, '$1|') // Split on sentence endings
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    return sentences;
  }

  /**
   * Compute Term Frequency (TF) for a set of words
   */
  private computeTF(words: string[]): Record<string, number> {
    const tf: Record<string, number> = {};
    const total = words.length;

    if (total === 0) return tf;

    words.forEach(word => {
      tf[word] = (tf[word] || 0) + 1;
    });

    // Normalize by total word count
    Object.keys(tf).forEach(word => {
      tf[word] = tf[word] / total;
    });

    return tf;
  }

  /**
   * Compute Inverse Document Frequency (IDF) across all sentences
   */
  private computeIDF(sentences: string[][]): Record<string, number> {
    const N = sentences.length;
    const df: Record<string, number> = {};

    // Count document frequency for each word
    sentences.forEach(words => {
      const uniqueWords = new Set(words);
      uniqueWords.forEach(word => {
        df[word] = (df[word] || 0) + 1;
      });
    });

    // Compute IDF for each word
    const idf: Record<string, number> = {};
    Object.keys(df).forEach(word => {
      idf[word] = Math.log(N / df[word]);
    });

    return idf;
  }

  /**
   * Score sentences based on TF-IDF values
   */
  private scoreSentences(
    sentences: string[], 
    tokenizedSentences: string[][], 
    idf: Record<string, number>
  ): Array<{ sentence: string; score: number; index: number }> {
    return tokenizedSentences.map((words, index) => {
      const tf = this.computeTF(words);
      let score = 0;

      // Calculate TF-IDF score for each word in the sentence
      Object.keys(tf).forEach(word => {
        const tfidf = tf[word] * (idf[word] || 0);
        score += tfidf;
      });

      // Normalize by sentence length to avoid bias towards longer sentences
      score = score / Math.max(words.length, 1);

      return {
        sentence: sentences[index],
        score,
        index
      };
    });
  }

  /**
   * Extract key points from the most important sentences
   */
  private extractKeyPoints(
    scoredSentences: Array<{ sentence: string; score: number; index: number }>,
    maxPoints: number = 5
  ): string[] {
    // Sort by score and take top sentences
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, maxPoints);

    // Extract key phrases (simple approach: take first part of each sentence)
    return topSentences.map(({ sentence }) => {
      const words = sentence.split(' ');
      const keyPhrase = words.slice(0, Math.min(8, words.length)).join(' ');
      return keyPhrase.endsWith('.') ? keyPhrase.slice(0, -1) : keyPhrase;
    });
  }

  /**
   * Generate summary using TF-IDF algorithm
   */
  public summarize(text: string, options: TFIDFSummaryOptions = {}): TFIDFResult {
    const {
      maxSentences = 3,
      minSentenceLength = 10,
      maxSummaryLength = 500,
      removeStopWords = true
    } = options;

    // Split into sentences
    const rawSentences = this.splitSentences(text);
    
    // Filter out very short sentences
    const filteredSentences = rawSentences.filter(
      sentence => sentence.length >= minSentenceLength
    );

    if (filteredSentences.length === 0) {
      return {
        summary: text.slice(0, maxSummaryLength),
        keyPoints: [],
        wordCount: text.split(/\s+/).length,
        sentenceCount: 0,
        scores: []
      };
    }

    // Tokenize sentences with stop word filtering option
    const tokenizedSentences = filteredSentences.map(sentence => 
      removeStopWords ? this.tokenize(sentence) : this.tokenizeWithoutStopWords(sentence)
    );

    // Compute IDF across all sentences
    const idf = this.computeIDF(tokenizedSentences);

    // Score sentences
    const scoredSentences = this.scoreSentences(
      filteredSentences, 
      tokenizedSentences, 
      idf
    );

    // Select top sentences
    const selectedSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSentences)
      .sort((a, b) => a.index - b.index); // Maintain original order

    // Generate summary
    const summary = selectedSentences
      .map(({ sentence }) => sentence.trim())
      .join(' ');

    // Extract key points
    const keyPoints = this.extractKeyPoints(scoredSentences);

    // Truncate summary if too long
    const finalSummary = summary.length > maxSummaryLength 
      ? summary.slice(0, maxSummaryLength) + '...'
      : summary;

    return {
      summary: finalSummary,
      keyPoints,
      wordCount: finalSummary.split(/\s+/).length,
      sentenceCount: selectedSentences.length,
      scores: scoredSentences
    };
  }

  /**
   * Get detailed analysis of the text
   */
  public analyze(text: string): {
    wordFrequency: Record<string, number>;
    sentenceScores: Array<{ sentence: string; score: number }>;
    topWords: Array<{ word: string; tfidf: number }>;
  } {
    const sentences = this.splitSentences(text);
    const tokenizedSentences = sentences.map(s => this.tokenize(s));
    const idf = this.computeIDF(tokenizedSentences);

    // Compute word frequency
    const wordFrequency: Record<string, number> = {};
    tokenizedSentences.flat().forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });

    // Score sentences
    const sentenceScores = this.scoreSentences(sentences, tokenizedSentences, idf)
      .map(({ sentence, score }) => ({ sentence, score }))
      .sort((a, b) => b.score - a.score);

    // Get top words by TF-IDF
    const allWords = tokenizedSentences.flat();
    const tf = this.computeTF(allWords);
    const topWords = Object.keys(tf)
      .map(word => ({
        word,
        tfidf: tf[word] * (idf[word] || 0)
      }))
      .sort((a, b) => b.tfidf - a.tfidf)
      .slice(0, 20);

    return {
      wordFrequency,
      sentenceScores,
      topWords
    };
  }
} 