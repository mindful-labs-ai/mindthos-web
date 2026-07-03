import type { KVItem } from '@/features/client/types/supervisionReport.types';

import { EditableText } from './EditableText';

interface KeyValueListProps {
  items: KVItem[];
  /** 편집 모드 — 라벨/본문을 필드 단위로 수정 */
  editable?: boolean;
  onItemsChange?: (items: KVItem[]) => void;
}

/**
 * 라벨/본문 목록. 평범한 불릿 + 굵은 라벨(소제목) + 본문 문단으로 위계만 구분.
 * 색은 상담노트 렌더러와 동일하게 text-fg(라벨은 굵게만 구분). 줄바꿈은 보존.
 */
export function KeyValueList({
  items,
  editable = false,
  onItemsChange,
}: KeyValueListProps) {
  const handleItemChange = (index: number, patch: Partial<KVItem>) => {
    onItemsChange?.(
      items.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  return (
    <ul className="list-disc space-y-3 pl-5 marker:text-fg-muted">
      {items.map((item, i) => (
        <li key={i} className="break-keep leading-relaxed text-fg">
          {editable ? (
            <div className="space-y-1">
              <EditableText
                value={item.label}
                onChange={(label) => handleItemChange(i, { label })}
                ariaLabel="라벨 편집"
                className="font-emphasize"
              />
              <EditableText
                value={item.value}
                onChange={(value) => handleItemChange(i, { value })}
                ariaLabel="본문 편집"
              />
            </div>
          ) : (
            <>
              {item.label && (
                <span className="font-emphasize text-fg">{item.label}</span>
              )}
              {item.value && (
                <p className="mt-1 whitespace-pre-line pl-4 text-m leading-relaxed text-fg">
                  {item.value}
                </p>
              )}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
