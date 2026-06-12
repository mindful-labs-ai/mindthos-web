import type { MyDocumentKind } from '@/stores/documentStore';

/** 내 문서 양식 종류 라벨 — 팝오버 항목·카드 desc 공용 */
export const MY_DOCUMENT_KIND_LABEL: Record<MyDocumentKind, string> = {
  consent: '동의서 양식',
  qna: '질문·응답 양식',
};

/** 팝오버에서 즉시 생성 시 부여하는 기본 제목 (생성 플로우 작업 전 임시) */
export const MY_DOCUMENT_DEFAULT_TITLE: Record<MyDocumentKind, string> = {
  consent: '새 동의서',
  qna: '새 질문·응답 문서',
};
