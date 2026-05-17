import { useState } from 'react';

import { cn } from '@/lib/cn';

export type AssessmentsMode =
  | 'empty'
  | 'registered'
  | 'analyzing'
  | 'analyzed';

interface DebugStatePanelProps {
  mode: AssessmentsMode;
  onModeChange: (mode: AssessmentsMode) => void;
  className?: string;
}

const MODE_OPTIONS: { value: AssessmentsMode; label: string }[] = [
  { value: 'empty', label: 'empty (결과지 없음)' },
  { value: 'registered', label: 'registered (등록됨)' },
  { value: 'analyzing', label: 'analyzing (분석 중)' },
  { value: 'analyzed', label: 'analyzed (채팅 가능)' },
];

export const DebugStatePanel = ({
  mode,
  onModeChange,
  className,
}: DebugStatePanelProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        'fixed right-4 top-4 z-tooltip flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 shadow-elevated',
        collapsed && 'p-2',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="text-left text-xs font-emphasize text-grey-100"
      >
        🛠 DEBUG {collapsed ? '▼' : '▲'}
      </button>

      {!collapsed && (
        <div className="flex w-[210px] flex-col gap-1">
          {MODE_OPTIONS.map((opt) => {
            const isActive = mode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onModeChange(opt.value)}
                className={cn(
                  'rounded-md border px-2 py-1.5 text-left text-[11px] transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-white'
                    : 'border-grey-30 bg-surface text-grey-100 lg:hover:bg-grey-10'
                )}
              >
                {opt.label}
              </button>
            );
          })}
          <p className="mt-1 text-[10px] text-grey-60">개발용 — 추후 제거</p>
        </div>
      )}
    </div>
  );
};
