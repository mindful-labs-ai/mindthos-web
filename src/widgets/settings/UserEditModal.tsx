import React, { useRef } from 'react';

import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import {
  PhoneVerificationField,
  type PhoneVerificationFieldHandle,
} from '@/features/auth/components/PhoneVerificationField';
import { qualificationService } from '@/features/settings/services/qualificationService';
import { trackEvent } from '@/lib/mixpanel';
import {
  MixpanelError,
  MixpanelEvent,
} from '@/shared/constants/mixpanelEvents';
import { qualificationQueryKeys } from '@/shared/constants/queryKeys';
import { useDevice } from '@/shared/hooks/useDevice';
import { BackButton } from '@/shared/ui/atoms/BackButton';
import { Button } from '@/shared/ui/atoms/Button';
import { Input } from '@/shared/ui/atoms/Input';
import { Title } from '@/shared/ui/atoms/Title';
import { FormField } from '@/shared/ui/composites/FormField';
import { Modal } from '@/shared/ui/composites/Modal';
import { Select } from '@/shared/ui/composites/Select';
import type { SelectItem } from '@/shared/ui/composites/Select';
import { useToast } from '@/shared/ui/composites/Toast';
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

interface UserEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { userName, organization, userPhoneNumber, updateUser } =
    useAuthStore();
  const { toast } = useToast();

  // 자격 목록을 서버에서 조회
  const {
    data: qualificationOptions = [],
    isLoading: isQualificationsLoading,
  } = useQuery({
    queryKey: qualificationQueryKeys.all,
    queryFn: async () => {
      const list = await qualificationService.list();
      return list.map((q) => ({ value: q.name, label: q.name }));
    },
    enabled: open,
    staleTime: Infinity,
  });

  // 유저의 보유 자격 조회
  const { data: userQualifications } = useQuery({
    queryKey: qualificationQueryKeys.user(),
    queryFn: () => qualificationService.user(),
    enabled: open,
    staleTime: Infinity,
  });

  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  const [formData, setFormData] = React.useState<UserEditFormData>({
    name: '',
    organization: '',
    phoneNumber: '',
    qualification: [],
    referralSource: '',
    referralSourceCustom: '',
  });

  // 모달 열릴 때의 휴대폰 번호 스냅샷 — 변경 여부 판단용 (PhoneVerificationField 에 전달)
  const [initialPhoneNumber, setInitialPhoneNumber] = React.useState('');
  const phoneFieldRef = useRef<PhoneVerificationFieldHandle>(null);

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof UserEditFormData, string>>
  >({});

  // 모달이 열릴 때 초기 데이터 설정
  React.useEffect(() => {
    if (open) {
      trackEvent(MixpanelEvent.UserInfoEditModalOpen);
      const phoneSnapshot = userPhoneNumber || '';
      setFormData({
        name: userName || '',
        organization: organization || '',
        phoneNumber: phoneSnapshot,
        qualification: userQualifications?.map((q) => q.name) ?? [],
        referralSource: '',
        referralSourceCustom: '',
      });
      setInitialPhoneNumber(phoneSnapshot);
      setErrors({});
    }
  }, [open, userName, organization, userPhoneNumber, userQualifications]);

  const handleChange = (field: keyof UserEditFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      trackEvent(MixpanelEvent.UserInfoEditSuccess);
      toast({
        title: '정보 입력 완료',
        description: '사용자 정보가 성공적으로 수정되었습니다.',
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      trackEvent(MixpanelError.UserInfoEditFailed, {
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

    trackEvent(MixpanelEvent.UserInfoEditAttempt);

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

    // 번호가 변경된 경우에만 PhoneVerificationField 가 verify 를 요구한다.
    const verified = await phoneFieldRef.current?.ensureVerified();
    if (verified === false) return;

    mutation.mutate(formData);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className={isMobileView ? 'flex flex-col' : 'max-w-lg text-left'}
      closeOnOverlay={false}
      mobileVariant={isMobileView ? 'fullScreen' : 'center'}
      hideCloseButton={isMobileView}
    >
      <form
        onSubmit={handleSubmit}
        className={isMobileView ? 'flex flex-1 flex-col' : 'space-y-6 py-4'}
      >
        {isMobileView ? (
          <div className="flex h-[67px] flex-shrink-0 items-center gap-3 border-b border-grey-30 px-4 py-3">
            <BackButton onClick={() => onOpenChange(false)} />
            <p className="text-m font-medium text-grey-100">
              회원 정보 수정하기
            </p>
          </div>
        ) : (
          <div className="px-6">
            <Title as="h2" className="typo-xl font-headline">
              정보 입력하기
            </Title>
          </div>
        )}

        <div
          className={
            isMobileView
              ? 'flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-10'
              : 'space-y-4 px-6'
          }
        >
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

          <PhoneVerificationField
            ref={phoneFieldRef}
            value={formData.phoneNumber}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, phoneNumber: value }));
              if (errors.phoneNumber) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.phoneNumber;
                  return next;
                });
              }
            }}
            error={errors.phoneNumber}
            initialPhoneNumber={initialPhoneNumber}
            disabled={mutation.isPending}
          />

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

        </div>

        <div
          className={
            isMobileView
              ? 'flex-shrink-0 px-4 pb-4 md:px-10'
              : 'flex justify-center px-6 pt-4'
          }
        >
          <Button
            type="submit"
            variant="solid"
            tone="primary"
            size="lg"
            className={isMobileView ? 'w-full' : 'w-full max-w-md'}
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
              : isMobileView
                ? '수정하기'
                : '정보 입력하기'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
