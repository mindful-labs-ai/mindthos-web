import { serverRequest } from './serverClient';

export type CreditCategory = 'PLAN' | 'PROMOTIONAL';
export type CreditHoldStatus = 'HELD' | 'CAPTURED' | 'RELEASED';
export type CreditBucket = 'AVAILABLE' | 'HELD' | 'CAPTURED' | 'VOIDED';
export type CreditLedgerEntryType =
  | 'GRANTED'
  | 'HOLD_PLACED'
  | 'HOLD_CAPTURED'
  | 'HOLD_RELEASED'
  | 'GRANT_EXPIRED'
  | 'GRANT_REVOKED'
  | 'ADJUSTED'
  | 'REVERSED';

interface CreditCategorySummary {
  issuedCredit: number;
  availableCredit: number;
  heldCredit: number;
  capturedCredit: number;
  voidedCredit: number;
}

export interface CreditSummary {
  walletAvailableCredit: number;
  heldCredit: number;
  plan: CreditCategorySummary & {
    planId: string | null;
    subscriptionId: string | null;
    policyCode: string | null;
    periodEndsAt: string | null;
  };
  promotional: CreditCategorySummary & {
    nearestExpiryAt: string | null;
  };
}

export interface CreditLedgerEntry {
  id: string;
  userId: string;
  grantId: string | null;
  holdId: string | null;
  entryType: CreditLedgerEntryType;
  fromBucket: CreditBucket | null;
  toBucket: CreditBucket | null;
  amount: number;
  idempotencyKey: string;
  occurredAt: string;
  metadata: Record<string, unknown> | null;
}

export type CreditHistoryEventType =
  | 'GRANTED'
  | 'HOLD_CAPTURED'
  | 'GRANT_EXPIRED'
  | 'GRANT_REVOKED'
  | 'ADJUSTED'
  | 'REVERSED';

export interface CreditHistoryItem {
  id: string;
  eventType: CreditHistoryEventType;
  amountDelta: number;
  occurredAt: string;
  holdId: string | null;
  metadata: Record<string, unknown> | null;
}

export interface CreditHistory {
  items: CreditHistoryItem[];
  nextCursor: string | null;
}

export interface CreditGrant {
  id: string;
  userId: string;
  category: CreditCategory;
  sourceType: string;
  sourceId: string;
  policyCode: string;
  policyVersion: number;
  grantedAmount: number;
  availableAmount: number;
  heldAmount: number;
  capturedAmount: number;
  voidedAmount: number;
  spendPriority: number;
  startsAt: string;
  expiresAt: string | null;
  supersededAt: string | null;
  planId: string | null;
  subscriptionId: string | null;
  createdAt: string;
}

export interface CreditHoldAllocation {
  grantId: string;
  amount: number;
}

export interface CreditHold {
  id: string;
  userId: string;
  amount: number;
  status: CreditHoldStatus;
  useType: string;
  sourceType: string;
  sourceId: string;
  idempotencyKey: string;
  heldAt: string;
  expiresAt: string;
  capturedAt: string | null;
  releasedAt: string | null;
  releaseReason: string | null;
  allocations: CreditHoldAllocation[];
}

export interface CreditDevState {
  wallet: {
    userId: string;
    version: number;
    ledgerStartedAt: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  summary: CreditSummary;
  grants: CreditGrant[];
  holds: CreditHold[];
  ledgerEntries: CreditLedgerEntry[];
}

export interface GrantDevCreditInput {
  policyCode: string;
  sourceId: string;
  idempotencyKey: string;
}

export interface PlaceDevCreditHoldInput {
  amount: number;
  useType: string;
  sourceType: string;
  sourceId: string;
  idempotencyKey: string;
}

export interface ExpireDevCreditsResponse {
  expiredGrantCount: number;
  releasedHoldCount: number;
  state: CreditDevState;
}

export const CREDIT_ROUTES = {
  summary: '/credits/summary',
  history: (limit: number, cursor?: string | null) => {
    const cursorQuery = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
    return `/credits/history?limit=${limit}${cursorQuery}`;
  },
  devState: '/dev/credits/state',
  devGrants: '/dev/credits/grants',
  devHolds: '/dev/credits/holds',
  devHoldCapture: (holdId: string) =>
    `/dev/credits/holds/${encodeURIComponent(holdId)}/capture`,
  devHoldRelease: (holdId: string) =>
    `/dev/credits/holds/${encodeURIComponent(holdId)}/release`,
  devExpire: '/dev/credits/expire',
} as const;

export function getCreditSummary(): Promise<CreditSummary> {
  return serverRequest<CreditSummary>(CREDIT_ROUTES.summary);
}

export function getCreditHistory(
  limit = 20,
  cursor?: string | null
): Promise<CreditHistory> {
  return serverRequest<CreditHistory>(CREDIT_ROUTES.history(limit, cursor));
}

export function getDevCreditState(): Promise<CreditDevState> {
  return serverRequest<CreditDevState>(CREDIT_ROUTES.devState);
}

export function grantDevCredit(
  input: GrantDevCreditInput
): Promise<CreditGrant> {
  return serverRequest<CreditGrant>(CREDIT_ROUTES.devGrants, {
    method: 'POST',
    body: input,
  });
}

export function placeDevCreditHold(
  input: PlaceDevCreditHoldInput
): Promise<CreditHold> {
  return serverRequest<CreditHold>(CREDIT_ROUTES.devHolds, {
    method: 'POST',
    body: input,
  });
}

export function captureDevCreditHold(holdId: string): Promise<CreditHold> {
  return serverRequest<CreditHold>(CREDIT_ROUTES.devHoldCapture(holdId), {
    method: 'POST',
  });
}

export function releaseDevCreditHold(holdId: string): Promise<CreditHold> {
  return serverRequest<CreditHold>(CREDIT_ROUTES.devHoldRelease(holdId), {
    method: 'POST',
  });
}

export function expireDevCredits(
  asOf: string
): Promise<ExpireDevCreditsResponse> {
  return serverRequest<ExpireDevCreditsResponse>(CREDIT_ROUTES.devExpire, {
    method: 'POST',
    body: { asOf },
  });
}
