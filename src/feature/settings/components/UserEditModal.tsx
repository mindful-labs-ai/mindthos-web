import React from 'react';

import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { Button } from '@/components/ui/atoms/Button';
import { Input } from '@/components/ui/atoms/Input';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { FormField } from '@/components/ui/composites/FormField';
import { Modal } from '@/components/ui/composites/Modal';
import { Select } from '@/components/ui/composites/Select';
import type { SelectItem } from '@/components/ui/composites/Select';
import { useToast } from '@/components/ui/composites/Toast';
import { qualificationService } from '@/feature/settings/services/qualificationService';
import { trackEvent } from '@/lib/mixpanel';
import { useAuthStore } from '@/stores/authStore';

/** 가입 경로 선택 아이템 */
export const REFERRAL_OPTIONS: SelectItem[] = [
  { value: 'search', label: '인터넷 검색' },
  { value: 'cafe', label: '네이버 카페' },
  { value: 'referral', label: '지인 소개' },
  { value: 'education', label: '워크숍 & 세미나' },
  { value: 'sns', label: '소셜 미디어' },
  { value: 'blog', label: '마음토스 블로그' },
  { value: 'other', label: '기타' },
];

// Zod 스키마 정의 (공통: 휴대폰 필수 + 보유 자격 필수)
const formSchema = z.object({
  name: z
    .string()
    .min(1, '이름을 입력해주세요.')
    .max(20, '이름은 20자 이내로 입력해주세요.'),
  organization: z
    .string()
    .min(1, '소속 기관을 입력해주세요.')
    .max(50, '소속 기관은 50자 이내로 입력해주세요.'),
  phoneNumber: z
    .string()
    .min(1, '휴대폰 번호를 입력해주세요.')
    .regex(
      /^01[016789]-?\d{3,4}-?\d{4}$/,
      '올바른 휴대전화 번호를 입력해주세요. (예: 010-1234-5678)'
    ),
  qualification: z.array(z.string()).min(1, '보유 자격을 선택해주세요.'),
  referralSource: z.string().optional().or(z.literal('')),
});

type UserEditFormData = z.infer<typeof formSchema> & {
  referralSourceCustom?: string;
};

// 휴대전화 번호 포맷팅 (하이픈 자동 추가)
const formatPhoneNumber = (value: string): string => {
  const numbersOnly = value.replace(/[^0-9]/g, '');

  if (numbersOnly.length <= 3) {
    return numbersOnly;
  } else if (numbersOnly.length <= 7) {
    return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
  } else {
    return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7, 11)}`;
  }
};

interface UserEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** 퀘스트 미션에서 열린 경우 true */
  isQuestMode?: boolean;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  isQuestMode = false,
}) => {
  const { userName, organization, userPhoneNumber, updateUser } =
    useAuthStore();
  const { toast } = useToast();

  // 자격 목록을 서버에서 조회
  const {
    data: qualificationOptions = [],
    isLoading: isQualificationsLoading,
  } = useQuery({
    queryKey: ['qualifications'],
    queryFn: async () => {
      const list = await qualificationService.list();
      return list.map((q) => ({ value: q.name, label: q.name }));
    },
    enabled: open,
    staleTime: Infinity,
  });

  const [formData, setFormData] = React.useState<UserEditFormData>({
    name: '',
    organization: '',
    phoneNumber: '',
    qualification: [],
    referralSource: '',
    referralSourceCustom: '',
  });

  const hasReferralOther = formData.referralSource === 'other';

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof UserEditFormData, string>>
  >({});

  // 모달이 열릴 때 초기 데이터 설정
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: userName || '',
        organization: organization || '',
        phoneNumber: userPhoneNumber || '',
        qualification: [],
        referralSource: '',
        referralSourceCustom: '',
      });
      setErrors({});
    }
  }, [open, userName, organization, userPhoneNumber]);

  const handleChange = (field: keyof UserEditFormData, value: string) => {
    let processedValue = value;

    // 휴대전화 번호는 자동 포맷팅 적용
    if (field === 'phoneNumber') {
      processedValue = formatPhoneNumber(value);
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: UserEditFormData) => {
      // 가입 경로: "other"이면 직접 입력값으로 치환
      const referralSource =
        data.referralSource === 'other' && data.referralSourceCustom?.trim()
          ? data.referralSourceCustom.trim()
          : data.referralSource || undefined;

      const promises: Promise<unknown>[] = [
        updateUser({
          name: data.name,
          organization: data.organization,
          phoneNumber: data.phoneNumber,
          referralSource,
        }),
      ];

      // 자격 정보가 있으면 edge function으로 저장
      if (data.qualification && data.qualification.length > 0) {
        promises.push(qualificationService.upsert(data.qualification));
      }

      await Promise.all(promises);
    },
    onSuccess: () => {
      trackEvent('user_info_edit_success');
      toast({
        title: '정보 입력 완료',
        description: '사용자 정보가 성공적으로 수정되었습니다.',
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      trackEvent('user_info_edit_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      console.error('Update user failed:', error);
      toast({
        title: '정보 입력 실패',
        description:
          error instanceof Error
            ? error.message
            : '정보 입력에 실패했습니다. 다시 시도해주세요.',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = formSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof UserEditFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof UserEditFormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-lg text-left"
      closeOnOverlay={false}
    >
      <form onSubmit={handleSubmit} className="space-y-6 py-4">
        <div className="px-6">
          {isQuestMode && (
            <>
              <Text className="mb-1 text-sm font-bold text-primary">
                마지막 미션
              </Text>
              <Title as="h2" className="text-2xl font-bold">
                선생님의 성함은 무엇인가요?
              </Title>
              <Text className="mt-3 text-sm leading-relaxed text-fg-muted">
                마음토스에서 상담 &amp; 임상 보고서를 만드실 때,
                <br />
                여기서 입력된 선생님의 정보가 기입됩니다.
              </Text>
            </>
          )}
          {!isQuestMode && (
            <Title as="h2" className="text-2xl font-bold">
              정보 입력하기
            </Title>
          )}
        </div>

        <div className="space-y-4 px-6">
          <FormField label="이름" required error={errors.name}>
            <Input
              type="text"
              placeholder="이름을 입력해주세요"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              maxLength={20}
              error={!!errors.name}
            />
          </FormField>

          <FormField label="소속" required error={errors.organization}>
            <Input
              type="text"
              placeholder="소속 기관을 입력해주세요"
              value={formData.organization}
              onChange={(e) => handleChange('organization', e.target.value)}
              maxLength={50}
              error={!!errors.organization}
            />
          </FormField>

          <FormField label="휴대폰 번호" required error={errors.phoneNumber}>
            <Input
              type="tel"
              placeholder="010-1234-5678"
              value={formData.phoneNumber}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              maxLength={13}
              error={!!errors.phoneNumber}
            />
          </FormField>

          <FormField label="보유 자격" required error={errors.qualification}>
            <Select
              items={qualificationOptions}
              multiple
              value={formData.qualification}
              onChange={(value) => {
                const newValue = value as string[];
                setFormData((prev) => ({
                  ...prev,
                  qualification: newValue,
                }));
                if (errors.qualification) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.qualification;
                    return newErrors;
                  });
                }
              }}
              placeholder="보유 자격을 선택해주세요"
              loading={isQualificationsLoading}
            />
          </FormField>

          {isQuestMode && (
            <FormField label="가입 경로" error={errors.referralSource}>
              <Select
                items={REFERRAL_OPTIONS}
                value={formData.referralSource}
                onChange={(value) => {
                  const newValue = value as string;
                  handleChange('referralSource', newValue);
                  if (newValue !== 'other') {
                    setFormData((prev) => ({
                      ...prev,
                      referralSourceCustom: '',
                    }));
                  }
                }}
                placeholder="가입 경로를 선택해주세요"
              />
              {hasReferralOther && (
                <Input
                  type="text"
                  placeholder="가입 경로를 직접 입력해주세요"
                  value={formData.referralSourceCustom}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      referralSourceCustom: e.target.value,
                    }))
                  }
                  maxLength={50}
                  className="mt-2"
                />
              )}
            </FormField>
          )}
        </div>

        <div className="flex justify-center px-6 pt-4">
          <Button
            type="submit"
            variant="solid"
            tone="primary"
            size="lg"
            className="w-full max-w-md"
            disabled={
              mutation.isPending ||
              !formData.name.trim() ||
              !formData.organization?.trim() ||
              !formData.phoneNumber?.trim() ||
              !formData.qualification ||
              formData.qualification.length === 0
            }
          >
            {mutation.isPending
              ? '저장 중...'
              : isQuestMode
                ? '저장하고 미션 완료하기'
                : '정보 입력하기'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
