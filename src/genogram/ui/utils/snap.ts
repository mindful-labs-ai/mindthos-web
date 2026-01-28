import { DOT_CENTER_OFFSET, GRID_GAP } from '../constants/grid';

/**
 * 좌표를 배경 도트 중앙(15, 45, 75...)에 스냅
 * 공식: round((pos - offset) / gap) * gap + offset
 */
export function snapToDotCenter(pos: { x: number; y: number }) {
  return {
    x:
      Math.round((pos.x - DOT_CENTER_OFFSET) / GRID_GAP) * GRID_GAP +
      DOT_CENTER_OFFSET,
    y:
      Math.round((pos.y - DOT_CENTER_OFFSET) / GRID_GAP) * GRID_GAP +
      DOT_CENTER_OFFSET,
  };
}

/**
 * 중앙 좌표가 정확히 겹치는 노드가 있으면, 마우스 원래 위치 방향으로 1칸(GRID_GAP) 밀어줌.
 * 중앙이 겹치지 않으면 그대로 반환.
 *
 * @param snappedPos - 이미 도트 중앙에 스냅된 좌표
 * @param rawPos - 스냅 전 마우스 원래 좌표 (방향 결정용)
 * @param existingCenters - 기존 노드 중앙 좌표 배열
 */
export function avoidCenterCollision(
  snappedPos: { x: number; y: number },
  rawPos: { x: number; y: number },
  existingCenters: { x: number; y: number }[]
): { x: number; y: number } {
  const hasCollision = existingCenters.some(
    (c) => c.x === snappedPos.x && c.y === snappedPos.y
  );

  if (!hasCollision) return snappedPos;

  // 마우스 원래 위치에서 스냅 위치까지의 방향 벡터
  const dx = rawPos.x - snappedPos.x;
  const dy = rawPos.y - snappedPos.y;

  // 주축 방향으로 1칸 이동 (방향이 0이면 +x 기본)
  let offsetX = 0;
  let offsetY = 0;

  if (Math.abs(dx) >= Math.abs(dy)) {
    offsetX = dx >= 0 ? GRID_GAP : -GRID_GAP;
  } else {
    offsetY = dy >= 0 ? GRID_GAP : -GRID_GAP;
  }

  return {
    x: snappedPos.x + offsetX,
    y: snappedPos.y + offsetY,
  };
}
