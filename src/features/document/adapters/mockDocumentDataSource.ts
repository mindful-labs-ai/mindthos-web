import {
  DEFAULT_DOCUMENTS,
  type CounselDocument,
  type MyDocument,
  type MyDocumentKind,
  type MyDocumentStatus,
  type MyDocumentValidation,
} from '@/stores/documentStore';
import type { SentDocument } from '@/stores/sentDocumentStore';

import { validateFields } from '../constants/formField';
import type { DocumentContent } from '../types';

import { deadlineLabelFromExpiredAt } from './realDocumentDataSource';
import type { DocumentDataSource } from './types';

/**
 * Mock 문서 데이터 소스 — 백엔드 없이 UI를 확인하는 임시 구현.
 *
 * 기존 zustand 인메모리 동작을 그대로 재현한다:
 *  - 기본 문서(템플릿) = DEFAULT_DOCUMENTS 고정 목록
 *  - 내 문서 / 발송 내역 = 모듈 스코프 배열(세션 내 공유, 새로고침 시 초기화)
 * 추후 실제 서버 어댑터로 교체 (adapters/index.ts).
 */

/** 내 문서 (인메모리) */
const myDocuments: MyDocument[] = [];
let myDocSeq = 0;

/** 발송 내역 (인메모리) */
const sentDocuments: SentDocument[] = [];
let sentDocSeq = 0;

function deriveValidation(
  content: DocumentContent | null
): MyDocumentValidation {
  if (!content) return 'invalid';
  return validateFields(content.fields) ? 'valid' : 'invalid';
}

export const mockDocumentDataSource: DocumentDataSource = {
  async listDocuments() {
    // 목록 응답엔 content가 없으므로 템플릿/내 문서 모두 content를 비운다.
    return {
      templates: DEFAULT_DOCUMENTS.map((t) => ({ ...t, content: null })),
      myDocuments: myDocuments.map((d) => ({ ...d, content: null })),
    };
  },

  async getMyDocument(id: string): Promise<MyDocument> {
    const found = myDocuments.find((d) => d.id === id);
    if (!found) throw new Error(`내 문서를 찾을 수 없습니다: ${id}`);
    return { ...found };
  },

  async getTemplate(id: string): Promise<CounselDocument> {
    const found = DEFAULT_DOCUMENTS.find((d) => d.id === id);
    if (!found) throw new Error(`기본 문서를 찾을 수 없습니다: ${id}`);
    return { ...found };
  },

  async createMyDocument(input: {
    title: string;
    kind: MyDocumentKind;
    status?: MyDocumentStatus;
    content: DocumentContent | null;
  }): Promise<MyDocument> {
    myDocSeq += 1;
    const doc: MyDocument = {
      id: `my-doc-${myDocSeq}`,
      title: input.title,
      kind: input.kind,
      status: input.status ?? 'completed',
      validation: deriveValidation(input.content),
      createdAt: new Date().toISOString(),
      content: input.content,
    };
    myDocuments.push(doc);
    return { ...doc };
  },

  async updateMyDocument(
    id: string,
    patch: {
      title: string;
      content: DocumentContent | null;
      status?: MyDocumentStatus;
    }
  ): Promise<MyDocument> {
    const doc = myDocuments.find((d) => d.id === id);
    if (!doc) throw new Error(`내 문서를 찾을 수 없습니다: ${id}`);
    doc.title = patch.title;
    doc.content = patch.content;
    doc.status = patch.status ?? 'completed';
    doc.validation = deriveValidation(patch.content);
    return { ...doc };
  },

  async deleteMyDocument(id: string): Promise<void> {
    const idx = myDocuments.findIndex((d) => d.id === id);
    if (idx >= 0) myDocuments.splice(idx, 1);
  },

  async listSentDocuments(clientId: string): Promise<SentDocument[]> {
    // clientName은 호출자가 보정하므로 ''로 둔다.
    return sentDocuments
      .filter((d) => d.clientId === clientId)
      .map((d) => ({ ...d, clientName: '' }));
  },

  async sendDocument(input: {
    clientId: string;
    documentTitle: string;
    kind: MyDocumentKind;
    content: DocumentContent | null;
    sourceTemplateId?: string;
    sourceUserDocumentId?: string;
    expiredAt?: string;
  }): Promise<SentDocument> {
    sentDocSeq += 1;
    const expiredAt = input.expiredAt ?? null;
    const doc: SentDocument = {
      id: `sent-doc-${sentDocSeq}`,
      clientId: input.clientId,
      clientName: '',
      title: input.documentTitle,
      kind: input.kind,
      content: input.content,
      expiredAt,
      deadlineLabel: deadlineLabelFromExpiredAt(expiredAt),
      status: 'pending',
      sentAt: new Date().toISOString(),
    };
    sentDocuments.unshift(doc);
    return { ...doc };
  },

  async cancelSentDocument(id: string): Promise<SentDocument> {
    const doc = sentDocuments.find((d) => d.id === id);
    if (!doc) throw new Error(`발송 내역을 찾을 수 없습니다: ${id}`);
    doc.status = 'canceled';
    doc.canceledAt = new Date().toISOString();
    return { ...doc };
  },

  async removeSentDocument(id: string): Promise<void> {
    const idx = sentDocuments.findIndex((d) => d.id === id);
    if (idx >= 0) sentDocuments.splice(idx, 1);
  },
};
