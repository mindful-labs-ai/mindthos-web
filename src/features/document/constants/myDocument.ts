import type { MyDocument, MyDocumentKind } from '@/stores/documentStore';

/** 내 문서 양식 종류 라벨 — 팝오버 항목·카드 desc 공용 */
export const MY_DOCUMENT_KIND_LABEL: Record<MyDocumentKind, string> = {
  consent: '동의서 양식',
  qna: '질문·응답 양식',
};

/**
 * 내 문서 발송 가능 여부 — 서버 발송 가드와 동일한 조건(status='completed' && validation='valid').
 * 서버(document-snapshot-resolver)는 발송 시 COMPLETED+VALID가 아닌 개인문서를 400으로 거절한다.
 * 에디터는 제목+본문이 모두 유효할 때만 completed로 저장(그 외 draft)하므로 이 조건이 그 판정을 그대로 미러한다.
 * 발송 불가(편집 중)면 발송 대상 목록에서 제외되고 카드에 '편집 중' 칩으로 표시된다.
 */
export function isSendableDocument(
  doc: Pick<MyDocument, 'status' | 'validation'>
): boolean {
  return doc.status === 'completed' && doc.validation === 'valid';
}

/** 내 문서 상태 칩 — 발송 가능(완료, 초록) / 발송 불가(편집 중, 앰버) */
export function myDocumentStatusChip(
  doc: Pick<MyDocument, 'status' | 'validation'>
): {
  label: string;
  className: string;
} {
  return isSendableDocument(doc)
    ? { label: '완료', className: 'bg-green-20 text-green-80' }
    : { label: '편집 중', className: 'bg-yellow-20 text-yellow-80' };
}
