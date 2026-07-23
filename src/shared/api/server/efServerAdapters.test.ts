import { beforeEach, describe, expect, it, vi } from 'vitest';

import { couponService } from '@/features/settings/services/couponService';
import { noticeService } from '@/features/settings/services/noticeService';
import { qualificationService } from '@/features/settings/services/qualificationService';
import { termsContentService } from '@/features/terms/services/termsContentService';
import { termsAgreementService } from '@/features/terms-agreement/services/termsAgreementService';
import { clientService } from '@/shared/api/supabase/clientQueries';
import {
  generateReport,
  listReports,
  retryReport,
  savePdfStorageKey,
} from '@/shared/api/supabase/reportQueries';

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

  it('[WEB-EF-06] 공지와 약관 본문은 공개 서버 API에서 조회한다', async () => {
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

  it('[WEB-EF-07] 약관 동의 조회와 저장은 인증 서버 API를 사용한다', async () => {
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

  it('[WEB-EF-08] 자격 조회와 저장은 인증 서버 API를 사용한다', async () => {
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

  it('[WEB-EF-09] 쿠폰 조회 쿼리를 인코딩하고 등록 payload를 유지한다', async () => {
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

  it('[WEB-EF-10] 내담자 생성은 기존 snake_case payload를 인증 서버 API에 그대로 보낸다', async () => {
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

  it('[WEB-EF-11] 내담자 생성의 서버 오류 코드를 기존 ClientApiError로 보존한다', async () => {
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

  it('[WEB-EF-12] 보고서 생성·목록·재시도·PDF 키 저장은 인증 서버 API를 사용한다', async () => {
    const report = {
      id: 'report-1',
      client_id: 'client-1',
      user_id: 1,
      template_id: 'template-1',
      title: '보고서',
      status: 'SUCCEEDED' as const,
      error_code: null,
      retry_count: 0,
      pdf_storage_key: null,
      created_at: '2026-07-22T00:00:00Z',
      last_attempted_at: null,
    };
    const generated = {
      report_id: 'report-1',
      formatted_json: {},
      status: 'SUCCEEDED' as const,
    };
    const generatePayload = {
      client_id: 'client-1',
      template_key: 'default',
      title: '보고서',
      input_snapshot: { client_name: '홍길동' },
    };

    mocks.serverRequest
      .mockResolvedValueOnce({
        success: true,
        data: { reports: [report], total: 1 },
      })
      .mockResolvedValueOnce({ success: true, data: generated })
      .mockResolvedValueOnce({ success: true, data: generated })
      .mockResolvedValueOnce({
        success: true,
        data: { report_id: 'report-1', storage_key: 'reports/report-1.pdf' },
      });

    await expect(listReports('client-1')).resolves.toEqual([report]);
    await expect(generateReport(generatePayload)).resolves.toEqual(generated);
    await expect(retryReport('report-1')).resolves.toEqual(generated);
    await expect(
      savePdfStorageKey('report-1', 'reports/report-1.pdf')
    ).resolves.toBe('reports/report-1.pdf');

    expect(mocks.serverRequest).toHaveBeenNthCalledWith(1, '/report/list', {
      method: 'POST',
      body: { client_id: 'client-1' },
    });
    expect(mocks.serverRequest).toHaveBeenNthCalledWith(2, '/report/generate', {
      method: 'POST',
      body: generatePayload,
    });
    expect(mocks.serverRequest).toHaveBeenNthCalledWith(3, '/report/retry', {
      method: 'POST',
      body: { report_id: 'report-1' },
    });
    expect(mocks.serverRequest).toHaveBeenNthCalledWith(4, '/report/pdf-url', {
      method: 'POST',
      body: {
        report_id: 'report-1',
        storage_key: 'reports/report-1.pdf',
      },
    });
    expect(mocks.serverRequestPublic).not.toHaveBeenCalled();
  });

  it('[WEB-EF-13] 보고서 서버 오류 코드를 사용자 안내로 변환한다', async () => {
    mocks.serverRequest.mockRejectedValueOnce(
      new ServerApiError(403, 'ACCESS_DENIED', '수료 확인이 필요합니다.')
    );

    await expect(
      generateReport({
        client_id: 'client-1',
        template_key: 'default',
        input_snapshot: {},
      })
    ).rejects.toThrow('이 보고서를 생성하려면 세미나 수료가 필요해요.');

    mocks.serverRequest.mockRejectedValueOnce(
      new ServerApiError(429, 'RETRY_COOLDOWN', '30초 뒤 다시 시도해 주세요.')
    );

    await expect(retryReport('report-1')).rejects.toThrow(
      '30초 뒤 다시 시도해 주세요.'
    );
  });
});
