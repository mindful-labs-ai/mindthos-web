import { cn } from '@/lib/cn';

import { EDITABLE_CLASS } from '../editable';

interface AdminPlanHeaderProps {
  value: string;
  editable?: boolean;
}

export function AdminPlanHeader({ value, editable }: AdminPlanHeaderProps) {
  return (
    <div className="space-y-1.5 py-2">
      <span className="note-label">행정적 계획</span>
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
  return `- 행정적 계획: ${value}`;
}
