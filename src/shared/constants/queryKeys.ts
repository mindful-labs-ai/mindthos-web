// --- Client ---
export const clientQueryKeys = {
  all: ['clients'] as const,
  lists: () => [...clientQueryKeys.all, 'list'] as const,
  list: (counselorId: string) =>
    [...clientQueryKeys.lists(), counselorId] as const,
  details: () => [...clientQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientQueryKeys.details(), id] as const,
};

// --- Template ---
export const templateQueryKeys = {
  all: ['templates'] as const,
  lists: () => [...templateQueryKeys.all, 'list'] as const,
  list: () => [...templateQueryKeys.lists()] as const,
  pins: () => [...templateQueryKeys.all, 'pins'] as const,
  pin: (userId: string) => [...templateQueryKeys.pins(), userId] as const,
};

// --- Report ---
export const reportQueryKeys = {
  templates: {
    all: ['reportTemplates'] as const,
  },
};

// --- Terms ---
export const termsAgreementQueryKeys = {
  all: ['terms-agreement'] as const,
  check: () => [...termsAgreementQueryKeys.all, 'check'] as const,
};

export const termsQueryKeys = {
  content: (type: string) => ['terms', 'content', type] as const,
};

// --- Session ---
export const sessionQueryKeys = {
  all: (userId: number) => ['sessions', userId] as const,
  detail: (sessionId: string, isDummySession: boolean) =>
    ['session', sessionId, isDummySession] as const,
  detailById: (sessionId: string) => ['session', 'detail', sessionId] as const,
  status: (sessionId: string) => ['session-status', sessionId] as const,
  progressNoteStatus: (progressNoteId: string) =>
    ['progress-note-status', progressNoteId] as const,
  progressNotesPolling: (sessionId: string) =>
    ['session-progress-notes-polling', sessionId] as const,
};

// --- Genogram ---
export const genogramQueryKeys = {
  data: (clientId: string) => ['genogram', clientId] as const,
  familySummary: (clientId: string) =>
    ['clientFamilySummary', clientId] as const,
  hasRecords: (clientId: string) => ['client-has-records', clientId] as const,
};

// --- Credit / Billing ---
export const creditQueryKeys = {
  subscription: (userId: number) => ['credit', 'subscription', userId] as const,
  usage: (userId: number) => ['credit', 'usage', userId] as const,
  logs: (userId: number) => ['credit', 'logs', userId] as const,
  // 신규 통합 RPC (get_credit_summary). 폴링 제거 + useCreditGuard와 같은 키 공유.
  summary: (userId: number) => ['credit', 'summary', userId] as const,
};

// --- Card ---
export const cardQueryKeys = {
  info: (userId: string) => ['cardInfo', userId] as const,
};

// --- Plans ---
export const planQueryKeys = {
  all: ['plans'] as const,
  monthly: () => [...planQueryKeys.all, 'monthly'] as const,
  yearly: () => [...planQueryKeys.all, 'yearly'] as const,
};

// --- User ---
export const userQueryKeys = {
  data: (email: string) => ['user', 'data', email] as const,
};

// --- Phone Verification ---
export const phoneVerificationQueryKeys = {
  all: ['phone-verification'] as const,
  status: () => [...phoneVerificationQueryKeys.all, 'status'] as const,
};

// --- Qualifications ---
export const qualificationQueryKeys = {
  all: ['qualifications'] as const,
  user: () => [...qualificationQueryKeys.all, 'user'] as const,
};

// --- Payment / Subscription ---
export const billingQueryKeys = {
  subscription: (userDbId: number) => ['subscription', userDbId] as const,
  card: (userDbId: number) => ['card', userDbId] as const,
};
