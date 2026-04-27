import { useCallback, useEffect, useRef, useState } from 'react';

import {
  phoneVerificationService,
  type PhoneVerificationVerifyResponse,
} from '@/features/auth/services/phoneVerificationService';

interface EdgeFunctionError {
  success?: false;
  error?: string;
  message?: string;
  retry_after_seconds?: number;
  email?: string;
}

const PHONE_ALREADY_REGISTERED = 'PHONE_ALREADY_REGISTERED';
const RESEND_COOLDOWN = 'RESEND_COOLDOWN';

const isEdgeFunctionError = (err: unknown): err is EdgeFunctionError =>
  typeof err === 'object' && err !== null;

const formatSeconds = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

/**
 * 인증 액션 결과 — 성공/실패와 함께 즉시 사용 가능한 에러 정보를 담는다.
 * state를 await 후 읽으면 스테일 클로저가 되므로 호출자는 이 반환값을 써야 한다.
 */
export interface PhoneVerificationActionResult {
  ok: boolean;
  errorCode?: string;
  message?: string;
  alreadyRegisteredEmail?: string;
}

/**
 * 렌더링용 마지막 에러 — 액션 시점에 세팅되고 다음 액션/reset 시 초기화된다.
 */
export interface PhoneVerificationLastError {
  source: 'request' | 'verify';
  errorCode?: string;
  message: string;
  alreadyRegisteredEmail?: string;
}

export interface UsePhoneVerificationReturn {
  /** 인증번호 발송 완료 → 코드 입력창 노출 여부 */
  codeSent: boolean;
  /** 인증 완료 여부 */
  verified: boolean;
  /** 재발송까지 남은 초 (0이면 재발송 가능) */
  cooldownRemaining: number;
  /** 코드 만료까지 남은 초 (0이면 만료) */
  expiresRemaining: number;
  /** 만료시간 카운트다운 표시용 mm:ss (코드 미발송 시 null) */
  expiresLabel: string | null;
  /** 요청/검증 진행 여부 */
  isRequesting: boolean;
  isVerifying: boolean;
  /** 마지막 에러 (렌더링용) — 액션 시 세팅/초기화 */
  lastError: PhoneVerificationLastError | null;
  /** 인증번호 요청 */
  requestCode: (phoneNumber: string) => Promise<PhoneVerificationActionResult>;
  /** 인증번호 검증 */
  verifyCode: (code: string) => Promise<PhoneVerificationActionResult>;
  /** 상태 리셋 (번호 변경 시 등) */
  reset: () => void;
}

export const usePhoneVerification = (): UsePhoneVerificationReturn => {
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastError, setLastError] = useState<PhoneVerificationLastError | null>(
    null
  );

  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  const tickerRef = useRef<number | null>(null);

  // 1초 틱 — 쿨다운/만료 카운트다운 구동
  // 둘 다 소진되면 자동으로 인터벌을 멈춰 무의미한 리렌더를 방지.
  useEffect(() => {
    if (cooldownUntil === null && expiresAt === null) return;

    const stop = () => {
      if (tickerRef.current !== null) {
        window.clearInterval(tickerRef.current);
        tickerRef.current = null;
      }
    };

    const tick = () => {
      const currentNow = Date.now();
      setNow(currentNow);
      const cooldownDone =
        cooldownUntil === null || currentNow >= cooldownUntil;
      const expiresDone = expiresAt === null || currentNow >= expiresAt;
      if (cooldownDone && expiresDone) stop();
    };

    tickerRef.current = window.setInterval(tick, 1000);
    tick();

    return stop;
  }, [cooldownUntil, expiresAt]);

  const cooldownRemaining =
    cooldownUntil !== null
      ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
      : 0;
  const expiresRemaining =
    expiresAt !== null ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : 0;

  const expiresLabel =
    expiresAt !== null ? formatSeconds(expiresRemaining) : null;

  const parseError = (
    source: 'request' | 'verify',
    err: unknown,
    fallbackMessage: string
  ): PhoneVerificationLastError => {
    if (isEdgeFunctionError(err)) {
      return {
        source,
        errorCode: err.error,
        message: err.message ?? fallbackMessage,
        alreadyRegisteredEmail:
          err.error === PHONE_ALREADY_REGISTERED ? err.email : undefined,
      };
    }
    return { source, message: fallbackMessage };
  };

  const requestCode = useCallback(
    async (phoneNumber: string): Promise<PhoneVerificationActionResult> => {
      setLastError(null);
      setIsRequesting(true);

      try {
        const res = await phoneVerificationService.requestCode(phoneNumber);
        setCodeSent(true);
        setVerified(false);
        setExpiresAt(new Date(res.expires_at).getTime());
        setCooldownUntil(Date.now() + res.cooldown_seconds * 1000);
        return { ok: true };
      } catch (err) {
        const parsed = parseError(
          'request',
          err,
          '인증번호를 보내지 못했어요.'
        );
        // RESEND_COOLDOWN: 서버가 알려준 retry_after_seconds 만큼 쿨다운 연장
        if (
          parsed.errorCode === RESEND_COOLDOWN &&
          isEdgeFunctionError(err) &&
          err.retry_after_seconds
        ) {
          setCooldownUntil(Date.now() + err.retry_after_seconds * 1000);
        }
        setLastError(parsed);
        return {
          ok: false,
          errorCode: parsed.errorCode,
          message: parsed.message,
          alreadyRegisteredEmail: parsed.alreadyRegisteredEmail,
        };
      } finally {
        setIsRequesting(false);
      }
    },
    []
  );

  const verifyCode = useCallback(
    async (code: string): Promise<PhoneVerificationActionResult> => {
      setLastError(null);
      setIsVerifying(true);

      try {
        const res: PhoneVerificationVerifyResponse =
          await phoneVerificationService.verifyCode(code);
        if (!res.success) {
          const parsed: PhoneVerificationLastError = {
            source: 'verify',
            message: res.message ?? '인증번호가 같지 않아요.',
          };
          setLastError(parsed);
          return { ok: false, message: parsed.message };
        }
        setVerified(true);
        return { ok: true };
      } catch (err) {
        const parsed = parseError('verify', err, '인증번호가 같지 않아요.');
        setLastError(parsed);
        return {
          ok: false,
          errorCode: parsed.errorCode,
          message: parsed.message,
          alreadyRegisteredEmail: parsed.alreadyRegisteredEmail,
        };
      } finally {
        setIsVerifying(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setCodeSent(false);
    setVerified(false);
    setLastError(null);
    setCooldownUntil(null);
    setExpiresAt(null);
  }, []);

  return {
    codeSent,
    verified,
    cooldownRemaining,
    expiresRemaining,
    expiresLabel,
    isRequesting,
    isVerifying,
    lastError,
    requestCode,
    verifyCode,
    reset,
  };
};
