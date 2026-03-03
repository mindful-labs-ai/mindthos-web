import { Check } from 'lucide-react';

import { CHECKLIST } from '../constants';

interface VerifyStepProps {
  snapshotImage: string | null;
  answers: (number | null)[];
  onAnswerChange: (index: number, value: number) => void;
}

export function VerifyStep({
  snapshotImage,
  answers,
  onAnswerChange,
}: VerifyStepProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* 상단 배너 */}
      <div className="rounded-xl bg-primary-50 px-6 py-5 text-center">
        <p className="text-base font-bold text-fg">
          모든 검수가 끝난 후에
          <br />
          보고서 생성이 가능합니다.
        </p>
        <p className="mt-2 text-sm text-fg-muted">
          아래 내용을 확인하며 검수를 완료해주세요.
        </p>
      </div>

      {/* 가계도 스냅샷 */}
      <div>
        <p className="mb-3 text-base font-medium text-fg">
          최종 가계도는 아래 형태로 보고서에 반영됩니다.
        </p>
        {snapshotImage ? (
          <img
            src={snapshotImage}
            alt="가계도 스냅샷"
            className="w-full rounded-xl border border-border object-contain"
          />
        ) : (
          <div className="h-48 w-full rounded-xl border border-border bg-surface-contrast" />
        )}
      </div>

      {/* 체크리스트 */}
      {CHECKLIST.map((item, i) => (
        <div key={i}>
          <p className="mb-3 text-base font-bold text-fg">
            {i + 1}. {item.question}
          </p>
          <div className="flex flex-col gap-2">
            {item.options.map((option, j) => {
              const isSelected = answers[i] === j;
              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => onAnswerChange(i, j)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm transition-colors ${
                    isSelected
                      ? 'text-primary'
                      : 'text-fg-muted hover:bg-surface-contrast'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      isSelected ? 'border-primary bg-primary' : 'border-border'
                    }`}
                  >
                    {isSelected && (
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    )}
                  </span>
                  <span className={isSelected ? 'font-semibold' : ''}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
