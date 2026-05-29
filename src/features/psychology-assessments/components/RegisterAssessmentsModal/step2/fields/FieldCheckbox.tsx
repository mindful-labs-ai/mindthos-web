import { cn } from '@/lib/cn';

interface FieldCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

/** 라벨 우측 체크박스 (e.g. '기록 없음') */
export const FieldCheckbox = ({
  label,
  checked,
  onChange,
  className,
}: FieldCheckboxProps) => (
  <label
    className={cn(
      'inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-grey-100',
      className
    )}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 cursor-pointer accent-green-80"
    />
    {label}
  </label>
);
