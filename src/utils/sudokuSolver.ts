type StepType = 'try' | 'place' | 'backtrack';

type SudokuStep = {
  position: [number, number];
  value: number;
  type: StepType;
  description: string;
  grid: number[][];
};

export class SudokuSolver {
  private grid: number[][];
  private steps: SudokuStep[] = [];
  private solving: boolean = false;
  private onStepCallback?: (step: SudokuStep) => Promise<void>;

  constructor(initialGrid?: number[][], onStep?: (step: SudokuStep) => Promise<void>) {
    this.grid = initialGrid ? this.cloneGrid(initialGrid) : Array(9).fill(null).map(() => Array(9).fill(0));
    this.onStepCallback = onStep;
    
    // Validate initial grid
    if (initialGrid) {
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (initialGrid[i][j] !== 0) {
            // Temporarily set cell to 0 to check if the number is valid
            const temp = this.grid[i][j];
            this.grid[i][j] = 0;
            if (!this.isValid(i, j, temp)) {
              throw new Error('Invalid initial grid configuration');
            }
            this.grid[i][j] = temp;
          }
        }
      }
    }
  }

  private cloneGrid(grid: number[][]): number[][] {
    return grid.map(row => [...row]);
  }

  private async addStep(row: number, col: number, value: number, type: StepType, description: string) {
    if (!this.solving) return;

    // Create the step with current grid state
    const step: SudokuStep = {
      position: [row, col],
      value,
      type,
      description,
      grid: this.cloneGrid(this.grid)
    };

    // Update the grid after creating the step
    if (type === 'place' || type === 'try') {
      if (row >= 0 && col >= 0) {  // Only update if valid position
        this.grid[row][col] = value;
      }
    } else if (type === 'backtrack') {
      if (row >= 0 && col >= 0) {  // Only update if valid position
        this.grid[row][col] = 0;
      }
    }

    // Add to steps array
    this.steps.push(step);

    // Call the callback if provided
    if (this.onStepCallback && this.solving) {
      await this.onStepCallback(step);
    }
  }

  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  stop() {
    this.solving = false;
  }

  private isValid(row: number, col: number, num: number): boolean {
    // Skip if cell is not empty and we're not checking for the same number
    if (this.grid[row][col] !== 0 && this.grid[row][col] !== num) return false;

    // Check row
    for (let x = 0; x < 9; x++) {
      if (x !== col && this.grid[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
      if (x !== row && this.grid[x][col] === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if ((boxRow + i !== row || boxCol + j !== col) && 
            this.grid[boxRow + i][boxCol + j] === num) {
          return false;
        }
      }
    }

    return true;
  }

  findEmptyCell(): [number, number] | null {
    // First try cells with fewer candidates
    const emptyCells: Array<[number, number, number]> = [];
    
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (this.grid[i][j] === 0) {
          const candidates = this.getCandidates(i, j);
          // If a cell has no candidates, prioritize it to fail fast
          if (candidates.length === 0) {
            return [i, j];
          }
          emptyCells.push([i, j, candidates.length]);
        }
      }
    }
    
    if (emptyCells.length === 0) return null;
    
    // Sort by number of candidates (ascending)
    emptyCells.sort((a, b) => a[2] - b[2]);
    return [emptyCells[0][0], emptyCells[0][1]];
  }

  async solve(): Promise<boolean> {
    if (this.solving) return false;
    this.solving = true;
    this.steps = [];
    
    try {
      const success = await this.solveCell();
      if (success && this.solving) {
        // Add final step without modifying the grid
        const finalStep: SudokuStep = {
          position: [-1, -1],
          value: -1,
          type: 'place',
          description: 'Solution found!',
          grid: this.cloneGrid(this.grid)
        };
        this.steps.push(finalStep);
        if (this.onStepCallback) {
          await this.onStepCallback(finalStep);
        }
      }
      return success;
    } finally {
      this.solving = false;
    }
  }

  private async solveCell(): Promise<boolean> {
    if (!this.solving) return false;
    
    const emptyCell = this.findEmptyCell();
    if (!emptyCell) return true;  // No empty cells left = solved!

    const [row, col] = emptyCell;
    const candidates = this.getCandidates(row, col);

    for (const num of candidates) {
      if (!this.solving) return false;

      // Try placing the number
      await this.addStep(
        row, 
        col, 
        num, 
        'try',
        `Trying ${num} at position (${row + 1}, ${col + 1})`
      );

      this.grid[row][col] = num;
      await this.addStep(
        row, 
        col, 
        num, 
        'place',
        `Placed ${num} at position (${row + 1}, ${col + 1})`
      );

      if (await this.solveCell()) {
        return true;
      }

      if (!this.solving) return false;

      // If placing num didn't work, backtrack
      this.grid[row][col] = 0;
      await this.addStep(
        row, 
        col, 
        0, 
        'backtrack',
        `Backtracking: removing ${num} from position (${row + 1}, ${col + 1})`
      );
    }

    return false;
  }

  getCandidates(row: number, col: number): number[] {
    if (this.grid[row][col] !== 0) return [];
    
    const candidates: number[] = [];
    for (let num = 1; num <= 9; num++) {
      if (this.isValid(row, col, num)) {
        candidates.push(num);
      }
    }
    return candidates;
  }

  getSteps(): SudokuStep[] {
    return [...this.steps];
  }

  getGrid(): number[][] {
    return this.cloneGrid(this.grid);
  }

  setGrid(newGrid: number[][]): void {
    this.grid = this.cloneGrid(newGrid);
    this.steps = [];
  }

  generatePuzzle(difficulty: 'easy' | 'medium' | 'hard' = 'medium'): void {
    // Start with an empty grid
    this.grid = Array(9).fill(null).map(() => Array(9).fill(0));
    this.steps = [];

    // Fill in a complete solution
    this.fillGrid();

    // Store the complete solution
    const solution = this.cloneGrid(this.grid);

    // Remove numbers based on difficulty
    const cellsToRemove = {
      easy: 40,
      medium: 50,
      hard: 60
    }[difficulty];

    // Create a list of all positions and shuffle it
    const positions = this.shuffle(
      Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number])
    );

    // Remove numbers while ensuring unique solution
    let removed = 0;
    for (const [row, col] of positions) {
      if (removed >= cellsToRemove) break;

      const temp = this.grid[row][col];
      this.grid[row][col] = 0;

      // Make a copy of the grid
      const gridCopy = this.cloneGrid(this.grid);
      
      // Try to solve the puzzle
      let solutions = 0;
      this.solving = true;
      this.solveForUniqueness(gridCopy, (grid) => {
        solutions++;
        return solutions > 1;
      });
      this.solving = false;

      // If there's more than one solution, put the number back
      if (solutions > 1) {
        this.grid[row][col] = temp;
      } else {
        removed++;
      }
    }
  }

  private fillGrid(): boolean {
    const emptyCell = this.findEmptyCell();
    if (!emptyCell) return true;

    const [row, col] = emptyCell;
    const numbers = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (const num of numbers) {
      if (this.isValid(row, col, num)) {
        this.grid[row][col] = num;
        if (this.fillGrid()) {
          return true;
        }
        this.grid[row][col] = 0;
      }
    }

    return false;
  }

  private solveForUniqueness(grid: number[][], onSolutionFound: (grid: number[][]) => boolean): boolean {
    const emptyCell = this.findEmptyCellInGrid(grid);
    if (!emptyCell) {
      return onSolutionFound(grid);
    }

    const [row, col] = emptyCell;
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    for (const num of numbers) {
      if (this.isValidInGrid(grid, row, col, num)) {
        grid[row][col] = num;
        if (this.solveForUniqueness(grid, onSolutionFound)) {
          return true;
        }
        grid[row][col] = 0;
      }
    }

    return false;
  }

  private findEmptyCellInGrid(grid: number[][]): [number, number] | null {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (grid[i][j] === 0) return [i, j];
      }
    }
    return null;
  }

  private isValidInGrid(grid: number[][], row: number, col: number, num: number): boolean {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (x !== col && grid[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
      if (x !== row && grid[x][col] === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if ((boxRow + i !== row || boxCol + j !== col) && 
            grid[boxRow + i][boxCol + j] === num) {
          return false;
        }
      }
    }

    return true;
  }
}
