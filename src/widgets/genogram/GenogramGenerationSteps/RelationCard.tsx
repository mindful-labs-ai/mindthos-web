import { useState, useCallback, useRef, useEffect } from 'react';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';

import type {
  AISubject,
  AIInfluenceStatus,
} from '@/features/genogram/utils/aiJsonConverter';
import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';
import { Modal } from '@/shared/ui/composites/Modal';

import {
  Chip,
  FlatCustomSelect as CustomSelect,
  DeleteConfirmModal,
} from './components';

// ─────────────────────────────────────────────────────────────────────────────
// 옵션 데이터
// ─────────────────────────────────────────────────────────────────────────────

// 관계 상태 옵션 (genogram Relation 타입)
const RELATION_OPTIONS = [
  { value: 'Connected', label: '친밀' },
  { value: 'Close', label: '밀착' },
  { value: 'Fused', label: '융합' },
  { value: 'Distant', label: '소원' },
  { value: 'Hostile', label: '갈등' },
  { value: 'Close_Hostile', label: '친밀-갈등' },
  { value: 'Fused_Hostile', label: '융합-갈등' },
  { value: 'Cutoff', label: '단절됨' },
  { value: 'Cutoff_Repaired', label: '단절-회복' },
];

// 영향 상태 옵션 (genogram Influence 타입)
const INFLUENCE_OPTIONS = [
  { value: 'physical_abuse', label: '신체적 학대' },
  { value: 'emotional_abuse', label: '정서적 학대' },
  { value: 'sexual_abuse', label: '성적 학대' },
  { value: 'focused_on', label: '과잉관심' },
  { value: 'focused_on_negatively', label: '부정적 과잉관심' },
];

// 통합 옵션 (flat)
const ALL_STATUS_FLAT_OPTIONS = [...RELATION_OPTIONS, ...INFLUENCE_OPTIONS];

const STATUS_LABELS: Record<string, string> = Object.fromEntries([
  ...RELATION_OPTIONS.map((o) => [o.value, o.label]),
  ...INFLUENCE_OPTIONS.map((o) => [o.value, o.label]),
]);

// Influence status인지 확인하는 헬퍼
export const isInfluenceStatus = (status: string | undefined): boolean => {
  if (!status) return false;
  return INFLUENCE_OPTIONS.some((o) => o.value === status);
};

// Relation status인지 확인하는 헬퍼
export const isRelationStatus = (status: string | undefined): boolean => {
  if (!status) return false;
  return RELATION_OPTIONS.some((o) => o.value === status);
};

// ─────────────────────────────────────────────────────────────────────────────
// 상수 (RelationshipEdge에서 복제)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_FG = '#3C3C3C';
const INFLUENCE_STROKE = '#E83131';

const SW = 3; // stroke width default
const ZIGZAG_AMP = 15;
const ZIGZAG_PERIOD = 8;
const PARALLEL_GAP = 5;
const CUTOFF_LEN = 8;
const CUTOFF_GAP = 3;
const ARROW_INSET = 20;

// ─────────────────────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────────────────────

// Genogram Relation 상태 타입
export type GenogramRelationStatus =
  | 'Connected'
  | 'Close'
  | 'Fused'
  | 'Distant'
  | 'Hostile'
  | 'Close_Hostile'
  | 'Fused_Hostile'
  | 'Cutoff'
  | 'Cutoff_Repaired';

// 통합된 관계 상태 타입 (관계 + 영향)
export type RelationStatus = GenogramRelationStatus | AIInfluenceStatus;

export interface RelationData {
  id1: number;
  id2: number;
  description: string;
  status: RelationStatus;
  /** 임시 순서 필드 - 카테고리 변경 시 순서 유지용 */
  order: number;
}

interface RelationCardProps {
  data: RelationData;
  subjectMap: Map<number, AISubject>;
  allSubjects: AISubject[];
  onUpdate: (data: RelationData) => void;
  onDelete: () => void;
  /** 외부에서 편집 상태 제어 */
  isEditing?: boolean;
  onEditChange?: (isEditing: boolean) => void;
  /** 저장 필요 경고 표시 */
  showWarning?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// 유틸 함수 (RelationshipEdge에서 복제)
// ─────────────────────────────────────────────────────────────────────────────

/** 법선 벡터 (dx,dy 방향의 왼쪽 수직) */
const getNormal = (
  dx: number,
  dy: number
): { nx: number; ny: number; len: number } => {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { nx: 0, ny: -1, len: 0 };
  return { nx: -dy / len, ny: dx / len, len };
};

/** 방향벡터 단위화 */
const getUnit = (
  dx: number,
  dy: number
): { ux: number; uy: number; len: number } => {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { ux: 1, uy: 0, len: 0 };
  return { ux: dx / len, uy: dy / len, len };
};

/** 오프셋된 직선 path (평행선) */
const offsetLine = (
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  offset: number
): string => {
  const { nx, ny } = getNormal(tx - sx, ty - sy);
  return `M ${sx + nx * offset},${sy + ny * offset} L ${tx + nx * offset},${ty + ny * offset}`;
};

/** 지그재그 polyline points 문자열 */
const buildZigzagPoints = (
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  amp: number = ZIGZAG_AMP,
  period: number = ZIGZAG_PERIOD,
  endInset: number = 0
): string => {
  const dx = tx - sx;
  const dy = ty - sy;
  const { ux, uy, len } = getUnit(dx, dy);
  const { nx, ny } = getNormal(dx, dy);
  if (len === 0) return `${sx},${sy}`;

  const effectiveLen = Math.max(0, len - endInset);
  const ex = sx + ux * effectiveLen;
  const ey = sy + uy * effectiveLen;

  const steps = Math.max(2, Math.round(effectiveLen / period));
  const pts: string[] = [`${sx},${sy}`];
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const bx = sx + ux * effectiveLen * t;
    const by = sy + uy * effectiveLen * t;
    const sign = i % 2 === 1 ? 1 : -1;
    pts.push(`${bx + nx * sign * amp},${by + ny * sign * amp}`);
  }
  pts.push(`${ex},${ey}`);
  return pts.join(' ');
};

// ─────────────────────────────────────────────────────────────────────────────
// Person Card 컴포넌트 (선택 가능)
// ─────────────────────────────────────────────────────────────────────────────

interface PersonCardProps {
  person: AISubject | undefined;
  personId: number;
  allSubjects: AISubject[];
  isEditing: boolean;
  onSelect: (id: number) => void;
}

function PersonCard({
  person,
  personId,
  allSubjects,
  isEditing,
  onSelect,
}: PersonCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
  });
  const cardRef = useRef<HTMLButtonElement & HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  // 드롭다운 위치 계산
  const updateDropdownPosition = useCallback(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, []);

  // 외부 클릭 감지 (데스크탑만)
  useEffect(() => {
    if (isMobileView) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        cardRef.current &&
        !cardRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, isMobileView]);

  const handleCardClick = () => {
    if (!isEditing) return;
    if (!isMobileView) updateDropdownPosition();
    setShowDropdown(true);
  };

  const handleSelectPerson = (id: number) => {
    onSelect(id);
    setShowDropdown(false);
  };

  const name = person?.name || `인물 ${personId}`;

  // 아바타 렌더링 (공통)
  const renderAvatar = () => (
    <div
      className={cn(
        'typo-xl flex h-16 w-16 items-center justify-center border-2 font-emphasize',
        person?.gender === 'Female' && 'rounded-full',
        person?.gender === 'Male' && 'rounded-none',
        (!person?.gender ||
          (person?.gender !== 'Male' && person?.gender !== 'Female')) &&
          'rounded-lg'
      )}
      style={{ borderColor: DEFAULT_FG }}
    >
      {person?.age ?? ''}
    </div>
  );

  // 카드 내용 렌더링 (공통)
  const renderCardContent = () =>
    person ? (
      <>
        {renderAvatar()}
        <span className="mt-2 max-w-[100px] truncate text-m font-emphasize text-grey-100">
          {name}
        </span>
      </>
    ) : (
      <Plus className="h-8 w-8 text-fg-muted" />
    );

  // 드롭다운 렌더링 (편집 모드에서만)
  const personOptions = allSubjects.map((s) => ({
    id: s.id,
    label: s.name || `인물 ${s.id}`,
  }));

  const renderDropdown = () => {
    if (isMobileView) {
      return (
        <Modal
          open={showDropdown}
          onOpenChange={setShowDropdown}
          mobileVariant="bottomSheet"
          hideCloseButton
        >
          <div className="space-y-1 pb-4">
            {personOptions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectPerson(s.id)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors',
                  s.id === personId
                    ? 'font-medium text-green-80'
                    : 'text-grey-80 lg:hover:bg-grey-10'
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-grey-20 text-xs text-grey-60">
                  {s.id}
                </span>
                {s.label}
              </button>
            ))}
          </div>
        </Modal>
      );
    }

    return (
      showDropdown &&
      createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 1100,
          }}
          className="max-h-[200px] min-w-[140px] overflow-y-auto rounded-xl bg-surface py-2 shadow-elevated"
        >
          {personOptions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelectPerson(s.id)}
              className={cn(
                'typo-sm flex w-full items-center gap-2 px-4 py-2 lg:hover:bg-surface-contrast',
                s.id === personId ? 'font-medium text-fg' : 'text-fg-muted'
              )}
            >
              <span className="typo-xs flex h-5 w-5 items-center justify-center rounded-full bg-surface-contrast">
                {s.id}
              </span>
              {s.label}
            </button>
          ))}
        </div>,
        document.body
      )
    );
  };

  // 공통 카드 스타일
  const baseCardClass =
    'relative flex h-[120px] w-[120px] flex-shrink-0 flex-col items-center justify-center rounded-2xl border bg-white';

  // 순서 배지 위치 (편집: 좌상단, 보기: 우상단)
  const badgeClass =
    'absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-surface-contrast typo-xs font-medium text-fg-muted';

  const Wrapper = isEditing ? 'button' : 'div';
  const wrapperProps = isEditing
    ? {
        type: 'button' as const,
        onClick: handleCardClick,
        className: cn(
          baseCardClass,
          'transition-colors',
          person
            ? 'border-border lg:hover:border-fg-muted'
            : 'border-dashed border-fg-muted lg:hover:border-fg'
        ),
      }
    : {
        className: cn(baseCardClass, 'border-border'),
      };

  return (
    <>
      <Wrapper ref={cardRef} {...wrapperProps}>
        {/* 순서 배지 (선택된 경우에만 표시) */}
        {personId > 0 && <div className={badgeClass}>{personId}</div>}
        {renderCardContent()}
      </Wrapper>
      {renderDropdown()}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 연결선 SVG 컴포넌트 (RelationshipEdge 렌더링 로직 복제)
// ─────────────────────────────────────────────────────────────────────────────

interface ConnectionSvgProps {
  status: RelationStatus;
  id: string;
}

function ConnectionSvg({ status, id }: ConnectionSvgProps) {
  const width = 80;
  const height = 60;
  const midY = height / 2;

  // 시작/끝 좌표
  const sx = 0;
  const sy = midY;
  const tx = width;
  const ty = midY;

  const color = DEFAULT_FG;
  const base = { stroke: color, strokeWidth: SW, fill: 'none' as const };
  const straight = `M ${sx},${sy} L ${tx},${ty}`;

  // ─────────────────────────────────────────────────────────────────────────────
  // Relation 상태 렌더링 (RelationshipEdge.renderRelationEdge 복제)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isRelationStatus(status)) {
    switch (status) {
      case 'Connected':
        return (
          <svg width={width} height={height} className="overflow-visible">
            <path d={straight} {...base} />
          </svg>
        );

      case 'Close':
        return (
          <svg width={width} height={height} className="overflow-visible">
            <path d={offsetLine(sx, sy, tx, ty, -PARALLEL_GAP)} {...base} />
            <path d={offsetLine(sx, sy, tx, ty, PARALLEL_GAP)} {...base} />
          </svg>
        );

      case 'Fused':
        return (
          <svg width={width} height={height} className="overflow-visible">
            <path d={offsetLine(sx, sy, tx, ty, -PARALLEL_GAP)} {...base} />
            <path d={straight} {...base} />
            <path d={offsetLine(sx, sy, tx, ty, PARALLEL_GAP)} {...base} />
          </svg>
        );

      case 'Distant':
        return (
          <svg width={width} height={height} className="overflow-visible">
            <path d={straight} {...base} strokeDasharray="5,5" />
          </svg>
        );

      case 'Hostile':
        return (
          <svg width={width} height={height} className="overflow-visible">
            <polyline
              points={buildZigzagPoints(sx, sy, tx, ty)}
              {...base}
              strokeLinejoin="round"
            />
          </svg>
        );

      case 'Close_Hostile':
        return (
          <svg width={width} height={height} className="overflow-visible">
            <path d={offsetLine(sx, sy, tx, ty, -PARALLEL_GAP * 2)} {...base} />
            <polyline
              points={buildZigzagPoints(sx, sy, tx, ty)}
              {...base}
              strokeLinejoin="round"
            />
            <path d={offsetLine(sx, sy, tx, ty, PARALLEL_GAP * 2)} {...base} />
          </svg>
        );

      case 'Fused_Hostile': {
        const fOff = PARALLEL_GAP * 2;
        return (
          <svg width={width} height={height} className="overflow-visible">
            <path d={offsetLine(sx, sy, tx, ty, -fOff)} {...base} />
            <path d={straight} {...base} />
            <path d={offsetLine(sx, sy, tx, ty, fOff)} {...base} />
            <polyline
              points={buildZigzagPoints(sx, sy, tx, ty)}
              {...base}
              strokeLinejoin="round"
            />
          </svg>
        );
      }

      case 'Cutoff': {
        const dx = tx - sx;
        const dy = ty - sy;
        const { nx, ny } = getNormal(dx, dy);
        const { ux, uy, len } = getUnit(dx, dy);
        const cx = sx + ux * len * 0.5;
        const cy = sy + uy * len * 0.5;
        const gapX1 = cx - ux * CUTOFF_GAP;
        const gapY1 = cy - uy * CUTOFF_GAP;
        const gapX2 = cx + ux * CUTOFF_GAP;
        const gapY2 = cy + uy * CUTOFF_GAP;
        const seg1 = `M ${sx} ${sy} L ${gapX1} ${gapY1}`;
        const seg2 = `M ${gapX2} ${gapY2} L ${tx} ${ty}`;
        return (
          <svg width={width} height={height} className="overflow-visible">
            <path d={seg1} {...base} />
            <path d={seg2} {...base} />
            <line
              x1={cx + ux * CUTOFF_GAP - nx * CUTOFF_LEN}
              y1={cy + uy * CUTOFF_GAP - ny * CUTOFF_LEN}
              x2={cx + ux * CUTOFF_GAP + nx * CUTOFF_LEN}
              y2={cy + uy * CUTOFF_GAP + ny * CUTOFF_LEN}
              stroke={color}
              strokeWidth={SW}
              strokeLinecap="round"
            />
            <line
              x1={cx - ux * CUTOFF_GAP - nx * CUTOFF_LEN}
              y1={cy - uy * CUTOFF_GAP - ny * CUTOFF_LEN}
              x2={cx - ux * CUTOFF_GAP + nx * CUTOFF_LEN}
              y2={cy - uy * CUTOFF_GAP + ny * CUTOFF_LEN}
              stroke={color}
              strokeWidth={SW}
              strokeLinecap="round"
            />
          </svg>
        );
      }

      case 'Cutoff_Repaired': {
        const dx2 = tx - sx;
        const dy2 = ty - sy;
        const { nx: nx2, ny: ny2 } = getNormal(dx2, dy2);
        const { ux: ux2, uy: uy2, len: len2 } = getUnit(dx2, dy2);
        const cx2 = sx + ux2 * len2 * 0.5;
        const cy2 = sy + uy2 * len2 * 0.5;
        const circleR = 6;
        const cutoffSpread = CUTOFF_GAP + circleR - 2;
        const gapX1r = cx2 - ux2 * cutoffSpread;
        const gapY1r = cy2 - uy2 * cutoffSpread;
        const gapX2r = cx2 + ux2 * cutoffSpread;
        const gapY2r = cy2 + uy2 * cutoffSpread;
        const seg1r = `M ${sx} ${sy} L ${gapX1r} ${gapY1r}`;
        const seg2r = `M ${gapX2r} ${gapY2r} L ${tx} ${ty}`;
        return (
          <svg width={width} height={height} className="overflow-visible">
            <path d={seg1r} {...base} />
            <path d={seg2r} {...base} />
            <line
              x1={cx2 + ux2 * cutoffSpread - nx2 * CUTOFF_LEN}
              y1={cy2 + uy2 * cutoffSpread - ny2 * CUTOFF_LEN}
              x2={cx2 + ux2 * cutoffSpread + nx2 * CUTOFF_LEN}
              y2={cy2 + uy2 * cutoffSpread + ny2 * CUTOFF_LEN}
              stroke={color}
              strokeWidth={SW}
              strokeLinecap="round"
            />
            <line
              x1={cx2 - ux2 * cutoffSpread - nx2 * CUTOFF_LEN}
              y1={cy2 - uy2 * cutoffSpread - ny2 * CUTOFF_LEN}
              x2={cx2 - ux2 * cutoffSpread + nx2 * CUTOFF_LEN}
              y2={cy2 - uy2 * cutoffSpread + ny2 * CUTOFF_LEN}
              stroke={color}
              strokeWidth={SW}
              strokeLinecap="round"
            />
            <circle
              cx={cx2}
              cy={cy2}
              r={circleR}
              stroke={color}
              strokeWidth={SW}
              fill="none"
            />
          </svg>
        );
      }

      default:
        return (
          <svg width={width} height={height} className="overflow-visible">
            <path d={straight} {...base} />
          </svg>
        );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Influence 상태 렌더링 (RelationshipEdge.renderInfluenceEdge 복제)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isInfluenceStatus(status)) {
    const infColor = INFLUENCE_STROKE;
    const infBase = {
      stroke: infColor,
      strokeWidth: SW,
      fill: 'none' as const,
    };
    const filledMarkerId = `arrow-filled-${id}`;
    const emptyMarkerId = `arrow-empty-${id}`;

    const filledMarker = (
      <marker
        id={filledMarkerId}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="24"
        markerHeight="24"
        markerUnits="userSpaceOnUse"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill={infColor} />
      </marker>
    );

    const emptyMarker = (
      <marker
        id={emptyMarkerId}
        viewBox="-1 -1 13 12"
        refX="10"
        refY="5"
        markerWidth="24"
        markerHeight="24"
        markerUnits="userSpaceOnUse"
        orient="auto-start-reverse"
      >
        <path
          d="M 0 0 L 10 5 L 0 10 z"
          fill="#ffffff"
          stroke={infColor}
          strokeWidth={SW / 2}
        />
      </marker>
    );

    switch (status) {
      case 'physical_abuse':
        return (
          <svg width={width} height={height} className="overflow-visible">
            <defs>{filledMarker}</defs>
            <polyline
              points={buildZigzagPoints(
                sx,
                sy,
                tx,
                ty,
                ZIGZAG_AMP,
                ZIGZAG_PERIOD,
                ARROW_INSET
              )}
              {...infBase}
              strokeLinejoin="round"
            />
            <path
              d={straight}
              fill="none"
              stroke={infColor}
              strokeWidth={1}
              strokeOpacity={0}
              markerEnd={`url(#${filledMarkerId})`}
            />
          </svg>
        );

      case 'emotional_abuse':
        return (
          <svg width={width} height={height} className="overflow-visible">
            <defs>{emptyMarker}</defs>
            <polyline
              points={buildZigzagPoints(
                sx,
                sy,
                tx,
                ty,
                ZIGZAG_AMP,
                ZIGZAG_PERIOD,
                ARROW_INSET
              )}
              {...infBase}
              strokeLinejoin="round"
            />
            <path
              d={straight}
              fill="none"
              stroke={infColor}
              strokeWidth={1}
              strokeOpacity={0}
              markerEnd={`url(#${emptyMarkerId})`}
            />
          </svg>
        );

      case 'sexual_abuse':
        return (
          <svg width={width} height={height} className="overflow-visible">
            <defs>{filledMarker}</defs>
            <path
              d={offsetLine(sx, sy, tx, ty, -PARALLEL_GAP * 2)}
              {...infBase}
            />
            <polyline
              points={buildZigzagPoints(
                sx,
                sy,
                tx,
                ty,
                ZIGZAG_AMP,
                ZIGZAG_PERIOD,
                ARROW_INSET
              )}
              {...infBase}
              strokeLinejoin="round"
            />
            <path
              d={offsetLine(sx, sy, tx, ty, PARALLEL_GAP * 2)}
              {...infBase}
            />
            <path
              d={straight}
              fill="none"
              stroke={infColor}
              strokeWidth={1}
              strokeOpacity={0}
              markerEnd={`url(#${filledMarkerId})`}
            />
          </svg>
        );

      case 'focused_on':
        return (
          <svg width={width} height={height} className="overflow-visible">
            <defs>{filledMarker}</defs>
            <path
              d={straight}
              {...infBase}
              markerEnd={`url(#${filledMarkerId})`}
            />
          </svg>
        );

      case 'focused_on_negatively':
        return (
          <svg width={width} height={height} className="overflow-visible">
            <defs>{filledMarker}</defs>
            <polyline
              points={buildZigzagPoints(
                sx,
                sy,
                tx,
                ty,
                ZIGZAG_AMP,
                ZIGZAG_PERIOD,
                ARROW_INSET
              )}
              {...infBase}
              strokeLinejoin="round"
            />
            <path d={straight} {...infBase} />
            <path
              d={straight}
              fill="none"
              stroke={infColor}
              strokeWidth={1}
              strokeOpacity={0}
              markerEnd={`url(#${filledMarkerId})`}
            />
          </svg>
        );

      default:
        return (
          <svg width={width} height={height} className="overflow-visible">
            <defs>{filledMarker}</defs>
            <path
              d={straight}
              {...infBase}
              markerEnd={`url(#${filledMarkerId})`}
            />
          </svg>
        );
    }
  }

  // 기본 직선 (fallback)
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={straight} {...base} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────

export function RelationCard({
  data,
  subjectMap,
  allSubjects,
  onUpdate,
  onDelete,
  isEditing: controlledIsEditing,
  onEditChange,
  showWarning = false,
}: RelationCardProps) {
  // 외부 제어 또는 내부 상태 사용
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const isEditing = controlledIsEditing ?? internalIsEditing;
  const setIsEditing = (value: boolean) => {
    if (onEditChange) {
      onEditChange(value);
    } else {
      setInternalIsEditing(value);
    }
  };
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // id=0은 선택되지 않음을 의미
  const person1 = data.id1 > 0 ? subjectMap.get(data.id1) : undefined;
  const person2 = data.id2 > 0 ? subjectMap.get(data.id2) : undefined;

  // 저장 가능 여부: 두 인물 모두 선택되어야 함
  const canSave = data.id1 > 0 && data.id2 > 0;

  const handleFieldChange = useCallback(
    <K extends keyof RelationData>(field: K, value: RelationData[K]) => {
      onUpdate({ ...data, [field]: value });
    },
    [data, onUpdate]
  );

  // 인물 선택 핸들러
  const handleSelectPerson1 = useCallback(
    (id: number) => {
      onUpdate({ ...data, id1: id });
    },
    [data, onUpdate]
  );

  const handleSelectPerson2 = useCallback(
    (id: number) => {
      onUpdate({ ...data, id2: id });
    },
    [data, onUpdate]
  );

  // 상태 라벨 (통합)
  const statusLabel = STATUS_LABELS[data.status] || '일반 관계';

  // 고유 ID 생성 (SVG marker 중복 방지)
  const connectionId = `relation-${data.id1}-${data.id2}`;

  return (
    <div
      className={cn(
        'relative flex w-full flex-col gap-4 rounded-xl border bg-white p-4 transition-colors md:h-[169px] md:flex-row md:justify-center',
        showWarning ? 'animate-shake border-2 border-danger' : 'border-border'
      )}
    >
      {/* 경고 메시지 */}
      {showWarning && (
        <div className="typo-xs absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-danger px-3 py-1 font-medium text-primary-fg">
          두 인물을 모두 선택해주세요
        </div>
      )}
      {/* 왼쪽: 관계 시각화 */}
      <div className="flex flex-1 shrink-0 items-center justify-center gap-2">
        <PersonCard
          person={person1}
          personId={data.id1}
          allSubjects={allSubjects}
          isEditing={isEditing}
          onSelect={handleSelectPerson1}
        />
        <div className="flex items-center">
          <ConnectionSvg status={data.status} id={connectionId} />
        </div>
        <PersonCard
          person={person2}
          personId={data.id2}
          allSubjects={allSubjects}
          isEditing={isEditing}
          onSelect={handleSelectPerson2}
        />
      </div>

      {/* 오른쪽: 정보 영역 */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 pl-2">
        {/* 관계 유형 */}
        <div className="flex h-8 items-center gap-3">
          <span className="typo-xs w-8 shrink-0 text-fg-muted">관계</span>
          {isEditing ? (
            <CustomSelect
              value={data.status}
              options={ALL_STATUS_FLAT_OPTIONS}
              onChange={(v) => handleFieldChange('status', v as RelationStatus)}
              className="max-w-[68px]"
            />
          ) : (
            <Chip>{statusLabel}</Chip>
          )}
        </div>

        {/* 메모 */}
        <div className="flex items-start gap-3">
          <span className="typo-xs w-8 shrink-0 pt-2 text-fg-muted">메모</span>
          {isEditing ? (
            <textarea
              value={data.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="관계에 대한 메모를 입력하세요"
              rows={2}
              className="typo-sm flex-1 resize-none rounded-md bg-primary-subtle px-2 py-2 text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-primary"
            />
          ) : (
            <span className="typo-sm min-h-[52px] flex-1 break-all rounded-md px-2 py-2 text-fg">
              {data.description || '-'}
            </span>
          )}
        </div>
      </div>

      {/* 삭제 버튼 (편집 모드에서만) */}
      {isEditing && (
        <button
          onClick={() => setShowDeleteModal(true)}
          aria-label="관계 삭제"
          className="absolute right-4 top-3 flex h-[27px] w-[27px] items-center justify-center rounded-md text-danger lg:hover:scale-105"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      {/* 편집/저장 버튼 (우측 하단 고정) */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        {isEditing ? (
          <button
            onClick={() => setIsEditing(false)}
            disabled={!canSave}
            className={cn(
              'typo-sm flex h-[27px] w-[50px] items-center justify-center rounded-md text-primary-fg',
              canSave
                ? 'lg:hover:bg-primary-600 bg-primary'
                : 'cursor-not-allowed bg-fg-muted'
            )}
          >
            저장
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            aria-label="관계 편집"
            className="p-1 text-fg-muted lg:hover:text-fg"
          >
            <Pencil className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title="관계 삭제"
        closeAriaLabel="관계 삭제 모달 닫기"
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          onDelete();
          setShowDeleteModal(false);
        }}
      />
    </div>
  );
}
