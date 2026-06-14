import type { KVItem } from '@/features/client/types/supervisionReport.types';

import { KeyValueList } from './KeyValueList';
import { SectionTitle } from './SectionTitle';

interface KeyValueSectionProps {
  title: string;
  items: KVItem[];
}

/** section0/1/4/5: 제목 + 라벨-본문 목록. */
export function KeyValueSection({ title, items }: KeyValueSectionProps) {
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <KeyValueList items={items} />
    </section>
  );
}
