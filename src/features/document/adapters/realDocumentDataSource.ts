import {
  buildContent,
  parseContent,
} from '@/features/document/constants/formField';
import type {
  DocumentContent,
  DocumentResponse,
} from '@/features/document/types';
import { serverRequest } from '@/shared/api/server/serverClient';
import type {
  CounselDocument,
  DocumentCategory,
  MyDocument,
  MyDocumentKind,
  MyDocumentStatus,
  MyDocumentValidation,
} from '@/stores/documentStore';
import type {
  SentDocument,
  SentDocumentStatus,
} from '@/stores/sentDocumentStore';

import type { DocumentDataSource } from './types';

/**
 * mindthos-server 실제 문서 API 어댑터.
 *
 * 서버 계약 (모두 /v1, Bearer, envelope(data) 자동 처리):
 *  - GET    /documents                       → { document: DocumentListItem[] } (content 없음)
 *  - GET    /document-templates/:id          → DocumentTemplateDto (content 포함)
 *  - POST   /user-documents                  → UserDocumentDto
 *  - GET    /user-documents/:id              → UserDocumentDto
 *  - PATCH  /user-documents/:id              → UserDocumentDto
 *  - DELETE /user-documents/:id              → 204
 *  - POST   /sent-documents                  → SentDocumentDto (동기 알림톡 발송, 성공/실패 반영)
 *  - GET    /clients/:clientId/sent-documents→ { sentDocument: SentDocumentDto[] }
 *  - GET    /sent-documents/:id              → SentDocumentDto
 *  - POST   /sent-documents/:id/cancel       → SentDocumentDto
 *  - DELETE /sent-documents/:id              → 204
 *
 * 매핑 메모:
 *  - kind: 서버 CONSENT|QNA ↔ 프론트 consent|qna (카테고리·UX 힌트일 뿐 content 모양은 동일).
 *  - category: 서버 ETHICS|PREPARATION|ASSESSMENT ↔ 프론트 ethics|preparation|assessment.
 *  - content: CONSENT/QNA 공통 단일 봉투 { version, fields }(DocumentContent). user-document
 *      저장·sent-document 발송·공유문서 화면 모두 같은 봉투를 사용한다.
 *  - SentDocument.status는 서버 타임스탬프에서 파생, clientName은 호출자가 보정('').
 */

const DOCUMENT_ROUTES = {
  documents: '/documents',
  template: (id: string) => `/document-templates/${id}`,
  userDocuments: '/user-documents',
  userDocument: (id: string) => `/user-documents/${id}`,
  sentDocuments: '/sent-documents',
  sentDocument: (id: string) => `/sent-documents/${id}`,
  cancelSentDocument: (id: string) => `/sent-documents/${id}/cancel`,
  clientSentDocuments: (clientId: string) =>
    `/clients/${clientId}/sent-documents`,
} as const;

/** 서버 enum(대문자) */
type ServerKind = 'CONSENT' | 'QNA';
type ServerCategory = 'ETHICS' | 'PREPARATION' | 'ASSESSMENT';
type ServerStatus = 'DRAFT' | 'COMPLETED';
type ServerValidation = 'VALID' | 'INVALID';

/** GET /documents document[] 원소 (content 없음) */
interface DocumentListItem {
  source: 'TEMPLATE' | 'USER';
  id: string;
  title: string;
  kind: ServerKind;
  category: ServerCategory | null;
  description: string | null;
  status: ServerStatus | null;
  validation: ServerValidation | null;
  createdAt: string;
  updatedAt: string;
}

interface GetDocumentsResponse {
  document: DocumentListItem[];
}

/** GET /document-templates/:id */
interface DocumentTemplateDto {
  id: string;
  title: string;
  description: string | null;
  category: ServerCategory;
  kind: ServerKind;
  content: unknown | null;
  sortOrder: number | null;
  createdAt: string;
  updatedAt: string;
}

/** /user-documents DTO */
interface UserDocumentDto {
  id: string;
  sourceTemplateId: string | null;
  title: string;
  kind: ServerKind;
  content: unknown | null;
  status: ServerStatus;
  validation: ServerValidation;
  createdAt: string;
  updatedAt: string;
}

/** POST /user-documents body */
interface CreateUserDocumentRequest {
  sourceTemplateId?: string;
  title?: string;
  kind?: ServerKind;
  content?: DocumentContent | null;
  status?: ServerStatus;
}

/** PATCH /user-documents/:id body */
interface UpdateUserDocumentRequest {
  title?: string;
  content?: DocumentContent | null;
  status?: ServerStatus;
}

/** /sent-documents DTO */
interface SentDocumentDto {
  id: string;
  clientId: string;
  sourceTemplateId: string | null;
  sourceUserDocumentId: string | null;
  documentTitle: string;
  kind: ServerKind;
  content: Record<string, unknown>;
  expiredAt: string | null;
  lastAccessedAt: string | null;
  sentAt: string | null;
  failedAt: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  response: DocumentResponse | null;
  completedAt: string | null;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GetClientSentDocumentsResponse {
  sentDocument: SentDocumentDto[];
}

/** POST /sent-documents body — 발송본 content는 서버 @IsNotEmpty라 항상 봉투(non-null). */
interface CreateSentDocumentRequest {
  clientId: string;
  documentTitle: string;
  kind: ServerKind;
  content: DocumentContent;
  sourceTemplateId?: string;
  sourceUserDocumentId?: string;
  expiredAt?: string;
}

const KIND_TO_SERVER: Record<MyDocumentKind, ServerKind> = {
  consent: 'CONSENT',
  qna: 'QNA',
};

const KIND_FROM_SERVER: Record<ServerKind, MyDocumentKind> = {
  CONSENT: 'consent',
  QNA: 'qna',
};

const STATUS_TO_SERVER: Record<MyDocumentStatus, ServerStatus> = {
  draft: 'DRAFT',
  completed: 'COMPLETED',
};

const STATUS_FROM_SERVER: Record<ServerStatus, MyDocumentStatus> = {
  DRAFT: 'draft',
  COMPLETED: 'completed',
};

const VALIDATION_FROM_SERVER: Record<ServerValidation, MyDocumentValidation> = {
  VALID: 'valid',
  INVALID: 'invalid',
};

const CATEGORY_FROM_SERVER: Record<ServerCategory, DocumentCategory> = {
  ETHICS: 'ethics',
  PREPARATION: 'preparation',
  ASSESSMENT: 'assessment',
};

/** 프론트 content → 서버 jsonb. CONSENT/QNA 공통 { version, fields } 봉투를 그대로 전송. */
function toServerContent(content: DocumentContent | null): DocumentContent | null {
  return content ?? null;
}

/** 서버 jsonb → 프론트 content. DocumentContent 봉투면 그대로, 아니면 null. */
function fromServerContent(obj: unknown | null): DocumentContent | null {
  return parseContent(obj);
}

/** DocumentListItem(source=TEMPLATE) → CounselDocument (content 없음 → null) */
function listItemToCounselDocument(item: DocumentListItem): CounselDocument {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? '',
    category: item.category ? CATEGORY_FROM_SERVER[item.category] : 'ethics',
    content: null,
  };
}

/** DocumentListItem(source=USER) → MyDocument (content 없음 → null) */
function listItemToMyDocument(item: DocumentListItem): MyDocument {
  return {
    id: item.id,
    title: item.title,
    kind: KIND_FROM_SERVER[item.kind],
    status: item.status ? STATUS_FROM_SERVER[item.status] : 'draft',
    validation: item.validation
      ? VALIDATION_FROM_SERVER[item.validation]
      : 'invalid',
    createdAt: item.createdAt,
    content: null,
  };
}

/** DocumentTemplateDto → CounselDocument (content 포함) */
function templateToCounselDocument(dto: DocumentTemplateDto): CounselDocument {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description ?? '',
    category: CATEGORY_FROM_SERVER[dto.category],
    content: fromServerContent(dto.content),
  };
}

/** UserDocumentDto → MyDocument (content 포함) */
function userDocumentToMyDocument(dto: UserDocumentDto): MyDocument {
  return {
    id: dto.id,
    title: dto.title,
    kind: KIND_FROM_SERVER[dto.kind],
    status: STATUS_FROM_SERVER[dto.status],
    validation: VALIDATION_FROM_SERVER[dto.validation],
    createdAt: dto.createdAt,
    content: fromServerContent(dto.content),
  };
}

/**
 * 서버 타임스탬프 → 프론트 status. 우선순위 canceled > completed > failed > pending.
 *  - canceled: 상담사가 발송 취소 (failed/pending 위에서도 취소가 우선).
 *  - completed: 내담자 응답 제출 완료.
 *  - failed: 알림톡 발송 실패(failed_at). 사유는 failureMessage(서버가 내려준 UX 친화 문구).
 *  - pending: 발송됨 + 내담자 응답 대기.
 */
function deriveSentStatus(dto: SentDocumentDto): SentDocumentStatus {
  if (dto.canceledAt) return 'canceled';
  if (dto.completedAt) return 'completed';
  if (dto.failedAt) return 'failed';
  return 'pending';
}

/** SentDocumentDto → SentDocument (clientName은 호출자가 보정). */
function toSentDocument(dto: SentDocumentDto): SentDocument {
  return {
    id: dto.id,
    clientId: dto.clientId,
    clientName: '',
    title: dto.documentTitle,
    kind: KIND_FROM_SERVER[dto.kind],
    content: fromServerContent(dto.content),
    expiredAt: dto.expiredAt,
    deadlineLabel: deadlineLabelFromExpiredAt(dto.expiredAt),
    status: deriveSentStatus(dto),
    sentAt: dto.sentAt ?? dto.createdAt,
    failedAt: dto.failedAt ?? undefined,
    failureMessage: dto.failureMessage ?? undefined,
    completedAt: dto.completedAt ?? undefined,
    canceledAt: dto.canceledAt ?? undefined,
    response: dto.response ?? null,
  };
}

/** expiredAt(ISO|null) → 마감 라벨. 없으면 "마감 기한 없음", 있으면 "2026.07.01까지"(KST). */
export function deadlineLabelFromExpiredAt(expiredAt: string | null): string {
  if (!expiredAt) return '마감 기한 없음';
  const d = new Date(expiredAt);
  // KST(UTC+9) 기준 날짜
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}.${m}.${day}까지`;
}

export const realDocumentDataSource: DocumentDataSource = {
  async listDocuments() {
    const data = await serverRequest<GetDocumentsResponse>(
      DOCUMENT_ROUTES.documents
    );
    const templates: CounselDocument[] = [];
    const myDocuments: MyDocument[] = [];
    for (const item of data.document) {
      if (item.source === 'TEMPLATE') {
        templates.push(listItemToCounselDocument(item));
      } else {
        myDocuments.push(listItemToMyDocument(item));
      }
    }
    return { templates, myDocuments };
  },

  async getMyDocument(id: string): Promise<MyDocument> {
    const dto = await serverRequest<UserDocumentDto>(
      DOCUMENT_ROUTES.userDocument(id)
    );
    return userDocumentToMyDocument(dto);
  },

  async getTemplate(id: string): Promise<CounselDocument> {
    const dto = await serverRequest<DocumentTemplateDto>(
      DOCUMENT_ROUTES.template(id)
    );
    return templateToCounselDocument(dto);
  },

  async createMyDocument(input): Promise<MyDocument> {
    const body: CreateUserDocumentRequest = {
      title: input.title,
      kind: KIND_TO_SERVER[input.kind],
      content: toServerContent(input.content),
      status: STATUS_TO_SERVER[input.status ?? 'completed'],
    };
    const dto = await serverRequest<UserDocumentDto>(
      DOCUMENT_ROUTES.userDocuments,
      { method: 'POST', body }
    );
    return userDocumentToMyDocument(dto);
  },

  async updateMyDocument(id, patch): Promise<MyDocument> {
    const body: UpdateUserDocumentRequest = {
      title: patch.title,
      content: toServerContent(patch.content),
      status: STATUS_TO_SERVER[patch.status ?? 'completed'],
    };
    const dto = await serverRequest<UserDocumentDto>(
      DOCUMENT_ROUTES.userDocument(id),
      { method: 'PATCH', body }
    );
    return userDocumentToMyDocument(dto);
  },

  async deleteMyDocument(id: string): Promise<void> {
    await serverRequest<void>(DOCUMENT_ROUTES.userDocument(id), {
      method: 'DELETE',
    });
  },

  async listSentDocuments(clientId: string): Promise<SentDocument[]> {
    const data = await serverRequest<GetClientSentDocumentsResponse>(
      DOCUMENT_ROUTES.clientSentDocuments(clientId)
    );
    return data.sentDocument.map(toSentDocument);
  },

  async sendDocument(input): Promise<SentDocument> {
    const body: CreateSentDocumentRequest = {
      clientId: input.clientId,
      documentTitle: input.documentTitle,
      kind: KIND_TO_SERVER[input.kind],
      // 서버 @IsNotEmpty — null 이면 400. 발송본은 빈 봉투라도 보장(상위 버그 방어).
      content: toServerContent(input.content) ?? buildContent([]),
      ...(input.sourceTemplateId
        ? { sourceTemplateId: input.sourceTemplateId }
        : {}),
      ...(input.sourceUserDocumentId
        ? { sourceUserDocumentId: input.sourceUserDocumentId }
        : {}),
      ...(input.expiredAt ? { expiredAt: input.expiredAt } : {}),
    };
    const dto = await serverRequest<SentDocumentDto>(
      DOCUMENT_ROUTES.sentDocuments,
      { method: 'POST', body }
    );
    return toSentDocument(dto);
  },

  async cancelSentDocument(id: string): Promise<SentDocument> {
    const dto = await serverRequest<SentDocumentDto>(
      DOCUMENT_ROUTES.cancelSentDocument(id),
      { method: 'POST' }
    );
    return toSentDocument(dto);
  },

  async removeSentDocument(id: string): Promise<void> {
    await serverRequest<void>(DOCUMENT_ROUTES.sentDocument(id), {
      method: 'DELETE',
    });
  },
};
