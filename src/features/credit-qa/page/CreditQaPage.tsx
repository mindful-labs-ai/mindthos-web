import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import {
  captureDevCreditHold,
  expireDevCredits,
  getDevCreditState,
  grantDevCredit,
  placeDevCreditHold,
  releaseDevCreditHold,
  type CreditSummary,
} from '@/shared/api/server/creditServerApi';
import { Button, Input, Title, type InputProps } from '@/shared/ui';

const PLAN_POLICY_CODE = 'LOCAL_QA_PLAN_7D';
const PROMOTIONAL_POLICY_CODE = 'LOCAL_QA_PROMOTIONAL_7D';
const CREDIT_QA_QUERY_KEY = ['dev', 'credits', 'state'] as const;

const createKey = (prefix: string) =>
  `credit-qa:${prefix}:${crypto.randomUUID()}`;

const toLocalDateTime = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString('ko-KR') : '-';

interface FieldProps extends InputProps {
  label: string;
}

const Field = ({ label, ...props }: FieldProps) => (
  <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-fg-muted">
    {label}
    <Input {...props} />
  </label>
);

interface SummaryRowProps {
  label: string;
  summary: CreditSummary['plan'] | CreditSummary['promotional'];
}

const SummaryRow = ({ label, summary }: SummaryRowProps) => (
  <tr className="border-t border-grey-30">
    <th className="px-3 py-2 text-left font-medium">{label}</th>
    <td className="px-3 py-2 text-right">{summary.issuedCredit}</td>
    <td className="px-3 py-2 text-right">{summary.availableCredit}</td>
    <td className="px-3 py-2 text-right">{summary.heldCredit}</td>
    <td className="px-3 py-2 text-right">{summary.capturedCredit}</td>
    <td className="px-3 py-2 text-right">{summary.voidedCredit}</td>
  </tr>
);

const CreditQaPage = () => {
  const [holdAmount, setHoldAmount] = useState('10');
  const [holdUseType, setHoldUseType] = useState('credit_qa');
  const [holdSourceType, setHoldSourceType] = useState('LOCAL_QA');
  const [holdSourceId, setHoldSourceId] = useState('manual');
  const [expireAsOf, setExpireAsOf] = useState(() =>
    toLocalDateTime(new Date(Date.now() + 8 * 24 * 60 * 60 * 1_000))
  );
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);

  const stateQuery = useQuery({
    queryKey: CREDIT_QA_QUERY_KEY,
    queryFn: getDevCreditState,
    staleTime: 0,
  });

  const runAction = async (label: string, action: () => Promise<unknown>) => {
    setBusyAction(label);
    setMessage(null);
    try {
      await action();
      await stateQuery.refetch();
      setMessage({ tone: 'success', text: `${label} 완료` });
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : `${label} 실패`,
      });
    } finally {
      setBusyAction(null);
    }
  };

  const grant = (policyCode: string, category: 'plan' | 'promotional') =>
    runAction(`${category.toUpperCase()} 지급`, () =>
      grantDevCredit({
        policyCode,
        sourceId: createKey(category),
        idempotencyKey: createKey(`grant-${category}`),
      })
    );

  const placeHold = () => {
    const amount = Number(holdAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage({ tone: 'error', text: '예약 금액은 0보다 커야 합니다.' });
      return;
    }

    void runAction('Hold 생성', () =>
      placeDevCreditHold({
        amount,
        useType: holdUseType,
        sourceType: holdSourceType,
        sourceId: `${holdSourceId}:${crypto.randomUUID()}`,
        idempotencyKey: createKey('hold'),
      })
    );
  };

  const state = stateQuery.data;
  const summary = state?.summary;
  const queryError =
    stateQuery.error instanceof Error ? stateQuery.error.message : null;

  return (
    <main className="min-h-screen bg-grey-10 px-4 py-8 text-fg md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-1 text-sm font-medium text-primary">
              LOCAL CREDIT QA
            </p>
            <Title as="h1" className="text-left text-2xl font-headline">
              통합 크레딧 상태 점검
            </Title>
            <p className="mt-2 text-sm text-fg-muted">
              로그인한 테스트 계정의 PLAN·PROMOTIONAL 지급, 예약, 확정, 해제,
              만료를 직접 검증합니다.
            </p>
          </div>
          <Button
            variant="outline"
            tone="neutral"
            onClick={() => void stateQuery.refetch()}
            loading={stateQuery.isFetching && busyAction === null}
          >
            새로고침
          </Button>
        </header>

        {(message || queryError) && (
          <div
            aria-live="polite"
            className={`rounded-lg border px-4 py-3 text-sm ${
              (message?.tone ?? 'error') === 'error'
                ? 'bg-red-10 border-danger text-danger'
                : 'border-green-60 bg-green-10 text-green-100'
            }`}
          >
            {message?.text ?? queryError}
          </div>
        )}

        {stateQuery.isLoading ? (
          <div className="rounded-xl bg-white p-10 text-center text-fg-muted">
            크레딧 상태를 불러오는 중입니다.
          </div>
        ) : summary ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['사용 가능 잔액', summary.walletAvailableCredit],
                ['예약 중', summary.heldCredit],
                ['PLAN 사용 가능', summary.plan.availableCredit],
                ['PROMO 사용 가능', summary.promotional.availableCredit],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-fg-muted">{label}</p>
                  <p className="mt-2 text-2xl font-headline text-primary">
                    {Number(value).toLocaleString()}
                  </p>
                </div>
              ))}
            </section>

            <section className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Title as="h2" className="text-left text-lg font-headline">
                  잔액 구성
                </Title>
                <p className="text-xs text-fg-muted">
                  wallet version {state.wallet?.version ?? '-'} · PROMO 최근
                  만료 {formatDateTime(summary.promotional.nearestExpiryAt)}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-sm">
                  <thead className="bg-grey-10 text-fg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">구분</th>
                      <th className="px-3 py-2 text-right">지급</th>
                      <th className="px-3 py-2 text-right">사용 가능</th>
                      <th className="px-3 py-2 text-right">예약</th>
                      <th className="px-3 py-2 text-right">확정 사용</th>
                      <th className="px-3 py-2 text-right">만료·회수</th>
                    </tr>
                  </thead>
                  <tbody>
                    <SummaryRow label="PLAN" summary={summary.plan} />
                    <SummaryRow
                      label="PROMOTIONAL"
                      summary={summary.promotional}
                    />
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <Title as="h2" className="text-left text-lg font-headline">
                  7일 크레딧 지급
                </Title>
                <p className="mt-2 text-sm text-fg-muted">
                  PLAN은 현재 지급분을 새 기간으로 교체하고, PROMOTIONAL은 별도
                  지급분을 추가합니다.
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <Button
                    onClick={() => void grant(PLAN_POLICY_CODE, 'plan')}
                    loading={busyAction === 'PLAN 지급'}
                    disabled={busyAction !== null}
                  >
                    PLAN 교체 지급
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      void grant(PROMOTIONAL_POLICY_CODE, 'promotional')
                    }
                    loading={busyAction === 'PROMOTIONAL 지급'}
                    disabled={busyAction !== null}
                  >
                    PROMOTIONAL 지급
                  </Button>
                </div>
                <p className="mt-3 break-all text-xs text-fg-muted">
                  {PLAN_POLICY_CODE}
                  <br />
                  {PROMOTIONAL_POLICY_CODE}
                </p>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm lg:col-span-2">
                <Title as="h2" className="text-left text-lg font-headline">
                  크레딧 사용 예약
                </Title>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field
                    label="금액"
                    type="number"
                    min="1"
                    value={holdAmount}
                    onChange={(event) => setHoldAmount(event.target.value)}
                  />
                  <Field
                    label="useType"
                    value={holdUseType}
                    onChange={(event) => setHoldUseType(event.target.value)}
                  />
                  <Field
                    label="sourceType"
                    value={holdSourceType}
                    onChange={(event) => setHoldSourceType(event.target.value)}
                  />
                  <Field
                    label="sourceId 접두어"
                    value={holdSourceId}
                    onChange={(event) => setHoldSourceId(event.target.value)}
                  />
                </div>
                <Button
                  className="mt-4 w-full"
                  onClick={placeHold}
                  loading={busyAction === 'Hold 생성'}
                  disabled={busyAction !== null}
                >
                  Hold 생성
                </Button>
              </div>
            </section>

            <section className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <Title as="h2" className="text-left text-lg font-headline">
                    미래 시점 만료 실행
                  </Title>
                  <p className="mt-1 text-sm text-fg-muted">
                    기본값은 현재보다 8일 뒤로, 7일 지급분의 만료를 바로 확인할
                    수 있습니다.
                  </p>
                </div>
                <div className="flex w-full gap-2 md:w-auto">
                  <Field
                    label="asOf"
                    type="datetime-local"
                    value={expireAsOf}
                    onChange={(event) => setExpireAsOf(event.target.value)}
                  />
                  <Button
                    className="mt-6 shrink-0"
                    tone="danger"
                    onClick={() =>
                      void runAction('만료 실행', () =>
                        expireDevCredits(new Date(expireAsOf).toISOString())
                      )
                    }
                    loading={busyAction === '만료 실행'}
                    disabled={busyAction !== null || !expireAsOf}
                  >
                    만료 실행
                  </Button>
                </div>
              </div>
            </section>

            <section className="rounded-xl bg-white p-5 shadow-sm">
              <Title as="h2" className="mb-4 text-left text-lg font-headline">
                지급분 ({state.grants.length})
              </Title>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-sm">
                  <thead className="bg-grey-10 text-fg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">구분 / 정책</th>
                      <th className="px-3 py-2 text-left">출처</th>
                      <th className="px-3 py-2 text-right">지급</th>
                      <th className="px-3 py-2 text-right">가능</th>
                      <th className="px-3 py-2 text-right">예약</th>
                      <th className="px-3 py-2 text-right">사용</th>
                      <th className="px-3 py-2 text-right">무효</th>
                      <th className="px-3 py-2 text-left">교체 / 만료</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.grants.map((grant) => (
                      <tr key={grant.id} className="border-t border-grey-30">
                        <td className="px-3 py-2">
                          <strong>{grant.category}</strong>
                          <br />
                          <span className="text-xs text-fg-muted">
                            {grant.policyCode}
                          </span>
                        </td>
                        <td
                          className="max-w-64 truncate px-3 py-2"
                          title={grant.sourceId}
                        >
                          {grant.sourceType} / {grant.sourceId}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {grant.grantedAmount}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {grant.availableAmount}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {grant.heldAmount}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {grant.capturedAmount}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {grant.voidedAmount}
                        </td>
                        <td className="px-3 py-2">
                          {grant.supersededAt && (
                            <>
                              교체됨 {formatDateTime(grant.supersededAt)}
                              <br />
                            </>
                          )}
                          {formatDateTime(grant.expiresAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl bg-white p-5 shadow-sm">
              <Title as="h2" className="mb-4 text-left text-lg font-headline">
                Hold ({state.holds.length})
              </Title>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-sm">
                  <thead className="bg-grey-10 text-fg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">상태</th>
                      <th className="px-3 py-2 text-left">사용처</th>
                      <th className="px-3 py-2 text-right">금액</th>
                      <th className="px-3 py-2 text-left">배분</th>
                      <th className="px-3 py-2 text-left">만료</th>
                      <th className="px-3 py-2 text-right">동작</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.holds.map((hold) => (
                      <tr key={hold.id} className="border-t border-grey-30">
                        <td className="px-3 py-2 font-medium">{hold.status}</td>
                        <td className="px-3 py-2">
                          {hold.useType}
                          <br />
                          <span className="text-xs text-fg-muted">
                            {hold.sourceType} / {hold.sourceId}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">{hold.amount}</td>
                        <td className="px-3 py-2">
                          {hold.allocations
                            .map((allocation) => allocation.amount)
                            .join(' + ') || '-'}
                        </td>
                        <td className="px-3 py-2">
                          {formatDateTime(hold.expiresAt)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                void runAction('Hold 확정', () =>
                                  captureDevCreditHold(hold.id)
                                )
                              }
                              disabled={
                                hold.status !== 'HELD' || busyAction !== null
                              }
                              loading={busyAction === 'Hold 확정'}
                            >
                              Capture
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              tone="neutral"
                              onClick={() =>
                                void runAction('Hold 해제', () =>
                                  releaseDevCreditHold(hold.id)
                                )
                              }
                              disabled={
                                hold.status !== 'HELD' || busyAction !== null
                              }
                              loading={busyAction === 'Hold 해제'}
                            >
                              Release
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl bg-white p-5 shadow-sm">
              <Title as="h2" className="mb-4 text-left text-lg font-headline">
                원장 ({state.ledgerEntries.length})
              </Title>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-grey-10 text-fg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">발생 시각</th>
                      <th className="px-3 py-2 text-left">유형</th>
                      <th className="px-3 py-2 text-left">이동</th>
                      <th className="px-3 py-2 text-right">금액</th>
                      <th className="px-3 py-2 text-left">Grant / Hold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.ledgerEntries.map((entry) => (
                      <tr key={entry.id} className="border-t border-grey-30">
                        <td className="px-3 py-2">
                          {formatDateTime(entry.occurredAt)}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {entry.entryType}
                        </td>
                        <td className="px-3 py-2">
                          {entry.fromBucket ?? '∅'} → {entry.toBucket ?? '∅'}
                        </td>
                        <td className="px-3 py-2 text-right">{entry.amount}</td>
                        <td className="max-w-64 truncate px-3 py-2 text-xs text-fg-muted">
                          {entry.grantId ?? '-'} / {entry.holdId ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
};

export default CreditQaPage;
