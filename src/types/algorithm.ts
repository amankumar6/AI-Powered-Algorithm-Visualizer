export type AlgorithmType = 'sorting' | 'pathfinding' | 'sudoku';

export interface Algorithm {
  name: string;
  description: string;
  timeComplexity: {
    best: string;
    average: string;
    worst: string;
  };
  spaceComplexity: string;
  category: AlgorithmType;
}

export interface SortingAlgorithm extends Algorithm {
  category: 'sorting';
  fn: (arr: number[]) => number[];
}

export interface PathfindingAlgorithm extends Algorithm {
  category: 'pathfinding';
  fn: (source: [number, number], target: [number, number]) => [number, number][];
}

export interface SudokuAlgorithm extends Algorithm {
  category: 'sudoku';
  fn: (board: number[][]) => number[][];
}
