import React from 'react';

import { cn } from '@/lib/cn';

export type RadioSize = 'sm' | 'md' | 'lg';
export type RadioOrientation = 'horizontal' | 'vertical';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioOption[];
  size?: RadioSize;
  orientation?: RadioOrientation;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const sizeStyles: Record<
  RadioSize,
  { radio: string; text: string; desc: string }
> = {
  sm: { radio: 'h-4 w-4', text: 'text-sm', desc: 'text-xs' },
  md: { radio: 'h-5 w-5', text: 'text-base', desc: 'text-sm' },
  lg: { radio: 'h-6 w-6', text: 'text-lg', desc: 'text-base' },
};

/**
 * RadioGroup - 라디오 버튼 그룹
 * 단일 선택, 키보드 네비게이션 (화살표 키)
 *
 * @example
 * <RadioGroup options={[{ value: '1', label: 'Option 1' }]} onChange={setValue} />
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  size = 'md',
  orientation = 'vertical',
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  disabled = false,
  className,
}) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue || ''
  );
  const isControlled = controlledValue !== undefined;
  const selectedValue = isControlled ? controlledValue : uncontrolledValue;
  const groupId = React.useId();
  const generatedName = name || groupId;

  const handleChange = (newValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(newValue);
    }
    onChange?.(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    const enabledOptions = options.filter((opt) => !opt.disabled);
    const currentEnabledIndex = enabledOptions.findIndex(
      (opt) => opt.value === options[currentIndex].value
    );

    let nextIndex = currentEnabledIndex;
    const isHorizontal = orientation === 'horizontal';

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        if (
          (e.key === 'ArrowDown' && !isHorizontal) ||
          (e.key === 'ArrowRight' && isHorizontal)
        ) {
          e.preventDefault();
          nextIndex = (currentEnabledIndex + 1) % enabledOptions.length;
        }
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        if (
          (e.key === 'ArrowUp' && !isHorizontal) ||
          (e.key === 'ArrowLeft' && isHorizontal)
        ) {
          e.preventDefault();
          nextIndex =
            (currentEnabledIndex - 1 + enabledOptions.length) %
            enabledOptions.length;
        }
        break;
      case ' ':
        e.preventDefault();
        if (!options[currentIndex].disabled) {
          handleChange(options[currentIndex].value);
        }
        return;
      default:
        return;
    }

    const nextOption = enabledOptions[nextIndex];
    handleChange(nextOption.value);
  };

  return (
    <div
      role="radiogroup"
      className={cn(
        'flex gap-3',
        orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        className
      )}
    >
      {options.map((option, index) => {
        const isSelected = selectedValue === option.value;
        const isDisabled = disabled || option.disabled;
        const optionId = `${generatedName}-${option.value}`;

        return (
          <label
            key={option.value}
            htmlFor={optionId}
            className={cn(
              'flex cursor-pointer items-start gap-2 px-4',
              isDisabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <div className="relative flex items-center justify-center pt-0.5">
              <input
                type="radio"
                id={optionId}
                name={generatedName}
                value={option.value}
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => handleChange(option.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="sr-only"
              />
              <div
                className={cn(
                  'flex items-center justify-center rounded-full border-2 transition-all duration-200',
                  sizeStyles[size].radio,
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'hover:border-primary/50 border-border bg-surface',
                  isDisabled && 'hover:border-border',
                  'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2'
                )}
              >
                {isSelected && (
                  <div
                    className={cn(
                      'rounded-full bg-surface',
                      size === 'sm' && 'h-1.5 w-1.5',
                      size === 'md' && 'h-2 w-2',
                      size === 'lg' && 'h-2.5 w-2.5'
                    )}
                  />
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <span
                className={cn('font-medium text-fg', sizeStyles[size].text)}
              >
                {option.label}
              </span>
              {option.description && (
                <span className={cn('text-fg-muted', sizeStyles[size].desc)}>
                  {option.description}
                </span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
};

RadioGroup.displayName = 'RadioGroup';

// Export as Radio for convenience
export const Radio = RadioGroup;
