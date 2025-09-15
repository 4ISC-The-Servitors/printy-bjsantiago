import React from 'react';
import { Button } from '../../shared';

interface Props {
  currentStep: number;
  loading: boolean;
  isStepValid: (step: number) => boolean;
  onPrev: () => void;
  onNext: () => void;
}

const NavigationButtons: React.FC<Props> = ({
  currentStep,
  loading,
  isStepValid,
  onPrev,
  onNext,
}) => {
  return (
    <div className="flex space-x-4 mt-8">
      {currentStep > 1 && (
        <Button
          type="button"
          variant="secondary"
          size="lg"
          threeD
          onClick={onPrev}
          disabled={loading}
          className="flex-1 btn-responsive-primary"
        >
          Previous
        </Button>
      )}

      {currentStep < 3 ? (
        <Button
          type="button"
          variant="primary"
          size="lg"
          threeD
          onClick={onNext}
          disabled={!isStepValid(currentStep) || loading}
          className="flex-1 btn-responsive-primary"
        >
          Proceed
        </Button>
      ) : (
        <Button
          type="submit"
          variant="primary"
          size="lg"
          threeD
          loading={loading}
          disabled={!isStepValid(currentStep) || loading}
          className="flex-1 btn-responsive-primary"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      )}
    </div>
  );
};

export default NavigationButtons;
