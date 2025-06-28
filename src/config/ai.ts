export interface AIConfig {
  openai: {
    apiKey: string;
    baseUrl: string;
  };
  gemini: {
    apiKey: string;
    baseUrl: string;
  };
}

export const aiConfig: AIConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    baseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
  },
}; 