import React from 'react';

import { Illness } from '@/genogram/core/types/enums';

const S = 20;
const m = 1.5;
const sw = 1.2;
const stroke = '#374151';
const fill = '#ffffff';

/**
 * 임상적 상태 미니 SVG 아이콘 (드롭다운용)
 *
 * 패턴 규칙 (가계도 표준):
 * - 없음: 빈 사각형
 * - 심리적/신체적 문제: 아래쪽 반 채움
 * - 알코올/약물 남용: 아래쪽 반 대각선 해칭
 * - 알코올/약물 남용 의심: 아래쪽 반 점선 해칭
 * - 완화된 심리적/신체적 문제: 아래쪽 반 채움 + 좌우 화살표(또는 줄)
 * - 완화된 알코올/약물 + 심리적/신체적: 위 채움 + 아래 해칭 + 줄
 * - 알코올/약물 회복 중: 아래 해칭 + X
 * - 심각한 전부: 전체 채움
 * - 심각한 회복 중: 전체 채움 + X
 */
export const IllnessIcon: React.FC<{ value: string }> = ({ value }) => {
  const uid = `cs-${value.replace(/[^a-zA-Z가-힣]/g, '').slice(0, 8)}`;

  const renderPattern = () => {
    switch (value) {
      case Illness.None:
        // 빈 사각형
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

      case Illness.Psychological_Or_Physical_Problem:
        // 아래쪽 반 채움
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
            <rect
              x={m}
              y={S / 2}
              width={S - m * 2}
              height={S / 2 - m}
              fill={stroke}
              clipPath={`url(#${uid}-clip)`}
            />
            <clipPath id={`${uid}-clip`}>
              <rect x={m} y={m} width={S - m * 2} height={S - m * 2} rx="1" />
            </clipPath>
          </>
        );

      case Illness.Alcohol_Or_Drug_Abuse:
        // 아래쪽 반 대각선 해칭
        return (
          <>
            <defs>
              <pattern
                id={`${uid}-hatch`}
                width="4"
                height="4"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="4"
                  stroke={stroke}
                  strokeWidth="1.2"
                />
              </pattern>
              <clipPath id={`${uid}-clip`}>
                <rect
                  x={m}
                  y={m}
                  width={S - m * 2}
                  height={S - m * 2}
                  rx="1"
                />
              </clipPath>
            </defs>
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
            <rect
              x={m}
              y={S / 2}
              width={S - m * 2}
              height={S / 2 - m}
              fill={`url(#${uid}-hatch)`}
              clipPath={`url(#${uid}-clip)`}
            />
          </>
        );

      case Illness.Suspected_Alcohol_Or_Drug_Abuse:
        // 아래쪽 반 점선 해칭 (희미한)
        return (
          <>
            <defs>
              <pattern
                id={`${uid}-hatch`}
                width="4"
                height="4"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="4"
                  stroke={stroke}
                  strokeWidth="0.8"
                  strokeDasharray="1.5 1.5"
                />
              </pattern>
              <clipPath id={`${uid}-clip`}>
                <rect
                  x={m}
                  y={m}
                  width={S - m * 2}
                  height={S - m * 2}
                  rx="1"
                />
              </clipPath>
            </defs>
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
            <rect
              x={m}
              y={S / 2}
              width={S - m * 2}
              height={S / 2 - m}
              fill={`url(#${uid}-hatch)`}
              clipPath={`url(#${uid}-clip)`}
            />
          </>
        );

      case Illness.Psychological_Or_Physical_Illness_In_Remission:
        // 아래쪽 반 채움 + 가운데 가로선 (완화 표시)
        return (
          <>
            <defs>
              <clipPath id={`${uid}-clip`}>
                <rect
                  x={m}
                  y={m}
                  width={S - m * 2}
                  height={S - m * 2}
                  rx="1"
                />
              </clipPath>
            </defs>
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
            <rect
              x={m}
              y={S / 2}
              width={S - m * 2}
              height={S / 2 - m}
              fill={stroke}
              clipPath={`url(#${uid}-clip)`}
            />
            <line
              x1="0"
              y1={S / 2}
              x2={S}
              y2={S / 2}
              stroke={fill}
              strokeWidth="2"
            />
          </>
        );

      case Illness.In_Recovery_From_Substance_Abuse_But_Having_Physical_Or_Mental_Problems:
        // 위 채움 + 아래 해칭 + 가로선
        return (
          <>
            <defs>
              <pattern
                id={`${uid}-hatch`}
                width="4"
                height="4"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="4"
                  stroke={stroke}
                  strokeWidth="1.2"
                />
              </pattern>
              <clipPath id={`${uid}-clip`}>
                <rect
                  x={m}
                  y={m}
                  width={S - m * 2}
                  height={S - m * 2}
                  rx="1"
                />
              </clipPath>
            </defs>
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
            <rect
              x={m}
              y={m}
              width={S - m * 2}
              height={S / 2 - m}
              fill={stroke}
              clipPath={`url(#${uid}-clip)`}
            />
            <rect
              x={m}
              y={S / 2}
              width={S - m * 2}
              height={S / 2 - m}
              fill={`url(#${uid}-hatch)`}
              clipPath={`url(#${uid}-clip)`}
            />
            <line
              x1="0"
              y1={S / 2}
              x2={S}
              y2={S / 2}
              stroke={fill}
              strokeWidth="2"
            />
          </>
        );

      case Illness.In_Recovery_From_Substance_Abuse:
        // 아래 해칭 + X 표시
        return (
          <>
            <defs>
              <pattern
                id={`${uid}-hatch`}
                width="4"
                height="4"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="4"
                  stroke={stroke}
                  strokeWidth="1.2"
                />
              </pattern>
              <clipPath id={`${uid}-clip`}>
                <rect
                  x={m}
                  y={m}
                  width={S - m * 2}
                  height={S - m * 2}
                  rx="1"
                />
              </clipPath>
            </defs>
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
            <rect
              x={m}
              y={S / 2}
              width={S - m * 2}
              height={S / 2 - m}
              fill={`url(#${uid}-hatch)`}
              clipPath={`url(#${uid}-clip)`}
            />
            <g stroke={stroke} strokeWidth="1.5">
              <line x1="5" y1="5" x2={S - 5} y2={S - 5} />
              <line x1={S - 5} y1="5" x2="5" y2={S - 5} />
            </g>
          </>
        );

      case Illness.Serious_Mental_Or_Physical_Problems_And_Substance_Abuse:
        // 전체 채움
        return (
          <rect
            x={m}
            y={m}
            width={S - m * 2}
            height={S - m * 2}
            fill={stroke}
            stroke={stroke}
            strokeWidth={sw}
            rx="1"
          />
        );

      case Illness.In_Recovery_From_Substance_Abuse_And_Physical_Or_Mental_Problems:
        // 전체 채움 + X
        return (
          <>
            <rect
              x={m}
              y={m}
              width={S - m * 2}
              height={S - m * 2}
              fill={stroke}
              stroke={stroke}
              strokeWidth={sw}
              rx="1"
            />
            <g stroke={fill} strokeWidth="1.5">
              <line x1="5" y1="5" x2={S - 5} y2={S - 5} />
              <line x1={S - 5} y1="5" x2="5" y2={S - 5} />
            </g>
          </>
        );

      default:
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
    }
  };

  return (
    <svg
      width={S}
      height={S}
      viewBox={`0 0 ${S} ${S}`}
      className="shrink-0"
    >
      {renderPattern()}
    </svg>
  );
};
