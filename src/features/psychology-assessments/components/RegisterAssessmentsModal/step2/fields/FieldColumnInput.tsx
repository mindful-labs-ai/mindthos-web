import { cn } from '@/lib/cn';

import { FieldTextInput } from './FieldTextInput';

interface FieldColumnInputProps {
  /** 작은 컬럼 라벨 (e.g. '원점수', '전체규준 T') */
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** 컬럼형 작은 라벨 + input 묶음 (multi-column input 그리드에서 사용) */
export const FieldColumnInput = ({
  label,
  value,
  onChange,
  placeholder = '0',
  className,
}: FieldColumnInputProps) => (
  <div className={cn('flex flex-col gap-1', className)}>
    <span className="text-xs font-medium text-grey-70">{label}</span>
    <FieldTextInput
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);
