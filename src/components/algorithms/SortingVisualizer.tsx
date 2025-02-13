import React, { useState, useEffect, useRef, useMemo } from 'react';
import { bubbleSort, quickSort, mergeSort, heapSort, generateRandomArray, SortingStep } from '../../utils/sortingAlgorithms';
import { SortingAIService } from '../../services/ai/sortingAIService';
import VisualizerHeader from '../common/VisualizerHeader';

interface SortingVisualizerProps {
  onBack: () => void;
}

const SortingVisualizer: React.FC<SortingVisualizerProps> = ({ onBack }) => {
  const [array, setArray] = useState<number[]>([]);
  const [arraySize, setArraySize] = useState(50);
  const [speed, setSpeed] = useState(50);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<SortingStep | null>(null);
  const [algorithm, setAlgorithm] = useState<'quicksort' | 'mergesort' | 'bubblesort' | 'heapsort'>('bubblesort');
  const [metrics, setMetrics] = useState<{
    comparisons: number;
    swaps: number;
    startTime: number;
    isComplete: boolean;
  } | null>(null);
  const [analysis, setAnalysis] = useState<{
    analysis: string;
    suggestions: string;
    complexityComparison: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generatorRef = useRef<Generator<SortingStep> | null>(null);
  const timeoutIdRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const aiService = useRef<SortingAIService | null>(null);
  const speedRef = useRef(50);

  useEffect(() => {
    // Initialize AI service
    try {
      aiService.current = SortingAIService.getInstance();
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
    }
    generateNewArray();
    return () => {
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);
      }
      isRunningRef.current = false;
    };
  }, [arraySize]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const generateNewArray = () => {
    console.log('Generating new array...');
    const newArray = generateRandomArray(arraySize);
    setArray(newArray);
    setCurrentStep(null);
    setMetrics(null);
    setAnalysis(null);
    setIsAnalyzing(false);
    isRunningRef.current = false;
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    generatorRef.current = null;
    console.log('New array generated:', newArray);
  };

  const nextStep = () => {
    if (!generatorRef.current || !isRunningRef.current) {
      return false;
    }

    try {
      const { value: step, done } = generatorRef.current.next();

      if (done) {
        isRunningRef.current = false;
        setIsRunning(false);
        
        // Calculate final metrics
        setMetrics(prev => {
          const endTime = performance.now();
          const executionTime = prev ? endTime - prev.startTime : 0;
          
          return {
            comparisons: prev?.comparisons || 0,
            swaps: prev?.swaps || 0,
            startTime: executionTime, // Store actual execution time
            isComplete: true
          };
        });

        // Start AI analysis after metrics are updated
        setIsAnalyzing(true);
        if (aiService.current) {
          // Use setTimeout to ensure we have the latest metrics
          setTimeout(() => {
            setMetrics(currentMetrics => {
              if (!currentMetrics) {
                setIsAnalyzing(false);
                setAnalysis({
                  analysis: 'No metrics available for analysis',
                  suggestions: 'Unable to generate suggestions without metrics',
                  complexityComparison: 'Unable to analyze complexity without metrics'
                });
                return currentMetrics;
              }
              
              console.log('Sending metrics to AI service:', {
                algorithm,
                arraySize: array.length,
                comparisons: currentMetrics.comparisons,
                swaps: currentMetrics.swaps,
                timeInMs: currentMetrics.startTime
              });

              aiService.current?.analyzeSortingPerformance({
                algorithm,
                arraySize: array.length,
                comparisons: currentMetrics.comparisons,
                swaps: currentMetrics.swaps,
                timeInMs: currentMetrics.startTime
              })
                .then(analysisResult => {
                  console.log('Received AI analysis:', analysisResult);
                  if (!analysisResult.analysis || !analysisResult.suggestions || !analysisResult.complexityComparison) {
                    throw new Error('Incomplete analysis received from AI service');
                  }
                  setAnalysis(analysisResult);
                })
                .catch(error => {
                  console.error('AI Analysis error:', error);
                  setAnalysis({
                    analysis: `Error analyzing performance: ${error.message}. Please try again.`,
                    suggestions: 'Unable to generate suggestions due to analysis error',
                    complexityComparison: 'Unable to compare complexity due to analysis error'
                  });
                })
                .finally(() => setIsAnalyzing(false));
              
              return currentMetrics;
            });
          }, 0);
        } else {
          setIsAnalyzing(false);
          setAnalysis({
            analysis: 'AI Service not available - please check your API configuration',
            suggestions: 'Unable to generate suggestions without AI service',
            complexityComparison: 'Unable to analyze complexity without AI service'
          });
        }
        
        return false;
      }

      if (step) {
        setCurrentStep(step);
        setArray([...step.array]);
        
        // Update metrics
        setMetrics(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            comparisons: prev.comparisons + (step.comparingIndices?.length > 0 ? 1 : 0),
            swaps: prev.swaps + (step.swappedIndices?.length > 0 ? 1 : 0)
          };
        });
      }

      return true;
    } catch (error) {
      console.error('Error during sorting step:', error);
      isRunningRef.current = false;
      setIsRunning(false);
      return false;
    }
  };

  const animate = () => {
    console.log('Animation frame...');
    if (!isRunningRef.current) {
      console.log('Animation stopped: not running');
      return;
    }

    const shouldContinue = nextStep();
    console.log('Should continue:', shouldContinue);
    
    if (shouldContinue) {
      const baseDelay = 100; // Base delay in milliseconds
      const minDelay = 1;
      // Calculate delay based on current speed value
      const currentSpeed = speedRef.current;
      const delay = currentSpeed <= 100 
        ? baseDelay * (2 - currentSpeed / 100) // At 0% -> 2x delay, at 100% -> 1x delay
        : baseDelay * (2 - currentSpeed / 100); // At 100% -> 1x delay, at 200% -> 0x delay
      
      const finalDelay = Math.max(minDelay, delay);
      console.log('Scheduling next frame with delay:', finalDelay);
      
      timeoutIdRef.current = window.setTimeout(() => {
        if (isRunningRef.current) {
          requestAnimationFrame(animate);
        }
      }, finalDelay);
    }
  };

  const startSorting = async () => {
    if (isRunningRef.current) return;
    
    // Reset metrics at start
    setMetrics({
      comparisons: 0,
      swaps: 0,
      startTime: performance.now(),
      isComplete: false
    });
    
    isRunningRef.current = true;
    setIsRunning(true);

    let generator;
    switch (algorithm.toLowerCase()) {
      case 'bubblesort':
        generator = bubbleSort([...array]);
        break;
      case 'mergesort':
        generator = mergeSort([...array]);
        break;
      case 'quicksort':
        generator = quickSort([...array]);
        break;
      case 'heapsort':
        generator = heapSort([...array]);
        break;
      default:
        console.error('Unknown algorithm:', algorithm);
        return;
    }
    
    generatorRef.current = generator;
    animate();
  };

  const stopSorting = () => {
    console.log('Stopping sort...');
    isRunningRef.current = false;
    setIsRunning(false);
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  };

  const getBarColor = (index: number): string => {
    if (!currentStep) return 'bg-blue-500';
    if (currentStep.comparingIndices.includes(index)) return 'bg-yellow-500';
    if (currentStep.swappedIndices.includes(index)) return 'bg-red-500';
    return 'bg-blue-500';
  };

  return (
    <div className="p-6 min-h-screen bg-background">
      <VisualizerHeader title="Sorting Visualizer" onBack={onBack} />

      <div className="mb-6 flex items-center space-x-4">
        <select
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value as any)}
          className="px-3 py-2 border rounded-md bg-white"
          disabled={isRunning}
        >
          <option value="bubblesort">BubbleSort</option>
          <option value="quicksort">QuickSort</option>
          <option value="mergesort">MergeSort</option>
          <option value="heapsort">HeapSort</option>
        </select>

        <div className="flex items-center space-x-2">
          <span>Size:</span>
          <input
            type="range"
            min="10"
            max="100"
            value={arraySize}
            onChange={(e) => setArraySize(Number(e.target.value))}
            disabled={isRunning}
            className="w-32"
          />
          <span>{arraySize}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span>Speed:</span>
          <input
            type="range"
            min="0"
            max="200"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-32"
          />
          <span>{speed}%</span>
        </div>

        <button
          onClick={generateNewArray}
          disabled={isRunning}
          className="px-4 py-2 bg-emerald-500 text-white rounded-md font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate New Array
        </button>

        <button
          onClick={isRunning ? stopSorting : startSorting}
          className={`px-4 py-2 text-white rounded-md font-medium ${
            isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isRunning ? 'Stop' : 'Start'} Sorting
        </button>
      </div>

      <div className="h-64 bg-white rounded-lg shadow-inner p-4 flex items-end justify-around">
        {array.map((value, idx) => (
          <div
            key={idx}
            className={`w-2 transition-all duration-150 ${getBarColor(idx)}`}
            style={{
              height: `${(value / Math.max(...array)) * 100}%`,
            }}
          />
        ))}
      </div>

      {currentStep && (
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="font-medium">Current Step</h3>
          <p className="text-gray-600">{currentStep.description}</p>
        </div>
      )}

      {metrics && metrics.isComplete && (
        <div className="bg-white rounded-lg p-4 shadow space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-medium mb-2">Performance Metrics</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Comparisons: </span>
                <span className="font-medium">{metrics.comparisons}</span>
              </div>
              <div>
                <span className="text-gray-600">Swaps: </span>
                <span className="font-medium">{metrics.swaps}</span>
              </div>
              <div>
                <span className="text-gray-600">Time: </span>
                <span className="font-medium">
                  {(metrics.startTime / 1000).toFixed(2)}s
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-4">AI Performance Analysis</h3>
            {isAnalyzing ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Analyzing performance...</span>
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Performance Analysis</h4>
                  <p className="text-sm text-gray-600 mt-1">{analysis.analysis}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700">Algorithm Recommendations</h4>
                  <p className="text-sm text-gray-600 mt-1">{analysis.suggestions}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700">Theoretical vs Actual Performance</h4>
                  <p className="text-sm text-gray-600 mt-1">{analysis.complexityComparison}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">Unable to generate analysis at this time.</p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Unsorted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>Comparing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Swapping</span>
        </div>
      </div>
    </div>
  );
};

export default SortingVisualizer;
