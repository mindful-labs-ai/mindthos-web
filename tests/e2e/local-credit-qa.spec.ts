import { expect, test } from '@playwright/test';

const localCreditQaEnabled = process.env.LOCAL_CREDIT_QA_E2E === '1';
const qaEmail = process.env.LOCAL_CREDIT_QA_EMAIL ?? 'credit.qa@mindthos.test';
const qaPassword = process.env.LOCAL_CREDIT_QA_PASSWORD ?? 'Mindthos-local-qa!';

test.describe('Local credit QA', () => {
  test.skip(
    !localCreditQaEnabled,
    'LOCAL_CREDIT_QA_E2E=1인 로컬 통합 환경에서만 실행합니다.'
  );

  test('[CREDIT-WEB-13] 테스트 계정으로 통합 잔액과 QA 도구를 확인한다', async ({
    page,
  }) => {
    await page.goto('/auth');
    await page.getByPlaceholder('이메일 주소').fill(qaEmail);
    await page.getByPlaceholder('비밀번호').fill(qaPassword);
    const termsCheckResponse = page.waitForResponse((response) =>
      response.url().includes('/v1/terms/check')
    );
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page).not.toHaveURL(/\/auth(?:\?|$)/, { timeout: 15_000 });
    expect((await termsCheckResponse).status()).toBe(200);

    const externalRequests: string[] = [];
    const failedLocalRequests: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
        externalRequests.push(request.url());
      }
    });
    page.on('requestfailed', (request) => {
      const url = new URL(request.url());
      const failureReason = request.failure()?.errorText;
      const cancelledByNavigation = failureReason === 'net::ERR_ABORTED';
      if (
        ['localhost', '127.0.0.1'].includes(url.hostname) &&
        !cancelledByNavigation
      ) {
        failedLocalRequests.push(request.url());
      }
    });

    const stateResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/v1/dev/credits/state') &&
        response.status() === 200
    );
    await page.goto('/dev/credit-qa');
    await stateResponse;

    await expect(
      page.getByRole('heading', { name: '통합 크레딧 상태 점검' })
    ).toBeVisible();
    await expect(page.getByText('사용 가능 잔액').locator('..')).toContainText(
      '130'
    );
    await expect(page.getByText('PLAN 사용 가능').locator('..')).toContainText(
      '100'
    );
    await expect(page.getByText('PROMO 사용 가능').locator('..')).toContainText(
      '30'
    );
    await expect(
      page.getByRole('button', { name: 'PLAN 교체 지급' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hold 생성' })).toBeVisible();

    expect(failedLocalRequests).toEqual([]);
    expect(externalRequests).toEqual([]);
  });
});
