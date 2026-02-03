import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Plus } from 'lucide-react';

import type { SelectedItem } from '@/genogram/core/editor/interaction-state';
import {
  AssetType,
  ParentChildStatus,
} from '@/genogram/core/types/enums';

import { PARENT_CHILD_STATUS_LABELS } from '../constants/labels';

// ── 선택 컨텍스트 ──

export type SelectionContext =
  | { type: 'none' }
  | { type: 'single-subject'; subjectId: string; isSpecialChild?: boolean }
  | { type: 'single-connection'; connectionId: string }
  | { type: 'multi'; ids: string[] };

export function deriveSelectionContext(
  items: SelectedItem[]
): SelectionContext {
  // Annotation(Text) 선택은 FAB 대상이 아니므로 제외
  const filtered = items.filter((i) => i.type !== AssetType.Text);
  if (filtered.length === 0) return { type: 'none' };
  if (filtered.length === 1) {
    const item = filtered[0];
    if (item.type === AssetType.Node) {
      return { type: 'single-subject', subjectId: item.id };
    }
    if (item.type === AssetType.Edge) {
      return { type: 'single-connection', connectionId: item.id };
    }
  }
  return { type: 'multi', ids: filtered.map((i) => i.id) };
}

// ── 액션 타입 ──

export type FloatingActionType =
  | 'add-parent'
  | 'add-child'
  | 'add-sibling'
  | 'add-partner'
  | 'add-group';

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

const SiblingMenuIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
    <g clipPath="url(#fab-sibling-clip)">
      <path
        d="M27.999 15.5C27.9989 16.3881 27.6613 17.2429 27.0545 17.8913C26.4477 18.5397 25.6171 18.9332 24.731 18.992C23.7204 21.1065 22.0631 22.8443 19.999 23.954V27C19.999 27.2652 19.8936 27.5196 19.7061 27.7071C19.5185 27.8947 19.2642 28 18.999 28H12.999C12.7338 28 12.4794 27.8947 12.2919 27.7071C12.1043 27.5196 11.999 27.2652 11.999 27V23.953C10.072 22.9039 8.49339 21.3149 7.45697 19.381C7.33498 19.1455 7.31153 18.8712 7.3918 18.6184C7.47206 18.3656 7.64946 18.155 7.88497 18.033C8.12049 17.911 8.39482 17.8876 8.64762 17.9678C8.90042 18.0481 9.11098 18.2255 9.23298 18.461C10.399 20.717 13.099 23 15.999 23C19.128 23 22.211 20.221 23.127 17.624C23.2049 17.4001 23.3604 17.2115 23.5652 17.0921C23.77 16.9727 24.0107 16.9305 24.244 16.973C24.3281 16.9888 24.4134 16.9978 24.499 17C24.8702 16.9956 25.2266 16.8537 25.4992 16.6017C25.7718 16.3497 25.9413 16.0056 25.9749 15.6358C26.0085 15.2661 25.9038 14.8971 25.681 14.6001C25.4583 14.3031 25.1333 14.0993 24.769 14.028C24.5564 13.9895 24.3619 13.8831 24.2148 13.7248C24.0677 13.5666 23.9759 13.3649 23.953 13.15C23.8207 11.8851 23.3873 10.6703 22.6891 9.60726C21.9909 8.54423 21.0482 7.66392 19.94 7.04002C19.6573 7.92547 19.2791 8.77749 18.812 9.58102C17.514 11.4212 15.8206 12.9475 13.856 14.048C14.1555 14.1214 14.4252 14.2853 14.6283 14.5174C14.8313 14.7496 14.9579 15.0387 14.9907 15.3453C15.0235 15.652 14.961 15.9613 14.8117 16.2312C14.6624 16.5011 14.4335 16.7183 14.1562 16.8534C13.879 16.9885 13.5668 17.0349 13.2623 16.9862C12.9577 16.9374 12.6756 16.796 12.4543 16.5812C12.233 16.3663 12.0834 16.0885 12.0257 15.7855C11.968 15.4825 12.0051 15.1691 12.132 14.888C9.8328 15.8191 7.34678 16.1959 4.87498 15.988C4.66895 15.9604 4.47664 15.8693 4.32481 15.7273C4.17298 15.5853 4.06917 15.3996 4.02781 15.1959C3.98645 14.9921 4.0096 14.7806 4.09404 14.5907C4.17849 14.4007 4.32003 14.2418 4.49898 14.136C5.10351 13.4501 5.55336 12.6422 5.81798 11.767C7.12297 8.67403 9.09897 4.00002 15.999 4.00002C18.3534 3.99481 20.6337 4.82254 22.4365 6.33677C24.2394 7.85101 25.4485 9.95412 25.85 12.274C26.4862 12.5402 27.0295 12.9884 27.4118 13.5624C27.7942 14.1363 27.9984 14.8104 27.999 15.5ZM19.999 15.5C19.999 15.2034 19.911 14.9133 19.7462 14.6667C19.5814 14.42 19.3471 14.2277 19.073 14.1142C18.7989 14.0007 18.4973 13.971 18.2063 14.0288C17.9154 14.0867 17.6481 14.2296 17.4383 14.4394C17.2285 14.6491 17.0857 14.9164 17.0278 15.2074C16.9699 15.4984 16.9996 15.8 17.1132 16.0741C17.2267 16.3481 17.4189 16.5824 17.6656 16.7472C17.9123 16.9121 18.2023 17 18.499 17C18.8968 17 19.2783 16.842 19.5596 16.5607C19.8409 16.2794 19.999 15.8979 19.999 15.5Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="fab-sibling-clip">
        <rect width="24" height="24" fill="white" transform="translate(4 4)" />
      </clipPath>
    </defs>
  </svg>
);

const GroupMenuIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
    <path
      d="M22.6667 26.6641C22.6667 24.4549 19.6819 22.6641 16 22.6641C12.3181 22.6641 9.33333 24.4549 9.33333 26.6641M28 22.6646C28 21.0243 26.3545 19.6146 24 18.9974M4 22.6646C4 21.0243 5.64546 19.6146 8 18.9974M24 13.6455C24.8183 12.9131 25.3333 11.8487 25.3333 10.6641C25.3333 8.45492 23.5425 6.66406 21.3333 6.66406C20.3089 6.66406 19.3743 7.0492 18.6667 7.68259M8 13.6455C7.18167 12.9131 6.66667 11.8487 6.66667 10.6641C6.66667 8.45492 8.45753 6.66406 10.6667 6.66406C11.6911 6.66406 12.6257 7.0492 13.3333 7.68259M16 18.6641C13.7909 18.6641 12 16.8732 12 14.6641C12 12.4549 13.7909 10.6641 16 10.6641C18.2091 10.6641 20 12.4549 20 14.6641C20 16.8732 18.2091 18.6641 16 18.6641Z"
      stroke="currentColor"
      strokeWidth="2.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
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
  { icon: SiblingMenuIcon, label: '형제자매', action: 'add-sibling' },
  { icon: PartnerMenuIcon, label: '파트너', action: 'add-partner' },
];

const PARTNER_CONNECTION_MENU: MenuItem[] = [
  { icon: ChildMenuIcon, label: '자녀', action: 'add-child' },
];

const MULTI_SUBJECT_MENU: MenuItem[] = [
  { icon: GroupMenuIcon, label: '그룹으로 연결하기', action: 'add-group' },
];

// ── Props ──

export interface FloatingActionExtra {
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
  const [showChildSub, setShowChildSub] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const setOpen = useCallback(
    (value: boolean) => {
      setOpenForKey(value ? contextKey : null);
      if (!value) {
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
      if (action === 'add-child') {
        setShowChildSub(true);
        return;
      }
      onAction(action, selectionContext);
      setOpen(false);
    },
    [onAction, selectionContext, setOpen]
  );

  const handleChildSelect = useCallback(
    (status: (typeof ParentChildStatus)[keyof typeof ParentChildStatus]) => {
      onAction('add-child', selectionContext, { parentChildStatus: status });
      setOpen(false);
    },
    [onAction, selectionContext, setOpen]
  );

  // 표시 조건: single-subject, single-connection, multi (특수 자녀 제외)
  if (
    (selectionContext.type !== 'single-subject' &&
      selectionContext.type !== 'single-connection' &&
      selectionContext.type !== 'multi') ||
    !position
  ) {
    return null;
  }
  if (
    selectionContext.type === 'single-subject' &&
    selectionContext.isSpecialChild
  ) {
    return null;
  }

  const menuItems =
    selectionContext.type === 'multi'
      ? MULTI_SUBJECT_MENU
      : selectionContext.type === 'single-connection'
        ? PARTNER_CONNECTION_MENU
        : SINGLE_SUBJECT_MENU;

  return (
    <div
      ref={containerRef}
      className="pointer-events-auto absolute z-10"
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
          style={{ minWidth: 'max-content' }}
        >
          {showChildSub ? (
            <>
              <button
                type="button"
                className="text-fg/60 mb-1 flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors hover:bg-surface-contrast"
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
