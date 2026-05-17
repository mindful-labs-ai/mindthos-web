import { useState } from 'react';

import { cn } from '@/lib/cn';

import type { Step1Substate } from './step1/Step1UploadView';
import type { RegisterStep } from './types';

export type Step2DebugMode = 'list-complete' | 'list-missing' | 'filling';

interface RegisterModalDebugPanelProps {
  step: RegisterStep;
  onStepChange: (step: RegisterStep) => void;
  step1Sub: Step1Substate;
  onStep1SubChange: (sub: Step1Substate) => void;
  step2Mode: Step2DebugMode;
  onStep2ModeChange: (mode: Step2DebugMode) => void;
  reviewingPercent: number;
  onReviewingPercentChange: (value: number) => void;
  className?: string;
}

const STEP_OPTIONS: RegisterStep[] = [1, 2, 3];
const STEP1_SUB_OPTIONS: { value: Step1Substate; label: string }[] = [
  { value: 'empty', label: 'empty' },
  { value: 'reviewing', label: 'reviewing' },
  { value: 'list', label: 'list' },
];
const STEP2_MODE_OPTIONS: { value: Step2DebugMode; label: string }[] = [
  { value: 'list-complete', label: '검증 완료' },
  { value: 'list-missing', label: '누락 있음' },
  { value: 'filling', label: '항목 채우기' },
];

const ChipGroup = <T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) => (
  <div className="flex flex-wrap gap-1">
    {options.map((opt) => (
      <button
        key={String(opt.value)}
        type="button"
        onClick={() => onChange(opt.value)}
        className={cn(
          'rounded-md border px-2 py-1 text-[11px] transition-colors',
          value === opt.value
            ? 'border-primary bg-primary text-white'
            : 'border-grey-30 bg-surface text-grey-100 lg:hover:bg-grey-10'
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export const RegisterModalDebugPanel = ({
  step,
  onStepChange,
  step1Sub,
  onStep1SubChange,
  step2Mode,
  onStep2ModeChange,
  reviewingPercent,
  onReviewingPercentChange,
  className,
}: RegisterModalDebugPanelProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        'fixed left-4 top-4 z-tooltip flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 shadow-elevated',
        collapsed && 'p-2',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="text-left text-xs font-emphasize text-grey-100"
      >
        🛠 MODAL DEBUG {collapsed ? '▼' : '▲'}
      </button>

      {!collapsed && (
        <div className="flex w-[220px] flex-col gap-3 text-xs text-grey-100">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-grey-60">Step</span>
            <ChipGroup
              options={STEP_OPTIONS.map((s) => ({
                value: s,
                label: `Step ${s}`,
              }))}
              value={step}
              onChange={onStepChange}
            />
          </div>

          {step === 1 && (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-grey-60">Step 1 substate</span>
                <ChipGroup
                  options={STEP1_SUB_OPTIONS}
                  value={step1Sub}
                  onChange={onStep1SubChange}
                />
              </div>

              {step1Sub === 'reviewing' && (
                <div className="flex flex-col gap-1">
                  <label className="flex items-center justify-between text-[11px] text-grey-60">
                    <span>검토 %</span>
                    <span>{reviewingPercent}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={reviewingPercent}
                    onChange={(e) =>
                      onReviewingPercentChange(Number(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-grey-60">Step 2 mode</span>
              <ChipGroup
                options={STEP2_MODE_OPTIONS}
                value={step2Mode}
                onChange={onStep2ModeChange}
              />
            </div>
          )}

          <p className="text-[10px] text-grey-60">개발용 — 추후 제거</p>
        </div>
      )}
    </div>
  );
};
