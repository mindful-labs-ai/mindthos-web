import { Plus } from 'lucide-react';

import { cn } from '@/lib/cn';

interface AddCardProps {
  onClick: () => void;
  disabled?: boolean;
}

/** 구성원 추가 더미 카드 (FamilyMemberCard와 동일한 크기) */
export function AddMemberCard({ onClick, disabled }: AddCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-[276px] max-w-[489px] items-center justify-center rounded-xl border border-dashed transition-colors',
        disabled
          ? 'cursor-not-allowed border-border opacity-50'
          : 'border-fg-muted hover:border-fg'
      )}
    >
      <Plus className={cn('h-8 w-8', disabled ? 'text-fg-muted' : 'text-fg')} />
    </button>
  );
}

/** 관계 추가 더미 카드 (RelationCard와 동일한 크기) */
export function AddRelationCard({ onClick, disabled }: AddCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-[169px] w-full items-center justify-center rounded-xl border border-dashed transition-colors',
        disabled
          ? 'cursor-not-allowed border-border opacity-50'
          : 'border-fg-muted hover:border-fg'
      )}
    >
      <Plus className={cn('h-8 w-8', disabled ? 'text-fg-muted' : 'text-fg')} />
    </button>
  );
}
