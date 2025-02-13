import { BaseAIService } from './baseAIService';

export interface SudokuAIResponse {
  explanation: string;
  error?: string;
}

export class SudokuAIService extends BaseAIService {
  private static instance: SudokuAIService;

  private constructor() {
    super();
  }

  public static getInstance(): SudokuAIService {
    if (!SudokuAIService.instance) {
      try {
        SudokuAIService.instance = new SudokuAIService();
      } catch (error) {
        console.error('Error creating SudokuAIService instance:', error);
        throw error;
      }
    }
    return SudokuAIService.instance;
  }

  private createSudokuPrompt(grid: number[][], row: number, col: number): string {
    return `Analyze this Sudoku position at row ${row + 1}, column ${col + 1}:
    
Current grid state (0 represents empty cells):
${grid.map(row => row.join(' ')).join('\n')}

Explain why certain numbers can or cannot go in position (${row + 1},${col + 1}).
Consider:
1. Row constraints
2. Column constraints
3. 3x3 box constraints
4. Strategic implications

Keep the explanation clear and concise.`;
  }

  public async getHint(grid: number[][], row: number, col: number): Promise<SudokuAIResponse> {
    try {
      console.log('Requesting hint from AI...');
      const prompt = this.createSudokuPrompt(grid, row, col);
      console.log('Generated prompt:', prompt);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const hint = response.text();
      console.log('Processed hint:', hint);

      if (!hint) {
        throw new Error('Empty response from AI');
      }

      return {
        explanation: this.formatResponse(hint)
      };
    } catch (error) {
      console.error('Error getting AI hint:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      throw error;
    }
  }
}
