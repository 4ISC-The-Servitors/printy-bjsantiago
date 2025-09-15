import React from 'react';
import { cn } from '../../../lib/utils';

interface Props {
  currentStep: number;
}

const ProgressIndicator: React.FC<Props> = ({ currentStep }) => {
  return (
    <div className="flex items-center justify-center mb-6">
      {[1, 2, 3].map(step => (
        <React.Fragment key={step}>
          <div className="flex items-center">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                step < currentStep
                  ? 'bg-brand-primary border-brand-primary text-white'
                  : step === currentStep
                    ? 'bg-brand-primary border-brand-primary text-white'
                    : 'bg-white border-neutral-300 text-neutral-400'
              )}
            >
              {step < currentStep ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <span className="text-sm font-semibold">{step}</span>
              )}
            </div>
          </div>
          {step < 3 && (
            <div
              className={cn(
                'w-16 h-0.5 mx-2 transition-all duration-300',
                step < currentStep ? 'bg-brand-primary' : 'bg-neutral-300'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ProgressIndicator;
