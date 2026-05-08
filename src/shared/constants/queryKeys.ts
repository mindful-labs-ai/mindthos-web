// --- Client ---
export const clientQueryKeys = {
  all: ['clients'] as const,
  lists: () => [...clientQueryKeys.all, 'list'] as const,
  list: (counselorId: string) =>
    [...clientQueryKeys.lists(), counselorId] as const,
  details: () => [...clientQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientQueryKeys.details(), id] as const,
  // C2 — 무한 스크롤 paginated 리스트. 검색/정렬별 분리 캐싱.
  // list(counselorId) 아래에 nest → list 또는 all invalidate 시 paginated도 자동 propagate
  paginated: (
    counselorId: number,
    search: string | null,
    sortOrder: 'desc' | 'asc'
  ) =>
    [
      ...clientQueryKeys.list(String(counselorId)),
      'paginated',
      search ?? '',
      sortOrder,
    ] as const,
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
  // C2 — 무한 스크롤 paginated 리스트. 정렬/필터별 분리 캐싱.
  // all(userId) 아래에 nest → all invalidate 시 paginated도 자동 propagate
  paginated: (
    userId: number,
    sortOrder: 'desc' | 'asc',
    clientIds?: readonly string[]
  ): readonly unknown[] => {
    const base = [...sessionQueryKeys.all(userId), 'paginated', sortOrder];
    if (!clientIds || clientIds.length === 0) return base;
    return [...base, 'filter', [...clientIds].sort().join(',')];
  },
  paginatedByClient: (
    userId: number,
    clientId: string,
    sortOrder: 'desc' | 'asc'
  ) =>
    [
      ...sessionQueryKeys.all(userId),
      'paginated',
      'client',
      clientId,
      sortOrder,
    ] as const,
  allByClient: (userId: number, clientId: string, sortOrder: 'desc' | 'asc') =>
    [
      ...sessionQueryKeys.all(userId),
      'all-by-client',
      clientId,
      sortOrder,
    ] as const,
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
