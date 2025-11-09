export interface AIProvider {
  generateContent(prompt: string, options?: AIGenerationOptions): Promise<string>;
  analyzeSentiment(text: string): Promise<SentimentAnalysis>;
  generateHashtags(content: string): Promise<string[]>;
  improveContent(content: string, instructions?: string): Promise<string>;
}

export interface AIGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
}
