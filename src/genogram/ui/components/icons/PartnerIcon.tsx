import React from 'react';

import { PartnerStatus } from '@/genogram/core/types/enums';

const S = 32;
const RS = 24;
const sw = 2;
const sw2 = 1.5;
const stroke = '#374151';

/**
 * 파트너선 상태별 미니 SVG 아이콘 (드롭다운용)
 * U자 형태: 좌측 수직 → 하단 수평 → 우측 수직
 */
export const PartnerIcon: React.FC<{ value: string }> = ({ value }) => {
  const top = 10;
  const bottom = 24;
  const left = 1;
  const right = S - 1;
  const midX = S / 2;

  const renderShape = () => {
    switch (value) {
      // 결혼
      case PartnerStatus.Marriage:
        return (
          <path
            d={`M ${left},${top} V ${bottom} H ${right} V ${top}`}
            fill="none"
            stroke={stroke}
            strokeWidth={sw}
          />
        );

      // 별거
      case PartnerStatus.Marital_Separation:
        return (
          <>
            <path
              d={`M ${left},${top} V ${bottom} H ${right} V ${top}`}
              fill="none"
              stroke={stroke}
              strokeWidth={sw}
            />
            <line
              x1={midX - 2}
              y1={bottom + 5}
              x2={midX + 2}
              y2={bottom - 5}
              stroke={stroke}
              strokeWidth={sw2}
            />
          </>
        );

      // 이혼
      case PartnerStatus.Divorce:
        return (
          <>
            <path
              d={`M ${left},${top} V ${bottom} H ${right} V ${top}`}
              fill="none"
              stroke={stroke}
              strokeWidth={sw}
            />
            <line
              x1={midX - 1.5}
              y1={bottom + 5}
              x2={midX + 3.5}
              y2={bottom - 5}
              stroke={stroke}
              strokeWidth={sw2}
            />
            <line
              x1={midX - 5}
              y1={bottom + 5}
              x2={midX}
              y2={bottom - 5}
              stroke={stroke}
              strokeWidth={sw2}
            />
          </>
        );

      // 재결합
      case PartnerStatus.Remarriage:
        return (
          <>
            <path
              d={`M ${left},${top} V ${bottom} H ${right} V ${top}`}
              fill="none"
              stroke={stroke}
              strokeWidth={sw}
            />
            <line
              x1={midX - 5}
              y1={bottom - 5}
              x2={midX + 5}
              y2={bottom + 5}
              stroke={stroke}
              strokeWidth={sw2}
            />
            <line
              x1={midX - 1.5}
              y1={bottom + 5}
              x2={midX + 3.5}
              y2={bottom - 5}
              stroke={stroke}
              strokeWidth={sw2}
            />
            <line
              x1={midX - 5}
              y1={bottom + 5}
              x2={midX}
              y2={bottom - 5}
              stroke={stroke}
              strokeWidth={sw2}
            />
          </>
        );

      // 연애
      case PartnerStatus.Couple_Relationship:
        return (
          <>
            <line
              x1={left}
              y1={top}
              x2={left}
              y2={bottom}
              stroke={stroke}
              strokeWidth={sw}
            />
            <line
              x1={right}
              y1={top}
              x2={right}
              y2={bottom}
              stroke={stroke}
              strokeWidth={sw}
            />
            <line
              x1={left}
              y1={bottom}
              x2={right}
              y2={bottom}
              strokeDasharray="2,2"
              stroke={stroke}
              strokeWidth={sw}
            />
          </>
        );

      // 비밀 연애
      case PartnerStatus.Secret_Affair:
        return (
          <>
            <line
              x1={left}
              y1={top}
              x2={left}
              y2={bottom}
              stroke={stroke}
              strokeWidth={sw}
            />
            <line
              x1={right}
              y1={top}
              x2={right}
              y2={bottom}
              stroke={stroke}
              strokeWidth={sw}
            />
            <line
              x1={left}
              y1={bottom}
              x2={right}
              y2={bottom}
              strokeDasharray="2,2"
              stroke={stroke}
              strokeWidth={sw}
            />
            <polygon
              points={`${midX},${bottom - 8} ${midX + 2.5},${bottom - 3} ${midX - 2.5},${bottom - 3}`}
              fill={stroke}
              stroke={stroke}
              strokeWidth={2}
            />
          </>
        );

      default:
        return (
          <path
            d={`M ${left},${top} V ${bottom} H ${right} V ${top}`}
            fill="none"
            stroke={stroke}
            strokeWidth={sw}
          />
        );
    }
  };

  return (
    <svg width={RS} height={RS} viewBox={`0 0 ${S} ${S}`} className="shrink-0">
      {renderShape()}
    </svg>
  );
};
