/** 배경 도트 간격 (px) — ReactFlow Background gap과 동일해야 함 */
export const GRID_GAP = 30;

/** 도트 중앙 오프셋 (GRID_GAP / 2) */
export const DOT_CENTER_OFFSET = GRID_GAP / 2;

/**
 * NodeSize enum → 실제 px 매핑
 * 도트 중앙 정렬을 위해 GRID_GAP(30px) 단위 배수 사용
 */
export const NODE_SIZE_PX: Record<string, number> = {
  SMALL: 30, // 1칸
  DEFAULT: 60, // 2칸
  LARGE: 90, // 3칸
};

/** 기본 노드 크기 (sizePx 미지정 시 fallback) */
export const DEFAULT_NODE_SIZE = NODE_SIZE_PX.DEFAULT;

/** 고스트 미리보기 크기 */
export const GHOST_NODE_SIZE = NODE_SIZE_PX.DEFAULT;
