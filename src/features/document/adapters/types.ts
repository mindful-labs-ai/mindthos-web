import type {
  CounselDocument,
  MyDocument,
  MyDocumentKind,
  MyDocumentStatus,
} from '@/stores/documentStore';
import type { SentDocument } from '@/stores/sentDocumentStore';

import type { DocumentContent } from '../types';

/**
 * DocumentDataSource — 문서/발송 데이터 접근의 어댑터 경계.
 *
 * 세션 룰: UI/스토어는 이 인터페이스에만 의존하고, 실데이터/목 전환은
 * `adapters/index.ts`의 구현만 교체한다(real ↔ mock).
 *
 * 도메인 메서드는 모두 프론트 모델(CounselDocument / MyDocument / SentDocument)을 반환한다.
 * 서버 DTO↔모델 매핑은 구현 내부에서 처리한다.
 */
export interface DocumentDataSource {
  /**
   * 문서 목록 (GET /documents) — source로 templates/myDocuments 분리.
   * 목록 응답엔 content가 없으므로 두 모델의 content는 모두 null.
   */
  listDocuments(): Promise<{
    templates: CounselDocument[];
    myDocuments: MyDocument[];
  }>;
  /** 내 문서 단건 (GET /user-documents/:id) — content 포함 */
  getMyDocument(id: string): Promise<MyDocument>;
  /** 기본 문서(템플릿) 단건 (GET /document-templates/:id) — content 포함 */
  getTemplate(id: string): Promise<CounselDocument>;
  createMyDocument(input: {
    title: string;
    kind: MyDocumentKind;
    status?: MyDocumentStatus;
    content: DocumentContent | null;
  }): Promise<MyDocument>;
  /** 편집 저장 — 제목·본문·상태만 갱신(서버 kind는 변경 안 함). content가 단일 봉투라 kind 불필요. */
  updateMyDocument(
    id: string,
    patch: {
      title: string;
      content: DocumentContent | null;
      status?: MyDocumentStatus;
    }
  ): Promise<MyDocument>;
  deleteMyDocument(id: string): Promise<void>;
  /** 내담자 발송 내역 (GET /clients/:clientId/sent-documents) — clientName은 ''(호출자 보정) */
  listSentDocuments(clientId: string): Promise<SentDocument[]>;
  sendDocument(input: {
    clientId: string;
    documentTitle: string;
    kind: MyDocumentKind;
    content: DocumentContent | null;
    sourceTemplateId?: string;
    sourceUserDocumentId?: string;
    expiredAt?: string;
  }): Promise<SentDocument>;
  cancelSentDocument(id: string): Promise<SentDocument>;
  removeSentDocument(id: string): Promise<void>;
}
