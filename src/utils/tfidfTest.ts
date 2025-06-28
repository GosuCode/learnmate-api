import { TFIDFService } from '../services/tfidfService';

// Sample content for testing
const sampleContent = `
Machine learning is a subset of artificial intelligence that focuses on the development of computer programs that can access data and use it to learn for themselves. The process of learning begins with observations or data, such as examples, direct experience, or instruction, in order to look for patterns in data and make better decisions in the future based on the examples that we provide. The primary aim is to allow the computers learn automatically without human intervention or assistance and adjust actions accordingly.

There are several types of machine learning algorithms, each with their own strengths and weaknesses. Supervised learning involves training a model on a labeled dataset, where the correct answers are provided. Unsupervised learning, on the other hand, works with unlabeled data and tries to find hidden patterns or structures. Reinforcement learning is a type of learning where an agent learns to behave in an environment by performing actions and seeing the results.

Deep learning is a subset of machine learning that uses neural networks with multiple layers to model and understand complex patterns. These neural networks are inspired by the human brain and can process large amounts of data to identify patterns that might not be obvious to humans. Deep learning has been particularly successful in areas such as image recognition, natural language processing, and speech recognition.

The applications of machine learning are vast and growing. In healthcare, machine learning algorithms can help diagnose diseases, predict patient outcomes, and personalize treatment plans. In finance, they can detect fraudulent transactions, assess credit risk, and optimize trading strategies. In transportation, machine learning powers autonomous vehicles and optimizes traffic flow. The technology is also widely used in recommendation systems, such as those used by Netflix and Amazon to suggest content to users.

Despite its many benefits, machine learning also presents challenges. One major concern is the need for large amounts of high-quality data to train effective models. Another challenge is ensuring that the models are fair and unbiased, as they can perpetuate existing prejudices in the training data. Additionally, there are concerns about the interpretability of machine learning models, particularly deep learning models, which can be difficult to understand and explain.
`;

export function testTFIDF() {
  const tfidfService = new TFIDFService();
  
  console.log('=== TF-IDF Summarization Test ===\n');
  
  // Test basic summarization
  const summary = tfidfService.summarize(sampleContent, {
    maxSentences: 3,
    minSentenceLength: 10,
    maxSummaryLength: 300
  });
  
  console.log('📝 Summary:');
  console.log(summary.summary);
  console.log('\n🔑 Key Points:');
  summary.keyPoints.forEach((point, index) => {
    console.log(`${index + 1}. ${point}`);
  });
  console.log(`\n📊 Stats: ${summary.wordCount} words, ${summary.sentenceCount} sentences`);
  
  // Test detailed analysis
  console.log('\n=== Detailed Analysis ===\n');
  const analysis = tfidfService.analyze(sampleContent);
  
  console.log('🏆 Top 10 Words by TF-IDF Score:');
  analysis.topWords.slice(0, 10).forEach((word, index) => {
    console.log(`${index + 1}. "${word.word}" - Score: ${word.tfidf.toFixed(4)}`);
  });
  
  console.log('\n📈 Top 5 Sentences by Score:');
  analysis.sentenceScores.slice(0, 5).forEach((sentence, index) => {
    console.log(`${index + 1}. Score: ${sentence.score.toFixed(4)}`);
    console.log(`   "${sentence.sentence.slice(0, 100)}..."`);
    console.log('');
  });
  
  console.log(`📊 Total unique words: ${Object.keys(analysis.wordFrequency).length}`);
  console.log(`📊 Total sentences: ${analysis.sentenceScores.length}`);
  
  return { summary, analysis };
}

// Run test if this file is executed directly
if (require.main === module) {
  testTFIDF();
} 