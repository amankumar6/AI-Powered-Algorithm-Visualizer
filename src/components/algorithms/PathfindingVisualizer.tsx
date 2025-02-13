import React, { useState, useCallback, useEffect, useRef } from 'react';
import VisualizerHeader from '../common/VisualizerHeader';
import { GridNode, PathfindingState, PathfindingVisualizerProps } from '../../types/pathfinding';
import { createInitialGrid, generateMaze, dijkstra, astar, bfs, getNodesInShortestPathOrder } from '../../utils/pathFindingAlgorithms';
import { pathfindingAIService } from '../../services/ai/pathfindingAIService';

const GRID_ROWS = 20;
const GRID_COLS = 50;

const PathfindingVisualizer: React.FC<PathfindingVisualizerProps> = ({ onBack }) => {
  const [state, setState] = useState<PathfindingState>({
    grid: createInitialGrid(GRID_ROWS, GRID_COLS),
    sourceNode: null,
    targetNode: null,
    algorithm: 'astar',
    isVisualizing: false,
    visualizationSpeed: 5,
    aiAnalysis: null,
    isAnalyzing: false,
  });
  const [isMouseDown, setIsMousePressed] = useState(false);
  const timeoutIds = useRef<number[]>([]);
  const isMousePressed = useRef(false);

  const handleNodeClick = (row: number, col: number) => {
    if (state.isVisualizing) return;

    const newGrid = [...state.grid];
    const node = newGrid[row][col];

    // If clicking on source or target node, remove it
    if (node === state.sourceNode) {
      node.type = 'empty';
      setState(prev => ({ ...prev, grid: newGrid, sourceNode: null }));
      return;
    }
    if (node === state.targetNode) {
      node.type = 'empty';
      setState(prev => ({ ...prev, grid: newGrid, targetNode: null }));
      return;
    }

    // If no source node exists and not clicking on target, set source
    if (!state.sourceNode && node !== state.targetNode) {
      node.type = 'source';
      setState(prev => ({ ...prev, grid: newGrid, sourceNode: node }));
      return;
    }

    // If no target node exists and not clicking on source, set target
    if (!state.targetNode && node !== state.sourceNode) {
      node.type = 'target';
      setState(prev => ({ ...prev, grid: newGrid, targetNode: node }));
      return;
    }

    // Toggle wall if both source and target are set
    if (node.type === 'wall') {
      node.type = 'empty';
    } else if (node.type === 'empty') {
      node.type = 'wall';
    }
    setState(prev => ({ ...prev, grid: newGrid }));
  };

  const handleMouseDown = (row: number, col: number) => {
    if (state.isVisualizing) return;

    const node = state.grid[row][col];
    if (node !== state.sourceNode && node !== state.targetNode) {
      setIsMousePressed(true);
      isMousePressed.current = true;
      handleWallToggle(row, col);
    }
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (!isMousePressed.current || state.isVisualizing) return;

    const node = state.grid[row][col];
    if (node !== state.sourceNode && node !== state.targetNode) {
      handleWallToggle(row, col);
    }
  };

  const handleMouseUp = () => {
    setIsMousePressed(false);
    isMousePressed.current = false;
  };

  const handleWallToggle = (row: number, col: number) => {
    const newGrid = [...state.grid];
    const node = newGrid[row][col];
    
    if (node !== state.sourceNode && node !== state.targetNode) {
      node.type = node.type === 'wall' ? 'empty' : 'wall';
      setState(prev => ({ ...prev, grid: newGrid }));
    }
  };

  const clearTimeouts = () => {
    timeoutIds.current.forEach(id => window.clearTimeout(id));
    timeoutIds.current = [];
  };

  const resetGridState = () => {
    const newGrid = state.grid.map(row =>
      row.map(node => ({
        ...node,
        distance: Infinity,
        previousNode: null,
        isVisited: false,
        f: Infinity,
        g: Infinity,
        h: Infinity,
        type: node.type === 'visited' || node.type === 'path' ? 'empty' : node.type
      }))
    );
    return newGrid;
  };

  const clearPath = () => {
    if (state.isVisualizing) return;
    const newGrid = resetGridState();
    setState(prev => ({ ...prev, grid: newGrid }));
  };

  const resetGrid = () => {
    if (state.isVisualizing) return;
    clearTimeouts();
    setState(prev => ({ 
      ...prev, 
      grid: createInitialGrid(GRID_ROWS, GRID_COLS),
      sourceNode: null,
      targetNode: null,
      isVisualizing: false 
    }));
  };

  const handleAlgorithmChange = (newAlgorithm: string) => {
    if (state.isVisualizing) return;
    
    // Clear the current path and reset pathfinding properties
    clearPath();
    clearTimeouts();
    
    setState(prev => ({ 
      ...prev, 
      algorithm: newAlgorithm as typeof prev.algorithm,
      grid: resetGridState()
    }));
  };

  const stopVisualization = () => {
    clearTimeouts();
    setState(prev => ({ ...prev, isVisualizing: false }));
  };

  const visualizePathfinding = () => {
    if (!state.sourceNode || !state.targetNode || state.isVisualizing) return;

    // Reset the grid state before starting new visualization
    const newGrid = resetGridState();
    setState(prev => ({ 
      ...prev, 
      isVisualizing: true,
      grid: newGrid
    }));

    const startNode = newGrid[state.sourceNode.row][state.sourceNode.col];
    const finishNode = newGrid[state.targetNode.row][state.targetNode.col];

    let visitedNodesInOrder: GridNode[] = [];
    let nodesInShortestPathOrder: GridNode[] = [];

    switch (state.algorithm) {
      case 'dijkstra':
        visitedNodesInOrder = dijkstra(newGrid, startNode, finishNode);
        break;
      case 'astar':
        visitedNodesInOrder = astar(newGrid, startNode, finishNode);
        break;
      case 'bfs':
        visitedNodesInOrder = bfs(newGrid, startNode, finishNode);
        break;
    }

    nodesInShortestPathOrder = getNodesInShortestPathOrder(finishNode);
    animatePathfinding(visitedNodesInOrder, nodesInShortestPathOrder);
  };

  const animatePathfinding = (visitedNodesInOrder: GridNode[], nodesInShortestPathOrder: GridNode[]) => {
    timeoutIds.current = []; // Reset timeout IDs

    for (let i = 0; i <= visitedNodesInOrder.length; i++) {
      if (i === visitedNodesInOrder.length) {
        const timeoutId = window.setTimeout(() => {
          animateShortestPath(nodesInShortestPathOrder);
        }, state.visualizationSpeed * i);
        timeoutIds.current.push(timeoutId);
        return;
      }

      const timeoutId = window.setTimeout(() => {
        const node = visitedNodesInOrder[i];
        if (node.type !== 'source' && node.type !== 'target') {
          const newGrid = [...state.grid];
          const newNode = { 
            ...newGrid[node.row][node.col], 
            type: 'visited' as const,
            isVisited: true 
          };
          newGrid[node.row][node.col] = newNode;
          setState(prev => ({ ...prev, grid: newGrid }));
        }
      }, state.visualizationSpeed * i);
      timeoutIds.current.push(timeoutId);
    }
  };

  const animateShortestPath = (nodesInShortestPathOrder: GridNode[]) => {
    // Clear visited nodes first
    const newGrid = [...state.grid];
    newGrid.forEach(row => {
      row.forEach(node => {
        if (node.type === 'visited') {
          node.type = 'empty';
        }
      });
    });
    setState(prev => ({ ...prev, grid: newGrid }));

    // Animate the shortest path
    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
      const timeoutId = window.setTimeout(() => {
        const node = nodesInShortestPathOrder[i];
        if (node.type !== 'source' && node.type !== 'target') {
          const newGrid = [...state.grid];
          const newNode = { 
            ...newGrid[node.row][node.col], 
            type: 'path' as const,
            isPath: true,
            isVisited: true 
          };
          newGrid[node.row][node.col] = newNode;
          setState(prev => ({ ...prev, grid: newGrid }));
        }
        if (i === nodesInShortestPathOrder.length - 1) {
          setState(prev => ({ ...prev, isVisualizing: false }));
        }
      }, state.visualizationSpeed * i);
      timeoutIds.current.push(timeoutId);
    }
  };

  const generateRandomMaze = () => {
    if (state.isVisualizing) return;
    clearPath(); // Clear any existing path first
    const newGrid = generateMaze([...state.grid]);
    setState(prev => ({ ...prev, grid: newGrid }));
  };

  const analyzePerformance = async () => {
    if (!state.sourceNode || !state.targetNode) {
      alert('Please set both source and target nodes before analyzing.');
      return;
    }

    if (!state.grid.flat().some(node => node.isVisited)) {
      alert('Please run the visualization first before getting AI analysis.');
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, aiAnalysis: null }));
    try {
      const visitedNodes = state.grid.flat().filter(node => node.isVisited).length;
      const pathNodes = state.grid.flat().filter(node => node.isPath).length;
      const wallNodes = state.grid.flat().filter(node => node.type === 'wall').length;
      const totalNodes = GRID_ROWS * GRID_COLS;

      const analysis = await pathfindingAIService.analyzePathfinding(
        state.algorithm,
        {
          totalNodes,
          wallNodes,
          visitedNodes,
          pathLength: pathNodes,
          executionTime: state.executionTime || 0,
        }
      );

      setState(prev => ({ ...prev, aiAnalysis: analysis }));
    } catch (error) {
      console.error('Error analyzing performance:', error);
      alert('Failed to get AI analysis. Please try again.');
    } finally {
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const renderAnalysis = () => {
    if (state.isAnalyzing) {
      return (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-300 rounded"></div>
            <div className="h-3 bg-gray-300 rounded w-5/6"></div>
            <div className="h-3 bg-gray-300 rounded w-4/6"></div>
          </div>
        </div>
      );
    }

    if (!state.aiAnalysis) return null;

    const comparisons = state.aiAnalysis.comparison.split('\n\n').filter(Boolean);

    return (
      <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-blue-600 border-b pb-2">AI Analysis Results</h3>
        <div className="space-y-6">
          {/* Performance Analysis */}
          <div className="flex gap-2">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">📊</span>
              </div>
            </div>
            <div className="flex-grow">
              <h4 className="font-medium text-gray-800 mb-1">Performance</h4>
              <p className="text-gray-600 leading-relaxed">{state.aiAnalysis.algorithmAnalysis}</p>
            </div>
          </div>

          {/* Algorithm Comparison */}
          <div className="flex gap-2">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-lg">🔄</span>
              </div>
            </div>
            <div className="flex-grow">
              <h4 className="font-medium text-gray-800 mb-2">Algorithm Comparison</h4>
              <div className="space-y-2">
                {comparisons.map((comparison, index) => {
                  const [algo, explanation] = comparison.split(': ');
                  return (
                    <div key={index} className="bg-gray-50 rounded p-2">
                      <span className="font-medium text-gray-700">{algo}:</span>
                      <span className="text-gray-600 ml-1">{explanation}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="flex gap-2">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-lg">⭐</span>
              </div>
            </div>
            <div className="flex-grow">
              <h4 className="font-medium text-gray-800 mb-1">Recommendation</h4>
              <p className="text-gray-600 leading-relaxed">{state.aiAnalysis.recommendation}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <VisualizerHeader title="Pathfinding Visualizer" onBack={onBack} />
      
      <div className="flex flex-col items-center">
        <div className="w-full px-4 mb-4">
          <div className="flex space-x-4 items-center">
            <select
              value={state.algorithm}
              onChange={(e) => handleAlgorithmChange(e.target.value)}
              className="p-2 border rounded text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={state.isVisualizing}
            >
              <option value="astar">A* Algorithm</option>
              <option value="dijkstra">Dijkstra's Algorithm</option>
              <option value="bfs">Breadth-First Search</option>
            </select>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Speed:</span>
              <input
                type="range"
                min="5"
                max="50"
                value={state.visualizationSpeed}
                onChange={(e) => setState(prev => ({ ...prev, visualizationSpeed: parseInt(e.target.value) }))}
                disabled={state.isVisualizing}
                className="w-48"
              />
              <span className="text-sm text-gray-600">{state.visualizationSpeed}ms</span>
            </div>

            {state.isVisualizing ? (
              <button
                onClick={stopVisualization}
                className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={visualizePathfinding}
                disabled={!state.sourceNode || !state.targetNode}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50"
              >
                Visualize
              </button>
            )}

            <button
              onClick={generateRandomMaze}
              disabled={state.isVisualizing}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200 disabled:opacity-50"
            >
              Generate Maze
            </button>

            <button
              onClick={clearPath}
              disabled={state.isVisualizing}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors duration-200 disabled:opacity-50"
            >
              Clear Path
            </button>

            <button
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              onClick={resetGrid}
              disabled={state.isVisualizing}
            >
              Reset
            </button>

            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              onClick={analyzePerformance}
              disabled={state.isVisualizing || state.isAnalyzing || !state.sourceNode || !state.targetNode || !state.grid.flat().some(node => node.isVisited)}
            >
              {state.isAnalyzing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Getting AI Analysis...
                </span>
              ) : 'Get AI Analysis'}
            </button>
          </div>
        </div>

        <div 
          className="grid-container select-none"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${GRID_COLS}, 25px)`,
            width: `${GRID_COLS * 25}px`,
            margin: '0 auto'
          }}
        >
          {state.grid.map((row, rowIdx) => (
            row.map((node, nodeIdx) => (
              <div
                key={`${rowIdx}-${nodeIdx}`}
                onClick={() => handleNodeClick(rowIdx, nodeIdx)}
                onMouseDown={() => handleMouseDown(rowIdx, nodeIdx)}
                onMouseEnter={() => handleMouseEnter(rowIdx, nodeIdx)}
                onMouseUp={handleMouseUp}
                className={`
                  w-6 h-6 border border-gray-100
                  ${node.type === 'wall' ? 'bg-gray-800' : ''}
                  ${node.type === 'source' ? 'bg-green-500' : ''}
                  ${node.type === 'target' ? 'bg-red-500' : ''}
                  ${node.type === 'visited' ? 'bg-blue-400' : ''}
                  ${node.type === 'path' ? 'bg-yellow-400' : ''}
                  ${node.type === 'empty' ? 'bg-white hover:bg-gray-100' : ''}
                  cursor-pointer
                `}
              />
            ))
          ))}
        </div>

        
        {renderAnalysis()}
      </div>
    </div>
  );
};

export default PathfindingVisualizer;
