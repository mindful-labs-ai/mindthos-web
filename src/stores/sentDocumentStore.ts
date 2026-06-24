import { create } from 'zustand';

import { documentDataSource } from '@/features/document/adapters';
import type { DocumentResponse } from '@/features/document/types';
import type { MyDocumentKind } from '@/stores/documentStore';

/**
 * 문서 발송 내역 스토어 (zustand).
 * 문서 발송 모달과 내담자 탭(문서 관리)이 한 세션 안에서 공유.
 * 데이터는 documentDataSource 어댑터(real ↔ mock) 경유로 서버와 연결된다.
 */

export type SentDocumentStatus =
  | 'pending'
  | 'completed'
  | 'canceled'
  | 'failed';

export const SENT_DOCUMENT_STATUS_LABEL: Record<SentDocumentStatus, string> = {
  pending: '대기 중',
  completed: '완료',
  canceled: '취소',
  failed: '발송 실패',
};

export interface SentDocument {
  id: string;
  clientId: string;
  clientName: string;
  /** 발송 시점 문서 스냅샷 — 이후 문서가 수정/삭제돼도 발송본 유지 */
  title: string;
  kind: MyDocumentKind;
  content: string | null;
  /** 마감 기한 ISO (null = 무기한) */
  expiredAt: string | null;
  /** 마감 기한 표시 라벨 — expiredAt에서 파생 (예: "2026.07.01까지", "마감 기한 없음") */
  deadlineLabel: string;
  status: SentDocumentStatus;
  /** ISO 일시 */
  sentAt: string;
  /** 알림톡 발송 실패 시각 (실패 시에만) */
  failedAt?: string;
  /** 발송 실패 메시지 (실패 시에만) */
  failureMessage?: string;
  completedAt?: string;
  canceledAt?: string;
  /** 내담자가 제출한 응답 (완료 시) — consent=서명/동의, qna=문항별 응답 */
  response?: DocumentResponse | null;
}

/** 발송 모달에서 넘기는 입력 — 어댑터가 서버 전송 후 결과를 반환 */
export interface SendDocumentInput {
  clientId: string;
  clientName: string;
  documentTitle: string;
  kind: MyDocumentKind;
  content: string | null;
  sourceTemplateId?: string;
  sourceUserDocumentId?: string;
  /** 마감 기한 ISO (생략 = 무기한) */
  expiredAt?: string;
}

interface SentDocumentState {
  sentDocuments: SentDocument[];
  /** 내담자 발송 내역 로드 — clientName으로 보정 후 해당 내담자 항목 교체 */
  loadSentDocuments: (clientId: string, clientName: string) => Promise<void>;
  /** 문서 발송 — 서버 전송 결과(SentDocument)를 반환 (호출자가 failedAt 등 처리) */
  addSentDocument: (input: SendDocumentInput) => Promise<SentDocument>;
  /** 대기 중 발송 취소 */
  cancelSentDocument: (id: string) => Promise<void>;
  removeSentDocument: (id: string) => Promise<void>;
}

export const useSentDocumentStore = create<SentDocumentState>((set) => ({
  sentDocuments: [],
  loadSentDocuments: async (clientId, clientName) => {
    const list = await documentDataSource.listSentDocuments(clientId);
    const stamped = list.map((d) => ({ ...d, clientName }));
    set((state) => ({
      // 해당 내담자의 기존 항목을 교체(다른 내담자 항목은 유지)
      sentDocuments: [
        ...stamped,
        ...state.sentDocuments.filter((d) => d.clientId !== clientId),
      ],
    }));
  },
  addSentDocument: async (input) => {
    const created = await documentDataSource.sendDocument({
      clientId: input.clientId,
      documentTitle: input.documentTitle,
      kind: input.kind,
      content: input.content,
      sourceTemplateId: input.sourceTemplateId,
      sourceUserDocumentId: input.sourceUserDocumentId,
      expiredAt: input.expiredAt,
    });
    const stamped: SentDocument = { ...created, clientName: input.clientName };
    set((state) => ({
      sentDocuments: [stamped, ...state.sentDocuments],
    }));
    return stamped;
  },
  cancelSentDocument: async (id) => {
    const updated = await documentDataSource.cancelSentDocument(id);
    set((state) => ({
      sentDocuments: state.sentDocuments.map((d) =>
        d.id === id ? { ...updated, clientName: d.clientName } : d
      ),
    }));
  },
  removeSentDocument: async (id) => {
    await documentDataSource.removeSentDocument(id);
    set((state) => ({
      sentDocuments: state.sentDocuments.filter((d) => d.id !== id),
    }));
  },
}));
