import type { LayoutState } from '../layout/layout-state';
import type { Genogram } from '../models/genogram';
import type { Subject } from '../models/person';
import type {
  Connection,
  ParentChildAttribute,
  PartnerAttribute,
} from '../models/relationship';
import { ConnectionType } from '../types/enums';

/** Subject의 size 속성에서 px 크기를 안전하게 조회 */
export const getSubjectSizePx = (
  subject: Subject | undefined,
  nodeSizePxMap: Record<string, number>
): number =>
  nodeSizePxMap[subject?.layout.style.size ?? ''] ??
  nodeSizePxMap['DEFAULT'] ??
  40;

/**
 * ParentChild 커넥션의 partnerMidpoint와 partnerSubjects를 계산합니다.
 */
export function buildPartnerMidpoint(
  conn: Connection,
  genogram: Genogram,
  layout: LayoutState,
  nodeSizePxMap: Record<string, number>
): {
  partnerMidpoint: { x: number; y: number } | null;
  partnerSubjects: { x1: number; x2: number } | null;
} {
  if (conn.entity.type !== ConnectionType.Children_Parents_Line) {
    return { partnerMidpoint: null, partnerSubjects: null };
  }

  const attr = conn.entity.attribute;
  if (!('parentRef' in attr)) {
    return { partnerMidpoint: null, partnerSubjects: null };
  }

  const pcAttr = attr as ParentChildAttribute;
  const partnerConn = genogram.connections.get(pcAttr.parentRef);
  if (!partnerConn || !('subjects' in partnerConn.entity.attribute)) {
    return { partnerMidpoint: null, partnerSubjects: null };
  }

  const pAttr = partnerConn.entity.attribute as PartnerAttribute;
  const pos1 = layout.nodes.get(pAttr.subjects[0])?.position;
  const pos2 = layout.nodes.get(pAttr.subjects[1])?.position;
  if (!pos1 || !pos2) {
    return { partnerMidpoint: null, partnerSubjects: null };
  }

  const sizePx1 = getSubjectSizePx(
    genogram.subjects.get(pAttr.subjects[0]),
    nodeSizePxMap
  );
  const sizePx2 = getSubjectSizePx(
    genogram.subjects.get(pAttr.subjects[1]),
    nodeSizePxMap
  );
  const bottomY1 = pos1.y + sizePx1 / 2;
  const bottomY2 = pos2.y + sizePx2 / 2;
  const midX = (pos1.x + pos2.x) / 2;
  const bottomY = Math.max(bottomY1, bottomY2) + 40;

  return {
    partnerMidpoint: { x: midX, y: bottomY },
    partnerSubjects: { x1: pos1.x, x2: pos2.x },
  };
}

/**
 * 쌍둥이 두 번째 자녀의 위치를 계산합니다.
 */
export function buildTwinTargetPosition(
  conn: Connection,
  genogram: Genogram,
  layout: LayoutState,
  nodeSizePxMap: Record<string, number>
): { x: number; y: number } | null {
  if (conn.entity.type !== ConnectionType.Children_Parents_Line) return null;

  const attr = conn.entity.attribute;
  if (!('childRef' in attr)) return null;

  const pcAttr = attr as ParentChildAttribute;
  if (!Array.isArray(pcAttr.childRef) || pcAttr.childRef.length !== 2)
    return null;

  const twin2Layout = layout.nodes.get(pcAttr.childRef[1]);
  if (!twin2Layout) return null;

  const twin2SizePx = getSubjectSizePx(
    genogram.subjects.get(pcAttr.childRef[1]),
    nodeSizePxMap
  );

  return {
    x: twin2Layout.position.x,
    y: twin2Layout.position.y - twin2SizePx / 2,
  };
}
