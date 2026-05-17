import { cn } from '@/lib/cn';

export interface ChipOption {
  value: string;
  label: string;
}

interface FieldChipGroupProps {
  options: ChipOption[];
  value: string | null;
  onChange: (value: string) => void;
  className?: string;
}

/** 라디오형 chip 그룹 (성별, 규준집단, 평형/T쪽/F쪽 등) */
export const FieldChipGroup = ({
  options,
  value,
  onChange,
  className,
}: FieldChipGroupProps) => (
  <div className={cn('flex flex-wrap gap-2', className)}>
    {options.map((opt) => {
      const isActive = opt.value === value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'h-[35px] rounded-md border px-4 text-sm font-medium transition-colors',
            isActive
              ? 'border-green-80 bg-green-20 text-green-80'
              : 'border-grey-40 bg-grey-10 text-grey-80 lg:hover:bg-grey-20'
          )}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);
