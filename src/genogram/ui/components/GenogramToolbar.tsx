import React from 'react';

import {
  BoxSelect,
  MousePointer2,
  Move,
  Slash,
  Square,
  Tag,
  Trash2,
  Type,
} from 'lucide-react';

import { ToolMode } from '@/genogram/core/types/enums';

import { SimpleTooltip } from './common/SimpleTooltip';

type ToolModeValue = (typeof ToolMode)[keyof typeof ToolMode];

interface ToolItem {
  mode: ToolModeValue;
  icon: React.FC<{ size?: number }>;
  label: string;
}

const TOOL_GROUPS: ToolItem[][] = [
  [
    { mode: ToolMode.단일선택도구, icon: MousePointer2, label: '선택' },
    { mode: ToolMode.이동도구, icon: Move, label: '이동' },
    { mode: ToolMode.다중선택도구, icon: BoxSelect, label: '다중 선택' },
  ],
  [
    { mode: ToolMode.인물추가도구, icon: Square, label: '구성원 추가' },
    { mode: ToolMode.관계추가도구, icon: Slash, label: '관계 연결' },
    { mode: ToolMode.주석달기도구, icon: Type, label: '텍스트 추가' },
  ],
];

interface GenogramToolbarProps {
  toolMode: ToolModeValue;
  onToolModeChange: (mode: ToolModeValue) => void;
  onDelete: () => void;
  hasSelection: boolean;
}

export const GenogramToolbar: React.FC<GenogramToolbarProps> = ({
  toolMode,
  onToolModeChange,
  onDelete,
  hasSelection,
}) => {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-white px-2 py-1.5 shadow-md">
      {TOOL_GROUPS.map((group, gi) => (
        <React.Fragment key={gi}>
          {gi > 0 && <div className="mx-1 h-6 w-px bg-border" />}
          {group.map((tool) => {
            const Icon = tool.icon;
            const isActive = toolMode === tool.mode;
            return (
              <SimpleTooltip key={tool.mode} content={tool.label}>
                <button
                  type="button"
                  className={`inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-fg hover:bg-surface-contrast'
                  }`}
                  onClick={() => onToolModeChange(tool.mode)}
                  aria-pressed={isActive}
                >
                  <Icon size={18} />
                </button>
              </SimpleTooltip>
            );
          })}
        </React.Fragment>
      ))}

      {/* 액션 그룹 */}
      <div className="mx-1 h-6 w-px bg-border" />
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
  );
};
