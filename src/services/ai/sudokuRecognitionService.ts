import { BaseAIService } from './baseAIService';

export class SudokuRecognitionService extends BaseAIService {
  private static instance: SudokuRecognitionService;

  private constructor() {
    super();
  }

  public static getInstance(): SudokuRecognitionService {
    if (!SudokuRecognitionService.instance) {
      try {
        SudokuRecognitionService.instance = new SudokuRecognitionService();
      } catch (error) {
        console.error('Error creating SudokuRecognitionService instance:', error);
        throw error;
      }
    }
    return SudokuRecognitionService.instance;
  }

  private async preprocessImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  private parseGridFromText(text: string): number[][] {
    try {
      // Remove any extra text and keep only the grid part
      const cleanedText = text.replace(/[^\[\],\d\s]/g, '');
      
      // Parse the grid
      const grid = JSON.parse(cleanedText);
      
      // Validate the structure
      if (!Array.isArray(grid) || 
          grid.length !== 9 || 
          !grid.every(row => Array.isArray(row) && row.length === 9)) {
        throw new Error('Invalid grid structure');
      }

      // Convert all values to numbers, using 0 for empty cells
      return grid.map(row => 
        row.map(cell => {
          const num = Number(cell);
          return isNaN(num) || num < 1 || num > 9 ? 0 : num;
        })
      );
    } catch (error) {
      console.error('Error parsing grid from text:', error);
      throw new Error('Failed to parse Sudoku grid from AI response');
    }
  }

  public async recognizeGrid(imageFile: File): Promise<number[][]> {
    try {
      const base64Image = await this.preprocessImage(imageFile);
      
      const prompt = `Analyze this Sudoku grid image:
      1. Scan the grid cell by cell, left to right, top to bottom
      2. For each cell:
        - If you see a number (1-9), record it
        - If empty, use 0
      3. Return ONLY a 9x9 JSON array
      4. No explanations, just the array

      Important: Double-check each number's position carefully.`;

      let attempts = 0;
      const maxAttempts = 2;
      
      while (attempts < maxAttempts) {
        try {
          const result = await this.visionModel.generateContent([
            prompt,
            {
              inlineData: {
                mimeType: imageFile.type || "image/jpeg",
                data: base64Image
              }
            }
          ]);

          const response = await result.response;
          const text = response.text();
          console.log('Raw AI Response:', text);

          const grid = this.parseGridFromText(text);
          console.log('Parsed Grid:', JSON.stringify(grid));
          
          if (this.isValidSudokuGrid(grid)) {
            return grid;
          }
          
          attempts++;
        } catch (error) {
          console.error(`Attempt ${attempts + 1} failed:`, error);
          attempts++;
        }
      }
      
      throw new Error('Failed to get a valid grid after multiple attempts');
    } catch (error) {
      console.error('Error in recognizeGrid:', error);
      throw error instanceof Error ? error : new Error('Failed to recognize Sudoku grid');
    }
  }

  private isValidSudokuGrid(grid: number[][]): boolean {
    // Check dimensions
    if (grid.length !== 9 || grid.some(row => row.length !== 9)) {
      console.error('Invalid grid dimensions');
      return false;
    }

    // Check if all numbers are valid (0-9)
    if (grid.some(row => row.some(num => num < 0 || num > 9))) {
      console.error('Found numbers outside valid range (0-9)');
      return false;
    }

    // Check rows
    for (let row = 0; row < 9; row++) {
      const seen = new Set<number>();
      for (let col = 0; col < 9; col++) {
        const num = grid[row][col];
        if (num !== 0) {
          if (seen.has(num)) {
            console.error(`Duplicate number ${num} found in row ${row + 1}`);
            return false;
          }
          seen.add(num);
        }
      }
    }

    // Check columns
    for (let col = 0; col < 9; col++) {
      const seen = new Set<number>();
      for (let row = 0; row < 9; row++) {
        const num = grid[row][col];
        if (num !== 0) {
          if (seen.has(num)) {
            console.error(`Duplicate number ${num} found in column ${col + 1}`);
            return false;
          }
          seen.add(num);
        }
      }
    }

    // Check 3x3 boxes
    for (let boxRow = 0; boxRow < 9; boxRow += 3) {
      for (let boxCol = 0; boxCol < 9; boxCol += 3) {
        const seen = new Set<number>();
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const num = grid[boxRow + i][boxCol + j];
            if (num !== 0) {
              if (seen.has(num)) {
                console.error(`Duplicate number ${num} found in 3x3 box at position (${boxRow + 1},${boxCol + 1})`);
                return false;
              }
              seen.add(num);
            }
          }
        }
      }
    }

    return true;
  }
}
