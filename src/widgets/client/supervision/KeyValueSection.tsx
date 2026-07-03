import type { KVItem } from '@/features/client/types/supervisionReport.types';

import { KeyValueList } from './KeyValueList';
import { SectionTitle } from './SectionTitle';

interface KeyValueSectionProps {
  title: string;
  items: KVItem[];
  /** 편집 모드 — 라벨/본문을 필드 단위로 수정 */
  editable?: boolean;
  onItemsChange?: (items: KVItem[]) => void;
}

/** section0/1/4/5: 제목 + 라벨-본문 목록. */
export function KeyValueSection({
  title,
  items,
  editable,
  onItemsChange,
}: KeyValueSectionProps) {
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <KeyValueList
        items={items}
        editable={editable}
        onItemsChange={onItemsChange}
      />
    </section>
  );
}
