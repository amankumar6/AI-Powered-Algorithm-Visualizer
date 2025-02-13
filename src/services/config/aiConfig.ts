import { GenerationConfig } from '@google/generative-ai';

export const AI_GENERATION_CONFIG: GenerationConfig = {
  maxOutputTokens: 500,
  temperature: 0.9,
  topP: 0.1,
  topK: 16,
};

export const getAIConfig = () => {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!API_KEY) {
    console.error('Gemini API key not found in environment variables');
    throw new Error('API key not configured');
  }
  return API_KEY;
};
