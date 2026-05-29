import { cn } from '@/lib/cn';
import { ArrowRightIcon } from '@/shared/icons';

import { toCycleSteps } from '../types';

import { EDITABLE_CLASS } from './editable';

const STEP_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

interface CycleDiagramProps {
  value: string | string[] | null | undefined;
  editable?: boolean;
}

/**
 * 악순환 사이클 도식.
 *
 * - 단계 N개의 카드를 가로 흐름으로 배치하고 마지막 → 첫 단계로 돌아오는
 *   순환 표시를 추가한다. 모바일에서는 세로 스택 + ↓ 화살표.
 * - 편집 모드: 각 카드가 contentEditable이며 path는
 *   `phase2.maintaining_factors.cycle.{i}`. 항목 추가/삭제는 컨테이너에 포커스
 *   상태에서 Enter / Backspace로 처리하지 않고 (단계 수 안정성), 별도 + - 버튼
 *   대신 본 단계에서는 인라인 텍스트만 편집 가능하게 한다.
 *   (단계 수 자체 변경은 풀 편집 UI 단계에서 별도 컴포넌트로 다룰 예정.)
 */
export function CycleDiagram({ value, editable }: CycleDiagramProps) {
  const steps = toCycleSteps(value);

  if (steps.length === 0) {
    return <p className="note-desc">—</p>;
  }

  return (
    <div className="space-y-3">
      {/* 데스크톱: 가로 흐름 */}
      <div className="hidden flex-wrap items-stretch gap-2 lg:flex">
        {steps.map((step, i) => (
          <CycleNodeWithArrow
            key={i}
            step={step}
            label={STEP_LABELS[i] ?? `${i + 1}`}
            index={i}
            editable={editable}
            isLast={i === steps.length - 1}
            orientation="horizontal"
          />
        ))}
      </div>

      {/* 모바일: 세로 흐름 */}
      <div className="flex flex-col gap-2 lg:hidden">
        {steps.map((step, i) => (
          <CycleNodeWithArrow
            key={i}
            step={step}
            label={STEP_LABELS[i] ?? `${i + 1}`}
            index={i}
            editable={editable}
            isLast={i === steps.length - 1}
            orientation="vertical"
          />
        ))}
      </div>

      {/* 순환 안내 */}
      <p className="text-s text-grey-60">
        ↺ 마지막 단계({STEP_LABELS[steps.length - 1] ?? steps.length}) 이후 다시
        시작점({STEP_LABELS[0]})으로 돌아와요.
      </p>
    </div>
  );
}

interface CycleNodeProps {
  step: string;
  label: string;
  index: number;
  editable?: boolean;
  isLast: boolean;
  orientation: 'horizontal' | 'vertical';
}

function CycleNodeWithArrow({
  step,
  label,
  index,
  editable,
  isLast,
  orientation,
}: CycleNodeProps) {
  return (
    <>
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-1 rounded-lg border border-green-40 bg-green-10 p-3',
          orientation === 'horizontal' && 'min-w-[10rem] basis-0'
        )}
      >
        <div className="text-s flex h-6 w-6 items-center justify-center rounded-full bg-green-80 font-emphasize text-white">
          {label}
        </div>
        <p
          className={cn(
            'note-card-sub mt-1 break-words',
            editable && EDITABLE_CLASS
          )}
          contentEditable={editable}
          suppressContentEditableWarning={editable}
          data-note-path={
            editable ? `phase2.maintaining_factors.cycle.${index}` : undefined
          }
        >
          {step}
        </p>
      </div>
      {!isLast && (
        <div
          className={cn(
            'flex shrink-0 items-center justify-center',
            orientation === 'horizontal' ? 'self-center' : 'py-1'
          )}
          aria-hidden
        >
          <ArrowRightIcon
            size={18}
            className={cn(
              'text-green-80',
              orientation === 'vertical' && 'rotate-90'
            )}
          />
        </div>
      )}
    </>
  );
}
