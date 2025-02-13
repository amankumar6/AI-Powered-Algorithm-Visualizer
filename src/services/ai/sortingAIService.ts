import { BaseAIService } from './baseAIService';

export interface SortingAnalysisResult {
  analysis: string;
  suggestions: string;
  complexityComparison: string;
}

export class SortingAIService extends BaseAIService {
  private static instance: SortingAIService;

  private constructor() {
    super();
  }

  public static getInstance(): SortingAIService {
    if (!SortingAIService.instance) {
      try {
        SortingAIService.instance = new SortingAIService();
      } catch (error) {
        console.error('Error creating SortingAIService instance:', error);
        throw error;
      }
    }
    return SortingAIService.instance;
  }

  public async analyzeSortingPerformance(data: {
    algorithm: string;
    arraySize: number;
    comparisons: number;
    swaps: number;
    timeInMs: number;
  }): Promise<SortingAnalysisResult> {
    try {
      console.log('Analyzing sorting performance with data:', data);
      const prompt = `Analyze the sorting algorithm performance with these metrics:
Array size: ${data.arraySize}
Comparisons: ${data.comparisons}
Swaps: ${data.swaps}
Time: ${(data.timeInMs / 1000).toFixed(2)} seconds

Provide a detailed analysis in exactly three sections. Start each section with its exact heading:

Performance Analysis:
Analyze if this performance is good or poor. Consider the number of comparisons (${data.comparisons}) and swaps (${data.swaps}) relative to array size (${data.arraySize}).

Algorithm Recommendations:
Based on these metrics, suggest which sorting algorithm would be more efficient and explain why.

Theoretical vs Actual:
Compare these metrics with ${data.algorithm}'s theoretical time complexity O(n log n). Is it performing as expected? Explain any deviations.`;

      console.log('Sending prompt to AI:', prompt);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log('Raw AI response:', text);

      if (!text || typeof text !== 'string') {
        throw new Error('Invalid response from AI service');
      }

      // Extract sections using regex
      const analysisMatch = text.match(/Performance Analysis:\s*([\s\S]*?)(?=Algorithm Recommendations:|$)/i);
      const recommendationsMatch = text.match(/Algorithm Recommendations:\s*([\s\S]*?)(?=Theoretical vs Actual:|$)/i);
      const theoreticalMatch = text.match(/Theoretical vs Actual:\s*([\s\S]*?)$/i);

      const analysis = analysisMatch?.[1]?.trim();
      const recommendations = recommendationsMatch?.[1]?.trim();
      const theoretical = theoreticalMatch?.[1]?.trim();

      console.log('Parsed sections:', { analysis, recommendations, theoretical });

      if (!analysis || !recommendations || !theoretical) {
        console.error('Missing sections in AI response:', {
          hasAnalysis: !!analysis,
          hasRecommendations: !!recommendations,
          hasTheoretical: !!theoretical,
          rawText: text
        });
        throw new Error('Incomplete response from AI service');
      }

      return {
        analysis: analysis,
        suggestions: recommendations,
        complexityComparison: theoretical
      };
    } catch (error) {
      console.error('Error in analyzeSortingPerformance:', error);
      if (error instanceof Error) {
        throw new Error(`AI Analysis failed: ${error.message}`);
      }
      throw new Error('AI Analysis failed with unknown error');
    }
  }
}
