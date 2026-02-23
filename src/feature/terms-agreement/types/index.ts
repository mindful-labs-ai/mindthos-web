export interface TermItem {
  id: string;
  type: string;
  version: string;
  title: string;
  is_required: boolean;
  created_at: string;
}

export interface TermsListResponse {
  success: boolean;
  terms: TermItem[];
  currentVersion: string;
}

export interface TermsCheckResponse {
  success: boolean;
  agreedAll: boolean;
  currentVersion: string;
  pendingTerms: TermItem[];
}

export interface TermAgreement {
  terms_id: string;
  agreed: boolean;
}

export interface TermsAgreeRequest {
  email: string;
  agreements: TermAgreement[];
}

export interface TermsAgreeResponse {
  success: boolean;
  message: string;
  agreedAt: string;
  version: string;
}
