import { cn } from '@/lib/cn';

import type { RegisterStep } from '../types';

interface RegisterStepperProps {
  current: RegisterStep;
  className?: string;
}

const STEPS: { step: RegisterStep; label: string }[] = [
  { step: 1, label: '결과지 등록' },
  { step: 2, label: '결과지 검수' },
  { step: 3, label: '등록 완료' },
];

export const RegisterStepper = ({
  current,
  className,
}: RegisterStepperProps) => {
  return (
    <div className={cn('flex w-full items-start', className)}>
      {STEPS.map((item, idx) => {
        const isActive = item.step === current;
        const isLast = idx === STEPS.length - 1;

        return (
          <div key={item.step} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {/* 연결선 - 좌측 */}
              <div
                className={cn(
                  'h-1 flex-1 bg-grey-30',
                  idx === 0 && 'invisible'
                )}
              />
              <div
                className={cn(
                  'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-l font-emphasize',
                  isActive
                    ? 'bg-primary text-white'
                    : 'border-2 border-grey-70 bg-surface text-grey-70'
                )}
              >
                {item.step}
              </div>
              {/* 연결선 - 우측 */}
              <div
                className={cn('h-1 flex-1 bg-grey-30', isLast && 'invisible')}
              />
            </div>
            <span
              className={cn(
                'mt-2 text-sm',
                isActive ? 'font-emphasize text-grey-100' : 'text-grey-60'
              )}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
