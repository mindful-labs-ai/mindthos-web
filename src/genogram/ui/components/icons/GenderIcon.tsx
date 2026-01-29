import React from 'react';

import { Gender, SubjectType } from '@/genogram/core/types/enums';

const S = 32; // viewBox 크기
const RS = 24; // 렌더링 크기
const c = S / 2;
const m = 1.5;
const r = c - m;
const sw = 2; // strokeWidth
const stroke = '#374151';
const fill = '#ffffff';

/** 성별/타입별 미니 SVG 아이콘 (드롭다운용) */
export const GenderIcon: React.FC<{ value: string }> = ({ value }) => {
  const innerScale = 0.65;

  const renderShape = () => {
    if (value === SubjectType.Animal) {
      // 반려동물: 다이아몬드
      return (
        <polygon
          points={`${c},${m} ${S - m},${c} ${c},${S - m} ${m},${c}`}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      );
    }

    switch (value) {
      case Gender.Male:
        return (
          <rect
            x={m}
            y={m}
            width={S - m * 2}
            height={S - m * 2}
            fill={fill}
            stroke={stroke}
            strokeWidth={sw}
            rx="1"
          />
        );

      case Gender.Female:
        return (
          <circle
            cx={c}
            cy={c}
            r={r}
            fill={fill}
            stroke={stroke}
            strokeWidth={sw}
          />
        );

      case Gender.Gay: {
        const triH = S * (innerScale * 0.8);
        const triW = triH * (2 / Math.sqrt(3));
        const offset = 0.5;
        return (
          <>
            <rect
              x={m}
              y={m}
              width={S - m * 2}
              height={S - m * 2}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
              rx="1"
            />
            <polygon
              points={`${c},${c + triH / 2 + offset} ${c + triW / 2},${c - triH / 2 + offset} ${c - triW / 2},${c - triH / 2 + offset}`}
              fill="none"
              stroke={stroke}
              strokeWidth={sw}
            />
          </>
        );
      }

      case Gender.Lesbian: {
        const triH = S * (innerScale * 0.8);
        const triW = triH * (2 / Math.sqrt(3));
        const offset = 1;
        return (
          <>
            <circle
              cx={c}
              cy={c}
              r={r}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
            <polygon
              points={`${c},${c + triH / 2 + offset} ${c + triW / 2},${c - triH / 2 + offset} ${c - triW / 2},${c - triH / 2 + offset}`}
              fill="none"
              stroke={stroke}
              strokeWidth={sw}
            />
          </>
        );
      }

      case Gender.Transgender_Male: {
        const innerR = S * innerScale * 0.5;
        return (
          <>
            <rect
              x={m}
              y={m}
              width={S - m * 2}
              height={S - m * 2}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
              rx="1"
            />
            <circle
              cx={c}
              cy={c}
              r={innerR}
              fill="none"
              stroke={stroke}
              strokeWidth={sw}
            />
          </>
        );
      }

      case Gender.Transgender_Female: {
        const innerHalf = S * innerScale * 0.45;
        return (
          <>
            <circle
              cx={c}
              cy={c}
              r={r}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
            <rect
              x={c - innerHalf}
              y={c - innerHalf}
              width={innerHalf * 2}
              height={innerHalf * 2}
              fill="none"
              stroke={stroke}
              strokeWidth={sw}
              rx="0.5"
            />
          </>
        );
      }

      case Gender.Nonbinary:
        return (
          <>
            <rect
              x={m}
              y={c}
              width={S - m * 2}
              height={c - m}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
            <path
              d={`M ${m},${c} A ${r},${r} 0 0 1 ${S - m},${c}`}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
            <line
              x1={m + sw / 2}
              y1={c}
              x2={S - m - sw / 2}
              y2={c}
              stroke={fill}
              strokeWidth={sw + 0.3}
            />
          </>
        );

      default:
        return (
          <circle
            cx={c}
            cy={c}
            r={r}
            fill={fill}
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
