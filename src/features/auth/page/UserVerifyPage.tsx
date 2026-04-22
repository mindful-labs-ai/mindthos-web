import React, { useEffect, useRef } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ROUTES } from '@/app/router/constants';
import {
  PhoneVerificationField,
  type PhoneVerificationFieldHandle,
} from '@/features/auth/components/PhoneVerificationField';
import { useSignupCheck } from '@/features/auth/hooks/useSignupCheck';
import {
  userVerifyFormSchema,
  type UserVerifyFormData,
} from '@/features/auth/page/userVerifyForm';
import {
  inputClass,
  inputErrorClass,
  outlineNeutralBtn,
  solidPrimaryBtnLg,
} from '@/features/auth/page/userVerifyStyles';
import { qualificationService } from '@/features/settings/services/qualificationService';
import { cn } from '@/lib/cn';
import { trackEvent } from '@/lib/mixpanel';
import {
  MixpanelError,
  MixpanelEvent,
} from '@/shared/constants/mixpanelEvents';
import {
  phoneVerificationQueryKeys,
  qualificationQueryKeys,
} from '@/shared/constants/queryKeys';
import { useDevice } from '@/shared/hooks/useDevice';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { Spinner } from '@/shared/ui';
import { BackButton } from '@/shared/ui/atoms/BackButton';
import { FormField } from '@/shared/ui/composites/FormField';
import { Select, type SelectItem } from '@/shared/ui/composites/Select';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';
import { REFERRAL_OPTIONS } from '@/widgets/settings/UserEditModal';

const UserVerifyPage: React.FC = () => {
  const phoneFieldRef = useRef<PhoneVerificationFieldHandle>(null);
  const { userName, organization, userPhoneNumber, updateUser, logout } =
    useAuthStore();
  const { navigateWithUtm } = useNavigateWithUtm();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isMobile, isTablet } = useDevice();
  const isDesktop = !isMobile && !isTablet;

  // 조건(휴대폰 인증 필요 여부)이 아닌 경우 직접 접근 차단
  const {
    required,
    isLoading: isSignupLoading,
    isError: isSignupError,
  } = useSignupCheck();

  useEffect(() => {
    // API 에러 시에는 리다이렉트하지 않고 에러 UI를 보여준다.
    if (!isSignupLoading && !isSignupError && !required) {
      navigateWithUtm(ROUTES.ROOT, { replace: true });
    }
  }, [isSignupLoading, isSignupError, required, navigateWithUtm]);

  const {
    data: qualificationOptions = [],
    isLoading: isQualificationsLoading,
  } = useQuery<SelectItem[]>({
    queryKey: qualificationQueryKeys.all,
    queryFn: async () => {
      const list = await qualificationService.list();
      return list.map((q) => ({ value: q.name, label: q.name }));
    },
    staleTime: Infinity,
  });

  const [formData, setFormData] = React.useState<UserVerifyFormData>({
    name: userName ?? '',
    organization: organization ?? '',
    qualification: [],
    referralSource: '',
    referralSourceCustom: '',
    phoneNumber: userPhoneNumber ?? '',
    // code 는 PhoneVerificationField 가 내부에서 관리하지만, 스키마 호환을 위해 유지
    code: '',
  });

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof UserVerifyFormData, string>>
  >({});

  const hasReferralOther = formData.referralSource === 'other';

  const clearFieldError = (field: keyof UserVerifyFormData) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleChange = (field: keyof UserVerifyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const mutation = useMutation({
    mutationFn: async (data: UserVerifyFormData) => {
      const referralSource =
        data.referralSource === 'other' && data.referralSourceCustom?.trim()
          ? data.referralSourceCustom.trim()
          : data.referralSource || undefined;

      // 순차 실행: 자격을 먼저 저장 → updateUser 가 성공해야 전체 완료로 간주.
      // 실패 시 재시도해도 멱등적(자격은 upsert, 사용자 정보는 덮어쓰기).
      await qualificationService.upsert(data.qualification);
      await updateUser({
        name: data.name,
        organization: data.organization,
        phoneNumber: data.phoneNumber,
        referralSource,
      });
    },
    onSuccess: () => {
      trackEvent(MixpanelEvent.SignupSuccess, { method: 'phone' });
      queryClient.invalidateQueries({
        queryKey: phoneVerificationQueryKeys.status(),
      });
      toast({ title: '회원가입이 완료되었습니다.' });
      navigateWithUtm(ROUTES.ROOT, { replace: true });
    },
    onError: (error) => {
      trackEvent(MixpanelError.SignupFailed, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast({
        title: '회원가입 처리에 실패했습니다.',
        description:
          error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent(MixpanelEvent.SignupAttempt, { method: 'phone' });

    const result = userVerifyFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof UserVerifyFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof UserVerifyFormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const verified = await phoneFieldRef.current?.ensureVerified();
    if (verified === false) return;

    mutation.mutate(formData);
  };

  const handleLogout = async () => {
    try {
      trackEvent(MixpanelEvent.Logout);
      await logout();
    } finally {
      navigateWithUtm(ROUTES.AUTH, { replace: true });
    }
  };

  const fieldsNode = (
    <div className={cn('flex flex-col', isDesktop ? 'gap-4' : 'gap-5')}>
      <FormField label="이름" required error={errors.name}>
        <input
          type="text"
          autoComplete="name"
          placeholder="이름을 입력해주세요"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          maxLength={20}
          className={cn(inputClass, errors.name && inputErrorClass)}
        />
      </FormField>

      <FormField label="소속" required error={errors.organization}>
        <input
          type="text"
          autoComplete="organization"
          placeholder="소속 기관을 입력해주세요"
          value={formData.organization}
          onChange={(e) => handleChange('organization', e.target.value)}
          maxLength={50}
          className={cn(inputClass, errors.organization && inputErrorClass)}
        />
      </FormField>

      <FormField label="보유 자격" required error={errors.qualification}>
        <Select
          items={qualificationOptions}
          multiple
          value={formData.qualification}
          onChange={(value) => {
            setFormData((prev) => ({
              ...prev,
              qualification: value as string[],
            }));
            clearFieldError('qualification');
          }}
          placeholder="보유 자격을 선택해주세요(복수 가능)"
          loading={isQualificationsLoading}
          className="bg-grey-10"
        />
      </FormField>

      <FormField label="가입 경로" required error={errors.referralSource}>
        <Select
          items={REFERRAL_OPTIONS}
          value={formData.referralSource}
          onChange={(value) => {
            const next = value as string;
            setFormData((prev) => ({
              ...prev,
              referralSource: next,
              referralSourceCustom:
                next === 'other' ? prev.referralSourceCustom : '',
            }));
            clearFieldError('referralSource');
          }}
          placeholder="가입 경로를 선택해주세요"
        />
        {hasReferralOther && (
          <input
            type="text"
            placeholder="가입 경로를 직접 입력해주세요"
            value={formData.referralSourceCustom ?? ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                referralSourceCustom: e.target.value,
              }))
            }
            maxLength={50}
            className={cn(inputClass, 'mt-2')}
          />
        )}
      </FormField>

      <PhoneVerificationField
        ref={phoneFieldRef}
        value={formData.phoneNumber}
        onChange={(value) => {
          setFormData((prev) => ({ ...prev, phoneNumber: value }));
          clearFieldError('phoneNumber');
        }}
        error={errors.phoneNumber}
        disabled={mutation.isPending}
      />
    </div>
  );

  const submitButton = (
    <button
      type="submit"
      disabled={mutation.isPending}
      className={solidPrimaryBtnLg}
    >
      {mutation.isPending ? '처리 중...' : '회원가입'}
    </button>
  );

  const logoutButton = (
    <div className="flex justify-center pt-2">
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm font-medium text-grey-80 underline transition-colors lg:hover:text-red-80"
      >
        로그인 페이지로 돌아가기
      </button>
    </div>
  );

  // 조건 체크 중 로딩 스플래시
  if (isSignupLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-contrast">
        <Spinner size="lg" />
      </div>
    );
  }

  // 조건 조회 실패 — 홈으로 튕기지 않고 재시도 UI 제공
  if (isSignupError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-contrast px-6 text-center">
        <p className="typo-m text-fg">
          인증 정보를 불러오지 못했습니다.
          <br />
          잠시 후 다시 시도해주세요.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className={outlineNeutralBtn}
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 조건 미충족(이미 인증 완료) 시 리다이렉트 진행 중 - 아무것도 렌더링하지 않음
  if (!required) {
    return null;
  }

  /* ---------- Mobile layout ---------- */
  if (isMobile) {
    return (
      <>
        <div className="flex min-h-screen flex-col bg-surface">
          <div className="flex h-[56px] flex-shrink-0 items-center gap-3 border-b border-border px-4">
            <BackButton onClick={handleLogout} />
            <p className="text-m font-medium text-fg">회원가입</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-5 pb-6 pt-6">
              <div className="mb-8 flex flex-col items-center gap-2">
                <h1 className="typo-2xl font-headline text-fg">회원가입</h1>
                <p className="typo-sm text-fg-muted">
                  상담사님의 정보를 입력해주세요
                </p>
              </div>
              {fieldsNode}
            </div>
            <div className="flex-shrink-0 border-t border-border px-5 pb-6 pt-4">
              {submitButton}
            </div>
          </form>
        </div>
      </>
    );
  }

  /* ---------- Tablet layout ---------- */
  if (isTablet) {
    return (
      <>
        <div className="flex min-h-screen flex-col bg-surface">
          <div className="flex h-[60px] flex-shrink-0 items-center gap-3 border-b border-border px-6">
            <BackButton onClick={handleLogout} />
            <p className="text-m font-medium text-fg">회원가입</p>
          </div>
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex w-full max-w-2xl flex-col px-8 pt-10"
          >
            <div className="mb-10 flex flex-col items-center gap-3">
              <h1 className="text-3xl font-headline text-fg">회원가입</h1>
              <p className="typo-m text-fg-muted">
                상담사님의 정보를 입력해주세요.
              </p>
            </div>
            <div className="flex-1">{fieldsNode}</div>
            <div className="mt-10">{submitButton}</div>
          </form>
          <div className="mx-auto w-full max-w-2xl px-8 pb-10 pt-6">
            {logoutButton}
          </div>
        </div>
      </>
    );
  }

  /* ---------- Desktop layout ---------- */
  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-contrast px-6 py-10">
        <div className="max-h-[947px] w-full max-w-[706px] rounded-2xl bg-surface p-10 shadow-sm">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 px-36 pb-8 pt-12"
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <h1 className="text-2xl font-headline text-fg">회원가입</h1>
              <p className="typo-sm text-fg-muted">
                상담사님의 정보를 입력해주세요.
              </p>
            </div>
            {fieldsNode}
            <div className="mt-4">{submitButton}</div>
          </form>
        </div>
        <div className="w-full max-w-xl pt-6">{logoutButton}</div>
      </div>
    </>
  );
};

export default UserVerifyPage;
