export type NodeType = 'empty' | 'wall' | 'source' | 'target' | 'visited' | 'path';

export interface GridNode {
  row: number;
  col: number;
  type: NodeType;
  isVisited: boolean;
  isPath: boolean;
  distance: number;
  previousNode: GridNode | null;
  fScore?: number;
  gScore?: number;
  hScore?: number;
}

export interface PathfindingState {
  grid: GridNode[][];
  sourceNode: GridNode | null;
  targetNode: GridNode | null;
  isVisualizing: boolean;
  algorithm: 'dijkstra' | 'astar' | 'bfs';
  visualizationSpeed: number;
  executionTime?: number;
  aiAnalysis: {
    algorithmAnalysis: string;
    comparison: string;
    recommendation: string;
  } | null;
  isAnalyzing: boolean;
}

export interface PathfindingVisualizerProps {
  onBack: () => void;
}
