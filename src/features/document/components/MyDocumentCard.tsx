import { getDocumentViewRoute } from '@/app/router/constants';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import type { MyDocument } from '@/stores/documentStore';

import { MY_DOCUMENT_KIND_LABEL } from '../constants/myDocument';

interface MyDocumentCardProps {
  document: MyDocument;
}

/** "2026-5-30 등록" 형태 (월·일 패딩 없음) */
function formatRegisteredDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} 등록`;
}

/**
 * 내 문서 카드 — 제목 + 양식 종류 desc + 등록일 (297x182).
 * 기본 문서 카드(카테고리 칩)와 구성이 달라 별도 컴포넌트.
 * 클릭 시 문서 뷰(읽기 전용) 페이지로 이동.
 */
export function MyDocumentCard({ document }: MyDocumentCardProps) {
  const { navigateWithUtm } = useNavigateWithUtm();

  return (
    <button
      type="button"
      onClick={() => navigateWithUtm(getDocumentViewRoute(document.id))}
      className="relative flex h-[182px] w-[297px] flex-shrink-0 flex-col rounded-2xl border border-grey-40 bg-white px-7 py-6 text-left transition-colors lg:hover:bg-grey-10"
    >
      <h3 className="truncate text-xl font-headline leading-[24px] text-grey-100">
        {document.title}
      </h3>
      <p className="mt-3 text-m font-medium leading-[140%] text-grey-100">
        {MY_DOCUMENT_KIND_LABEL[document.kind]}
      </p>
      <p className="absolute bottom-5 left-7 text-m font-medium leading-[140%] text-grey-60">
        {formatRegisteredDate(document.createdAt)}
      </p>
    </button>
  );
}
