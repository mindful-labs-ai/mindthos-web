import { memo } from 'react';

import type { NodeProps } from '@xyflow/react';

import { Gender, SubjectType } from '@/genogram/core/types/enums';

import { DEFAULT_NODE_SIZE } from '../../constants/grid';

export interface PersonNodeData {
  name: string | null;
  gender?: (typeof Gender)[keyof typeof Gender];
  subjectType?: (typeof SubjectType)[keyof typeof SubjectType];
  age?: number | null;
  isDead?: boolean;
  isSelected?: boolean;
  lifeSpanLabel?: string | null;
  detailTexts?: string[];
  sizePx?: number;
  [key: string]: unknown;
}

const COLORS = {
  stroke: '#374151',
  fill: '#ffffff',
  selected: '#374151',
  deceased: '#6b7280',
  text: '#1f2937',
  selectedHalo: 'rgba(34, 197, 94, 0.12)',
};

export const PersonNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as PersonNodeData;
  const { name, gender, subjectType, age, isDead, lifeSpanLabel, detailTexts } =
    nodeData;
  const S = nodeData.sizePx ?? DEFAULT_NODE_SIZE;
  const haloSize = S + 48;
  const strokeColor = selected ? COLORS.selected : COLORS.stroke;
  const strokeWidth = 1.5;

  const renderShape = () => {
    const c = S / 2; // 중심
    const m = 2; // 여백
    const r = c - m; // 원 반지름
    const innerScale = 0.65; // 내부 심볼 크기 비율

    // Animal: 다이아몬드 (마름모)
    if (subjectType === SubjectType.Animal) {
      return (
        <polygon
          points={`${c},${m} ${S - m},${c} ${c},${S - m} ${m},${c}`}
          fill={COLORS.fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    }

    switch (gender) {
      case Gender.남성:
        // 남성: 사각형
        return (
          <rect
            x={m}
            y={m}
            width={S - m * 2}
            height={S - m * 2}
            fill={COLORS.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="2"
          />
        );

      case Gender.여성:
        // 여성: 원
        return (
          <circle
            cx={c}
            cy={c}
            r={r}
            fill={COLORS.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );

      case Gender.게이: {
        // 게이: 사각형 + 정삼각형 (꼭짓점 위)
        const triH = S * (innerScale * 0.8);
        const triW = triH * (2 / Math.sqrt(3));
        const innerPosition = 1;

        return (
          <>
            <rect
              x={m}
              y={m}
              width={S - m * 2}
              height={S - m * 2}
              fill={COLORS.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              rx="2"
            />
            <polygon
              points={`${c},${c + triH / 2 + innerPosition} ${c + triW / 2},${c - triH / 2 + innerPosition} ${c - triW / 2},${c - triH / 2 + innerPosition}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </>
        );
      }

      case Gender.레즈비언: {
        // 레즈비언: 원 + 정삼각형 (꼭짓점 아래)
        const triH = S * (innerScale * 0.8);
        const triW = triH * (2 / Math.sqrt(3));
        const innerPosition = 2.5;

        return (
          <>
            <circle
              cx={c}
              cy={c}
              r={r}
              fill={COLORS.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <polygon
              points={`${c},${c + triH / 2 + innerPosition} ${c + triW / 2},${c - triH / 2 + innerPosition} ${c - triW / 2},${c - triH / 2 + innerPosition}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </>
        );
      }

      case Gender.트랜스젠더_남성: {
        // 트랜스남성: 사각형 + 내부 원
        const innerR = S * innerScale * 0.5;
        return (
          <>
            <rect
              x={m}
              y={m}
              width={S - m * 2}
              height={S - m * 2}
              fill={COLORS.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              rx="2"
            />
            <circle
              cx={c}
              cy={c}
              r={innerR}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </>
        );
      }

      case Gender.트랜스젠더_여성: {
        // 트랜스여성: 원 + 내부 사각형
        const innerHalf = S * innerScale * 0.45;
        return (
          <>
            <circle
              cx={c}
              cy={c}
              r={r}
              fill={COLORS.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <rect
              x={c - innerHalf}
              y={c - innerHalf}
              width={innerHalf * 2}
              height={innerHalf * 2}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              rx="1"
            />
          </>
        );
      }

      case Gender.논바이너리:
        // 논바이너리: 상단 반원 + 하단 사각형 조합
        return (
          <>
            {/* 하단 사각형 */}
            <rect
              x={m}
              y={c}
              width={S - m * 2}
              height={c - m}
              fill={COLORS.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* 상단 반원 (아래 직선은 사각형 상단과 겹침) */}
            <path
              d={`M ${m},${c} A ${r},${r} 0 0 1 ${S - m},${c}`}
              fill={COLORS.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* 사각형 상단의 stroke를 덮어서 연결부 매끄럽게 */}
            <line
              x1={m + strokeWidth / 2}
              y1={c}
              x2={S - m - strokeWidth / 2}
              y2={c}
              stroke={COLORS.fill}
              strokeWidth={strokeWidth + 0.5}
            />
          </>
        );

      default:
        // 미지정: ? 표시 원
        return (
          <>
            <circle
              cx={c}
              cy={c}
              r={r}
              fill={COLORS.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <text
              x={c}
              y={c + 5}
              textAnchor="middle"
              fontSize="18"
              fill={COLORS.text}
            >
              ?
            </text>
          </>
        );
    }
  };

  const renderDeceased = () => {
    if (!isDead) return null;
    return (
      <g stroke={COLORS.deceased} strokeWidth="2">
        <line x1="8" y1="8" x2={S - 8} y2={S - 8} />
        <line x1={S - 8} y1="8" x2="8" y2={S - 8} />
      </g>
    );
  };

  const hasDetail = detailTexts && detailTexts.length > 0;
  const haloOffset = (haloSize - S) / 2;

  return (
    <div className="relative">
      {/* 선택 시 초록색 반투명 원 배경 */}
      {selected && (
        <div
          className="absolute -z-10 rounded-full"
          style={{
            width: haloSize,
            height: haloSize,
            top: -haloOffset,
            left: -haloOffset,
            backgroundColor: COLORS.selectedHalo,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 상단: 생몰연도 */}
      {lifeSpanLabel && (
        <div
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-[10px] text-fg"
          style={{ bottom: S + 2 }}
        >
          {lifeSpanLabel}
        </div>
      )}

      {/* 노드 모양 */}
      <svg
        width={S}
        height={S}
        viewBox={`0 0 ${S} ${S}`}
        className="cursor-pointer"
      >
        {renderShape()}
        {renderDeceased()}
      </svg>

      {/* 중앙: 나이 숫자 */}
      {age != null && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span
            className="text-xs font-bold"
            style={{
              color: COLORS.text,
              textShadow:
                '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 -1px 0 #fff, 0 1px 0 #fff, -1px 0 0 #fff, 1px 0 0 #fff',
            }}
          >
            {age}
          </span>
        </div>
      )}

      {/* 오른쪽: 상세정보 */}
      {hasDetail && (
        <div
          className="absolute top-0 whitespace-nowrap text-xs text-fg-muted"
          style={{ left: S + 8 }}
        >
          {detailTexts.map((text) => (
            <div key={text}>{text}</div>
          ))}
        </div>
      )}

      {/* 아래: 이름 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-xs font-medium text-fg"
        style={{ top: S + 4 }}
      >
        {name}
      </div>
    </div>
  );
});

PersonNode.displayName = 'PersonNode';
