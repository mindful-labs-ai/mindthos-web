import type { DocumentCategory } from '@/stores/documentStore';

interface CategoryConfig {
  label: string;
  /** 카드 하단 카테고리 칩 색 */
  chipClass: string;
}

/** 문서 카테고리 표시 메타 (라벨·칩 색) */
export const DOCUMENT_CATEGORY_CONFIG: Record<
  DocumentCategory,
  CategoryConfig
> = {
  ethics: {
    label: '행정 및 윤리',
    chipClass: 'bg-yellow-20 text-yellow-80',
  },
  preparation: {
    label: '상담 준비',
    chipClass: 'bg-green-20 text-green-80',
  },
  assessment: {
    label: '심리검사',
    chipClass: 'bg-grey-40 text-grey-90',
  },
};
