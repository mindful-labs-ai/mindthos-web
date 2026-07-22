import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  captureDevCreditHold,
  expireDevCredits,
  getCreditHistory,
  getCreditSummary,
  getDevCreditState,
  grantDevCredit,
  placeDevCreditHold,
  releaseDevCreditHold,
} from './creditServerApi';
import { serverRequest } from './serverClient';

vi.mock('./serverClient', () => ({
  serverRequest: vi.fn(),
}));

const request = serverRequest as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  request.mockReset();
  request.mockResolvedValue({});
});

describe('creditServerApi', () => {
  it('요약과 cursor 기반 원장을 서버 credit endpoint에서 조회한다.', async () => {
    await getCreditSummary();
    await getCreditHistory(20);
    await getCreditHistory(20, 'opaque/cursor+value');

    expect(request).toHaveBeenNthCalledWith(1, '/credits/summary');
    expect(request).toHaveBeenNthCalledWith(2, '/credits/history?limit=20');
    expect(request).toHaveBeenNthCalledWith(
      3,
      '/credits/history?limit=20&cursor=opaque%2Fcursor%2Bvalue'
    );
  });

  it('로컬 QA 상태와 지급 요청 계약을 유지한다.', async () => {
    await getDevCreditState();
    await grantDevCredit({
      policyCode: 'LOCAL_QA_PLAN_7D',
      sourceId: 'qa-plan-1',
      idempotencyKey: 'grant-plan-1',
    });

    expect(request).toHaveBeenNthCalledWith(1, '/dev/credits/state');
    expect(request).toHaveBeenNthCalledWith(2, '/dev/credits/grants', {
      method: 'POST',
      body: {
        policyCode: 'LOCAL_QA_PLAN_7D',
        sourceId: 'qa-plan-1',
        idempotencyKey: 'grant-plan-1',
      },
    });
  });

  it('hold 생성·확정·해제와 미래 만료 요청 계약을 유지한다.', async () => {
    await placeDevCreditHold({
      amount: 10,
      useType: 'credit_qa',
      sourceType: 'LOCAL_QA',
      sourceId: 'hold-source-1',
      idempotencyKey: 'hold-1',
    });
    await captureDevCreditHold('hold/1');
    await releaseDevCreditHold('hold/2');
    await expireDevCredits('2026-07-24T00:00:00.000Z');

    expect(request).toHaveBeenNthCalledWith(1, '/dev/credits/holds', {
      method: 'POST',
      body: {
        amount: 10,
        useType: 'credit_qa',
        sourceType: 'LOCAL_QA',
        sourceId: 'hold-source-1',
        idempotencyKey: 'hold-1',
      },
    });
    expect(request).toHaveBeenNthCalledWith(
      2,
      '/dev/credits/holds/hold%2F1/capture',
      { method: 'POST' }
    );
    expect(request).toHaveBeenNthCalledWith(
      3,
      '/dev/credits/holds/hold%2F2/release',
      { method: 'POST' }
    );
    expect(request).toHaveBeenNthCalledWith(4, '/dev/credits/expire', {
      method: 'POST',
      body: { asOf: '2026-07-24T00:00:00.000Z' },
    });
  });
});
