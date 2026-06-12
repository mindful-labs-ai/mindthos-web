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
    chipClass: 'bg-[#FFF0D6] text-[#EBAE43]',
  },
  preparation: {
    label: '상담 준비',
    chipClass: 'bg-[#ECFAED] text-green-80',
  },
  assessment: {
    label: '심리검사',
    chipClass: 'bg-[#D6D8E1] text-[#4D4F54]',
  },
};
