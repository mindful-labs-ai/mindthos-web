import { cn } from '@/lib/cn';

import { FieldSeparator } from './fields';
import { FormField } from './FormField';

interface MissingFieldsFormProps {
  /** 검사 카테고리 라벨 (e.g. '다면적 인성 검사') */
  categoryLabel: string;
  /** 누락 항목 수 — 헤더 표기용 */
  missingCount: number;
  /** validated=true면 모든 항목 통과 표시 */
  validated: boolean;
  /** 폼 내용은 외부에서 children으로 주입. 자유 구성. */
  children: React.ReactNode;
  className?: string;
}

/**
 * 누락 항목 채우기 카드의 외곽 컨테이너.
 * 헤더(검사 라벨 + 상태) + 내부 폼 children.
 *
 * 내부 폼 필드는 검사 종류마다 다르므로 호출부에서 자유롭게 구성.
 */
export const MissingFieldsForm = ({
  categoryLabel,
  missingCount,
  validated,
  children,
  className,
}: MissingFieldsFormProps) => {
  return (
    <div
      className={cn(
        'rounded-xl border bg-surface p-5',
        validated ? 'border-primary' : 'border-yellow-80',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-m font-emphasize text-grey-100">{categoryLabel}</p>
        {validated ? (
          <p className="flex items-center gap-1.5 text-sm text-primary">
            <span
              aria-hidden
              className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white"
            >
              ✓
            </span>
            모든 항목 확인됨
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-[#F59E0B]">
            <span
              aria-hidden
              className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F59E0B] text-xs text-white"
            >
              !
            </span>
            {missingCount}개 항목 누락됨
          </p>
        )}
      </div>

      {/* 헤더 ↔ 본문 분리선 */}
      <FieldSeparator className="my-4" />

      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
};

MissingFieldsForm.Field = FormField;
