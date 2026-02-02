import React, { memo } from 'react';

import { Handle, Position, type NodeProps } from '@xyflow/react';

import {
  DEFAULT_BG,
  DEFAULT_FG,
  SELECTION_HALO,
} from '@/genogram/core/constants/colors';
import {
  FetusStatus,
  Gender,
  Illness,
  SubjectType,
} from '@/genogram/core/types/enums';

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
  illness?: Illness;
  fetusStatus?: (typeof FetusStatus)[keyof typeof FetusStatus];
  sizePx?: number;
  bgColor?: string;
  textColor?: string;
  [key: string]: unknown;
}

const COLORS = {
  stroke: DEFAULT_FG,
  fill: DEFAULT_BG,
  deceased: DEFAULT_FG,
  text: DEFAULT_FG,
  selectedHalo: SELECTION_HALO,
};

/** 태아 타입(유산/낙태/임신 중) SVG 도형 렌더링. 해당하지 않으면 null 반환. */
function renderFetusShape(
  fetusStatus: string | undefined,
  c: number,
  r: number,
  m: number,
  S: number,
  strokeColor: string,
  strokeWidth: number,
  fillColor: string
): React.ReactElement | null {
  switch (fetusStatus) {
    case FetusStatus.Miscarriage:
      return (
        <circle
          cx={c}
          cy={c}
          r={r}
          fill={strokeColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    case FetusStatus.Abortion: {
      const xr = r * 0.8;
      return (
        <>
          <line
            x1={c - xr}
            y1={c - xr}
            x2={c + xr}
            y2={c + xr}
            stroke={strokeColor}
            strokeWidth={strokeWidth * 1.5}
          />
          <line
            x1={c + xr}
            y1={c - xr}
            x2={c - xr}
            y2={c + xr}
            stroke={strokeColor}
            strokeWidth={strokeWidth * 1.5}
          />
        </>
      );
    }
    case FetusStatus.Pregnancy: {
      const side = S - m * 2;
      const h = (side * Math.sqrt(3)) / 2;
      const topY = c - h / 2;
      const bottomY = c + h / 2;
      return (
        <polygon
          points={`${c},${topY} ${c + side / 2},${bottomY} ${c - side / 2},${bottomY}`}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      );
    }
    default:
      return null;
  }
}

export const PersonNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as PersonNodeData;
  const {
    name,
    gender,
    subjectType,
    age,
    isDead,
    illness,
    lifeSpanLabel,
    detailTexts,
  } = nodeData;
  const S = nodeData.sizePx ?? DEFAULT_NODE_SIZE;
  const haloSize = S + 48;
  const fillColor = nodeData.bgColor || COLORS.fill;
  const textColor = nodeData.textColor || COLORS.text;
  const strokeColor = COLORS.stroke;
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
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    }

    // 태아 (유산/낙태/임신 중)
    if (subjectType === SubjectType.Fetus) {
      const fetusShape = renderFetusShape(
        nodeData.fetusStatus,
        c,
        r,
        m,
        S,
        strokeColor,
        strokeWidth,
        fillColor
      );
      if (fetusShape) return fetusShape;
    }

    switch (gender) {
      case Gender.Male:
        // 남성: 사각형
        return (
          <rect
            x={m}
            y={m}
            width={S - m * 2}
            height={S - m * 2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="2"
          />
        );

      case Gender.Female:
        // 여성: 원
        return (
          <circle
            cx={c}
            cy={c}
            r={r}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );

      case Gender.Gay: {
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
              fill={fillColor}
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

      case Gender.Lesbian: {
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
              fill={fillColor}
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

      case Gender.Transgender_Male: {
        // 트랜스남성: 사각형 + 내부 원
        const innerR = S * innerScale * 0.5;
        return (
          <>
            <rect
              x={m}
              y={m}
              width={S - m * 2}
              height={S - m * 2}
              fill={fillColor}
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

      case Gender.Transgender_Female: {
        // 트랜스여성: 원 + 내부 사각형
        const innerHalf = S * innerScale * 0.45;
        return (
          <>
            <circle
              cx={c}
              cy={c}
              r={r}
              fill={fillColor}
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

      case Gender.Nonbinary:
        // 논바이너리: 상단 반원 + 하단 사각형 조합
        return (
          <>
            {/* 하단 사각형 */}
            <rect
              x={m}
              y={c}
              width={S - m * 2}
              height={c - m}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* 상단 반원 (아래 직선은 사각형 상단과 겹침) */}
            <path
              d={`M ${m},${c} A ${r},${r} 0 0 1 ${S - m},${c}`}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* 사각형 상단의 stroke를 덮어서 연결부 매끄럽게 */}
            <line
              x1={m + strokeWidth / 2}
              y1={c}
              x2={S - m - strokeWidth / 2}
              y2={c}
              stroke={fillColor}
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
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <text
              x={c}
              y={c + 5}
              textAnchor="middle"
              fontSize="18"
              fill={textColor}
            >
              ?
            </text>
          </>
        );
    }
  };

  // Gender별 외곽 도형에 맞는 clipPath
  const renderClipPath = () => {
    const clipId = `clip-${id}`;
    const c = S / 2;
    const m = 2;
    const r = c - m;

    if (subjectType === SubjectType.Animal) {
      return (
        <clipPath id={clipId}>
          <polygon points={`${c},${m} ${S - m},${c} ${c},${S - m} ${m},${c}`} />
        </clipPath>
      );
    }

    // 태아: 원형 클립
    if (subjectType === SubjectType.Fetus) {
      return (
        <clipPath id={clipId}>
          <circle cx={c} cy={c} r={r} />
        </clipPath>
      );
    }

    switch (gender) {
      case Gender.Male:
      case Gender.Gay:
      case Gender.Transgender_Male:
        return (
          <clipPath id={clipId}>
            <rect x={m} y={m} width={S - m * 2} height={S - m * 2} rx="2" />
          </clipPath>
        );
      case Gender.Female:
      case Gender.Lesbian:
      case Gender.Transgender_Female:
        return (
          <clipPath id={clipId}>
            <circle cx={c} cy={c} r={r} />
          </clipPath>
        );
      case Gender.Nonbinary:
        return (
          <clipPath id={clipId}>
            <path
              d={`M ${m},${S - m} V ${c} A ${r},${r} 0 0 1 ${S - m},${c} V ${S - m} Z`}
            />
          </clipPath>
        );
      default:
        return (
          <clipPath id={clipId}>
            <circle cx={c} cy={c} r={r} />
          </clipPath>
        );
    }
  };

  // Illness 상태 패턴 렌더링
  const renderIllness = () => {
    if (!illness || illness === Illness.None) return null;

    const clip = `url(#clip-${id})`;
    const hatchId = `hatch-${id}`;
    const c = S / 2;

    // 기본 블록
    const halfLeft = (
      <rect
        x={0}
        y={0}
        width={c}
        height={S}
        fill={COLORS.stroke}
        clipPath={clip}
      />
    );
    const halfBottom = (
      <rect
        x={0}
        y={c}
        width={S}
        height={c}
        fill={COLORS.stroke}
        clipPath={clip}
      />
    );
    const quarterBottomLeft = (
      <rect
        x={0}
        y={c}
        width={c}
        height={c}
        fill={COLORS.stroke}
        clipPath={clip}
      />
    );
    const threeQuarters = (
      <>
        <rect
          x={0}
          y={0}
          width={c}
          height={S}
          fill={COLORS.stroke}
          clipPath={clip}
        />
        <rect
          x={c}
          y={c}
          width={c}
          height={c}
          fill={COLORS.stroke}
          clipPath={clip}
        />
      </>
    );
    const halfBottomHatch = (
      <rect
        x={0}
        y={c}
        width={S}
        height={c}
        fill={`url(#${hatchId})`}
        clipPath={clip}
      />
    );

    const hatchDefs = (
      <defs>
        <pattern
          id={hatchId}
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
            stroke={COLORS.stroke}
            strokeWidth="1.2"
          />
        </pattern>
      </defs>
    );

    const vLine = (
      <line
        x1={c}
        y1={0}
        x2={c}
        y2={S}
        stroke={COLORS.stroke}
        strokeWidth="1.5"
        clipPath={clip}
      />
    );
    const hLine = (
      <line
        x1={0}
        y1={c}
        x2={S}
        y2={c}
        stroke={COLORS.stroke}
        strokeWidth="1.5"
        clipPath={clip}
      />
    );

    switch (illness) {
      // 왼쪽 반 채움
      case Illness.Psychological_Or_Physical_Problem:
        return halfLeft;

      // 아래쪽 반 채움
      case Illness.Alcohol_Or_Drug_Abuse:
        return halfBottom;

      // 아래쪽 반 빗금 + 가로 중앙선
      case Illness.Suspected_Alcohol_Or_Drug_Abuse:
        return (
          <>
            {hatchDefs}
            {halfBottomHatch}
            {hLine}
          </>
        );

      // 왼쪽 하단 1/4 채움 + 세로 중앙선
      case Illness.Psychological_Or_Physical_Illness_In_Remission:
        return (
          <>
            {quarterBottomLeft}
            {vLine}
          </>
        );

      // 왼쪽 반 채움 + 가로 중앙선
      case Illness.In_Recovery_From_Substance_Abuse_But_Having_Physical_Or_Mental_Problems:
        return (
          <>
            {halfLeft}
            {hLine}
          </>
        );

      // 왼쪽 하단 1/4 채움 + 가로 중앙선
      case Illness.In_Recovery_From_Substance_Abuse:
        return (
          <>
            {quarterBottomLeft}
            {hLine}
          </>
        );

      // 오른쪽 상단 1/4 제외 나머지 채움
      case Illness.Serious_Mental_Or_Physical_Problems_And_Substance_Abuse:
        return threeQuarters;

      // 왼쪽 하단 1/4 채움 + 가로 중앙선 + 세로 중앙선
      case Illness.In_Recovery_From_Substance_Abuse_And_Physical_Or_Mental_Problems:
        return (
          <>
            {quarterBottomLeft}
            {hLine}
            {vLine}
          </>
        );

      default:
        return null;
    }
  };

  const renderDeceased = () => {
    if (!isDead) return null;
    return (
      <g stroke={COLORS.deceased} strokeWidth="2" clipPath={`url(#clip-${id})`}>
        <line x1={0} y1={0} x2={S} y2={S} />
        <line x1={S} y1={0} x2={0} y2={S} />
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
        <defs>{renderClipPath()}</defs>
        {renderShape()}
        {renderIllness()}
        {renderDeceased()}
      </svg>

      {/* 중앙: 나이 숫자 */}
      {age != null && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span
            className="text-xs font-bold"
            style={{
              color: textColor,
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
          className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-medium text-fg"
          style={{
            left: S + 8,
            color: textColor,
            textShadow:
              '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 -1px 0 #fff, 0 1px 0 #fff, -1px 0 0 #fff, 1px 0 0 #fff',
          }}
        >
          {detailTexts.map((text) => (
            <div key={text}>{text}</div>
          ))}
        </div>
      )}

      {/* 아래: 이름 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-xs font-medium text-fg"
        style={{
          top: S + 4,
          textShadow:
            '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 -1px 0 #fff, 0 1px 0 #fff, -1px 0 0 #fff, 1px 0 0 #fff',
        }}
      >
        {name}
      </div>

      {/* 엣지 앵커용 핸들 — 4방향×2타입 + 중앙×2타입 (비가시·비인터랙티브) */}
      {(['top', 'right', 'bottom', 'left'] as const).map((pos) => {
        const position = {
          top: Position.Top,
          right: Position.Right,
          bottom: Position.Bottom,
          left: Position.Left,
        }[pos];
        return (
          <React.Fragment key={pos}>
            <Handle
              type="source"
              position={position}
              id={`${pos}-source`}
              isConnectable={false}
              className="!pointer-events-none !h-0 !min-h-0 !w-0 !min-w-0 !border-none !opacity-0"
            />
            <Handle
              type="target"
              position={position}
              id={`${pos}-target`}
              isConnectable={false}
              className="!pointer-events-none !h-0 !min-h-0 !w-0 !min-w-0 !border-none !opacity-0"
            />
          </React.Fragment>
        );
      })}
      {/* 중앙 핸들 — Relation/Influence/Group 직선 연결용 */}
      <Handle
        type="source"
        position={Position.Top}
        id="center-source"
        isConnectable={false}
        className="!pointer-events-none !h-0 !min-h-0 !w-0 !min-w-0 !border-none !opacity-0"
        style={{ top: '50%', left: '50%' }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="center-target"
        isConnectable={false}
        className="!pointer-events-none !h-0 !min-h-0 !w-0 !min-w-0 !border-none !opacity-0"
        style={{ top: '50%', left: '50%' }}
      />
    </div>
  );
});

PersonNode.displayName = 'PersonNode';
