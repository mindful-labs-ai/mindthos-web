import React from 'react';

import { InfluenceStatus, RelationStatus } from '@/genogram/core/types/enums';

const S = 32;
const RS = 24;
const sw = 2;
const sw2 = 1.5;
const stroke = '#374151';
const m = 4; // margin
const lineY = S / 2;

// 대각선 공통 상수
const P = 0.707; // 1/√2
const SX = m;
const SY = S - m;
const EX = S - m;
const EY = m;

// 화살표 공통 상수
const ARROW_LEN = 8;
const ARROW_W = 5;
const ABX = EX - ARROW_LEN * P;
const ABY = EY + ARROW_LEN * P;
const ARROW_PTS = `${EX},${EY} ${ABX + ARROW_W * P},${ABY + ARROW_W * P} ${ABX - ARROW_W * P},${ABY - ARROW_W * P}`;

/** 대각선 지그재그 points 문자열 생성 */
const zigzag = (amp: number, steps = 6): string => {
  const pts: string[] = [`${SX},${SY}`];
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const bx = SX + (EX - SX) * t;
    const by = SY + (EY - SY) * t;
    const sign = i % 2 === 1 ? 1 : -1;
    pts.push(`${bx + sign * amp * P},${by + sign * amp * P}`);
  }
  pts.push(`${EX},${EY}`);
  return pts.join(' ');
};

/** 대각선 직선 */
const DiagLine: React.FC<{ offset?: number }> = ({ offset = 0 }) => (
  <line
    x1={SX - offset * P}
    y1={SY - offset * P}
    x2={EX - offset * P}
    y2={EY - offset * P}
    stroke={stroke}
    strokeWidth={sw}
    strokeLinecap="round"
  />
);

/** 지그재그 polyline */
const ZigzagLine: React.FC<{ amp?: number }> = ({ amp = 3.5 }) => (
  <polyline
    points={zigzag(amp)}
    fill="none"
    stroke={stroke}
    strokeWidth={sw2}
    strokeLinejoin="round"
  />
);

/** 채워진 화살표 */
const FilledArrow: React.FC = () => (
  <polygon points={ARROW_PTS} fill={stroke} stroke={stroke} strokeWidth={sw2} />
);

/** 빈 화살표 */
const EmptyArrow: React.FC = () => (
  <polygon
    points={ARROW_PTS}
    fill="#ffffff"
    stroke={stroke}
    strokeWidth={sw2}
  />
);

/** 관계선·영향선 상태별 미니 SVG 아이콘 (드롭다운용) */
export const RelationIcon: React.FC<{ value: string }> = ({ value }) => {
  const renderShape = () => {
    switch (value) {
      // ── Relation ──

      // 연결
      case RelationStatus.Connected:
        return <DiagLine />;

      // 친밀
      case RelationStatus.Close:
        return (
          <>
            <DiagLine offset={-2} />
            <DiagLine offset={2} />
          </>
        );

      // 융합
      case RelationStatus.Fused:
        return (
          <>
            <DiagLine offset={-3} />
            <DiagLine />
            <DiagLine offset={3} />
          </>
        );

      // 소원
      case RelationStatus.Distant:
        return (
          <line
            x1={m}
            y1={S - m}
            x2={S - m}
            y2={m}
            stroke={stroke}
            strokeWidth={sw}
            strokeDasharray="3,2"
          />
        );

      // 적대
      case RelationStatus.Hostile:
        return <ZigzagLine />;

      // 친밀-적대
      case RelationStatus.Close_Hostile:
        return (
          <>
            <DiagLine offset={5} />
            <ZigzagLine amp={3} />
            <DiagLine offset={-5} />
          </>
        );

      // 단절
      case RelationStatus.Cutoff: {
        const len = 5;
        const cx = S / 2;
        const cy = S / 2;
        const d = 2;
        return (
          <>
            <DiagLine />
            <line
              x1={cx - d * P - len * P}
              y1={cy + d * P - len * P}
              x2={cx - d * P + len * P}
              y2={cy + d * P + len * P}
              stroke={stroke}
              strokeWidth={sw}
              strokeLinecap="round"
            />
            <line
              x1={cx + d * P - len * P}
              y1={cy - d * P - len * P}
              x2={cx + d * P + len * P}
              y2={cy - d * P + len * P}
              stroke={stroke}
              strokeWidth={sw}
              strokeLinecap="round"
            />
          </>
        );
      }

      // ── Influence ──

      // 신체적 학대: 지그재그 + 채워진 화살표
      case InfluenceStatus.Physical_Abuse:
        return (
          <>
            <ZigzagLine />
            <FilledArrow />
          </>
        );

      // 정신적 학대: 지그재그 + 빈 화살표
      case InfluenceStatus.Emotional_Abuse:
        return (
          <>
            <ZigzagLine />
            <EmptyArrow />
          </>
        );

      // 성적 학대: 양쪽 직선 + 지그재그 + 채워진 화살표
      case InfluenceStatus.Sexual_Abuse:
        return (
          <>
            <DiagLine offset={5} />
            <ZigzagLine />
            <DiagLine offset={-5} />
            <FilledArrow />
          </>
        );

      // 집중됨: 직선 + 채워진 화살표
      case InfluenceStatus.Focused_On:
        return (
          <>
            <DiagLine />
            <FilledArrow />
          </>
        );

      // 부정적 집중됨: 지그재그 + 직선 + 채워진 화살표
      case InfluenceStatus.Focused_On_Negatively:
        return (
          <>
            <ZigzagLine />
            <DiagLine />
            <FilledArrow />
          </>
        );

      default:
        return (
          <line
            x1={m}
            y1={lineY}
            x2={S - m}
            y2={lineY}
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
