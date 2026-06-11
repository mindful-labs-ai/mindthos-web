import type { KVItem } from '@/features/client/types/supervisionReport.types';

interface KeyValueListProps {
  items: KVItem[];
}

/**
 * 라벨/본문 목록. 평범한 불릿 + 굵은 라벨(소제목) + 본문 문단으로 위계만 구분.
 * 색은 상담노트 렌더러와 동일하게 text-fg(라벨은 굵게만 구분). 줄바꿈은 보존.
 */
export function KeyValueList({ items }: KeyValueListProps) {
  return (
    <ul className="list-disc space-y-3 pl-5 marker:text-fg-muted">
      {items.map((item, i) => (
        <li key={i} className="break-keep leading-relaxed text-fg">
          {item.label && (
            <span className="font-emphasize text-fg">{item.label}</span>
          )}
          {item.value && (
            <p className="mt-1 whitespace-pre-line pl-4 text-m leading-relaxed text-fg">
              {item.value}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
