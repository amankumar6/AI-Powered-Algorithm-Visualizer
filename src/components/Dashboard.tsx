import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlgorithmType } from '../types/algorithm';
import { algorithmImages } from '../utils/algorithmImages';

interface AlgorithmCard {
  title: string;
  description: string;
  type: AlgorithmType;
  path: string;
}

const algorithms: AlgorithmCard[] = [
  {
    title: 'Sorting Algorithms',
    description: 'Visualize various sorting algorithms like Bubble Sort, Quick Sort, and Merge Sort.',
    type: 'sorting',
    path: '/sorting'
  },
  {
    title: 'Pathfinding Algorithms',
    description: 'Visualize pathfinding algorithms like A*, Dijkstra, and BFS on an interactive grid with mazes.',
    type: 'pathfinding',
    path: '/pathfinding'
  },
  {
    title: 'Sudoku Solver',
    description: 'Visualize backtracking algorithm solving Sudoku puzzles.',
    type: 'sudoku',
    path: '/sudoku'
  }
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Algorithm Visualizer</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {algorithms.map((algo) => (
            <div
              key={algo.type}
              className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition hover:scale-105"
              onClick={() => navigate(algo.path)}
            >
              <img 
                src={algorithmImages[algo.type].image} 
                alt={algorithmImages[algo.type].alt}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{algo.title}</h3>
                <p className="text-gray-600">{algo.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
