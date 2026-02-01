import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Plus } from 'lucide-react';

import type { SelectedItem } from '@/genogram/core/editor/interaction-state';
import {
  AssetType,
  ParentChildStatus,
  RelationStatus,
  SubjectType,
} from '@/genogram/core/types/enums';

import {
  PARENT_CHILD_STATUS_LABELS,
  RELATION_STATUS_LABELS,
} from '../constants/labels';

// ── 선택 컨텍스트 ──

export type SelectionContext =
  | { type: 'none' }
  | { type: 'single-subject'; subjectId: string; subjectType?: string }
  | { type: 'single-connection'; connectionId: string }
  | { type: 'multi'; ids: string[] };

/** FAB를 표시하지 않을 특수 자녀 SubjectType 집합 */
const SPECIAL_CHILD_TYPES: ReadonlySet<string> = new Set([
  SubjectType.Miscarriage,
  SubjectType.Abortion,
  SubjectType.Pregnancy,
]);

export function deriveSelectionContext(
  items: SelectedItem[]
): SelectionContext {
  if (items.length === 0) return { type: 'none' };
  if (items.length === 1) {
    const item = items[0];
    if (item.type === AssetType.Node) {
      return { type: 'single-subject', subjectId: item.id };
    }
    if (item.type === AssetType.Edge) {
      return { type: 'single-connection', connectionId: item.id };
    }
  }
  return { type: 'multi', ids: items.map((i) => i.id) };
}

// ── 액션 타입 ──

export type FloatingActionType =
  | 'add-parent'
  | 'add-child'
  | 'add-partner'
  | 'add-relation';

// ── 메뉴 아이콘 ──

const ParentMenuIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
    <path
      d="M28 26.664C28 24.3418 25.7738 22.3663 22.6667 21.6341M20 26.6641C20 23.7185 16.4183 21.3307 12 21.3307C7.58172 21.3307 4 23.7185 4 26.6641M20 17.3307C22.9455 17.3307 25.3333 14.9429 25.3333 11.9974C25.3333 9.05188 22.9455 6.66406 20 6.66406M12 17.3307C9.05448 17.3307 6.66667 14.9429 6.66667 11.9974C6.66667 9.05188 9.05448 6.66406 12 6.66406C14.9455 6.66406 17.3333 9.05188 17.3333 11.9974C17.3333 14.9429 14.9455 17.3307 12 17.3307Z"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChildMenuIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
    <g clipPath="url(#fab-child-clip)">
      <path
        d="M27.9996 15.5005C27.999 14.8108 27.7948 14.1367 27.4124 13.5628C27.0301 12.9889 26.4867 12.5407 25.8506 12.2745C25.4445 9.95682 24.2343 7.85656 22.4327 6.34313C20.6311 4.82969 18.3535 4 16.0006 4C13.6476 4 11.37 4.82969 9.56843 6.34313C7.76682 7.85656 6.55657 9.95682 6.15056 12.2745C5.42456 12.5799 4.82281 13.1213 4.4426 13.8111C4.0624 14.5008 3.92597 15.2987 4.05538 16.0756C4.18479 16.8526 4.57248 17.5631 5.15574 18.0924C5.73901 18.6217 6.48375 18.9388 7.26956 18.9925C7.78605 20.0885 8.48651 21.088 9.34056 21.9475C8.08914 23.3139 7.29495 25.0365 7.06856 26.8755C7.05084 27.0161 7.06323 27.159 7.10491 27.2945C7.14659 27.43 7.21662 27.5551 7.31033 27.6615C7.40405 27.7679 7.51931 27.8531 7.64849 27.9115C7.77766 27.97 7.91778 28.0003 8.05956 28.0005H23.9186C24.0603 28.0004 24.2005 27.9702 24.3297 27.9119C24.4589 27.8536 24.5742 27.7685 24.668 27.6622C24.7618 27.5559 24.832 27.4309 24.8738 27.2954C24.9156 27.1599 24.9281 27.0171 24.9106 26.8765C24.6858 25.0421 23.8955 23.3233 22.6496 21.9585C23.5083 21.0963 24.2126 20.0931 24.7316 18.9925C25.6176 18.9336 26.4482 18.5401 27.055 17.8917C27.6618 17.2433 27.9995 16.3885 27.9996 15.5005ZM24.2476 16.9735C24.0143 16.9307 23.7735 16.9729 23.5686 17.0923C23.3637 17.2117 23.2083 17.4005 23.1306 17.6245C22.2146 20.2225 19.1296 23.0005 15.9996 23.0005C12.8696 23.0005 9.78456 20.2205 8.86856 17.6225C8.7906 17.3986 8.63518 17.2099 8.43036 17.0905C8.22553 16.9712 7.98479 16.9289 7.75156 16.9715C7.66845 16.9878 7.58419 16.9975 7.49956 17.0005C7.12835 16.996 6.77196 16.8541 6.49934 16.6021C6.22672 16.3501 6.05722 16.006 6.02363 15.6363C5.99005 15.2666 6.09475 14.8975 6.3175 14.6005C6.54025 14.3036 6.86522 14.0997 7.22956 14.0285C7.44217 13.9899 7.63658 13.8835 7.78368 13.7253C7.93078 13.567 8.02266 13.3653 8.04556 13.1505C8.19087 11.7624 8.69829 10.437 9.517 9.30673C10.3357 8.1765 11.437 7.28119 12.7106 6.71046C12.4999 7.24629 12.4234 7.82546 12.4876 8.39761C12.5518 8.96976 12.7549 9.51756 13.0791 9.99335C13.4033 10.4691 13.8388 10.8585 14.3478 11.1276C14.8568 11.3967 15.4238 11.5374 15.9996 11.5374C16.5753 11.5374 17.1423 11.3967 17.6513 11.1276C18.1603 10.8585 18.5958 10.4691 18.92 9.99335C19.2442 9.51756 19.4473 8.96976 19.5115 8.39761C19.5757 7.82546 19.4992 7.24629 19.2886 6.71046C20.5621 7.28119 21.6634 8.1765 22.4821 9.30673C23.3008 10.437 23.8082 11.7624 23.9536 13.1505C23.9765 13.3653 24.0683 13.567 24.2154 13.7253C24.3625 13.8835 24.5569 13.9899 24.7696 14.0285C25.1339 14.0997 25.4589 14.3036 25.6816 14.6005C25.9044 14.8975 26.0091 15.2666 25.9755 15.6363C25.9419 16.006 25.7724 16.3501 25.4998 16.6021C25.2271 16.8541 24.8708 16.996 24.4996 17.0005C24.415 16.9981 24.3307 16.9891 24.2476 16.9735Z"
        fill="currentColor"
      />
      <path
        d="M13.5 17C14.3284 17 15 16.3284 15 15.5C15 14.6716 14.3284 14 13.5 14C12.6716 14 12 14.6716 12 15.5C12 16.3284 12.6716 17 13.5 17Z"
        fill="currentColor"
      />
      <path
        d="M18.5 17C19.3284 17 20 16.3284 20 15.5C20 14.6716 19.3284 14 18.5 14C17.6716 14 17 14.6716 17 15.5C17 16.3284 17.6716 17 18.5 17Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="fab-child-clip">
        <rect width="24" height="24" fill="white" transform="translate(4 4)" />
      </clipPath>
    </defs>
  </svg>
);

const PartnerMenuIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
    <path
      d="M16 10.2604C13.3333 4.00114 4 4.66781 4 12.6678C4 20.6679 16 27.3348 16 27.3348C16 27.3348 28 20.6679 28 12.6678C28 4.66781 18.6667 4.00114 16 10.2604Z"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RelationMenuIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
    <path
      d="M3 17.5156L17.5185 2.99711"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 28.5938L28.5926 12.0012"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="4 4"
    />
    <path
      d="M6 22H8.30303H11.1818V19.5V17H13.4848H15.7879V14.5V12H18.0909H20.3939V9.5V7H22.697H25"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// ── 메뉴 아이템 정의 ──

interface MenuItem {
  icon: React.FC;
  label: string;
  action: FloatingActionType;
}

const SINGLE_SUBJECT_MENU: MenuItem[] = [
  { icon: ParentMenuIcon, label: '부모', action: 'add-parent' },
  { icon: ChildMenuIcon, label: '자녀', action: 'add-child' },
  { icon: PartnerMenuIcon, label: '파트너', action: 'add-partner' },
  { icon: RelationMenuIcon, label: '관계', action: 'add-relation' },
];

const PARTNER_CONNECTION_MENU: MenuItem[] = [
  { icon: ChildMenuIcon, label: '자녀', action: 'add-child' },
];

// ── Props ──

export interface FloatingActionExtra {
  relationStatus?: (typeof RelationStatus)[keyof typeof RelationStatus];
  parentChildStatus?: (typeof ParentChildStatus)[keyof typeof ParentChildStatus];
}

interface FloatingActionButtonProps {
  selectionContext: SelectionContext;
  /** FAB가 표시될 화면 좌표 (캔버스 컨테이너 기준 상대 좌표) */
  position: { x: number; y: number } | null;
  onAction: (
    action: FloatingActionType,
    context: SelectionContext,
    extra?: FloatingActionExtra
  ) => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  selectionContext,
  position,
  onAction,
}) => {
  // selectionContext 변경 시 자동 닫힘: contextKey가 바뀌면 openForKey가 무효화됨
  const contextKey =
    selectionContext.type === 'single-subject'
      ? selectionContext.subjectId
      : selectionContext.type === 'single-connection'
        ? selectionContext.connectionId
        : selectionContext.type;
  const [openForKey, setOpenForKey] = useState<string | null>(null);
  const isOpen = openForKey === contextKey;
  const [showRelationSub, setShowRelationSub] = useState(false);
  const [showChildSub, setShowChildSub] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const setOpen = useCallback(
    (value: boolean) => {
      setOpenForKey(value ? contextKey : null);
      if (!value) {
        setShowRelationSub(false);
        setShowChildSub(false);
      }
    },
    [contextKey]
  );

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen, setOpen]);

  const handleToggle = useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen, setOpen]);

  const handleItemClick = useCallback(
    (action: FloatingActionType) => {
      if (action === 'add-relation') {
        setShowRelationSub(true);
        return;
      }
      if (action === 'add-child') {
        setShowChildSub(true);
        return;
      }
      onAction(action, selectionContext);
      setOpen(false);
    },
    [onAction, selectionContext, setOpen]
  );

  const handleRelationSelect = useCallback(
    (status: (typeof RelationStatus)[keyof typeof RelationStatus]) => {
      onAction('add-relation', selectionContext, { relationStatus: status });
      setOpen(false);
    },
    [onAction, selectionContext, setOpen]
  );

  const handleChildSelect = useCallback(
    (
      status: (typeof ParentChildStatus)[keyof typeof ParentChildStatus]
    ) => {
      onAction('add-child', selectionContext, { parentChildStatus: status });
      setOpen(false);
    },
    [onAction, selectionContext, setOpen]
  );

  // 표시 조건: single-subject 또는 single-connection (특수 자녀 제외)
  if (
    (selectionContext.type !== 'single-subject' &&
      selectionContext.type !== 'single-connection') ||
    !position
  ) {
    return null;
  }
  if (
    selectionContext.type === 'single-subject' &&
    selectionContext.subjectType &&
    SPECIAL_CHILD_TYPES.has(selectionContext.subjectType)
  ) {
    return null;
  }

  const menuItems =
    selectionContext.type === 'single-connection'
      ? PARTNER_CONNECTION_MENU
      : SINGLE_SUBJECT_MENU;

  return (
    <div
      ref={containerRef}
      className="pointer-events-auto absolute z-20"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* + 버튼 */}
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white shadow-md transition-transform hover:scale-110 hover:bg-green-600 active:scale-95"
        onClick={handleToggle}
      >
        <Plus
          size={18}
          className={`transition-transform ${isOpen ? 'rotate-45' : ''}`}
        />
      </button>

      {/* 드롭다운 (우측에 펼침) */}
      {isOpen && (
        <div
          className="absolute left-full top-1/2 ml-2 -translate-y-1/2 rounded-xl border border-border bg-white p-2 py-1.5 shadow-lg"
          style={{ minWidth: 140 }}
        >
          {showRelationSub ? (
            <>
              <button
                type="button"
                className="mb-1 flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-fg/60 transition-colors hover:bg-surface-contrast"
                onClick={() => setShowRelationSub(false)}
              >
                ← 관계 선택
              </button>
              {Object.entries(RELATION_STATUS_LABELS).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface-contrast"
                    onClick={() =>
                      handleRelationSelect(
                        value as (typeof RelationStatus)[keyof typeof RelationStatus]
                      )
                    }
                  >
                    {label}
                  </button>
                )
              )}
            </>
          ) : showChildSub ? (
            <>
              <button
                type="button"
                className="mb-1 flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-fg/60 transition-colors hover:bg-surface-contrast"
                onClick={() => setShowChildSub(false)}
              >
                ← 자녀 선택
              </button>
              {Object.entries(PARENT_CHILD_STATUS_LABELS).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface-contrast"
                    onClick={() =>
                      handleChildSelect(
                        value as (typeof ParentChildStatus)[keyof typeof ParentChildStatus]
                      )
                    }
                  >
                    {label}
                  </button>
                )
              )}
            </>
          ) : (
            menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.action}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface-contrast"
                  onClick={() => handleItemClick(item.action)}
                >
                  <Icon />
                  {item.label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
