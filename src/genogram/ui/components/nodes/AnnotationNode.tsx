import { memo } from 'react';

import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface AnnotationNodeData {
  annotationId: string;
  text: string;
  bgColor: string;
  textColor: string;
  borderStyle: string;
  borderColor: string;
  isSelected: boolean;
  [key: string]: unknown;
}

const MIN_WIDTH = 80;
const MIN_HEIGHT = 32;
const TEXT_FONT_SIZE = 13;
const TEXT_LINE_HEIGHT = 1.4;

export const AnnotationNode = memo(
  ({ data, selected }: NodeProps & { data: AnnotationNodeData }) => {
    const { text, bgColor, textColor, borderStyle, borderColor, isSelected } =
      data;

    const active = selected || isSelected;

    return (
      <div
        className="annotation-node"
        style={{
          minWidth: MIN_WIDTH,
          minHeight: MIN_HEIGHT,
          backgroundColor: bgColor,
          color: textColor,
          border: `2px ${borderStyle} ${borderColor}`,
          borderRadius: 8,
          padding: '8px 12px',
          boxShadow: active
            ? `0 0 0 2px ${borderColor}40`
            : '0 1px 3px rgba(0,0,0,0.1)',
          cursor: 'grab',
          userSelect: 'none',
          maxWidth: 300,
          wordBreak: 'break-word',
        }}
      >
        <div
          style={{
            fontSize: TEXT_FONT_SIZE,
            lineHeight: TEXT_LINE_HEIGHT,
            whiteSpace: 'pre-wrap',
          }}
        >
          {text || '\u00A0'}
        </div>

        {/* 드래그/연결용 핸들 (투명) */}
        <Handle
          type="source"
          position={Position.Top}
          id="center-source"
          style={{ opacity: 0, pointerEvents: 'none' }}
        />
        <Handle
          type="target"
          position={Position.Top}
          id="center-target"
          style={{ opacity: 0, pointerEvents: 'none' }}
        />
      </div>
    );
  }
);

AnnotationNode.displayName = 'AnnotationNode';
