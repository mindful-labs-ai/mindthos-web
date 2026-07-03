import { VISIBILITY_KINDS } from '../../constants';
import type { CalendarEventKind } from '../../types';

import { CategoryToggleItem } from './CategoryToggleItem';

interface VisibilityTogglesProps {
  kindVisible: Record<CalendarEventKind, boolean>;
  onToggleKind: (kind: CalendarEventKind) => void;
}

/** '일정 표시' — 국가 공휴일 / 상담 일정 / 개인 일정 표시 토글 */
export function VisibilityToggles({
  kindVisible,
  onToggleKind,
}: VisibilityTogglesProps) {
  return (
    <div>
      <h3 className="text-m font-medium text-grey-100">일정 표시</h3>
      <div className="mt-5 flex flex-col gap-3">
        {VISIBILITY_KINDS.map((item) => (
          <CategoryToggleItem
            key={item.kind}
            label={item.label}
            colorKey={item.colorKey}
            checked={kindVisible[item.kind]}
            onToggle={() => onToggleKind(item.kind)}
          />
        ))}
      </div>
    </div>
  );
}
