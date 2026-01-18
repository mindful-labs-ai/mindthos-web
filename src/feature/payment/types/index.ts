export interface BillingAuthRequest {
  method: 'CARD';
  successUrl: string;
  failUrl: string;
  customerEmail: string;
  customerName: string;
}

export interface BillingAuthSuccessParams {
  customerKey: string;
  authKey: string;
}

export interface BillingAuthFailParams {
  code: string;
  message: string;
}

export interface BillingKeyIssueRequest {
  authKey: string;
  customerKey: string;
}

export interface BillingKeyIssueResponse {
  billingKey: string;
  cardNumber: string;
  cardType: string;
}

export interface UpgradePlanRequest {
  planId: string;
}

export interface UpgradePlanResponse {
  success: boolean;
  subscribeId?: string;
  message?: string;
  error?: string;
}

export interface CompletePlanUpgradeRequest {
  customerKey: string;
  authKey: string;
  planId: string;
  customerEmail: string;
  customerName: string;
}
