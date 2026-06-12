import type { MyDocumentKind } from '@/stores/documentStore';

/** 내 문서 양식 종류 라벨 — 팝오버 항목·카드 desc 공용 */
export const MY_DOCUMENT_KIND_LABEL: Record<MyDocumentKind, string> = {
  consent: '동의서 양식',
  qna: '질문·응답 양식',
};
