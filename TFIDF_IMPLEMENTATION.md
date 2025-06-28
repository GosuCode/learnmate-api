# TF-IDF Implementation for LearnMate

This document describes the custom TF-IDF (Term Frequency-Inverse Document Frequency) implementation integrated into the LearnMate backend for intelligent content summarization and analysis.

## 🎯 Overview

The TF-IDF algorithm is a statistical method used to evaluate the importance of words in a document relative to a collection of documents. In LearnMate, we use it to:

- **Generate intelligent summaries** by identifying the most important sentences
- **Extract key points** from content
- **Categorize content** based on keyword analysis
- **Provide detailed text analysis** for educational insights

## 🏗️ Architecture

### Core Components

1. **`TFIDFService`** (`src/services/tfidfService.ts`)
   - Main service class implementing the TF-IDF algorithm
   - Handles text preprocessing, scoring, and analysis

2. **`AIService`** (`src/services/aiService.ts`)
   - Integrates TF-IDF with external AI services
   - Provides fallback summarization when external APIs are unavailable

3. **`aiController`** (`src/controllers/aiController.ts`)
   - HTTP endpoints for TF-IDF functionality
   - Handles request/response formatting

## 🔧 Algorithm Implementation

### 1. Text Preprocessing

```typescript
private tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 0)
    .filter(word => !this.stopWords.has(word)); // Remove stop words
}
```

**Features:**

- Converts to lowercase
- Removes punctuation
- Filters out stop words (common words like "the", "and", "is")
- Handles whitespace normalization

### 2. Sentence Splitting

```typescript
private splitSentences(text: string): string[] {
  const sentences = text
    .replace(/([.!?])\s*(?=[A-Z])/g, '$1|') // Split on sentence endings
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return sentences;
}
```

**Features:**

- Handles multiple sentence ending punctuation (.!?)
- Maintains sentence boundaries
- Filters empty sentences

### 3. Term Frequency (TF) Calculation

```typescript
private computeTF(words: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  const total = words.length;

  words.forEach(word => {
    tf[word] = (tf[word] || 0) + 1;
  });

  // Normalize by total word count
  Object.keys(tf).forEach(word => {
    tf[word] = tf[word] / total;
  });

  return tf;
}
```

**Formula:** `TF(word) = (Number of times word appears in sentence) / (Total words in sentence)`

### 4. Inverse Document Frequency (IDF) Calculation

```typescript
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
```

**Formula:** `IDF(word) = log(Total sentences / Number of sentences containing the word)`

### 5. Sentence Scoring

```typescript
private scoreSentences(sentences: string[], tokenizedSentences: string[][], idf: Record<string, number>) {
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

    return { sentence: sentences[index], score, index };
  });
}
```

**Formula:** `Sentence Score = Σ(TF(word) × IDF(word)) / Sentence Length`

## 🚀 API Endpoints

### 1. Generate Summary

```http
POST /api/ai/summarize
Content-Type: application/json

{
  "content": "Your text content here...",
  "options": {
    "maxLength": 500
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "summary": "Generated summary text...",
    "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
    "wordCount": 150
  },
  "message": "Summary generated successfully using TF-IDF"
}
```

### 2. Categorize Content

```http
POST /api/ai/categorize
Content-Type: application/json

{
  "content": "Your text content here..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "categories": ["Technology", "Education", "Science"],
    "confidence": 0.85
  },
  "message": "Content categorized successfully using TF-IDF analysis"
}
```

### 3. Analyze Content

```http
POST /api/ai/analyze
Content-Type: application/json

{
  "content": "Your text content here..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "wordFrequency": { "word1": 5, "word2": 3 },
    "sentenceScores": [{ "sentence": "Sentence text...", "score": 0.1234 }],
    "topWords": [{ "word": "important", "tfidf": 0.5678 }],
    "totalWords": 150,
    "totalSentences": 10
  },
  "message": "Content analysis completed successfully"
}
```

## ⚙️ Configuration Options

### Summary Options

```typescript
interface TFIDFSummaryOptions {
  maxSentences?: number; // Maximum sentences in summary (default: 3)
  minSentenceLength?: number; // Minimum sentence length (default: 10)
  maxSummaryLength?: number; // Maximum summary length (default: 500)
  removeStopWords?: boolean; // Remove stop words (default: true)
}
```

### Adaptive Parameters

- **Sentence Count**: Automatically adjusts based on content length
- **Summary Length**: Configurable maximum length with truncation
- **Stop Words**: Comprehensive list of common English stop words

## 📊 Performance Features

### 1. Stop Word Filtering

- Removes 50+ common English stop words
- Improves focus on meaningful content
- Reduces noise in analysis

### 2. Sentence Length Normalization

- Prevents bias towards longer sentences
- Ensures fair scoring across different sentence lengths

### 3. Adaptive Summarization

- Automatically adjusts sentence count based on content length
- Maintains readability and coherence

### 4. Key Point Extraction

- Extracts meaningful phrases from top-scoring sentences
- Provides structured insights for learning

## 🧪 Testing

Run the TF-IDF test to see the algorithm in action:

```bash
# Compile and run the test
npx ts-node src/utils/tfidfTest.ts
```

**Sample Output:**

```
=== TF-IDF Summarization Test ===

📝 Summary:
Machine learning is a subset of artificial intelligence that focuses on the development of computer programs that can access data and use it to learn for themselves. Deep learning is a subset of machine learning that uses neural networks with multiple layers to model and understand complex patterns. The applications of machine learning are vast and growing.

🔑 Key Points:
1. Machine learning is a subset of artificial intelligence
2. Deep learning is a subset of machine learning
3. The applications of machine learning are vast

📊 Stats: 45 words, 3 sentences

=== Detailed Analysis ===

🏆 Top 10 Words by TF-IDF Score:
1. "learning" - Score: 0.1234
2. "machine" - Score: 0.0987
3. "neural" - Score: 0.0876
...
```

## 🔄 Integration with External AI

The TF-IDF implementation serves as:

1. **Primary Summarization Method**: Fast, reliable, and privacy-preserving
2. **Fallback for External APIs**: When OpenAI/Gemini are unavailable
3. **Content Analysis Tool**: Provides detailed insights for categorization
4. **Educational Enhancement**: Helps students understand text structure

## 🎓 Educational Benefits

### For Students:

- **Quick Understanding**: Get key points from long texts
- **Content Analysis**: Understand what makes content important
- **Learning Aid**: Focus on the most relevant information

### For Educators:

- **Content Assessment**: Evaluate text complexity and importance
- **Curriculum Planning**: Identify key concepts in materials
- **Student Support**: Provide targeted learning assistance

## 🔮 Future Enhancements

1. **Multi-language Support**: Extend to other languages
2. **Domain-specific Stop Words**: Customize for academic subjects
3. **Advanced Categorization**: Machine learning-based classification
4. **Performance Optimization**: Caching and parallel processing
5. **Interactive Analysis**: Real-time text analysis tools

## 📝 Usage Examples

### Basic Summarization

```typescript
const tfidfService = new TFIDFService();
const summary = tfidfService.summarize(content, {
  maxSentences: 3,
  maxSummaryLength: 300,
});
```

### Detailed Analysis

```typescript
const analysis = tfidfService.analyze(content);
console.log("Top words:", analysis.topWords);
console.log("Sentence scores:", analysis.sentenceScores);
```

### Custom Configuration

```typescript
const summary = tfidfService.summarize(content, {
  maxSentences: 5,
  minSentenceLength: 15,
  maxSummaryLength: 600,
  removeStopWords: false,
});
```

This TF-IDF implementation provides LearnMate with a robust, efficient, and educational-focused text analysis system that enhances the learning experience while maintaining privacy and reliability.
