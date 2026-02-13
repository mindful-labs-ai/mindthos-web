import React from 'react';

import { Gender } from '@/genogram/core/types/enums';

import { GHOST_NODE_SIZE, GRID_GAP } from '../constants/grid';

interface GhostPreviewProps {
  position: { x: number; y: number };
  zoom?: number;
  subjectCreateMode?: 'person' | 'family' | 'animal';
  gender?: (typeof Gender)[keyof typeof Gender];
}

const STROKE = '#374151';
const FILL = '#ffffff';
const SW = 1.5;
const DASH = '4 3';

/** 성별에 맞는 ghost 도형 SVG 렌더 */
const renderGhostShape = (
  gender: (typeof Gender)[keyof typeof Gender] | undefined,
  S: number
) => {
  const c = S / 2;
  const m = 2;
  const r = c - m;

  switch (gender) {
    case Gender.Female:
    case Gender.Lesbian:
    case Gender.Transgender_Female:
      return (
        <circle
          cx={c}
          cy={c}
          r={r}
          fill={FILL}
          stroke={STROKE}
          strokeWidth={SW}
          strokeDasharray={DASH}
        />
      );

    case Gender.Nonbinary:
      return (
        <>
          <rect
            x={m}
            y={c}
            width={S - m * 2}
            height={c - m}
            fill={FILL}
            stroke={STROKE}
            strokeWidth={SW}
            strokeDasharray={DASH}
          />
          <path
            d={`M ${m},${c} A ${r},${r} 0 0 1 ${S - m},${c}`}
            fill={FILL}
            stroke={STROKE}
            strokeWidth={SW}
            strokeDasharray={DASH}
          />
          <line
            x1={m + SW / 2}
            y1={c}
            x2={S - m - SW / 2}
            y2={c}
            stroke={FILL}
            strokeWidth={SW + 0.5}
          />
        </>
      );

    case Gender.Male:
    case Gender.Gay:
    case Gender.Transgender_Male:
    default:
      return (
        <rect
          x={m}
          y={m}
          width={S - m * 2}
          height={S - m * 2}
          fill={FILL}
          stroke={STROKE}
          strokeWidth={SW}
          strokeDasharray={DASH}
          rx="2"
        />
      );
  }
};

/** 반려동물 다이아몬드 ghost */
const renderAnimalGhost = (S: number) => {
  const c = S / 2;
  const m = 2;
  return (
    <polygon
      points={`${c},${m} ${S - m},${c} ${c},${S - m} ${m},${c}`}
      fill={FILL}
      stroke={STROKE}
      strokeWidth={SW}
      strokeDasharray={DASH}
    />
  );
};

/** CreateNode 모드에서 마우스를 따라다니는 미리보기 */
export const GhostPreview: React.FC<GhostPreviewProps> = ({
  position,
  zoom = 1,
  subjectCreateMode = 'person',
  gender,
}) => {
  const S = GHOST_NODE_SIZE;
  const scaledSize = S * zoom;

  // family: 3개 노드 미리보기
  if (subjectCreateMode === 'family') {
    const gap = GRID_GAP * zoom;
    // 클릭 위치 기준 오프셋 (flow 좌표 기준 3칸/2칸이지만, screen 좌표로 변환)
    const fatherDx = -3 * gap;
    const fatherDy = -2 * gap;
    const motherDx = 3 * gap;
    const motherDy = -2 * gap;
    const childDx = 0;
    const childDy = 3 * gap;

    return (
      <div
        className="pointer-events-none absolute z-20"
        style={{ left: 0, top: 0 }}
      >
        {/* 아버지 (사각형) */}
        <svg
          className="absolute"
          width={scaledSize}
          height={scaledSize}
          viewBox={`0 0 ${S} ${S}`}
          opacity={0.5}
          style={{
            left: position.x + fatherDx - scaledSize / 2,
            top: position.y + fatherDy - scaledSize / 2,
          }}
        >
          {renderGhostShape(Gender.Male, S)}
        </svg>
        {/* 어머니 (원) */}
        <svg
          className="absolute"
          width={scaledSize}
          height={scaledSize}
          viewBox={`0 0 ${S} ${S}`}
          opacity={0.5}
          style={{
            left: position.x + motherDx - scaledSize / 2,
            top: position.y + motherDy - scaledSize / 2,
          }}
        >
          {renderGhostShape(Gender.Female, S)}
        </svg>
        {/* 자녀 (사각형) */}
        <svg
          className="absolute"
          width={scaledSize}
          height={scaledSize}
          viewBox={`0 0 ${S} ${S}`}
          opacity={0.5}
          style={{
            left: position.x + childDx - scaledSize / 2,
            top: position.y + childDy - scaledSize / 2,
          }}
        >
          {renderGhostShape(Gender.Male, S)}
        </svg>
      </div>
    );
  }

  // animal 또는 person
  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left: position.x - scaledSize / 2,
        top: position.y - scaledSize / 2,
      }}
    >
      <svg
        width={scaledSize}
        height={scaledSize}
        viewBox={`0 0 ${S} ${S}`}
        opacity={0.5}
      >
        {subjectCreateMode === 'animal'
          ? renderAnimalGhost(S)
          : renderGhostShape(gender, S)}
      </svg>
    </div>
  );
};
