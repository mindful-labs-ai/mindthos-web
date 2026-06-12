import { useState } from 'react';

interface ScoreRangeSelectProps {
  value: number;
  /** 선택 가능한 값 목록 — 최소<최대가 되도록 호출부에서 잘라서 전달 */
  options: number[];
  ariaLabel: string;
  onChange: (value: number) => void;
}

/**
 * 점수 범위 숫자 선택 — 32px 박스 클릭 시 하단으로 값 목록이 펼쳐진다.
 * (자유 타이핑은 박스보다 큰 숫자가 잘려 보여 드롭다운으로 제한, 전체 범위 1~10)
 */
export function ScoreRangeSelect({
  value,
  options,
  ariaLabel,
  onChange,
}: ScoreRangeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-grey-20 text-xl font-medium text-grey-100 transition-colors lg:hover:bg-grey-30"
      >
        {value}
      </button>

      {isOpen && (
        <>
          {/* 바깥 클릭 닫기용 투명 오버레이 */}
          <div
            className="fixed inset-0 z-modal"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            role="menu"
            className="absolute left-0 top-full z-modal mt-2 max-h-[240px] w-16 overflow-y-auto rounded-lg border border-grey-30 bg-white p-1.5 shadow-[0px_4px_24px_rgba(0,0,0,0.1)]"
          >
            {options.map((option) => (
              <button
                key={option}
                type="button"
                role="menuitem"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-center rounded-lg px-2 py-1.5 text-m font-medium text-grey-100 transition-colors lg:hover:bg-grey-20 ${
                  option === value ? 'bg-grey-20' : ''
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
