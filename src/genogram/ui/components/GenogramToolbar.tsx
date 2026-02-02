import React, { useState } from 'react';

import {
  BoxSelect,
  ChevronLeft,
  MousePointer2,
  Move,
  Square,
  Tag,
  Trash2,
  Type,
} from 'lucide-react';

import {
  Gender,
  InfluenceStatus,
  RelationStatus,
  SubjectType,
  ToolMode,
} from '@/genogram/core/types/enums';

import {
  GENDER_LABELS,
  INFLUENCE_STATUS_LABELS,
  RELATION_STATUS_LABELS,
  SUBJECT_TYPE_LABELS,
  TOOLBAR_LABELS,
} from '../constants/labels';

import { SimpleTooltip } from './common/SimpleTooltip';
import { GenderIcon } from './icons/GenderIcon';
import { RelationIcon } from './icons/RelationIcon';

type ToolModeValue = (typeof ToolMode)[keyof typeof ToolMode];

// ── SubTool 타입 정의 ──

/** CreateSubject 서브 선택 */
export type SubjectSubTool =
  | { kind: 'family' }
  | { kind: 'gender'; gender: (typeof Gender)[keyof typeof Gender] }
  | { kind: 'animal' };

/** CreateConnection 서브 선택 */
export type ConnectionSubTool =
  | {
      kind: 'relation';
      status: (typeof RelationStatus)[keyof typeof RelationStatus];
    }
  | {
      kind: 'influence';
      status: (typeof InfluenceStatus)[keyof typeof InfluenceStatus];
    };

// ── 메뉴 아이템 정의 ──

interface SubjectMenuItem {
  label: string;
  subTool: SubjectSubTool;
}

interface ConnectionMenuItem {
  label: string;
  subTool: ConnectionSubTool;
}

/** SubjectSubTool → GenderIcon value 변환 */
const getSubjectIconValue = (subTool: SubjectSubTool): string => {
  switch (subTool.kind) {
    case 'gender':
      return subTool.gender;
    case 'animal':
      return SubjectType.Animal;
    case 'family':
    default:
      return Gender.Male;
  }
};

const SUBJECT_PRIMARY_ITEMS: SubjectMenuItem[] = [
  { label: TOOLBAR_LABELS.FAMILY, subTool: { kind: 'family' } },
  {
    label: GENDER_LABELS[Gender.Male],
    subTool: { kind: 'gender', gender: Gender.Male },
  },
  {
    label: GENDER_LABELS[Gender.Female],
    subTool: { kind: 'gender', gender: Gender.Female },
  },
];

const SUBJECT_SECONDARY_ITEMS: SubjectMenuItem[] = [
  {
    label: GENDER_LABELS[Gender.Gay],
    subTool: { kind: 'gender', gender: Gender.Gay },
  },
  {
    label: GENDER_LABELS[Gender.Lesbian],
    subTool: { kind: 'gender', gender: Gender.Lesbian },
  },
  {
    label: GENDER_LABELS[Gender.Transgender_Male],
    subTool: { kind: 'gender', gender: Gender.Transgender_Male },
  },
  {
    label: GENDER_LABELS[Gender.Transgender_Female],
    subTool: { kind: 'gender', gender: Gender.Transgender_Female },
  },
  {
    label: GENDER_LABELS[Gender.Nonbinary],
    subTool: { kind: 'gender', gender: Gender.Nonbinary },
  },
  {
    label: SUBJECT_TYPE_LABELS[SubjectType.Animal],
    subTool: { kind: 'animal' },
  },
];

const CONNECTION_PRIMARY_ITEMS: ConnectionMenuItem[] = [
  {
    label: RELATION_STATUS_LABELS[RelationStatus.Connected],
    subTool: { kind: 'relation', status: RelationStatus.Connected },
  },
  {
    label: RELATION_STATUS_LABELS[RelationStatus.Close],
    subTool: { kind: 'relation', status: RelationStatus.Close },
  },
  {
    label: RELATION_STATUS_LABELS[RelationStatus.Fused],
    subTool: { kind: 'relation', status: RelationStatus.Fused },
  },
  {
    label: RELATION_STATUS_LABELS[RelationStatus.Distant],
    subTool: { kind: 'relation', status: RelationStatus.Distant },
  },
  {
    label: RELATION_STATUS_LABELS[RelationStatus.Hostile],
    subTool: { kind: 'relation', status: RelationStatus.Hostile },
  },
];

const CONNECTION_SECONDARY_ITEMS: ConnectionMenuItem[] = [
  {
    label: RELATION_STATUS_LABELS[RelationStatus.Close_Hostile],
    subTool: { kind: 'relation', status: RelationStatus.Close_Hostile },
  },
  {
    label: INFLUENCE_STATUS_LABELS[InfluenceStatus.Physical_Abuse],
    subTool: { kind: 'influence', status: InfluenceStatus.Physical_Abuse },
  },
  {
    label: INFLUENCE_STATUS_LABELS[InfluenceStatus.Emotional_Abuse],
    subTool: { kind: 'influence', status: InfluenceStatus.Emotional_Abuse },
  },
  {
    label: INFLUENCE_STATUS_LABELS[InfluenceStatus.Sexual_Abuse],
    subTool: { kind: 'influence', status: InfluenceStatus.Sexual_Abuse },
  },
  {
    label: INFLUENCE_STATUS_LABELS[InfluenceStatus.Focused_On],
    subTool: { kind: 'influence', status: InfluenceStatus.Focused_On },
  },
  {
    label: INFLUENCE_STATUS_LABELS[InfluenceStatus.Focused_On_Negatively],
    subTool: {
      kind: 'influence',
      status: InfluenceStatus.Focused_On_Negatively,
    },
  },
  {
    label: RELATION_STATUS_LABELS[RelationStatus.Cutoff],
    subTool: { kind: 'relation', status: RelationStatus.Cutoff },
  },
];

// ── 커스텀 툴바 아이콘 ──

/** 가족 아이콘: 사각형(남) + 원(여) 수평 연결, 아래 작은 원(자녀) */
const FamilyIcon: React.FC<{ size?: number }> = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clip-path="url(#clip0_4319_32992)">
      <path
        d="M2 3.77789V10.2223C2 10.8446 2 11.1553 2.1211 11.393C2.22763 11.6021 2.39748 11.7725 2.60655 11.879C2.844 12 3.155 12 3.77606 12H10.2239C10.845 12 11.1556 12 11.393 11.879C11.6021 11.7725 11.7725 11.6021 11.879 11.393C12 11.1556 12 10.845 12 10.2239V3.77606C12 3.155 12 2.844 11.879 2.60655C11.7725 2.39748 11.6021 2.22763 11.393 2.1211C11.1553 2 10.8446 2 10.2223 2H3.77789C3.15561 2 2.84423 2 2.60655 2.1211C2.39748 2.22763 2.22763 2.39748 2.1211 2.60655C2 2.84423 2 3.15561 2 3.77789Z"
        stroke="#3C3C3C"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M20 7C20 9.76142 22.2386 12 25 12C27.7614 12 30 9.76142 30 7C30 4.23858 27.7614 2 25 2C22.2386 2 20 4.23858 20 7Z"
        stroke="#3C3C3C"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M11 25C11 27.7614 13.2386 30 16 30C18.7614 30 21 27.7614 21 25C21 22.2386 18.7614 20 16 20C13.2386 20 11 22.2386 11 25Z"
        stroke="#3C3C3C"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path d="M7 13V16H25V13" stroke="#3C3C3C" stroke-width="2" />
      <path d="M16 16V19" stroke="#3C3C3C" stroke-width="2" />
    </g>
    <defs>
      <clipPath id="clip0_4319_32992">
        <rect width="32" height="32" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

/** 관계 연결 아이콘: 대각선 지그재그 */
const ConnectionIcon: React.FC<{ size?: number }> = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 17.5156L17.5185 2.99711"
      stroke="#3C3C3C"
      stroke-width="2"
      stroke-linecap="round"
    />
    <path
      d="M12 28.5938L28.5926 12.0012"
      stroke="#3C3C3C"
      stroke-width="2"
      stroke-linecap="round"
      stroke-dasharray="4 4"
    />
    <path
      d="M6 22H8.30303H11.1818V19.5V17H13.4848H15.7879V14.5V12H18.0909H20.3939V9.5V7H22.697H25"
      stroke="#3C3C3C"
      stroke-width="2"
      stroke-linecap="round"
    />
  </svg>
);

// ── 메인 툴바 아이템 ──

interface ToolItem {
  mode: ToolModeValue;
  icon: React.FC<{ size?: number }>;
  label: string;
}

const TOOL_GROUPS: ToolItem[][] = [
  [
    { mode: ToolMode.Select_Tool, icon: MousePointer2, label: '선택' },
    { mode: ToolMode.Pan_Tool, icon: Move, label: '이동' },
    { mode: ToolMode.Multi_Select_Tool, icon: BoxSelect, label: '다중 선택' },
  ],
  [
    {
      mode: ToolMode.Create_Subject_Tool,
      icon: Square,
      label: '구성원 추가',
    },
    {
      mode: ToolMode.Create_Connection_Tool,
      icon: ConnectionIcon,
      label: '관계 연결',
    },
    { mode: ToolMode.Create_Annotation_Tool, icon: Type, label: '텍스트 추가' },
  ],
];

// ── Props ──

interface GenogramToolbarProps {
  toolMode: ToolModeValue;
  onToolModeChange: (mode: ToolModeValue) => void;
  onDelete: () => void;
  hasSelection: boolean;
  onSubjectSubToolSelect?: (subTool: SubjectSubTool) => void;
  onConnectionSubToolSelect?: (subTool: ConnectionSubTool) => void;
}

export const GenogramToolbar: React.FC<GenogramToolbarProps> = ({
  toolMode,
  onToolModeChange,
  onDelete,
  hasSelection,
  onSubjectSubToolSelect,
  onConnectionSubToolSelect,
}) => {
  // 서브 메뉴 표시 여부 (toolMode와 별개)
  const [openMenu, setOpenMenu] = useState<'subject' | 'connection' | null>(
    null
  );
  // 서브 메뉴 depth: 'primary' | 'secondary'
  const [subjectDepth, setSubjectDepth] = useState<'primary' | 'secondary'>(
    'primary'
  );
  const [connectionDepth, setConnectionDepth] = useState<
    'primary' | 'secondary'
  >('primary');

  const hasSubMenu = (mode: ToolModeValue) =>
    mode === ToolMode.Create_Subject_Tool ||
    mode === ToolMode.Create_Connection_Tool;

  const handleToolClick = (mode: ToolModeValue) => {
    if (hasSubMenu(mode)) {
      // 서브 메뉴 토글 (모드 전환은 서브 항목 선택 시)
      const menuKey =
        mode === ToolMode.Create_Subject_Tool ? 'subject' : 'connection';
      if (openMenu === menuKey) {
        // 이미 열려 있으면 닫고 Select_Tool로 복귀
        setOpenMenu(null);
        if (toolMode === mode) {
          onToolModeChange(ToolMode.Select_Tool);
        }
      } else {
        setOpenMenu(menuKey);
      }
      setSubjectDepth('primary');
      setConnectionDepth('primary');
      return;
    }

    // 서브 메뉴 없는 도구: 기존 동작
    setOpenMenu(null);
    if (toolMode === mode) {
      onToolModeChange(ToolMode.Select_Tool);
    } else {
      onToolModeChange(mode);
    }
  };

  const handleSubjectSelect = (subTool: SubjectSubTool) => {
    onSubjectSubToolSelect?.(subTool);
    onToolModeChange(ToolMode.Create_Subject_Tool);
    setOpenMenu(null);
    setSubjectDepth('primary');
  };

  const handleConnectionSelect = (subTool: ConnectionSubTool) => {
    onConnectionSubToolSelect?.(subTool);
    onToolModeChange(ToolMode.Create_Connection_Tool);
    setOpenMenu(null);
    setConnectionDepth('primary');
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* CreateSubject 서브 메뉴 */}
      {openMenu === 'subject' && (
        <div className="rounded-xl border border-border bg-white shadow-md">
          {subjectDepth === 'primary' ? (
            <div className="flex items-center gap-1 px-2 py-1.5">
              {SUBJECT_PRIMARY_ITEMS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="inline-flex flex-col items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface-contrast"
                  onClick={() => handleSubjectSelect(item.subTool)}
                >
                  {item.subTool.kind === 'family' ? (
                    <FamilyIcon size={24} />
                  ) : (
                    <GenderIcon value={getSubjectIconValue(item.subTool)} />
                  )}
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                className="inline-flex flex-col items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface-contrast"
                onClick={() => setSubjectDepth('secondary')}
              >
                <GenderIcon value={SubjectType.Animal} />그 외
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5 px-1 py-1.5">
              <button
                type="button"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-fg-muted hover:text-fg"
                onClick={() => setSubjectDepth('primary')}
              >
                <ChevronLeft size={24} />
              </button>
              {SUBJECT_SECONDARY_ITEMS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="inline-flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs font-medium text-fg transition-colors hover:bg-surface-contrast"
                  onClick={() => handleSubjectSelect(item.subTool)}
                >
                  <GenderIcon value={getSubjectIconValue(item.subTool)} />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CreateConnection 서브 메뉴 */}
      {openMenu === 'connection' && (
        <div className="rounded-xl border border-border bg-white shadow-md">
          {connectionDepth === 'primary' ? (
            <div className="flex items-center gap-1 px-2 py-1.5">
              {CONNECTION_PRIMARY_ITEMS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="inline-flex flex-col items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface-contrast"
                  onClick={() => handleConnectionSelect(item.subTool)}
                >
                  <RelationIcon value={item.subTool.status} />
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                className="inline-flex flex-col items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface-contrast"
                onClick={() => setConnectionDepth('secondary')}
              >
                <ConnectionIcon size={24} />그 외
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5 px-1 py-1.5">
              <button
                type="button"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-fg-muted hover:text-fg"
                onClick={() => setConnectionDepth('primary')}
              >
                <ChevronLeft size={24} />
              </button>
              {CONNECTION_SECONDARY_ITEMS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="inline-flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs font-medium text-fg transition-colors hover:bg-surface-contrast"
                  onClick={() => handleConnectionSelect(item.subTool)}
                >
                  <RelationIcon value={item.subTool.status} />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 메인 툴바 */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-white px-4 py-3 shadow-md">
        {TOOL_GROUPS.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <div className="mx-1 h-12 w-px bg-border" />}
            {group.map((tool) => {
              const Icon = tool.icon;
              const isMenuOpen =
                (tool.mode === ToolMode.Create_Subject_Tool &&
                  openMenu === 'subject') ||
                (tool.mode === ToolMode.Create_Connection_Tool &&
                  openMenu === 'connection');
              const isActive = toolMode === tool.mode || isMenuOpen;
              return (
                <SimpleTooltip key={tool.mode} content={tool.label}>
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-surface-contrast'
                        : 'text-fg hover:bg-surface-contrast'
                    }`}
                    onClick={() => handleToolClick(tool.mode)}
                    aria-pressed={isActive}
                  >
                    <Icon size={24} />
                  </button>
                </SimpleTooltip>
              );
            })}
          </React.Fragment>
        ))}

        {/* 액션 그룹 */}
        <div className="mx-1 h-12 w-px bg-border" />
        <SimpleTooltip content="태그">
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium text-fg transition-colors hover:bg-surface-contrast"
          >
            <Tag size={18} />
          </button>
        </SimpleTooltip>
        <SimpleTooltip content="삭제">
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onDelete}
            disabled={!hasSelection}
          >
            <Trash2 size={18} />
          </button>
        </SimpleTooltip>
      </div>
    </div>
  );
};
