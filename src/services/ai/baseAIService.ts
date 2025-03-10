import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { AI_GENERATION_CONFIG, getAIConfig } from '../config/aiConfig';

export abstract class BaseAIService {
  protected genAI: GoogleGenerativeAI;
  protected model: GenerativeModel;

  constructor() {
    const API_KEY = getAIConfig();
    
    try {
      this.genAI = new GoogleGenerativeAI(API_KEY);
      this.model = this.genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: AI_GENERATION_CONFIG,
      });
      console.log('AI model initialized successfully');
    } catch (error) {
      console.error('Error initializing AI:', error);
      throw error;
    }
  }

  protected formatResponse(text: string): string {
    return text.trim()
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/\\n/g, '\n'); // Replace escaped newlines
  }
}
