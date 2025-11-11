import React from 'react';

import { cn } from '@/lib/cn';

export type StepperOrientation = 'horizontal' | 'vertical';

export interface Step {
  label: string;
  description?: string;
}

export interface StepperProps {
  /**
   * Steps array
   */
  steps: Step[];
  /**
   * Current active step (0-indexed)
   */
  currentStep: number;
  /**
   * Orientation
   * @default 'horizontal'
   */
  orientation?: StepperOrientation;
  /**
   * Allow clicking on steps
   * @default false
   */
  clickable?: boolean;
  /**
   * Step click handler
   */
  onStepClick?: (step: number) => void;
  /**
   * Additional className
   */
  className?: string;
}

const CheckIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

/**
 * Stepper component
 *
 * Multi-step process indicator.
 *
 * **A11y**: nav with aria-label, aria-current for current step.
 * **Keyboard**: Tab to navigate, Enter/Space to activate if clickable.
 *
 * @example
 * ```tsx
 * <Stepper
 *   steps={[
 *     { label: 'Personal Info', description: 'Basic details' },
 *     { label: 'Address', description: 'Shipping info' },
 *     { label: 'Payment', description: 'Payment method' },
 *   ]}
 *   currentStep={1}
 * />
 * ```
 */
export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  orientation = 'horizontal',
  clickable = false,
  onStepClick,
  className,
}) => {
  const handleStepClick = (index: number) => {
    if (clickable && index < currentStep) {
      onStepClick?.(index);
    }
  };

  const isHorizontal = orientation === 'horizontal';

  return (
    <nav
      aria-label="Progress"
      className={cn(
        'flex',
        isHorizontal ? 'items-start' : 'flex-col items-start',
        className
      )}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isClickableStep = clickable && isCompleted;

        return (
          <React.Fragment key={index}>
            <div
              className={cn(
                'flex',
                isHorizontal
                  ? 'flex-col items-center'
                  : 'flex-row items-start gap-3'
              )}
            >
              <button
                type="button"
                onClick={() => handleStepClick(index)}
                disabled={!isClickableStep}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'relative flex items-center justify-center rounded-full',
                  'h-10 w-10 border-2 font-semibold transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isCompleted
                    ? 'border-primary bg-primary text-surface'
                    : isCurrent
                      ? 'border-primary bg-surface text-primary'
                      : 'border-border bg-surface text-fg-muted',
                  isClickableStep && 'cursor-pointer hover:opacity-80',
                  !isClickableStep && 'cursor-default'
                )}
              >
                {isCompleted ? <CheckIcon /> : index + 1}
              </button>
              <div
                className={cn(
                  'flex flex-col',
                  isHorizontal ? 'mt-2 items-center text-center' : 'flex-1'
                )}
              >
                <span
                  className={cn(
                    'text-sm font-medium',
                    isCurrent ? 'text-fg' : 'text-fg-muted'
                  )}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="text-xs text-fg-muted">
                    {step.description}
                  </span>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'bg-border',
                  isHorizontal ? 'mx-2 mt-5 h-0.5 flex-1' : 'ml-5 h-8 w-0.5'
                )}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

Stepper.displayName = 'Stepper';
