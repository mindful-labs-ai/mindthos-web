import { beforeEach, describe, expect, it, vi } from 'vitest';

import { phoneVerificationService } from '@/features/auth/services/phoneVerificationService';
import { authService } from '@/shared/api/services/auth/authService';
import { AuthErrorCode } from '@/shared/api/services/auth/types';
import { onboardingService } from '@/shared/api/services/onboarding/onboardingService';

const mocks = vi.hoisted(() => ({
  serverRequest: vi.fn(),
  serverRequestPublic: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({ supabase: { auth: {} } }));

vi.mock('@/shared/api/server/serverClient', () => ({
  serverRequest: mocks.serverRequest,
  serverRequestPublic: mocks.serverRequestPublic,
}));

describe('auth and onboarding server adapters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('[WEB-EF-01] 로그인 전 인증 확인과 재발송은 공개 서버 API에 payload를 유지해 보낸다', async () => {
    const existsResponse = { success: true, exists: false };
    const methodResponse = {
      success: true,
      exists: true,
      providers: ['email'],
      hasPassword: true,
    };
    const resendResponse = { success: true, email: 'user@example.com' };
    mocks.serverRequestPublic
      .mockResolvedValueOnce(existsResponse)
      .mockResolvedValueOnce(methodResponse)
      .mockResolvedValueOnce(resendResponse);

    await expect(authService.checkUserExists('user@example.com')).resolves.toBe(
      existsResponse
    );
    await expect(authService.checkAuthMethod('user@example.com')).resolves.toBe(
      methodResponse
    );
    await expect(
      authService.resendVerification('user@example.com')
    ).resolves.toBe(resendResponse);

    const options = { method: 'POST', body: { email: 'user@example.com' } };
    expect(mocks.serverRequestPublic).toHaveBeenNthCalledWith(
      1,
      '/auth/check-user-exists',
      options
    );
    expect(mocks.serverRequestPublic).toHaveBeenNthCalledWith(
      2,
      '/auth/check-auth-method',
      options
    );
    expect(mocks.serverRequestPublic).toHaveBeenNthCalledWith(
      3,
      '/auth/resend-verification',
      options
    );
    expect(mocks.serverRequest).not.toHaveBeenCalled();
  });

  it('[WEB-EF-02] 계정 삭제는 로그인 세션이 필요한 서버 API에 email을 보낸다', async () => {
    const response = {
      success: true,
      deletedUser: { id: 3, email: 'user@example.com' },
    };
    mocks.serverRequest.mockResolvedValue(response);

    await expect(authService.deleteAccount('user@example.com')).resolves.toBe(
      response
    );

    expect(mocks.serverRequest).toHaveBeenCalledWith('/auth/account-delete', {
      method: 'POST',
      body: { email: 'user@example.com' },
    });
    expect(mocks.serverRequestPublic).not.toHaveBeenCalled();
  });

  it('[WEB-EF-03] 서버 인증 오류 코드를 기존 AuthErrorCode로 변환한다', async () => {
    mocks.serverRequestPublic.mockRejectedValue({
      status: 400,
      statusCode: 'EMAIL_REQUIRED',
      message: '이메일이 필요합니다.',
    });

    await expect(authService.checkUserExists('')).rejects.toMatchObject({
      code: AuthErrorCode.EMAIL_REQUIRED,
      message: '이메일이 필요합니다.',
    });
  });

  it('[WEB-EF-04] 휴대폰 인증 3개 동작은 로그인 세션이 필요한 POST API를 사용한다', async () => {
    const statusResponse = {
      success: true,
      required: true,
      verified_at: null,
    };
    const requestResponse = {
      success: true,
      message: 'sent',
      expires_at: '2026-07-22T01:00:00Z',
      cooldown_seconds: 60,
    };
    const verifyResponse = {
      success: true,
      message: 'verified',
      verified_at: '2026-07-22T00:00:00Z',
      phone_number: '010-1234-5678',
    };
    mocks.serverRequest
      .mockResolvedValueOnce(statusResponse)
      .mockResolvedValueOnce(requestResponse)
      .mockResolvedValueOnce(verifyResponse);

    await expect(phoneVerificationService.checkStatus()).resolves.toBe(
      statusResponse
    );
    await expect(
      phoneVerificationService.requestCode('010-1234-5678')
    ).resolves.toBe(requestResponse);
    await expect(phoneVerificationService.verifyCode('123456')).resolves.toBe(
      verifyResponse
    );

    expect(mocks.serverRequest).toHaveBeenNthCalledWith(
      1,
      '/auth/phone-verification/status',
      { method: 'POST' }
    );
    expect(mocks.serverRequest).toHaveBeenNthCalledWith(
      2,
      '/auth/phone-verification/request',
      { method: 'POST', body: { phone_number: '010-1234-5678' } }
    );
    expect(mocks.serverRequest).toHaveBeenNthCalledWith(
      3,
      '/auth/phone-verification/verify',
      { method: 'POST', body: { code: '123456' } }
    );
    expect(mocks.serverRequestPublic).not.toHaveBeenCalled();
  });

  it('[WEB-EF-05] 온보딩 7개 동작은 payload를 바꾸지 않고 로그인 서버 API에 보낸다', async () => {
    const email = 'user@example.com';
    const savePayload = {
      email,
      name: '마음토스',
      phone_number: '010-1234-5678',
      organization: '상담소',
    };
    const nextPayload = {
      email,
      currentState: 'in_progress' as const,
      currentStep: 2,
    };
    mocks.serverRequest.mockResolvedValue({ success: true });

    await onboardingService.getStatus(email);
    await onboardingService.check(email);
    await onboardingService.start({ email });
    await onboardingService.save(savePayload);
    await onboardingService.next(nextPayload);
    await onboardingService.success({ email });
    await onboardingService.complete({ email });

    expect(mocks.serverRequest.mock.calls).toEqual([
      [
        '/onboarding/status',
        { method: 'POST', body: { email: 'user@example.com' } },
      ],
      [
        '/onboarding/check',
        { method: 'POST', body: { email: 'user@example.com' } },
      ],
      ['/onboarding/start', { method: 'POST', body: { email } }],
      ['/onboarding/save', { method: 'POST', body: savePayload }],
      ['/onboarding/next', { method: 'POST', body: nextPayload }],
      ['/onboarding/success', { method: 'POST', body: { email } }],
      ['/onboarding/complete', { method: 'POST', body: { email } }],
    ]);
    expect(mocks.serverRequestPublic).not.toHaveBeenCalled();
  });
});
