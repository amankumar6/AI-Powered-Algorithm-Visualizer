import { useState, useEffect, useCallback, useRef } from 'react'
import { SudokuSolver } from '../../utils/sudokuSolver'
import { SudokuAIService } from '../../services/ai/sudokuAIService';
import { SudokuRecognitionService } from '../../services/ai/sudokuRecognitionService';
import VisualizerHeader from '../common/VisualizerHeader';

interface SudokuVisualizerProps {
  onBack: () => void
}

const EMPTY_GRID = Array(9).fill(null).map(() => Array(9).fill(0))
const DEFAULT_SPEED = 50 // ms

export default function SudokuVisualizer({ onBack }: SudokuVisualizerProps) {
  const [grid, setGrid] = useState<number[][]>(EMPTY_GRID)
  const [isPlayMode, setIsPlayMode] = useState(false)
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const solverRef = useRef<SudokuSolver | null>(null)
  const recognitionServiceRef = useRef<SudokuRecognitionService | null>(null)
  const aiService = useRef<SudokuAIService | null>(null)
  const [highlightedCell, setHighlightedCell] = useState<{
    position: [number, number];
    type: 'try' | 'place' | 'backtrack' | null;
  }>({ position: [-1, -1], type: null })
  const [animationSpeed, setAnimationSpeed] = useState(DEFAULT_SPEED)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [message, setMessage] = useState<string>('')
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hint, setHint] = useState<string>('');
  const isFirstRender = useRef(true);

  // Initialize services
  useEffect(() => {
    try {
      aiService.current = SudokuAIService.getInstance();
      recognitionServiceRef.current = SudokuRecognitionService.getInstance();
    } catch (error) {
      console.error('Failed to initialize services:', error);
      setMessage('Service initialization failed. Some features may be limited.');
    }
  }, []);

  // Track original puzzle numbers
  const [originalNumbers, setOriginalNumbers] = useState<boolean[][]>(
    Array(9).fill(null).map(() => Array(9).fill(false))
  );

  // Track conflicts in play mode
  const [conflicts, setConflicts] = useState<boolean[][]>(
    Array(9).fill(null).map(() => Array(9).fill(false))
  );

  // Initialize solver with step callback
  useEffect(() => {
    solverRef.current = new SudokuSolver(undefined, async (step) => {
      setGrid(step.grid);
      setMessage(step.description);
      if (step.position[0] !== -1) {
        setHighlightedCell({
          position: step.position,
          type: step.type
        });
      } else {
        setHighlightedCell({ position: [-1, -1], type: null });
      }

      await new Promise(resolve => setTimeout(resolve, animationSpeed));
    });
  }, [animationSpeed]);

  // Check if a number conflicts with row, column, or grid
  const hasConflict = (row: number, col: number, num: number, grid: number[][]) => {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (x !== col && grid[row][x] === num) return true;
    }
    // Check column
    for (let x = 0; x < 9; x++) {
      if (x !== row && grid[x][col] === num) return true;
    }
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if ((boxRow + i !== row || boxCol + j !== col) && 
            grid[boxRow + i][boxCol + j] === num) {
          return true;
        }
      }
    }
    return false;
  };

  // Update conflicts for the entire grid
  const updateConflicts = (newGrid: number[][]) => {
    const newConflicts = Array(9).fill(null).map(() => Array(9).fill(false));
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (newGrid[i][j] !== 0 && !originalNumbers[i][j]) {
          newConflicts[i][j] = hasConflict(i, j, newGrid[i][j], newGrid);
        }
      }
    }
    setConflicts(newConflicts);
  };

  const handleCellClick = (row: number, col: number) => {
    if (isRunning) return;
    setSelectedCell([row, col]);
  };

  const handleNumberInput = (number: number) => {
    if (!selectedCell || isRunning || !solverRef.current) return;
    const [row, col] = selectedCell;
    
    if (originalNumbers[row][col]) return; // Don't allow modifying original numbers
    
    const newGrid = grid.map(row => [...row]);
    newGrid[row][col] = number;
    setGrid(newGrid);
    solverRef.current.setGrid(newGrid);
    updateConflicts(newGrid);
    setMessage('');
  };

  const requestHint = async () => {
    if (!selectedCell) {
      setMessage('Please select a cell first to get a hint.');
      return;
    }

    const [row, col] = selectedCell;
    if (originalNumbers[row][col]) {
      setMessage('This is an original number - no hint needed!');
      return;
    }

    if (!aiService.current) {
      setMessage('AI service is not available. Please try again later.');
      return;
    }

    setIsLoadingHint(true);
    try {
      const result = await aiService.current.getHint(grid, row, col);
      
      if (result.error) {
        setMessage(`Error: ${result.error}`);
      } else {
        setMessage(result.explanation);
      }
    } catch (error) {
      console.error('Error getting hint:', error);
      setMessage('Sorry, I couldn\'t generate a hint right now. Please try again.');
    } finally {
      setIsLoadingHint(false);
    }
  };

  const generatePuzzle = useCallback(() => {
    if (isRunning || !solverRef.current) return;
    setIsRunning(true);
    setHighlightedCell({ position: [-1, -1], type: null });
    setMessage('');
    
    try {
      solverRef.current.generatePuzzle(difficulty);
      const newGrid = solverRef.current.getGrid();
      setGrid(newGrid);
      
      // Mark original numbers
      const newOriginalNumbers = Array(9).fill(null).map(() => Array(9).fill(false));
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (newGrid[i][j] !== 0) {
            newOriginalNumbers[i][j] = true;
          }
        }
      }
      setOriginalNumbers(newOriginalNumbers);
      setConflicts(Array(9).fill(null).map(() => Array(9).fill(false)));
      
    } catch (error) {
      setMessage('Error generating puzzle. Please try again.');
    }
    
    setIsRunning(false);
  }, [difficulty, isRunning]);

  const startVisualization = async () => {
    if (isRunning || !solverRef.current) return;
    
    try {
      setIsRunning(true);
      setMessage('Starting visualization...');
      setHighlightedCell({ position: [-1, -1], type: null });
      
      // Create a new solver with the current grid and visualization callback
      const currentGrid = grid.map(row => [...row]); // Clone current grid
      solverRef.current = new SudokuSolver(currentGrid, async (step) => {
        setGrid(step.grid);
        setMessage(step.description);
        if (step.position[0] !== -1) {
          setHighlightedCell({
            position: step.position,
            type: step.type
          });
        } else {
          setHighlightedCell({ position: [-1, -1], type: null });
        }
        await new Promise(resolve => setTimeout(resolve, animationSpeed));
      });
      
      // Try to solve
      const success = await solverRef.current.solve();
      if (!success) {
        setMessage('No solution exists for this puzzle');
      } else {
        setMessage('Puzzle solved successfully!');
      }
    } catch (error) {
      console.error('Solving error:', error);
      setMessage('An error occurred during solving');
    } finally {
      setIsRunning(false);
    }
  };

  const stopVisualization = () => {
    if (solverRef.current) {
      solverRef.current.stop()
    }
    setIsRunning(false)
    setHighlightedCell({ position: [-1, -1], type: null })
    setMessage('Visualization stopped')
  }

  const getCellStyle = (row: number, col: number) => {
    const isSelected = selectedCell?.[0] === row && selectedCell?.[1] === col;
    const isHighlighted = highlightedCell.position[0] === row && highlightedCell.position[1] === col;
    const isOriginal = originalNumbers[row][col];
    const hasConflictState = conflicts[row][col];
    
    const baseStyle = 'w-12 h-12 flex items-center justify-center text-lg font-medium cursor-pointer transition-colors duration-200';
    
    // Border styles remain the same
    const borderStyle = [
      col % 3 === 0 ? 'border-l-4 border-l-gray-800' : 'border-l border-l-gray-300',
      col === 8 ? 'border-r-2 border-r-gray-800' : 'border-r border-r-gray-300',
      row % 3 === 0 ? 'border-t-4 border-t-gray-800' : 'border-t border-t-gray-300',
      row === 8 ? 'border-b-2 border-b-gray-800' : 'border-b border-b-gray-300',
    ].join(' ');
    
    let highlightStyle = '';
    if (isHighlighted && highlightedCell.type) {
      switch (highlightedCell.type) {
        case 'try':
          highlightStyle = 'bg-yellow-200';
          break;
        case 'place':
          highlightStyle = 'bg-green-200';
          break;
        case 'backtrack':
          highlightStyle = 'bg-red-200';
          break;
      }
    } else if (isSelected) {
      highlightStyle = 'bg-blue-100';
    }

    // Style for original numbers and conflicts
    let textStyle = isOriginal ? 'text-gray-900 font-bold' : 'text-blue-600';
    if (hasConflictState) {
      textStyle = 'text-red-600';
    }
    
    return `${baseStyle} ${borderStyle} ${highlightStyle} ${textStyle} hover:bg-gray-50`;
  };

  const loadingSpinnerStyle = {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
    marginRight: '8px'
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      generatePuzzle()
    }
  }, [generatePuzzle])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !recognitionServiceRef.current) {
      setMessage('No file selected or recognition service not available');
      return;
    }

    try {
      setIsProcessingImage(true);
      setMessage('Processing Sudoku image...');
      
      const recognizedGrid = await recognitionServiceRef.current.recognizeGrid(file);
      
      // Update the grid and mark original numbers
      setGrid(recognizedGrid);
      const newOriginalNumbers = Array(9).fill(null).map(() => Array(9).fill(false));
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (recognizedGrid[i][j] !== 0) {
            newOriginalNumbers[i][j] = true;
          }
        }
      }
      setOriginalNumbers(newOriginalNumbers);
      setMessage('Sudoku puzzle loaded successfully!');
      
      // Reset any previous game state
      setIsRunning(false);
      setHighlightedCell({ position: [-1, -1], type: null });
      
    } catch (error) {
      console.error('Error processing image:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to process image. Please try again.');
      // Reset the file input
      const fileInput = document.getElementById('sudoku-image-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } finally {
      setIsProcessingImage(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-background">
      <VisualizerHeader title="Sudoku Visualizer" onBack={onBack} />
      
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <select
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          {!isPlayMode && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Speed:</span>
              <input
                type="range"
                min="1"
                max="100"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
                className="w-32"
              />
              <span className="text-sm text-gray-600">{animationSpeed}ms</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            className={`px-4 py-2 rounded-md font-medium ${
              isPlayMode
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => {
              setIsPlayMode(!isPlayMode);
              if (!isPlayMode) {
                generatePuzzle();
              }
            }}
          >
            Play Mode: {isPlayMode ? 'ON' : 'OFF'}
          </button>

          <button
            className="px-4 py-2 bg-emerald-500 text-white rounded-md font-medium hover:bg-emerald-600"
            onClick={generatePuzzle}
            disabled={isRunning}
          >
            Generate New Puzzle
          </button>

          {isPlayMode ? (
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={requestHint}
              disabled={!selectedCell || isRunning || isLoadingHint}
            >
              {isLoadingHint ? (
                <span>
                  <span style={loadingSpinnerStyle}>⭮</span>
                  Getting AI Hint...
                </span>
              ) : (
                'Get AI Hint'
              )}
            </button>
          ) : (
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600"
              onClick={startVisualization}
              disabled={isRunning}
            >
              Solve
            </button>
          )}
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="sudoku-image-input"
              disabled={isProcessingImage || isRunning}
            />
            <label
              htmlFor="sudoku-image-input"
              className={`px-4 py-2 rounded bg-purple-500 text-white cursor-pointer ${
                (isProcessingImage || isRunning) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isProcessingImage ? 'Processing...' : 'Upload Sudoku Image'}
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-6">
        <div className="bg-surface rounded-lg shadow-lg p-6">
          <div className={`grid grid-cols-9 gap-0 bg-white ${!isPlayMode ? 'border-2 border-gray-800' : ''}`}>
            {grid.map((row, rowIndex) => (
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={getCellStyle(rowIndex, colIndex)}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {cell || ''}
                </div>
              ))
            ))}
          </div>

          {isPlayMode && (
            <div className="mt-4 grid grid-cols-9 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                <button
                  key={number}
                  className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-lg font-medium hover:bg-gray-200"
                  onClick={() => handleNumberInput(number)}
                  disabled={!selectedCell || isRunning}
                >
                  {number}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step visualization legend - commented out but keeping the logic
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="inline-block w-4 h-4 bg-yellow-200"></span> Try
          <span className="inline-block w-4 h-4 bg-green-200 ml-4"></span> Place
          <span className="inline-block w-4 h-4 bg-red-200 ml-4"></span> Backtrack
        </div>
        */}

        {message && (
          <div className="bg-surface rounded-lg shadow-sm p-4 w-full max-w-2xl">
            <p className="text-gray-600">{message}</p>
          </div>
        )}
      </div>
    </div>
  )
}
