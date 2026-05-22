import { useState } from 'react';

import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';

export type AssessmentsMode =
  | 'empty'
  | 'registered'
  | 'analyzing'
  | 'analyzed';

export interface DebugEvalCaseOption {
  id: string;
  label: string;
}

interface DebugStatePanelProps {
  mode: AssessmentsMode;
  onModeChange: (mode: AssessmentsMode) => void;
  /** 임시 평가용 케이스 목록 (analyzed 모드에서만 노출) */
  evalCases?: DebugEvalCaseOption[];
  /** 평가 케이스 선택 → 대화에 추가 */
  onSelectEvalCase?: (id: string) => void;
  /** 대화 초기화 */
  onClearChat?: () => void;
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
  evalCases,
  onSelectEvalCase,
  onClearChat,
  className,
}: DebugStatePanelProps) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  // 모바일은 기본 접힘 (드롭다운 토글)
  const [collapsed, setCollapsed] = useState(isMobileView);

  const showEvalCases =
    mode === 'analyzed' && !!evalCases && evalCases.length > 0;

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
        <div className="flex max-h-[70vh] w-[230px] flex-col gap-1 overflow-y-auto">
          {/* 화면 mode 선택 */}
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

          {/* 임시 평가용 케이스 선택 (analyzed 모드) */}
          {showEvalCases && (
            <>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] font-emphasize text-grey-100">
                  평가 케이스
                </span>
                {onClearChat && (
                  <button
                    type="button"
                    onClick={onClearChat}
                    className="rounded border border-grey-30 px-1.5 py-0.5 text-[10px] text-grey-70 lg:hover:bg-grey-10"
                  >
                    대화 초기화
                  </button>
                )}
              </div>
              {evalCases!.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectEvalCase?.(c.id)}
                  className="rounded-md border border-grey-30 bg-surface px-2 py-1.5 text-left text-[11px] text-grey-100 transition-colors lg:hover:bg-grey-10"
                >
                  {c.label}
                </button>
              ))}
            </>
          )}

          <p className="mt-1 text-[10px] text-grey-60">개발용 — 추후 제거</p>
        </div>
      )}
    </div>
  );
};
