import { cn } from '@/lib/cn';

interface FieldSectionProps {
  /** 섹션 라벨 (e.g. '수검자 정보', '응답 통계') */
  label: string;
  children: React.ReactNode;
  className?: string;
}

/** 검증 폼 안의 섹션 단위 — 섹션 라벨 + 하위 필드들 */
export const FieldSection = ({
  label,
  children,
  className,
}: FieldSectionProps) => (
  <div className={cn('flex flex-col gap-4', className)}>
    <p className="text-m font-sub text-grey-80">{label}</p>
    <div className="flex flex-col gap-4">{children}</div>
  </div>
);
