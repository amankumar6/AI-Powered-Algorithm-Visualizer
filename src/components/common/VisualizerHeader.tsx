import React from 'react';

interface VisualizerHeaderProps {
  title: string;
  onBack: () => void;
}

const VisualizerHeader: React.FC<VisualizerHeaderProps> = ({ title, onBack }) => {
  return (
    <div className="mb-6 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 flex items-center"
        >
          ← Back to Dashboard
        </button>
      </div>
      <h1 className="text-xl font-semibold">{title}</h1>
    </div>
  );
};

export default VisualizerHeader;
