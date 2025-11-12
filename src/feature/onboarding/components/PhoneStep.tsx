import { Button } from '@/components/ui/atoms/Button';
import { Input } from '@/components/ui/atoms/Input';

interface PhoneStepProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string;
}

export function PhoneStep({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  error,
}: PhoneStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 id="onboarding-title" className="text-2xl font-bold text-fg">
          전화번호를 입력해주세요
        </h2>
        <p className="mt-2 text-fg-muted">
          연락 가능한 전화번호를 입력해주세요
        </p>
      </div>

      <Input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="010-1234-5678"
        maxLength={13}
        disabled={isSubmitting}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        onClick={onSubmit}
        disabled={isSubmitting || !value.trim()}
        tone="primary"
        className="w-full"
      >
        {isSubmitting ? '저장 중...' : '다음'}
      </Button>
    </div>
  );
}
