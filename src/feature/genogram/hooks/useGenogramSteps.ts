import { useState, useCallback } from 'react';

import type { AIGenogramOutput } from '../utils/aiJsonConverter';

export type GenogramStep = 'confirm' | 'analyze' | 'render';

interface UseGenogramStepsReturn {
  // 상태
  isOpen: boolean;
  currentStep: GenogramStep;

  // API 상태
  isLoading: boolean;
  error: string | null;

  // 데이터
  aiOutput: AIGenogramOutput | null;
  editedJson: string;

  // 액션
  open: (initialStep?: GenogramStep) => void;
  close: () => void;
  setStep: (step: GenogramStep) => void;
  setAiOutput: (output: AIGenogramOutput) => void;
  updateAiOutput: (output: AIGenogramOutput) => void; // aiOutput과 editedJson 동시 업데이트
  setEditedJson: (json: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export function useGenogramSteps(): UseGenogramStepsReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<GenogramStep>('confirm');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiOutput, setAiOutput] = useState<AIGenogramOutput | null>(null);
  const [editedJson, setEditedJson] = useState('');

  const open = useCallback((initialStep: GenogramStep = 'confirm') => {
    setIsOpen(true);
    setCurrentStep(initialStep);
    setError(null);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const reset = useCallback(() => {
    setIsOpen(false);
    setCurrentStep('confirm');
    setIsLoading(false);
    setError(null);
    setAiOutput(null);
    setEditedJson('');
  }, []);

  // aiOutput과 editedJson을 동시에 업데이트 (카드 UI에서 사용)
  const updateAiOutput = useCallback((output: AIGenogramOutput) => {
    setAiOutput(output);
    setEditedJson(JSON.stringify(output, null, 2));
  }, []);

  return {
    isOpen,
    currentStep,
    isLoading,
    error,
    aiOutput,
    editedJson,
    open,
    close,
    setStep: setCurrentStep,
    setAiOutput,
    updateAiOutput,
    setEditedJson,
    setLoading: setIsLoading,
    setError,
    reset,
  };
}
