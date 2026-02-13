import React from 'react';

import { ParentChildStatus } from '@/genogram/core/types/enums';

const S = 32;
const RS = 24;
const sw = 2;
const stroke = '#374151';
const fill = '#ffffff';
const c = S / 2;

// 공통 레이아웃 상수 (32×32 비율)
const m = 3; // 상단 마진
const topY = m;
const midY = S * 0.45; // 수직선 끝 (≈14.4)
const symbolY = S * 0.56; // 심볼 중심 Y (≈18)
const boxR = 7; // 사각·원 반지름
const xR = 6; // X자 반지름
const circleR = 6; // 유산 원 반지름
const twinSpread = 8; // 쌍둥이 좌우 간격
const twinSymR = 5.5; // 쌍둥이 심볼 반지름
const twinY = S * 0.72; // 쌍둥이 심볼 Y (≈23)
const dualGap = 2.5; // 입양 이중선 간격

/**
 * 부모-자녀선 상태별 미니 SVG 아이콘 (드롭다운용)
 * 수직선 + 하단 심볼로 상태를 표현.
 */
export const ParentChildIcon: React.FC<{ value: string }> = ({ value }) => {
  const renderShape = () => {
    switch (value) {
      // 친자녀
      case ParentChildStatus.Biological_Child:
        return (
          <>
            <line
              x1={c}
              y1={topY}
              x2={c}
              y2={midY}
              stroke={stroke}
              strokeWidth={sw}
            />
            <rect
              x={c - boxR}
              y={symbolY - boxR}
              width={boxR * 2}
              height={boxR * 2}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
              rx="1"
            />
          </>
        );

      // 유산
      case ParentChildStatus.Miscarriage:
        return (
          <>
            <line
              x1={c}
              y1={topY}
              x2={c}
              y2={symbolY - circleR}
              stroke={stroke}
              strokeWidth={sw}
            />
            <circle
              cx={c}
              cy={symbolY}
              r={circleR}
              fill={stroke}
              stroke={stroke}
              strokeWidth={sw}
            />
          </>
        );

      // 낙태
      case ParentChildStatus.Abortion:
        return (
          <>
            <line
              x1={c}
              y1={topY}
              x2={c}
              y2={symbolY - xR + 5}
              stroke={stroke}
              strokeWidth={sw}
            />
            <line
              x1={c - xR}
              y1={symbolY - xR}
              x2={c + xR}
              y2={symbolY + xR}
              stroke={stroke}
              strokeWidth={sw}
            />
            <line
              x1={c + xR}
              y1={symbolY - xR}
              x2={c - xR}
              y2={symbolY + xR}
              stroke={stroke}
              strokeWidth={sw}
            />
          </>
        );

      // 임신
      case ParentChildStatus.Pregnancy: {
        const side = S * 0.65;
        const h = (side * Math.sqrt(3)) / 2;
        const triCy = symbolY + 2;
        return (
          <>
            <line
              x1={c}
              y1={topY}
              x2={c}
              y2={triCy - h / 2}
              stroke={stroke}
              strokeWidth={sw}
            />
            <polygon
              points={`${c},${triCy - h / 2} ${c + side / 2},${triCy + h / 2} ${c - side / 2},${triCy + h / 2}`}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
              strokeLinejoin="round"
            />
          </>
        );
      }

      // 쌍둥이
      case ParentChildStatus.Twins: {
        const childL = c - twinSpread;
        const childR = c + twinSpread;
        return (
          <>
            <line
              x1={c}
              y1={topY}
              x2={childL}
              y2={twinY}
              stroke={stroke}
              strokeWidth={sw}
            />
            <line
              x1={c}
              y1={topY}
              x2={childR}
              y2={twinY}
              stroke={stroke}
              strokeWidth={sw}
            />
            <rect
              x={childL - twinSymR}
              y={twinY - twinSymR}
              width={twinSymR * 2}
              height={twinSymR * 2}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
              rx="1"
            />
            <circle
              cx={childR}
              cy={twinY}
              r={twinSymR}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
          </>
        );
      }

      // 일란성 쌍둥이
      case ParentChildStatus.Identical_Twins: {
        const childL = c - twinSpread;
        const childR = c + twinSpread;
        const barY = (topY + twinY) / 2;
        return (
          <>
            <line
              x1={c}
              y1={topY}
              x2={childL}
              y2={twinY}
              stroke={stroke}
              strokeWidth={sw}
            />
            <line
              x1={c}
              y1={topY}
              x2={childR}
              y2={twinY}
              stroke={stroke}
              strokeWidth={sw}
            />
            <rect
              x={childL - twinSymR}
              y={twinY - twinSymR}
              width={twinSymR * 2}
              height={twinSymR * 2}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
              rx="1"
            />
            <circle
              cx={childR}
              cy={twinY}
              r={twinSymR}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
            <line
              x1={childL + 4}
              y1={barY}
              x2={childR - 4}
              y2={barY}
              stroke={stroke}
              strokeWidth={sw}
            />
          </>
        );
      }

      // 입양자녀
      case ParentChildStatus.Adopted_Child:
        return (
          <>
            <line
              x1={c - dualGap}
              y1={topY}
              x2={c - dualGap}
              y2={midY}
              stroke={stroke}
              strokeWidth={sw}
            />
            <line
              x1={c + dualGap}
              y1={topY}
              x2={c + dualGap}
              y2={midY}
              stroke={stroke}
              strokeDasharray="3,2"
              strokeWidth={sw}
            />
            <rect
              x={c - boxR}
              y={symbolY - boxR}
              width={boxR * 2}
              height={boxR * 2}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
              rx="1"
            />
          </>
        );

      // 위탁자녀
      case ParentChildStatus.Foster_Child:
        return (
          <>
            <line
              x1={c}
              y1={topY}
              x2={c}
              y2={midY}
              stroke={stroke}
              strokeDasharray="3,2"
              strokeWidth={sw}
            />
            <rect
              x={c - boxR}
              y={symbolY - boxR}
              width={boxR * 2}
              height={boxR * 2}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
              rx="1"
            />
          </>
        );

      default:
        return (
          <>
            <line
              x1={c}
              y1={topY}
              x2={c}
              y2={midY}
              stroke={stroke}
              strokeWidth={sw}
            />
            <rect
              x={c - boxR}
              y={symbolY - boxR}
              width={boxR * 2}
              height={boxR * 2}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
              rx="1"
            />
          </>
        );
    }
  };

  return (
    <svg width={RS} height={RS} viewBox={`0 0 ${S} ${S}`} className="shrink-0">
      {renderShape()}
    </svg>
  );
};
