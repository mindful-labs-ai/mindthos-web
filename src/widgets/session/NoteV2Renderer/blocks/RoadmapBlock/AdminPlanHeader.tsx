import { cn } from '@/lib/cn';

import { EDITABLE_CLASS } from '../editable';

interface AdminPlanHeaderProps {
  value: string;
  editable?: boolean;
  /** "5-1-1" 등. 제공 시 라벨 앞에 "{prefix}. " 자동 부여. */
  numberPrefix?: string;
}

export function AdminPlanHeader({
  value,
  editable,
  numberPrefix,
}: AdminPlanHeaderProps) {
  const labelText = numberPrefix ? `${numberPrefix}. 행정적 계획` : '행정적 계획';
  return (
    <div className="space-y-1.5 py-2">
      <span className="note-label">{labelText}</span>
      <p
        className={cn('note-desc', editable && EDITABLE_CLASS)}
        contentEditable={editable}
        suppressContentEditableWarning={editable}
        data-note-path={editable ? 'phase4.roadmap.admin_plan' : undefined}
      >
        {value || (editable ? '' : '—')}
      </p>
    </div>
  );
}

export function serializeAdminPlan(value: string): string {
  return `행정적 계획: ${value}`;
}
