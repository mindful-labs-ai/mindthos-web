import React from 'react';

import { Illness } from '@/genogram/core/types/enums';

const S = 32;
const RS = 24;
const m = 1.5;
const sw = 2;
const c = S / 2;
const stroke = '#374151';
const fill = '#ffffff';

export const IllnessIcon: React.FC<{ value: string }> = ({ value }) => {
  const uid = `cs-${value.replace(/[^a-zA-Z가-힣]/g, '').slice(0, 8)}`;

  // 공통: 외곽 사각형
  const outline = (
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

  // clipPath (사각형 내부로 제한)
  const clipDef = (
    <clipPath id={`${uid}-clip`}>
      <rect x={m} y={m} width={S - m * 2} height={S - m * 2} rx="1" />
    </clipPath>
  );

  const clip = `url(#${uid}-clip)`;

  // 채움 블록들
  const halfLeft = (
    <rect
      x={m}
      y={m}
      width={c - m}
      height={S - m * 2}
      fill={stroke}
      clipPath={clip}
    />
  );
  const halfBottom = (
    <rect
      x={m}
      y={c}
      width={S - m * 2}
      height={c - m}
      fill={stroke}
      clipPath={clip}
    />
  );
  const quarterBottomLeft = (
    <rect
      x={m}
      y={c}
      width={c - m}
      height={c - m}
      fill={stroke}
      clipPath={clip}
    />
  );
  const threeQuarters = (
    <>
      <rect
        x={m}
        y={m}
        width={c - m}
        height={S - m * 2}
        fill={stroke}
        clipPath={clip}
      />
      <rect
        x={c}
        y={c}
        width={c - m}
        height={c - m}
        fill={stroke}
        clipPath={clip}
      />
    </>
  );

  // 해칭
  const hatchDefs = (
    <defs>
      <pattern
        id={`${uid}-hatch`}
        width="4"
        height="4"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line x1="0" y1="0" x2="0" y2="4" stroke={stroke} strokeWidth="2" />
      </pattern>
      {clipDef}
    </defs>
  );
  const halfBottomHatch = (
    <rect
      x={m}
      y={c}
      width={S - m * 2}
      height={c - m}
      fill={`url(#${uid}-hatch)`}
      clipPath={clip}
    />
  );

  // 중앙선
  const vLine = (
    <line
      x1={c}
      y1={0}
      x2={c}
      y2={S}
      stroke={stroke}
      strokeWidth="1"
      clipPath={clip}
    />
  );
  const hLine = (
    <line
      x1={0}
      y1={c}
      x2={S}
      y2={c}
      stroke={stroke}
      strokeWidth="1"
      clipPath={clip}
    />
  );

  const renderPattern = () => {
    switch (value) {
      case Illness.None:
        return outline;

      // 왼쪽 반 채움
      case Illness.Psychological_Or_Physical_Problem:
        return (
          <>
            <defs>{clipDef}</defs>
            {outline}
            {halfLeft}
          </>
        );

      // 아래쪽 반 채움
      case Illness.Alcohol_Or_Drug_Abuse:
        return (
          <>
            <defs>{clipDef}</defs>
            {outline}
            {halfBottom}
          </>
        );

      // 아래쪽 반 빗금 + 가로 중앙선
      case Illness.Suspected_Alcohol_Or_Drug_Abuse:
        return (
          <>
            {hatchDefs}
            {outline}
            {halfBottomHatch}
            {hLine}
          </>
        );

      // 왼쪽 하단 1/4 채움 + 세로 중앙선
      case Illness.Psychological_Or_Physical_Illness_In_Remission:
        return (
          <>
            <defs>{clipDef}</defs>
            {outline}
            {quarterBottomLeft}
            {vLine}
          </>
        );

      // 왼쪽 반 채움 + 가로 중앙선
      case Illness.In_Recovery_From_Substance_Abuse_But_Having_Physical_Or_Mental_Problems:
        return (
          <>
            <defs>{clipDef}</defs>
            {outline}
            {halfLeft}
            {hLine}
          </>
        );

      // 왼쪽 하단 1/4 채움 + 가로 중앙선
      case Illness.In_Recovery_From_Substance_Abuse:
        return (
          <>
            <defs>{clipDef}</defs>
            {outline}
            {quarterBottomLeft}
            {hLine}
          </>
        );

      // 오른쪽 상단 1/4 제외 나머지 채움
      case Illness.Serious_Mental_Or_Physical_Problems_And_Substance_Abuse:
        return (
          <>
            <defs>{clipDef}</defs>
            {outline}
            {threeQuarters}
          </>
        );

      // 왼쪽 하단 1/4 채움 + 가로 중앙선 + 세로 중앙선
      case Illness.In_Recovery_From_Substance_Abuse_And_Physical_Or_Mental_Problems:
        return (
          <>
            <defs>{clipDef}</defs>
            {outline}
            {quarterBottomLeft}
            {hLine}
            {vLine}
          </>
        );

      default:
        return outline;
    }
  };

  return (
    <svg width={RS} height={RS} viewBox={`0 0 ${S} ${S}`} className="shrink-0">
      {renderPattern()}
    </svg>
  );
};
