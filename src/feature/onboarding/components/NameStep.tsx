import { Text, Title } from '@/components/ui';
import { Button } from '@/components/ui/atoms/Button';
import { Input } from '@/components/ui/atoms/Input';

interface NameStepProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string;
}

export function NameStep({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  error,
}: NameStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-left">
        <Title
          as="h2"
          id="onboarding-title"
          className="text-xl font-bold text-fg"
        >
          마음토스에 오신 것을 환영합니다!
        </Title>
        <Text className="mt-2 text-sm text-fg-muted">
          사용하기 앞서 선생님의 원활한 마음토스 사용을 도와드릴게요.
          <br />
          먼저, 선생님의 성함은 무엇인가요?
        </Text>
      </div>

      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="홍길동 (한글/영문 2-12자)"
        maxLength={12}
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
