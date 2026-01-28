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

import { Button } from '@/components/ui';
import { Tooltip } from '@/components/ui/composites/Tooltip';
import { ToolMode } from '@/genogram/core/types/enums';

type ToolModeValue = (typeof ToolMode)[keyof typeof ToolMode];

interface ToolItem {
  mode: ToolModeValue;
  icon: React.FC<{ size?: number }>;
  label: string;
}

const TOOL_GROUPS: ToolItem[][] = [
  [
    { mode: ToolMode.Select, icon: MousePointer2, label: '선택' },
    { mode: ToolMode.Pan, icon: Move, label: '이동' },
    { mode: ToolMode.MultiSelect, icon: BoxSelect, label: '다중 선택' },
  ],
  [
    { mode: ToolMode.CreateNode, icon: Square, label: '구성원 추가' },
    { mode: ToolMode.Connect, icon: Slash, label: '관계 연결' },
    { mode: ToolMode.CreateText, icon: Type, label: '텍스트 추가' },
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
              <Tooltip key={tool.mode} content={tool.label}>
                <Button
                  size="sm"
                  variant={isActive ? 'soft' : 'ghost'}
                  tone={isActive ? 'primary' : 'neutral'}
                  onClick={() => onToolModeChange(tool.mode)}
                  aria-pressed={isActive}
                >
                  <Icon size={18} />
                </Button>
              </Tooltip>
            );
          })}
        </React.Fragment>
      ))}

      {/* 액션 그룹 */}
      <div className="mx-1 h-6 w-px bg-border" />
      <Tooltip content="태그">
        <Button size="sm" variant="ghost" tone="neutral">
          <Tag size={18} />
        </Button>
      </Tooltip>
      <Tooltip content="삭제">
        <Button
          size="sm"
          variant="ghost"
          tone="danger"
          onClick={onDelete}
          disabled={!hasSelection}
        >
          <Trash2 size={18} />
        </Button>
      </Tooltip>
    </div>
  );
};
