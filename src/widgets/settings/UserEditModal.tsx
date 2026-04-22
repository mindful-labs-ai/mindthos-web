import React, { useRef } from 'react';

import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import {
  PhoneVerificationField,
  type PhoneVerificationFieldHandle,
} from '@/features/auth/components/PhoneVerificationField';
import { passwordChangeSchema } from '@/features/auth/schemas/passwordChangeSchema';
import { qualificationService } from '@/features/settings/services/qualificationService';
import { cn } from '@/lib/cn';
import { trackEvent } from '@/lib/mixpanel';
import { authService } from '@/shared/api/services/auth/authService';
import { AuthError, AuthErrorCode } from '@/shared/api/services/auth/types';
import {
  MixpanelError,
  MixpanelEvent,
} from '@/shared/constants/mixpanelEvents';
import { qualificationQueryKeys } from '@/shared/constants/queryKeys';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
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

const PASSWORD_MATCH_DEBOUNCE_MS = 300;

// 기본 정보 스키마 (휴대폰은 비어있는 상태도 허용 — 번호 없는 사용자가 다른 정보만 수정 가능)
const baseInfoSchema = z.object({
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
    .optional()
    .refine(
      (v) => !v || /^01[016789]-?\d{3,4}-?\d{4}$/.test(v),
      '올바른 휴대전화 번호를 입력해주세요. (예: 010-1234-5678)'
    ),
  qualification: z.array(z.string()).min(1, '보유 자격을 선택해주세요.'),
  referralSource: z.string().optional().or(z.literal('')),
});

type UserEditFormData = z.infer<typeof baseInfoSchema> & {
  referralSourceCustom?: string;
};

interface UserEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type PhoneMode = 'display' | 'editing';

export const UserEditModal: React.FC<UserEditModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { userName, organization, userPhoneNumber, updateUser } =
    useAuthStore();
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();

  const isOAuthUser = user?.app_metadata?.provider !== 'email';

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
  // 휴대폰 UI 모드: 'display' = readonly 표시, 'editing' = 번호 수정/추가 중
  const [phoneMode, setPhoneMode] = React.useState<PhoneMode>('display');
  const phoneFieldRef = useRef<PhoneVerificationFieldHandle>(null);

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof UserEditFormData, string>>
  >({});

  // 비밀번호 변경 섹션 (이메일 사용자만)
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] =
    React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');

  const debouncedNewPassword = useDebouncedValue(
    newPassword,
    PASSWORD_MATCH_DEBOUNCE_MS
  );
  const debouncedNewPasswordConfirm = useDebouncedValue(
    newPasswordConfirm,
    PASSWORD_MATCH_DEBOUNCE_MS
  );
  const passwordMatchState: 'idle' | 'match' | 'mismatch' =
    React.useMemo(() => {
      if (!debouncedNewPasswordConfirm) return 'idle';
      return debouncedNewPassword === debouncedNewPasswordConfirm
        ? 'match'
        : 'mismatch';
    }, [debouncedNewPassword, debouncedNewPasswordConfirm]);

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
      setPhoneMode('display');
      setErrors({});
      setIsPasswordSectionOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setPasswordError('');
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

  const handleStartPhoneEdit = () => {
    setPhoneMode('editing');
    // 기존 번호가 있으면 값 유지(변경 유도), 없으면 빈 값으로 새로 입력 시작
    if (!initialPhoneNumber) {
      setFormData((prev) => ({ ...prev, phoneNumber: '' }));
    }
  };

  const handleCancelPhoneEdit = () => {
    setPhoneMode('display');
    setFormData((prev) => ({ ...prev, phoneNumber: initialPhoneNumber }));
    if (errors.phoneNumber) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.phoneNumber;
        return next;
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
          phoneNumber: data.phoneNumber || undefined,
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

    const result = baseInfoSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof UserEditFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof UserEditFormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // 번호 편집 중이면 PhoneVerificationField 가 verify 를 요구.
    if (phoneMode === 'editing') {
      const verified = await phoneFieldRef.current?.ensureVerified();
      if (verified === false) return;
    }

    // 비밀번호 변경 섹션이 열려있는 경우: 스키마 검증 + 변경 API 호출
    if (!isOAuthUser && isPasswordSectionOpen) {
      const pwParsed = passwordChangeSchema.safeParse({
        currentPassword,
        newPassword,
        newPasswordConfirm,
      });
      if (!pwParsed.success) {
        setPasswordError(
          pwParsed.error.issues[0]?.message ?? '비밀번호를 확인해주세요.'
        );
        return;
      }

      setPasswordError('');
      trackEvent(MixpanelEvent.PasswordUpdateAttempt, {
        context: 'user_edit',
      });

      try {
        await authService.changePassword(currentPassword, newPassword);
        trackEvent(MixpanelEvent.PasswordUpdateSuccess, {
          context: 'user_edit',
        });
      } catch (err) {
        trackEvent(MixpanelEvent.PasswordUpdateFailed, {
          context: 'user_edit',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        const msg =
          err instanceof AuthError &&
          err.code === AuthErrorCode.INVALID_CREDENTIALS
            ? '현재 비밀번호가 올바르지 않습니다.'
            : err instanceof Error
              ? err.message
              : '비밀번호 변경에 실패했습니다.';
        setPasswordError(msg);
        return;
      }
    }

    mutation.mutate(formData);
  };

  const isSubmitting = mutation.isPending;
  const isPasswordBlockInvalid =
    !isOAuthUser &&
    isPasswordSectionOpen &&
    (!currentPassword ||
      passwordMatchState !== 'match' ||
      newPassword.length < 6);

  const submitDisabled =
    isSubmitting ||
    !formData.name.trim() ||
    !formData.organization?.trim() ||
    !formData.qualification ||
    formData.qualification.length === 0 ||
    isPasswordBlockInvalid;

  const hasInitialPhone = !!initialPhoneNumber;

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

          {phoneMode === 'editing' ? (
            <div className="flex flex-col gap-2">
              <PhoneVerificationField
                ref={phoneFieldRef}
                value={formData.phoneNumber ?? ''}
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
                disabled={isSubmitting}
              />
              {hasInitialPhone && (
                <button
                  type="button"
                  onClick={handleCancelPhoneEdit}
                  className="typo-sm self-start text-fg-muted underline-offset-2 lg:hover:underline"
                  disabled={isSubmitting}
                >
                  취소
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="typo-sm font-medium text-fg">
                휴대폰 번호
                {hasInitialPhone && (
                  <span className="ml-1 text-danger" aria-label="required">
                    *
                  </span>
                )}
              </label>
              {hasInitialPhone ? (
                <div className="flex items-center justify-between gap-2 rounded-md border border-input-border bg-grey-10 px-4 py-2">
                  <span className="typo-sm text-fg">{initialPhoneNumber}</span>
                  <button
                    type="button"
                    onClick={handleStartPhoneEdit}
                    className="typo-sm font-medium text-primary lg:hover:underline"
                    disabled={isSubmitting}
                  >
                    번호 수정
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStartPhoneEdit}
                  className="typo-sm flex h-10 items-center justify-center rounded-md border-2 border-dashed border-input-border bg-input-bg font-medium text-primary lg:hover:bg-surface-contrast"
                  disabled={isSubmitting}
                >
                  + 번호 추가하기
                </button>
              )}
            </div>
          )}

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

          {!isOAuthUser && (
            <>
              <div className="h-0 border-t" />
              <div className="rounded-md border border-grey-30 bg-surface-contrast p-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordSectionOpen((v) => !v);
                    if (isPasswordSectionOpen) {
                      setCurrentPassword('');
                      setNewPassword('');
                      setNewPasswordConfirm('');
                      setPasswordError('');
                    }
                  }}
                  className="flex w-full items-center justify-between"
                >
                  <span className="typo-sm font-medium text-fg">
                    비밀번호 변경
                  </span>
                  <span className="typo-sm text-fg-muted">
                    {isPasswordSectionOpen ? '닫기' : '열기'}
                  </span>
                </button>

                {isPasswordSectionOpen && (
                  <div className="mt-4 flex flex-col gap-3">
                    {passwordError && (
                      <p className="typo-sm text-danger" role="alert">
                        {passwordError}
                      </p>
                    )}

                    <input
                      type="password"
                      placeholder="현재 비밀번호"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                      className="auth-input"
                      disabled={isSubmitting}
                    />
                    <input
                      type="password"
                      placeholder="새 비밀번호 (6자 이상)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      className="auth-input"
                      disabled={isSubmitting}
                    />
                    <div className="flex flex-col gap-1">
                      <input
                        type="password"
                        placeholder="새 비밀번호 확인"
                        value={newPasswordConfirm}
                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                        autoComplete="new-password"
                        className="auth-input"
                        disabled={isSubmitting}
                      />
                      {passwordMatchState === 'mismatch' && (
                        <p className="typo-xs font-medium text-red-80">
                          비밀번호가 일치하지 않습니다
                        </p>
                      )}
                      {passwordMatchState === 'match' && (
                        <p className="typo-xs font-medium text-green-80">
                          비밀번호가 일치합니다
                        </p>
                      )}
                    </div>
                    <p
                      className={cn(
                        'typo-xs text-fg-muted',
                        newPassword.length > 0 && newPassword.length < 6
                          ? 'text-danger'
                          : ''
                      )}
                    >
                      비밀번호는 최소 6자 이상이어야 합니다.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
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
            disabled={submitDisabled}
          >
            {isSubmitting
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
