import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { AI_GENERATION_CONFIG, getAIConfig } from '../config/aiConfig';

export abstract class BaseAIService {
  protected genAI: GoogleGenerativeAI;
  protected model: GenerativeModel;
  protected visionModel: GenerativeModel;

  constructor() {
    const API_KEY = getAIConfig();
    
    try {
      this.genAI = new GoogleGenerativeAI(API_KEY);
      this.model = this.genAI.getGenerativeModel({
        model: "gemini-pro",
        generationConfig: AI_GENERATION_CONFIG,
      });
      this.visionModel = this.genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        generationConfig: AI_GENERATION_CONFIG,
      });
      console.log('AI models initialized successfully');
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
