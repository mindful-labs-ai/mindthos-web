// TODO: 삭제 예정 - OnboardingModal에서만 사용되며, OnboardingModal이 사용되지 않음
import { Text, Title } from '@/components/ui';
import { Button } from '@/components/ui/atoms/Button';
import { Input } from '@/components/ui/atoms/Input';
import { FormField } from '@/components/ui/composites/FormField';
import { Select, type SelectItem } from '@/components/ui/composites/Select';

const ORGANIZATION_OPTIONS: SelectItem[] = [
  { value: '', label: '선택해주세요' },
  { value: '민간상담센터', label: '민간상담센터' },
  { value: '공공기관', label: '공공기관' },
  { value: '초,중,고등학교', label: '초,중,고등학교' },
  { value: '대학상담센터', label: '대학상담센터' },
  { value: '프리랜서', label: '프리랜서' },
  { value: '기타', label: '기타 (직접입력)' },
];

interface InfoStepProps {
  name: string;
  phoneNumber: string;
  selectedOrganization: string;
  customOrganization: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onOrganizationSelect: (value: string) => void;
  onCustomOrganizationChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string;
}

export function InfoStep({
  name,
  phoneNumber,
  selectedOrganization,
  customOrganization,
  onNameChange,
  onPhoneChange,
  onOrganizationSelect,
  onCustomOrganizationChange,
  onSubmit,
  isSubmitting,
  error,
}: InfoStepProps) {
  const isValid = name.trim().length >= 2;
  const showCustomInput = selectedOrganization === '기타';

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
          먼저, 기본 정보를 입력해주세요.
        </Text>
      </div>

      <div className="space-y-4 text-left">
        <FormField label="이름" required>
          <Input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="홍길동 (한글/영문 2-12자)"
            maxLength={12}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="전화번호">
          <Input
            type="tel"
            value={phoneNumber}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="010-1234-5678"
            maxLength={13}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="소속">
          <Select
            items={ORGANIZATION_OPTIONS}
            value={selectedOrganization}
            onChange={(value) => onOrganizationSelect(value as string)}
            placeholder="소속을 선택해주세요"
            disabled={isSubmitting}
          />
        </FormField>

        {showCustomInput && (
          <FormField label="소속 직접입력">
            <Input
              type="text"
              value={customOrganization}
              onChange={(e) => onCustomOrganizationChange(e.target.value)}
              placeholder="소속을 입력해주세요"
              maxLength={50}
              disabled={isSubmitting}
            />
          </FormField>
        )}
      </div>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <Button
        onClick={onSubmit}
        disabled={isSubmitting || !isValid}
        tone="primary"
        className="w-full"
      >
        {isSubmitting ? '저장 중...' : '다음'}
      </Button>
    </div>
  );
}
