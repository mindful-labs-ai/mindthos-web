import { create } from 'zustand';

import type { MyDocumentKind } from '@/stores/documentStore';

/**
 * 문서 발송 내역 임시 백엔드 (zustand).
 * 문서 발송 모달과 내담자 탭(문서 관리)이 한 세션 안에서 공유.
 * 새로고침 시 초기화 — 백엔드 연결 시 액션 내부만 API 호출로 교체.
 */

export type SentDocumentStatus = 'pending' | 'completed' | 'canceled';

export const SENT_DOCUMENT_STATUS_LABEL: Record<SentDocumentStatus, string> = {
  pending: '대기 중',
  completed: '완료',
  canceled: '취소',
};

export interface SentDocument {
  id: string;
  clientId: string;
  clientName: string;
  /** 발송 시점 문서 스냅샷 — 이후 문서가 수정/삭제돼도 발송본 유지 */
  title: string;
  kind: MyDocumentKind;
  content: string | null;
  /** 마감 기한 라벨 (예: "1주일", "마감 기한 없음") */
  deadlineLabel: string;
  status: SentDocumentStatus;
  /** ISO 일시 */
  sentAt: string;
  completedAt?: string;
  canceledAt?: string;
}

interface SentDocumentState {
  sentDocuments: SentDocument[];
  addSentDocument: (
    doc: Omit<SentDocument, 'id' | 'status' | 'sentAt'>
  ) => void;
  /** 대기 중 발송 취소 */
  cancelSentDocument: (id: string) => void;
  removeSentDocument: (id: string) => void;
}

export const useSentDocumentStore = create<SentDocumentState>((set) => ({
  sentDocuments: [],
  addSentDocument: (doc) =>
    set((state) => ({
      sentDocuments: [
        {
          ...doc,
          id: `sent-doc-${Date.now()}`,
          status: 'pending' as const,
          sentAt: new Date().toISOString(),
        },
        ...state.sentDocuments,
      ],
    })),
  cancelSentDocument: (id) =>
    set((state) => ({
      sentDocuments: state.sentDocuments.map((d) =>
        d.id === id
          ? {
              ...d,
              status: 'canceled' as const,
              canceledAt: new Date().toISOString(),
            }
          : d
      ),
    })),
  removeSentDocument: (id) =>
    set((state) => ({
      sentDocuments: state.sentDocuments.filter((d) => d.id !== id),
    })),
}));
