import { beforeEach, describe, expect, it, vi } from 'vitest';

import { billingService } from './billingQueries';

const mocks = vi.hoisted(() => ({
  serverRequest: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({ supabase: {} }));

vi.mock('@/shared/api/server/serverClient', () => ({
  serverRequest: mocks.serverRequest,
}));

describe('billingService server adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('[WEB-EF-14] 빌링키와 업그레이드 요청 5개를 기존 payload 그대로 POST한다', async () => {
    const billingRequest = {
      customerKey: 'customer-uuid',
      authKey: 'auth-key',
    };
    const planRequest = { planId: 'plan-uuid', userCouponId: 'coupon-uuid' };
    const completeRequest = {
      ...billingRequest,
      ...planRequest,
      customerEmail: 'user@example.com',
      customerName: '마음토스',
    };
    const responses = [
      { cardNumber: '1234', cardType: 'CREDIT' },
      { cardNumber: '5678', cardType: 'CHECK' },
      { success: true, planId: 'plan-uuid' },
      { success: true, subscribeId: 'subscription-1' },
      { success: true, subscribeId: 'subscription-2' },
    ];
    responses.forEach((response) =>
      mocks.serverRequest.mockResolvedValueOnce(response)
    );

    await expect(billingService.issueBillingKey(billingRequest)).resolves.toBe(
      responses[0]
    );
    await expect(billingService.registerCard(billingRequest)).resolves.toBe(
      responses[1]
    );
    await expect(billingService.initUpgrade(planRequest)).resolves.toBe(
      responses[2]
    );
    await expect(
      billingService.completePlanUpgrade(completeRequest)
    ).resolves.toBe(responses[3]);
    await expect(billingService.upgradePlan(planRequest)).resolves.toBe(
      responses[4]
    );

    expect(mocks.serverRequest.mock.calls).toEqual([
      ['/payment/issue-billing-key', { method: 'POST', body: billingRequest }],
      ['/payment/register-card', { method: 'POST', body: billingRequest }],
      ['/payment/init-upgrade', { method: 'POST', body: planRequest }],
      ['/payment/complete-upgrade', { method: 'POST', body: completeRequest }],
      ['/payment/upgrade', { method: 'POST', body: planRequest }],
    ]);
  });

  it('[WEB-EF-15] 카드 조회는 GET 결과의 card만 반환하고 삭제는 canonical DELETE를 사용한다', async () => {
    const card = {
      type: 'CREDIT',
      company: '현대',
      number: '1234',
      createdAt: '2026-07-22T00:00:00Z',
    };
    mocks.serverRequest
      .mockResolvedValueOnce({ success: true, card })
      .mockResolvedValueOnce({ success: true, message: 'deleted' });

    await expect(billingService.getCard(17)).resolves.toBe(card);
    await expect(billingService.deleteCard()).resolves.toBeUndefined();

    expect(mocks.serverRequest).toHaveBeenNthCalledWith(1, '/payment/get-card');
    expect(mocks.serverRequest).toHaveBeenNthCalledWith(
      2,
      '/payment/delete-card',
      { method: 'DELETE' }
    );
  });

  it('[WEB-EF-16] 플랜 관리 5개 요청은 payload를 유지하고 renew 결과를 직접 반환한다', async () => {
    const preview = { finalAmount: 12000 };
    const changed = { type: 'upgrade', newPlan: 'Pro' };
    const renewed = {
      success: true,
      subscribeId: 'subscription-3',
      message: 'renewed',
    };
    const canceled = { canceledPlan: 'Plus', effectiveAt: null };
    mocks.serverRequest
      .mockResolvedValueOnce(preview)
      .mockResolvedValueOnce(changed)
      .mockResolvedValueOnce(renewed)
      .mockResolvedValueOnce(canceled)
      .mockResolvedValueOnce({ success: true });

    await expect(billingService.previewUpgrade('plan-uuid')).resolves.toBe(
      preview
    );
    await expect(
      billingService.changePlan('plan-uuid', 'coupon-uuid')
    ).resolves.toBe(changed);
    await expect(billingService.renewPlan('coupon-uuid')).resolves.toBe(
      renewed
    );
    await expect(billingService.cancelSubscription()).resolves.toBe(canceled);
    await expect(billingService.undoCancellation()).resolves.toBeUndefined();

    expect(mocks.serverRequest.mock.calls).toEqual([
      [
        '/payment/preview-upgrade',
        { method: 'POST', body: { planId: 'plan-uuid' } },
      ],
      [
        '/payment/change-plan',
        {
          method: 'POST',
          body: { planId: 'plan-uuid', userCouponId: 'coupon-uuid' },
        },
      ],
      [
        '/payment/renew',
        { method: 'POST', body: { userCouponId: 'coupon-uuid' } },
      ],
      ['/payment/cancel', { method: 'POST', body: {} }],
      ['/payment/cancel-undo', { method: 'POST', body: {} }],
    ]);
  });

  it('[WEB-EF-17] 선택 쿠폰이 없으면 payment payload에서 필드를 생략한다', async () => {
    mocks.serverRequest.mockResolvedValue({ success: true });

    await billingService.changePlan('plan-uuid');
    await billingService.renewPlan();

    expect(mocks.serverRequest).toHaveBeenNthCalledWith(
      1,
      '/payment/change-plan',
      { method: 'POST', body: { planId: 'plan-uuid' } }
    );
    expect(mocks.serverRequest).toHaveBeenNthCalledWith(2, '/payment/renew', {
      method: 'POST',
      body: {},
    });
  });

  it('[WEB-EF-18] 카드 조회 오류는 기존처럼 null로 처리하고 나머지 결제 오류는 그대로 전달한다', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const cardError = new Error('카드 조회 실패');
    const paymentError = new Error('결제 거절');
    mocks.serverRequest
      .mockRejectedValueOnce(cardError)
      .mockRejectedValueOnce(paymentError);

    await expect(billingService.getCard(17)).resolves.toBeNull();
    await expect(
      billingService.issueBillingKey({
        customerKey: 'customer-uuid',
        authKey: 'auth-key',
      })
    ).rejects.toBe(paymentError);

    expect(consoleError).toHaveBeenCalledWith(
      '카드 정보 조회 실패:',
      cardError
    );
  });
});
