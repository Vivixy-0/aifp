'use client';

import React from 'react';

interface ProgressBarProps {
  steps: string[];
  currentStep: number;
}

const ProgressBar = ({ steps, currentStep }: ProgressBarProps) => {
  return (
    <div className="mb-8">
      <div className="relative pb-8">
        {/* ステップのインジケーター */}
        <div className="flex justify-between items-center mb-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex flex-col items-center ${
                index === currentStep
                  ? 'text-primary font-bold'
                  : index < currentStep
                  ? 'text-primary'
                  : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full ${
                  index <= currentStep ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                } mb-1`}
              >
                {index + 1}
              </div>
              <span className="text-xs md:text-sm whitespace-nowrap">{step}</span>
            </div>
          ))}
        </div>

        {/* プログレスバー */}
        <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200 transform -translate-y-1/2 z-0">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar; 