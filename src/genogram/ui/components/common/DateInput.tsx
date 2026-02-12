import React, { useState } from 'react';

/** 숫자만 추출 후 YYYY-MM-DD 형태로 자동 포맷 */
function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

/** 포맷된 문자열에서 숫자만 추출한 길이 */
function digitLength(s: string): number {
  return s.replace(/\D/g, '').length;
}

interface DateInputProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}

/** 날짜 입력 (숫자만 입력 → YYYY-MM-DD 자동 포맷) */
export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  placeholder = 'YYYY-MM-DD',
}) => {
  const [localValue, setLocalValue] = useState(value ?? '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // 백스페이스로 지울 때: 하이픈도 함께 지워지도록
    if (digitLength(raw) < digitLength(localValue)) {
      const digits = raw.replace(/\D/g, '');
      const formatted = formatDateInput(digits);
      setLocalValue(formatted);
      return;
    }
    const formatted = formatDateInput(raw);
    setLocalValue(formatted);
  };

  const handleBlur = () => {
    const digits = localValue.replace(/\D/g, '');
    if (digits.length === 0) {
      onChange(null);
    } else if (digits.length === 4) {
      // 년도만 입력 → YYYY-01-01 자동 채움
      const filled = `${digits}-01-01`;
      setLocalValue(filled);
      onChange(filled);
    } else if (digits.length === 8) {
      onChange(localValue);
    }
    // 그 외 (5~7자리)는 유지, 커밋하지 않음
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      maxLength={10}
      className="h-8 w-36 rounded-md border-2 border-border bg-surface px-3 text-right text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
};
