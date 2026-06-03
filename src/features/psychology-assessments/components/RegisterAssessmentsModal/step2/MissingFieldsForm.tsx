import { cn } from '@/lib/cn';

import { FieldSeparator } from './fields';
import { FormField } from './FormField';

interface MissingFieldsFormProps {
  /** 검사 카테고리 라벨 (e.g. '다면적 인성검사') */
  categoryLabel: string;
  /** 누락 항목 수 — 헤더 표기용 */
  missingCount: number;
  /** validated=true면 모든 항목 통과 표시 */
  validated: boolean;
  /** 완료된 카드 본문을 접어 다음 카드를 바로 볼 수 있게 한다. */
  collapsed?: boolean;
  /** 완료 카드 접기/펼치기 토글 */
  onToggleCollapsed?: () => void;
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
  collapsed = false,
  onToggleCollapsed,
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-m font-emphasize text-grey-100">{categoryLabel}</p>
        {validated ? (
          <div className="flex items-center gap-2">
            <p className="flex items-center gap-1.5 text-sm text-primary">
              <span
                aria-hidden
                className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white"
              >
                ✓
              </span>
              모든 항목을 확인했어요
            </p>
            {onToggleCollapsed && (
              <button
                type="button"
                onClick={onToggleCollapsed}
                className="rounded-md border border-border px-2 py-1 text-xs font-medium text-grey-70 transition-colors lg:hover:bg-grey-10"
              >
                {collapsed ? '다시 수정' : '접기'}
              </button>
            )}
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-[#F59E0B]">
            <span
              aria-hidden
              className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F59E0B] text-xs text-white"
            >
              !
            </span>
            {missingCount}개 항목을 채워 주세요
          </p>
        )}
      </div>

      {!collapsed && <FieldSeparator className="my-4" />}

      <div
        className={cn('flex flex-col gap-4', collapsed && 'hidden')}
        aria-hidden={collapsed}
      >
        {children}
      </div>
    </div>
  );
};

MissingFieldsForm.Field = FormField;
