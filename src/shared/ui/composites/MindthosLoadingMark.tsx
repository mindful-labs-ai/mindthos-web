import React from 'react';

import { cn } from '@/lib/cn';

export interface MindthosLoadingMarkProps {
  className?: string;
  pathClassName?: string;
  ariaLabel?: string;
  animated?: boolean;
}

export const MindthosLoadingMark: React.FC<MindthosLoadingMarkProps> = ({
  className,
  pathClassName,
  ariaLabel = '마음토스',
  animated = true,
}) => {
  return (
    <svg
      viewBox="0 0 600 400"
      fill="none"
      className={cn('text-green-80', className)}
      aria-label={ariaLabel}
      role="img"
    >
      <path
        d="M 75 345 L 75 130 C 75 35 205 35 205 130 L 205 270 C 205 365 335 365 335 270 L 335 200 C 335 120 445 120 445 200 L 445 250"
        stroke="currentColor"
        strokeWidth="62"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="1"
        style={{ strokeDasharray: 1 }}
        className={cn(animated && 'animate-logo-draw', pathClassName)}
      />
    </svg>
  );
};

MindthosLoadingMark.displayName = 'MindthosLoadingMark';
