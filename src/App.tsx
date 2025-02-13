import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css'
import { AlgorithmType } from './types/algorithm'
import Dashboard from './components/Dashboard'
import SortingVisualizer from './components/algorithms/SortingVisualizer'
import PathfindingVisualizer from './components/algorithms/PathfindingVisualizer'
import SudokuVisualizer from './components/algorithms/SudokuVisualizer'

const SortingVisualizerWrapper = () => {
  const navigate = useNavigate();
  return <SortingVisualizer onBack={() => navigate('/dashboard')} />;
};

const PathfindingVisualizerWrapper = () => {
  const navigate = useNavigate();
  return <PathfindingVisualizer onBack={() => navigate('/dashboard')} />;
};

const SudokuVisualizerWrapper = () => {
  const navigate = useNavigate();
  return <SudokuVisualizer onBack={() => navigate('/dashboard')} />;
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-surface shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 
              className="text-2xl font-bold text-gray-900 cursor-pointer"
            >
              AI-Powered Algorithm Visualizer
            </h1>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sorting" element={<SortingVisualizerWrapper />} />
            <Route path="/pathfinding" element={<PathfindingVisualizerWrapper />} />
            <Route path="/sudoku" element={<SudokuVisualizerWrapper />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App
