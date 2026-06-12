import type { CounselDocument } from '@/stores/documentStore';

import { DOCUMENT_CATEGORY_CONFIG } from '../constants/category';

interface DocumentCardProps {
  document: CounselDocument;
}

/** 기본 문서 카드 — 제목 + 설명 + 카테고리 칩 (297x182) */
export function DocumentCard({ document }: DocumentCardProps) {
  const category = DOCUMENT_CATEGORY_CONFIG[document.category];

  return (
    <div className="relative flex h-[182px] w-[297px] flex-shrink-0 flex-col rounded-2xl border border-grey-40 bg-white px-7 py-6">
      <h3 className="pr-6 text-xl font-headline leading-[24px] text-grey-100">
        {document.title}
      </h3>
      <p className="mt-3 line-clamp-2 text-m font-medium leading-[140%] text-grey-100">
        {document.description}
      </p>
      <span
        className={`absolute bottom-6 left-7 rounded-lg px-2.5 py-1.5 text-sm font-headline ${category.chipClass}`}
      >
        {category.label}
      </span>
    </div>
  );
}
