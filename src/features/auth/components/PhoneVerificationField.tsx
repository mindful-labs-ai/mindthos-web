import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';

import { usePhoneVerification } from '@/features/auth/hooks/usePhoneVerification';
import {
  formatPhoneNumber as defaultFormatPhoneNumber,
  userVerifyFormSchema,
} from '@/features/auth/page/userVerifyForm';
import {
  inputClass,
  inputErrorClass,
  outlineNeutralBtn,
  outlinePrimaryBtn,
} from '@/features/auth/page/userVerifyStyles';
import { cn } from '@/lib/cn';
import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { useToast } from '@/shared/ui/composites/Toast';

export interface PhoneVerificationFieldProps {
  /** 현재 휴대폰 번호 값 */
  value: string;
  /** 번호 변경 콜백 — 포매팅된 값이 전달됨 */
  onChange: (value: string) => void;
  /** 부모 검증 에러 (스키마 검증 등) */
  error?: string;
  /** 부모가 유발한 disabled (예: 제출 중) */
  disabled?: boolean;
  /**
   * 초기 휴대폰 번호. 값이 이 값과 동일하면 변경 없음으로 간주하고
   * 인증을 요구하지 않는다. 생략하면 항상 인증이 필요하다.
   */
  initialPhoneNumber?: string;
}

export interface PhoneVerificationFieldHandle {
  /**
   * 제출 게이트:
   * - 번호가 변경되지 않았으면 true (검증 불필요)
   * - 이미 verified 이면 true
   * - codeSent 상태에서 자동 verify 시도
   * - 그 외에는 인라인 에러 세팅 후 false
   */
  ensureVerified: () => Promise<boolean>;
}

/**
 * 휴대폰 인증 필드 — 번호 입력 + 인증번호 요청 + 코드 검증 UI를 캡슐화.
 * 가입(`UserVerifyPage`)과 정보 수정(`UserEditModal`) 양쪽에서 재사용.
 */
export const PhoneVerificationField = forwardRef<
  PhoneVerificationFieldHandle,
  PhoneVerificationFieldProps
>(function PhoneVerificationField(
  { value, onChange, error, disabled, initialPhoneNumber },
  ref
) {
  const phoneFieldId = React.useId();
  const codeFieldId = React.useId();
  const { toast } = useToast();
  const phoneVerification = usePhoneVerification();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);

  const isDirty =
    initialPhoneNumber === undefined ? true : value !== initialPhoneNumber;

  // 번호가 원본으로 돌아가면 검증 상태를 자동 리셋한다.
  useEffect(() => {
    if (
      !isDirty &&
      (phoneVerification.codeSent || phoneVerification.verified)
    ) {
      phoneVerification.reset();
      setCode('');
      setCodeError(null);
    }
    // phoneVerification.reset 은 useCallback 으로 안정적
  }, [isDirty, phoneVerification]);

  const resetCodeState = () => {
    phoneVerification.reset();
    setCode('');
    setCodeError(null);
  };

  const handlePhoneChange = (raw: string) => {
    const formatted = defaultFormatPhoneNumber(raw);
    if (phoneVerification.codeSent || phoneVerification.verified) {
      resetCodeState();
    }
    onChange(formatted);
  };

  const resendLabel =
    phoneVerification.cooldownRemaining > 0
      ? `재전송 ${phoneVerification.cooldownRemaining}s`
      : phoneVerification.codeSent
        ? '재전송'
        : '인증번호 받기';

  const isResendDisabled =
    disabled ||
    phoneVerification.isRequesting ||
    phoneVerification.cooldownRemaining > 0 ||
    phoneVerification.verified ||
    !isDirty;

  const handleRequestCode = async () => {
    const phoneResult = userVerifyFormSchema.shape.phoneNumber.safeParse(value);
    if (!phoneResult.success) {
      toast({
        title:
          phoneResult.error.issues[0]?.message ??
          '올바른 번호를 입력해 주세요.',
      });
      return;
    }
    trackEvent(MixpanelEvent.PhoneVerificationRequest);
    setCodeError(null);
    const result = await phoneVerification.requestCode(value);
    if (result.ok) {
      toast({ title: '인증번호를 보냈어요.' });
      return;
    }
    if (result.alreadyRegisteredEmail) return;
    toast({
      title: '인증번호 발송 실패',
      description: result.message ?? '잠시 후 다시 시도해 주세요.',
    });
  };

  const handleVerifyCode = async (): Promise<boolean> => {
    if (code.length !== 6) {
      setCodeError('인증번호를 입력해 주세요.');
      return false;
    }
    trackEvent(MixpanelEvent.PhoneVerificationVerify);
    const result = await phoneVerification.verifyCode(code);
    if (result.ok) {
      setCodeError(null);
      return true;
    }
    if (!result.alreadyRegisteredEmail) {
      setCodeError('인증번호를 다시 확인해 주세요.');
    }
    return false;
  };

  useImperativeHandle(
    ref,
    () => ({
      async ensureVerified() {
        if (!isDirty) return true;
        if (phoneVerification.verified) return true;
        if (!phoneVerification.codeSent) {
          setCodeError('인증번호 받기를 누른 뒤 6자리 번호를 입력해 주세요');
          return false;
        }
        return handleVerifyCode();
      },
    }),
    // handleVerifyCode, isDirty, phoneVerification 변화 반영
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDirty, phoneVerification.verified, phoneVerification.codeSent, code]
  );

  const alreadyRegisteredMessage = phoneVerification.lastError
    ?.alreadyRegisteredEmail ? (
    <p className="typo-sm text-danger" role="alert">
      <span className="font-medium">
        {phoneVerification.lastError.alreadyRegisteredEmail}
      </span>
      {' 으로 이미 인증된 번호입니다.'}
      <br />
      해당 아이디로 로그인해 주세요
    </p>
  ) : null;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={phoneFieldId} className="typo-sm font-medium text-fg">
        휴대폰 번호
        <span className="ml-1 text-danger" aria-label="required">
          *
        </span>
      </label>
      <div className="flex items-stretch gap-2">
        <input
          id={phoneFieldId}
          type="tel"
          autoComplete="tel"
          placeholder="010-1234-5678"
          value={value}
          onChange={(e) => handlePhoneChange(e.target.value)}
          maxLength={13}
          disabled={disabled || phoneVerification.verified}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${phoneFieldId}-error` : undefined}
          className={cn(inputClass, 'flex-1', error && inputErrorClass)}
        />
        <button
          type="button"
          onClick={handleRequestCode}
          disabled={isResendDisabled}
          className={outlineNeutralBtn}
        >
          {phoneVerification.isRequesting ? '발송 중...' : resendLabel}
        </button>
      </div>
      {error && (
        <p
          id={`${phoneFieldId}-error`}
          className="typo-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}
      {!phoneVerification.codeSent &&
        !error &&
        (alreadyRegisteredMessage ??
          (codeError ? (
            <p className="typo-sm text-danger" role="alert">
              {codeError}
            </p>
          ) : null))}
      {phoneVerification.codeSent && (
        <div className="mt-2 flex flex-col gap-1">
          <label htmlFor={codeFieldId} className="sr-only">
            인증번호
          </label>
          <div className="flex items-stretch gap-2">
            <div
              className={cn(
                'flex h-10 flex-1 items-center gap-2 rounded-md border-2 border-input-border bg-input-bg px-4 transition-colors focus-within:border-primary',
                !!codeError && 'border-danger focus-within:border-danger',
                phoneVerification.verified &&
                  'border-green-80 text-grey-80 opacity-60 focus-within:border-green-80'
              )}
            >
              <input
                id={codeFieldId}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="인증번호 6자리"
                value={code}
                onChange={(e) => {
                  const only = e.target.value
                    .replace(/[^0-9]/g, '')
                    .slice(0, 6);
                  setCode(only);
                  if (codeError) setCodeError(null);
                }}
                maxLength={6}
                disabled={phoneVerification.verified}
                aria-invalid={!!codeError || undefined}
                aria-describedby={
                  codeError ? `${codeFieldId}-error` : undefined
                }
                className="typo-sm flex-1 bg-transparent text-fg outline-none placeholder:text-input-placeholder disabled:cursor-not-allowed"
              />
              {!phoneVerification.verified &&
                phoneVerification.expiresLabel && (
                  <span className="typo-sm flex-shrink-0 text-danger">
                    {phoneVerification.expiresLabel}
                  </span>
                )}
            </div>
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={
                phoneVerification.verified ||
                phoneVerification.isVerifying ||
                code.length !== 6
              }
              className={outlinePrimaryBtn}
            >
              {phoneVerification.isVerifying
                ? '확인 중...'
                : phoneVerification.verified
                  ? '인증 완료'
                  : '인증 확인'}
            </button>
          </div>
          {phoneVerification.verified ? (
            <p className="typo-sm text-primary">인증을 마쳤어요.</p>
          ) : (
            (alreadyRegisteredMessage ??
            (codeError ? (
              <p
                id={`${codeFieldId}-error`}
                className="typo-sm text-danger"
                role="alert"
              >
                {codeError}
              </p>
            ) : null))
          )}
        </div>
      )}
    </div>
  );
});
