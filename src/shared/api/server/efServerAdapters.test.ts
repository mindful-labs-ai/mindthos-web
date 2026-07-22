import { beforeEach, describe, expect, it, vi } from 'vitest';

import { couponService } from '@/features/settings/services/couponService';
import { noticeService } from '@/features/settings/services/noticeService';
import { qualificationService } from '@/features/settings/services/qualificationService';
import { termsContentService } from '@/features/terms/services/termsContentService';
import { termsAgreementService } from '@/features/terms-agreement/services/termsAgreementService';
import { clientService } from '@/shared/api/supabase/clientQueries';

import { ServerApiError } from './serverClient';

const mocks = vi.hoisted(() => ({
  serverRequest: vi.fn(),
  serverRequestPublic: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({ supabase: {} }));

vi.mock('@/shared/api/server/serverClient', () => {
  class MockServerApiError extends Error {
    readonly status: number;
    readonly statusCode: string;

    constructor(status: number, statusCode: string, message: string) {
      super(message);
      this.status = status;
      this.statusCode = statusCode;
    }
  }

  return {
    ServerApiError: MockServerApiError,
    serverRequest: mocks.serverRequest,
    serverRequestPublic: mocks.serverRequestPublic,
  };
});

describe('legacy EF server adapters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('공지와 약관 본문은 공개 서버 API에서 조회한다', async () => {
    mocks.serverRequestPublic
      .mockResolvedValueOnce({ success: true, notices: [] })
      .mockResolvedValueOnce({
        success: true,
        content: { id: 'terms-1', sections: [] },
      });

    await noticeService.getList();
    await termsContentService.getContent('privacy/policy');

    expect(mocks.serverRequestPublic).toHaveBeenNthCalledWith(1, '/notices');
    expect(mocks.serverRequestPublic).toHaveBeenNthCalledWith(
      2,
      '/terms/content?type=privacy%2Fpolicy'
    );
    expect(mocks.serverRequest).not.toHaveBeenCalled();
  });

  it('약관 동의 조회와 저장은 인증 서버 API를 사용한다', async () => {
    mocks.serverRequest.mockResolvedValue({ success: true });
    const payload = {
      agreements: [{ terms_id: 'terms-1', agreed: true }],
    };

    await termsAgreementService.checkTerms();
    await termsAgreementService.agreeToTerms(payload);

    expect(mocks.serverRequest).toHaveBeenNthCalledWith(1, '/terms/check');
    expect(mocks.serverRequest).toHaveBeenNthCalledWith(2, '/terms/agree', {
      method: 'POST',
      body: payload,
    });
  });

  it('자격 조회와 저장은 인증 서버 API를 사용한다', async () => {
    mocks.serverRequest.mockResolvedValue({ qualifications: [] });

    await qualificationService.list();
    await qualificationService.user();
    await qualificationService.upsert(['상담심리사']);

    expect(mocks.serverRequest).toHaveBeenNthCalledWith(1, '/qualifications');
    expect(mocks.serverRequest).toHaveBeenNthCalledWith(
      2,
      '/qualifications/user'
    );
    expect(mocks.serverRequest).toHaveBeenNthCalledWith(
      3,
      '/qualifications/upsert',
      { method: 'POST', body: { names: ['상담심리사'] } }
    );
  });

  it('쿠폰 조회 쿼리를 인코딩하고 등록 payload를 유지한다', async () => {
    mocks.serverRequest
      .mockResolvedValueOnce({
        coupons: [
          {
            user_coupon_id: 'user-coupon-1',
            coupon_id: 'WELCOME',
            title: '환영 쿠폰',
            discount: 1000,
            expired_at: '2026-12-31T00:00:00Z',
            valid: true,
          },
        ],
      })
      .mockResolvedValueOnce({ coupon_id: 'WELCOME' });

    const coupons = await couponService.validateAll('pro/annual');
    await couponService.register('WELCOME');

    expect(coupons[0]).toMatchObject({
      id: 'user-coupon-1',
      couponId: 'WELCOME',
      expiresAt: '2026-12-31T00:00:00Z',
    });
    expect(mocks.serverRequest).toHaveBeenNthCalledWith(
      1,
      '/coupons/validate?plan_type=pro%2Fannual'
    );
    expect(mocks.serverRequest).toHaveBeenNthCalledWith(
      2,
      '/coupons/register',
      { method: 'POST', body: { coupon_id: 'WELCOME' } }
    );
  });

  it('내담자 생성은 기존 snake_case payload를 인증 서버 API에 그대로 보낸다', async () => {
    const request = {
      counselor_email: 'counselor@example.com',
      name: '홍길동',
      phone_number: '01012345678',
      counsel_number: 3,
    };
    mocks.serverRequest.mockResolvedValue({
      success: true,
      client: { id: 'client-1', name: '홍길동' },
    });

    await clientService.createClient(request);

    expect(mocks.serverRequest).toHaveBeenCalledWith('/clients/create', {
      method: 'POST',
      body: request,
    });
  });

  it('내담자 생성의 서버 오류 코드를 기존 ClientApiError로 보존한다', async () => {
    mocks.serverRequest.mockRejectedValue(
      new ServerApiError(400, 'NAME_TOO_LONG', '이름이 너무 깁니다.')
    );

    await expect(
      clientService.createClient({
        counselor_email: 'counselor@example.com',
        name: '아주긴이름입니다',
      })
    ).rejects.toMatchObject({
      status: 400,
      success: false,
      error: 'NAME_TOO_LONG',
      message: '이름이 너무 깁니다.',
    });
  });
});
